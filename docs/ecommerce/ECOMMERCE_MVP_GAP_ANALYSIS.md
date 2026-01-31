# E-commerce MVP Gap Analysis

## 📊 Current Database Schema Status

### ✅ Existing Tables (25+ tables)

#### Core E-commerce (11 tables)

1. ✅ `product_categories` - Categories with hierarchy
2. ✅ `products` - Complete product catalog
3. ✅ `inventory` - Stock management with locations
4. ✅ `inventory_history` - Inventory audit trail
5. ✅ `inventory_alerts` - Low stock alerts
6. ✅ `orders` - Customer orders (enhanced with tracking)
7. ✅ `order_items` - Order line items (with product images)
8. ✅ `order_status_history` - Order status tracking
9. ✅ `user_addresses` - Saved shipping addresses
10. ✅ `product_reviews` - Product reviews and ratings
11. ✅ `review_helpful_votes` - Review helpful votes

#### Marketing & Promotions (3 tables)

12. ✅ `coupons` - Discount codes
13. ✅ `coupon_usage` - Coupon usage tracking
14. ✅ `wishlist` - User wishlists

#### Payments & Refunds (2 tables)

15. ✅ `payment_methods` - Saved payment methods
16. ✅ `refunds` - Refund requests

#### Analytics (4 tables)

17. ✅ `product_views` - Product view tracking
18. ✅ `product_sales_analytics` - Sales analytics
19. ✅ `product_searches` - Search tracking
20. ✅ `cart_analytics` - Cart behavior analytics

#### Blog (4 tables)

21. ✅ `blog_posts` - Blog articles
22. ✅ `blog_categories` - Blog categories
23. ✅ `blog_tags` - Blog tags
24. ✅ `blog_post_tags` - Post-tag junction

#### User Management (1 table)

25. ✅ `users` - User profiles with roles

---

## ❌ Missing Database Tables for Complete MVP

### 1. Shipping & Delivery Management

#### Missing: `shipping_methods` Table

**Purpose**: Configure shipping options and rates

```sql
CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Standard", "Express", "Same-Day"
  description TEXT,
  carrier TEXT, -- e.g., "FedEx", "BlueDart", "Delhivery"
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  free_shipping_threshold NUMERIC(10, 2), -- Free above this amount
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  applicable_states TEXT[], -- States where available
  applicable_pincodes TEXT[], -- Pincodes where available
  weight_limit NUMERIC(10, 2), -- Max weight in kg
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Missing: `shipping_zones` Table

**Purpose**: Define shipping zones with different rates

```sql
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "North India", "Metro Cities"
  states TEXT[] NOT NULL,
  pincodes TEXT[],
  base_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  per_kg_cost NUMERIC(10, 2) DEFAULT 0,
  free_shipping_threshold NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Missing: `shipping_calculations` Table

**Purpose**: Store calculated shipping costs for orders

```sql
CREATE TABLE shipping_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  shipping_method_id UUID REFERENCES shipping_methods(id),
  base_cost NUMERIC(10, 2) NOT NULL,
  weight_cost NUMERIC(10, 2) DEFAULT 0,
  distance_cost NUMERIC(10, 2) DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL,
  estimated_delivery_date DATE,
  calculated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Tax Management

#### Missing: `tax_rates` Table

**Purpose**: Configure tax rates by location/product

```sql
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "GST", "VAT", "Service Tax"
  rate NUMERIC(5, 2) NOT NULL, -- Percentage (e.g., 18.00 for 18%)
  type TEXT NOT NULL CHECK (type IN ('gst', 'vat', 'service_tax', 'custom')),
  applicable_to TEXT CHECK (applicable_to IN ('all', 'category', 'product')),
  applicable_category_id UUID REFERENCES product_categories(id),
  applicable_product_ids UUID[],
  applicable_states TEXT[],
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Returns & Exchanges

#### Missing: `returns` Table

**Purpose**: Handle product returns

```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'defective',
    'wrong_item',
    'damaged',
    'not_as_described',
    'size_issue',
    'changed_mind',
    'other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'picked_up',
    'received',
    'processed',
    'refunded'
  )),
  return_type TEXT CHECK (return_type IN ('refund', 'exchange', 'store_credit')),
  exchange_product_id UUID REFERENCES products(id),
  refund_amount NUMERIC(10, 2),
  pickup_address JSONB,
  tracking_number TEXT,
  picked_up_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Notifications System

#### Missing: `notifications` Table

**Purpose**: User notifications (in-app, email, SMS)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'order_placed',
    'order_confirmed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'payment_success',
    'payment_failed',
    'review_request',
    'promotion',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (order_id, product_id, etc.)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. Email Subscriptions

#### Missing: `email_subscriptions` Table

**Purpose**: Newsletter and marketing emails

```sql
CREATE TABLE email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced')),
  source TEXT, -- How they subscribed (website, checkout, etc.)
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  preferences JSONB, -- Email preferences
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. Blog Comments

#### Missing: `blog_comments` Table

**Purpose**: Comments on blog posts

