import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, ne, sql, count } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  notifications,
  orders,
  productAttributes,
  productFees,
  products,
  promoCodes,
  settings,
  users,
  walletTransactions,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { bustSettingsCache } from "@/lib/settings";
import { incrementStock } from "@/lib/pricing";
import { err, json, HttpError, num, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ section: string }> };

const ORDER_STATUSES = ["pending", "processing", "cancelled", "completed"] as const;

function getId(req: Request): number {
  return num(new URL(req.url).searchParams.get("id"));
}

async function uniqueSlug(name: string, selfId?: number): Promise<string> {
  const base = slugify(name) || `item-${Date.now()}`;
  let slug = base;
  let i = 2;
  for (;;) {
    const conds = [eq(products.slug, slug)];
    if (selfId) conds.push(ne(products.id, selfId) as never);
    const [ex] = await db.select({ id: products.id }).from(products).where(and(...conds)).limit(1);
    if (!ex) return slug;
    slug = `${base}-${i++}`;
  }
}

async function uniqueCatSlug(name: string, selfId?: number): Promise<string> {
  const base = slugify(name) || `category-${Date.now()}`;
  let slug = base;
  let i = 2;
  for (;;) {
    const conds = [eq(categories.slug, slug)];
    if (selfId) conds.push(ne(categories.id, selfId) as never);
    const [ex] = await db.select({ id: categories.id }).from(categories).where(and(...conds)).limit(1);
    if (!ex) return slug;
    slug = `${base}-${i++}`;
  }
}

/* ------------------------------------------------------------------ */
/* GET                                                                 */
/* ------------------------------------------------------------------ */

