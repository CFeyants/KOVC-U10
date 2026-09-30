/* ============================================================
   Startgegevens voor de U10 van KOVC Sterrebeek.
   Wordt één keer gebruikt om de gedeelde opslag te vullen; daarna
   beheren de trainers alles vanuit de app zelf.
   ============================================================ */

export const CLUB = {
  name: "KOVC Sterrebeek",
  team: "U10",
  season: "2026-2027",
  competition: "Gewestelijk U10 AS",
  home: { name: "Het Zeen", address: "Zeenstraat 78, 1933 Sterrebeek" },
  site: "https://www.kovcsterrebeek.be/",
  fixtures: "https://www.foot24.be/fr/clubs/kovc-sterrebeek/u10-2213",
};

/** Vaste trainingsuren. 1 = maandag, 3 = woensdag. */
export const TRAINING_SLOTS = [
  { weekday: 1, start: "17:00", end: "18:30" },
  { weekday: 3, start: "15:30", end: "17:00" },
];

export const TRAINING_RANGE = { from: "2026-08-24", to: "2027-05-31" };

/** Schoolvakanties: geen training. Trainers kunnen losse data toevoegen. */
export const SCHOOL_HOLIDAYS = [
  { from: "2026-11-02", to: "2026-11-08", label: "Herfstvakantie" },
  { from: "2026-12-21", to: "2027-01-03", label: "Kerstvakantie" },
  { from: "2027-02-08", to: "2027-02-14", label: "Krokusvakantie" },
  { from: "2027-03-29", to: "2027-04-11", label: "Paasvakantie" },
];

export const SEED_PLAYERS = [
  "Boris", "Bastien", "Mats", "Lewis", "Elisa", "Theo", "Nico",
  "Alexandre", "Conall", "Loïc", "Basile", "Raphael", "Alexander",
].map((name, i) => ({ id: "p" + (i + 1), name, shirt: null }));

/** Posities bij 8 tegen 8 (keeper + 1-3-3-1), van voor naar achter. x/y in % van het veld. */
export const POSITIONS = [
  { key: "SP", label: "Spits", short: "SP", x: 50, y: 14 },
  { key: "LM", label: "Links midden", short: "LM", x: 18, y: 40 },
  { key: "CM", label: "Centraal midden", short: "CM", x: 50, y: 44 },
  { key: "RM", label: "Rechts midden", short: "RM", x: 82, y: 40 },
  { key: "LA", label: "Links achter", short: "LA", x: 20, y: 68 },
  { key: "CA", label: "Centraal achter", short: "CA", x: 50, y: 72 },
  { key: "RA", label: "Rechts achter", short: "RA", x: 80, y: 68 },
  { key: "GK", label: "Keeper", short: "K", x: 50, y: 90 },
];

/** Gewoonlijke posities (eerste = voorkeur). Een voorstel — de trainer past aan in de app. */
const SEED_POSITIONS_BY_NAME = {
  Boris: ["LM", "CM"],
  Theo: ["CM", "RM"],
  Elisa: ["CA", "LA"],
  Bastien: ["GK", "CA"],
  Mats: ["SP", "RM"],
  Lewis: ["RA", "CA"],
  Nico: ["LA", "LM"],
  Alexandre: ["SP", "CM"],
  Conall: ["CA", "RA"],
  "Loïc": ["RM", "SP"],
  Basile: ["GK", "LA"],
  Raphael: ["CM", "CA"],
  Alexander: ["LM", "SP"],
};

export const SEED_POSITIONS = Object.fromEntries(
  SEED_PLAYERS.map((p) => [p.id, SEED_POSITIONS_BY_NAME[p.name] ?? []])
);

const ZEEN = { name: "Het Zeen", address: "Zeenstraat 78, 1933 Sterrebeek" };

/** Kalender 2026-2027 — overgenomen van foot24.be (Gewestelijk U10 AS). */
export const SEED_MATCHES = [
  { date: "2026-09-05", time: "09:00", opponent: "Koninklijke FFF Haren", home: false,
    venue: { name: "Terrein FFF Haren", address: "Haren, Brussel" } },
  { date: "2026-09-12", time: "11:30", opponent: "Brussels EFC", home: true, venue: ZEEN },
  { date: "2026-09-19", time: "10:30", opponent: "FC Strombeek 1932", home: false,
    venue: { name: "FC Strombeek", address: "Singel 65, 1853 Strombeek-Bever" } },
  { date: "2026-09-26", time: "11:30", opponent: "VCM Ukkel", home: true, venue: ZEEN },
  { date: "2026-10-03", time: "10:00", opponent: "KCS Machelen", home: false,
    venue: { name: "Bosveld", address: "Heirbaan 9, 1830 Machelen" } },
  { date: "2026-10-10", time: "11:30", opponent: "Daring C Wezembeek-Oppem", home: true, venue: ZEEN },
  { date: "2026-10-18", time: "09:30", opponent: "KFC Meise", home: false,
    venue: { name: "De Nekker", address: "Sint-Annastraat 29, 1860 Meise" } },
  { date: "2026-10-24", time: "11:30", opponent: "Koninklijke FFF Haren", home: true, venue: ZEEN },
  { date: "2026-11-01", time: "09:00", opponent: "Brussels EFC", home: false,
    venue: { name: "Cmp. VUB - Elsene (ingang 8)", address: "Triomflaan 26, 1050 Elsene" } },
  { date: "2026-11-07", time: "11:30", opponent: "FC Strombeek 1932", home: true, venue: ZEEN },
  { date: "2026-11-14", time: "09:30", opponent: "VCM Ukkel", home: false,
    venue: { name: "Sp. A. Deridder", address: "Krieksbeekstraat 26, 1180 Ukkel" } },
  { date: "2026-11-21", time: "11:30", opponent: "KCS Machelen", home: true, venue: ZEEN },
  { date: "2026-11-28", time: "11:00", opponent: "Daring C Wezembeek-Oppem", home: false,
    venue: { name: "Gemeentelijk stadion", address: "Sportpleinstraat 20, 1970 Wezembeek-Oppem" } },
  { date: "2026-12-05", time: "11:30", opponent: "KFC Meise", home: true, venue: ZEEN },
].map((m, i) => ({
  id: "m" + (i + 1),
  type: "match",
  competition: CLUB.competition,
  meetOffsetMin: 45,
  cancelled: false,
  ...m,
}));

export function freshState() {
  return {
    version: 1,
    players: SEED_PLAYERS,
    matches: SEED_MATCHES,
    extraEvents: [],
    trainingOverrides: {},
    absences: {},
    selections: {},
    results: {},
    carpool: {},
    duties: {},
    playtime: {},
    positions: SEED_POSITIONS,
    posts: [],
    cheers: {},
  };
}
