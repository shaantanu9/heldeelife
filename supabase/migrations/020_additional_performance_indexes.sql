-- ============================================
-- Migration: Additional Performance Indexes
-- ============================================
-- Adds missing indexes for frequently queried columns
-- to further optimize query performance
-- ============================================

-- ============================================
-- PRODUCTS TABLE - Additional Indexes
-- ============================================

-- Index for slug lookups (used in getProduct by slug)
-- This is critical for product detail pages
CREATE INDEX IF NOT EXISTS idx_products_slug_active 
  ON products(slug, is_active) 
  WHERE is_active = true;

-- Index for short_description search (used in search queries)
CREATE INDEX IF NOT EXISTS idx_products_short_description_trgm 
  ON products USING gin(short_description gin_trgm_ops);

-- Index for SKU search (used in search queries)
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm 
  ON products USING gin(sku gin_trgm_ops) 
  WHERE sku IS NOT NULL;

-- ============================================
-- PRODUCT CATEGORIES TABLE - Additional Indexes
-- ============================================

-- Index for slug lookups (used in getProducts by category slug)
CREATE INDEX IF NOT EXISTS idx_product_categories_slug_active 
  ON product_categories(slug, is_active) 
  WHERE is_active = true;

-- ============================================
-- INVENTORY TABLE - Additional Indexes
-- ============================================

-- Index for product_id lookups (most common inventory query)
-- Used when fetching inventory for products
CREATE INDEX IF NOT EXISTS idx_inventory_product_id 
  ON inventory(product_id);

-- Composite index for available quantity queries
CREATE INDEX IF NOT EXISTS idx_inventory_product_available 
  ON inventory(product_id, available_quantity);

-- ============================================
-- ORDER ITEMS TABLE - Additional Indexes
-- ============================================

-- Index for product_id lookups (used in analytics)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON order_items(product_id);

-- ============================================
-- PRODUCT REVIEWS TABLE - Additional Indexes
-- ============================================

-- Index for product_id lookups (used when fetching reviews for a product)
-- This complements the existing composite index
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id 
  ON product_reviews(product_id);

-- ============================================
-- BLOG POSTS TABLE - Additional Indexes
-- ============================================

-- Index for slug lookups (used in getBlogPost by slug)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug_status 
  ON blog_posts(slug, status) 
  WHERE status = 'published';

-- ============================================
-- BLOG CATEGORIES TABLE - Additional Indexes
-- ============================================

-- Index for slug lookups (used in getBlogPosts by category slug)
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug 
  ON blog_categories(slug);

-- ============================================
-- ANALYZE TABLES FOR OPTIMIZATION
-- ============================================

-- Update table statistics for query planner
ANALYZE products;
ANALYZE product_categories;
ANALYZE inventory;
ANALYZE order_items;
ANALYZE product_reviews;
ANALYZE blog_posts;
ANALYZE blog_categories;










