-- ============================================
-- Migration: Admin Features Database Optimization
-- ============================================
-- Adds missing columns, indexes, and optimizations
-- for admin dashboard features (blog categories, tags, coupons, reviews)
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS
-- ============================================

-- Add updated_at column to blog_tags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'blog_tags'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE blog_tags ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================
-- 2. ADD TRIGGERS FOR UPDATED_AT
-- ============================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for blog_tags updated_at
DROP TRIGGER IF EXISTS update_blog_tags_updated_at ON blog_tags;
CREATE TRIGGER update_blog_tags_updated_at
  BEFORE UPDATE ON blog_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. BLOG CATEGORIES INDEXES
-- ============================================

-- Index for sorting by creation date (admin list views)
CREATE INDEX IF NOT EXISTS idx_blog_categories_created_at 
  ON blog_categories(created_at DESC);

-- Index for sorting by update date (admin list views)
CREATE INDEX IF NOT EXISTS idx_blog_categories_updated_at 
  ON blog_categories(updated_at DESC);

-- Composite index for name search and sorting
CREATE INDEX IF NOT EXISTS idx_blog_categories_name_created 
  ON blog_categories(name, created_at DESC);

-- ============================================
-- 4. BLOG TAGS INDEXES
-- ============================================

-- Index for sorting by creation date (admin list views)
CREATE INDEX IF NOT EXISTS idx_blog_tags_created_at 
  ON blog_tags(created_at DESC);

-- Index for sorting by update date (admin list views)
CREATE INDEX IF NOT EXISTS idx_blog_tags_updated_at 
  ON blog_tags(updated_at DESC);

-- Composite index for name search and sorting
CREATE INDEX IF NOT EXISTS idx_blog_tags_name_created 
  ON blog_tags(name, created_at DESC);

-- ============================================
-- 5. COUPONS INDEXES
-- ============================================

-- Index for sorting by creation date (admin list views)
CREATE INDEX IF NOT EXISTS idx_coupons_created_at 
  ON coupons(created_at DESC);

-- Index for sorting by update date (admin list views)
CREATE INDEX IF NOT EXISTS idx_coupons_updated_at 
  ON coupons(updated_at DESC);

-- Composite index for active coupons sorted by validity
CREATE INDEX IF NOT EXISTS idx_coupons_active_validity 
  ON coupons(is_active, valid_from, valid_until DESC NULLS LAST)
  WHERE is_active = true;

-- Composite index for coupon code lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_coupons_code_lower 
  ON coupons(LOWER(code));

-- Index for usage tracking queries
CREATE INDEX IF NOT EXISTS idx_coupons_usage_limit 
  ON coupons(usage_limit, used_count)
  WHERE usage_limit IS NOT NULL;

-- ============================================
-- 6. PRODUCT REVIEWS INDEXES
-- ============================================

-- Index for sorting by update date (admin moderation)
CREATE INDEX IF NOT EXISTS idx_product_reviews_updated_at 
  ON product_reviews(updated_at DESC);

-- Composite index for pending reviews (admin moderation)
CREATE INDEX IF NOT EXISTS idx_product_reviews_pending 
  ON product_reviews(is_approved, created_at DESC)
  WHERE is_approved = false;

-- Composite index for approved reviews by rating
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved_rating 
  ON product_reviews(is_approved, rating DESC, created_at DESC)
  WHERE is_approved = true;

-- Index for verified purchase reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified 
  ON product_reviews(is_verified_purchase, is_approved)
  WHERE is_verified_purchase = true AND is_approved = true;

-- ============================================
-- 7. COUPON USAGE INDEXES
-- ============================================

-- Index for sorting by creation date (admin analytics)
CREATE INDEX IF NOT EXISTS idx_coupon_usage_created_at 
  ON coupon_usage(created_at DESC);

-- Composite index for coupon analytics (usage by coupon)
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_created 
  ON coupon_usage(coupon_id, created_at DESC);

-- Index for order lookup
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order 
  ON coupon_usage(order_id);

-- ============================================
-- 8. BLOG POST TAGS INDEXES (if needed)
-- ============================================

-- Composite index for tag usage queries (count posts per tag)
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_post 
  ON blog_post_tags(tag_id, post_id);

-- ============================================
-- 9. PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Analyze tables to update statistics
ANALYZE blog_categories;
ANALYZE blog_tags;
ANALYZE coupons;
ANALYZE product_reviews;
ANALYZE coupon_usage;
ANALYZE blog_post_tags;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_blog_categories_created_at IS 'Index for sorting blog categories by creation date in admin views';
COMMENT ON INDEX idx_blog_categories_updated_at IS 'Index for sorting blog categories by update date in admin views';
COMMENT ON INDEX idx_blog_tags_created_at IS 'Index for sorting blog tags by creation date in admin views';
COMMENT ON INDEX idx_blog_tags_updated_at IS 'Index for sorting blog tags by update date in admin views';
COMMENT ON INDEX idx_coupons_created_at IS 'Index for sorting coupons by creation date in admin views';
COMMENT ON INDEX idx_coupons_updated_at IS 'Index for sorting coupons by update date in admin views';
COMMENT ON INDEX idx_coupons_active_validity IS 'Index for filtering active coupons by validity period';
COMMENT ON INDEX idx_coupons_code_lower IS 'Index for case-insensitive coupon code lookups';
COMMENT ON INDEX idx_product_reviews_updated_at IS 'Index for sorting reviews by update date in admin moderation';
COMMENT ON INDEX idx_product_reviews_pending IS 'Index for filtering pending reviews in admin moderation';
COMMENT ON INDEX idx_coupon_usage_created_at IS 'Index for sorting coupon usage by date in admin analytics';










