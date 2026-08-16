"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { money, cn } from "@/lib/utils";
import { useCart, useToast } from "@/components/providers";
import { EmptyState, Spinner } from "@/components/ui";
import { ICart, IShield, IWallet, IWhatsApp, ITag } from "@/components/icons";
import { waLink } from "@/lib/client";

interface QuoteView {
  subtotal: number;
  feesTotal: number;
  discount: number;
  processingFee: number;
  processingFeePercent: number;
  chargeProcessingFee: boolean;
  total: number;
  promoCode: string | null;
  promoError: string | null;
}

interface MeUser {
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  walletBalance: string;
  role: string;
}

function estimateItem(i: { unitPrice: number; qty: number; attributes: { priceDelta: number }[]; fees: { feeAmount: number }[] }) {
  const attrDelta = i.attributes.reduce((s, a) => s + a.priceDelta, 0);
  const feeSum = i.fees.reduce((s, f) => s + f.feeAmount, 0);
  return (i.unitPrice + attrDelta + feeSum) * i.qty;
}

export function CheckoutClient({ currency, siteName, whatsappNumber }: { currency: string; siteName: string; whatsappNumber: string }) {
  const { items, clear } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<MeUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", address: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteView | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [payWith, setPayWith] = useState<"paystack" | "wallet">("paystack");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api<{ user: MeUser | null }>("/api/auth/me")
      .then((d) => {
        setUser(d.user);
        if (d.user) {
          setForm((f) => ({
            name: d.user!.name || f.name,
            email: d.user!.email || f.email,
            whatsapp: d.user!.whatsapp || f.whatsapp,
            address: d.user!.address || f.address,
          }));
        }
      })
      .catch(() => setUser(null));
  }, []);

  const payloadItems = useMemo(
    () => items.map((i) => ({ productId: i.productId, qty: i.qty, attributeIds: i.attributeIds })),
    [items]
  );

  /* live server-side quote: validates stock, computes fees, applies promo */
  useEffect(() => {
    if (!items.length) return;
    let alive = true;
    setQuoteErr(null);
    api<{ quote: QuoteView }>("/api/cart/quote", {
      method: "POST",
      body: JSON.stringify({ items: payloadItems, promoCode: promo }),
    })
      .then((d) => {
        if (alive) setQuote(d.quote);
      })
      .catch((e: Error) => {
        if (alive) setQuoteErr(e.message);
      });
    return () => {
      alive = false;
    };
  }, [payloadItems, promo, items.length]);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromo(code);
  };

  const walletBalance = user ? parseFloat(user.walletBalance || "0") : 0;

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const d = await api<{ redirectUrl: string; paidWithWallet?: boolean }>(
        "/api/checkout",
        {
          method: "POST",
          body: JSON.stringify({ items: payloadItems, promoCode: promo, payWith, customer: form }),
        }
      );
      clear();
      if (d.redirectUrl.startsWith("http")) window.location.href = d.redirectUrl;
      else router.push(d.redirectUrl);
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-x py-16">
        <h1 className="section-title">Checkout</h1>
        <div className="mt-6">
          <EmptyState
            icon={<ICart size={26} />}
            title="Your cart is empty"
            body="Add something from the market first — checkout takes under a minute once you do."
            action={<Link href="/shop" className="btn-brand px-5 py-2.5 text-sm">Browse products</Link>}
          />
        </div>
      </div>
    );
  }

  const q = quote;
  const insufficientWallet = payWith === "wallet" && q !== null && walletBalance < q.total;

  return (
    <div className="container-x py-10">
      <p className="section-kicker">Almost yours</p>
      <h1 className="section-title mt-1">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-lg font-bold">1 · Review items</h2>
            <ul className="mt-4 divide-y divide-line">
              {items.map((i) => (
                <li key={i.key} className="flex items-center gap-4 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.image} alt={i.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.slug}`} className="block truncate text-sm font-bold hover:text-brand">{i.name}</Link>
                    <p className="text-xs text-mute">
                      Qty {i.qty}
                      {i.attributes.length > 0 && ` · ${i.attributes.map((a) => a.value).join(", ")}`}
                      {i.fees.length > 0 && ` · +${i.fees.length} fee${i.fees.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold">{money(estimateItem(i), currency)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-bold">2 · Delivery & contact</h2>
            {!user && (
              <p className="mt-2 rounded-xl bg-brand-soft px-4 py-2.5 text-xs font-semibold text-brand">
                Checking out as a guest. <Link href="/auth/login" className="underline">Sign in</Link> to track this order and use your wallet — or continue with your WhatsApp number and delivery address below.
              </p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="co-name">Full name</label>
                <input id="co-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Adaeze Okafor" />
              </div>
              <div>
                <label className="label" htmlFor="co-email">Email</label>
                <input id="co-email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
              </div>
              <div>
                <label className="label" htmlFor="co-wa">WhatsApp number <span className="text-brand">*</span></label>
                <input id="co-wa" className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="2348012345678" />
              </div>
              <div>
                <label className="label" htmlFor="co-addr">Delivery address <span className="text-brand">*</span></label>
                <input id="co-addr" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, state" />
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-bold">3 · Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayWith("paystack")}
                className={cn("rounded-2xl border-2 p-4 text-left transition", payWith === "paystack" ? "border-brand bg-brand-soft" : "border-line hover:border-mute")}
                aria-pressed={payWith === "paystack"}
              >
                <span className="flex items-center gap-2 font-bold"><IShield size={18} className="text-brand" /> Card · Paystack</span>
                <span className="mt-1 block text-xs text-mute">Visa, Mastercard, Verve, bank transfer & USSD.</span>
              </button>
              <button
                type="button"
                onClick={() => setPayWith("wallet")}
                disabled={!user}
                className={cn("rounded-2xl border-2 p-4 text-left transition disabled:opacity-45", payWith === "wallet" ? "border-brand-2 bg-brand-2-soft" : "border-line hover:border-mute")}
                aria-pressed={payWith === "wallet"}
              >
                <span className="flex items-center gap-2 font-bold"><IWallet size={18} className="text-brand-2" /> Wallet balance</span>
                <span className="mt-1 block text-xs text-mute">
                  {user ? `Balance: ${money(walletBalance, currency)} — store credit only, never withdrawable.` : "Sign in to pay with your wallet."}
                </span>
              </button>
            </div>
            {insufficientWallet && (
              <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-500">
                Your wallet can't cover this order. Top up from your dashboard or switch to card payment.
              </p>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          <section className="card p-6">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <div className="mt-4 flex gap-2">
              <input
                className="input flex-1 uppercase"
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                aria-label="Promo code"
              />
              <button className="btn-dark px-5 text-sm" onClick={applyPromo}><ITag size={15} /> Apply</button>
            </div>
            {q?.promoCode && <p className="mt-2 text-xs font-bold text-brand-2">✓ {q.promoCode} applied</p>}
            {q?.promoError && promo && <p className="mt-2 text-xs font-bold text-red-500">{q.promoError}</p>}

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd className="font-semibold text-ink">{q ? money(q.subtotal, currency) : "…"}</dd></div>
              <div className="flex justify-between text-mute"><dt>Custom item fees</dt><dd className="font-semibold text-ink">{q ? money(q.feesTotal, currency) : "…"}</dd></div>
              <div className="flex justify-between text-mute">
                <dt>Discount</dt>
                <dd className={cn("font-semibold", q && q.discount > 0 ? "text-brand-2" : "text-ink")}>
                  {q ? (q.discount > 0 ? `−${money(q.discount, currency)}` : money(0, currency)) : "…"}
                </dd>
              </div>
              {q?.chargeProcessingFee && (
                <div className="flex justify-between text-mute">
                  <dt>Processing fee ({q.processingFeePercent}%)</dt>
                  <dd className="font-semibold text-ink">{q ? money(q.processingFee, currency) : "…"}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
                <dt>Total due</dt>
                <dd className="font-display text-xl text-brand">{q ? money(q.total, currency) : "…"}</dd>
              </div>
            </dl>

            {quoteErr && <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-500">{quoteErr}</p>}

            <button
              className="btn-brand mt-5 w-full py-3.5 text-base"
              onClick={placeOrder}
              disabled={placing || !!quoteErr || insufficientWallet || !q}
            >
              {placing ? (
                <><Spinner className="h-5 w-5 text-brand-ink" /> Processing…</>
              ) : payWith === "wallet" ? (
                `Pay ${q ? money(q.total, currency) : ""} from wallet`
              ) : (
                "Pay securely with Paystack"
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-mute">
              <IShield size={13} /> Encrypted · totals verified server-side before dispatch
            </p>
          </section>

          <a
            href={waLink(whatsappNumber, `Hello ${siteName}! I need help with my checkout.`)}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-5 text-sm font-semibold text-mute transition hover:text-ink"
          >
            <IWhatsApp size={22} className="shrink-0 text-[#25D366]" />
            Stuck on checkout? Get a human on WhatsApp in minutes.
          </a>
        </aside>
      </div>
    </div>
  );
}
