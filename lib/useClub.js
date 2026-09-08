"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { freshState } from "./seed";
import { normalizeState } from "./model";

/* ============================================================
   Eén gedeelde toestand voor het hele team.
   Lezen bij het openen, bewaren met korte vertraging, en opnieuw
   ophalen zodra de app weer op de voorgrond komt — zo ziet iedereen
   langs het veld dezelfde selectie.
   ============================================================ */

const SAVE_DELAY = 700;

export function useClub() {
  const [state, setState] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const timer = useRef(null);
  const pending = useRef(null);
  const dirty = useRef(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus("loading");
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Kon de gegevens niet ophalen.");
      }
      const { value } = await res.json();
      if (dirty.current) return;              // lokale wijziging nog niet bewaard
      setState(normalizeState(value ?? freshState()));
      setStatus("ready");
      setError(null);
    } catch (e) {
      if (!silent) {
        setError(e.message);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Opnieuw ophalen wanneer de app weer zichtbaar wordt.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [load]);

  const flush = useCallback(async () => {
    const payload = pending.current;
    if (!payload) return;
    pending.current = null;
    setSaving(true);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Bewaren mislukt.");
      }
      dirty.current = false;
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  /** update(prev => next) — bewaart automatisch. */
  const update = useCallback((recipe) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = typeof recipe === "function" ? recipe(prev) : recipe;
      if (!next || next === prev) return prev;
      dirty.current = true;
      pending.current = next;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY);
      return next;
    });
  }, [flush]);

  // Nog snel bewaren wanneer de gsm de app wegduwt.
  useEffect(() => {
    const onHide = () => {
      if (pending.current) {
        clearTimeout(timer.current);
        navigator.sendBeacon?.(
          "/api/state",
          new Blob([JSON.stringify(pending.current)], { type: "application/json" })
        );
        pending.current = null;
        dirty.current = false;
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  return { state, status, saving, error, update, reload: load };
}

/* ---------- Voorkeuren op dit toestel ---------- */

export function useLocalPref(key, initial) {
  const [value, setValue] = useState(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch { /* privémodus: gewoon de standaardwaarde */ }
    setHydrated(true);
  }, [key]);

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* niets aan te doen */ }
      return resolved;
    });
  }, [key]);

  return [value, set, hydrated];
}

/** Kleine klok die elke minuut tikt — voor aftellingen. */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useEventsMemo(state, builder) {
  return useMemo(() => (state ? builder(state) : []), [state, builder]);
}
