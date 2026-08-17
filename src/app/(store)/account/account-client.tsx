"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { money, timeAgo, cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { useToast } from "@/components/providers";
import { StatusPill, Spinner, EmptyState, Modal } from "@/components/ui";
import { IInbox, IWallet, IArrowR, IPencil, IChevR } from "@/components/icons";
import { openPaystackPopup, type PaystackPopupConfig } from "@/lib/paystack-popup";

interface Me {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  role: string;
  walletBalance: string;
}

interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  attributes: { name: string; value: string }[];
  fees: { feeName: string; feeAmount: number }[];
  lineTotal: number;
  image: string;
}

interface OrderView {
  id: number;
  orderNumber: string;
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
  customerAddress: string;
  customerWhatsapp: string;
  createdAt: string;
}

interface Tx {
  id: number;
  type: "credit" | "debit";
  amount: number;
  description: string;
  createdAt: string;
}

type Tab = "overview" | "wallet" | "orders" | "profile";

export function AccountClient({ currency, siteName }: { currency: string; siteName: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const tab = (sp.get("tab") as Tab) || "overview";

  const [me, setMe] = useState<Me | null | "loading">("loading");
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [topUp, setTopUp] = useState<number>(10000);
  const [funding, setFunding] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [profile, setProfile] = useState({ name: "", whatsapp: "", address: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ user: Me }>("/api/account");
      setMe(d.user);
      setProfile({ name: d.user.name, whatsapp: d.user.whatsapp, address: d.user.address });
    } catch {
      router.replace("/auth/login?next=/account");
      return;
    }
    try {
      const d = await api<{ orders: OrderView[]; wallet: Tx[] }>("/api/orders?wallet=1");
      setOrders(d.orders);
      setTxs(d.wallet);
    } catch {
      /* non-fatal */
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (sp.get("funded") === "1") {
      toast("Wallet funded successfully! 🎉");
      router.replace("/account?tab=wallet");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balance = useMemo(() => (me && me !== "loading" ? parseFloat(me.walletBalance || "0") : 0), [me]);

  const fundWallet = async () => {
    setFunding(true);
    try {
      const d = await api<{ redirectUrl: string; popup?: PaystackPopupConfig | null }>("/api/wallet/fund", {
        method: "POST",
        body: JSON.stringify({ amount: topUp }),
      });
      if (d.popup) {
        await openPaystackPopup(d.popup, {
          onSuccess: (ref) => {
            window.location.href = `/api/paystack/callback?reference=${encodeURIComponent(ref)}`;
          },
          onClose: () => {
            toast("Top-up window closed — no charge was made.", "err");
            setFunding(false);
          },
        });
        return;
      }
      if (d.redirectUrl.startsWith("http")) window.location.href = d.redirectUrl;
      else router.push(d.redirectUrl);
    } catch (e) {
      toast((e as Error).message, "err");
      setFunding(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const d = await api<{ user: Me }>("/api/account", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setMe(d.user);
      toast("Profile updated");
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setSavingProfile(false);
    }
  };

  if (me === "loading") {
    return (
      <div className="container-x grid min-h-[50vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!me) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "wallet", label: "Wallet" },
    { key: "orders", label: "Orders" },
    { key: "profile", label: "Profile" },
  ];

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Your space</p>
          <h1 className="section-title mt-1">Hey, {me.name.split(" ")[0]} 👋</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} className={cn("chip", tab === t.key && "chip-on")} onClick={() => router.replace(`/account?tab=${t.key}`)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {tab === "overview" && (
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="card relative overflow-hidden p-6">
            <div className="dot-grid absolute inset-0 opacity-50" aria-hidden />
            <p className="relative flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-mute uppercase">
              <IWallet size={15} className="text-brand-2" /> Wallet balance
            </p>
            <p className="relative mt-3 font-display text-4xl font-extrabold">{money(balance, currency)}</p>
            <p className="relative mt-1 text-xs text-mute">Store credit only · never expires</p>
            <button className="btn-brand relative mt-5 px-5 py-2.5 text-sm" onClick={() => router.replace("/account?tab=wallet")}>
              Top up <IArrowR size={14} />
            </button>
          </div>
          <div className="card p-6">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-mute uppercase">
              <IInbox size={15} className="text-brand" /> Total orders
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold">{orders?.length ?? "…"}</p>
            <p className="mt-1 text-xs text-mute">
              {orders?.filter((o) => o.status === "processing").length ?? 0} in progress ·{" "}
              {orders?.filter((o) => o.status === "completed").length ?? 0} completed
            </p>
            <button className="btn-outline mt-5 px-5 py-2.5 text-sm" onClick={() => router.replace("/account?tab=orders")}>
              View history <IArrowR size={14} />
            </button>
          </div>
          <div className="card p-6">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-mute uppercase">
              <IPencil size={15} className="text-brand" /> Delivery details
            </p>
            <p className="mt-3 text-sm font-semibold">{me.whatsapp || "No WhatsApp set"}</p>
            <p className="mt-1 line-clamp-2 text-sm text-mute">{me.address || "No address saved yet"}</p>
            <button className="btn-outline mt-5 px-5 py-2.5 text-sm" onClick={() => router.replace("/account?tab=profile")}>
              Edit profile <IArrowR size={14} />
            </button>
          </div>

          <div className="lg:col-span-3">
            <h2 className="font-display text-lg font-bold">Recent orders</h2>
            <div className="mt-3">
              <OrderList orders={(orders ?? []).slice(0, 3)} currency={currency} expanded={expanded} setExpanded={setExpanded} compact />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- WALLET ---------------- */}
      {tab === "wallet" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-paper dark:bg-raise">
              <div className="dot-grid absolute inset-0 opacity-60" aria-hidden />
              <p className="relative text-xs font-bold tracking-[0.18em] uppercase opacity-70">{siteName} wallet</p>
              <p className="relative mt-4 font-display text-5xl font-extrabold">{money(balance, currency)}</p>
              <p className="relative mt-2 text-xs opacity-70">Use it at checkout — one tap, no card form.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-display font-bold">Top up with Paystack</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[5000, 10000, 25000, 50000].map((v) => (
                  <button key={v} className={cn("chip justify-center", topUp === v && "chip-on")} onClick={() => setTopUp(v)}>
                    {money(v, currency)}
                  </button>
                ))}
              </div>
              <label className="label mt-4" htmlFor="topup-custom">Custom amount (min {money(500, currency)})</label>
              <input id="topup-custom" type="number" min={500} step={100} className="input" value={topUp} onChange={(e) => setTopUp(parseInt(e.target.value || "0", 10))} />
              <button className="btn-brand mt-4 w-full py-3" onClick={fundWallet} disabled={funding || topUp < 500}>
                {funding ? <Spinner className="h-5 w-5 text-brand-ink" /> : <IWallet size={17} />} Fund wallet
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-mute">
                Wallet balance is strictly store credit for purchases on {siteName}. It cannot be withdrawn or transferred.
              </p>
            </div>
          </div>

          <div className="card h-fit p-6">
            <h3 className="font-display font-bold">Transactions</h3>
            {txs === null ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : txs.length === 0 ? (
              <p className="mt-6 text-sm text-mute">No transactions yet — your top-ups and purchases will appear here.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {txs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-bold">{t.description}</p>
                      <p className="text-xs text-mute">{timeAgo(t.createdAt)}</p>
                    </div>
                    <span className={cn("font-display font-extrabold", t.type === "credit" ? "text-brand-2" : "text-red-500")}>
                      {t.type === "credit" ? "+" : "−"}{money(t.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ---------------- ORDERS ---------------- */}
      {tab === "orders" && (
        <div className="mt-8">
          <OrderList orders={orders ?? []} currency={currency} expanded={expanded} setExpanded={setExpanded} />
        </div>
      )}

      {/* ---------------- PROFILE ---------------- */}
      {tab === "profile" && (
        <div className="card mt-8 max-w-xl p-7">
          <h3 className="font-display text-lg font-bold">Delivery profile</h3>
          <p className="mt-1 text-sm text-mute">Prefilled at checkout; editable any time.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="pf-name">Full name</label>
              <input id="pf-name" className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pf-wa">WhatsApp number</label>
              <input id="pf-wa" className="input" value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="pf-addr">Default delivery address</label>
              <textarea id="pf-addr" className="input min-h-20" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
            <button className="btn-brand px-6 py-3" onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Spinner className="h-5 w-5 text-brand-ink" /> : null} Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderList({
  orders,
  currency,
  expanded,
  setExpanded,
  compact,
}: {
  orders: OrderView[];
  currency: string;
  expanded: number | null;
  setExpanded: (v: number | null) => void;
  compact?: boolean;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<IInbox size={26} />}
        title="No orders yet"
        body="When you place an order it lands here with live status tracking."
        action={<Link href="/shop" className="btn-brand px-5 py-2.5 text-sm">Start shopping</Link>}
      />
    );
  }
  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const open = expanded === o.id;
        return (
          <div key={o.id} className="card overflow-hidden">
            <button className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 p-5 text-left transition hover:bg-raise" onClick={() => setExpanded(open ? null : o.id)}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-bold">{o.orderNumber}</p>
                <p className="text-xs text-mute">
                  {timeAgo(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · {o.paymentMethod === "wallet" ? "Wallet" : "Paystack"}
                </p>
              </div>
              <StatusPill status={o.status} />
              <span className="font-display text-lg font-extrabold">{money(o.total, currency)}</span>
              <IChevR size={16} className={cn("text-mute transition-transform", open && "rotate-90")} />
            </button>
            {open && (
              <div className="animate-fade-up border-t border-line bg-raise/60 p-5">
                <ul className="space-y-3">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{it.name}</p>
                        <p className="text-xs text-mute">
                          Qty {it.qty}
                          {it.attributes?.length > 0 && ` · ${it.attributes.map((a) => a.value).join(", ")}`}
                        </p>
                        {it.fees?.length > 0 && (
                          <p className="text-[11px] text-mute">Fees: {it.fees.map((f) => `${f.feeName} (${money(f.feeAmount, currency)})`).join(", ")}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold">{money(it.lineTotal, currency)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 grid gap-x-8 gap-y-1 border-t border-line pt-4 text-xs text-mute sm:grid-cols-2">
                  <div className="flex justify-between sm:justify-start sm:gap-2"><dt className="font-bold">Subtotal:</dt><dd>{money(o.subtotal, currency)}</dd></div>
                  <div className="flex justify-between sm:justify-start sm:gap-2"><dt className="font-bold">Fees:</dt><dd>{money(o.feesTotal, currency)}</dd></div>
                  <div className="flex justify-between sm:justify-start sm:gap-2"><dt className="font-bold">Discount:</dt><dd>{o.discount > 0 ? `−${money(o.discount, currency)}${o.promoCode ? ` (${o.promoCode})` : ""}` : "—"}</dd></div>
                  <div className="flex justify-between sm:justify-start sm:gap-2"><dt className="font-bold">Processing fee:</dt><dd>{o.processingFee > 0 ? money(o.processingFee, currency) : "—"}</dd></div>
                  <div className="flex justify-between sm:justify-start sm:gap-2"><dt className="font-bold">Reference:</dt><dd className="truncate font-mono">{o.paystackRef ?? "—"}</dd></div>
                  <div className="flex justify-between sm:col-span-2 sm:justify-start sm:gap-2"><dt className="font-bold">Deliver to:</dt><dd>{o.customerAddress} · WA: {o.customerWhatsapp}</dd></div>
                </dl>
                {compact && (
                  <Link href="/account?tab=orders" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand">
                    All orders <IArrowR size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
