import { buildICS } from "@/lib/calendar";
import { buildEvents, normalizeState } from "@/lib/model";
import { getRedis, STORAGE_KEY } from "../state/route";

/* ============================================================
   Abonneerbare agenda. Ouders plakken deze URL in Google Agenda,
   Apple Agenda of Outlook en krijgen automatisch alle wijzigingen.

   /api/ics                 -> wedstrijden + trainingen
   /api/ics?only=matches    -> enkel wedstrijden
   /api/ics?only=trainings  -> enkel trainingen
   ============================================================ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const only = new URL(request.url).searchParams.get("only");

  let stored = null;
  const redis = getRedis();
  if (redis) {
    try {
      stored = await redis.get(STORAGE_KEY);
    } catch (e) {
      console.error("ICS: kon opslag niet lezen", e);
    }
  }

  const state = normalizeState(stored);
  let events = buildEvents(state);
  if (only === "matches") events = events.filter((e) => e.type === "match");
  if (only === "trainings") events = events.filter((e) => e.type === "training");

  const name =
    only === "matches" ? "KOVC Sterrebeek U10 — wedstrijden"
      : only === "trainings" ? "KOVC Sterrebeek U10 — trainingen"
        : "KOVC Sterrebeek U10";

  return new Response(buildICS(events, name), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="kovc-u10.ics"',
      "Cache-Control": "public, max-age=600",
    },
  });
}
