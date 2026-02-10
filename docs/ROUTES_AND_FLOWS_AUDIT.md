# HeldeeLife – Routes and Flows Audit

This document lists all app and API routes and confirms that flows are set up and working. Last updated after adding missing admin routes.

---

## 1. Page routes (App Router)

### Public

| Route | Page | Status | Notes |
|-------|------|--------|-------|
| `/` | Home | ✅ | `app/page.tsx` |
| `/about` | About | ✅ | `app/about/page.tsx` |
| `/shop` | Shop | ✅ | `app/shop/page.tsx` + shop-client |
| `/products/[slug]` | Product (by slug) | ✅ | SSG with generateStaticParams |
| `/products/[id]` | Product (by id) | ✅ | Fallback for id-based links |
| `/search` | Search | ✅ | `app/search/page.tsx` |
| `/blog` | Blog list | ✅ | `app/blog/page.tsx` + blog-client |
| `/blog/[slug]` | Blog post | ✅ | `app/blog/[slug]/page.tsx` |
| `/insights` | Insights | ✅ | `app/insights/page.tsx` |
| `/insights/[id]` | Insight detail | ✅ | `app/insights/[id]/page.tsx` |
| `/contact` | Contact | ✅ | `app/contact/page.tsx` |
| `/service` | Service | ✅ | `app/service/page.tsx` |
| `/resource` | Resource | ✅ | `app/resource/page.tsx` |
| `/faq` | FAQ | ✅ | `app/faq/page.tsx` |
| `/help` | Help | ✅ | `app/help/page.tsx` |
| `/compare` | Compare | ✅ | `app/compare/page.tsx` |
| `/wishlist` | Wishlist (public view) | ✅ | `app/wishlist/page.tsx` |
| `/offline` | Offline (PWA) | ✅ | `app/offline/page.tsx` |

### Legal / policy (static)

| Route | Page | Status |
|-------|------|--------|
| `/privacy` | Privacy | ✅ |
| `/terms` | Terms | ✅ |
| `/cookie` | Cookie policy | ✅ |
| `/shipping` | Shipping | ✅ |
| `/refund` | Refund | ✅ |
| `/tracking` | Order tracking | ✅ |

### Auth (unprotected)

| Route | Page | Status |
|-------|------|--------|
| `/auth/signin` | Sign in | ✅ |
| `/auth/signup` | Sign up | ✅ |
| `/auth/forgot-password` | Forgot password | ✅ |
| `/auth/reset-password` | Reset password | ✅ |

### Protected (middleware: auth required)

| Route | Page | Status |
|-------|------|--------|
| `/cart` | Cart | ✅ |
| `/checkout` | Checkout | ✅ |
| `/profile` | Profile | ✅ |
| `/profile/orders` | My orders | ✅ |
| `/profile/orders/[id]` | Order detail | ✅ |
| `/profile/addresses` | Addresses | ✅ |
| `/profile/payments` | Payment methods | ✅ |
| `/profile/wishlist` | Wishlist | ✅ |
| `/profile/returns` | Returns | ✅ |
| `/profile/refunds` | Refunds | ✅ |
| `/profile/settings` | Settings | ✅ |
| `/orders` | Orders list | ✅ |
| `/orders/[id]` | Order detail | ✅ |
| `/orders/success` | Order success | ✅ |
| `/refund` | Refund (page) | ✅ |

### Admin (middleware: auth + admin role)

