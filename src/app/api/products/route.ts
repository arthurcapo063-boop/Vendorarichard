import { and, eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { num, isSoldOut, err, json } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const cat = url.searchParams.get("cat") ?? "";
    const sort = url.searchParams.get("sort") ?? "newest";
    const flash = url.searchParams.get("flash") === "1";
    const featured = url.searchParams.get("featured") === "1";

    const s = await getSettings();

    const conds = [eq(products.isActive, true)];
    if (q) {
      conds.push(
        or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`)) as never
      );
    }
    if (flash) conds.push(eq(products.isFlashSale, true));
    if (featured) conds.push(eq(products.isFeatured, true));
    if (!s.showSoldOut) {
      conds.push(
        or(sql`${products.stockQty} is null`, sql`${products.stockQty} > 0`) as never
      );
    }

    let catId: number | null = null;
    if (cat) {
      const [c] = await db.select().from(categories).where(eq(categories.slug, cat)).limit(1);
      if (!c) return json([]);
      catId = c.id;
      conds.push(eq(products.categoryId, c.id) as never);
    }

    const orderBy =
      sort === "price-asc"
        ? asc(sql`coalesce(${products.salePrice}, ${products.basePrice})::numeric`)
        : sort === "price-desc"
          ? desc(sql`coalesce(${products.salePrice}, ${products.basePrice})::numeric`)
          : desc(products.createdAt);

    const rows = await db
      .select({
        product: products,
        categoryName: categories.name,
        categorySlug: categories.slug,
        hasOptions: sql<boolean>`exists(select 1 from product_attributes pa where pa.product_id = ${products.id})`.as("has_options"),
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...conds))
      .orderBy(orderBy)
      .limit(120);

    const list = rows.map(({ product: p, categoryName, categorySlug, hasOptions }) => ({
      hasOptions: Boolean(hasOptions),
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: categoryName ?? "",
      categorySlug: categorySlug ?? "",
      image: (p.images as string[])[0] ?? "",
      basePrice: num(p.basePrice),
      salePrice: p.salePrice !== null ? num(p.salePrice) : null,
      stockQty: p.stockQty,
      soldOut: isSoldOut(p.stockQty),
      isFlashSale: p.isFlashSale,
      isFeatured: p.isFeatured,
      createdAt: p.createdAt.toISOString(),
    }));

    return json({ list, catId });
  } catch (e) {
    return err(e);
  }
}
