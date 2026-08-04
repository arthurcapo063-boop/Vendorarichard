import Link from "next/link";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { num, isSoldOut, money } from "@/lib/utils";
import type { ProductLite } from "@/lib/types";
import { ProductCard, ProductRail } from "@/components/product-card";
import { Countdown } from "@/components/countdown";
import { Reveal } from "@/components/ui";
import { IArrowR, IBolt, IShield, ITruck, IWallet, IStarFill } from "@/components/icons";

export const dynamic = "force-dynamic";

type Row = ProductLite & { hasOptions: boolean };

export default async function HomePage() {
  const s = await getSettings();
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));

  const conds = [eq(products.isActive, true)];
  if (!s.showSoldOut) {
    conds.push(or(sql`${products.stockQty} is null`, sql`${products.stockQty} > 0`) as never);
  }
  const rows = await db
    .select({
      p: products,
      categoryName: categories.name,
      categorySlug: categories.slug,
      hasOptions: sql<boolean>`exists(select 1 from product_attributes pa where pa.product_id = ${products.id})`.as("has_options"),
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conds))
    .orderBy(sql`${products.isFlashSale} desc`, sql`${products.isFeatured} desc`, sql`${products.createdAt} desc`)
    .limit(200);

  const all: Row[] = rows.map(({ p, categoryName, categorySlug, hasOptions }) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: categoryName ?? "",
    categorySlug: categorySlug ?? "",
    image: (p.images as string[])[0] ?? "",
    basePrice: num(p.basePrice),
    salePrice: p.salePrice !== null ? num(p.salePrice) : null,
    stockQty: p.stockQty,
    soldOut: isSoldOut(p.stockQty),
    isFlashSale: p.isFlashSale,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt.toISOString(),
    hasOptions: Boolean(hasOptions),
  }));

  const flash = all.filter((p) => p.isFlashSale);
  const recommended = all.filter((p) => p.isFeatured);
  const optionsMap = Object.fromEntries(all.map((p) => [p.id, p.hasOptions]));
  const floats = [flash[0] ?? all[0], recommended[1] ?? all[1], all[2]].filter(Boolean) as Row[];

  return (
    <>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div
          className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--brand)" }}
          aria-hidden
        />
        <div
          className="absolute -bottom-48 -left-32 h-[460px] w-[460px] rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand-2)" }}
          aria-hidden
        />
        <p
          className="pointer-events-none absolute top-8 -right-6 hidden font-display text-[11rem] leading-none font-extrabold tracking-tighter text-ink/[0.045] select-none xl:block"
          aria-hidden
        >
          market
        </p>

        <div className="container-x relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-bold tracking-[0.16em] uppercase">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-brand" />
              {s.tagline} · {cats.length} aisles
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl xl:text-[4.2rem]">
              {s.heroHeadline.split(/(?<=\.)\s/)[0]}
              {s.heroHeadline.includes(".") && (
                <span className="text-brand">{s.heroHeadline.slice(s.heroHeadline.indexOf("."))}</span>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">{s.heroSub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn-brand px-7 py-3.5 text-base">
                Shop the market <IArrowR size={17} />
              </Link>
              <a href="#flash" className="btn-outline px-7 py-3.5 text-base">
                <IBolt size={16} className="text-brand" /> Flash deals
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-mute">
              <li className="flex items-center gap-2"><ITruck size={18} className="text-brand-2" /> Tracked delivery</li>
              <li className="flex items-center gap-2"><IShield size={18} className="text-brand-2" /> Paystack-secured</li>
              <li className="flex items-center gap-2"><IWallet size={18} className="text-brand-2" /> Wallet credits</li>
            </ul>
          </div>

          {/* floating 3D product stack */}
          <div className="relative hidden h-[430px] select-none lg:block" aria-hidden>
            {floats.map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className="animate-float group absolute block w-56 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_70px_-30px_rgba(var(--shadow-ink)/0.55)] transition-transform duration-300 hover:scale-105"
                style={
                  {
                    top: `${[4, 34, 62][i] ?? 30}%`,
                    left: `${[8, 52, 22][i] ?? 20}%`,
                    zIndex: 10 - i,
                    "--rot": `${[-5, 4, -2][i] ?? 0}deg`,
                    animationDelay: `${i * 0.9}s`,
                  } as React.CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="h-32 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="truncate text-xs font-bold">{p.name}</span>
                  <span className="shrink-0 font-display text-xs font-extrabold text-brand">
                    {money(p.salePrice ?? p.basePrice, s.currency)}
                  </span>
                </div>
              </Link>
            ))}
            <div className="absolute top-[52%] left-[58%] z-20 grid h-24 w-24 rotate-12 place-items-center rounded-full bg-brand text-center shadow-xl">
              <span className="font-display text-[11px] leading-tight font-extrabold text-brand-ink uppercase">
                Flash<br />sale<br />live
              </span>
            </div>
          </div>
        </div>

        {/* category marquee */}
        <div className="relative border-t border-line bg-surface/60 py-3 backdrop-blur">
          <div className="animate-marquee flex w-max gap-8">
            {[...cats, ...cats].map((c, i) => (
              <Link
                key={`${c.id}-${i}`}
                href={`/shop?cat=${c.slug}`}
                className="flex items-center gap-8 text-sm font-bold tracking-[0.14em] whitespace-nowrap text-mute uppercase transition hover:text-brand"
              >
                {c.name} <span className="text-brand" aria-hidden>✦</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CATEGORY TILES ============================== */}
      <section className="container-x mt-14">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="section-kicker">Aisles</p>
              <h2 className="section-title mt-1">Pick a lane, any lane</h2>
            </div>
            <Link href="/shop" className="btn-ghost hidden px-4 py-2 text-sm sm:inline-flex">
              View all <IArrowR size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c, i) => (
            <Reveal key={c.id} delay={i * 60}>
              <Link
                href={`/shop?cat=${c.slug}`}
                className="group relative block h-40 overflow-hidden rounded-2xl border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity" />
                <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-white">{c.name}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-brand-ink opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <IArrowR size={13} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================== FLASH SALE ============================== */}
      {flash.length > 0 && (
        <section id="flash" className="mt-16 border-y border-line bg-surface py-12">
          <div className="container-x">
            <Reveal>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-brand-ink shadow-lg">
                    <IBolt size={20} />
                  </span>
                  <div>
                    <p className="section-kicker">Limited-time drops</p>
                    <h2 className="section-title">Flash Sale</h2>
                  </div>
                </div>
                <Countdown endsAt={s.flashSaleEndsAt?.toISOString() ?? null} />
              </div>
            </Reveal>
            <Reveal delay={120} className="mt-7">
              <ProductRail items={flash} currency={s.currency} optionsMap={optionsMap} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============================== CATEGORY RAILS ============================== */}
      {cats.map((c, ci) => {
        const items = all.filter((p) => p.categoryId === c.id);
        if (items.length === 0) return null;
        return (
          <section key={c.id} className="container-x mt-16">
            <Reveal>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="section-kicker">{String(ci + 1).padStart(2, "0")} · Aisle</p>
                  <h2 className="section-title mt-1">{c.name}</h2>
                </div>
                <Link href={`/shop?cat=${c.slug}`} className="btn-ghost px-4 py-2 text-sm">
                  View all <IArrowR size={15} />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={100} className="mt-6">
              <ProductRail items={items} currency={s.currency} optionsMap={optionsMap} />
            </Reveal>
          </section>
        );
      })}

      {/* ============================== RECOMMENDED GRID ============================== */}
      {recommended.length > 0 && (
        <section className="container-x mt-20">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-kicker flex items-center gap-1.5">
                  <IStarFill size={13} className="text-amber-500" /> Hand-picked
                </p>
                <h2 className="section-title mt-1">Recommended for you</h2>
              </div>
            </div>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {recommended.slice(0, 8).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard p={p} currency={s.currency} hasOptions={p.hasOptions} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============================== WALLET + PROMO BANNER ============================== */}
      <section className="container-x mt-20">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-ink p-8 text-paper dark:bg-raise sm:p-10">
              <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
              <div className="relative">
                <p className="text-xs font-bold tracking-[0.18em] text-brand uppercase">Vendora wallet</p>
                <h3 className="mt-3 max-w-md font-display text-3xl leading-tight font-extrabold sm:text-4xl">
                  Top up once. Check out in one tap, forever.
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/70">
                  Fund your wallet through Paystack and skip the card form on every order. Wallet credit is for store
                  purchases and never expires.
                </p>
              </div>
              <Link href="/account?tab=wallet" className="btn-brand relative mt-8 w-fit px-6 py-3">
                <IWallet size={17} /> Open my wallet
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border-2 border-dashed p-8 sm:p-10" style={{ borderColor: "color-mix(in srgb, var(--brand) 55%, transparent)", background: "var(--brand-soft)" }}>
              <p className="text-xs font-bold tracking-[0.18em] text-brand uppercase">First order?</p>
              <div>
                <h3 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                  Take 10% off with <span className="rounded-xl bg-brand px-3 py-0.5 text-brand-ink">WELCOME10</span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">
                  Applies at checkout on everything in the market — from hoodies to hatchbacks.
                </p>
              </div>
              <Link href="/shop" className="btn-dark mt-8 w-fit px-6 py-3">
                Start shopping <IArrowR size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