| Route | Page | Status |
|-------|------|--------|
| `/admin` | Admin dashboard | ✅ |
| `/admin/analytics` | Analytics | ✅ |
| `/admin/blog` | Blog list | ✅ |
| `/admin/blog/new` | New post | ✅ |
| `/admin/blog/[id]` | Edit post | ✅ |
| `/admin/blog/categories` | Categories | ✅ |
| `/admin/blog/tags` | Tags | ✅ |
| `/admin/blog/analytics` | Blog analytics | ✅ |
| `/admin/products` | Products list | ✅ |
| `/admin/products/new` | New product (redirect → products?new=1) | ✅ **Added** |
| `/admin/products/categories` | Product categories | ✅ |
| `/admin/products/inventory` | Inventory | ✅ |
| `/admin/orders` | Orders | ✅ |
| `/admin/orders/[id]` | Order detail | ✅ |
| `/admin/users` | Users | ✅ |
| `/admin/users/[id]` | User detail | ✅ **Added** |
| `/admin/coupons` | Coupons | ✅ |
| `/admin/reviews` | Reviews | ✅ |
| `/admin/returns` | Returns | ✅ |
| `/admin/returns/[id]` | Return detail | ✅ |
| `/admin/abandoned-carts` | Abandoned carts | ✅ |
| `/admin/loyalty` | Loyalty | ✅ |
| `/admin/seo` | SEO | ✅ |
| `/admin/settings` | Settings | ✅ |

### Special

| Route | Type | Status |
|-------|------|--------|
| `*` (404) | `app/not-found.tsx` | ✅ |
| Error boundary | `app/error.tsx` | ✅ |
| Loading UI | `app/loading.tsx` | ✅ |
| `/rss.xml` | Route handler | ✅ `app/rss.xml/route.ts` |
| `sitemap` | `app/sitemap.ts` | ✅ |
| `robots` | `app/robots.ts` | ✅ |

---

## 2. API routes

### Auth

