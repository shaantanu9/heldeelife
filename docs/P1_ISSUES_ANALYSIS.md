# P1 Issues Analysis

Single consolidated report for P0/P1 scope: lint/typecheck results, memory-bank gaps, and TESTING_FUNCTIONS_LIST P1 scope. Use this for prioritization and next steps.

**Generated:** 2025-02-20  
**Branch:** feature/analyse-the-repo-for-p1-issues-c0b897b0

---

## 1. P1 Scope (P0/P1 Areas)

### P0 – Critical (must test first)

- Authentication flows
- Order creation
- Payment processing
- Admin authorization
- Data security

### P1 – High priority

- Product CRUD operations
- Cart functionality
- Checkout flow
- User profile management
- Order management

*Source: `docs/testing/TESTING_FUNCTIONS_LIST.md` (Priority Levels).*

---

## 2. Lint and Typecheck Results

### Lint (`npm run lint`)

| Status   | Command     | Result |
|----------|-------------|--------|
| **Failed** | `next lint` | Exit code 1 |

**Output (recorded):**

```
Invalid project directory provided, no such directory: <repo>/lint
```

**Note:** Next.js 16 `next lint` appears to interpret a project directory incorrectly in this setup. Recommend running `next lint` with an explicit project path or checking Next.js lint CLI/docs for the correct invocation.

### Typecheck

| Context              | Status   | Notes |
|----------------------|----------|--------|
| **Next.js build**    | **Pass** | `npm run build` runs TypeScript and completed successfully. App and API code typecheck. |
| **Standalone `tsc --noEmit`** | **Fail** | Many errors in `__tests__/ecommerce.test.ts`: `describe`, `test`, `expect` not found (Vitest globals). `tsconfig.json` excludes `tests` but not `__tests__`, so test files are typechecked without Vitest types. |

**Recommendation:** Either add `__tests__` to `tsconfig.json` exclude, or use a separate `tsconfig.test.json` that includes Vitest types so `tsc --noEmit` is not run over test files without them.

---

## 3. Memory-Bank Gaps (merged)

Summarized from `memory-bank/progress.md`, `memory-bank/activeContext.md`, and planner findings.

### Auth / security

- **GET /api/analytics/metrics** – No admin check; any authenticated user can read site-wide conversion/revenue (data leak).
- **POST /api/blog/revalidate** – Only requires logged-in user; should be admin-only. Body `path` is user-controlled and passed to `revalidatePath(path)` (potential abuse).

### Product / data

- Product data still hardcoded in shop; DB migration/connection pending.
- Product images are placeholders (e.g. emojis); real assets and product–DB connection needed.
- Order creation API exists and is used by checkout (guest + auth supported); order history and admin order management need verification and coverage.

### TODOs in code (status in §7)

### MVP / feature gaps (from memory-bank)

- Product: migrate hardcoded → DB, product CRUD API, admin product UI, product images.
- Orders: order creation from checkout (API exists), order history, admin order management, status updates, confirmation emails.
- Payment: gateway integration (Razorpay/Stripe), payment status and callbacks, refund handling.
- User: email verification, password reset, profile editing, order tracking, address management.
- Admin: product/inventory/order management UI, analytics dashboard, user management.
- Testing: unit/integration/E2E and P1 test coverage per TESTING_FUNCTIONS_LIST.

---

## 4. TESTING_FUNCTIONS_LIST – P1-relevant scope

P1 areas that need explicit test coverage (from `docs/testing/TESTING_FUNCTIONS_LIST.md`):

- **Product CRUD** – APIs and UI for create/read/update/delete products and categories.
- **Cart** – Add/remove/update, persistence, totals; `/api/cart/*` routes.
- **Checkout flow** – Address, payment method, order creation, success/failure paths.
- **User profile** – Profile read/update, addresses, payments, orders, settings.
- **Order management** – List orders, order detail, status, invoice; `/api/orders/*`, admin order UI.

Coverage goals from the doc: unit 80%+, integration 70%+, E2E for critical flows, component tests for reusable components.

---

## 5. Known Gaps and Next Steps

### Immediate (P0/P1)

1. **Security**
   - Add admin-only check to `GET /api/analytics/metrics`.
   - Restrict `POST /api/blog/revalidate` to admins and validate/sanitize `path` before `revalidatePath(path)`.
2. **Lint**
   - Fix or document `next lint` invocation (project directory or config) so lint runs in CI.
3. **Typecheck**
   - Exclude `__tests__` from main `tsconfig` or add Vitest types for test tsconfig so `tsc --noEmit` (if used standalone) passes.

### Short term (P1)

4. **Product**
   - Migrate shop off hardcoded data to DB; connect product CRUD and admin product UI.
5. **Orders**
   - Verify P1 flows end-to-end (create order from checkout, order history, admin order management).
6. **Testing**
   - Add/update P1 test coverage for product CRUD, cart, checkout, profile, order management per TESTING_FUNCTIONS_LIST.

### Follow-up

7. ~~Document or implement critical TODOs~~ — Done in S-4 (see §8).
8. Align memory-bank (e.g. progress.md, activeContext.md) with current state after fixes (e.g. order creation API and checkout usage).

---

## 6. P1 User Flow Verification (S-3)

