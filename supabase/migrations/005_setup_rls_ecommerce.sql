-- ============================================
-- Migration: RLS Policies for E-commerce Features
-- ============================================

-- Enable RLS
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- User Addresses Policies
CREATE POLICY "Users can view own addresses"
  ON user_addresses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own addresses"
  ON user_addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses"
  ON user_addresses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON user_addresses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Product Reviews Policies
CREATE POLICY "Public can view approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can view own reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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

-- Wishlist Policies
CREATE POLICY "Users can view own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add to own wishlist"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from own wishlist"
  ON wishlist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Coupons Policies
CREATE POLICY "Public can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Coupon Usage Policies
CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create coupon usage"
  ON coupon_usage FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );










