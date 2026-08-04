import { notFound } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, productAttributes, productFees, products } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { num, isSoldOut } from "@/lib/utils";
import type { ProductLite } from "@/lib/types";
import { ProductDetailClient } from "./product-client";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSettings();

  const [p] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);
  if (!p) notFound();

  const [attrs, fees, cat] = await Promise.all([
    db.select().from(productAttributes).where(eq(productAttributes.productId, p.id)),
    db.select().from(productFees).where(eq(productFees.productId, p.id)),
    db.select().from(categories).where(eq(categories.id, p.categoryId)).limit(1),
  ]);

  const relatedRows = await db
    .select({
      p: products,
      hasOptions: sql<boolean>`exists(select 1 from product_attributes pa where pa.product_id = ${products.id})`.as("has_options"),
    })
    .from(products)
    .where(and(eq(products.categoryId, p.categoryId), ne(products.id, p.id), eq(products.isActive, true)))
    .limit(8);

  const toLite = (row: typeof relatedRows[number]): ProductLite & { hasOptions: boolean } => ({
    id: row.p.id,
    name: row.p.name,
    slug: row.p.slug,
    description: row.p.description,
    categoryId: row.p.categoryId,
    categoryName: cat?.[0]?.name ?? "",
    categorySlug: cat?.[0]?.slug ?? "",
    image: (row.p.images as string[])[0] ?? "",
    basePrice: num(row.p.basePrice),
    salePrice: row.p.salePrice !== null ? num(row.p.salePrice) : null,
    stockQty: row.p.stockQty,
    soldOut: isSoldOut(row.p.stockQty),
    isFlashSale: row.p.isFlashSale,
    isFeatured: row.p.isFeatured,
    createdAt: row.p.createdAt.toISOString(),
    hasOptions: Boolean(row.hasOptions),
  });

  const groupsMap = new Map<string, { id: number; value: string; priceDelta: number }[]>();
  for (const a of attrs) {
    const arr = groupsMap.get(a.name) ?? [];
    arr.push({ id: a.id, value: a.value, priceDelta: num(a.priceDelta) });
    groupsMap.set(a.name, arr);
  }

  return (
    <ProductDetailClient
      currency={s.currency}
      product={{
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        categoryName: cat?.[0]?.name ?? "",
        categorySlug: cat?.[0]?.slug ?? "",
        images: (p.images as string[]) ?? [],
        basePrice: num(p.basePrice),
        salePrice: p.salePrice !== null ? num(p.salePrice) : null,
        stockQty: p.stockQty,
        soldOut: isSoldOut(p.stockQty),
        isFlashSale: p.isFlashSale,
      }}
      attrGroups={[...groupsMap.entries()].map(([name, values]) => ({ name, values }))}
      fees={fees.map((f) => ({ feeName: f.feeName, feeAmount: num(f.feeAmount) }))}
      related={relatedRows.map(toLite)}
    />
  );
}
