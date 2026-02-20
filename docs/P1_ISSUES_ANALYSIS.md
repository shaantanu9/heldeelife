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

### TODOs in code

- Stock notification API (product-stock-notification flow).
- Abandoned cart send-email stub (send-email route).
- Product videos placeholder (videos from API).

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

7. Document or implement critical TODOs (stock notifications, abandoned-cart email, product videos).
8. Align memory-bank (e.g. progress.md, activeContext.md) with current state after fixes (e.g. order creation API and checkout usage).

---

## 6. File and Reference Summary

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
