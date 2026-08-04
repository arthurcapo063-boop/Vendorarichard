"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { money, timeAgo } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { StatusPill } from "@/components/ui";
import { IBolt, IInbox, IPackage, IUsers, IArrowR } from "@/components/icons";

interface Stats {
  ordersCount: number;
  usersCount: number;
  productsCount: number;
  revenue: number;
  byStatus: { status: OrderStatus; count: number }[];
  recentOrders: {
    id: number;
    orderNumber: string;
    customerName: string;
    total: number;
    status: OrderStatus;
    paymentMethod: string;
    createdAt: string;
  }[];
  lowStock: { id: number; name: string; stockQty: number | null }[];
}

const STATUS_ORDER: OrderStatus[] = ["pending", "processing", "completed", "cancelled"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, st] = await Promise.all([
        api<{ settings: { currency: string } }>("/api/admin/settings"),
        api<Stats>("/api/admin/stats"),
      ]);
      setCurrency(s.settings.currency);
      setStats(st);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-500">{error}</p>;

  const kpis = stats
    ? [
        { label: "Revenue", value: money(stats.revenue, currency), Icon: IBolt, note: "paid orders only" },
        { label: "Orders", value: String(stats.ordersCount), Icon: IInbox, note: `${stats.byStatus.find((b) => b.status === "pending")?.count ?? 0} awaiting review` },
        { label: "Customers", value: String(stats.usersCount), Icon: IUsers, note: "registered accounts" },
        { label: "Products", value: String(stats.productsCount), Icon: IPackage, note: `${stats.lowStock.length} low on stock` },
      ]
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Command center</p>
          <h1 className="section-title mt-1">Dashboard</h1>
        </div>
        <Link href="/admin/products/new" className="btn-brand px-5 py-2.5 text-sm">+ Add product</Link>
      </div>

      {!stats ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, Icon, note }, i) => (
              <div key={label} className="card animate-fade-up relative overflow-hidden p-5" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold tracking-[0.16em] text-mute uppercase">{label}</p>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={17} /></span>
                </div>
                <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-mute">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display font-bold">Recent orders</h2>
                <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                  View all <IArrowR size={12} />
                </Link>
              </div>
              <div className="overflow-x-auto slim-scroll">
                <table className="w-full text-sm">
                  <tbody>
                    {stats.recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-line/60 transition last:border-0 hover:bg-raise">
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-bold">{o.orderNumber}</p>
                          <p className="text-xs text-mute">{o.customerName} · {timeAgo(o.createdAt)}</p>
                        </td>
                        <td className="px-3 py-3"><StatusPill status={o.status} /></td>
                        <td className="px-5 py-3 text-right font-display font-bold whitespace-nowrap">{money(o.total, currency)}</td>
                      </tr>
                    ))}
                    {stats.recentOrders.length === 0 && (
                      <tr><td className="px-5 py-8 text-center text-sm text-mute" colSpan={3}>No orders yet — share the store link!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-5">
              <div className="card p-5">
                <h2 className="font-display font-bold">Orders by status</h2>
                <div className="mt-4 space-y-3">
                  {STATUS_ORDER.map((s) => {
                    const n = stats.byStatus.find((b) => b.status === s)?.count ?? 0;
                    const pct = stats.ordersCount ? Math.round((n / stats.ordersCount) * 100) : 0;
                    return (
                      <div key={s}>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize">{s}</span><span className="text-mute">{n}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-raise">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: s === "cancelled" ? "#ef4444" : s === "completed" ? "var(--brand-2)" : "var(--brand)" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-display font-bold">Low stock radar</h2>
                {stats.lowStock.length === 0 ? (
                  <p className="mt-3 text-sm text-mute">Everything is comfortably stocked. 👌</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {stats.lowStock.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                        <Link href={`/admin/products/${p.id}/edit`} className="truncate font-semibold hover:text-brand">{p.name}</Link>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${p.stockQty === 0 ? "bg-red-500/12 text-red-500" : "bg-amber-500/12 text-amber-600 dark:text-amber-400"}`}>
                          {p.stockQty === 0 ? "SOLD OUT" : `${p.stockQty} left`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
