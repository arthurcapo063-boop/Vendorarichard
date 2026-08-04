import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  products,
  productAttributes,
  productFees,
  promoCodes,
  type OrderItemSnapshot,
} from "@/db/schema";
import { num, isSoldOut, HttpError } from "./utils";

export interface CartLineInput {
  productId: number;
  qty: number;
  attributeIds?: number[];
}

export interface QuoteLine extends OrderItemSnapshot {
  slug: string;
  stockQty: number | null;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  feesTotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  promoError: string | null;
}

/**
 * Server-side price computation — the single source of truth for cart
 * totals, checkout and promo validation. Never trust client prices.
 */
export async function computeQuote(
  items: CartLineInput[],
  promoCodeInput?: string | null
): Promise<Quote> {
  if (!items.length) throw new HttpError(400, "Your cart is empty.");

  const lines: QuoteLine[] = [];
  let subtotal = 0;
  let feesTotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Math.floor(num(item.qty)));
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, num(item.productId)))
      .limit(1);
    if (!product || !product.isActive) {
      throw new HttpError(400, "An item in your cart is no longer available.");
    }
    if (isSoldOut(product.stockQty)) {
      throw new HttpError(400, `“${product.name}” is sold out.`);
    }
    if (product.stockQty !== null && qty > product.stockQty) {
      throw new HttpError(400, `Only ${product.stockQty} unit(s) of “${product.name}” left.`);
    }

    const unitPrice = num(product.salePrice ?? product.basePrice);

    const attrs: { name: string; value: string; priceDelta: number }[] = [];
    if (item.attributeIds?.length) {
      const rows = await db
        .select()
        .from(productAttributes)
        .where(
          and(
            eq(productAttributes.productId, product.id),
            inArray(productAttributes.id, item.attributeIds.map((x) => num(x)))
          )
        );
      for (const a of rows) {
        attrs.push({ name: a.name, value: a.value, priceDelta: num(a.priceDelta) });
      }
    }

    const feeRows = await db
      .select()
      .from(productFees)
      .where(eq(productFees.productId, product.id));
    const fees = feeRows.map((f) => ({ feeName: f.feeName, feeAmount: num(f.feeAmount) }));

    const attrDelta = attrs.reduce((s, a) => s + a.priceDelta, 0);
    const feeSum = fees.reduce((s, f) => s + f.feeAmount, 0);
    const lineTotal = (unitPrice + attrDelta + feeSum) * qty;

    subtotal += (unitPrice + attrDelta) * qty;
    feesTotal += feeSum * qty;

    lines.push({
      productId: product.id,
      name: product.name,
      image: (product.images as string[])[0] ?? "",
      slug: product.slug,
      qty,
      unitPrice,
      attributes: attrs,
      fees,
      lineTotal,
      stockQty: product.stockQty,
    });
  }

  /* Promo validation */
  let discount = 0;
  let promoCode: string | null = null;
  let promoError: string | null = null;
  const code = (promoCodeInput ?? "").trim().toUpperCase();
  if (code) {
    const [promo] = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, code))
      .limit(1);
    if (!promo || !promo.isActive) {
      promoError = "That promo code doesn't exist or is inactive.";
    } else if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
      promoError = "That promo code has expired.";
    } else if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      promoError = "That promo code has been fully redeemed.";
    } else if (subtotal < num(promo.minSubtotal)) {
      promoError = `This code needs a subtotal of at least ₦${num(promo.minSubtotal).toLocaleString()}.`;
    } else {
      promoCode = promo.code;
      discount =
        promo.type === "percent"
          ? Math.round(subtotal * (num(promo.value) / 100))
          : Math.min(num(promo.value), subtotal);
    }
  }

  const total = Math.max(0, subtotal + feesTotal - discount);
  return { lines, subtotal, feesTotal, discount, total, promoCode, promoError };
}

/** Reduce stock for paid items; items hitting zero become Sold Out automatically. */
export async function decrementStock(items: { productId: number; qty: number }[]): Promise<void> {
  for (const line of items) {
    const [p] = await db.select().from(products).where(eq(products.id, line.productId)).limit(1);
    if (p && p.stockQty !== null) {
      await db
        .update(products)
        .set({ stockQty: Math.max(0, p.stockQty - line.qty) })
        .where(eq(products.id, line.productId));
    }
  }
}

/** Re-stock items (used when an order is cancelled from the Admin Panel). */
export async function incrementStock(items: { productId: number; qty: number }[]): Promise<void> {
  for (const line of items) {
    const [p] = await db.select().from(products).where(eq(products.id, line.productId)).limit(1);
    if (p && p.stockQty !== null) {
      await db
        .update(products)
        .set({ stockQty: p.stockQty + line.qty })
        .where(eq(products.id, line.productId));
    }
  }
}

export async function markPromoUsed(code: string | null): Promise<void> {
  if (!code) return;
  await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(eq(promoCodes.code, code));
}