export async function GET(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const section = (await ctx.params).section;
    const id = getId(req);

    if (section === "stats") {
      const [totals] = await db
        .select({
          ordersCount: count(orders.id),
          usersCount: sql<number>`(select count(*) from ${users})`.as("users_count"),
          productsCount: sql<number>`(select count(*) from ${products})`.as("products_count"),
          revenue: sql<string>`coalesce(sum(case when ${orders.status} in ('processing','completed') then ${orders.total}::numeric else 0 end), 0)`.as("revenue"),
        })
        .from(orders);
      const byStatus = await db
        .select({ status: orders.status, n: count(orders.id) })
        .from(orders)
        .groupBy(orders.status);
      const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6);
      const lowStock = await db
        .select()
        .from(products)
        .where(and(eq(products.isActive, true), sql`${products.stockQty} is not null and ${products.stockQty} <= 5`))
        .orderBy(asc(products.stockQty))
        .limit(6);
      return json({
        ordersCount: Number(totals.ordersCount),
        usersCount: Number(totals.usersCount),
        productsCount: Number(totals.productsCount),
        revenue: num(totals.revenue),
        byStatus: byStatus.map((b) => ({ status: b.status, count: Number(b.n) })),
        recentOrders: recent.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          total: num(o.total),
          status: o.status,
          paymentMethod: o.paymentMethod,
          createdAt: o.createdAt.toISOString(),
        })),
        lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stockQty: p.stockQty })),
      });
    }

    if (section === "products" && !id) {
      const rows = await db
        .select({ product: products, categoryName: categories.name })
        .from(products)
        .leftJoin(categories, eq(categories.id, products.categoryId))
        .orderBy(desc(products.createdAt))
        .limit(500);
      return json({
        products: rows.map(({ product: p, categoryName }) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          categoryName: categoryName ?? "—",
          image: (p.images as string[])[0] ?? "",
          basePrice: num(p.basePrice),
          salePrice: p.salePrice !== null ? num(p.salePrice) : null,
          stockQty: p.stockQty,
          isFlashSale: p.isFlashSale,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
          createdAt: p.createdAt.toISOString(),
        })),
      });
    }

    if (section === "products" && id) {
      const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!p) throw new HttpError(404, "Product not found.");
      const attrs = await db.select().from(productAttributes).where(eq(productAttributes.productId, id));
      const fees = await db.select().from(productFees).where(eq(productFees.productId, id));
      return json({
        product: {
          ...p,
          basePrice: num(p.basePrice),
          salePrice: p.salePrice !== null ? num(p.salePrice) : null,
        },
        attributes: attrs.map((a) => ({ id: a.id, name: a.name, value: a.value, priceDelta: num(a.priceDelta) })),
        fees: fees.map((f) => ({ id: f.id, feeName: f.feeName, feeAmount: num(f.feeAmount) })),
      });
    }

    if (section === "categories") {
      const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
      const counts = await db
        .select({ categoryId: products.categoryId, n: count(products.id) })
        .from(products)
        .groupBy(products.categoryId);
      const map = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));
      return json({ categories: cats.map((c) => ({ ...c, productCount: map.get(c.id) ?? 0 })) });
    }

    if (section === "orders" && !id) {
      const rows = await db
        .select({ order: orders, userName: users.name })
        .from(orders)
        .leftJoin(users, eq(users.id, orders.userId))
        .orderBy(desc(orders.createdAt))
        .limit(500);
      return json({
        orders: rows.map(({ order: o, userName }) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          userId: o.userId,
          accountName: userName ?? null,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          customerWhatsapp: o.customerWhatsapp,
          customerAddress: o.customerAddress,
          items: o.items,
          subtotal: num(o.subtotal),
          feesTotal: num(o.feesTotal),
          discount: num(o.discount),
          total: num(o.total),
          promoCode: o.promoCode,
          paymentMethod: o.paymentMethod,
          paystackRef: o.paystackRef,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
      });
    }

    if (section === "orders" && id) {
      const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!o) throw new HttpError(404, "Order not found.");
      return json({
        order: { ...o, subtotal: num(o.subtotal), feesTotal: num(o.feesTotal), discount: num(o.discount), total: num(o.total) },
      });
    }

    if (section === "users") {
      const all = await db.select().from(users).orderBy(desc(users.createdAt));
      const orderCounts = await db
        .select({ userId: orders.userId, n: count(orders.id) })
        .from(orders)
        .groupBy(orders.userId);
      const map = new Map(orderCounts.map((c) => [c.userId, Number(c.n)]));
      return json({
        users: all.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          whatsapp: u.whatsapp,
          address: u.address,
          role: u.role,
          walletBalance: num(u.walletBalance),
          ordersCount: map.get(u.id) ?? 0,
          createdAt: u.createdAt.toISOString(),
        })),
      });
    }

    if (section === "notifications") {
      const rows = await db
        .select({ n: notifications, targetName: users.name })
        .from(notifications)
        .leftJoin(users, eq(users.id, notifications.targetUserId))
        .orderBy(desc(notifications.createdAt))
        .limit(200);
      return json({ notifications: rows.map(({ n, targetName }) => ({ ...n, targetName: targetName ?? null })) });
    }

    if (section === "promos") {
      const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
      return json({ promos: rows.map((p) => ({ ...p, value: num(p.value), minSubtotal: num(p.minSubtotal) })) });
    }

    if (section === "settings") {
      const [s] = await db.select().from(settings).limit(1);
      return json({ settings: s });
    }

    throw new HttpError(404, "Unknown admin resource.");
  } catch (e) {
    return err(e);
  }
}

/* ------------------------------------------------------------------ */
/* POST                                                                */
/* ------------------------------------------------------------------ */

