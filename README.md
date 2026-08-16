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
│  • Paystack gateway (src/lib/paystack.ts) — init + verify + subaccount split; demo mode when     │
│    no key is set. Subaccount synced from Admin → App Settings                                      │
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
- **Payments** — Paystack for checkout and wallet top-ups. Without `PAYSTACK_SECRET_KEY` the app runs in **demo mode**: references prefixed `demo-` are auto-approved by the callback so the full flow remains testable. Successful payments are applied via **both** the browser redirect callback (`/api/paystack/callback`) and a **webhook** (`/api/paystack/webhook`) so a sale is recorded reliably even if the customer never completes the return redirect.
- **Split payments (subaccount)** — when a settlement subaccount is configured in the Admin Panel, every Paystack payment is split automatically: a configurable share (default **3%**) stays in your main account and the rest (default **97%**) settles directly to the subaccount's bank account. The subaccount is created/updated on Paystack from the admin form (bank name, account number, account name, type).
- **Processing fee pass-through** — the Admin Panel shows a **"Payment processing comes with a charge of 3%"** notice and a toggle for whether that charge is added to the customer's checkout total. On = an extra 3% (configurable) is added at checkout; off = you absorb it. The payment is still split 3% / 97% to the subaccount regardless.
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
| `PAYSTACK_SECRET_KEY` | ⚠️ optional | Your Paystack **secret** key (`sk_live_…` / `sk_test_…`). Used server-side to initialize & verify transactions. **If omitted, the app runs in demo mode** (payments are simulated locally) and the subaccount can't be created. |
| `PAYSTACK_SUBACCOUNT_PERCENTAGE` | optional | Percentage of each Paystack payment that stays in **your** main account; the rest settles to the configured subaccount. Default `3` ⇒ 3% to you, 97% to the subaccount. |
| `NEXT_PUBLIC_SITE_URL` | ✅ recommended | **Your public origin, e.g. `https://shop.example.com`** (no trailing slash). This is the base of the Paystack `callback_url` that brings customers back to your site after paying. **Set this to your production domain** — if it's empty, the callback URL is guessed from request headers and may be wrong, leaving customers stuck on Paystack's success page. |

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
4. **(Recommended)** In Paystack → Settings → API Keys & Webhooks → **Webhook URL**, set `https://<your-domain>/api/paystack/webhook` and pick the **`charge.success`** event. This makes payment verification reliable even if a customer closes the Paystack tab before being redirected back.

### Split payments with a subaccount (3% / 97%)

The store can automatically split every Paystack payment so the bulk of each sale settles straight to a subaccount's bank account, while a small commission stays in your main account.

**How it works**

1. Go to **Admin → App Settings → "Paystack split payments (3% / 97%)"**.
2. Enter the settlement subaccount details:
   - **Subaccount type** — `personal` or `business`.
   - **Bank name** — e.g. `Access Bank`. It is resolved to a Paystack bank code automatically (GHS).
   - **Account number** — verified against the bank on save.
   - **Account name** — must match the name the bank has on file (Paystack cross-checks it).
3. Hit **Save**. The app creates the Paystack subaccount (or updates the existing one) and stores its `subaccount_code` in the database.
4. Every subsequent Paystack checkout / wallet top-up initializes with `subaccount`, so Paystack settles **97%** to the subaccount and leaves **3%** in your main account at settlement.

**Configuration**

- The split is controlled by `PAYSTACK_SUBACCOUNT_PERCENTAGE` (default `3`, i.e. the % that stays in your main account). Set it to `0` to send 100% to the subaccount, or any value `0–100`.
- The subaccount code is stored in the database (`settings.subaccount_code`) and managed from the Admin Panel — you don't need to touch any env var for daily use beyond `PAYSTACK_SECRET_KEY`.
- If `PAYSTACK_SECRET_KEY` is missing (demo mode) the subaccount can't be created; the admin form still lets you stage the details and clears any stale subaccount code.
- **Processing charge to customers**: in Admin → App Settings → the split-payments section, a banner reads **"Payment processing comes with a charge of 3%"**. A toggle decides whether that charge is **added to the customer's checkout total** (on) or **absorbed by you** (off). The percent is editable (`settings.processing_fee_percent`).
- New settings columns: `subaccount_type`, `subaccount_bank_name`, `subaccount_bank_code`, `subaccount_account_number`, `subaccount_account_name`, `subaccount_code`, plus `charge_processing_fee`, `processing_fee_percent` (and `orders.processing_fee`). Sync them with your database **before** deploying:
  - Run `npx drizzle-kit push` (requires DB access from your machine), **or**
  - Apply `migrations/0001_subaccount_split.sql` and `migrations/0002_processing_fee.sql` (Supabase → SQL Editor / `psql`) if you can't reach the DB directly. Both are additive and safe.

**Requirements**

- The main account and the subaccount must be under the same Paystack integration. The subaccount's bank must be a Ghanaian settlement bank, and the account owner must complete Paystack KYC before payouts are released.

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
| `/admin/products` · `/admin/products/new` · `/admin/products/[id]/edit` | Product CRUD incl. variations, custom fees, stock, flash/featured/visibility flags; **images can be uploaded from the device** (auto-compressed) or pasted as URLs |
| `/admin/categories` | Category CRUD (blocks deletion while products are attached) |
| `/admin/orders` | All orders: full item/fee/customer detail, change status (cancelling restocks) |
| `/admin/users` | CRM: users, roles, wallet balances, order counts, manual wallet credit/debit |
| `/admin/notifications` | Announcements composer with audience targeting (all / logged-in / specific user) |
| `/admin/promos` | Promo code CRUD (percent/fixed, min subtotal, usage limits, expiry) |
| `/admin/settings` | Global app settings: branding, colors, WhatsApp, socials, contact copy, hero text, sold-out visibility, and the Paystack split-payment subaccount |

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