Checklist executed via code trace and existing API tests. Results as of 2025-02-20.

### Checklist and results

| # | P1 flow | Status | Notes |
|---|--------|--------|--------|
| 1 | **Shop → product detail** | **Pass** | Shop page (`app/shop/page.tsx`) uses `getProducts()` / `getProductCategories()` from `lib/api/server`; `ShopClient` links to `/products/${product.slug}`. Product detail page `app/products/[slug]/page.tsx` uses `getProduct(slug)` and renders `ProductEnhanced`. Data from Supabase products table. |
| 2 | **Cart add** | **Pass** | `ShopClient` and product detail use `useCart()` from `contexts/cart-context`; `addToCart()` used from shop grid and product page. Cart persists (e.g. localStorage). |
| 3 | **Checkout → order creation** | **Pass** | Checkout page (`app/checkout/page.tsx`) uses `useOrderContext().createOrder()`. Context uses `useCreateOrder()` which calls `apiClient.post('/orders', data)` → `POST /api/orders`. API supports authenticated and guest checkout; creates order and order_items in DB. |
| 4 | **Order history** | **Pass** | `app/profile/orders/page.tsx` fetches `GET /api/orders` when user is signed in; `app/orders/success/page.tsx` and `app/profile/orders/[id]/page.tsx` use `GET /api/orders/[id]`. APIs enforce session and user-scoped or admin access. |
| 5 | **Profile flows** | **Pass** | Profile dashboard (`app/profile/page.tsx`), orders, addresses, payments, settings, wishlist pages exist and call corresponding APIs (`/api/orders`, `/api/addresses`, `/api/payments/methods`, etc.). Auth required via middleware/session. |

### Tests run

- **Orders API** (`tests/api/orders/route.test.ts`): 32 passed, 1 failed.
  - **Failure:** “POST /api/orders > Authentication > should return 401 if user is not authenticated” — test expects 401 when there is no session; implementation allows **guest checkout** and returns 400 when required guest fields (name, email, phone in shipping_address) are missing. So the flow is “guest or authenticated”; the failing test is inconsistent with current API contract.

### Failures and gaps

- **Documented failure:** One order test expects 401 for unauthenticated POST to `/api/orders`. API is designed to allow guest checkout; either update the test to reflect guest behavior or change the API to require auth and return 401 when not logged in.
- **E2E:** No automated E2E was run (no browser/Playwright in this run). Flow verification is by code trace and API unit tests only.

---

## 7. Critical TODOs Status (S-4)

Each critical TODO is either implemented or documented as deferred with reason. Updated 2025-02-20.

| TODO | Status | Detail |
|------|--------|--------|
| **Stock notification API** | **Implemented** | Product detail component `product-stock-notification.tsx` now calls existing `POST /api/products/stock-alerts` with `productId`, `productName`, `email`, `phone`. API persists to `cart_analytics` (stock_alert type). No new API added; UI was wired to existing endpoint. |
| **Abandoned cart send-email** | **Deferred** | Route `POST /api/admin/abandoned-carts/[id]/send-email` exists, is admin-only, increments `recovery_attempts`, and returns success. Actual email sending deferred: no email provider (SendGrid/Resend) integrated yet. Comment in code and this report record the deferral. |
| **Product videos placeholder** | **Deferred** | `ProductVideos` component exists but renders nothing until videos are provided. No `product_videos` table or API yet. Deferred until backend schema and API are added; comment in code and this report record the deferral. |

---

## 8. P1 Test Coverage (S-5)

At least one test per P1 area exists or the gap is documented. Updated 2025-02-20.

| P1 area | Coverage | Location / note |
|---------|----------|------------------|
| **Product CRUD** | Yes | `tests/api/products/route.test.ts` — GET returns 200 with products array and count. |
| **Cart** | Yes | `tests/api/cart/abandoned/route.test.ts` — POST 400 when cart/email missing; 200 with valid body. |
| **Checkout flow** | Yes | Covered by order creation: `tests/api/orders/route.test.ts` (POST /api/orders). Checkout page calls same API via OrderContext. |
| **Order management** | Yes | `tests/api/orders/route.test.ts` — GET (auth, filters, pagination), POST (create, validation, guest/auth). One test fails (401 vs guest checkout); see §6. |
| **User profile** | Yes | `tests/api/addresses/route.test.ts` — GET 401 when unauthenticated; 200 with addresses array when authenticated. Profile page and other profile APIs (payments, settings) share same auth pattern; addresses chosen as representative. |

Additional P1-related tests: `tests/api/analytics/metrics/route.test.ts`, `tests/api/blog/revalidate/route.test.ts` (admin/auth).

---

## 9. File and Reference Summary

| Item                    | Location / command |
|-------------------------|--------------------|
| P1 scope definition     | `docs/testing/TESTING_FUNCTIONS_LIST.md` (§ Priority Levels) |
| Memory-bank state       | `memory-bank/progress.md`, `memory-bank/activeContext.md` |
| Lint                    | `npm run lint` (currently failing – see §2) |
| Typecheck               | `npm run build` (passes); `tsc --noEmit` (fails on `__tests__` only) |
| Build                   | `npm run build` (passes) |
| Tests                   | `npm run test:run` |

---

*End of P1 Issues Analysis.*
