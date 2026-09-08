/* ============================================================
   Weersvoorspelling voor de matchdag — Open-Meteo, geen sleutel
   nodig. Handig om te weten of de reservetrui mee moet.
   ============================================================ */

const STERREBEEK = { lat: 50.8722, lon: 4.5203 };

/** WMO-weercodes vertaald naar iets dat een ouder om 8u begrijpt. */
const CODES = [
  { max: 0, icon: "☀️", label: "Zonnig" },
  { max: 2, icon: "🌤️", label: "Halfbewolkt" },
  { max: 3, icon: "☁️", label: "Bewolkt" },
  { max: 48, icon: "🌫️", label: "Mist" },
  { max: 57, icon: "🌦️", label: "Motregen" },
  { max: 67, icon: "🌧️", label: "Regen" },
  { max: 77, icon: "🌨️", label: "Sneeuw" },
  { max: 82, icon: "🌧️", label: "Buien" },
  { max: 86, icon: "🌨️", label: "Sneeuwbuien" },
  { max: 99, icon: "⛈️", label: "Onweer" },
];

function describe(code) {
  return CODES.find((c) => code <= c.max) ?? { icon: "🌡️", label: "Wisselvallig" };
}

/**
 * Voorspelling voor één dag. Geeft null terug als de datum te ver weg is
 * of als de dienst niet antwoordt — het weer mag de app nooit blokkeren.
 */
export async function fetchForecast(isoDate, signal) {
  const params = new URLSearchParams({
    latitude: String(STERREBEEK.lat),
    longitude: String(STERREBEEK.lon),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Europe/Brussels",
    start_date: isoDate,
    end_date: isoDate,
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    const d = data.daily;
    if (!d?.time?.length) return null;
    const { icon, label } = describe(d.weather_code[0]);
    return {
      icon,
      label,
      tempMax: Math.round(d.temperature_2m_max[0]),
      tempMin: Math.round(d.temperature_2m_min[0]),
      rain: d.precipitation_probability_max[0],
    };
  } catch {
    return null;
  }
}

export function forecastSummary(forecast) {
  if (!forecast) return null;
  const parts = [`${forecast.icon} ${forecast.label}`, `${forecast.tempMin}° / ${forecast.tempMax}°`];
  if (forecast.rain != null && forecast.rain >= 30) parts.push(`${forecast.rain}% kans op regen`);
  return parts.join(" · ");
}
