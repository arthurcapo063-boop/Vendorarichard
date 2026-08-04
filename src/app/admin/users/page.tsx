"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/providers";
import { Modal, Spinner } from "@/components/ui";
import { IWallet, ISearch } from "@/components/icons";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  role: string;
  walletBalance: number;
  ordersCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [adjust, setAdjust] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      api<{ settings: { currency: string } }>("/api/admin/settings"),
      api<{ users: AdminUser[] }>("/api/admin/users"),
    ]);
    setCurrency(s.settings.currency);
    setUsers(d.users);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const applyAdjust = async () => {
    if (!target) return;
    const amt = parseFloat(adjust);
    if (!amt || Number.isNaN(amt)) return toast("Enter a non-zero amount (negative debits).", "err");
    setBusy(true);
    try {
      const d = await api<{ walletBalance: number }>("/api/admin/wallet", {
        method: "POST",
        body: JSON.stringify({ userId: target.id, adjust: amt, reason: reason.trim() || undefined }),
      });
      setUsers((prev) => (prev ? prev.map((u) => (u.id === target.id ? { ...u, walletBalance: d.walletBalance } : u)) : prev));
      toast(`Wallet ${amt > 0 ? "credited" : "debited"} ${money(Math.abs(amt), currency)} for ${target.name}`);
      setTarget(null);
      setAdjust("");
      setReason("");
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  };

  const filtered = (users ?? []).filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">CRM</p>
          <h1 className="section-title mt-1">Users</h1>
        </div>
        <div className="relative">
          <ISearch size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
          <input className="input w-56 rounded-full py-2 pl-9 text-sm" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        {!users ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold tracking-wider text-mute uppercase">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-3 py-3.5">WhatsApp</th>
                  <th className="px-3 py-3.5">Role</th>
                  <th className="px-3 py-3.5">Wallet</th>
                  <th className="px-3 py-3.5">Orders</th>
                  <th className="px-3 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Adjust wallet</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-line/60 transition last:border-0 hover:bg-raise">
                    <td className="px-5 py-3.5">
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-mute">{u.email}</p>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-mute">{u.whatsapp || "—"}</td>
                    <td className="px-3 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${u.role === "admin" ? "bg-brand text-brand-ink" : "bg-raise text-mute"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-display font-bold text-brand-2 whitespace-nowrap">{money(u.walletBalance, currency)}</td>
                    <td className="px-3 py-3.5">{u.ordersCount}</td>
                    <td className="px-3 py-3.5 text-xs text-mute whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="btn-outline h-8 rounded-full px-3 text-xs" onClick={() => { setTarget(u); setAdjust(""); setReason(""); }}>
                        <IWallet size={13} /> Adjust
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-mute">No users match “{q}”.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Adjust wallet — ${target?.name ?? ""}`}>
        <p className="text-sm text-mute">
          Current balance: <span className="font-bold text-ink">{target ? money(target.walletBalance, currency) : ""}</span>. Positive credits, negative debits. A transaction record is written automatically.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="adj-amt">Amount (±)</label>
            <input id="adj-amt" type="number" step="100" className="input" value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder="e.g. 5000 or -2000" />
          </div>
          <div>
            <label className="label" htmlFor="adj-reason">Reason</label>
            <input id="adj-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Goodwill credit · refund · correction…" />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-outline px-5 py-2.5 text-sm" onClick={() => setTarget(null)}>Cancel</button>
            <button className="btn-brand px-6 py-2.5 text-sm" onClick={applyAdjust} disabled={busy}>
              {busy ? <Spinner className="h-4 w-4 text-brand-ink" /> : <IWallet size={14} />} Apply
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