```sql
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- For replies
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_spam BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 7. Settings/Configuration

#### Missing: `app_settings` Table

**Purpose**: Application-wide settings

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'payment', 'shipping', 'email', 'general'
  is_public BOOLEAN DEFAULT false, -- Can be accessed without auth
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Example Settings:**

- Payment gateway configuration
- Shipping configuration
- Email templates
- Site information
- Social media links
- Maintenance mode

### 8. Payment Transactions

#### Missing: `payment_transactions` Table

**Purpose**: Detailed payment transaction history

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_gateway TEXT NOT NULL, -- 'razorpay', 'stripe', 'cod'
  transaction_id TEXT NOT NULL,
  payment_id TEXT, -- Gateway payment ID
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'processing',
    'success',
    'failed',
    'refunded',
    'partially_refunded'
  )),
  payment_method TEXT, -- 'card', 'upi', 'netbanking', 'wallet'
  gateway_response JSONB, -- Full gateway response
  failure_reason TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 9. Product Variants

#### Missing: `product_variants` Table

**Purpose**: Product variations (size, color, etc.)

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL, -- e.g., "500ml", "Red", "Large"
  variant_type TEXT NOT NULL, -- 'size', 'color', 'weight', 'pack'
  price NUMERIC(10, 2), -- Override product price if different
  compare_at_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2),
  image TEXT, -- Variant-specific image
  barcode TEXT,
  weight NUMERIC(10, 2),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, variant_type, name)
);
```

### 10. Cart Persistence

#### Missing: `saved_carts` Table

**Purpose**: Save cart for logged-out users or abandoned carts

```sql
CREATE TABLE saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest users
  items JSONB NOT NULL, -- Cart items
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔧 Missing Database Functions

### 1. Shipping Cost Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  p_order_id UUID,
  p_shipping_method_id UUID,
  p_address JSONB
) RETURNS NUMERIC(10, 2) AS $$
-- Calculate shipping based on weight, distance, zone
$$ LANGUAGE plpgsql;
```

### 2. Tax Calculation

```sql
CREATE OR REPLACE FUNCTION calculate_tax(
  p_order_id UUID,
  p_address JSONB
) RETURNS NUMERIC(10, 2) AS $$
-- Calculate tax based on location and product tax rates
$$ LANGUAGE plpgsql;
```

### 3. Coupon Validation

```sql
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_order_amount NUMERIC(10, 2)
) RETURNS JSONB AS $$
-- Validate coupon code, check usage limits, calculate discount
$$ LANGUAGE plpgsql;
```

### 4. Auto-expire Coupons

```sql
CREATE OR REPLACE FUNCTION expire_coupons()
RETURNS void AS $$
-- Mark expired coupons as inactive
$$ LANGUAGE plpgsql;
```

### 5. Daily Analytics Aggregation

```sql
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(p_date DATE)
RETURNS void AS $$
-- Aggregate daily sales, views, searches
$$ LANGUAGE plpgsql;
```

---

## 🔌 Missing Integrations

### 1. Payment Gateway Frontend Integration ⚠️ CRITICAL

**Status**: Backend APIs exist, frontend not connected

**What's Missing:**

- Razorpay checkout script integration in checkout page
- Payment flow UI
- Payment verification after success
- Payment failure handling

**Files to Update:**

- `app/checkout/page.tsx` - Connect to `/api/payments/create-order`
- Add Razorpay script loading

### 2. Email Service Integration

**Status**: Not implemented

**What's Needed:**

- Email service provider (SendGrid, Resend, AWS SES)
- Order confirmation emails
- Shipping notifications
- Password reset emails
- Review request emails
- Newsletter emails

**Recommended**: Resend (simple, modern) or SendGrid

### 3. SMS Service Integration

**Status**: Not implemented

**What's Needed:**

- SMS provider (Twilio, AWS SNS, TextLocal)
- Order confirmation SMS
- Shipping updates
- OTP for authentication

**Recommended**: Twilio or AWS SNS

### 4. Shipping API Integration

**Status**: Not implemented

**What's Needed:**

- Shipping carrier API (Shiprocket, Delhivery, BlueDart)
- Real-time shipping cost calculation
- Label generation
- Tracking integration
- Pickup scheduling

**Recommended**: Shiprocket (India) - handles multiple carriers

### 5. Image Upload Integration

**Status**: ImageKit configured, not fully integrated

**What's Missing:**

- Product image upload in admin
- Blog image upload
- User avatar upload
- Review image upload

**Files to Update:**

- `app/admin/products/[id]/page.tsx`
- `components/ui/image-upload.tsx` (exists, needs integration)

### 6. Full-Text Search

**Status**: Basic search exists, needs enhancement

**What's Missing:**

- PostgreSQL full-text search setup
- Search indexing
- Advanced search filters
- Search analytics

---

## 📱 Missing UI Features

### Admin Dashboard

#### High Priority

1. ❌ **Coupon Management** (`/admin/coupons`)
   - Create/edit/delete coupons
   - View usage statistics
   - Set expiration dates

2. ❌ **Review Moderation** (`/admin/reviews`)
   - Approve/reject reviews
   - Moderate review content
   - View review analytics

