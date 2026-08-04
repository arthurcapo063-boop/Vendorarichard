"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { money } from "@/lib/utils";
import { useToast } from "@/components/providers";
import { Modal } from "@/components/ui";
import { IBolt, IPencil, IPlus, ISearch, IStarFill, ITrash, IEye } from "@/components/icons";

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  image: string;
  basePrice: number;
  salePrice: number | null;
  stockQty: number | null;
  isFlashSale: boolean;
  isFeatured: boolean;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      api<{ settings: { currency: string } }>("/api/admin/settings"),
      api<{ products: AdminProduct[] }>("/api/admin/products"),
    ]);
    setCurrency(s.settings.currency);
    setItems(d.products);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api(`/api/admin/products?id=${toDelete.id}`, { method: "DELETE" });
      toast(`Deleted “${toDelete.name}”`);
      setToDelete(null);
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };

  const filtered = (items ?? []).filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.categoryName.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Catalog</p>
          <h1 className="section-title mt-1">Products</h1>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <ISearch size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
            <input className="input w-52 rounded-full py-2 pl-9 text-sm" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Link href="/admin/products/new" className="btn-brand px-5 py-2.5 text-sm"><IPlus size={15} /> Add product</Link>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        {!items ? (
          <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold tracking-wider text-mute uppercase">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-3 py-3.5">Category</th>
                  <th className="px-3 py-3.5">Price</th>
                  <th className="px-3 py-3.5">Stock</th>
                  <th className="px-3 py-3.5">Flags</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 transition last:border-0 hover:bg-raise">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                        <div>
                          <p className="max-w-56 truncate font-bold">{p.name}</p>
                          <p className="text-xs text-mute">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-mute">{p.categoryName}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {p.salePrice !== null ? (
                        <span><span className="font-bold text-brand">{money(p.salePrice, currency)}</span> <span className="text-xs text-mute line-through">{money(p.basePrice, currency)}</span></span>
                      ) : (
                        <span className="font-bold">{money(p.basePrice, currency)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {p.stockQty === null ? (
                        <span className="text-xs font-bold text-mute">∞ unlimited</span>
                      ) : p.stockQty === 0 ? (
                        <span className="rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-extrabold text-red-500">SOLD OUT</span>
                      ) : (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${p.stockQty <= 5 ? "bg-amber-500/12 text-amber-600 dark:text-amber-400" : "bg-brand-2-soft text-brand-2"}`}>
                          {p.stockQty} in stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 text-mute">
                        {p.isFlashSale && <span title="Flash sale" className="text-brand"><IBolt size={14} /></span>}
                        {p.isFeatured && <span title="Featured" className="text-amber-500"><IStarFill size={14} /></span>}
                        {!p.isActive && <span title="Hidden from store" className="text-red-400"><IEye size={14} /></span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link href={`/admin/products/${p.id}/edit`} className="btn-outline h-8 w-8 rounded-full" aria-label={`Edit ${p.name}`}><IPencil size={13} /></Link>
                        <button onClick={() => setToDelete(p)} className="btn-outline h-8 w-8 rounded-full hover:border-red-500 hover:text-red-500" aria-label={`Delete ${p.name}`}><ITrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-mute">No products match “{q}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete product?">
        <p className="text-sm text-mute">
          “{toDelete?.name}” and its variations & fees will be permanently removed from the catalog. Past orders keep their snapshots.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-outline px-5 py-2.5 text-sm" onClick={() => setToDelete(null)}>Keep it</button>
          <button className="btn px-5 py-2.5 text-sm bg-red-500 text-white hover:brightness-110" onClick={doDelete} disabled={busy}>
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
