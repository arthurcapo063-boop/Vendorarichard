"use client";

export interface PaystackPopupConfig {
  key: string;
  email: string;
  amountKobo: number;
  reference: string;
  currency: string;
  subaccount: string;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (opts: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

function loadPaystackInline(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.PaystackPop) return resolve();
    const existing = document.getElementById("paystack-inline-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load Paystack checkout.")));
      return;
    }
    const s = document.createElement("script");
    s.id = "paystack-inline-js";
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack checkout."));
    document.head.appendChild(s);
  });
}

/**
 * Open the Paystack inline popup. `onSuccess` fires in the browser the moment
 * the customer completes payment — no dependency on a redirect URL, so the
 * customer is never left stranded on Paystack's page.
 */
export async function openPaystackPopup(
  cfg: PaystackPopupConfig,
  callbacks: { onSuccess: (ref: string) => void; onClose: () => void }
): Promise<void> {
  await loadPaystackInline();
  if (!window.PaystackPop) throw new Error("Paystack checkout is unavailable right now.");
  const handler = window.PaystackPop.setup({
    key: cfg.key,
    email: cfg.email,
    amount: cfg.amountKobo,
    currency: cfg.currency,
    ref: cfg.reference,
    subaccount: cfg.subaccount,
    callback: (response: { reference?: string }) => callbacks.onSuccess(response?.reference ?? cfg.reference),
    onClose: () => callbacks.onClose(),
  });
  handler.openIframe();
}
