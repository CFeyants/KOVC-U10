"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin, Clock, Users, Trophy, Apple, Shirt, Car, Share2, Plus, Trash2,
  Star, CircleSlash, Undo2, ClipboardList, MessageCircle,
} from "lucide-react";
import {
  Button, Card, PlayerAvatar, Sheet, SectionTitle, Badge, inputClass, cx,
} from "./ui";
import { AddToCalendarSheet } from "./AddToCalendar";
import { directionsUrl } from "@/lib/calendar";
import { formatLong, relativeDay, todayISO } from "@/lib/format";
import { absentIds, dutiesFor, playerName, resultLabel } from "@/lib/model";

/* ============================================================
   Alles over één wedstrijd of training, op één scherm:
   aanwezigheid, selectie, carpool, beurtrol en de uitslag.
   Ouders zien alles, trainers kunnen alles aanpassen.
   ============================================================ */

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function EventSheet({
  event, state, update, coach, myPlayers, open, onClose, showToast, celebrate,
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (!event) return null;

  const isMatch = event.type === "match";
  const absent = absentIds(state, event.id);
  const absentSet = new Set(absent);
  const presentCount = state.players.length - absent.length;

  // Na de match staat de uitslag bovenaan; ervoor is aanwezigheid belangrijker.
  const played = isMatch && (event.date < todayISO() || Boolean(state.results[event.id]?.goals?.length));

  /* ---------- Aanwezigheid ---------- */

  const setAbsence = (playerId, isAbsent, reason = "") => {
    update((s) => {
      const forEvent = { ...(s.absences[event.id] ?? {}) };
      if (isAbsent) forEvent[playerId] = { ts: Date.now(), reason };
      else delete forEvent[playerId];
      const absences = { ...s.absences };
      if (Object.keys(forEvent).length) absences[event.id] = forEvent;
      else delete absences[event.id];
      // Wie afwezig is, staat niet meer in de selectie.
      const selections = { ...s.selections };
      if (isAbsent && selections[event.id]) {
        selections[event.id] = selections[event.id].filter((id) => id !== playerId);
      }
      return { ...s, absences, selections };
    });
  };

  /* ---------- Selectie ---------- */

  const selection = state.selections[event.id] ?? null;
  const toggleSelection = (playerId) => {
    update((s) => {
      const current = s.selections[event.id] ?? [];
      const next = current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];
      return { ...s, selections: { ...s.selections, [event.id]: next } };
    });
  };
  const selectAllAvailable = () => {
    update((s) => ({
      ...s,
      selections: {
        ...s.selections,
        [event.id]: s.players.filter((p) => !absentSet.has(p.id)).map((p) => p.id),
      },
    }));
    showToast("Iedereen die er is, is geselecteerd");
  };

  const shareSelection = async () => {
    const names = (selection ?? []).map((id) => "• " + playerName(state, id)).join("\n");
    const text = [
      `⚽ ${event.title}`,
      `${formatLong(event.date)} om ${event.start}${event.meet ? ` (verzamelen ${event.meet})` : ""}`,
      event.venue ? `📍 ${event.venue.name}, ${event.venue.address}` : "",
      "",
      `Selectie (${selection?.length ?? 0}):`,
      names || "— nog niet gekozen —",
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        showToast("Selectie gekopieerd");
      }
    } catch { /* gebruiker heeft geannuleerd */ }
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={isMatch ? `${event.home ? "Thuis tegen" : "Uit bij"} ${event.opponent}` : "Training"}
        subtitle={`${formatLong(event.date)} · ${relativeDay(event.date)}`}
      >
        {event.cancelled ? (
          <Card className="mb-4 border-loss/40 bg-loss/10 p-3 text-sm">
            <strong className="text-loss">Afgelast.</strong>{" "}
            {event.note || "De trainer heeft deze afspraak geschrapt."}
          </Card>
        ) : null}

        <WhenAndWhere event={event} onCalendar={() => setCalendarOpen(true)} />

        {played ? <ResultBlock {...{ event, state, update, coach, celebrate, showToast }} /> : null}

        <MyChildren
          players={state.players.filter((p) => myPlayers.includes(p.id))}
          absentSet={absentSet}
          onChange={setAbsence}
        />

        <SectionTitle icon={Users}>
          Aanwezig · {presentCount}/{state.players.length}
        </SectionTitle>
        <Card className="p-2">
          <div className="grid grid-cols-1 gap-1">
            {state.players.map((p) => {
              const isAbsent = absentSet.has(p.id);
              const row = (
                <>
                  <PlayerAvatar name={p.name} size={32} dimmed={isAbsent} />
                  <span className={cx("flex-1 text-left text-sm", isAbsent && "text-muted line-through")}>
                    {p.name}
                  </span>
                  {isAbsent ? (
                    <Badge tone="loss">Afwezig</Badge>
                  ) : (
                    <span className="text-xs text-muted">aanwezig</span>
                  )}
                </>
              );
              return coach ? (
                <button
                  key={p.id}
                  onClick={() => setAbsence(p.id, !isAbsent)}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-ink-800/70"
                >
                  {row}
                </button>
              ) : (
                <div key={p.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                  {row}
                </div>
              );
            })}
          </div>
          {coach ? (
            <p className="px-2 pt-1.5 pb-1 text-xs text-muted">
              Tik op een naam om aan- of afwezig te zetten.
            </p>
          ) : null}
        </Card>

        {isMatch ? (
          <SelectionBlock
            {...{ event, state, selection, absentSet, coach, toggleSelection, selectAllAvailable, shareSelection }}
          />
        ) : null}

        {isMatch && !played ? (
          <ResultBlock {...{ event, state, update, coach, celebrate, showToast }} />
        ) : null}

        {isMatch ? <DutiesBlock {...{ event, state, update, coach }} /> : null}
        {isMatch ? <CarpoolBlock {...{ event, state, update, showToast }} /> : null}

        {coach ? <CoachEventTools {...{ event, state, update, showToast, onClose }} /> : null}
      </Sheet>

      <AddToCalendarSheet event={event} open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </>
  );
}

