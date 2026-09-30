"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Pencil } from "lucide-react";
import { Button, Card, PlayerAvatar, SectionTitle, Sheet, cx } from "./ui";
import { POSITIONS } from "@/lib/seed";

/* ============================================================
   Waar speelt wie gewoonlijk? Acht op het veld: keeper + 1-3-3-1.
   Per speler een lijstje posities, de eerste is de voorkeur.
   Iedereen kijkt mee, de trainer past aan.
   ============================================================ */

const byKey = Object.fromEntries(POSITIONS.map((p) => [p.key, p]));

export default function PositionsTab({ state, update, coach, showToast }) {
  const [focus, setFocus] = useState(null);
  const [editing, setEditing] = useState(null);

  const positions = state.positions ?? {};

  // Per positie: wie speelt er bij voorkeur, en wie kan er ook staan.
  const perPosition = useMemo(() => {
    const out = Object.fromEntries(POSITIONS.map((p) => [p.key, { main: [], also: [] }]));
    for (const player of state.players) {
      (positions[player.id] ?? []).forEach((key, i) => {
        if (!out[key]) return;
        out[key][i === 0 ? "main" : "also"].push(player);
      });
    }
    return out;
  }, [state.players, positions]);

  const sorted = useMemo(
    () => [...state.players].sort((a, b) => a.name.localeCompare(b.name, "nl")),
    [state.players]
  );

  const togglePosition = (playerId, key) => {
    update((s) => {
      const current = s.positions?.[playerId] ?? [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      return { ...s, positions: { ...(s.positions ?? {}), [playerId]: next } };
    });
  };

  const makeMain = (playerId, key) => {
    update((s) => {
      const current = s.positions?.[playerId] ?? [];
      return { ...s, positions: { ...(s.positions ?? {}), [playerId]: [key, ...current.filter((k) => k !== key)] } };
    });
    showToast("Voorkeurspositie aangepast");
  };

  const focused = focus ? perPosition[focus] : null;
  const editingPlayer = state.players.find((p) => p.id === editing) ?? null;

  return (
    <div className="space-y-4">
      <Pitch perPosition={perPosition} focus={focus} onFocus={(k) => setFocus(focus === k ? null : k)} />

      {focused ? (
        <Card className="p-4 animate-rise">
          <p className="text-xs uppercase tracking-wider text-muted">{byKey[focus].label}</p>
          <PlayerLine label="Bij voorkeur" players={focused.main} strong />
          <PlayerLine label="Kan er ook staan" players={focused.also} />
        </Card>
      ) : (
        <p className="px-1 text-center text-xs text-muted">
          Tik op een positie om te zien wie daar gewoonlijk staat.
        </p>
      )}

      <SectionTitle icon={LayoutGrid}>Per speler</SectionTitle>
      <Card className="divide-y divide-ink-700/40">
        {sorted.map((p) => {
          const keys = positions[p.id] ?? [];
          const row = (
            <>
              <PlayerAvatar name={p.name} size={34} />
              <span className="w-24 shrink-0 truncate text-sm font-semibold">{p.name}</span>
              <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                {keys.length ? keys.map((k, i) => (
                  <span
                    key={k}
                    className={cx(
                      "rounded-full px-2 py-0.5 text-[0.7rem]",
                      i === 0 ? "bg-club font-semibold text-ink-950" : "bg-ink-800 text-muted"
                    )}
                  >
                    {byKey[k]?.label ?? k}
                  </span>
                )) : <span className="text-xs text-muted">— nog niet ingevuld —</span>}
              </span>
              {coach ? <Pencil size={14} className="shrink-0 text-muted" /> : null}
            </>
          );
          return coach ? (
            <button
              key={p.id}
              onClick={() => setEditing(p.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-800/50"
            >
              {row}
            </button>
          ) : (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">{row}</div>
          );
        })}
      </Card>
      <p className="px-1 text-xs text-muted">
        De gele positie is de voorkeur. {coach ? "Tik op een speler om aan te passen." : "De trainer houdt dit bij."}
      </p>

      <Sheet
        open={Boolean(editingPlayer)}
        onClose={() => setEditing(null)}
        title={editingPlayer ? `Posities van ${editingPlayer.name}` : ""}
        subtitle="Tik om aan of uit te zetten. De eerste is de voorkeur."
        footer={<Button variant="primary" className="w-full" onClick={() => setEditing(null)}>Klaar</Button>}
      >
        {editingPlayer ? (
          <PositionEditor
            keys={positions[editingPlayer.id] ?? []}
            onToggle={(k) => togglePosition(editingPlayer.id, k)}
            onMain={(k) => makeMain(editingPlayer.id, k)}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

/* ---------- Het veld ---------- */

function Pitch({ perPosition, focus, onFocus }) {
  return (
    <Card className="overflow-hidden p-2">
      <div
        className="relative mx-auto aspect-[3/4] w-full rounded-2xl"
        style={{
          background:
            "repeating-linear-gradient(180deg, #1c4a33 0 12.5%, #1a4430 12.5% 25%)",
        }}
      >
        {/* Lijnen */}
        <div className="pointer-events-none absolute inset-2 rounded-lg border border-white/25" />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 border-t border-white/25" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-[14%] w-[44%] -translate-x-1/2 border border-b-0 border-white/25" />
        <div className="pointer-events-none absolute top-2 left-1/2 h-[14%] w-[44%] -translate-x-1/2 border border-t-0 border-white/25" />

        {POSITIONS.map((pos) => {
          const { main, also } = perPosition[pos.key];
          const active = focus === pos.key;
          return (
            <button
              key={pos.key}
              onClick={() => onFocus(pos.key)}
              className="absolute flex w-[30%] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              aria-label={pos.label}
            >
              <span
                className={cx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-lg transition-transform",
                  active ? "scale-110 bg-cream text-ink-950" : "bg-club text-ink-950"
                )}
              >
                {pos.short}
              </span>
              <span className="mt-1 max-w-full rounded-md bg-ink-950/60 px-1.5 py-0.5 text-center text-[0.68rem] leading-tight">
                {main.length ? (
                  <span className="block truncate font-semibold">{main.map((p) => p.name).join(", ")}</span>
                ) : null}
                {also.length ? (
                  <span className="block truncate text-muted">{also.map((p) => p.name).join(", ")}</span>
                ) : null}
                {!main.length && !also.length ? <span className="text-muted">—</span> : null}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function PlayerLine({ label, players, strong }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs text-muted">{label}</p>
      {players.length ? (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-ink-800/70 py-1 pl-1 pr-3">
              <PlayerAvatar name={p.name} size={24} />
              <span className={cx("text-sm", strong && "font-semibold")}>{p.name}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Niemand.</p>
      )}
    </div>
  );
}

/* ---------- Trainer past posities aan ---------- */

function PositionEditor({ keys, onToggle, onMain }) {
  return (
    <div className="space-y-2">
      {POSITIONS.map((pos) => {
        const index = keys.indexOf(pos.key);
        const on = index >= 0;
        return (
          <div
            key={pos.key}
            className={cx(
              "flex items-center gap-3 rounded-2xl border p-2 transition-colors",
              on ? "border-club/60 bg-club/10" : "border-ink-700/60 bg-ink-800/40"
            )}
          >
            <button onClick={() => onToggle(pos.key)} className="flex flex-1 items-center gap-3 text-left">
              <span
                className={cx(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  on ? "bg-club text-ink-950" : "bg-ink-700 text-muted"
                )}
              >
                {pos.short}
              </span>
              <span className={cx("text-sm", on ? "font-semibold" : "text-muted")}>{pos.label}</span>
            </button>
            {index === 0 ? (
              <span className="px-2 text-xs font-semibold text-club">voorkeur</span>
            ) : on ? (
              <Button variant="ghost" size="sm" onClick={() => onMain(pos.key)}>
                Voorkeur maken
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
