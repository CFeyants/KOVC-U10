"use client";

import { useMemo, useState } from "react";
import { Goal, Handshake, Star, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import { Card, PlayerAvatar, EmptyState, cx } from "./ui";
import { seasonRecord } from "@/lib/model";

/* ============================================================
   Het klassement van de ploeg. Bewust met veel ranglijsten:
   niet alleen de topschutter verdient een plek, ook wie er
   altijd staat en wie de meeste pluimen krijgt.
   ============================================================ */

const BOARDS = [
  { key: "goals", label: "Doelpunten", icon: Goal, unit: "goals", empty: "Nog geen doelpunt gescoord." },
  { key: "assists", label: "Assists", icon: Handshake, unit: "assists", empty: "Nog geen assist gegeven." },
  { key: "motm", label: "Speler van de match", icon: Star, unit: "×", empty: "Nog niemand verkozen." },
  { key: "presenceRate", label: "Altijd present", icon: ShieldCheck, unit: "%", empty: "Nog niets gespeeld." },
  { key: "cheers", label: "Pluimen", icon: Sparkles, unit: "👏", empty: "Geef de eerste pluim bij Ploeg." },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function StatsTab({ state, stats, events }) {
  const [board, setBoard] = useState("goals");
  const record = useMemo(() => seasonRecord(state, events), [state, events]);
  const active = BOARDS.find((b) => b.key === board);

  const ranking = useMemo(() => {
    const rows = stats
      .map((p) => ({ ...p, value: p[board] ?? 0 }))
      .filter((p) => p.value != null);
    rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "nl"));
    return rows;
  }, [stats, board]);

  const hasValues = ranking.some((r) => r.value > 0);
  const top = ranking[0];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">
          Seizoen 2026-2027
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <Stat label="Gespeeld" value={record.played} />
          <Stat label="Gewonnen" value={record.won} tone="win" />
          <Stat label="Gelijk" value={record.drawn} tone="draw" />
          <Stat label="Verloren" value={record.lost} tone="loss" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-ink-700/50 pt-3 text-sm text-muted">
          <span className="text-cream font-semibold">{record.gf}</span> gemaakt
          <span className="text-ink-600">·</span>
          <span className="text-cream font-semibold">{record.ga}</span> tegen
          {record.played ? (
            <>
              <span className="text-ink-600">·</span>
              <span>{(record.gf / record.played).toFixed(1)} per match</span>
            </>
          ) : null}
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto no-bar pb-0.5">
        {BOARDS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBoard(b.key)}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 h-9 text-sm transition-all",
              board === b.key
                ? "bg-club text-ink-950 border-club font-semibold"
                : "bg-ink-800/60 text-muted border-ink-700/70 hover:text-cream"
            )}
          >
            <b.icon size={14} />
            {b.label}
          </button>
        ))}
      </div>

      {hasValues ? (
        <>
          {top?.value > 0 ? (
            <Card className="flex items-center gap-4 overflow-hidden p-4">
              <div className="relative">
                <PlayerAvatar name={top.name} size={58} />
                <span className="absolute -bottom-1 -right-1 text-xl">{MEDALS[0]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider text-muted">{active.label}</p>
                <p className="truncate text-xl font-bold">{top.name}</p>
              </div>
              <p className="text-3xl font-bold text-club">
                {top.value}
                <span className="ml-0.5 text-sm font-normal text-muted">
                  {active.unit === "%" ? "%" : ""}
                </span>
              </p>
            </Card>
          ) : null}

          <Card className="divide-y divide-ink-700/40">
            {ranking.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-6 text-center text-sm text-muted">
                  {i < 3 && p.value > 0 ? MEDALS[i] : i + 1}
                </span>
                <PlayerAvatar name={p.name} size={32} dimmed={p.value === 0} />
                <span className={cx("flex-1 truncate text-sm", p.value === 0 && "text-muted")}>
                  {p.name}
                </span>
                <span className={cx("font-semibold tabular-nums", p.value > 0 ? "text-cream" : "text-muted")}>
                  {p.value}{active.unit === "%" ? "%" : ""}
                </span>
              </div>
            ))}
          </Card>
        </>
      ) : (
        <EmptyState icon={Trophy} title="Nog niets te ranken">
          {active.empty}
        </EmptyState>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const tones = { neutral: "text-cream", win: "text-win", draw: "text-draw", loss: "text-loss" };
  return (
    <div className="rounded-2xl bg-ink-800/50 py-2.5">
      <p className={cx("text-2xl font-bold tabular-nums", tones[tone])}>{value}</p>
      <p className="mt-0.5 text-[0.68rem] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
