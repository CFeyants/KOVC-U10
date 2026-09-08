/* ============================================================
   Agenda-export: .ics-bestanden, Google Agenda-links en routes.
   Werkt zowel op de server (abonnement) als in de browser (download).
   ============================================================ */

const TZ = "Europe/Brussels";

/** Werkelijke UTC-verschuiving van Brussel op een bepaald ogenblik (in minuten). */
function tzOffsetMinutes(utcMillis) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(utcMillis)).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return (asUTC - utcMillis) / 60000;
}

/** Lokale Brusselse wandkloktijd -> Date in UTC. */
export function brusselsToUTC(isoDate, time) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const naive = Date.UTC(y, m - 1, d, hh, mm);
  let millis = naive;
  for (let i = 0; i < 2; i++) millis = naive - tzOffsetMinutes(millis) * 60000;
  return new Date(millis);
}

/** 20260912T093000Z */
export function toICSStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text) {
  return String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 wil regels van max 75 octetten. */
function fold(line) {
  const out = [];
  let current = line;
  while (current.length > 74) {
    out.push(current.slice(0, 74));
    current = " " + current.slice(74);
  }
  out.push(current);
  return out.join("\r\n");
}

export function eventTitle(ev) {
  if (ev.type !== "match") return `${ev.title} U10 — KOVC Sterrebeek`;
  return `${ev.home ? "⚽ Thuis" : "🚌 Uit"}: ${ev.title}`;
}

export function eventDescription(ev) {
  const lines = [];
  if (ev.type === "match") {
    lines.push(ev.competition ?? "Competitie");
    if (ev.meet) lines.push(`Verzamelen om ${ev.meet}`);
    lines.push(ev.home ? "Thuiswedstrijd" : "Uitwedstrijd");
  } else {
    lines.push("Training U10");
  }
  if (ev.note) lines.push(ev.note);
  return lines.join("\n");
}

export function eventLocation(ev) {
  if (!ev.venue) return "";
  return [ev.venue.name, ev.venue.address].filter(Boolean).join(", ");
}

/** Eén VEVENT-blok. */
function vevent(ev, stampNow) {
  const start = brusselsToUTC(ev.date, ev.start);
  const end = brusselsToUTC(ev.date, ev.end ?? ev.start);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${ev.id}@kovc-u10`,
    `DTSTAMP:${stampNow}`,
    `DTSTART:${toICSStamp(start)}`,
    `DTEND:${toICSStamp(end)}`,
    fold(`SUMMARY:${escapeICS(eventTitle(ev))}`),
    fold(`DESCRIPTION:${escapeICS(eventDescription(ev))}`),
    fold(`LOCATION:${escapeICS(eventLocation(ev))}`),
    `STATUS:${ev.cancelled ? "CANCELLED" : "CONFIRMED"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Herinnering U10 KOVC Sterrebeek",
    "END:VALARM",
    "END:VEVENT",
  ];
  return lines.join("\r\n");
}

export function buildICS(events, calendarName = "KOVC Sterrebeek U10") {
  const stampNow = toICSStamp(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KOVC Sterrebeek//U10 teamapp//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escapeICS(calendarName)}`),
    `X-WR-TIMEZONE:${TZ}`,
    ...events.map((ev) => vevent(ev, stampNow)),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Link die Google Agenda meteen met een ingevuld formulier opent. */
export function googleCalendarUrl(ev) {
  const start = toICSStamp(brusselsToUTC(ev.date, ev.start));
  const end = toICSStamp(brusselsToUTC(ev.date, ev.end ?? ev.start));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(ev),
    dates: `${start}/${end}`,
    details: eventDescription(ev),
    location: eventLocation(ev),
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Routebeschrijving; werkt op iOS en Android via de Google Maps-app of het web. */
export function directionsUrl(venue) {
  if (!venue) return null;
  const dest = [venue.name, venue.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/** Downloadt één gebeurtenis als .ics (browser). */
export function downloadICS(events, filename = "kovc-u10.ics") {
  const blob = new Blob([buildICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
