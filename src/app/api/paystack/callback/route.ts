import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users, walletTransactions } from "@/db/schema";
import { verifyPaystack } from "@/lib/paystack";
import { decrementStock, markPromoUsed } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Paystack redirect callback. Verifies the transaction server-side, then:
 *  - order  → marks it paid (processing), decrements stock, bumps promo usage
 *  - wallet → credits the user's wallet exactly once (idempotent by reference)
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
  const targetId = result.metadata?.targetId ?? 0;

  if (type === "order" && targetId) {
    const [order] = await db.select().from(orders).where(eq(orders.id, targetId)).limit(1);
    if (order && order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "processing", paystackRef: reference })
        .where(eq(orders.id, order.id));
      await decrementStock(order.items as { productId: number; qty: number }[]);
      await markPromoUsed(order.promoCode);
    }
    base.pathname = "/checkout/success";
    base.searchParams.set("status", "paid");
    if (order) base.searchParams.set("order", order.orderNumber);
    base.searchParams.set("ref", reference);
    return NextResponse.redirect(base);
  }

  if (type === "wallet" && targetId) {
    /* Idempotency: never credit the same reference twice. */
    const [dup] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.paystackRef, reference))
      .limit(1);
    if (!dup) {
      const amount = result.amountNaira;
      const [user] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (user && amount > 0) {
        await db
          .update(users)
          .set({ walletBalance: sql`${users.walletBalance}::numeric + ${amount}` })
          .where(eq(users.id, user.id));
        await db.insert(walletTransactions).values({
          userId: user.id,
          type: "credit",
          amount: String(amount),
          description: "Wallet top-up via Paystack",
          paystackRef: reference,
        });
      }
    }
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
