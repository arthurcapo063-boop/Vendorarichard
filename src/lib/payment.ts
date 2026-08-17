import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, users, walletTransactions } from "@/db/schema";
import { decrementStock, markPromoUsed } from "@/lib/pricing";
import type { VerifyResult } from "@/lib/paystack";

/**
 * Apply a verified Paystack payment to the store:
 *  - order  → marks it paid (processing), decrements stock, bumps promo usage
 *  - wallet → credits the user's wallet exactly once (idempotent by reference)
 *
 * Shared by the browser redirect callback AND the Paystack webhook, so a payment
 * is always processed even if the browser never completes the return redirect.
 */
export async function processSuccessfulPayment(result: VerifyResult): Promise<{ type: string; targetId: number }> {
  const type = result.metadata?.type ?? "";
  const targetId = result.metadata?.targetId ?? 0;

  if (type === "order" && targetId) {
    const [order] = await db.select().from(orders).where(eq(orders.id, targetId)).limit(1);
    if (order && order.status === "pending") {
      await db
        .update(orders)
        .set({ status: "processing", paystackRef: result.reference })
        .where(eq(orders.id, order.id));
      await decrementStock(order.items as { productId: number; qty: number }[]);
      await markPromoUsed(order.promoCode);
    }
    return { type, targetId };
  }

  if (type === "wallet" && targetId) {
    /* Idempotency: never credit the same reference twice. */
    const [dup] = await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.paystackRef, result.reference))
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
          paystackRef: result.reference,
        });
      }
    }
    return { type, targetId };
  }

  return { type, targetId };
}