/* ---------- Wanneer & waar ---------- */

function WhenAndWhere({ event, onCalendar }) {
  const route = directionsUrl(event.venue);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
          <Clock size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {event.start}
            {event.end ? <span className="text-muted font-normal"> – {event.end}</span> : null}
          </p>
          {event.meet ? (
            <p className="text-sm text-muted">Verzamelen om {event.meet}</p>
          ) : null}
          {event.competition ? (
            <p className="mt-1 text-xs text-muted">{event.competition}</p>
          ) : null}
        </div>
      </div>

      {event.venue ? (
        <div className="mt-3 flex items-start gap-3 border-t border-ink-700/50 pt-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
            <MapPin size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{event.venue.name}</p>
            <p className="text-sm text-muted">{event.venue.address}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        {route ? (
          <Button as="a" href={route} target="_blank" rel="noreferrer" variant="outline">
            <MapPin size={16} /> Route
          </Button>
        ) : <span />}
        <Button variant="primary" onClick={onCalendar}>In agenda</Button>
      </div>
    </Card>
  );
}

/* ---------- Mijn kinderen ---------- */

const REASONS = ["Ziek", "Op reis", "Familie", "Andere sport", "School"];

function MyChildren({ players, absentSet, onChange }) {
  const [reasonFor, setReasonFor] = useState(null);
  if (!players.length) return null;

  return (
    <>
      <SectionTitle icon={ClipboardList}>Mijn spelers</SectionTitle>
      <div className="space-y-2">
        {players.map((p) => {
          const isAbsent = absentSet.has(p.id);
          return (
            <Card key={p.id} className="p-3">
              <div className="flex items-center gap-3">
                <PlayerAvatar name={p.name} size={38} dimmed={isAbsent} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted">
                    {isAbsent ? "Afgemeld" : "Standaard aanwezig"}
                  </p>
                </div>
                <div className="flex rounded-xl border border-ink-700/70 p-0.5">
                  <button
                    onClick={() => { onChange(p.id, false); setReasonFor(null); }}
                    className={cx(
                      "h-9 rounded-lg px-3 text-sm transition-colors",
                      !isAbsent ? "bg-win/20 text-win font-semibold" : "text-muted"
                    )}
                  >
                    Erbij
                  </button>
                  <button
                    onClick={() => { onChange(p.id, true); setReasonFor(p.id); }}
                    className={cx(
                      "h-9 rounded-lg px-3 text-sm transition-colors",
                      isAbsent ? "bg-loss/20 text-loss font-semibold" : "text-muted"
                    )}
                  >
                    Kan niet
                  </button>
                </div>
              </div>

              {isAbsent && reasonFor === p.id ? (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-700/50 pt-3">
                  <span className="w-full text-xs text-muted">Reden (optioneel)</span>
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => { onChange(p.id, true, r); setReasonFor(null); }}
                      className="rounded-full border border-ink-700/70 bg-ink-800/60 px-3 py-1 text-xs text-muted transition-colors hover:text-cream"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Selectie ---------- */

function SelectionBlock({
  event, state, selection, absentSet, coach, toggleSelection, selectAllAvailable, shareSelection,
}) {
  const chosen = new Set(selection ?? []);

  if (!coach && !selection) {
    return (
      <>
        <SectionTitle icon={Shirt}>Selectie</SectionTitle>
        <Card className="p-4 text-sm text-muted">
          De trainer heeft de selectie nog niet gedeeld.
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        icon={Shirt}
        action={
          selection?.length ? (
            <Button variant="ghost" size="sm" onClick={shareSelection}>
              <Share2 size={14} /> Delen
            </Button>
          ) : null
        }
      >
        Selectie {selection?.length ? `· ${selection.length}` : ""}
      </SectionTitle>

      <Card className="p-3">
        {coach ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {state.players.map((p) => {
                const isAbsent = absentSet.has(p.id);
                const isChosen = chosen.has(p.id);
                return (
                  <button
                    key={p.id}
                    disabled={isAbsent}
                    onClick={() => toggleSelection(p.id)}
                    className={cx(
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 transition-all",
                      isChosen
                        ? "border-club bg-club/12"
                        : "border-ink-700/60 bg-ink-800/40 hover:border-ink-600",
                      isAbsent && "opacity-35"
                    )}
                  >
                    <PlayerAvatar name={p.name} size={34} dimmed={isAbsent} />
                    <span className={cx("text-xs truncate max-w-full", isChosen ? "text-club font-semibold" : "text-muted")}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={selectAllAvailable}>
              Iedereen die er is selecteren
            </Button>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(selection ?? []).map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-ink-800/70 py-1 pl-1 pr-3">
                <PlayerAvatar name={playerName(state, id)} size={24} />
                <span className="text-sm">{playerName(state, id)}</span>
              </span>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ---------- Beurtrol: fruit en shirts ---------- */

function DutiesBlock({ event, state, update, coach }) {
  const duties = dutiesFor(state, event.id);

  const setDuty = (key, value) => {
    update((s) => ({
      ...s,
      duties: { ...s.duties, [event.id]: { ...dutiesFor(s, event.id), [key]: value, auto: undefined } },
    }));
  };

  const rows = [
    { key: "fruit", icon: Apple, label: "Fruit bij de rust", id: duties.fruit },
    { key: "wash", icon: Shirt, label: "Shirts wassen", id: duties.wash },
  ];

  return (
    <>
      <SectionTitle icon={Apple}>Beurtrol</SectionTitle>
      <Card className="divide-y divide-ink-700/50">
        {rows.map(({ key, icon: Icon, label, id }) => (
          <div key={key} className="flex items-center gap-3 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{label}</p>
              {coach ? (
                <select
                  value={id ?? ""}
                  onChange={(e) => setDuty(key, e.target.value || null)}
                  className="mt-1 h-9 w-full rounded-lg border border-ink-700/70 bg-ink-800 px-2 text-sm"
                >
                  <option value="">— niemand —</option>
                  {state.players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <p className="font-semibold">{id ? playerName(state, id) : "— nog niet verdeeld —"}</p>
              )}
            </div>
          </div>
        ))}
      </Card>
      {duties.auto ? (
        <p className="mt-1.5 px-1 text-xs text-muted">
          Automatisch verdeeld volgens de wedstrijdvolgorde. De trainer kan ruilen.
        </p>
      ) : null}
    </>
  );
}

/* ---------- Carpool ---------- */

function CarpoolBlock({ event, state, update, showToast }) {
  const rides = state.carpool[event.id] ?? [];
  const [form, setForm] = useState(null);

  const addRide = (ride) => {
    update((s) => ({
      ...s,
      carpool: { ...s.carpool, [event.id]: [...(s.carpool[event.id] ?? []), { id: uid(), ...ride }] },
    }));
    setForm(null);
    showToast("Bedankt, dat helpt!");
  };

  const removeRide = (id) => {
    update((s) => ({
      ...s,
      carpool: { ...s.carpool, [event.id]: (s.carpool[event.id] ?? []).filter((r) => r.id !== id) },
    }));
  };

  const seatsFree = rides.reduce((n, r) => n + Number(r.seats || 0), 0);

  return (
    <>
      <SectionTitle
        icon={Car}
        action={
          form ? null : (
            <Button variant="ghost" size="sm" onClick={() => setForm({ name: "", seats: 2, from: "Het Zeen" })}>
              <Plus size={14} /> Ik rijd
            </Button>
          )
        }
      >
        Carpool {seatsFree ? `· ${seatsFree} plaatsen vrij` : ""}
      </SectionTitle>

      <Card className="p-3">
        {rides.length === 0 && !form ? (
          <p className="py-2 text-center text-sm text-muted">
            Nog geen aanbod. Rij je mee? Zet je plaatsen erbij — vooral handig voor uitwedstrijden.
          </p>
        ) : null}

        <div className="space-y-2">
          {rides.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl bg-ink-800/50 p-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-700/70 text-sky">
                <Car size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="truncate text-xs text-muted">
                  {r.seats} {Number(r.seats) === 1 ? "plaats" : "plaatsen"}
                  {r.from ? ` · vertrek aan ${r.from}` : ""}
                </p>
              </div>
              {r.phone ? (
                <Button as="a" href={`tel:${r.phone}`} variant="ghost" size="icon" aria-label={`Bel ${r.name}`}>
                  <MessageCircle size={16} />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" onClick={() => removeRide(r.id)} aria-label="Verwijderen">
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        </div>

        {form ? (
          <form
            className="mt-3 space-y-2 border-t border-ink-700/50 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name.trim()) return;
              addRide({ ...form, name: form.name.trim(), seats: Number(form.seats) || 1 });
            }}
          >
            <input
              className={inputClass}
              placeholder="Jouw naam (bv. mama van Mats)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={inputClass}
                type="number" min="1" max="7"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
                aria-label="Vrije plaatsen"
              />
              <input
                className={inputClass}
                placeholder="Vertrek vanaf"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              />
            </div>
            <input
              className={inputClass}
              placeholder="Gsm (optioneel)"
              inputMode="tel"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="flex-1">Toevoegen</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Annuleren</Button>
            </div>
          </form>
        ) : null}
      </Card>
    </>
  );
}

/* ---------- Uitslag, doelpunten en assists ---------- */

function ResultBlock({ event, state, update, coach, celebrate, showToast }) {
  const stored = state.results[event.id] ?? null;
  const result = stored ?? { us: "", them: "", goals: [], motm: null, note: "" };
  const label = resultLabel(event, stored);
  const [composer, setComposer] = useState(null); // null | {scorer}

  const patch = (changes) => {
    update((s) => ({
      ...s,
      results: { ...s.results, [event.id]: { ...(s.results[event.id] ?? { goals: [] }), ...changes } },
    }));
  };

  const addGoal = (playerId, assistId) => {
    const goals = [...(result.goals ?? []), { id: uid(), playerId, assistId: assistId ?? null }];
    patch({ goals, us: String(goals.length) });
    setComposer(null);
    celebrate?.();
    showToast(`⚽ Doelpunt van ${playerName(state, playerId)}!`);
  };

  const removeGoal = (id) => {
    const goals = (result.goals ?? []).filter((g) => g.id !== id);
    patch({ goals });
  };

  const candidates = useMemo(() => {
    const selection = state.selections[event.id];
    if (selection?.length) return state.players.filter((p) => selection.includes(p.id));
    const absent = new Set(absentIds(state, event.id));
    return state.players.filter((p) => !absent.has(p.id));
  }, [state, event.id]);

  const hasResult = stored && stored.us !== "" && stored.them !== "";
  if (!coach && !hasResult && !(result.goals ?? []).length) return null;

  return (
    <>
      <SectionTitle icon={Trophy}>Uitslag</SectionTitle>

      <Card className="p-4">
        {coach ? (
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 text-right">
              <p className="mb-1 truncate text-xs text-muted">
                {event.home ? "KOVC Sterrebeek" : event.opponent}
              </p>
              <input
                className={cx(inputClass, "h-14 text-center text-2xl font-bold")}
                type="number" min="0" inputMode="numeric"
                value={event.home ? result.us : result.them}
                onChange={(e) => patch(event.home ? { us: e.target.value } : { them: e.target.value })}
                aria-label="Score thuisploeg"
              />
            </div>
            <span className="pt-6 text-xl text-muted">–</span>
            <div className="flex-1">
              <p className="mb-1 truncate text-xs text-muted">
                {event.home ? event.opponent : "KOVC Sterrebeek"}
              </p>
              <input
                className={cx(inputClass, "h-14 text-center text-2xl font-bold")}
                type="number" min="0" inputMode="numeric"
                value={event.home ? result.them : result.us}
                onChange={(e) => patch(event.home ? { them: e.target.value } : { us: e.target.value })}
                aria-label="Score bezoekers"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-3xl font-bold tracking-tight">{label?.score ?? "—"}</p>
            {label ? (
              <Badge tone={label.outcome === "win" ? "win" : label.outcome === "draw" ? "draw" : "loss"} className="mt-2">
                {label.outcome === "win" ? "Gewonnen" : label.outcome === "draw" ? "Gelijkspel" : "Verloren"}
              </Badge>
            ) : null}
          </div>
        )}

        {/* Doelpunten */}
        <div className="mt-4 border-t border-ink-700/50 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Doelpunten {(result.goals ?? []).length ? `· ${result.goals.length}` : ""}
          </p>

          <div className="space-y-1.5">
            {(result.goals ?? []).map((g, i) => (
              <div key={g.id} className="flex items-center gap-2.5 rounded-xl bg-ink-800/50 p-2">
                <span className="w-5 text-center text-sm text-muted">{i + 1}</span>
                <PlayerAvatar name={playerName(state, g.playerId)} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{playerName(state, g.playerId)}</p>
                  {g.assistId ? (
                    <p className="truncate text-xs text-muted">
                      assist: {playerName(state, g.assistId)}
                    </p>
                  ) : null}
                </div>
                {coach ? (
                  <Button variant="ghost" size="icon" onClick={() => removeGoal(g.id)} aria-label="Doelpunt wissen">
                    <Trash2 size={15} />
                  </Button>
                ) : null}
              </div>
            ))}
            {!(result.goals ?? []).length ? (
              <p className="py-1 text-sm text-muted">Nog geen doelpunten geregistreerd.</p>
            ) : null}
          </div>

          {coach ? (
            composer ? (
              <GoalComposer
                players={candidates}
                scorer={composer.scorer}
                onScorer={(p) => setComposer({ scorer: p })}
                onAssist={(assistId) => addGoal(composer.scorer.id, assistId)}
                onCancel={() => setComposer(null)}
              />
            ) : (
              <Button variant="primary" size="sm" className="mt-2.5 w-full" onClick={() => setComposer({ scorer: null })}>
                <Plus size={15} /> Doelpunt toevoegen
              </Button>
            )
          ) : null}
        </div>

        {/* Speler van de match */}
        <div className="mt-4 border-t border-ink-700/50 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Star size={13} className="text-club" /> Speler van de match
          </p>
          {coach ? (
            <select
              value={result.motm ?? ""}
              onChange={(e) => patch({ motm: e.target.value || null })}
              className="h-11 w-full rounded-xl border border-ink-700/70 bg-ink-800 px-3"
            >
              <option value="">— nog niet gekozen —</option>
              {state.players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : result.motm ? (
            <div className="flex items-center gap-2.5">
              <PlayerAvatar name={playerName(state, result.motm)} size={36} />
              <p className="font-semibold">{playerName(state, result.motm)}</p>
              <span className="text-lg">⭐</span>
            </div>
          ) : (
            <p className="text-sm text-muted">Nog niet gekozen.</p>
          )}
        </div>

        {coach || result.note ? (
          <div className="mt-4 border-t border-ink-700/50 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Woordje van de trainer
            </p>
            {coach ? (
              <textarea
                className={cx(inputClass, "h-20 resize-none py-2")}
                placeholder="Wat een ploeg vandaag…"
                value={result.note ?? ""}
                onChange={(e) => patch({ note: e.target.value })}
              />
            ) : (
              <p className="text-sm">{result.note}</p>
            )}
          </div>
        ) : null}
      </Card>
    </>
  );
}

function GoalComposer({ players, scorer, onScorer, onAssist, onCancel }) {
  return (
    <div className="mt-2.5 rounded-2xl border border-club/40 bg-club/5 p-3">
      <p className="mb-2 text-sm font-semibold">
        {scorer ? `Assist voor ${scorer.name}?` : "Wie scoorde?"}
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {players
          .filter((p) => !scorer || p.id !== scorer.id)
          .map((p) => (
            <button
              key={p.id}
              onClick={() => (scorer ? onAssist(p.id) : onScorer(p))}
              className="flex flex-col items-center gap-1 rounded-xl border border-ink-700/60 bg-ink-800/60 px-1 py-2 transition-colors hover:border-club/60"
            >
              <PlayerAvatar name={p.name} size={28} />
              <span className="max-w-full truncate text-[0.68rem] text-muted">{p.name}</span>
            </button>
          ))}
      </div>
      <div className="mt-2 flex gap-2">
        {scorer ? (
          <Button variant="soft" size="sm" className="flex-1" onClick={() => onAssist(null)}>
            Geen assist
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onClick={onCancel}>Annuleren</Button>
      </div>
    </div>
  );
}

/* ---------- Trainersgereedschap ---------- */

function CoachEventTools({ event, state, update, showToast, onClose }) {
  const isTraining = event.type === "training";
  const [note, setNote] = useState(event.note ?? "");

  useEffect(() => { setNote(event.note ?? ""); }, [event.id, event.note]);

  const setCancelled = (cancelled) => {
    if (isTraining) {
      update((s) => ({
        ...s,
        trainingOverrides: {
          ...s.trainingOverrides,
          [event.id]: { ...(s.trainingOverrides[event.id] ?? {}), cancelled, note },
        },
      }));
    } else {
      update((s) => ({
        ...s,
        matches: s.matches.map((m) => (m.id === event.id ? { ...m, cancelled, note } : m)),
      }));
    }
    showToast(cancelled ? "Afgelast — iedereen ziet het meteen" : "Weer op de kalender");
  };

  const saveNote = () => {
    if (isTraining) {
      update((s) => ({
        ...s,
        trainingOverrides: {
          ...s.trainingOverrides,
          [event.id]: { ...(s.trainingOverrides[event.id] ?? {}), note },
        },
      }));
    } else {
      update((s) => ({
        ...s,
        matches: s.matches.map((m) => (m.id === event.id ? { ...m, note } : m)),
      }));
    }
    showToast("Bericht bewaard");
  };

  return (
    <>
      <SectionTitle icon={CircleSlash}>Trainer</SectionTitle>
      <Card className="space-y-3 p-3">
        <textarea
          className={cx(inputClass, "h-20 resize-none py-2")}
          placeholder="Boodschap bij deze afspraak (bv. 'neem je regenjas mee')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
        />
        {event.cancelled ? (
          <Button variant="soft" className="w-full" onClick={() => setCancelled(false)}>
            <Undo2 size={16} /> Toch laten doorgaan
          </Button>
        ) : (
          <Button variant="danger" className="w-full" onClick={() => setCancelled(true)}>
            <CircleSlash size={16} /> Deze afspraak afgelasten
          </Button>
        )}
      </Card>
    </>
  );
}
