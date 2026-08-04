"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, money } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { IMinus, IPlus, IX } from "./icons";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={cn("animate-spin text-brand", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3.5" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_META: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: "Pending", cls: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  processing: { label: "Processing", cls: "bg-brand-soft text-brand border-brand/30", dot: "bg-brand" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", dot: "bg-red-500" },
  completed: { label: "Completed", cls: "bg-brand-2-soft text-brand-2 border-brand-2/30", dot: "bg-brand-2" },
};

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase", m.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot, status === "processing" && "animate-pulse-dot")} />
      {m.label}
    </span>
  );
}

export function PriceTag({
  base,
  sale,
  size = "md",
  currency,
}: {
  base: number;
  sale: number | null;
  size?: "sm" | "md" | "lg";
  currency?: string;
}) {
  const cls = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg";
  const hasSale = sale !== null && sale < base;
  const pct = hasSale ? Math.round(((base - (sale as number)) / base) * 100) : 0;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-display font-bold tracking-tight", cls)}>{money(hasSale ? sale : base, currency)}</span>
      {hasSale && (
        <>
          <span className="text-xs text-mute line-through">{money(base, currency)}</span>
          <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-bold text-brand">−{pct}%</span>
        </>
      )}
    </span>
  );
}

export function QtyPicker({
  qty,
  onChange,
  max = 99,
  small,
}: {
  qty: number;
  onChange: (q: number) => void;
  max?: number;
  small?: boolean;
}) {
  const btn = cn(
    "grid place-items-center rounded-full border border-line text-ink transition hover:border-brand hover:text-brand disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink",
    small ? "h-7 w-7" : "h-9 w-9"
  );
  return (
    <div className="inline-flex items-center gap-2.5">
      <button type="button" className={btn} onClick={() => onChange(qty - 1)} aria-label="Decrease quantity">
        <IMinus size={14} />
      </button>
      <span className={cn("min-w-6 text-center font-display font-bold", small ? "text-sm" : "text-base")}>{qty}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, qty + 1))} aria-label="Increase quantity" disabled={qty >= max}>
        <IPlus size={14} />
      </button>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("animate-pop relative max-h-[86vh] w-full overflow-y-auto slim-scroll rounded-2xl border border-line bg-surface p-6 shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-display text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-line p-2 text-mute transition hover:border-brand hover:text-brand" aria-label="Close dialog">
            <IX size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Scroll-reveal wrapper — fades content up when it enters the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", on && "on", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="max-w-sm text-sm text-mute">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
