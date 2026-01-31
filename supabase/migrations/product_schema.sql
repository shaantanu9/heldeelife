-- ============================================
-- Product Management Schema
-- ============================================
-- This file contains the complete database schema for:
-- - Product Categories
-- - Products
-- - Inventory Management
-- - Orders and Order Items
-- - Product Analytics
-- - Inventory Alerts
--
-- Created: 2025-01-XX
-- Project: heldeelife
-- ============================================

-- ============================================
-- TABLES
-- ============================================

-- Product Categories
-- Supports hierarchical categories with parent-child relationships
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
-- Main products table with comprehensive product information
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  cost_price NUMERIC(10, 2) CHECK (cost_price >= 0),
  sku TEXT UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image TEXT,
  images TEXT[],
  benefits TEXT[],
  ingredients TEXT,
  usage_instructions TEXT,
  storage_instructions TEXT,
  expiry_info TEXT,
  manufacturer TEXT,
  rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  weight NUMERIC(10, 2),
  dimensions JSONB,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Inventory
-- Stock management with support for multiple locations and batches
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0),
  reorder_point INTEGER DEFAULT 20 CHECK (reorder_point >= 0),
  reorder_quantity INTEGER DEFAULT 50 CHECK (reorder_quantity >= 0),
  location TEXT,
  batch_number TEXT,
  expiry_date DATE,
  cost_per_unit NUMERIC(10, 2),
  supplier TEXT,
  supplier_sku TEXT,
  notes TEXT,
  last_restocked_at TIMESTAMPTZ,
  last_restocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, location, batch_number)
);

-- Inventory History
-- Audit trail for all inventory changes
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'sale', 'return', 'adjustment', 'reserve', 'unreserve', 'damaged', 'expired')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
-- Customer orders with payment and shipping information
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT,
  payment_transaction_id TEXT,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'INR',
  shipping_address JSONB,
  billing_address JSONB,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  notes TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
-- Individual items in an order (with price snapshots)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Product Views
-- Track product page views
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Product Sales Analytics
-- Daily aggregated sales and view analytics
CREATE TABLE IF NOT EXISTS product_sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  quantity_sold INTEGER DEFAULT 0,
  revenue NUMERIC(10, 2) DEFAULT 0,
  average_order_value NUMERIC(10, 2) DEFAULT 0,
  conversion_rate NUMERIC(5, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, date)
);

-- Cart Analytics
-- Track cart additions, removals, and conversions
CREATE TABLE IF NOT EXISTS cart_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

-- Product Searches
-- Track product search queries
CREATE TABLE IF NOT EXISTS product_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  results_count INTEGER,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  searched_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory Alerts
-- Alerts for inventory issues
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder_needed', 'expiring_soon', 'expired')),
  current_quantity INTEGER NOT NULL,
  threshold_quantity INTEGER,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
-- (See migration files for complete index definitions)

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- (See migration files for complete RLS policy definitions)

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================
-- (See migration files for complete function and trigger definitions)

-- ============================================
-- VIEWS
-- ============================================

-- Products with Inventory Status
CREATE OR REPLACE VIEW products_with_inventory AS
SELECT 
  p.*,
  COALESCE(SUM(i.quantity), 0) as total_quantity,
  COALESCE(SUM(i.reserved_quantity), 0) as total_reserved,
  COALESCE(SUM(i.available_quantity), 0) as total_available,
  CASE 
    WHEN COALESCE(SUM(i.available_quantity), 0) = 0 THEN 'out_of_stock'
    WHEN COALESCE(SUM(i.available_quantity), 0) <= MIN(i.low_stock_threshold) THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  MIN(i.low_stock_threshold) as low_stock_threshold,
  MIN(i.reorder_point) as reorder_point
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id;

-- Daily Sales Summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(o.created_at) as sale_date,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.user_id) as unique_customers,
  SUM(o.total_amount) as total_revenue,
  SUM(oi.quantity) as total_items_sold,
  AVG(o.total_amount) as average_order_value
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status IN ('confirmed', 'shipped', 'delivered')
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Product Performance
CREATE OR REPLACE VIEW product_performance AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.price,
  p.views_count,
  p.sales_count,
  p.rating,
  p.reviews_count,
  COALESCE(SUM(oi.quantity), 0) as units_sold,
  COALESCE(SUM(oi.total_price), 0) as revenue,
  COALESCE(SUM(i.available_quantity), 0) as current_stock,
  CASE 
    WHEN p.views_count > 0 THEN (p.sales_count::NUMERIC / p.views_count::NUMERIC) * 100
    ELSE 0
  END as conversion_rate
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = oi.order_id 
    AND o.status IN ('confirmed', 'shipped', 'delivered')
  )
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id, p.name, p.sku, p.price, p.views_count, p.sales_count, p.rating, p.reviews_count;

-- ============================================
-- USAGE NOTES
-- ============================================

-- 1. Product Categories can be hierarchical (parent_id)
-- 2. Inventory supports multiple locations and batches per product
-- 3. Orders automatically generate order numbers
-- 4. Inventory is automatically updated when orders are confirmed/shipped
-- 5. Product sales_count is automatically updated when orders are confirmed
-- 6. Inventory alerts are automatically created for low stock, out of stock, etc.
-- 7. Product views_count is automatically updated when product_views are inserted
-- 8. All tables have RLS enabled with appropriate policies
-- 9. Use the helper views for common queries:
--    - products_with_inventory: Products with stock status
--    - daily_sales_summary: Daily sales metrics
--    - product_performance: Product performance metrics










