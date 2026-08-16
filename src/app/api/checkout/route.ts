import { db } from "@/db";
import { orders, walletTransactions, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { computeQuote, decrementStock, markPromoUsed, type CartLineInput } from "@/lib/pricing";
import { initPaystack, paystackEnabled } from "@/lib/paystack";
import { err, json, HttpError, num, orderNumber } from "@/lib/utils";
import { resolveSiteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const items = (Array.isArray(body.items) ? body.items : []) as CartLineInput[];
    const payWith = body.payWith === "wallet" ? "wallet" : "paystack";
    const customer = {
      name: String(body.customer?.name ?? "").trim(),
      email: String(body.customer?.email ?? "").trim().toLowerCase(),
      whatsapp: String(body.customer?.whatsapp ?? "").trim(),
      address: String(body.customer?.address ?? "").trim(),
    };

    const user = await getCurrentUser();

    /* Guest checkout is active — but WhatsApp + delivery address are mandatory. */
    if (customer.name.length < 2) throw new HttpError(400, "Enter the recipient's full name.");
    if (!EMAIL_RE.test(customer.email)) throw new HttpError(400, "Enter a valid email address.");
    if (customer.whatsapp.replace(/\D/g, "").length < 7) {
      throw new HttpError(400, "A valid WhatsApp number is required before payment.");
    }
    if (customer.address.length < 8) {
      throw new HttpError(400, "A delivery address is required before payment.");
    }

    const quote = await computeQuote(items, body.promoCode ?? null);
    if (quote.promoCode && quote.promoError) throw new HttpError(400, quote.promoError);
    if (quote.total <= 0) throw new HttpError(400, "Nothing to pay — your cart is empty.");

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: orderNumber(),
        userId: user?.id ?? null,
        customerName: customer.name,
        customerEmail: customer.email,
        customerWhatsapp: customer.whatsapp,
        customerAddress: customer.address,
        items: quote.lines.map(({ slug: _s, stockQty: _st, ...rest }) => rest),
        subtotal: String(quote.subtotal),
        feesTotal: String(quote.feesTotal),
        discount: String(quote.discount),
        processingFee: String(quote.processingFee),
        total: String(quote.total),
        promoCode: quote.promoCode,
        paymentMethod: payWith,
        status: "pending",
      })
      .returning();

    /* ---------- Wallet payment (logged-in users only) ---------- */
    if (payWith === "wallet") {
      if (!user) throw new HttpError(401, "Sign in to pay with your wallet.");
      if (num(user.walletBalance) < quote.total) {
        throw new HttpError(
          402,
          `Your wallet balance (GH₵${num(user.walletBalance).toLocaleString()}) can't cover GH₵${quote.total.toLocaleString()}. Top up or pay with Paystack.`
        );
      }
      await db
        .update(users)
        .set({ walletBalance: sql`${users.walletBalance}::numeric - ${quote.total}` })
        .where(eq(users.id, user.id));
      await db.insert(walletTransactions).values({
        userId: user.id,
        type: "debit",
        amount: String(quote.total),
        description: `Payment for order ${order.orderNumber}`,
      });
      await db.update(orders).set({ status: "processing" }).where(eq(orders.id, order.id));
      await decrementStock(quote.lines);
      await markPromoUsed(quote.promoCode);
      return json({
        orderNumber: order.orderNumber,
        paidWithWallet: true,
        demo: !(await paystackEnabled()),
        redirectUrl: `/checkout/success?order=${order.orderNumber}`,
      });
    }

    /* ---------- Paystack payment ---------- */
    const origin = await resolveSiteOrigin();
    const init = await initPaystack({
      email: customer.email,
      amountNaira: quote.total,
      type: "order",
      targetId: order.id,
      callbackPath: "/api/paystack/callback",
      origin,
    });
    await db
      .update(orders)
      .set({ paystackRef: init.reference })
      .where(eq(orders.id, order.id));

    return json({
      orderNumber: order.orderNumber,
      redirectUrl: init.authorizationUrl,
      demo: init.demo,
      popup: init.popup,
    });
  } catch (e) {
    return err(e);
  }
}
