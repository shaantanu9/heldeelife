-- ============================================
-- Migration: Enhance Product Reviews System
-- ============================================
-- Adds review images, helpful votes tracking,
-- admin responses, and improved schema
-- ============================================

-- Add new columns to product_reviews table
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS review_images TEXT[],
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_response_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

-- Add comment for new columns
COMMENT ON COLUMN product_reviews.review_images IS 'Array of image URLs uploaded with the review';
COMMENT ON COLUMN product_reviews.admin_response IS 'Response from admin/seller to the review';
COMMENT ON COLUMN product_reviews.admin_response_at IS 'Timestamp when admin responded';
COMMENT ON COLUMN product_reviews.admin_response_by IS 'Admin user who responded';
COMMENT ON COLUMN product_reviews.moderation_status IS 'Moderation status: pending, approved, rejected, or flagged';

-- Update existing is_approved to match moderation_status
UPDATE product_reviews
SET moderation_status = CASE
  WHEN is_approved = true THEN 'approved'
  ELSE 'pending'
END
WHERE moderation_status = 'pending';

-- Create review_helpful_votes table for tracking helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Add comments
COMMENT ON TABLE review_helpful_votes IS 'Tracks which users found reviews helpful';
COMMENT ON COLUMN review_helpful_votes.is_helpful IS 'True if user found review helpful, false if not helpful';

-- Create indexes for review_helpful_votes
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review 
  ON review_helpful_votes(review_id);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user 
  ON review_helpful_votes(user_id);

-- Composite index for counting helpful votes
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_helpful 
  ON review_helpful_votes(review_id, is_helpful) 
  WHERE is_helpful = true;

-- Update helpful_count trigger function
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
DECLARE
  v_review_id UUID;
BEGIN
  -- Get review_id from NEW (INSERT/UPDATE) or OLD (DELETE)
  IF TG_OP = 'DELETE' THEN
    v_review_id := OLD.review_id;
  ELSE
    v_review_id := NEW.review_id;
  END IF;

  UPDATE product_reviews
  SET helpful_count = (
    SELECT COUNT(*)
    FROM review_helpful_votes
    WHERE review_id = v_review_id
    AND is_helpful = true
  )
  WHERE id = v_review_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for helpful count
DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON review_helpful_votes;
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- Update product rating function to use moderation_status
-- Handle both INSERT/UPDATE and DELETE cases
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get product_id from NEW (INSERT/UPDATE) or OLD (DELETE)
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  UPDATE products
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM product_reviews
      WHERE product_id = v_product_id
      AND moderation_status = 'approved'
    ),
    reviews_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = v_product_id
      AND moderation_status = 'approved'
    )
  WHERE id = v_product_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add index for moderation_status filtering
CREATE INDEX IF NOT EXISTS idx_product_reviews_moderation_status 
  ON product_reviews(moderation_status, created_at DESC);

-- Composite index for approved reviews by product
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_approved_rating 
  ON product_reviews(product_id, moderation_status, rating DESC, created_at DESC)
  WHERE moderation_status = 'approved';

-- Enable RLS on review_helpful_votes
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_helpful_votes
CREATE POLICY "Public can view helpful votes"
  ON review_helpful_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create own helpful votes"
  ON review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own helpful votes"
  ON review_helpful_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own helpful votes"
  ON review_helpful_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Update RLS policies for product_reviews to use moderation_status
DROP POLICY IF EXISTS "Public can view approved reviews" ON product_reviews;
CREATE POLICY "Public can view approved reviews"
  ON product_reviews FOR SELECT
  USING (moderation_status = 'approved');

-- Update existing policies to allow admins to see all reviews
DROP POLICY IF EXISTS "Admins can manage all reviews" ON product_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON product_reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add policy for users to update moderation_status (admin only via API)
-- This is handled by the admin check in the API, but we add it for completeness

-- Update table statistics
ANALYZE product_reviews;
ANALYZE review_helpful_votes;

