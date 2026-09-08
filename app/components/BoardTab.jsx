"use client";

import { useState } from "react";
import {
  Megaphone, Pin, Trash2, Send, MapPin, Dumbbell, ExternalLink, Smartphone, Info,
} from "lucide-react";
import { Button, Card, SectionTitle, EmptyState, inputClass, Badge, cx } from "./ui";
import { CLUB, TRAINING_SLOTS } from "@/lib/seed";
import { directionsUrl } from "@/lib/calendar";

/* ============================================================
   Het prikbord: korte berichten van de trainers, plus de vaste
   praktische info die ouders altijd opnieuw vragen.
   ============================================================ */

const WEEKDAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

function timeAgo(ts) {
  const min = Math.round((Date.now() - ts) / 60000);
  if (min < 1) return "net";
  if (min < 60) return `${min} min geleden`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} u geleden`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d geleden`;
  return new Date(ts).toLocaleDateString("nl-BE", { day: "numeric", month: "short" });
}

export default function BoardTab({ state, update, coach, showToast }) {
  const [draft, setDraft] = useState("");
  const [author, setAuthor] = useState("Trainer");

  const posts = [...state.posts].sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.ts - a.ts
  );

  const publish = () => {
    const text = draft.trim();
    if (!text) return;
    update((s) => ({
      ...s,
      posts: [
        { id: Math.random().toString(36).slice(2, 10), ts: Date.now(), author, text, pinned: false },
        ...s.posts,
      ],
    }));
    setDraft("");
    showToast("Bericht geplaatst");
  };

  const togglePin = (id) => {
    update((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)),
    }));
  };

  const remove = (id) => {
    update((s) => ({ ...s, posts: s.posts.filter((p) => p.id !== id) }));
  };

  const route = directionsUrl(CLUB.home);

  return (
    <div className="space-y-4">
      {coach ? (
        <Card className="p-3">
          <textarea
            className={cx(inputClass, "h-24 resize-none py-2.5")}
            placeholder="Een woordje voor de ouders…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <input
              className={cx(inputClass, "h-10 flex-1")}
              placeholder="Van wie?"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <Button variant="primary" onClick={publish} disabled={!draft.trim()}>
              <Send size={16} /> Plaatsen
            </Button>
          </div>
        </Card>
      ) : null}

      <SectionTitle icon={Megaphone}>Prikbord</SectionTitle>

      {posts.length ? (
        <div className="space-y-2">
          {posts.map((p, i) => (
            <Card
              key={p.id}
              className={cx("p-4", p.pinned && "border-club/50 bg-club/5")}
              style={{ animation: `rise 0.3s cubic-bezier(0.22,1,0.36,1) ${Math.min(i, 8) * 0.03}s both` }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                {p.pinned ? <Badge tone="club"><Pin size={10} /> Vastgezet</Badge> : null}
                <span className="text-xs font-semibold text-cream">{p.author}</span>
                <span className="text-xs text-muted">· {timeAgo(p.ts)}</span>
                {coach ? (
                  <span className="ml-auto flex gap-0.5">
                    <Button variant="ghost" size="icon" onClick={() => togglePin(p.id)} aria-label="Vastzetten">
                      <Pin size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Verwijderen">
                      <Trash2 size={14} />
                    </Button>
                  </span>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{p.text}</p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Megaphone} title="Nog geen berichten">
          De trainers zetten hier praktische zaken en nieuwtjes.
        </EmptyState>
      )}

      <SectionTitle icon={Info}>Praktisch</SectionTitle>

      <Card className="divide-y divide-ink-700/50">
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
            <Dumbbell size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Trainingen</p>
            {TRAINING_SLOTS.map((slot) => (
              <p key={slot.weekday} className="text-sm text-muted">
                {WEEKDAYS[slot.weekday]} · {slot.start} – {slot.end}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted">Geen training tijdens de schoolvakanties.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
            <MapPin size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{CLUB.home.name}</p>
            <p className="text-sm text-muted">{CLUB.home.address}</p>
            {route ? (
              <Button as="a" href={route} target="_blank" rel="noreferrer" variant="outline" size="sm" className="mt-2">
                <MapPin size={14} /> Route
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-club">
            <Smartphone size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Zet de app op je startscherm</p>
            <p className="text-sm text-muted">
              iPhone: deelknop → &laquo;Zet op beginscherm&raquo;. Android: menu → &laquo;App installeren&raquo;.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4">
          <Button as="a" href={CLUB.site} target="_blank" rel="noreferrer" variant="outline" size="sm">
            <ExternalLink size={14} /> Clubwebsite
          </Button>
          <Button as="a" href={CLUB.fixtures} target="_blank" rel="noreferrer" variant="outline" size="sm">
            <ExternalLink size={14} /> Kalender op Foot24
          </Button>
        </div>
      </Card>
    </div>
  );
}
