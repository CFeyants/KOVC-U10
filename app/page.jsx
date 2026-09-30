"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays, Users, Trophy, Megaphone, Settings, CloudOff, RefreshCw, Loader2, LayoutGrid,
} from "lucide-react";
import { Button, Card, Skeleton, Toast, useToast, Confetti, cx } from "./components/ui";
import AgendaTab from "./components/AgendaTab";
import TeamTab, { PlayerPicker } from "./components/TeamTab";
import StatsTab from "./components/StatsTab";
import BoardTab from "./components/BoardTab";
import PositionsTab from "./components/PositionsTab";
import EventSheet from "./components/EventSheet";
import PlayerSheet from "./components/PlayerSheet";
import CoachPanel from "./components/CoachPanel";
import { useClub, useLocalPref } from "@/lib/useClub";
import { buildEvents, playerStats } from "@/lib/model";
import { CLUB } from "@/lib/seed";

/* ============================================================
   De app zelf: één scherm met vijf tabbladen, gemaakt om met
   één duim te bedienen terwijl je langs het veld staat.
   ============================================================ */

const TABS = [
  { key: "agenda", label: "Kalender", icon: CalendarDays },
  { key: "team", label: "Ploeg", icon: Users },
  { key: "positions", label: "Posities", icon: LayoutGrid },
  { key: "stats", label: "Klassement", icon: Trophy },
  { key: "board", label: "Prikbord", icon: Megaphone },
];

export default function Page() {
  const { state, status, saving, error, update, reload } = useClub();
  const [tab, setTab] = useState("agenda");
  const [coach, setCoach] = useLocalPref("kovc-u10-coach", false);
  const [myPlayers, setMyPlayers, prefsReady] = useLocalPref("kovc-u10-mine", []);

  const [openEventId, setOpenEventId] = useState(null);
  const [openPlayerId, setOpenPlayerId] = useState(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [asked, setAsked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [toast, showToast] = useToast();

  const events = useMemo(() => (state ? buildEvents(state) : []), [state]);
  const stats = useMemo(() => (state ? playerStats(state, events) : []), [state, events]);
  const openEvent = useMemo(
    () => events.find((e) => e.id === openEventId) ?? null,
    [events, openEventId]
  );

  // Eén keer vragen wie jouw kind is — daarna staat het op dit toestel.
  useEffect(() => {
    if (!asked && prefsReady && status === "ready" && myPlayers.length === 0) {
      setPickerOpen(true);
      setAsked(true);
    }
  }, [asked, prefsReady, status, myPlayers.length]);

  const celebrate = () => setBurst((n) => n + 1);

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col">
      <Header saving={saving} coach={coach} onCoach={() => setCoachOpen(true)} />

      <main className="flex-1 px-4 pb-28 pt-3">
        {status === "loading" ? <LoadingState /> : null}
        {status === "error" ? <ErrorState message={error} onRetry={reload} /> : null}

        {status === "ready" && state ? (
          <>
            {tab === "agenda" ? (
              <AgendaTab
                state={state}
                events={events}
                myPlayers={myPlayers}
                onOpenEvent={(ev) => setOpenEventId(ev.id)}
              />
            ) : null}

            {tab === "team" ? (
              <TeamTab
                state={state}
                stats={stats}
                update={update}
                coach={coach}
                myPlayers={myPlayers}
                setMyPlayers={setMyPlayers}
                showToast={showToast}
                onOpenPlayer={setOpenPlayerId}
              />
            ) : null}

            {tab === "positions" ? (
              <PositionsTab state={state} update={update} coach={coach} showToast={showToast} />
            ) : null}

            {tab === "stats" ? <StatsTab state={state} stats={stats} events={events} /> : null}

            {tab === "board" ? (
              <BoardTab state={state} update={update} coach={coach} showToast={showToast} />
            ) : null}
          </>
        ) : null}
      </main>

      <TabBar tab={tab} setTab={setTab} />

      {state ? (
        <>
          <EventSheet
            event={openEvent}
            state={state}
            update={update}
            coach={coach}
            myPlayers={myPlayers}
            open={Boolean(openEvent)}
            onClose={() => setOpenEventId(null)}
            showToast={showToast}
            celebrate={celebrate}
          />

          <PlayerSheet
            playerId={openPlayerId}
            state={state}
            stats={stats}
            events={events}
            open={Boolean(openPlayerId)}
            onClose={() => setOpenPlayerId(null)}
          />

          <PlayerPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            players={state.players}
            selected={myPlayers}
            onToggle={(id) =>
              setMyPlayers(myPlayers.includes(id) ? myPlayers.filter((x) => x !== id) : [...myPlayers, id])
            }
          />

          <CoachPanel
            open={coachOpen}
            onClose={() => setCoachOpen(false)}
            coach={coach}
            setCoach={setCoach}
            state={state}
            update={update}
            showToast={showToast}
          />
        </>
      ) : null}

      <Toast toast={toast} />
      <Confetti burst={burst} />
    </div>
  );
}

/* ---------- Kop ---------- */

function Header({ saving, coach, onCoach }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/40 bg-ink-950/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Image
          src="/crest.png"
          alt=""
          width={40}
          height={40}
          className="rounded-xl ring-1 ring-white/10"
          priority
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[0.95rem] font-bold leading-tight">
            {CLUB.name} <span className="text-club">{CLUB.team}</span>
          </h1>
          <p className="truncate text-[0.7rem] text-muted">
            {CLUB.competition} · {CLUB.season}
          </p>
        </div>
        {saving ? (
          <span className="flex items-center gap-1.5 text-[0.7rem] text-muted" aria-live="polite">
            <Loader2 size={12} className="animate-spin" /> bewaren
          </span>
        ) : null}
        <Button
          variant={coach ? "primary" : "ghost"}
          size="icon"
          onClick={onCoach}
          aria-label="Coachmodus"
        >
          <Settings size={17} />
        </Button>
      </div>
    </header>
  );
}

/* ---------- Onderste navigatie ---------- */

function TabBar({ tab, setTab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700/50 bg-ink-950/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cx(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors",
                active ? "text-club" : "text-muted hover:text-cream"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              <span className={cx("text-[0.68rem]", active && "font-semibold")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Wachten en fouten ---------- */

function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-52 rounded-3xl" />
      <Skeleton className="h-9 w-2/3 rounded-full" />
      <Skeleton className="h-20 rounded-3xl" />
      <Skeleton className="h-20 rounded-3xl" />
      <Skeleton className="h-20 rounded-3xl" />
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <Card className="px-5 py-8 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-loss">
        <CloudOff size={22} />
      </span>
      <p className="font-semibold">De gegevens laden niet</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
        {message || "Onbekende fout."} Controleer of de Upstash-variabelen ingesteld staan
        (UPSTASH_REDIS_REST_URL en UPSTASH_REDIS_REST_TOKEN).
      </p>
      <Button variant="primary" className="mt-4" onClick={() => onRetry()}>
        <RefreshCw size={16} /> Opnieuw proberen
      </Button>
    </Card>
  );
}
