-- ============================================
-- Migration: Optimize Database Indexes
-- ============================================
-- Adds comprehensive indexes to improve query performance
-- for common filtering, sorting, and search operations
-- ============================================

-- ============================================
-- ENABLE EXTENSIONS FOR FULL-TEXT SEARCH
-- ============================================

-- Enable pg_trgm extension for trigram-based text search
-- Must be enabled before creating GIN indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- PRODUCTS TABLE INDEXES
-- ============================================

-- Composite index for public product listings (most common query)
-- Used when filtering by active status and featured, ordered by created_at
CREATE INDEX IF NOT EXISTS idx_products_active_featured_created 
  ON products(is_active, is_featured, created_at DESC) 
  WHERE is_active = true;

-- Composite index for category filtering with active status
-- Used when filtering products by category
CREATE INDEX IF NOT EXISTS idx_products_category_active_created 
  ON products(category_id, is_active, created_at DESC) 
  WHERE is_active = true;

-- Composite index for price-based sorting
-- Used when sorting products by price
CREATE INDEX IF NOT EXISTS idx_products_active_price 
  ON products(is_active, price) 
  WHERE is_active = true;

-- Composite index for rating-based sorting
-- Used when sorting products by rating
CREATE INDEX IF NOT EXISTS idx_products_active_rating 
  ON products(is_active, rating DESC NULLS LAST) 
  WHERE is_active = true;

-- Composite index for sales-based sorting
-- Used when sorting products by popularity/sales
CREATE INDEX IF NOT EXISTS idx_products_active_sales 
  ON products(is_active, sales_count DESC) 
  WHERE is_active = true;

-- Full-text search index for product search
-- Used for searching in name, description, short_description
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
  ON products USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
  ON products USING gin(description gin_trgm_ops);

-- Index for SKU lookups (already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_products_sku_lookup 
  ON products(sku) 
  WHERE sku IS NOT NULL;

-- Index for tags array searches
CREATE INDEX IF NOT EXISTS idx_products_tags_gin 
  ON products USING gin(tags);

-- ============================================
-- ORDERS TABLE INDEXES
-- ============================================

-- Composite index for user order queries (most common)
-- Used when users view their orders filtered by status
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created 
  ON orders(user_id, status, created_at DESC);

-- Composite index for admin order queries
-- Used when admins view all orders filtered by status
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
  ON orders(status, created_at DESC);

-- Composite index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_payment 
  ON orders(status, payment_status, created_at DESC);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_range 
  ON orders(created_at DESC);

-- Index for order number lookups (already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_orders_order_number_lookup 
  ON orders(order_number);

-- ============================================
-- ORDER ITEMS TABLE INDEXES
-- ============================================

-- Composite index for order items with product info
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
  ON order_items(order_id, product_id);

-- ============================================
-- BLOG POSTS TABLE INDEXES
-- ============================================

-- Composite index for public blog listings (most common query)
-- Used when showing published posts ordered by published_at
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published 
  ON blog_posts(status, published_at DESC NULLS LAST) 
  WHERE status = 'published';

-- Composite index for category filtering with status
-- Used when filtering blog posts by category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status_published 
  ON blog_posts(category_id, status, published_at DESC NULLS LAST) 
  WHERE status = 'published';

-- Composite index for author queries
-- Used when users view their own posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_status_created 
  ON blog_posts(author_id, status, created_at DESC);

-- Full-text search index for blog search
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm 
  ON blog_posts USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_blog_posts_excerpt_trgm 
  ON blog_posts USING gin(excerpt gin_trgm_ops);

-- Index for views count sorting
CREATE INDEX IF NOT EXISTS idx_blog_posts_views 
  ON blog_posts(views_count DESC) 
  WHERE status = 'published';

-- ============================================
-- PRODUCT REVIEWS TABLE INDEXES
-- ============================================

-- Composite index for product reviews (most common query)
-- Used when showing approved reviews for a product
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_approved_created 
  ON product_reviews(product_id, is_approved, created_at DESC) 
  WHERE is_approved = true;

-- Composite index for user reviews
-- Used when users view their own reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_created 
  ON product_reviews(user_id, created_at DESC);

-- Composite index for rating filtering
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_rating 
  ON product_reviews(product_id, rating DESC, is_approved) 
  WHERE is_approved = true;

-- ============================================
-- INVENTORY TABLE INDEXES
-- ============================================

-- Composite index for low stock queries
-- Used when filtering inventory by low stock threshold
-- Note: Partial index with column reference in WHERE clause requires a function-based approach
-- Using a simpler index that can be filtered in queries
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
  ON inventory(product_id, available_quantity);

-- Index for location-based inventory queries
CREATE INDEX IF NOT EXISTS idx_inventory_location 
  ON inventory(location, product_id);

-- ============================================
-- INVENTORY HISTORY TABLE INDEXES
-- ============================================

-- Composite index for product inventory history
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_created 
  ON inventory_history(product_id, created_at DESC);

-- Composite index for change type filtering
CREATE INDEX IF NOT EXISTS idx_inventory_history_type_created 
  ON inventory_history(change_type, created_at DESC);

-- ============================================
-- USER ADDRESSES TABLE INDEXES
-- ============================================

-- Composite index for user default address lookup
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_default 
  ON user_addresses(user_id, is_default) 
  WHERE is_default = true;

-- ============================================
-- WISHLIST TABLE INDEXES
-- ============================================

-- Composite index already exists (user_id, product_id) via UNIQUE constraint
-- Adding explicit index for reverse lookups
CREATE INDEX IF NOT EXISTS idx_wishlist_product_user 
  ON wishlist(product_id, user_id);

-- ============================================
-- COUPONS TABLE INDEXES
-- ============================================

-- Composite index for active coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_active_valid 
  ON coupons(is_active, valid_from, valid_until) 
  WHERE is_active = true;

-- Index for discount type filtering
CREATE INDEX IF NOT EXISTS idx_coupons_type_active 
  ON coupons(discount_type, is_active) 
  WHERE is_active = true;

-- ============================================
-- COUPON USAGE TABLE INDEXES
-- ============================================

-- Composite index for user coupon usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_created 
  ON coupon_usage(user_id, created_at DESC);

-- ============================================
-- PRODUCT CATEGORIES TABLE INDEXES
-- ============================================

-- Composite index for active categories with hierarchy
CREATE INDEX IF NOT EXISTS idx_product_categories_parent_active 
  ON product_categories(parent_id, is_active, display_order) 
  WHERE is_active = true;

-- ============================================
-- BLOG CATEGORIES TABLE INDEXES
-- ============================================

-- Index for category slug lookups (already exists, but ensuring it's optimal)
-- The existing index is sufficient

-- ============================================
-- BLOG POST TAGS TABLE INDEXES
-- ============================================

-- Composite index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_post 
  ON blog_post_tags(tag_id, post_id);

-- ============================================
-- ANALYZE TABLES FOR OPTIMIZATION
-- ============================================

-- Update table statistics for query planner
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE blog_posts;
ANALYZE product_reviews;
ANALYZE inventory;
ANALYZE inventory_history;
ANALYZE user_addresses;
ANALYZE wishlist;
ANALYZE coupons;
ANALYZE coupon_usage;
ANALYZE product_categories;
ANALYZE blog_categories;
ANALYZE blog_post_tags;
ANALYZE users;
ANALYZE password_reset_attempts;

