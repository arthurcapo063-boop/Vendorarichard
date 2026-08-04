"use client";

import { useEffect, useState } from "react";

function parts(end: number) {
  const diff = Math.max(0, end - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s, done: diff === 0 };
}

export function Countdown({ endsAt }: { endsAt: string | null }) {
  const end = endsAt ? new Date(endsAt).getTime() : null;
  const [t, setT] = useState(() => (end ? parts(end) : null));

  useEffect(() => {
    if (!end) return;
    const id = setInterval(() => setT(parts(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (!end || !t) return null;
  const cell = "grid h-11 w-12 place-items-center rounded-xl bg-ink font-display text-lg font-extrabold text-paper dark:bg-paper dark:text-ink";
  return (
    <div className="flex items-center gap-2" role="timer" aria-label="Flash sale countdown">
      <span className="mr-1 text-xs font-bold tracking-[0.16em] text-mute uppercase">Ends in</span>
      <span className={cell}>{String(t.h).padStart(2, "0")}</span>
      <span className="font-display text-lg font-extrabold text-brand">:</span>
      <span className={cell}>{String(t.m).padStart(2, "0")}</span>
      <span className="font-display text-lg font-extrabold text-brand">:</span>
      <span className={cell}>{String(t.s).padStart(2, "0")}</span>
      {t.done && <span className="ml-2 text-sm font-bold text-red-500">Sale ended</span>}
    </div>
  );
}
