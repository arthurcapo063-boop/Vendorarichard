"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./providers";
import { cartLineTotal, type CartItem } from "@/lib/types";
import { money } from "@/lib/utils";
import { QtyPicker, EmptyState } from "./ui";
import { IArrowR, ICart, ITrash } from "./icons";

function lineSubtotal(i: CartItem) {
  const attrDelta = i.attributes.reduce((s, a) => s + a.priceDelta, 0);
  return (i.unitPrice + attrDelta) * i.qty;
}

export function CartDrawer({ currency, siteName }: { currency: string; siteName: string }) {
  const { items, drawerOpen, setDrawerOpen, setQty, remove, estimate } = useCart();
  const router = useRouter();

  const subtotal = items.reduce((s, i) => s + lineSubtotal(i), 0);
  const fees = estimate - subtotal;

  return (
    <div className={`fixed inset-0 z-[70] ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <button
        aria-label="Close cart"
        onClick={() => setDrawerOpen(false)}
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">
            Your cart <span className="text-mute">({items.length})</span>
          </h2>
          <button onClick={() => setDrawerOpen(false)} className="btn-outline h-9 w-9 rounded-full" aria-label="Close">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto slim-scroll px-5 py-4">
          {items.length === 0 ? (
            <EmptyState
              icon={<ICart size={26} />}
              title="Nothing in here yet"
              body={`The ${siteName} market is stacked — go find something loud.`}
              action={
                <Link href="/shop" onClick={() => setDrawerOpen(false)} className="btn-brand px-5 py-2.5 text-sm">
                  Browse products <IArrowR size={15} />
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.key} className="animate-fade-up flex gap-3 rounded-2xl border border-line bg-raise p-3">
                  <Link href={`/product/${i.slug}`} onClick={() => setDrawerOpen(false)} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image} alt={i.name} className="h-20 w-20 rounded-xl object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${i.slug}`} onClick={() => setDrawerOpen(false)} className="truncate text-sm font-bold hover:text-brand">
                        {i.name}
                      </Link>
                      <button onClick={() => remove(i.key)} className="text-mute transition hover:text-red-500" aria-label={`Remove ${i.name}`}>
                        <ITrash size={15} />
                      </button>
                    </div>
                    {i.attributes.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-mute">
                        {i.attributes.map((a) => `${a.name}: ${a.value}`).join(" · ")}
                      </p>
                    )}
                    {i.fees.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-mute">
                        + {i.fees.map((f) => f.feeName).join(", ")}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <QtyPicker small qty={i.qty} onChange={(q) => setQty(i.key, q)} />
                      <span className="font-display text-sm font-bold">{money(cartLineTotal(i), currency)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-5 py-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-mute"><dt>Subtotal</dt><dd className="font-semibold text-ink">{money(subtotal, currency)}</dd></div>
              {fees > 0 && (
                <div className="flex justify-between text-mute"><dt>Item fees</dt><dd className="font-semibold text-ink">{money(fees, currency)}</dd></div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-line text-base font-bold">
                <dt>Estimated total</dt>
                <dd className="font-display text-brand">{money(estimate, currency)}</dd>
              </div>
            </dl>
            <p className="mt-1.5 text-[11px] text-mute">Promo codes are applied at checkout.</p>
            <button
              className="btn-brand mt-3 w-full py-3"
              onClick={() => {
                setDrawerOpen(false);
                router.push("/checkout");
              }}
            >
              Proceed to checkout <IArrowR size={16} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
