import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "cancelled",
  "completed",
]);
export const payMethodEnum = pgEnum("pay_method", ["paystack", "wallet"]);
export const promoTypeEnum = pgEnum("promo_type", ["percent", "fixed"]);
export const notifAudienceEnum = pgEnum("notif_audience", ["all", "users", "user"]);
export const walletTxTypeEnum = pgEnum("wallet_tx_type", ["credit", "debit"]);

/* ------------------------------------------------------------------ */
/* Global settings (single row, fully editable from the Admin Panel)   */
/* ------------------------------------------------------------------ */

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("Vendora"),
  tagline: text("tagline").notNull().default("The everything market"),
  logoUrl: text("logo_url").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#FF5A1F"),
  secondaryColor: text("secondary_color").notNull().default("#0E8A76"),
  currency: text("currency").notNull().default("GHS"),
  whatsappNumber: text("whatsapp_number").notNull().default("2348012345678"),
  contactEmail: text("contact_email").notNull().default("hello@vendora.shop"),
  contactPhone: text("contact_phone").notNull().default("+234 801 234 5678"),
  contactAddress: text("contact_address").notNull().default("14B Admiralty Way, Lekki Phase 1, Lagos"),
  contactHeading: text("contact_heading").notNull().default("Talk to the market"),
  contactBody: text("contact_body").notNull().default(""),
  supportHours: text("support_hours").notNull().default("Mon – Sat, 8:00 – 20:00 WAT"),
  heroHeadline: text("hero_headline").notNull().default("Everything you want. One loud market."),
  heroSub: text("hero_sub").notNull().default(""),
  footerBlurb: text("footer_blurb").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  twitter: text("twitter").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  youtube: text("youtube").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  showSoldOut: boolean("show_sold_out").notNull().default(true),
  flashSaleEndsAt: timestamp("flash_sale_ends_at"),
  /* Active Paystack mode: which key pair the store uses at runtime. Toggle from
     the Admin Panel → App Settings. "test" uses PAYSTACK_TEST_* keys, "live"
     uses PAYSTACK_LIVE_*. */
  paymentMode: text("payment_mode").notNull().default("test"),
  /* Paystack split-payment subaccount (admin-configured). Earnings route to this
     subaccount automatically at settlement: 3% stays in the main account (the
     owner) and 97% goes to the subaccount (see PAYSTACK_SUBACCOUNT_PERCENTAGE). */
  subaccountType: text("subaccount_type").notNull().default("personal"),
  subaccountBankName: text("subaccount_bank_name").notNull().default(""),
  subaccountBankCode: text("subaccount_bank_code").notNull().default(""),
  subaccountAccountNumber: text("subaccount_account_number").notNull().default(""),
  subaccountAccountName: text("subaccount_account_name").notNull().default(""),
  subaccountCode: text("subaccount_code").notNull().default(""),
  /* Processing-charge pass-through: when enabled, a processing fee (default 3%)
     is added to the customer's checkout total. Off = the platform absorbs it. */
  chargeProcessingFee: boolean("charge_processing_fee").notNull().default(true),
  processingFeePercent: numeric("processing_fee_percent", { precision: 5, scale: 2 }).notNull().default("3"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;

/* ------------------------------------------------------------------ */
/* Users, sessions, wallets                                            */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  whatsapp: text("whatsapp").notNull().default(""),
  address: text("address").notNull().default(""),
  role: roleEnum("role").notNull().default("customer"),
  walletBalance: numeric("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: walletTxTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull().default(""),
  paystackRef: text("paystack_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;

/* ------------------------------------------------------------------ */
/* Catalog: categories, products, attributes, fees                     */
/* ------------------------------------------------------------------ */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }),
  stockQty: integer("stock_qty"),
  isFlashSale: boolean("is_flash_sale").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;

export const productAttributes = pgTable("product_attributes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  priceDelta: numeric("price_delta", { precision: 12, scale: 2 }).notNull().default("0"),
});

export type ProductAttribute = typeof productAttributes.$inferSelect;

export const productFees = pgTable("product_fees", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  feeName: text("fee_name").notNull(),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).notNull(),
});

export type ProductFee = typeof productFees.$inferSelect;

/* ------------------------------------------------------------------ */
/* Promo codes                                                         */
/* ------------------------------------------------------------------ */

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: promoTypeEnum("type").notNull().default("percent"),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  minSubtotal: numeric("min_subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PromoCode = typeof promoCodes.$inferSelect;

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export interface OrderItemSnapshot {
  productId: number;
  name: string;
  image: string;
  qty: number;
  unitPrice: number;
  attributes: { name: string; value: string; priceDelta: number }[];
  fees: { feeName: string; feeAmount: number }[];
  lineTotal: number;
}

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerWhatsapp: text("customer_whatsapp").notNull(),
  customerAddress: text("customer_address").notNull(),
  items: jsonb("items").$type<OrderItemSnapshot[]>().notNull().default([]),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  feesTotal: numeric("fees_total", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  processingFee: numeric("processing_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  promoCode: text("promo_code"),
  paymentMethod: payMethodEnum("payment_method").notNull().default("paystack"),
  paystackRef: text("paystack_ref"),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;

/* ------------------------------------------------------------------ */
/* Announcements / notifications                                       */
/* ------------------------------------------------------------------ */

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  audience: notifAudienceEnum("audience").notNull().default("all"),
  targetUserId: integer("target_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
