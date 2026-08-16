import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyPaystack } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/payment";

export const dynamic = "force-dynamic";

/**
 * Paystack browser redirect callback. Verifies the transaction server-side and
 * applies it. (Payments are ALSO processed by /api/paystack/webhook, so a sale
 * is still recorded even if the browser never lands here.)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? "";
  const base = new URL("/", url.origin);

  if (!reference) {
    base.pathname = "/checkout";
    base.searchParams.set("error", "missing-reference");
    return NextResponse.redirect(base);
  }

  const result = await verifyPaystack(reference);
  if (!result.success) {
    base.pathname = "/checkout/success";
    base.searchParams.set("status", "failed");
    base.searchParams.set("ref", reference);
    return NextResponse.redirect(base);
  }

  const type = result.metadata?.type ?? (reference.startsWith("demo-order") ? "order" : reference.startsWith("demo-wallet") ? "wallet" : "");
  const { targetId } = await processSuccessfulPayment(result);

  if (type === "order" && targetId) {
    const [order] = await db.select().from(orders).where(eq(orders.id, targetId)).limit(1);
    base.pathname = "/checkout/success";
    base.searchParams.set("status", "paid");
    if (order) base.searchParams.set("order", order.orderNumber);
    base.searchParams.set("ref", reference);
    return NextResponse.redirect(base);
  }

  if (type === "wallet" && targetId) {
    base.pathname = "/account";
    base.searchParams.set("tab", "wallet");
    base.searchParams.set("funded", "1");
    return NextResponse.redirect(base);
  }

  base.pathname = "/checkout/success";
  base.searchParams.set("status", "failed");
  base.searchParams.set("ref", reference);
  return NextResponse.redirect(base);
}
