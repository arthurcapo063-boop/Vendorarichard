/**
 * Paystack integration.
 * - With PAYSTACK_SECRET_KEY set: real transactions via the Paystack REST API.
 * - Without a key: demo mode — generates local references that the callback
 *   route auto-approves, so the full purchase flow stays testable.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackEnabled(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export interface InitResult {
  reference: string;
  authorizationUrl: string;
  demo: boolean;
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
    };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: amountKobo,
      currency: "NGN",
      callback_url: callbackUrl,
      metadata: { type: opts.type, targetId: opts.targetId, amountKobo },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== true) {
    throw new Error(data.message || "Paystack failed to initialize the transaction.");
  }
  return {
    reference: data.data.reference as string,
    authorizationUrl: data.data.authorization_url as string,
    demo: false,
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
