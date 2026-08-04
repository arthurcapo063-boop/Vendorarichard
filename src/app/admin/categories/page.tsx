"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useToast } from "@/components/providers";
import { Modal, Spinner } from "@/components/ui";
import { IPencil, IPlus, ITrash, ITag } from "@/components/icons";

interface Cat {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount: number;
}

const emptyForm = { name: "", description: "", image: "", sortOrder: "0" };

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [modal, setModal] = useState<null | { id?: number }>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await api<{ categories: Cat[] }>("/api/admin/categories");
    setCats(d.categories);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setModal({});
  };
  const openEdit = (c: Cat) => {
    setForm({ name: c.name, description: c.description, image: c.image, sortOrder: String(c.sortOrder) });
    setError(null);
    setModal({ id: c.id });
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = { ...form, sortOrder: parseInt(form.sortOrder, 10) || 0 };
      if (modal?.id) {
        await api(`/api/admin/categories?id=${modal.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast("Category updated");
      } else {
        await api("/api/admin/categories", { method: "POST", body: JSON.stringify(body) });
        toast("Category created");
      }
      setModal(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (c: Cat) => {
    try {
      await api(`/api/admin/categories?id=${c.id}`, { method: "DELETE" });
      toast(`Deleted “${c.name}”`);
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Catalog</p>
          <h1 className="section-title mt-1">Categories</h1>
        </div>
        <button className="btn-brand px-5 py-2.5 text-sm" onClick={openNew}><IPlus size={15} /> New category</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(cats ?? []).map((c) => (
          <div key={c.id} className="card group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative h-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" className="h-full w-full object-cover" />
              <span className="absolute right-3 bottom-2 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold text-paper">
                {c.productCount} product{c.productCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="p-4">
              <p className="font-display font-bold">{c.name}</p>
              <p className="text-xs text-mute">/{c.slug} · order {c.sortOrder}</p>
              {c.description && <p className="mt-1.5 line-clamp-2 text-xs text-mute">{c.description}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-outline h-8 flex-1 rounded-full text-xs" onClick={() => openEdit(c)}><IPencil size={12} /> Edit</button>
                <button className="btn-outline h-8 w-8 rounded-full hover:border-red-500 hover:text-red-500" onClick={() => del(c)} aria-label={`Delete ${c.name}`}><ITrash size={13} /></button>
              </div>
            </div>
          </div>
        ))}
        {cats === null && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>

      {cats?.length === 0 && (
        <p className="mt-10 text-center text-sm text-mute">No categories yet — create the first aisle of your market.</p>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit category" : "New category"}>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="cat-name">Name</label>
            <input id="cat-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sneakers" />
          </div>
          <div>
            <label className="label" htmlFor="cat-desc">Description</label>
            <input id="cat-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short blurb" />
          </div>
          <div>
            <label className="label" htmlFor="cat-img">Image URL</label>
            <input id="cat-img" className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <label className="label" htmlFor="cat-order">Sort order</label>
            <input id="cat-order" type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </div>
          {error && <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-outline px-5 py-2.5 text-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-brand px-6 py-2.5 text-sm" onClick={save} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4 text-brand-ink" /> : <ITag size={14} />} Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
