import crypto from "crypto";
import { verifyPaystack, paystackEnabled } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/payment";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook. Paystack POSTs lifecycle events here (configure the URL as
 * <your-domain>/api/paystack/webhook in the Paystack dashboard → Settings →
 * API Keys & Webhooks). On `charge.success` we verify the transaction and apply
 * it — so payments are recorded reliably even if the customer never completes
 * the browser redirect back to the store.
 */
export async function POST(req: Request) {
  const raw = await req.text().catch(() => "");

  /* Verify the Paystack signature to reject forged webhooks. */
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers.get("x-paystack-signature");
  if (secret && signature) {
    const expected = crypto.createHmac("sha512", secret).update(raw, "utf8").digest("hex");
    if (expected !== signature) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return new Response("OK", { status: 200 });
  }

  if (body.event === "charge.success" && paystackEnabled()) {
    const reference = body.data?.reference;
    if (reference) {
      const result = await verifyPaystack(reference);
      if (result.success) {
        try {
          await processSuccessfulPayment(result);
        } catch (e) {
          console.error("webhook payment processing error", e);
        }
      }
    }
  }

  /* Always 200 so Paystack stops retrying once handled. */
  return new Response("OK", { status: 200 });
}
