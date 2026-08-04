# Vendora — Full-Stack E-Commerce Platform

A highly dynamic, admin-driven e-commerce platform built with **Next.js 16 (App Router)**, **PostgreSQL** and **Drizzle ORM**. Almost every global setting — brand name, logo, colors, WhatsApp number, social links, contact copy, hero text and sold-out visibility — is stored in the database and editable from the **Admin Panel** without touching code.

---

## 1. Overview & Architecture

```
┌─────────────────────────── Storefront (Server + Client components) ───────────────────────────┐
│  Home (hero · category rails · flash sale w/ countdown · recommended)                         │
│  Shop (search / category / sort) · Product detail (variations · custom fees · related)        │
│  Cart drawer → Checkout (guest or logged-in) → Paystack / Wallet → Success                    │
│  Account dashboard (wallet top-up · order history & status · delivery profile)                │
│  Contact (dynamic details, conditional social icons) · Login / Register                       │
└──────────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                       │  REST (route handlers under /app/api)
┌──────────────────────────────────────▼─────────────────────────────────────────────────────────┐
│  Next.js API layer                                                                             │
│  • Server-side price engine (src/lib/pricing.ts) — the ONLY source of truth for totals         │
│  • Session auth (scrypt-hashed passwords, httpOnly cookie sessions)                            │
│  • Paystack gateway (src/lib/paystack.ts) — init + verify; demo mode when no key is set        │
│  • Admin API: /api/admin/[section] — products, categories, orders, users, notifications,       │
│    promos, settings, wallet adjustments, stats                                                 │
└──────────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                       │  Drizzle ORM
                                ┌──────▼──────┐
                                │ PostgreSQL  │
                                └─────────────┘
```

### Key behaviours

- **Dynamic branding** — settings row is read on every server render; primary/secondary hex codes are injected as CSS variables, so the entire UI re-themes instantly when the admin saves new colors.
- **Dark / Light mode** — user toggle, persisted in `localStorage`, applied pre-hydration (no flash).
- **Catalog** — dynamic categories; products support a default price, sale price, **dynamic variation attributes** (e.g. Size/Color, or Year/Make/Mileage for cars, each with an optional price delta) and **custom product fees** (e.g. "Packaging Fee") that are added to the line total.
- **Inventory** — optional stock quantity; hitting `0` auto-labels the product **Sold Out**. The admin toggle `showSoldOut` decides whether sold-out items stay visible or are hidden store-wide.
- **Cart & Checkout** — cart lives in `localStorage`; totals are always recomputed server-side (`POST /api/cart/quote`). Guest checkout is allowed but **strictly requires** a WhatsApp number + delivery address. Promo codes are validated server-side (active, expiry, usage limit, min subtotal).
- **Payments** — Paystack for checkout and wallet top-ups. Without `PAYSTACK_SECRET_KEY` the app runs in **demo mode**: references prefixed `demo-` are auto-approved by the callback so the full flow remains testable.
- **Wallet** — in-app store credit only (purchases, never withdrawable). Top up via Paystack; every credit/debit writes a `wallet_transactions` record; payments are idempotent per Paystack reference.
- **Orders** — snapshot items (name, qty, unit price, chosen attributes, per-line fees) so history survives catalog edits. Statuses: `pending → processing → completed` (+ `cancelled`, which restocks paid items).
- **Notifications** — announcement bell on the navbar. Admin can target **All Visitors**, **Logged-In Users Only**, or **one specific user**.
- **WhatsApp widget** — floating button wired to the admin-configured number; contact page renders each social icon **only if** its URL is filled in.

---

## 2. Default Admin Credentials

| Role  | Email                | Password    |
| ----- | -------------------- | ----------- |
| Admin | `admin@vendora.shop` | `Admin123!` |

A demo customer is also seeded: `demo@vendora.shop` / `Demo123!` (starts with ₦25,000 wallet balance).

> **Change the admin password** in production (register a new admin via the Users module, or update the hash in the `users` table).

Seeded promo codes: `WELCOME10` (10% off) and `BUILD5000` (₦5,000 off orders ≥ ₦50,000).

---

## 3. Environment Variables

Create a `.env` file at the project root:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |
| `PAYSTACK_SECRET_KEY` | ⚠️ optional | Your Paystack **secret** key (`sk_live_…` / `sk_test_…`). Used server-side to initialize & verify transactions. **If omitted, the app runs in demo mode** (payments are simulated locally). |
| `NEXT_PUBLIC_SITE_URL` | optional | Public origin used for Paystack `callback_url` when the request has no `Origin`/`Host` header (e.g. `https://shop.example.com`). |

No other variables are needed. Session tokens are random per-install (no shared secret required); passwords are hashed with Node's `scrypt`.

---

## 4. Local Setup

```bash
npm install

# 1. Ensure Postgres is running and .env contains DATABASE_URL

# 2. Push the schema (no migration files needed)
npx drizzle-kit push

# 3. Seed settings, admin, categories, products, promos & announcements
npx tsx src/db/seed.ts

# 4. Run
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

---

## 5. Deployment

### Backend + Frontend (single Next.js app — deploy together)

**Option A — Vercel (recommended)**

1. Push this repo to GitHub and import it in Vercel (framework preset: Next.js).
2. Provision a Postgres database (Vercel Postgres, Neon, Supabase…) and copy its pooled connection string.
3. Set environment variables in Vercel → Settings → Environment Variables: `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
4. Before the first deploy finishes, run once (locally, pointing `DATABASE_URL` at the production DB):
   ```bash
   npx drizzle-kit push
   npx tsx src/db/seed.ts
   ```
   (Or add them as a build command prefix: `npx drizzle-kit push && next build`. The seed script is idempotent — it skips if settings already exist.)
