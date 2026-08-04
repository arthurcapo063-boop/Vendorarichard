"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { useToast } from "@/components/providers";
import { Spinner } from "@/components/ui";
import { IPlus, ITrash } from "@/components/icons";

interface CategoryOpt {
  id: number;
  name: string;
}

interface AttrRow {
  name: string;
  value: string;
  priceDelta: string;
}

interface FeeRow {
  feeName: string;
  feeAmount: string;
}

export interface ProductFormInitial {
  product?: {
    id: number;
    name: string;
    description: string;
    categoryId: number;
    images: string[];
    basePrice: number;
    salePrice: number | null;
    stockQty: number | null;
    isFlashSale: boolean;
    isFeatured: boolean;
    isActive: boolean;
  };
  attributes?: { name: string; value: string; priceDelta: number }[];
  fees?: { feeName: string; feeAmount: number }[];
}

export function ProductForm({ categories, initial }: { categories: CategoryOpt[]; initial?: ProductFormInitial }) {
  const router = useRouter();
  const { toast } = useToast();
  const p = initial?.product;
  const editing = Boolean(p);

  const [form, setForm] = useState({
    name: p?.name ?? "",
    categoryId: p?.categoryId ?? (categories[0]?.id ?? 0),
    description: p?.description ?? "",
    images: (p?.images ?? []).join("\n"),
    basePrice: p ? String(p.basePrice) : "",
    salePrice: p?.salePrice != null ? String(p.salePrice) : "",
    stockQty: p?.stockQty != null ? String(p.stockQty) : "",
    isFlashSale: p?.isFlashSale ?? false,
    isFeatured: p?.isFeatured ?? false,
    isActive: p?.isActive ?? true,
  });
  const [attrs, setAttrs] = useState<AttrRow[]>(
    initial?.attributes?.map((a) => ({ name: a.name, value: a.value, priceDelta: String(a.priceDelta) })) ?? []
  );
  const [fees, setFees] = useState<FeeRow[]>(
    initial?.fees?.map((f) => ({ feeName: f.feeName, feeAmount: String(f.feeAmount) })) ?? []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.categoryId) return setError("Pick a category.");
    if (!(parseFloat(form.basePrice) > 0)) return setError("Base price must be greater than zero.");
    setBusy(true);
    const body = {
      ...form,
      basePrice: parseFloat(form.basePrice),
      salePrice: form.salePrice === "" ? null : parseFloat(form.salePrice),
      stockQty: form.stockQty === "" ? null : parseInt(form.stockQty, 10),
      attributes: attrs.map((a) => ({ ...a, priceDelta: parseFloat(a.priceDelta) || 0 })),
      fees: fees.map((f) => ({ ...f, feeAmount: parseFloat(f.feeAmount) || 0 })),
    };
    try {
      if (editing) {
        await api(`/api/admin/products?id=${p!.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast("Product updated");
      } else {
        await api("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
        toast("Product created");
      }
      router.push("/admin/products");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const toggle = (k: "isFlashSale" | "isFeatured" | "isActive") => (
    <button
      type="button"
      onClick={() => setForm({ ...form, [k]: !form[k] })}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${form[k] ? "border-brand bg-brand-soft text-ink" : "border-line text-mute hover:border-mute"}`}
      aria-pressed={form[k]}
    >
      {k === "isFlashSale" ? "⚡ Flash sale item" : k === "isFeatured" ? "★ Featured / recommended" : "👁 Visible in store"}
      <span className={`relative h-5 w-9 rounded-full transition ${form[k] ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${form[k] ? "left-4.5" : "left-0.5"}`} />
      </span>
    </button>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="font-display font-bold">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="pf-name">Product name</label>
              <input id="pf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Velocity Knit Runner" />
            </div>
            <div>
              <label className="label" htmlFor="pf-cat">Category</label>
              <select id="pf-cat" className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: parseInt(e.target.value, 10) })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pf-stock">Stock quantity <span className="normal-case">(blank = unlimited)</span></label>
              <input id="pf-stock" type="number" min={0} className="input" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} placeholder="e.g. 25 — hits 0 → auto Sold Out" />
            </div>
            <div>
              <label className="label" htmlFor="pf-base">Default price (₦)</label>
              <input id="pf-base" type="number" min={0} className="input" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} placeholder="45500" />
            </div>
            <div>
              <label className="label" htmlFor="pf-sale">Sale price (₦, optional)</label>
              <input id="pf-sale" type="number" min={0} className="input" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="32900" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="pf-imgs">Image URLs <span className="normal-case">(one per line — first is the cover)</span></label>
              <textarea id="pf-imgs" className="input min-h-24 font-mono text-xs" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder={"https://…/photo-1.jpg\nhttps://…/photo-2.jpg"} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="pf-desc">Description</label>
              <textarea id="pf-desc" className="input min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell the story of this product…" />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display font-bold">Variations <span className="text-xs font-semibold text-mute">(dynamic attributes)</span></h2>
          <p className="mt-1 text-xs text-mute">e.g. Size & Color for clothing · Year, Make & Mileage for cars. Price delta adjusts the unit price per option.</p>
          <div className="mt-4 space-y-2.5">
            {attrs.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input className="input w-36 flex-1" placeholder="Attribute (Size)" value={a.name} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="input w-36 flex-1" placeholder="Value (XL)" value={a.value} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <input className="input w-32" type="number" placeholder="± price" value={a.priceDelta} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? { ...x, priceDelta: e.target.value } : x)))} />
                <button type="button" className="btn-outline h-10 w-10 shrink-0 rounded-full hover:border-red-500 hover:text-red-500" onClick={() => setAttrs(attrs.filter((_, j) => j !== i))} aria-label="Remove attribute"><ITrash size={14} /></button>
              </div>
            ))}
            <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={() => setAttrs([...attrs, { name: "", value: "", priceDelta: "0" }])}>
              <IPlus size={14} /> Add attribute
            </button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display font-bold">Custom product fees</h2>
          <p className="mt-1 text-xs text-mute">Added on top of the item total at checkout — e.g. “Packaging Fee”, “Documentation”.</p>
          <div className="mt-4 space-y-2.5">
            {fees.map((f, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input className="input flex-1" placeholder="Fee name (Packaging Fee)" value={f.feeName} onChange={(e) => setFees(fees.map((x, j) => (j === i ? { ...x, feeName: e.target.value } : x)))} />
                <input className="input w-40" type="number" min={0} placeholder="Fee price (₦)" value={f.feeAmount} onChange={(e) => setFees(fees.map((x, j) => (j === i ? { ...x, feeAmount: e.target.value } : x)))} />
                <button type="button" className="btn-outline h-10 w-10 shrink-0 rounded-full hover:border-red-500 hover:text-red-500" onClick={() => setFees(fees.filter((_, j) => j !== i))} aria-label="Remove fee"><ITrash size={14} /></button>
              </div>
            ))}
            <button type="button" className="btn-outline px-4 py-2 text-sm" onClick={() => setFees([...fees, { feeName: "", feeAmount: "" }])}>
              <IPlus size={14} /> Add fee
            </button>
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-5 xl:sticky xl:top-24">
        <section className="card space-y-3 p-6">
          <h2 className="font-display font-bold">Storefront flags</h2>
          {toggle("isFlashSale")}
          {toggle("isFeatured")}
          {toggle("isActive")}
        </section>
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{error}</p>}
        <button className="btn-brand w-full py-3.5" onClick={save} disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-brand-ink" /> : null} {editing ? "Save changes" : "Create product"}
        </button>
        <button className="btn-outline w-full py-3" onClick={() => router.push("/admin/products")}>Cancel</button>
      </aside>
    </div>
  );
}