| Method | Route | Purpose |
|--------|-------|--------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/signup` | Sign up |
| POST | `/api/auth/forgot-password` | Forgot password |
| POST | `/api/auth/reset-password` | Reset password |
| PUT | `/api/auth/update-profile` | Update profile |

### Core (products, orders, cart, payments)

| Method | Route | Purpose |
|--------|-------|--------|
| GET, POST | `/api/products` | List / create product |
| GET, PUT, DELETE | `/api/products/[id]` | Product CRUD |
| GET, POST | `/api/products/categories` | Categories |
| GET, PUT, DELETE | `/api/products/categories/[id]` | Category by id |
| GET, POST | `/api/products/inventory` | Inventory |
| GET | `/api/products/inventory/alerts` | Alerts |
| POST | `/api/products/price-alerts` | Price alerts |
| POST | `/api/products/stock-alerts` | Stock alerts |
| GET, POST | `/api/orders` | List / create order |
| GET, PUT | `/api/orders/[id]` | Order by id |
| GET | `/api/orders/[id]/invoice` | Invoice |
| POST | `/api/cart/abandoned` | Abandoned cart |
| POST | `/api/cart/abandoned/recover` | Recover cart |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |
| POST | `/api/payments/webhook` | Webhook |
| GET, POST | `/api/payments/methods` | Payment methods |
| PUT | `/api/payments/methods/[id]/default` | Set default |
| DELETE | `/api/payments/methods/[id]` | Delete method |

### User (addresses, wishlist, reviews, returns, refunds, coupons)

| Method | Route | Purpose |
|--------|-------|--------|
| GET, POST | `/api/addresses` | Addresses |
| GET, PUT, PATCH, DELETE | `/api/addresses/[id]` | Address by id |
| GET, POST | `/api/wishlist` | Wishlist |
| DELETE | `/api/wishlist/[id]` | Remove from wishlist |
| GET, POST | `/api/reviews` | Reviews |
| PUT, DELETE | `/api/reviews/[id]` | Review by id |
| POST | `/api/reviews/[id]/helpful` | Mark helpful |
| GET, POST | `/api/returns` | Returns |
| GET, PUT, DELETE | `/api/returns/[id]` | Return by id |
| GET, POST | `/api/refunds` | Refunds |
| GET, POST | `/api/coupons` | Coupons (admin) |
| GET, PUT, DELETE | `/api/coupons/[id]` | Coupon by id |
| POST | `/api/coupons/apply` | Apply coupon |
| POST | `/api/coupons/validate` | Validate coupon |

### Blog

| Method | Route | Purpose |
|--------|-------|--------|
| GET, POST | `/api/blog/posts` | Posts |
| GET, PUT, DELETE | `/api/blog/posts/[id]` | Post by id |
| GET, POST | `/api/blog/categories` | Categories |
| GET, PUT, DELETE | `/api/blog/categories/[id]` | Category by id |
| GET, POST | `/api/blog/tags` | Tags |
| GET, PUT, DELETE | `/api/blog/tags/[id]` | Tag by id |
| POST | `/api/blog/revalidate` | Revalidate |

### Admin

| Method | Route | Purpose |
|--------|-------|--------|
| GET | `/api/admin/analytics` | Analytics |
| GET | `/api/admin/users` | Users list |
| GET | `/api/admin/users/[id]` | User by id ✅ **Added** |
| GET | `/api/admin/abandoned-carts` | Abandoned carts |
| POST | `/api/admin/abandoned-carts/[id]/send-email` | Send recovery email |
| GET | `/api/admin/blog/analytics` | Blog analytics |
| GET | `/api/admin/export/orders` | Export orders |
| GET | `/api/admin/export/orders/[id]/bill` | Bill |
| GET | `/api/admin/export/products` | Export products |
| POST | `/api/admin/products/bulk-import` | Bulk import |
| POST | `/api/admin/products/bulk-operations` | Bulk operations |
| GET | `/api/admin/products/template` | Template |
| GET, POST | `/api/admin/loyalty/points` | Loyalty points |
| POST | `/api/admin/loyalty/points/[userId]/adjust` | Adjust points |
| GET | `/api/admin/loyalty/rewards` | Rewards |
| GET | `/api/admin/seo/audit` | SEO audit |
| GET, PUT | `/api/admin/settings` | Settings |

### Other

| Method | Route | Purpose |
|--------|-------|--------|
| GET | `/api/health` | Health check |
| GET | `/api/insights` | Insights |
| GET | `/api/images/test` | Image test |
| POST | `/api/images/upload` | Upload |
| GET, POST | `/api/analytics/track` | Track |
| GET | `/api/analytics/metrics` | Metrics |
| POST | `/api/analytics/batch` | Batch |
| GET | `/api/example-rate-limited` | Rate limit example |

---

## 3. Middleware protection

- **Matcher:** `/admin/*`, `/profile/*`, `/cart/*`, `/checkout/*`
- **Admin:** Must be authenticated and `role === 'admin'` for `/admin/*`
- **Others:** Must be authenticated for profile, cart, checkout

---

## 4. Flows verified

| Flow | Status |
|------|--------|
| Home → Shop → Product → Cart → Checkout → Order success | ✅ |
| Auth: Sign in / Sign up / Forgot password / Reset password | ✅ |
| Profile: Dashboard, orders, addresses, payments, wishlist, returns, settings | ✅ |
| Blog: List → Post → Categories/Tags | ✅ |
| Admin: Dashboard → Products (list, new via redirect, categories, inventory) | ✅ |
| Admin: Users list → User detail (`/admin/users/[id]`) | ✅ **Added** |
| Admin: Orders, returns, reviews, coupons, loyalty, SEO, settings | ✅ |
| Search, compare, wishlist, tracking | ✅ |
| 404, error boundary, loading | ✅ |

---

## 5. Changes made in this audit

1. **`/admin/products/new`**  
   - Added `app/admin/products/new/page.tsx` that redirects to `/admin/products?new=1`.  
   - Updated `AdminProductsClient` to open the “Add Product” dialog when `?new=1` is present and then replace URL with `/admin/products`.

2. **`/admin/users/[id]`**  
   - Added `app/api/admin/users/[id]/route.ts` (GET single user with stats).  
   - Added `app/admin/users/[id]/page.tsx` and `app/admin/users/[id]/client.tsx` for the user detail view so “View” from the users table works.

All linked routes from footer, header, and admin quick-actions now resolve to existing pages or the new ones above.
