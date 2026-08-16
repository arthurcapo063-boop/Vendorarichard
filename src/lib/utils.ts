export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Drizzle numeric() returns strings — coerce safely. */
export function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function currencySymbol(currency = "GHS"): string {
  switch ((currency || "").toUpperCase()) {
    case "GHS":
      return "GH₵";
    case "NGN":
      return "₦";
    case "USD":
      return "$";
    default:
      return "GH₵";
  }
}

export function money(v: number | string | null | undefined, currency = "GHS"): string {
  const n = num(v);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `GH₵${n.toLocaleString()}`;
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function orderNumber(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-6);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `VD-${t}${r}`;
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function isSoldOut(stockQty: number | null): boolean {
  return stockQty !== null && stockQty <= 0;
}

export function discountPct(base: number | string | null, sale: number | string | null): number {
  const b = num(base);
  const s = num(sale);
  if (!b || !sale || s >= b) return 0;
  return Math.round(((b - s) / b) * 100);
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function err(e: unknown): Response {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return Response.json({ error: "Something went wrong on our end." }, { status: 500 });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}