export async function POST(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const section = (await ctx.params).section;
    const body = await req.json().catch(() => ({}));

    if (section === "products") {
      const name = String(body.name ?? "").trim();
      const categoryId = num(body.categoryId);
      if (name.length < 2) throw new HttpError(400, "Product name is required.");
      if (!categoryId) throw new HttpError(400, "Pick a category.");
      if (!(num(body.basePrice) > 0)) throw new HttpError(400, "Base price must be greater than zero.");
      const images = (Array.isArray(body.images) ? body.images : String(body.images ?? "").split(/\n|,/))
        .map((s: string) => s.trim())
        .filter(Boolean);
      const sale = body.salePrice === "" || body.salePrice == null ? null : num(body.salePrice);
      const [prod] = await db
        .insert(products)
        .values({
          name,
          slug: await uniqueSlug(name),
          description: String(body.description ?? ""),
          categoryId,
          images,
          basePrice: String(num(body.basePrice)),
          salePrice: sale != null && sale > 0 ? String(sale) : null,
          stockQty: body.stockQty === "" || body.stockQty == null ? null : Math.max(0, Math.floor(num(body.stockQty))),
          isFlashSale: Boolean(body.isFlashSale),
          isFeatured: Boolean(body.isFeatured),
          isActive: body.isActive !== false,
        })
        .returning();
      await saveAttrsAndFees(prod.id, body);
      revalidatePath("/");
      return json({ id: prod.id }, 201);
    }

    if (section === "categories") {
      const name = String(body.name ?? "").trim();
      if (name.length < 2) throw new HttpError(400, "Category name is required.");
      const [cat] = await db
        .insert(categories)
        .values({
          name,
          slug: await uniqueCatSlug(name),
          description: String(body.description ?? ""),
          image: String(body.image ?? ""),
          sortOrder: Math.floor(num(body.sortOrder)),
        })
        .returning();
      revalidatePath("/");
      return json({ id: cat.id }, 201);
    }

    if (section === "notifications") {
      const title = String(body.title ?? "").trim();
      const audience = body.audience === "users" || body.audience === "user" ? body.audience : "all";
      if (title.length < 2) throw new HttpError(400, "Notification title is required.");
      if (audience === "user" && !num(body.targetUserId)) throw new HttpError(400, "Pick the user to target.");
      await db.insert(notifications).values({
        title,
        body: String(body.body ?? ""),
        audience,
        targetUserId: audience === "user" ? num(body.targetUserId) : null,
      });
      return json({ ok: true }, 201);
    }

    if (section === "promos") {
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new HttpError(400, "Code must be 3–20 letters/numbers.");
      if (!(num(body.value) > 0)) throw new HttpError(400, "Discount value must be positive.");
      if (body.type === "percent" && num(body.value) > 90) throw new HttpError(400, "Percent discounts cap at 90%.");
      await db.insert(promoCodes).values({
        code,
        type: body.type === "fixed" ? "fixed" : "percent",
        value: String(num(body.value)),
        minSubtotal: String(Math.max(0, num(body.minSubtotal))),
        isActive: body.isActive !== false,
        usageLimit: body.usageLimit === "" || body.usageLimit == null ? null : Math.floor(num(body.usageLimit)),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      });
      return json({ ok: true }, 201);
    }

    if (section === "wallet") {
      const userId = num(body.userId);
      const adjust = num(body.adjust);
      const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!u) throw new HttpError(404, "User not found.");
      if (adjust === 0) throw new HttpError(400, "Enter a non-zero amount.");
      const newBalance = num(u.walletBalance) + adjust;
      if (newBalance < 0) throw new HttpError(400, "Adjustment would make the balance negative.");
      await db.update(users).set({ walletBalance: String(newBalance) }).where(eq(users.id, u.id));
      await db.insert(walletTransactions).values({
        userId: u.id,
        type: adjust > 0 ? "credit" : "debit",
        amount: String(Math.abs(adjust)),
        description: String(body.reason ?? "Manual adjustment by admin"),
      });
      return json({ walletBalance: newBalance });
    }

    throw new HttpError(404, "Unknown admin action.");
  } catch (e) {
    return err(e);
  }
}

