# Checkout & Guest Flow Test Summary

**Date:** 2026-02-10  
**Page tested:** `http://localhost:4567/checkout`  
**Flows:** Empty cart, guest checkout (form + place order), success redirect.

---

## 1. Empty cart

- **URL:** `/checkout` with no items.
- **Result:** Page shows **"Your cart is empty"** and **"Continue Shopping"**.
- **Status:** Working as intended.

---

## 2. Guest view (checkout with items)

- **Steps:** Shop → Add to cart (e.g. Immunity Booster Mix) → Navigate to `/checkout`.
- **Result:**
  - **Checkout as Guest** section with:
    - "Continue as Guest"
    - "Sign In for Faster Checkout"
  - **Shipping Information:** Full Name, Email, Phone, Delivery Address, City, State, Pincode, optional fields (address line 2, building, floor, unit, landmark, instructions).
  - **Payment:** Cash on Delivery (default), Online Payment.
  - **Order Summary**, coupon field, trust copy (100% Purchase Protection), Terms/Privacy links.
  - **Place Order Securely** button.
- **Status:** Guest UI and form are correct.

---

## 3. Guest place order (COD)

- **Steps:** Filled required fields (name, email, phone, address, city, state, pincode), kept COD, clicked **Place Order Securely**.
- **Observation:** Button showed "Processing your order..." then returned to "Place Order Securely"; no redirect to success; cart still had 1 item.
- **Cause:** `POST /api/orders` required authentication and returned **401 Unauthorized** for guest requests.

---

## 4. Fix applied: guest checkout in API

- **File:** `app/api/orders/route.ts`
- **Changes:**
  1. **Guest allowed:** Session is no longer required for `POST`. Request body is validated the same for guest and logged-in.
  2. **Guest validation:** If there is no session, `shipping_address` must include name, email, and phone (from `name`/`full_name`, `email`, `phone`).
  3. **Order insert:** `user_id` is set to `session?.user?.id ?? null`. `customer_name`, `customer_email`, `customer_phone` are set from `shipping_address` for all orders (guest and logged-in).
  4. **Coupon usage:** Recording coupon usage only runs when `session?.user?.id` exists (guests do not get coupon_usage rows).
- **Migration (for schema that has `user_id` NOT NULL):** `supabase/migrations/023_allow_guest_orders.sql` added to make `orders.user_id` nullable. Apply it if your `orders` table has `user_id NOT NULL` (e.g. from `001_ensure_product_tables.sql`).  
  **Note:** If your Supabase project uses a different schema (e.g. no `user_id` on `orders`), adjust or skip this migration accordingly.

---

## 5. UX note: sticky cart covering button

- On viewports where the sticky cart bar is visible, **Place Order Securely** can be covered and the first click hits the cart button.
- **Workaround:** Scroll so **Place Order Securely** is in view, then click.
- **Recommendation:** Add padding or scroll-margin at the bottom of the checkout form so the primary button stays above the sticky bar, or ensure the sticky bar does not overlap the button (e.g. reserve space or move the bar).

---

## 6. Retest after fix

1. Ensure migration `023_allow_guest_orders` is applied if your schema has `orders.user_id NOT NULL`.
2. Open `/checkout` with one item in cart (guest, not signed in).
3. Fill required shipping fields and choose COD.
4. Click **Place Order Securely** (after scrolling if needed).
5. Expected: Order is created, redirect to `/orders/success?orderId=...`, cart cleared, success message.

---

## 7. Summary

| Item                         | Status / Note                                      |
|-----------------------------|-----------------------------------------------------|
| Empty cart on `/checkout`   | OK – empty state + Continue Shopping               |
| Guest checkout UI           | OK – form, payment, summary, trust copy             |
| Guest place order (before)  | Failed – 401 from `POST /api/orders`               |
| Guest place order (after)   | Fixed – API allows guest and sets customer_*        |
| Sticky cart vs button       | Minor UX – scroll to reveal button or adjust layout |
| Migration `023`             | Optional – only if `orders.user_id` is NOT NULL    |
