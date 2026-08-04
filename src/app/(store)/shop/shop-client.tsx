"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import type { ProductLite } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { Reveal, EmptyState } from "@/components/ui";
import { IPackage, ISearch } from "@/components/icons";

type Item = ProductLite & { hasOptions: boolean };

export function ShopClient({
  currency,
  categories,
  showSoldOut,
}: {
  currency: string;
  categories: { id: number; name: string; slug: string }[];
  showSoldOut: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const cat = sp.get("cat") ?? "";
  const sort = sp.get("sort") ?? "newest";

  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);

  useEffect(() => setQuery(q), [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cat) params.set("cat", cat);
      params.set("sort", sort);
      const d = await api<{ list: Item[] }>(`/api/products?${params.toString()}`);
      setItems(d.list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, cat, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.replace(`/shop${p.toString() ? `?${p.toString()}` : ""}`);
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setParam("q", query.trim());
  };

  const activeCat = categories.find((c) => c.slug === cat);
  const title = activeCat ? activeCat.name : q ? `Results for “${q}”` : "All products";

  return (
    <div className="container-x py-10">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">The market</p>
            <h1 className="section-title mt-1">{title}</h1>
            <p className="mt-1 text-sm text-mute">
              {loading ? "Counting…" : `${items?.length ?? 0} product${(items?.length ?? 0) === 1 ? "" : "s"}`}
              {!showSoldOut && " · sold-out items hidden"}
            </p>
          </div>
          <form onSubmit={submitSearch} className="relative w-full sm:w-72">
            <ISearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this aisle…" className="input rounded-full pl-10" />
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button className={`chip ${!cat ? "chip-on" : ""}`} onClick={() => setParam("cat", "")}>All</button>
          {categories.map((c) => (
            <button key={c.id} className={`chip ${cat === c.slug ? "chip-on" : ""}`} onClick={() => setParam("cat", c.slug === cat ? "" : c.slug)}>
              {c.name}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="sort" className="text-xs font-bold tracking-wider text-mute uppercase">Sort</label>
            <select id="sort" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="input w-auto rounded-full py-2 pr-8 text-sm">
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low → high</option>
              <option value="price-desc">Price: high → low</option>
            </select>
          </div>
        </div>
      </Reveal>

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-52" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-4 w-4/5 rounded" />
                  <div className="skeleton h-5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard p={p} currency={currency} hasOptions={p.hasOptions} />
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<IPackage size={26} />}
            title="Nothing on this shelf"
            body="Try a different search term or browse another aisle — the market restocks daily."
            action={
              <button className="btn-brand px-5 py-2.5 text-sm" onClick={() => { setQuery(""); setParam("q", ""); setParam("cat", ""); }}>
                Clear filters
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
