"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money, cn, discountPct } from "@/lib/utils";
import type { CartItem, ProductLite } from "@/lib/types";
import { useCart, useToast } from "@/components/providers";
import { PriceTag, QtyPicker, Reveal } from "@/components/ui";
import { ProductRail } from "@/components/product-card";
import { IBolt, ICart, IShield, ITag, ITruck, IWhatsApp } from "@/components/icons";
import { waLink } from "@/lib/client";

interface AttrGroup {
  name: string;
  values: { id: number; value: string; priceDelta: number }[];
}

interface DetailProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  stockQty: number | null;
  soldOut: boolean;
  isFlashSale: boolean;
}

export function ProductDetailClient({
  product: p,
  attrGroups,
  fees,
  related,
  currency,
}: {
  product: DetailProduct;
  attrGroups: AttrGroup[];
  fees: { feeName: string; feeAmount: number }[];
  related: (ProductLite & { hasOptions: boolean })[];
  currency: string;
}) {
  const router = useRouter();
  const { add, setDrawerOpen } = useCart();
  const { toast } = useToast();

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQtyState] = useState(1);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const selectedAttrs = useMemo(
    () =>
      attrGroups
        .map((g) => g.values.find((v) => v.id === picked[g.name]))
        .filter((v): v is { id: number; value: string; priceDelta: number } => Boolean(v)),
    [attrGroups, picked]
  );

  const attrDelta = selectedAttrs.reduce((s, a) => s + a.priceDelta, 0);
  const unit = (p.salePrice ?? p.basePrice) + attrDelta;
  const feeSum = fees.reduce((s, f) => s + f.feeAmount, 0);
  const images = p.images.length ? p.images : [""];
  const maxQty = p.stockQty === null ? 99 : Math.max(1, p.stockQty);

  const buildItem = (): CartItem | null => {
    if (attrGroups.length && selectedAttrs.length < attrGroups.length) {
      toast(`Pick a ${attrGroups.find((g) => !picked[g.name])?.name ?? "option"} first`, "err");
      return null;
    }
    return {
      key: `p${p.id}-${selectedAttrs.map((a) => a.id).sort((a, b) => a - b).join(".")}`,
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: images[0],
      unitPrice: p.salePrice ?? p.basePrice,
      qty,
      attributeIds: selectedAttrs.map((a) => a.id),
      attributes: attrGroups.map((g) => {
        const v = g.values.find((x) => x.id === picked[g.name])!;
        return { name: g.name, value: v.value, priceDelta: v.priceDelta };
      }),
      fees,
    };
  };

  const addToCart = () => {
    if (p.soldOut) return;
    const item = buildItem();
    if (!item) return;
    add(item);
    toast(`Added “${p.name}” to cart`);
    setDrawerOpen(true);
  };

  const buyNow = () => {
    if (p.soldOut) return;
    const item = buildItem();
    if (!item) return;
    add(item);
    router.push("/checkout");
  };

  const pct = discountPct(p.basePrice, p.salePrice);

  return (
    <div className="container-x py-10">
      <nav className="text-xs font-semibold text-mute" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> <span className="mx-1">/</span>
        <Link href="/shop" className="hover:text-brand">Shop</Link> <span className="mx-1">/</span>
        <Link href={`/shop?cat=${p.categorySlug}`} className="hover:text-brand">{p.categoryName}</Link>
        <span className="mx-1">/</span> <span className="text-ink">{p.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr]">
        {/* gallery */}
        <Reveal>
          <div className="tilt-scene">
            <div className="card group relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[imgIdx]} alt={p.name} className={cn("h-[340px] w-full object-cover sm:h-[460px]", p.soldOut && "opacity-60 saturate-50")} />
              {p.isFlashSale && !p.soldOut && (
                <span className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-extrabold tracking-wider text-brand-ink uppercase shadow-lg">
                  <IBolt size={13} /> Flash deal
                </span>
              )}
              {pct > 0 && !p.soldOut && (
                <span className="absolute top-4 right-4 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-extrabold text-paper">−{pct}%</span>
              )}
              {p.soldOut && (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="rotate-[-6deg] rounded-xl border-2 border-red-500 bg-surface/95 px-8 py-3 font-display text-2xl font-extrabold tracking-widest text-red-500 uppercase shadow-2xl">
                    Sold out
                  </span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={cn("h-20 w-24 overflow-hidden rounded-xl border-2 transition", i === imgIdx ? "border-brand" : "border-line opacity-70 hover:opacity-100")} aria-label={`View image ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* buy panel */}
        <Reveal delay={120}>
          <p className="section-kicker">{p.categoryName}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{p.name}</h1>
          <p className="mt-2 text-sm text-mute">
            {p.stockQty === null ? "In stock — unlimited supply" : p.soldOut ? "Out of stock — restock incoming" : `Only ${p.stockQty} unit${p.stockQty === 1 ? "" : "s"} left in stock`}
          </p>

          <div className="mt-5">
            <PriceTag base={p.basePrice + attrDelta} sale={p.salePrice !== null ? p.salePrice + attrDelta : null} size="lg" currency={currency} />
            {attrDelta !== 0 && (
              <p className="mt-1 text-xs text-mute">Includes {attrDelta > 0 ? "+" : "−"}{money(Math.abs(attrDelta), currency)} for the selected {attrGroups.map((g) => g.name.toLowerCase()).join(" & ")}.</p>
            )}
          </div>

          {attrGroups.map((g) => (
            <fieldset key={g.name} className="mt-6">
              <legend className="label">{g.name}</legend>
              <div className="flex flex-wrap gap-2">
                {g.values.map((v) => {
                  const on = picked[g.name] === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPicked((prev) => ({ ...prev, [g.name]: v.id }))}
                      className={cn("chip", on && "chip-on")}
                      aria-pressed={on}
                    >
                      {v.value}
                      {v.priceDelta !== 0 && (
                        <span className={cn("text-[11px] font-bold", on ? "opacity-80" : "text-brand")}>
                          {v.priceDelta > 0 ? "+" : "−"}{money(Math.abs(v.priceDelta), currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {fees.length > 0 && (
            <div className="mt-6 rounded-2xl border border-dashed p-4" style={{ borderColor: "color-mix(in srgb, var(--brand-2) 50%, transparent)", background: "var(--brand-2-soft)" }}>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-brand-2 uppercase"><ITag size={13} /> Custom fees on this item</p>
              <ul className="mt-2 space-y-1 text-sm">
                {fees.map((f) => (
                  <li key={f.feeName} className="flex justify-between gap-3">
                    <span className="text-mute">{f.feeName}</span>
                    <span className="font-semibold">{money(f.feeAmount, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <QtyPicker qty={qty} onChange={(v) => setQtyState(Math.min(maxQty, Math.max(1, v)))} max={maxQty} />
            <button onClick={addToCart} disabled={p.soldOut} className="btn-outline flex-1 px-6 py-3 sm:flex-none">
              <ICart size={17} /> Add to cart
            </button>
            <button onClick={buyNow} disabled={p.soldOut} className="btn-brand flex-1 px-8 py-3 sm:flex-none">
              Buy now
            </button>
          </div>
          <p className="mt-2 text-xs text-mute">
            Total with fees: <span className="font-bold text-ink">{money((unit + feeSum) * qty, currency)}</span> for {qty} item{qty > 1 ? "s" : ""}
          </p>

          <ul className="mt-8 grid gap-2.5 rounded-2xl border border-line bg-raise p-4 text-sm font-semibold text-mute sm:grid-cols-2">
            <li className="flex items-center gap-2"><ITruck size={17} className="text-brand-2" /> Tracked doorstep delivery</li>
            <li className="flex items-center gap-2"><IShield size={17} className="text-brand-2" /> Paystack-secured payment</li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <IWhatsApp size={17} className="text-[#25D366]" />
              <span>Questions? Ask about this item on WhatsApp.</span>
            </li>
          </ul>
        </Reveal>
      </div>

      {/* description */}
      <Reveal className="mt-14">
        <div className="card max-w-3xl p-7">
          <p className="section-kicker">About this item</p>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-mute">{p.description || "No description provided."}</p>
        </div>
      </Reveal>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-16">
          <Reveal>
            <h2 className="section-title">More from {p.categoryName}</h2>
          </Reveal>
          <Reveal delay={100} className="mt-6">
            <ProductRail items={related} currency={currency} optionsMap={Object.fromEntries(related.map((r) => [r.id, r.hasOptions]))} />
          </Reveal>
        </section>
      )}
    </div>
  );
}
