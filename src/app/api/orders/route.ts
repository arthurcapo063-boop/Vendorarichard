import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, walletTransactions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { err, json, num } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const withWallet = url.searchParams.get("wallet") === "1";

    const list = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const out = list.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      items: o.items,
      subtotal: num(o.subtotal),
      feesTotal: num(o.feesTotal),
      discount: num(o.discount),
      processingFee: num(o.processingFee),
      total: num(o.total),
      promoCode: o.promoCode,
      paymentMethod: o.paymentMethod,
      paystackRef: o.paystackRef,
      status: o.status,
      customerAddress: o.customerAddress,
      customerWhatsapp: o.customerWhatsapp,
      createdAt: o.createdAt.toISOString(),
    }));

    if (withWallet) {
      const txs = await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, user.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(100);
      return json({
        orders: out,
        wallet: txs.map((t) => ({
          id: t.id,
          type: t.type,
          amount: num(t.amount),
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      });
    }
    return json({ orders: out });
  } catch (e) {
    return err(e);
  }
}
