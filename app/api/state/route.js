import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/* ============================================================
   Gedeelde opslag van alle teamgegevens: één JSON-blok in Redis.
   Alle toestellen die de app openen, zien dezelfde gegevens.

   Aanvaarde omgevingsvariabelen (het ene of het andere paar):
     - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
     - KV_REST_API_URL        / KV_REST_API_TOKEN
   ============================================================ */

export const STORAGE_KEY = "kovc-u10-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/* Zonder Upstash draait de app lokaal toch verder, met de gegevens in
   het geheugen van de dev-server. In productie blijft een ontbrekende
   configuratie een duidelijke fout — anders verdwijnt alles stilletjes
   bij de volgende deploy. */
const devStore = { value: null };
const devFallback = process.env.NODE_ENV !== "production";

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    if (devFallback) return NextResponse.json({ value: devStore.value });
    return NextResponse.json(
      { error: "Opslag niet ingesteld (Upstash-variabelen ontbreken)." },
      { status: 503 }
    );
  }
  try {
    const value = await redis.get(STORAGE_KEY);
    return NextResponse.json({ value: value ?? null });
  } catch (e) {
    console.error("Fout bij lezen uit Redis", e);
    return NextResponse.json({ error: "Kon de gegevens niet lezen." }, { status: 500 });
  }
}

export async function POST(request) {
  const redis = getRedis();
  if (!redis) {
    if (devFallback) {
      devStore.value = await request.json();
      return NextResponse.json({ ok: true, dev: true });
    }
    return NextResponse.json(
      { error: "Opslag niet ingesteld (Upstash-variabelen ontbreken)." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    await redis.set(STORAGE_KEY, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Fout bij schrijven naar Redis", e);
    return NextResponse.json({ error: "Kon de gegevens niet bewaren." }, { status: 500 });
  }
}