5. Deploy. Log into `/admin` with the default admin credentials and immediately configure your brand, WhatsApp number and Paystack-driven flows.

**Option B — VPS / Docker**

1. `npm run build` on the server (Node 20+), run `npm start` behind a reverse proxy (Nginx/Caddy) with TLS.
2. Run Postgres locally or managed; export `DATABASE_URL`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
3. Run `npx drizzle-kit push && npx tsx src/db/seed.ts` once.
4. Use a process manager (`pm2`, systemd) to keep the server alive.

### Paystack go-live checklist

1. Create an account at [paystack.com](https://paystack.com) → Settings → Preferences → International Cards (optional).
2. Copy the **test** key first (`sk_test_…`) into `PAYSTACK_SECRET_KEY` and run a full purchase + wallet top-up.
3. Switch to the **live** key (`sk_live_…`). Callback URL is automatic: `https://<your-domain>/api/paystack/callback`.

---

## 6. Routes Map

### Frontend pages

| Route | Description |
| --- | --- |
| `/` | Homepage: hero, category tiles, flash-sale rail with live countdown, per-category carousels, recommended grid, wallet/promo banners |
| `/shop` | Full catalog with search (`?q=`), category filter (`?cat=`) and sorting (`?sort=`) |
| `/product/[slug]` | Product detail: gallery, variation pickers with price deltas, custom fees, stock, Buy Now, related rail |
| `/checkout` | Guest- or account checkout: delivery/WhatsApp form (mandatory), promo codes, Paystack **or** wallet payment |
| `/checkout/success` | Payment result (success / failed / demo notice) |
| `/contact` | Dynamic contact details + conditionally-rendered social icons |
| `/auth/login` · `/auth/register` | Session auth (register captures name, email, WhatsApp, delivery address) |
| `/account` | Customer dashboard — tabs: Overview, **Wallet** (Paystack top-up + transactions), **Orders** (status tracking + full line detail), Profile |
| `/admin` | **Protected** admin dashboard: revenue, KPIs, status breakdown, low-stock radar |
| `/admin/products` · `/admin/products/new` · `/admin/products/[id]/edit` | Product CRUD incl. variations, custom fees, stock, flash/featured/visibility flags |
| `/admin/categories` | Category CRUD (blocks deletion while products are attached) |
| `/admin/orders` | All orders: full item/fee/customer detail, change status (cancelling restocks) |
| `/admin/users` | CRM: users, roles, wallet balances, order counts, manual wallet credit/debit |
| `/admin/notifications` | Announcements composer with audience targeting (all / logged-in / specific user) |
| `/admin/promos` | Promo code CRUD (percent/fixed, min subtotal, usage limits, expiry) |
| `/admin/settings` | Global app settings: branding, colors, WhatsApp, socials, contact copy, hero text, sold-out visibility |

### API endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Health check |
| GET | `/api/auth/me` | public | Current session user |
| POST | `/api/auth/login` · `/api/auth/register` · `/api/auth/logout` | public | Session auth |
| GET | `/api/products?q=&cat=&sort=&flash=&featured=` | public | Catalog listing (respects sold-out visibility) |
| POST | `/api/cart/quote` | public | Server-side total: items + fees + promo validation |
| POST | `/api/checkout` | public | Creates order; returns Paystack redirect **or** completes wallet payment |
| GET | `/api/paystack/callback?reference=` | public | Paystack redirect: verifies, confirms order / credits wallet (idempotent) |
| POST | `/api/wallet/fund` | user | Initializes a Paystack wallet top-up |
| GET | `/api/orders?wallet=1` | user | Own order history + wallet transactions |
| GET | `/api/account` / PATCH | user | Profile read / update (name, WhatsApp, address) |
| GET | `/api/notifications` | public | Announcements filtered by audience |
| GET/POST/PUT/DELETE | `/api/admin/[section]?id=` | **admin** | Sections: `stats`, `products`, `categories`, `orders`, `users`, `wallet` (adjust), `notifications`, `promos`, `settings` |

---

## 7. Database Schema (summary)

`settings` (single row) · `users` (+`walletBalance`, role) · `sessions` · `wallet_transactions` · `categories` · `products` (+`salePrice`, `stockQty`, flags) · `product_attributes` (dynamic variations with price deltas) · `product_fees` (custom per-product fees) · `promo_codes` · `orders` (+JSON item snapshots) · `notifications` (audience-targeted).

Schema lives in `src/db/schema.ts`; apply changes anytime with `npx drizzle-kit push`.

---

## 8. Demo Mode Note

When `PAYSTACK_SECRET_KEY` is absent, checkout and wallet top-ups generate `demo-…` references and the callback auto-approves them — the full order lifecycle (stock decrement, sold-out labelling, promo redemption, wallet ledger) works end-to-end for evaluation. The success page displays a demo notice. Add your Paystack key to process real money.
