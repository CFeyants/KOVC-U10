"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin, ChevronRight, CalendarDays, Bus, Home, Dumbbell, CircleSlash, Rss,
} from "lucide-react";
import { Button, Card, Chip, Badge, EmptyState, cx } from "./ui";
import { AddToCalendarButton, AddToCalendarSheet } from "./AddToCalendar";
import { directionsUrl } from "@/lib/calendar";
import { formatLong, formatShort, relativeDay, daysUntil, todayISO } from "@/lib/format";
import { absentIds, resultLabel } from "@/lib/model";
import { fetchForecast, forecastSummary } from "@/lib/weather";

/* ============================================================
   De agenda: wat komt eraan, en wat is er al gespeeld.
   Bovenaan de eerstvolgende afspraak, groot genoeg om vanuit
   de auto te lezen.
   ============================================================ */

export default function AgendaTab({ state, events, myPlayers, onOpenEvent }) {
  const today = todayISO();
  const [filter, setFilter] = useState("all");
  const [when, setWhen] = useState("upcoming");
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const next = useMemo(
    () => events.find((e) => e.date >= today && !e.cancelled) ?? null,
    [events, today]
  );

  const list = useMemo(() => {
    let rows = when === "upcoming"
      ? events.filter((e) => e.date >= today)
      : events.filter((e) => e.date < today).reverse();
    if (filter !== "all") rows = rows.filter((e) => e.type === filter);
    if (when === "upcoming" && next) rows = rows.filter((e) => e.id !== next.id);
    return rows.slice(0, when === "upcoming" ? 40 : 30);
  }, [events, filter, when, today, next]);

  return (
    <div className="space-y-4">
      {next ? (
        <NextEventHero
          event={next}
          state={state}
          myPlayers={myPlayers}
          onOpen={() => onOpenEvent(next)}
        />
      ) : (
        <EmptyState icon={CalendarDays} title="Geen afspraken meer dit seizoen">
          Tot volgend jaar — of vraag de trainer om de nieuwe kalender toe te voegen.
        </EmptyState>
      )}

      <div className="flex items-center gap-2 overflow-x-auto no-bar pb-0.5">
        <Chip active={when === "upcoming"} onClick={() => setWhen("upcoming")}>Komend</Chip>
        <Chip active={when === "past"} onClick={() => setWhen("past")}>Voorbij</Chip>
        <span className="mx-0.5 h-5 w-px shrink-0 bg-ink-700" />
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>Alles</Chip>
        <Chip active={filter === "match"} onClick={() => setFilter("match")}>Wedstrijden</Chip>
        <Chip active={filter === "training"} onClick={() => setFilter("training")}>Trainingen</Chip>
      </div>

      {list.length ? (
        <div className="space-y-2">
          {list.map((ev, i) => (
            <EventRow
              key={ev.id}
              event={ev}
              state={state}
              myPlayers={myPlayers}
              onOpen={() => onOpenEvent(ev)}
              index={i}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title="Niets te zien hier">
          {when === "past" ? "Er is nog niets gespeeld." : "Geen afspraken die aan dit filter voldoen."}
        </EmptyState>
      )}

      <Card className="mt-2 flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-800 text-club">
          <Rss size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Hele kalender in je agenda</p>
          <p className="text-xs text-muted">Eén keer instellen, altijd up-to-date.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSubscribeOpen(true)}>
          Abonneren
        </Button>
      </Card>

      <AddToCalendarSheet
        event={next ?? events[0]}
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
      />
    </div>
  );
}

/* ---------- De eerstvolgende afspraak ---------- */

function NextEventHero({ event, state, myPlayers, onOpen }) {
  const [forecast, setForecast] = useState(null);
  const days = daysUntil(event.date);
  const route = directionsUrl(event.venue);
  const absent = new Set(absentIds(state, event.id));
  const myAbsent = myPlayers.filter((id) => absent.has(id));

  useEffect(() => {
    if (days < 0 || days > 15) return;
    const controller = new AbortController();
    fetchForecast(event.date, controller.signal).then(setForecast);
    return () => controller.abort();
  }, [event.date, days]);

  const isMatch = event.type === "match";

  return (
    <Card className="animate-rise overflow-hidden">
      <div className="relative px-5 pt-4 pb-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60"
          style={{ background: "linear-gradient(180deg, rgba(221,221,0,0.13), transparent)" }}
          aria-hidden
        />
        <div className="relative flex items-center gap-2">
          <Badge tone="club">{isMatch ? (event.home ? "Thuiswedstrijd" : "Uitwedstrijd") : "Training"}</Badge>
          <span className="text-xs font-semibold uppercase tracking-wider text-club">
            {relativeDay(event.date)}
          </span>
        </div>

        <button onClick={onOpen} className="relative mt-3 block w-full text-left">
          <h1 className="text-[1.45rem] font-bold leading-tight tracking-tight">
            {isMatch ? (
              <>
                {event.home ? "KOVC Sterrebeek" : event.opponent}
                <span className="mx-2 text-muted font-normal">tegen</span>
                {event.home ? event.opponent : "KOVC Sterrebeek"}
              </>
            ) : (
              "Training"
            )}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {formatLong(event.date)} · {event.start}
            {event.meet ? ` · verzamelen ${event.meet}` : ""}
          </p>
        </button>

        {event.venue ? (
          <p className="relative mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>
              <span className="text-cream">{event.venue.name}</span> · {event.venue.address}
            </span>
          </p>
        ) : null}

        {forecast ? (
          <p className="relative mt-2 text-sm text-sky">{forecastSummary(forecast)}</p>
        ) : null}

        {myAbsent.length ? (
          <p className="relative mt-2 text-sm text-loss">
            {myAbsent.map((id) => state.players.find((p) => p.id === id)?.name).join(", ")}{" "}
            {myAbsent.length === 1 ? "is" : "zijn"} afgemeld.
          </p>
        ) : null}

        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {route ? (
            <Button as="a" href={route} target="_blank" rel="noreferrer" variant="outline" size="md">
              <MapPin size={16} /> Route
            </Button>
          ) : <span />}
          <AddToCalendarButton event={event} label="Agenda" variant="soft" />
          <Button variant="primary" onClick={onOpen}>
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Eén rij in de lijst ---------- */

export function EventRow({ event, state, myPlayers, onOpen, index = 0 }) {
  const isMatch = event.type === "match";
  const result = isMatch ? resultLabel(event, state.results[event.id]) : null;
  const absent = new Set(absentIds(state, event.id));
  const myAbsent = myPlayers.filter((id) => absent.has(id));

  return (
    <Card
      as="button"
      onClick={onOpen}
      className={cx(
        "flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-ink-600",
        event.cancelled && "opacity-60"
      )}
      style={{ animation: `rise 0.3s cubic-bezier(0.22,1,0.36,1) ${Math.min(index, 8) * 0.02}s both` }}
    >
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-ink-800/70 py-1.5">
        <span className="text-[0.65rem] uppercase tracking-wide text-muted">
          {formatShort(event.date).split(" ")[0]}
        </span>
        <span className="text-lg font-bold leading-none">
          {formatShort(event.date).split(" ")[1]}
        </span>
        <span className="text-[0.65rem] uppercase tracking-wide text-muted">
          {formatShort(event.date).split(" ")[2]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isMatch ? (
            event.home
              ? <Home size={13} className="shrink-0 text-club" />
              : <Bus size={13} className="shrink-0 text-sky" />
          ) : (
            <Dumbbell size={13} className="shrink-0 text-muted" />
          )}
          <p className="truncate text-[0.95rem] font-semibold">
            {isMatch ? event.opponent : "Training"}
          </p>
          {event.cancelled ? <CircleSlash size={13} className="shrink-0 text-loss" /> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {event.start}
          {isMatch ? ` · ${event.home ? "thuis" : "uit"}` : ` – ${event.end}`}
          {event.venue?.name ? ` · ${event.venue.name}` : ""}
        </p>
        {myAbsent.length ? (
          <p className="mt-1 truncate text-xs text-loss">
            Afgemeld: {myAbsent.map((id) => state.players.find((p) => p.id === id)?.name).join(", ")}
          </p>
        ) : null}
      </div>

      {result ? (
        <Badge tone={result.outcome === "win" ? "win" : result.outcome === "draw" ? "draw" : "loss"}>
          {result.score}
        </Badge>
      ) : (
        <ChevronRight size={18} className="shrink-0 text-muted" />
      )}
    </Card>
  );
}