3. ⚠️ **Analytics Dashboard** (`/admin/analytics`)
   - Sales charts and graphs
   - Product performance
   - User behavior analytics
   - Revenue reports

4. ⚠️ **Settings Page** (`/admin/settings`)
   - Payment gateway config
   - Shipping settings
   - Email templates
   - Site settings

5. ❌ **Returns Management** (`/admin/returns`)
   - View return requests
   - Approve/reject returns
   - Process refunds
   - Track return status

#### Medium Priority

6. ❌ **Shipping Methods Management** (`/admin/shipping`)
   - Configure shipping methods
   - Set shipping zones
   - Manage carriers

7. ❌ **Tax Configuration** (`/admin/tax`)
   - Set tax rates
   - Configure tax by location
   - Tax exemptions

8. ❌ **Notification Management** (`/admin/notifications`)
   - Send notifications
   - View notification history
   - Configure notification templates

### User-Facing Features

#### High Priority

1. ❌ **Wishlist Page** (`/profile/wishlist`)
   - View saved items
   - Add to cart from wishlist
   - Share wishlist

2. ❌ **Review Submission** (Product pages)
   - Submit reviews after purchase
   - Upload review images
   - Rate products

3. ❌ **Coupon Code Input** (Checkout page)
   - Enter coupon code
   - Apply discount
   - View discount breakdown

4. ❌ **Return Request** (Order details page)
   - Request return
   - Select return reason
   - Track return status

#### Medium Priority

5. ❌ **Product Comparison**
   - Compare multiple products
   - Side-by-side comparison

6. ❌ **Recently Viewed Products**
   - Track viewed products
   - Show recently viewed

7. ❌ **Product Recommendations**
   - "Customers also bought"
   - "You may also like"
   - Based on purchase history

---

## 🎯 MVP Priority Roadmap

### Phase 1: Critical for Launch (Week 1-2)

1. **Payment Gateway Frontend Integration** ⚠️ CRITICAL
   - Connect Razorpay to checkout
   - Test payment flow
   - Handle payment failures

2. **Shipping Methods Table & Calculation**
   - Create `shipping_methods` table
   - Implement shipping cost calculation
   - Update checkout to show shipping options

3. **Tax Calculation**
   - Create `tax_rates` table
   - Implement tax calculation function
   - Apply tax in checkout

4. **Email Service Integration**
   - Set up email service (Resend recommended)
   - Order confirmation emails
   - Shipping notifications

### Phase 2: Essential Features (Week 3-4)

5. **Returns Management**
   - Create `returns` table
   - Return request UI
   - Admin return management

6. **Payment Transactions Table**
   - Create `payment_transactions` table
   - Track all payment attempts
   - Payment history

7. **Notifications System**
   - Create `notifications` table
   - In-app notifications
   - Email notifications

8. **Wishlist UI**
   - Wishlist page
   - Add/remove from wishlist
   - Share wishlist

### Phase 3: Enhanced Features (Week 5-6)

9. **Review Submission UI**
   - Review form on product pages
   - Review images upload
   - Review moderation

10. **Coupon Management**
    - Admin coupon management
    - Coupon code input in checkout
    - Coupon validation

11. **Analytics Dashboard**
    - Sales charts
    - Product performance
    - User analytics

12. **Settings Management**
    - Admin settings page
    - Payment gateway config
    - Shipping configuration

### Phase 4: Advanced Features (Week 7+)

13. **Product Variants**
    - Variant management
    - Variant selection UI
    - Variant pricing

14. **Shipping API Integration**
    - Shiprocket integration
    - Real-time shipping rates
    - Label generation

15. **SMS Integration**
    - Order SMS notifications
    - OTP for authentication

16. **Full-Text Search**
    - Advanced search
    - Search filters
    - Search analytics

---

## 📊 Summary Statistics

### Database Tables

- **Existing**: 25+ tables ✅
- **Missing Critical**: 10 tables ❌
- **Total Needed**: ~35 tables

### API Endpoints

- **Existing**: ~50+ endpoints ✅
- **Missing Critical**: ~15 endpoints ❌

### UI Pages

- **Existing**: ~30+ pages ✅
- **Missing Critical**: ~10 pages ❌

### Integrations

- **Existing**: 0 fully integrated ❌
- **Needed**: 6 integrations (Payment, Email, SMS, Shipping, Image, Search)

---

## ✅ Quick Wins (Can Implement Fast)

1. **Email Subscriptions Table** - 30 minutes
2. **App Settings Table** - 1 hour
3. **Payment Transactions Table** - 1 hour
4. **Saved Carts Table** - 30 minutes
5. **Blog Comments Table** - 1 hour

---

## 🚀 Recommended Next Steps

1. **Start with Phase 1** - Critical for launch
2. **Set up email service** - Resend is easiest
3. **Connect payment gateway** - Frontend integration
4. **Add shipping methods** - Database + calculation
5. **Implement tax calculation** - Database + function

---

**Last Updated**: 2025-01-27  
**Status**: Comprehensive gap analysis complete
