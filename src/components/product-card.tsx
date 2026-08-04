"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { ProductLite, CartItem } from "@/lib/types";
import { money, discountPct, cn } from "@/lib/utils";
import { useCart, useToast } from "./providers";
import { PriceTag } from "./ui";
import { IBolt, ICart, ICheck, IStarFill } from "./icons";

/**
 * Product card with a pointer-tracked 3D tilt. Items that have variations
 * route to the product page; simple items can be added straight to cart.
 */
export function ProductCard({
  p,
  currency,
  hasOptions,
  compact,
}: {
  p: ProductLite;
  currency: string;
  hasOptions?: boolean;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const { toast } = useToast();

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateZ(6px)`;
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.soldOut) return;
    const item: CartItem = {
      key: `p${p.id}`,
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      unitPrice: p.salePrice ?? p.basePrice,
      qty: 1,
      attributeIds: [],
      attributes: [],
      fees: [],
    };
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    toast(`Added “${p.name}” to cart`);
  };

  const pct = discountPct(p.basePrice, p.salePrice);
  const rating = 3.9 + ((p.id * 7) % 10) / 10;

  return (
    <div className="tilt-scene group h-full">
      <Link
        href={`/product/${p.slug}`}
        className="card tilt-card relative flex h-full flex-col overflow-hidden hover:shadow-[0_24px_60px_-24px_rgba(var(--shadow-ink)/0.45)]"
      >
        <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="flex h-full flex-col transition-transform duration-150 will-change-transform">
          <div className={cn("relative overflow-hidden bg-raise", compact ? "h-40" : "h-52")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover:scale-108",
                p.soldOut && "opacity-50 saturate-50"
              )}
            />
            {/* glare that follows the pointer */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(340px circle at var(--gx,50%) var(--gy,50%), color-mix(in srgb, var(--brand) 16%, transparent), transparent 65%)",
              }}
            />
            <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5" style={{ transform: "translateZ(30px)" }}>
              {p.isFlashSale && !p.soldOut && (
                <span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-brand-ink uppercase shadow-lg">
                  <IBolt size={11} /> Flash
                </span>
              )}
              {pct > 0 && !p.soldOut && (
                <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-extrabold text-paper backdrop-blur">
                  −{pct}%
                </span>
              )}
            </div>
            {p.soldOut && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="rotate-[-8deg] rounded-lg border-2 border-red-500 bg-surface/90 px-4 py-1.5 font-display text-sm font-extrabold tracking-widest text-red-500 uppercase shadow-xl">
                  Sold out
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-mute uppercase">{p.categoryName}</p>
            <h3 className={cn("mt-1 line-clamp-2 font-display font-bold leading-snug transition-colors group-hover:text-brand", compact ? "text-sm" : "text-[15px]")}>
              {p.name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-mute">
              <IStarFill size={12} className="text-amber-500" /> {rating.toFixed(1)}
              <span aria-hidden>·</span> {p.stockQty === null ? "In stock" : p.soldOut ? "Unavailable" : `${p.stockQty} left`}
            </p>
            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
              <PriceTag base={p.basePrice} sale={p.salePrice} size="sm" currency={currency} />
              {hasOptions ? (
                <span className="btn-outline h-9 shrink-0 px-3 text-xs">Options</span>
              ) : (
                <button
                  onClick={quickAdd}
                  disabled={p.soldOut}
                  aria-label={`Add ${p.name} to cart`}
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-200",
                    added
                      ? "scale-110 bg-brand-2 text-white"
                      : p.soldOut
                        ? "cursor-not-allowed bg-raise text-mute"
                        : "bg-brand text-brand-ink shadow-md hover:scale-110 hover:brightness-110"
                  )}
                >
                  {added ? <ICheck size={16} /> : <ICart size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/** Horizontal product rail with arrow controls (Amazon-style row). */
export function ProductRail({
  items,
  currency,
  optionsMap,
}: {
  items: ProductLite[];
  currency: string;
  optionsMap: Record<number, boolean>;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 320 * 2, behavior: "smooth" });
  };
  return (
    <div className="group/rail relative">
      <div ref={scroller} className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto scroll-smooth px-1 pb-2">
        {items.map((p) => (
          <div key={p.id} className="w-60 shrink-0 snap-start sm:w-64">
            <ProductCard p={p} currency={currency} hasOptions={optionsMap[p.id]} compact />
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute top-1/2 -left-3 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-lg transition-all group-hover/rail:opacity-100 hover:border-brand hover:text-brand md:grid"
      >
        ‹
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute top-1/2 -right-3 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface text-ink opacity-0 shadow-lg transition-all group-hover/rail:opacity-100 hover:border-brand hover:text-brand md:grid"
      >
        ›
      </button>
    </div>
  );
}


