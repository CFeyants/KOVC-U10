"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";

/* ============================================================
   Bouwstenen van de interface. Alles komt uit dezelfde tokens
   (kleuren, radius, animaties) zodat het geheel één app blijft.
   ============================================================ */

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cx(
        "rounded-3xl border border-ink-700/60 bg-ink-850/80 backdrop-blur-sm",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_10px_30px_-18px_rgba(0,0,0,0.9)]",
        className
      )}
      {...props}
    />
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-club text-ink-950 font-semibold hover:bg-club-dim active:scale-[0.98]",
  soft: "bg-ink-700/70 text-cream hover:bg-ink-600/70 active:scale-[0.98]",
  ghost: "text-muted hover:text-cream hover:bg-ink-800/70 active:scale-[0.98]",
  outline: "border border-ink-600/70 text-cream hover:bg-ink-800/70 active:scale-[0.98]",
  danger: "bg-loss/15 text-loss border border-loss/40 hover:bg-loss/25 active:scale-[0.98]",
};

const BUTTON_SIZES = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-[0.95rem] rounded-2xl gap-2",
  lg: "h-13 px-5 text-base rounded-2xl gap-2",
  icon: "h-10 w-10 rounded-xl justify-center",
};

export function Button({
  variant = "soft", size = "md", className, as: Tag = "button", ...props
}) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150",
        "disabled:opacity-40 disabled:pointer-events-none select-none",
        BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className
      )}
      {...props}
    />
  );
}

export function Chip({ active, className, ...props }) {
  return (
    <button
      className={cx(
        "shrink-0 rounded-full px-3.5 h-9 text-sm transition-all duration-150 border",
        active
          ? "bg-club text-ink-950 border-club font-semibold"
          : "bg-ink-800/60 text-muted border-ink-700/70 hover:text-cream",
        className
      )}
      {...props}
    />
  );
}

export function Badge({ tone = "neutral", className, ...props }) {
  const tones = {
    neutral: "bg-ink-700/60 text-muted",
    club: "bg-club/15 text-club",
    win: "bg-win/15 text-win",
    draw: "bg-draw/15 text-draw",
    loss: "bg-loss/15 text-loss",
    sky: "bg-sky/15 text-sky",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide",
        tones[tone], className
      )}
      {...props}
    />
  );
}

export function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2.5 mt-6 first:mt-0">
      <h2 className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">
        {Icon ? <Icon size={14} className="text-club" aria-hidden /> : null}
        {children}
      </h2>
      {action}
    </div>
  );
}

/* ---------- Speler-avatar ---------- */

const AVATAR_HUES = [198, 262, 42, 152, 12, 318, 92, 222];

export function PlayerAvatar({ name, size = 40, className, dimmed }) {
  const initials = (name ?? "?").trim().slice(0, 2).toUpperCase();
  let hash = 0;
  for (const ch of name ?? "") hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0",
        "ring-1 ring-inset ring-white/10", dimmed && "opacity-40 grayscale", className
      )}
      style={{
        width: size, height: size, fontSize: size * 0.38,
        background: `linear-gradient(150deg, hsl(${hue} 55% 32%), hsl(${hue} 48% 20%))`,
        color: `hsl(${hue} 80% 86%)`,
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/* ---------- Onderaan opschuivend paneel ---------- */

export function Sheet({ open, onClose, title, subtitle, children, footer }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative w-full sm:max-w-lg max-h-[92vh] flex flex-col outline-none",
          "rounded-t-3xl sm:rounded-3xl border border-ink-700/70 bg-ink-900",
          "shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)] animate-sheet"
        )}
      >
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-ink-700/50">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-600 sm:hidden" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-tight truncate">{title}</h2>
              {subtitle ? <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p> : null}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Sluiten">
              <X size={18} />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-ink-700/50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Formuliervelden ---------- */

export function Field({ label, hint, children }) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[0.78rem] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {typeof children === "function" ? children(id) : children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full h-11 rounded-xl border border-ink-700/70 bg-ink-800/60 px-3 text-cream " +
  "placeholder:text-muted/60 transition-colors focus:border-club/70";

/* ---------- Terugkoppeling ---------- */

export function Toast({ toast }) {
  if (!toast?.message) return null;
  const tones = { club: "bg-club text-ink-950", loss: "bg-loss text-ink-950" };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className={cx("animate-pop rounded-full px-4 py-2 text-sm font-semibold shadow-lg", tones[toast.tone] ?? tones.club)}>
        {toast.message}
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = (message, tone = "club") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, show];
}

/** Korte confettiregen — voor een doelpunt of een gewonnen match. */
export function Confetti({ burst }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!burst) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#dddd00", "#7ec8ec", "#ffffff", "#333366", "#4ade80"];
    setPieces(
      Array.from({ length: 26 }, (_, i) => ({
        id: `${burst}-${i}`,
        left: Math.random() * 100,
        dx: `${(Math.random() - 0.5) * 160}px`,
        spin: `${Math.random() * 900 - 300}deg`,
        delay: Math.random() * 0.25,
        duration: 1.5 + Math.random() * 0.9,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 7,
      }))
    );
    const id = setTimeout(() => setPieces([]), 2800);
    return () => clearTimeout(id);
  }, [burst]);

  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size * 1.6,
            background: p.color,
            "--dx": p.dx, "--spin": p.spin,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.3,0.7,0.5,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Lege en ladende toestanden ---------- */

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <Card className="px-5 py-8 text-center">
      {Icon ? (
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-club">
          <Icon size={22} />
        </span>
      ) : null}
      <p className="font-medium">{title}</p>
      {children ? <p className="mt-1 text-sm text-muted">{children}</p> : null}
    </Card>
  );
}

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-xl bg-ink-800/70", className)} />;
}
