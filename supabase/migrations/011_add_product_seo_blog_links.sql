-- ============================================
-- Migration: Add Product SEO and Blog Links
-- ============================================
-- Adds blog links (internal/external) and ensures
-- SEO fields are properly indexed for better search visibility
-- ============================================

-- Add blog_links column to products table (JSONB array)
-- Format: [{"type": "internal"|"external", "url": "string", "title": "string"}]
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS blog_links JSONB DEFAULT '[]'::jsonb;

-- Add FAQ column to products table (JSONB array)
-- Format: [{"question": "string", "answer": "string"}]
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- Ensure SEO fields exist (they should already exist, but adding IF NOT EXISTS for safety)
DO $$
BEGIN
  -- meta_title, meta_description, meta_keywords should already exist
  -- Just ensure they're properly indexed
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'products' 
    AND indexname = 'idx_products_meta_keywords_gin'
  ) THEN
    CREATE INDEX idx_products_meta_keywords_gin 
      ON products USING gin(meta_keywords);
  END IF;
END $$;

-- Add GIN index for blog_links for efficient querying
CREATE INDEX IF NOT EXISTS idx_products_blog_links_gin 
  ON products USING gin(blog_links);

-- Add GIN index for FAQ for efficient querying
CREATE INDEX IF NOT EXISTS idx_products_faq_gin 
  ON products USING gin(faq);

-- Add comments for documentation
COMMENT ON COLUMN products.blog_links IS 'Array of blog links (internal/external) in format: [{"type": "internal"|"external", "url": "string", "title": "string"}]';
COMMENT ON COLUMN products.faq IS 'FAQ section in format: [{"question": "string", "answer": "string"}]';

-- Update table statistics
ANALYZE products;










