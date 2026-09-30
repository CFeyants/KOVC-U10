"use client";

import { useMemo } from "react";
import { Goal, Handshake, Timer, ShieldCheck } from "lucide-react";
import { Sheet, Card, PlayerAvatar, SectionTitle, Badge } from "./ui";
import { formatShort } from "@/lib/format";
import { resultLabel } from "@/lib/model";

/* ============================================================
   Het seizoen van één speler: cijfers, doelpunten en afwezigheden.
   ============================================================ */

export default function PlayerSheet({ playerId, state, stats, events, open, onClose }) {
  const player = stats.find((p) => p.id === playerId);

  const timeline = useMemo(() => {
    if (!playerId) return [];
    const rows = [];
    for (const ev of events) {
      if (ev.type !== "match") continue;
      const result = state.results[ev.id];
      const quarters = state.playtime[ev.id]?.[playerId]?.length ?? 0;
      const goals = (result?.goals ?? []).filter((g) => g.playerId === playerId).length;
      const assists = (result?.goals ?? []).filter((g) => g.assistId === playerId).length;
      if (!goals && !assists && !quarters) continue;
      rows.push({ ev, goals, assists, quarters, score: resultLabel(ev, result) });
    }
    return rows.reverse();
  }, [playerId, events, state.results, state.playtime]);

  const missed = useMemo(() => {
    if (!playerId) return [];
    return events
      .filter((ev) => state.absences[ev.id]?.[playerId])
      .map((ev) => ({ ev, reason: state.absences[ev.id][playerId].reason }))
      .reverse()
      .slice(0, 12);
  }, [playerId, events, state.absences]);

  if (!player) return null;

  return (
    <Sheet open={open} onClose={onClose} title={player.name} subtitle="Seizoen 2026-2027">
      <Card className="flex items-center gap-4 p-4">
        <div className="relative">
          <PlayerAvatar name={player.name} size={56} />
          {player.shirt ? (
            <span className="absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-club px-1 text-xs font-bold text-ink-950">
              {player.shirt}
            </span>
          ) : null}
        </div>
        <div className="grid flex-1 grid-cols-4 gap-2 text-center">
          <Metric icon={Goal} value={player.goals} label="goals" />
          <Metric icon={Handshake} value={player.assists} label="assists" />
          <Metric icon={Timer} value={player.quarters} label="kwarten" />
          <Metric icon={ShieldCheck} value={player.presenceRate != null ? `${player.presenceRate}%` : "—"} label="present" />
        </div>
      </Card>

      <Card className="mt-3 flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-semibold">Pluimen van de ouders</p>
          <p className="text-xs text-muted">Elke ouder mag er één per dag geven.</p>
        </div>
        <p className="text-2xl font-bold text-club">👏 {player.cheers}</p>
      </Card>

      <SectionTitle icon={Goal}>Momenten</SectionTitle>
      {timeline.length ? (
        <Card className="divide-y divide-ink-700/40">
          {timeline.map(({ ev, goals, assists, quarters, score }) => (
            <div key={ev.id} className="flex items-center gap-3 p-3">
              <span className="w-16 shrink-0 text-xs text-muted">{formatShort(ev.date)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{ev.opponent}</p>
                <p className="flex flex-wrap gap-x-2 text-xs text-muted">
                  {goals ? <span>⚽ {goals}</span> : null}
                  {assists ? <span>🅰️ {assists}</span> : null}
                  {quarters ? <span>⏱ {quarters}/4 kwarten</span> : null}
                </p>
              </div>
              {score ? (
                <Badge tone={score.outcome === "win" ? "win" : score.outcome === "draw" ? "draw" : "loss"}>
                  {score.score}
                </Badge>
              ) : null}
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-4 text-sm text-muted">
          Nog geen doelpunten of speeltijd dit seizoen — dat komt nog.
        </Card>
      )}

      {missed.length ? (
        <>
          <SectionTitle>Afgemeld</SectionTitle>
          <Card className="divide-y divide-ink-700/40">
            {missed.map(({ ev, reason }) => (
              <div key={ev.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-16 shrink-0 text-xs text-muted">{formatShort(ev.date)}</span>
                <span className="flex-1 truncate">
                  {ev.type === "match" ? ev.opponent : "Training"}
                </span>
                {reason ? <span className="text-xs text-muted">{reason}</span> : null}
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </Sheet>
  );
}

function Metric({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl bg-ink-800/50 py-2">
      <Icon size={13} className="mx-auto text-club" />
      <p className="mt-0.5 text-lg font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-0.5 text-[0.6rem] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
