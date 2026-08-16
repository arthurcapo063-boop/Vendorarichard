/**
 * Paystack integration.
 * - With PAYSTACK_SECRET_KEY set: real transactions via the Paystack REST API.
 * - Without a key: demo mode — generates local references that the callback
 *   route auto-approves, so the full purchase flow stays testable.
 *
 * Split payments: when a subaccount is configured in the admin panel, every
 * Paystack payment is split so that PAYSTACK_SUBACCOUNT_PERCENTAGE (default 3)
 * stays in the main account and the remainder (default 97) settles directly to
 * the subaccount. This works through Paystack's `subaccount` param on
 * transaction/initialize plus the subaccount's stored `percentage_charge`.
 */

import { getSettings } from "@/lib/settings";

const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackEnabled(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function paystackPublicKey(): string {
  return (process.env.PAYSTACK_PUBLIC_KEY ?? "").trim();
}

/** Percentage of each payment that stays in the main (owner) account. The rest
 *  (100 − this) goes to the configured subaccount. Default 3 ⇒ 97% to sub. */
export function paystackPercentage(): number {
  const v = Number(process.env.PAYSTACK_SUBACCOUNT_PERCENTAGE);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : 3;
}

/** Read the currently configured subaccount code from the settings row ("" if none). */
export async function currentSubaccountCode(): Promise<string> {
  try {
    const s = await getSettings();
    return s.subaccountCode ?? "";
  } catch {
    return "";
  }
}

/** Resolve a human-readable bank name to a Paystack bank code (GHS). */
export async function resolvePaystackBank(bankName: string, currency = "GHS"): Promise<{ code: string; name: string } | null> {
  if (!paystackEnabled()) return null;
  const res = await fetch(`${PAYSTACK_BASE}/bank?currency=${encodeURIComponent(currency)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    throw new Error(data.message || "Paystack could not load the bank list.");
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const target = norm(bankName);
  const banks = (data.data ?? []) as { name?: string; slug?: string; code?: string; longcode?: string }[];
  const found = banks.find(
    (b) => norm(b.name ?? "") === target || norm(b.slug ?? "") === target || norm(b.longcode ?? "") === target
  );
  return found ? { code: String(found.code ?? found.longcode ?? ""), name: found.name ?? "" } : null;
}

/** Verify an account number + bank code and return the registered account name. */
export async function resolvePaystackAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string } | null> {
  if (!paystackEnabled() || !accountNumber || !bankCode) return null;
  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );
  const data = await res.json();
  if (!res.ok || data.status !== true) return null;
  return data.data ? { account_name: String(data.data.account_name ?? "") } : null;
}

/**
 * Create (or update, when `existingCode` is provided) the Paystack subaccount
 * that receives the bulk of each payment. Returns its `subaccount_code`.
 */
export async function syncPaystackSubaccount(opts: {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  percentageCharge?: number;
  existingCode?: string | null;
}): Promise<{ subaccountCode: string }> {
  const pct = opts.percentageCharge ?? paystackPercentage();
  const existing = opts.existingCode?.trim();
  const payload: Record<string, unknown> = {
    business_name: opts.accountName,
    account_number: opts.accountNumber,
    percentage_charge: pct,
  };
  // Create endpoint uses `settlement_bank`; update endpoint uses `bank_code`.
  payload[existing ? "bank_code" : "settlement_bank"] = opts.bankCode;
  const res = await fetch(existing ? `${PAYSTACK_BASE}/subaccount/${encodeURIComponent(existing)}` : `${PAYSTACK_BASE}/subaccount`, {
    method: existing ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    throw new Error(data.message || "Paystack could not sync the subaccount.");
  }
  return { subaccountCode: String(data.data.subaccount_code ?? "") };
}

export interface InitResult {
  reference: string;
  authorizationUrl: string;
  demo: boolean;
  popup: {
    key: string;
    email: string;
    amountKobo: number;
    reference: string;
    currency: string;
    subaccount: string;
  } | null;
}

export async function initPaystack(opts: {
  email: string;
  amountNaira: number;
  type: "order" | "wallet";
  targetId: number;
  callbackPath: string; // e.g. "/api/paystack/callback"
  origin: string; // e.g. "https://mysite.com"
}): Promise<InitResult> {
  const amountKobo = Math.round(opts.amountNaira * 100);
  const callbackUrl = `${opts.origin}${opts.callbackPath}`;

  if (!paystackEnabled()) {
    const reference = `demo-${opts.type}-${opts.targetId}-${amountKobo}-${Date.now().toString(36)}`;
    return {
      reference,
      authorizationUrl: `${callbackUrl}?reference=${encodeURIComponent(reference)}`,
      demo: true,
      popup: null,
    };
  }

  const subaccount = await currentSubaccountCode();
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: amountKobo,
      currency: "GHS",
      callback_url: callbackUrl,
      ...(subaccount ? { subaccount } : {}),
      metadata: { type: opts.type, targetId: opts.targetId, amountKobo, subaccount: subaccount || null },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    throw new Error(data.message || "Paystack failed to initialize the transaction.");
  }
  const reference = data.data.reference as string;
  const key = paystackPublicKey();
  return {
    reference,
    authorizationUrl: data.data.authorization_url as string,
    demo: false,
    popup: key
      ? {
          key,
          email: opts.email,
          amountKobo,
          reference,
          currency: "GHS",
          subaccount,
        }
      : null,
  };
}

export interface VerifyResult {
  success: boolean;
  reference: string;
  amountNaira: number;
  metadata: { type?: string; targetId?: number; amountKobo?: number } | null;
  demo: boolean;
}

export async function verifyPaystack(reference: string): Promise<VerifyResult> {
  if (reference.startsWith("demo-")) {
    const parts = reference.split("-");
    return {
      success: true,
      reference,
      amountNaira: (parseInt(parts[3], 10) || 0) / 100,
      metadata: { type: parts[1], targetId: parseInt(parts[2], 10) || 0 },
      demo: true,
    };
  }
  if (!paystackEnabled()) {
    return { success: false, reference, amountNaira: 0, metadata: null, demo: false };
  }
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    return { success: false, reference, amountNaira: 0, metadata: null, demo: false };
  }
  return {
    success: data.data.status === "success",
    reference,
    amountNaira: (data.data.amount ?? 0) / 100,
    metadata: (data.data.metadata as VerifyResult["metadata"]) ?? null,
    demo: false,
  };
}
