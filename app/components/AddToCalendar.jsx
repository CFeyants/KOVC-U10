"use client";

import { useState } from "react";
import { CalendarPlus, Apple, Rss, Check } from "lucide-react";
import { Button, Sheet, Card } from "./ui";
import { downloadICS, googleCalendarUrl } from "@/lib/calendar";

/* ============================================================
   Eén knop om een wedstrijd of training in de agenda te zetten.
   Google opent meteen een ingevuld formulier; iPhone en Outlook
   krijgen een .ics-bestand. Onderaan kan je in één keer op de
   volledige kalender abonneren.
   ============================================================ */

function subscribeUrls() {
  if (typeof window === "undefined") return { http: "", webcal: "" };
  const http = `${window.location.origin}/api/ics`;
  return { http, webcal: http.replace(/^https?:/, "webcal:") };
}

export function AddToCalendarButton({ event, label = "In agenda", variant = "primary", size = "md", className }) {
  const [open, setOpen] = useState(false);
  if (!event) return null;

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <CalendarPlus size={17} />
        {label}
      </Button>
      <AddToCalendarSheet event={event} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function AddToCalendarSheet({ event, open, onClose }) {
  const [copied, setCopied] = useState(false);
  const { http, webcal } = subscribeUrls();

  const copyFeed = async () => {
    try {
      await navigator.clipboard.writeText(http);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kopieer deze link:", http);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="In je agenda zetten"
      subtitle={event ? `${event.title}` : undefined}
    >
      <div className="space-y-2.5">
        <Button
          as="a"
          href={event ? googleCalendarUrl(event) : "#"}
          target="_blank"
          rel="noreferrer"
          variant="soft"
          size="lg"
          className="w-full justify-start"
          onClick={onClose}
        >
          <span className="text-lg leading-none">📅</span>
          <span className="flex-1 text-left">Google Agenda</span>
        </Button>

        <Button
          variant="soft"
          size="lg"
          className="w-full justify-start"
          onClick={() => {
            downloadICS([event], `${event.id}-kovc-u10.ics`);
            onClose();
          }}
        >
          <Apple size={18} />
          <span className="flex-1 text-left">Apple Agenda of Outlook (.ics)</span>
        </Button>
      </div>

      <Card className="mt-5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Rss size={15} className="text-club" />
          Of abonneer op de hele kalender
        </p>
        <p className="mt-1.5 text-sm text-muted">
          Zet alle wedstrijden én trainingen in je agenda. Wijzigt de trainer iets,
          dan past je agenda zich vanzelf aan.
        </p>

        <div className="mt-3 grid gap-2">
          <Button as="a" href={webcal} variant="primary" size="md" className="w-full">
            Abonneren op iPhone / Apple
          </Button>
          <Button
            as="a"
            href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
            target="_blank"
            rel="noreferrer"
            variant="outline"
            size="md"
            className="w-full"
          >
            Abonneren in Google Agenda
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={copyFeed}>
            {copied ? <Check size={15} /> : null}
            {copied ? "Link gekopieerd" : "Kopieer de agendalink"}
          </Button>
        </div>
      </Card>
    </Sheet>
  );
}
