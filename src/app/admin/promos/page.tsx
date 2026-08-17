"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money, currencySymbol } from "@/lib/utils";
import { useToast } from "@/components/providers";
import { Modal, Spinner } from "@/components/ui";
import { ITag, IPlus, IPencil, ITrash } from "@/components/icons";

interface Promo {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
}

const emptyForm = { code: "", type: "percent", value: "10", minSubtotal: "0", usageLimit: "", expiresAt: "", isActive: true };

export default function AdminPromosPage() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<Promo[] | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [modal, setModal] = useState<null | { id?: number }>(null);
  const [form, setForm] = useState<{ code: string; type: string; value: string; minSubtotal: string; usageLimit: string; expiresAt: string; isActive: boolean }>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      api<{ settings: { currency: string } }>("/api/admin/settings"),
      api<{ promos: Promo[] }>("/api/admin/promos"),
    ]);
    setCurrency(s.settings.currency);
    setPromos(d.promos);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const openNew = () => { setForm(emptyForm); setError(null); setModal({}); };
  const openEdit = (p: Promo) => {
    setForm({
      code: p.code,
      type: p.type,
      value: String(p.value),
      minSubtotal: String(p.minSubtotal),
      usageLimit: p.usageLimit != null ? String(p.usageLimit) : "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
      isActive: p.isActive,
    });
    setError(null);
    setModal({ id: p.id });
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        ...form,
        value: parseFloat(form.value),
        minSubtotal: parseFloat(form.minSubtotal) || 0,
        usageLimit: form.usageLimit === "" ? null : parseInt(form.usageLimit, 10),
        expiresAt: form.expiresAt || null,
      };
      if (modal?.id) {
        await api(`/api/admin/promos?id=${modal.id}`, { method: "PUT", body: JSON.stringify(body) });
        toast("Promo updated");
      } else {
        await api("/api/admin/promos", { method: "POST", body: JSON.stringify(body) });
        toast("Promo created");
      }
      setModal(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p: Promo) => {
    try {
      await api(`/api/admin/promos?id=${p.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...p, isActive: !p.isActive, expiresAt: p.expiresAt?.slice(0, 10) || null, value: String(p.value), minSubtotal: String(p.minSubtotal), usageLimit: p.usageLimit }),
      });
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  const del = async (p: Promo) => {
    try {
      await api(`/api/admin/promos?id=${p.id}`, { method: "DELETE" });
      toast(`Deleted ${p.code}`);
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Growth</p>
          <h1 className="section-title mt-1">Promo codes</h1>
        </div>
        <button className="btn-brand px-5 py-2.5 text-sm" onClick={openNew}><IPlus size={15} /> New code</button>
      </div>

      <div className="card mt-6 overflow-hidden">
        {!promos ? (
          <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : promos.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-mute">No promo codes yet — create one to spark first orders.</p>
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold tracking-wider text-mute uppercase">
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-3 py-3.5">Discount</th>
                  <th className="px-3 py-3.5">Min subtotal</th>
                  <th className="px-3 py-3.5">Usage</th>
                  <th className="px-3 py-3.5">Expires</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 transition last:border-0 hover:bg-raise">
                    <td className="px-5 py-3.5"><span className="rounded-lg bg-brand-soft px-2.5 py-1 font-mono text-xs font-extrabold text-brand">{p.code}</span></td>
                    <td className="px-3 py-3.5 font-bold">{p.type === "percent" ? `${p.value}%` : money(p.value, currency)}</td>
                    <td className="px-3 py-3.5 text-mute">{p.minSubtotal > 0 ? money(p.minSubtotal, currency) : "—"}</td>
                    <td className="px-3 py-3.5 text-mute">{p.usedCount}{p.usageLimit !== null ? ` / ${p.usageLimit}` : " / ∞"}</td>
                    <td className="px-3 py-3.5 text-mute">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "never"}</td>
                    <td className="px-3 py-3.5">
                      <button onClick={() => toggleActive(p)} className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase transition ${p.isActive ? "bg-brand-2-soft text-brand-2" : "bg-raise text-mute"}`} aria-label={`Toggle ${p.code}`}>
                        {p.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button className="btn-outline h-8 w-8 rounded-full" onClick={() => openEdit(p)} aria-label={`Edit ${p.code}`}><IPencil size={13} /></button>
                        <button className="btn-outline h-8 w-8 rounded-full hover:border-red-500 hover:text-red-500" onClick={() => del(p)} aria-label={`Delete ${p.code}`}><ITrash size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit promo code" : "New promo code"}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="pm-code">Code</label>
              <input id="pm-code" className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
            </div>
            <div>
              <label className="label" htmlFor="pm-type">Type</label>
              <select id="pm-type" className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed amount ({currencySymbol(currency)})</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="pm-value">{form.type === "percent" ? "Percent off" : `Amount off (${currencySymbol(currency)})`}</label>
              <input id="pm-value" type="number" min={0} className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pm-min">Min subtotal ({currencySymbol(currency)})</label>
              <input id="pm-min" type="number" min={0} className="input" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pm-limit">Usage limit <span className="normal-case">(blank = unlimited)</span></label>
              <input id="pm-limit" type="number" min={0} className="input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pm-exp">Expires on</label>
              <input id="pm-exp" type="date" className="input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold ${form.isActive ? "border-brand-2 bg-brand-2-soft" : "border-line text-mute"}`}
            aria-pressed={form.isActive}
          >
            Code is active
            <span className={`relative h-5 w-9 rounded-full ${form.isActive ? "bg-brand-2" : "bg-line"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${form.isActive ? "left-4.5" : "left-0.5"}`} />
            </span>
          </button>
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
