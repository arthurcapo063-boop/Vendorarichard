"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { money, timeAgo, cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { useToast } from "@/components/providers";
import { Modal, StatusPill } from "@/components/ui";

interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  image: string;
  attributes: { name: string; value: string }[];
  fees: { feeName: string; feeAmount: number }[];
  lineTotal: number;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  userId: number | null;
  accountName: string | null;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  feesTotal: number;
  discount: number;
  processingFee: number;
  total: number;
  promoCode: string | null;
  paymentMethod: string;
  paystackRef: string | null;
  status: OrderStatus;
  createdAt: string;
}

const STATUSES: OrderStatus[] = ["pending", "processing", "cancelled", "completed"];

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [currency, setCurrency] = useState("NGN");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [detail, setDetail] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    const [s, d] = await Promise.all([
      api<{ settings: { currency: string } }>("/api/admin/settings"),
      api<{ orders: AdminOrder[] }>("/api/admin/orders"),
    ]);
    setCurrency(s.settings.currency);
    setOrders(d.orders);
  }, []);

  useEffect(() => {
    load().catch((e) => toast((e as Error).message, "err"));
  }, [load, toast]);

  const setStatus = async (o: AdminOrder, status: OrderStatus) => {
    try {
      await api(`/api/admin/orders?id=${o.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders((prev) => (prev ? prev.map((x) => (x.id === o.id ? { ...x, status } : x)) : prev));
      setDetail((d) => (d && d.id === o.id ? { ...d, status } : d));
      toast(`${o.orderNumber} → ${status}`);
      if (status === "cancelled") toast("Stock for paid items was returned to the shelf.", "info");
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };

  const filtered = (orders ?? []).filter((o) => filter === "all" || o.status === filter);
  const counts = (s: OrderStatus | "all") =>
    s === "all" ? orders?.length ?? 0 : (orders ?? []).filter((o) => o.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Operations</p>
          <h1 className="section-title mt-1">Orders</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button key={s} className={cn("chip capitalize", filter === s && "chip-on")} onClick={() => setFilter(s)}>
              {s} <span className="opacity-60">({counts(s)})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        {!orders ? (
          <div className="space-y-3 p-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-mute">No {filter === "all" ? "" : filter + " "}orders yet.</p>
        ) : (
          <div className="overflow-x-auto slim-scroll">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold tracking-wider text-mute uppercase">
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-3 py-3.5">Customer</th>
                  <th className="px-3 py-3.5">Items</th>
                  <th className="px-3 py-3.5">Total</th>
                  <th className="px-3 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="cursor-pointer border-b border-line/60 transition last:border-0 hover:bg-raise" onClick={() => setDetail(o)}>
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs font-bold">{o.orderNumber}</p>
                      <p className="text-xs text-mute">{timeAgo(o.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-bold">{o.customerName}</p>
                      <p className="text-xs text-mute">{o.accountName ? `@${o.accountName}` : "guest"} · WA {o.customerWhatsapp}</p>
                    </td>
                    <td className="px-3 py-3.5 text-mute">{o.items.reduce((s, i) => s + i.qty, 0)} unit{o.items.reduce((s, i) => s + i.qty, 0) > 1 ? "s" : ""}</td>
                    <td className="px-3 py-3.5 font-display font-bold whitespace-nowrap">{money(o.total, currency)}</td>
                    <td className="px-3 py-3.5">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase", o.paymentMethod === "wallet" ? "bg-brand-2-soft text-brand-2" : "bg-brand-soft text-brand")}>
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <StatusPill status={o.status} />
                        <select
                          className="input w-auto rounded-full py-1.5 text-xs"
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                          aria-label={`Change status of ${o.orderNumber}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Order ${detail.orderNumber}` : ""} wide>
        {detail && (
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="label">Items</p>
              <ul className="space-y-3">
                {detail.items.map((it, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-line bg-raise p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{it.name}</p>
                      <p className="text-xs text-mute">Qty {it.qty} × {money(it.unitPrice, currency)}</p>
                      {it.attributes?.length > 0 && (
                        <p className="text-xs text-brand">{it.attributes.map((a) => `${a.name}: ${a.value}`).join(" · ")}</p>
                      )}
                      {it.fees?.length > 0 && (
                        <p className="text-[11px] text-mute">{it.fees.map((f) => `${f.feeName}: ${money(f.feeAmount, currency)}`).join(" · ")}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap">{money(it.lineTotal, currency)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd className="font-semibold text-ink">{money(detail.subtotal, currency)}</dd></div>
                <div className="flex justify-between text-mute"><dt>Custom fees</dt><dd className="font-semibold text-ink">{money(detail.feesTotal, currency)}</dd></div>
                <div className="flex justify-between text-mute"><dt>Discount {detail.promoCode && `(${detail.promoCode})`}</dt><dd className="font-semibold text-brand-2">−{money(detail.discount, currency)}</dd></div>
                <div className="flex justify-between text-mute"><dt>Processing fee</dt><dd className="font-semibold text-ink">{detail.processingFee > 0 ? money(detail.processingFee, currency) : "—"}</dd></div>
                <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="font-display text-brand">{money(detail.total, currency)}</dd></div>
              </dl>
            </div>
            <div>
              <p className="label">Customer</p>
              <div className="rounded-xl border border-line bg-raise p-4 text-sm">
                <p className="font-bold">{detail.customerName} {detail.accountName && <span className="text-xs font-semibold text-brand">@{detail.accountName}</span>}</p>
                <p className="mt-1 text-mute">{detail.customerEmail}</p>
                <p className="mt-1 text-mute">WhatsApp: {detail.customerWhatsapp}</p>
                <p className="mt-2 text-mute"><span className="font-semibold text-ink">Deliver to:</span> {detail.customerAddress}</p>
              </div>
              <p className="label mt-5">Payment</p>
              <div className="rounded-xl border border-line bg-raise p-4 text-sm">
                <p className="font-bold capitalize">{detail.paymentMethod}</p>
                <p className="mt-1 truncate font-mono text-xs text-mute">{detail.paystackRef ?? "no reference"}</p>
                <div className="mt-3">
                  <StatusPill status={detail.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
