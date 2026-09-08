"use client";

import { useState } from "react";
import { Lock, CalendarPlus, Delete, ShieldCheck } from "lucide-react";
import { Button, Card, Sheet, SectionTitle, inputClass, cx } from "./ui";
import { CLUB } from "@/lib/seed";

/* ============================================================
   Coachmodus. Eén pincode voor alle trainers: geen accounts,
   geen wachtwoorden om te vergeten langs de zijlijn.
   ============================================================ */

const COACH_PIN = process.env.NEXT_PUBLIC_COACH_PIN || "1933";

export default function CoachPanel({ open, onClose, coach, setCoach, state, update, showToast }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={coach ? "Coachmodus" : "Coachmodus openen"}
      subtitle={coach ? "Je kan selecties, uitslagen en de kalender aanpassen." : "Enkel voor de trainers."}
    >
      {coach ? (
        <CoachTools state={state} update={update} showToast={showToast} onClose={onClose} setCoach={setCoach} />
      ) : (
        <PinPad
          onSuccess={() => {
            setCoach(true);
            showToast("Coachmodus actief");
          }}
        />
      )}
    </Sheet>
  );
}

/* ---------- Pincode ---------- */

function PinPad({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (digit) => {
    const next = (pin + digit).slice(0, 6);
    setPin(next);
    setWrong(false);
    if (next.length >= COACH_PIN.length) {
      if (next === COACH_PIN) onSuccess();
      else {
        setWrong(true);
        setTimeout(() => setPin(""), 400);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-center gap-2.5">
        {Array.from({ length: COACH_PIN.length }, (_, i) => (
          <span
            key={i}
            className={cx(
              "h-3.5 w-3.5 rounded-full border transition-colors",
              wrong ? "border-loss bg-loss/40"
                : i < pin.length ? "border-club bg-club" : "border-ink-600"
            )}
          />
        ))}
      </div>
      {wrong ? (
        <p className="mb-3 text-center text-sm text-loss">Verkeerde code — probeer opnieuw.</p>
      ) : null}

      <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <Button key={n} variant="soft" size="lg" className="h-14 text-lg" onClick={() => press(String(n))}>
            {n}
          </Button>
        ))}
        <span />
        <Button variant="soft" size="lg" className="h-14 text-lg" onClick={() => press("0")}>0</Button>
        <Button variant="ghost" size="lg" className="h-14" onClick={() => setPin(pin.slice(0, -1))} aria-label="Wissen">
          <Delete size={18} />
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        De code staat in de omgevingsvariabele NEXT_PUBLIC_COACH_PIN.
      </p>
    </div>
  );
}

/* ---------- Wat een trainer hier extra kan ---------- */

function CoachTools({ state, update, showToast, onClose, setCoach }) {
  const [form, setForm] = useState(null);

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.date || !form.start) return;
    const id = "x-" + Math.random().toString(36).slice(2, 8);
    update((s) => ({
      ...s,
      extraEvents: [
        ...s.extraEvents,
        {
          id,
          type: form.type,
          date: form.date,
          start: form.start,
          end: form.end || form.start,
          title: form.title || (form.type === "training" ? "Extra training" : "Afspraak"),
          opponent: form.type === "match" ? form.title : undefined,
          home: true,
          venue: { name: form.venueName || CLUB.home.name, address: form.venueAddress || CLUB.home.address },
          note: form.note ?? "",
        },
      ],
    }));
    setForm(null);
    showToast("Afspraak toegevoegd");
  };

  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-win/15 text-win">
          <ShieldCheck size={18} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Coachmodus staat aan</p>
          <p className="text-xs text-muted">
            Open een wedstrijd voor de selectie, de uitslag en de doelpunten.
          </p>
        </div>
      </Card>

      <SectionTitle icon={CalendarPlus}>Extra afspraak</SectionTitle>

      {form ? (
        <Card as="form" onSubmit={addEvent} className="space-y-2.5 p-3">
          <div className="flex gap-2">
            {[
              { key: "training", label: "Training" },
              { key: "match", label: "Vriendschappelijk" },
              { key: "other", label: "Andere" },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm({ ...form, type: t.key })}
                className={cx(
                  "h-9 flex-1 rounded-xl border text-sm transition-colors",
                  form.type === t.key
                    ? "border-club bg-club/12 text-club font-semibold"
                    : "border-ink-700/70 text-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            className={inputClass}
            placeholder={form.type === "match" ? "Tegenstander" : "Titel (bv. Kerstfeest)"}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-2">
            <input className={inputClass} type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Datum" />
            <input className={inputClass} type="time" value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })} aria-label="Beginuur" />
            <input className={inputClass} type="time" value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })} aria-label="Einduur" />
          </div>
          <input className={inputClass} placeholder="Plaats" value={form.venueName}
            onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
          <input className={inputClass} placeholder="Adres" value={form.venueAddress}
            onChange={(e) => setForm({ ...form, venueAddress: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" className="flex-1">Toevoegen</Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>Annuleren</Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="soft"
          className="w-full"
          onClick={() =>
            setForm({
              type: "training", title: "", date: "", start: "18:00", end: "19:30",
              venueName: CLUB.home.name, venueAddress: CLUB.home.address,
            })
          }
        >
          <CalendarPlus size={16} /> Afspraak toevoegen
        </Button>
      )}

      {state.extraEvents.length ? (
        <Card className="divide-y divide-ink-700/40">
          {state.extraEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1 truncate">
                {ev.date} · {ev.start} · {ev.title}
              </span>
              <Button
                variant="ghost" size="sm"
                onClick={() => update((s) => ({ ...s, extraEvents: s.extraEvents.filter((x) => x.id !== ev.id) }))}
              >
                Wissen
              </Button>
            </div>
          ))}
        </Card>
      ) : null}

      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={() => { setCoach(false); onClose(); showToast("Coachmodus uit"); }}
      >
        <Lock size={16} /> Coachmodus afsluiten
      </Button>
    </div>
  );
}
