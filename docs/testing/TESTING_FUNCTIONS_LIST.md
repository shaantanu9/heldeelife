# Testing Functions & API Routes List

This document provides a structured list of all functions, API routes, and pages that need testing. This can be used with MCP tools or test generation scripts.

## Summary Statistics

- **Total API Routes**: 69
- **Total Pages**: 63
- **Total Components**: 100+
- **Estimated Test Cases**: 500+

---

## API Routes by Category

### Authentication (5 routes)
```
POST   /api/auth/signup
POST   /api/auth/[...nextauth]
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
PUT    /api/auth/update-profile
```

### Products (12 routes)
```
GET    /api/products
GET    /api/products/[id]
POST   /api/products
PUT    /api/products/[id]
DELETE /api/products/[id]
GET    /api/products/categories
POST   /api/products/categories
GET    /api/products/categories/[id]
PUT    /api/products/categories/[id]
GET    /api/products/inventory
PUT    /api/products/inventory
GET    /api/products/inventory/alerts
POST   /api/products/price-alerts
POST   /api/products/stock-alerts
```

### Orders (4 routes)
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/[id]
PUT    /api/orders/[id]
GET    /api/orders/[id]/invoice
```

### Cart (2 routes)
```
GET    /api/cart/abandoned
POST   /api/cart/abandoned/recover
```

### Wishlist (3 routes)
```
GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/[id]
```

### Reviews (5 routes)
```
GET    /api/reviews
POST   /api/reviews
GET    /api/reviews/[id]
PUT    /api/reviews/[id]
DELETE /api/reviews/[id]
POST   /api/reviews/[id]/helpful
DELETE /api/reviews/[id]/helpful
```

### Addresses (4 routes)
```
GET    /api/addresses
POST   /api/addresses
GET    /api/addresses/[id]
PUT    /api/addresses/[id]
DELETE /api/addresses/[id]
```

### Payments (7 routes)
```
GET    /api/payments/methods
POST   /api/payments/methods
GET    /api/payments/methods/[id]
PUT    /api/payments/methods/[id]
DELETE /api/payments/methods/[id]
PUT    /api/payments/methods/[id]/default
POST   /api/payments/create-order
POST   /api/payments/verify
POST   /api/payments/webhook
```

### Coupons (6 routes)
```
GET    /api/coupons
POST   /api/coupons
GET    /api/coupons/[id]
PUT    /api/coupons/[id]
DELETE /api/coupons/[id]
POST   /api/coupons/apply
POST   /api/coupons/validate
```

### Returns & Refunds (5 routes)
```
GET    /api/returns
POST   /api/returns
GET    /api/returns/[id]
PUT    /api/returns/[id]
DELETE /api/returns/[id]
GET    /api/refunds
```

### Blog (10 routes)
```
GET    /api/blog/posts
POST   /api/blog/posts
GET    /api/blog/posts/[id]
PUT    /api/blog/posts/[id]
DELETE /api/blog/posts/[id]
GET    /api/blog/categories
POST   /api/blog/categories
GET    /api/blog/categories/[id]
PUT    /api/blog/categories/[id]
GET    /api/blog/tags
POST   /api/blog/tags
GET    /api/blog/tags/[id]
PUT    /api/blog/tags/[id]
POST   /api/blog/revalidate
GET    /api/admin/blog/analytics
```

### Admin (15 routes)
```
GET    /api/admin/users
GET    /api/admin/analytics
GET    /api/admin/abandoned-carts
POST   /api/admin/abandoned-carts/[id]/send-email
GET    /api/admin/loyalty/points
POST   /api/admin/loyalty/points/[userId]/adjust
GET    /api/admin/loyalty/rewards
GET    /api/admin/export/orders
GET    /api/admin/export/orders/[id]/bill
GET    /api/admin/export/products
POST   /api/admin/products/bulk-import
POST   /api/admin/products/bulk-operations
GET    /api/admin/products/template
GET    /api/admin/seo/audit
GET    /api/admin/settings
PUT    /api/admin/settings
```

### Analytics (3 routes)
```
POST   /api/analytics/track
POST   /api/analytics/batch
GET    /api/analytics/metrics
```

### Images (2 routes)
```
POST   /api/images/upload
GET    /api/images/test
```

### Other (2 routes)
```
GET    /api/health
GET    /api/insights
```

---

## Pages by Category

### Public Pages (15 pages)
```
/                    - Homepage
/shop                - Shop listing
/products/[slug]     - Product detail
/blog                - Blog listing
/blog/[slug]         - Blog post
/search              - Search results
/about               - About page
/contact             - Contact page
/compare             - Product comparison
/tracking            - Order tracking
/wishlist            - Wishlist
/privacy             - Privacy policy
/terms               - Terms of service
/cookie              - Cookie policy
/shipping            - Shipping policy
/refund              - Refund policy
/faq                 - FAQ
/help                - Help center
/service             - Service page
/resource            - Resource page
/offline             - Offline page
```

### Authentication Pages (4 pages)
```
/auth/signin         - Sign in
/auth/signup         - Sign up
/auth/forgot-password - Forgot password
/auth/reset-password  - Reset password
```

### User Profile Pages (9 pages)
```
/profile             - Profile dashboard
/profile/settings    - Profile settings
/profile/addresses   - Address management
/profile/payments    - Payment methods
/profile/orders      - Order history
/profile/orders/[id] - Order detail
/profile/wishlist    - Wishlist
/profile/returns     - Returns
/profile/refunds     - Refunds
```

### Shopping Flow Pages (4 pages)
```
/cart                - Shopping cart
/checkout            - Checkout
/orders/success      - Order success
/orders/[id]         - Order detail
```

### Admin Pages (20 pages)
```
/admin               - Admin dashboard
/admin/products      - Product management
/admin/products/categories - Product categories
/admin/products/inventory  - Inventory management
/admin/orders        - Order management
/admin/orders/[id]   - Order detail
/admin/users         - User management
/admin/coupons       - Coupon management
/admin/reviews       - Review management
/admin/returns       - Returns management
/admin/returns/[id]  - Return detail
/admin/abandoned-carts - Abandoned carts
/admin/loyalty       - Loyalty program
/admin/blog          - Blog management
/admin/blog/[id]     - Blog post editor
/admin/blog/new      - New blog post
/admin/blog/categories - Blog categories
/admin/blog/tags     - Blog tags
/admin/blog/analytics - Blog analytics
/admin/analytics     - Analytics dashboard
/admin/seo           - SEO management
/admin/settings      - Settings
```

---

## Key Functions to Test

### Authentication Functions (`lib/auth-utils.ts`)
- `toEmailFormat(phoneOrEmail: string): string`
- `extractPhoneFromEmail(email: string): string | null`
- `isPhoneNumber(value: string): boolean`
- `normalizePhoneNumber(phone: string): string`

### Image Functions (`lib/imagekit-service.ts`)
- `uploadImage(file: File, folder?: string): Promise<string>`
- `getImageUrl(path: string, options?: ImageOptions): string`
- `deleteImage(path: string): Promise<void>`

### Utility Functions (`lib/utils/*`)
- `cn(...classes: ClassValue[]): string`
- `formatPrice(amount: number, currency?: string): string`
- `formatDate(date: Date | string, format?: string): string`
- `slugify(text: string): string`
- `truncate(text: string, length: number): string`
- All other utility functions

### Rate Limiting (`lib/rate-limit.ts`)
- `rateLimit(options: RateLimitOptions): Middleware`

### CORS (`lib/cors.ts`)
- `corsHandler(req: NextRequest): NextResponse`

### Logger (`lib/logger.ts`)
- `log(level: LogLevel, message: string, data?: any): void`

---

## Component Functions to Test

### Cart Context (`contexts/cart-context.tsx`)
- `addToCart(product, quantity)`
- `removeFromCart(productId)`
- `updateQuantity(productId, quantity)`
- `clearCart()`
- `getCartTotal()`
- `getCartItemCount()`

### Wishlist Context (`contexts/wishlist-context.tsx`)
- `addToWishlist(product)`
- `removeFromWishlist(productId)`
- `isInWishlist(productId)`

### Order Context (`contexts/order-context.tsx`)
- `createOrder(orderData)`
- `getOrder(orderId)`
- `updateOrderStatus(orderId, status)`

### Comparison Context (`contexts/comparison-context.tsx`)
- `addToComparison(product)`
- `removeFromComparison(productId)`
- `clearComparison()`

---

## Database Functions to Test

### Stored Functions
- `calculate_loyalty_tier(points)`
- `generate_order_number()`
- `update_product_rating(product_id)`

### Triggers
- `update_updated_at()`
- `reserve_inventory_on_order()`
- `release_inventory_on_cancel()`
- `deduct_inventory_on_confirm()`
- `update_product_rating_trigger()`

---

## Test Generation Template

### API Route Test Template
```typescript
describe('API: /api/route-name', () => {
  describe('GET /api/route-name', () => {
    test('should return 200 with valid data', async () => {
      // Test implementation
    })
    
    test('should handle errors gracefully', async () => {
      // Test implementation
    })
    
    test('should validate authentication', async () => {
      // Test implementation
    })
    
    test('should validate authorization', async () => {
      // Test implementation
    })
  })
})
```

### Page Test Template
```typescript
describe('Page: /page-name', () => {
  test('should render page correctly', () => {
    // Test implementation
  })
  
  test('should handle loading state', () => {
    // Test implementation
  })
  
  test('should handle error state', () => {
    // Test implementation
  })
  
  test('should be responsive', () => {
    // Test implementation
  })
})
```

### Component Test Template
```typescript
describe('Component: ComponentName', () => {
  test('should render correctly', () => {
    // Test implementation
  })
  
  test('should handle user interactions', () => {
    // Test implementation
  })
  
  test('should handle props correctly', () => {
    // Test implementation
  })
})
```

---

## Priority Levels

### P0 - Critical (Must Test First)
- Authentication flows
- Order creation
- Payment processing
- Admin authorization
- Data security

### P1 - High Priority
- Product CRUD operations
- Cart functionality
- Checkout flow
- User profile management
- Order management

### P2 - Medium Priority
- Blog functionality
- Reviews and ratings
- Wishlist
- Search and filtering
- Analytics

### P3 - Low Priority
- UI components
- Utility functions
- Static pages
- SEO features

---

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: All critical user flows
- **Component Tests**: All reusable components

---

**Last Updated**: 2024-12-19





