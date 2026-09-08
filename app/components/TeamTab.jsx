"use client";

import { useMemo, useState } from "react";
import { UserPlus, Trash2, Check, Star, Goal, Handshake, Users, Pencil } from "lucide-react";
import {
  Button, Card, PlayerAvatar, SectionTitle, Sheet, inputClass, cx,
} from "./ui";
import { useLocalPref } from "@/lib/useClub";

/* ============================================================
   De ploeg: wie speelt er, hoe doen ze het, en welk kind is van
   jou. Ouders duiden hun eigen speler(s) aan; daarna staan de
   afmeldknoppen overal meteen klaar.
   ============================================================ */

function uid() {
  return "p" + Math.random().toString(36).slice(2, 8);
}

export default function TeamTab({
  state, stats, update, coach, myPlayers, setMyPlayers, showToast, onOpenPlayer,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [cheered, setCheered] = useLocalPref("kovc-u10-cheered", {});

  const sorted = useMemo(
    () => [...stats].sort((a, b) => a.name.localeCompare(b.name, "nl")),
    [stats]
  );

  const givePluim = (playerId) => {
    const day = new Date().toISOString().slice(0, 10);
    if (cheered[playerId] === day) {
      showToast("Vandaag al een pluim gegeven 😊");
      return;
    }
    setCheered({ ...cheered, [playerId]: day });
    update((s) => ({ ...s, cheers: { ...s.cheers, [playerId]: (s.cheers[playerId] ?? 0) + 1 } }));
    showToast("Pluim gegeven! 👏");
  };

  const addPlayer = (name) => {
    update((s) => ({ ...s, players: [...s.players, { id: uid(), name: name.trim(), shirt: null }] }));
    showToast(`${name} staat erbij`);
  };

  const savePlayer = (player) => {
    update((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === player.id ? { ...p, ...player } : p)),
    }));
    setEditing(null);
  };

  const removePlayer = (playerId) => {
    update((s) => ({ ...s, players: s.players.filter((p) => p.id !== playerId) }));
    setMyPlayers(myPlayers.filter((id) => id !== playerId));
    setEditing(null);
    showToast("Speler verwijderd");
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-800 text-club">
          <Users size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {myPlayers.length
              ? `Jouw speler${myPlayers.length > 1 ? "s" : ""}: ${myPlayers
                  .map((id) => state.players.find((p) => p.id === id)?.name)
                  .filter(Boolean)
                  .join(", ")}`
              : "Wie is jouw speler?"}
          </p>
          <p className="truncate text-xs text-muted">Afmelden gaat dan met één tik.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPickerOpen(true)}>
          {myPlayers.length ? "Wijzigen" : "Kiezen"}
        </Button>
      </Card>

      <SectionTitle icon={Users} action={
        coach ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing({ id: null, name: "", shirt: "" })}>
            <UserPlus size={14} /> Speler
          </Button>
        ) : null
      }>
        {state.players.length} spelers
      </SectionTitle>

      <div className="space-y-2">
        {sorted.map((p, i) => (
          <Card
            key={p.id}
            className="flex items-center gap-3 p-3"
            style={{ animation: `rise 0.3s cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 10) * 0.02}s both` }}
          >
            <button onClick={() => onOpenPlayer(p.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="relative shrink-0">
                <PlayerAvatar name={p.name} size={44} />
                {p.shirt ? (
                  <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-club px-1 text-[0.65rem] font-bold text-ink-950">
                    {p.shirt}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {p.name}
                  {myPlayers.includes(p.id) ? <span className="text-xs text-club">· jouw speler</span> : null}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1"><Goal size={12} /> {p.goals}</span>
                  <span className="inline-flex items-center gap-1"><Handshake size={12} /> {p.assists}</span>
                  {p.motm ? <span className="inline-flex items-center gap-1 text-club"><Star size={12} /> {p.motm}</span> : null}
                  {p.presenceRate != null ? <span>{p.presenceRate}% aanwezig</span> : null}
                </p>
              </div>
            </button>

            <button
              onClick={() => givePluim(p.id)}
              className={cx(
                "flex h-11 shrink-0 flex-col items-center justify-center rounded-xl px-2.5 transition-colors",
                "bg-ink-800/60 hover:bg-ink-700/70"
              )}
              aria-label={`Pluim geven aan ${p.name}`}
            >
              <span className="text-base leading-none">👏</span>
              <span className="mt-0.5 text-[0.65rem] text-muted">{p.cheers}</span>
            </button>

            {coach ? (
              <Button
                variant="ghost" size="icon"
                onClick={() => setEditing({ id: p.id, name: p.name, shirt: p.shirt ?? "" })}
                aria-label={`${p.name} bewerken`}
              >
                <Pencil size={15} />
              </Button>
            ) : null}
          </Card>
        ))}
      </div>

      <PlayerPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        players={state.players}
        selected={myPlayers}
        onToggle={(id) =>
          setMyPlayers(myPlayers.includes(id) ? myPlayers.filter((x) => x !== id) : [...myPlayers, id])
        }
      />

      <PlayerEditor
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(player) => (player.id ? savePlayer(player) : addPlayer(player.name))}
        onRemove={removePlayer}
      />
    </div>
  );
}

/* ---------- Ouder kiest zijn eigen speler(s) ---------- */

export function PlayerPicker({ open, onClose, players, selected, onToggle }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Wie is jouw speler?"
      subtitle="Meerdere mag ook — broers, zussen of een vriendje."
      footer={<Button variant="primary" className="w-full" onClick={onClose}>Klaar</Button>}
    >
      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => {
          const active = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={cx(
                "relative flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-all",
                active ? "border-club bg-club/12" : "border-ink-700/60 bg-ink-800/40"
              )}
            >
              {active ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-club text-ink-950">
                  <Check size={11} strokeWidth={3} />
                </span>
              ) : null}
              <PlayerAvatar name={p.name} size={40} />
              <span className={cx("max-w-full truncate text-xs", active ? "text-club font-semibold" : "text-muted")}>
                {p.name}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ---------- Trainer bewerkt de ploeglijst ---------- */

function PlayerEditor({ editing, onClose, onSave, onRemove }) {
  const [name, setName] = useState("");
  const [shirt, setShirt] = useState("");
  const [ready, setReady] = useState(null);

  // Velden vullen zodra er een andere speler geopend wordt.
  if (editing && ready !== (editing.id ?? "new")) {
    setReady(editing.id ?? "new");
    setName(editing.name ?? "");
    setShirt(editing.shirt ?? "");
  }
  if (!editing && ready !== null) setReady(null);

  return (
    <Sheet
      open={Boolean(editing)}
      onClose={onClose}
      title={editing?.id ? "Speler bewerken" : "Speler toevoegen"}
      footer={
        <div className="flex gap-2">
          {editing?.id ? (
            <Button variant="danger" onClick={() => onRemove(editing.id)}>
              <Trash2 size={16} />
            </Button>
          ) : null}
          <Button
            variant="primary"
            className="flex-1"
            disabled={!name.trim()}
            onClick={() => onSave({ id: editing?.id ?? null, name: name.trim(), shirt: shirt.trim() || null })}
          >
            Bewaren
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <input
          className={inputClass}
          placeholder="Voornaam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <input
          className={inputClass}
          placeholder="Rugnummer (optioneel)"
          inputMode="numeric"
          value={shirt}
          onChange={(e) => setShirt(e.target.value)}
        />
      </div>
    </Sheet>
  );
}