async function saveAttrsAndFees(productId: number, body: Record<string, unknown>) {
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  await db.delete(productFees).where(eq(productFees.productId, productId));
  const attrs = Array.isArray(body.attributes)
    ? (body.attributes as { name?: string; value?: string; priceDelta?: number | string }[])
    : [];
  const valid = attrs.filter((a) => String(a.name ?? "").trim() && String(a.value ?? "").trim());
  if (valid.length) {
    await db.insert(productAttributes).values(
      valid.map((a) => ({
        productId,
        name: String(a.name).trim(),
        value: String(a.value).trim(),
        priceDelta: String(num(a.priceDelta)),
      }))
    );
  }
  const fees = Array.isArray(body.fees) ? (body.fees as { feeName?: string; feeAmount?: number | string }[]) : [];
  const validFees = fees.filter((f) => String(f.feeName ?? "").trim() && num(f.feeAmount) > 0);
  if (validFees.length) {
    await db.insert(productFees).values(
      validFees.map((f) => ({
        productId,
        feeName: String(f.feeName).trim(),
        feeAmount: String(num(f.feeAmount)),
      }))
    );
  }
}

/* ------------------------------------------------------------------ */
/* PUT / PATCH                                                         */
/* ------------------------------------------------------------------ */

export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const section = (await ctx.params).section;
    const id = getId(req);
    const body = await req.json().catch(() => ({}));

    if (section === "products" && id) {
      const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!p) throw new HttpError(404, "Product not found.");
      const name = String(body.name ?? p.name).trim();
      const sale = body.salePrice === "" || body.salePrice == null ? null : num(body.salePrice);
      const images = (Array.isArray(body.images) ? body.images : String(body.images ?? "").split(/\n|,/))
        .map((s: string) => s.trim())
        .filter(Boolean);
      await db
        .update(products)
        .set({
          name,
          slug: name !== p.name ? await uniqueSlug(name, id) : p.slug,
          description: String(body.description ?? p.description),
          categoryId: num(body.categoryId) || p.categoryId,
          images,
          basePrice: String(num(body.basePrice) > 0 ? num(body.basePrice) : num(p.basePrice)),
          salePrice: sale != null && sale > 0 ? String(sale) : null,
          stockQty: body.stockQty === "" || body.stockQty == null ? null : Math.max(0, Math.floor(num(body.stockQty))),
          isFlashSale: Boolean(body.isFlashSale),
          isFeatured: Boolean(body.isFeatured),
          isActive: Boolean(body.isActive),
        })
        .where(eq(products.id, id));
      await saveAttrsAndFees(id, body);
      revalidatePath("/");
      return json({ ok: true });
    }

    if (section === "categories" && id) {
      const name = String(body.name ?? "").trim();
      if (name.length < 2) throw new HttpError(400, "Category name is required.");
      await db
        .update(categories)
        .set({
          name,
          slug: await uniqueCatSlug(name, id),
          description: String(body.description ?? ""),
          image: String(body.image ?? ""),
          sortOrder: Math.floor(num(body.sortOrder)),
        })
        .where(eq(categories.id, id));
      revalidatePath("/");
      return json({ ok: true });
    }

    if (section === "orders" && id) {
      const status = String(body.status ?? "");
      if (!(ORDER_STATUSES as readonly string[]).includes(status)) throw new HttpError(400, "Invalid order status.");
      const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!o) throw new HttpError(404, "Order not found.");
      await db.update(orders).set({ status: status as (typeof ORDER_STATUSES)[number] }).where(eq(orders.id, id));
      /* Cancelling a paid order puts the items back on the shelf. */
      if (status === "cancelled" && (o.status === "processing" || o.status === "completed")) {
        await incrementStock(o.items as { productId: number; qty: number }[]);
      }
      return json({ ok: true });
    }

    if (section === "users" && id) {
      const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!u) throw new HttpError(404, "User not found.");
      const update: Record<string, unknown> = {};
      if (body.role === "admin" || body.role === "customer") update.role = body.role;
      if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
      if (typeof body.whatsapp === "string") update.whatsapp = body.whatsapp.trim();
      if (typeof body.address === "string") update.address = body.address.trim();
      await db.update(users).set(update).where(eq(users.id, id));
      return json({ ok: true });
    }

    if (section === "promos" && id) {
      const [p] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
      if (!p) throw new HttpError(404, "Promo not found.");
      await db
        .update(promoCodes)
        .set({
          code: String(body.code ?? p.code).trim().toUpperCase(),
          type: body.type === "fixed" ? "fixed" : "percent",
          value: String(num(body.value) > 0 ? num(body.value) : num(p.value)),
          minSubtotal: String(Math.max(0, num(body.minSubtotal))),
          isActive: Boolean(body.isActive),
          usageLimit: body.usageLimit === "" || body.usageLimit == null ? null : Math.floor(num(body.usageLimit)),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        })
        .where(eq(promoCodes.id, id));
      return json({ ok: true });
    }

    if (section === "settings") {
      const [s] = await db.select().from(settings).limit(1);
      if (!s) throw new HttpError(404, "Settings row missing.");
      const str = (k: string, fallback: string) => (typeof body[k] === "string" ? (body[k] as string) : fallback);
      const hex = (v: string, fallback: string) => (/^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);
      await db
        .update(settings)
        .set({
          siteName: str("siteName", s.siteName).slice(0, 40) || s.siteName,
          tagline: str("tagline", s.tagline),
          logoUrl: str("logoUrl", s.logoUrl),
          primaryColor: hex(str("primaryColor", s.primaryColor), s.primaryColor),
          secondaryColor: hex(str("secondaryColor", s.secondaryColor), s.secondaryColor),
          whatsappNumber: str("whatsappNumber", s.whatsappNumber),
          contactEmail: str("contactEmail", s.contactEmail),
          contactPhone: str("contactPhone", s.contactPhone),
          contactAddress: str("contactAddress", s.contactAddress),
          contactHeading: str("contactHeading", s.contactHeading),
          contactBody: str("contactBody", s.contactBody),
          supportHours: str("supportHours", s.supportHours),
          heroHeadline: str("heroHeadline", s.heroHeadline),
          heroSub: str("heroSub", s.heroSub),
          footerBlurb: str("footerBlurb", s.footerBlurb),
          facebook: str("facebook", s.facebook),
          instagram: str("instagram", s.instagram),
          twitter: str("twitter", s.twitter),
          tiktok: str("tiktok", s.tiktok),
          youtube: str("youtube", s.youtube),
          linkedin: str("linkedin", s.linkedin),
          showSoldOut: Boolean(body.showSoldOut),
          updatedAt: new Date(),
        })
        .where(eq(settings.id, s.id));
      bustSettingsCache();
      revalidatePath("/");
      return json({ ok: true });
    }

    throw new HttpError(404, "Unknown admin resource.");
  } catch (e) {
    return err(e);
  }
}

/* ------------------------------------------------------------------ */
/* DELETE                                                              */
/* ------------------------------------------------------------------ */

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const section = (await ctx.params).section;
    const id = getId(req);
    if (!id) throw new HttpError(400, "Missing resource id.");

    if (section === "products") {
      await db.delete(productAttributes).where(eq(productAttributes.productId, id));
      await db.delete(productFees).where(eq(productFees.productId, id));
      await db.delete(products).where(eq(products.id, id));
      revalidatePath("/");
      return json({ ok: true });
    }
    if (section === "categories") {
      const [used] = await db.select({ n: count(products.id) }).from(products).where(eq(products.categoryId, id));
      if (Number(used?.n ?? 0) > 0) {
        throw new HttpError(409, "Move or delete its products before removing this category.");
      }
      await db.delete(categories).where(eq(categories.id, id));
      revalidatePath("/");
      return json({ ok: true });
    }
    if (section === "notifications") {
      await db.delete(notifications).where(eq(notifications.id, id));
      return json({ ok: true });
    }
    if (section === "promos") {
      await db.delete(promoCodes).where(eq(promoCodes.id, id));
      return json({ ok: true });
    }
    throw new HttpError(404, "Unknown admin resource.");
  } catch (e) {
    return err(e);
  }
}
