# Shopping flow — how it works & what was fixed

End-to-end purchase flow: **browse → product → cart → checkout → pay → confirmation → tracking → returns**. Verified on a real Postgres + PostgREST stack with a headless-browser run (guest COD purchase), the live API suite (`__tests__/ecommerce.test.ts`, 27/27) and 229 unit tests.

## Deploy checklist

1. **Run migrations** (in order) on Supabase:
   - `025_customer_inquiries.sql` — contact / consultation / newsletter submissions
   - `026_checkout_integrity.sql` — atomic `place_order()`, order-number sequence, single-source inventory trigger, `order_items.discount_amount`, `orders.payment_id`
   - `016_…` and `009_…` were fixed in place: both contained an index predicate using `now()`, which Postgres rejects, so they could never have applied. Re-run them if your database is missing `order_status_history`, `orders.customer_email`/`carrier`/`estimated_delivery`, or the password-reset tables.
2. **Environment**: `NEXTAUTH_SECRET` (also signs guest order links), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (see `.env.example`). Without Razorpay keys, checkout automatically offers Cash on Delivery only.
3. **Razorpay webhook**: URL `https://<site>/api/payments/webhook`, events `payment.captured`, `payment.failed`, `order.paid`.
4. **Rotate credentials** — a `.env.backup` with real Supabase/Postgres/NextAuth secrets was committed to git history (now untracked). Rotate the Supabase service-role key + JWT secret, the database password and `NEXTAUTH_SECRET`.

## Money & stock: single source of truth

| Concern                                                 | Where                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Totals (subtotal, coupon, ₹50 shipping below ₹500, GST) | `lib/commerce/totals.ts` — the same function feeds the cart, cart drawer, checkout and the API                                                                                                                                                                           |
| GST                                                     | Prices are **GST-inclusive** (Indian MRP); tax is shown as "included". Flip `BUSINESS_CONFIG.pricesIncludeTax` to add tax on top instead                                                                                                                                 |
| Pricing authority                                       | `POST /api/orders` accepts only `{product_id, quantity}`, address, payment method and coupon **code**; prices come from the `products` table                                                                                                                             |
| Coupons                                                 | `validate_coupon()` SQL (expiry, min spend, per-user reuse, product/category scope) via `lib/commerce/coupons.ts`; consumed atomically in `place_order()` respecting `usage_limit`                                                                                       |
| Stock                                                   | `place_order()` locks inventory rows and reserves stock in the same transaction as the order insert (no overselling). The order-status trigger moves stock exactly once per phase: reserved → shipped (deduct) / cancelled (release) / refunded after shipping (restock) |
| Abandoned online payments                               | `expire_stale_online_orders(60)` cancels unpaid online orders after 60 min, releasing stock (called opportunistically on new orders; schedule it with pg_cron for precision)                                                                                             |
| Order numbers                                           | `ORD-YYYYMMDD-000123` from a sequence (no collisions)                                                                                                                                                                                                                    |

## Payments (Razorpay)

- `POST /api/payments/create-order` — creates the Razorpay order **from the stored order total**; stores its id on the order.
- `POST /api/payments/verify` — constant-time signature check **and** requires the Razorpay order id to match the one created for this order (a cheap order's payment can't mark an expensive one paid); idempotent; stores the payment id in `payment_transaction_id`.
- `POST /api/payments/webhook` — signature-verified safety net (customer closed the tab); idempotent; never touches stock.
- Unpaid online orders show **Complete Payment** on the confirmation and order pages (`components/orders/pay-now-button.tsx`).
- `GET /api/payments/config` tells checkout whether online payment is available.

## Guest checkout

Order creation returns an HMAC **access token** scoped to that order. It lets a guest pay, view the confirmation, download the invoice and track — without exposing orders to anyone who guesses an id. Guests can also track with **order number + email** (rate-limited).

## Access rules

- Customers may only **cancel** their own pending, unpaid (or COD) orders. Status, payment status and tracking are admin-only, and admin status changes must follow valid transitions.
- Returns `PUT` is admin-only; refunds can't be duplicated while one is pending/approved/processed.
- Per-user API responses are `Cache-Control: no-store`.
- `/profile/*` and `/orders/*` are protected by middleware (with `callbackUrl`), except `/orders/success` (guests).

## Notable bugs fixed

- API client built `/orders` instead of `/api/orders` → **no order could be placed** through the checkout.
- Prices/totals and order status trusted from the client; customers could mark orders paid.
- Sign-in ran on the shared service-role Supabase client → after any login the **server queried the database as that user**.
- Inventory counted 2–3× per order (app code + trigger + webhook).
- `/api/products` lacked `inStock` → "Out of Stock" everywhere outside the shop; `?category=<slug>` returned 500.
- Cart lost items added just before navigating (300 ms artificial delay + 300 ms debounced save).
- Invoice was a stored-XSS vector (unescaped customer address on our origin).
- Charm pricing displayed ₹149.99 for a ₹149 product.
- Cart showed "Free shipping, no tax", checkout added 18% on top, server charged something else — now one calculation everywhere.
- Fake promo "products" in the cart, home categories linking to empty results, search page not re-fetching, shop filters going stale, wishlist not synced, compare links 404, review photo upload 403, reviewer emails exposed publicly, password reset never working, logged-in users bounced to sign-in on refresh.

## Local end-to-end testing

The repo's migrations apply to a plain Postgres 16 (base schemas `product_schema.sql`, `blog_schema.sql` first). With PostgREST in front (`/rest/v1`) and a service-role JWT, the app runs fully locally. Run the live API suite against any running instance:

```bash
E2E_BASE_URL=http://localhost:3000 npx vitest run __tests__/ecommerce.test.ts
```
