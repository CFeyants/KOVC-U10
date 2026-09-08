/* ============================================================
   Afgeleide gegevens: agenda, statistieken en beurtrollen.
   De opslag houdt enkel bewerkte zaken bij; trainingen worden
   deterministisch berekend uit de vaste uren (id = "t-2026-09-07").
   ============================================================ */

import {
  TRAINING_SLOTS, TRAINING_RANGE, SCHOOL_HOLIDAYS, CLUB, freshState,
} from "./seed";
import { parseDate, toISODate, todayISO, shiftTime } from "./format";

/** Vult ontbrekende sleutels aan zodat oude opslag blijft werken. */
export function normalizeState(raw) {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    players: Array.isArray(raw.players) && raw.players.length ? raw.players : base.players,
    matches: Array.isArray(raw.matches) && raw.matches.length ? raw.matches : base.matches,
    extraEvents: raw.extraEvents ?? [],
    trainingOverrides: raw.trainingOverrides ?? {},
    absences: raw.absences ?? {},
    selections: raw.selections ?? {},
    results: raw.results ?? {},
    carpool: raw.carpool ?? {},
    duties: raw.duties ?? {},
    posts: raw.posts ?? [],
    cheers: raw.cheers ?? {},
  };
}

function inHoliday(iso) {
  return SCHOOL_HOLIDAYS.some((h) => iso >= h.from && iso <= h.to);
}

export function holidayAt(iso) {
  return SCHOOL_HOLIDAYS.find((h) => iso >= h.from && iso <= h.to) ?? null;
}

/** Alle trainingen van het seizoen, vakanties uitgezonderd. */
export function generateTrainings(state) {
  const out = [];
  const end = parseDate(TRAINING_RANGE.to);
  const cursor = parseDate(TRAINING_RANGE.from);
  while (cursor <= end) {
    const iso = toISODate(cursor);
    const slot = TRAINING_SLOTS.find((s) => s.weekday === cursor.getDay());
    if (slot && !inHoliday(iso)) {
      const id = "t-" + iso;
      const override = state.trainingOverrides[id] ?? {};
      out.push({
        id,
        type: "training",
        date: iso,
        start: override.start ?? slot.start,
        end: override.end ?? slot.end,
        title: "Training",
        venue: override.venue ?? CLUB.home,
        cancelled: override.cancelled ?? false,
        note: override.note ?? "",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function matchToEvent(m) {
  return {
    id: m.id,
    type: "match",
    date: m.date,
    start: m.time,
    end: shiftTime(m.time, 75),
    meet: shiftTime(m.time, -(m.meetOffsetMin ?? 45)),
    title: m.home ? `KOVC Sterrebeek — ${m.opponent}` : `${m.opponent} — KOVC Sterrebeek`,
    opponent: m.opponent,
    home: m.home,
    competition: m.competition ?? CLUB.competition,
    venue: m.venue,
    cancelled: m.cancelled ?? false,
    note: m.note ?? "",
  };
}

/** Alle gebeurtenissen, chronologisch. */
export function buildEvents(state) {
  const events = [
    ...state.matches.map(matchToEvent),
    ...generateTrainings(state),
    ...state.extraEvents.map((e) => ({ cancelled: false, note: "", ...e })),
  ];
  events.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return events;
}

export function splitByToday(events, today = todayISO()) {
  return {
    upcoming: events.filter((e) => e.date >= today),
    past: events.filter((e) => e.date < today).reverse(),
  };
}

export function nextEvent(events, today = todayISO()) {
  return events.find((e) => e.date >= today && !e.cancelled) ?? null;
}

/* ---------- Afwezigheden ---------- */

export function absenceFor(state, eventId, playerId) {
  return state.absences[eventId]?.[playerId] ?? null;
}

export function absentIds(state, eventId) {
  return Object.keys(state.absences[eventId] ?? {});
}

export function presentPlayers(state, eventId) {
  const absent = new Set(absentIds(state, eventId));
  return state.players.filter((p) => !absent.has(p.id));
}

/* ---------- Selectie ---------- */

export function selectionFor(state, matchId) {
  return state.selections[matchId] ?? null;
}

/* ---------- Uitslagen ---------- */

export function resultFor(state, matchId) {
  return state.results[matchId] ?? null;
}

export function resultLabel(match, result) {
  if (!result || result.us == null || result.them == null) return null;
  const us = Number(result.us), them = Number(result.them);
  const outcome = us > them ? "win" : us < them ? "loss" : "draw";
  const score = match.home ? `${us} - ${them}` : `${them} - ${us}`;
  return { outcome, score, us, them };
}

/** Balans van alle gespeelde wedstrijden. */
export function seasonRecord(state, events) {
  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, played = 0;
  for (const ev of events) {
    if (ev.type !== "match") continue;
    const r = resultLabel(ev, state.results[ev.id]);
    if (!r) continue;
    played++;
    gf += r.us; ga += r.them;
    if (r.outcome === "win") won++;
    else if (r.outcome === "draw") drawn++;
    else lost++;
  }
  return { played, won, drawn, lost, gf, ga };
}

/* ---------- Spelersstatistieken ---------- */

export function playerStats(state, events, today = todayISO()) {
  const stats = new Map(
    state.players.map((p) => [p.id, {
      ...p, goals: 0, assists: 0, motm: 0, selected: 0,
      present: 0, total: 0, cheers: state.cheers[p.id] ?? 0,
    }])
  );

  for (const ev of events) {
    if (ev.cancelled) continue;
    const past = ev.date < today;
    const absent = new Set(absentIds(state, ev.id));
    for (const p of state.players) {
      const s = stats.get(p.id);
      if (past) {
        s.total++;
        if (!absent.has(p.id)) s.present++;
      }
    }
    if (ev.type !== "match") continue;
    const sel = state.selections[ev.id];
    if (sel) for (const id of sel) { const s = stats.get(id); if (s) s.selected++; }
    const res = state.results[ev.id];
    if (!res) continue;
    for (const g of res.goals ?? []) {
      if (g.playerId && stats.has(g.playerId)) stats.get(g.playerId).goals++;
      if (g.assistId && stats.has(g.assistId)) stats.get(g.assistId).assists++;
    }
    if (res.motm && stats.has(res.motm)) stats.get(res.motm).motm++;
  }

  return [...stats.values()].map((s) => ({
    ...s,
    presenceRate: s.total ? Math.round((s.present / s.total) * 100) : null,
    points: s.goals + s.assists,
  }));
}

/* ---------- Beurtrol (fruit & shirts wassen) ---------- */

/** Standaardbeurt op basis van de wedstrijdvolgorde; trainers kunnen die overschrijven. */
export function dutiesFor(state, matchId) {
  const stored = state.duties[matchId];
  if (stored?.fruit || stored?.wash) return { fruit: stored.fruit ?? null, wash: stored.wash ?? null, auto: false };
  const idx = state.matches.findIndex((m) => m.id === matchId);
  const players = state.players;
  if (idx < 0 || players.length === 0) return { fruit: null, wash: null, auto: true };
  const n = players.length;
  return {
    fruit: players[idx % n].id,
    wash: players[(idx + Math.floor(n / 2)) % n].id,
    auto: true,
  };
}

export function playerName(state, id) {
  return state.players.find((p) => p.id === id)?.name ?? "?";
}
