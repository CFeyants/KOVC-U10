/* Nederlandse datum- en tijdweergave (nl-BE). */

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const DAYS_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];
const MONTHS_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

/** "2026-09-12" -> Date op middernacht lokale tijd (geen UTC-verschuiving). */
export function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function weekdayName(iso, short = false) {
  const d = parseDate(iso).getDay();
  return short ? DAYS_SHORT[d] : DAYS[d];
}

export function monthName(iso, short = false) {
  const m = parseDate(iso).getMonth();
  return short ? MONTHS_SHORT[m] : MONTHS[m];
}

/** "zaterdag 12 september" */
export function formatLong(iso) {
  const d = parseDate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "za 12 sep" */
export function formatShort(iso) {
  const d = parseDate(iso);
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** "Vandaag", "Morgen", "Over 3 dagen", "Zaterdag", ... */
export function relativeDay(iso) {
  const diff = daysUntil(iso);
  if (diff === 0) return "Vandaag";
  if (diff === 1) return "Morgen";
  if (diff === 2) return "Overmorgen";
  if (diff > 2 && diff <= 6) return `Over ${diff} dagen`;
  if (diff === -1) return "Gisteren";
  if (diff < 0) return `${Math.abs(diff)} dagen geleden`;
  return `Over ${diff} dagen`;
}

export function daysUntil(iso) {
  const target = parseDate(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

/** Uur optellen/aftrekken: ("11:30", -45) -> "10:45" */
export function shiftTime(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + minutes;
  total = ((total % 1440) + 1440) % 1440;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(Math.floor(total / 60))}:${p(total % 60)}`;
}

export function pluralize(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
