-- ============================================
-- Migration: Add Customer Loyalty Program
-- ============================================
-- Adds loyalty points system, rewards, tiers,
-- and transaction tracking
-- ============================================

-- ============================================
-- LOYALTY POINTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  lifetime_points INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  tier_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Add comments
COMMENT ON TABLE loyalty_points IS 'Customer loyalty points and tier information';
COMMENT ON COLUMN loyalty_points.points IS 'Current available points balance';
COMMENT ON COLUMN loyalty_points.lifetime_points IS 'Total points earned (never decreases)';
COMMENT ON COLUMN loyalty_points.tier IS 'Current loyalty tier based on lifetime points';
COMMENT ON COLUMN loyalty_points.tier_expires_at IS 'When tier expires (if applicable)';

-- ============================================
-- LOYALTY TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- Positive for earned, negative for redeemed
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'earned_purchase',
    'earned_referral',
    'earned_review',
    'earned_signup',
    'earned_birthday',
    'earned_anniversary',
    'redeemed_order',
    'redeemed_gift',
    'expired',
    'adjusted',
    'refunded'
  )),
  reference_id UUID, -- order_id, referral_id, review_id, etc.
  reference_type TEXT, -- 'order', 'referral', 'review', 'admin_adjustment', etc.
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL, -- Points balance after this transaction
  expires_at TIMESTAMPTZ, -- When points expire (if applicable)
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Admin who created (for adjustments)
);

-- Add comments
COMMENT ON TABLE loyalty_transactions IS 'History of all loyalty point transactions';
COMMENT ON COLUMN loyalty_transactions.points IS 'Points amount (positive for earned, negative for redeemed)';
COMMENT ON COLUMN loyalty_transactions.reference_id IS 'ID of related entity (order, referral, etc.)';
COMMENT ON COLUMN loyalty_transactions.balance_after IS 'Points balance after this transaction';

-- ============================================
-- LOYALTY REWARDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'discount_percentage',
    'discount_fixed',
    'free_shipping',
    'gift_product',
    'cashback'
  )),
  reward_value NUMERIC(10, 2), -- Discount amount, cashback amount, etc.
  reward_product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- For gift_product type
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER, -- Max times this reward can be redeemed
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE loyalty_rewards IS 'Available rewards that can be redeemed with points';
COMMENT ON COLUMN loyalty_rewards.reward_type IS 'Type of reward (discount, shipping, product, cashback)';
COMMENT ON COLUMN loyalty_rewards.reward_value IS 'Value of reward (percentage, amount, etc.)';

-- ============================================
-- LOYALTY REDEMPTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE RESTRICT,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- If redeemed for order
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'applied',
    'expired',
    'cancelled'
  )),
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE loyalty_redemptions IS 'Reward redemptions by customers';
COMMENT ON COLUMN loyalty_redemptions.status IS 'Status of redemption (pending, applied, expired, cancelled)';

-- ============================================
-- REFERRALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  email TEXT, -- Email of referred user (before signup)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'signed_up',
    'first_purchase',
    'completed'
  )),
  referrer_reward_points INTEGER DEFAULT 0,
  referred_reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Add comments
COMMENT ON TABLE referrals IS 'Customer referral program tracking';
COMMENT ON COLUMN referrals.referrer_id IS 'User who made the referral';
COMMENT ON COLUMN referrals.referred_id IS 'User who was referred (null until signup)';
COMMENT ON COLUMN referrals.referral_code IS 'Unique referral code';

-- ============================================
-- INDEXES
-- ============================================

-- Loyalty Points Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_points ON loyalty_points(points DESC);

-- Loyalty Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_reference ON loyalty_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expires ON loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL;

-- Loyalty Rewards Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_active ON loyalty_rewards(is_active, points_required) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_type ON loyalty_rewards(reward_type);

-- Loyalty Redemptions Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user ON loyalty_redemptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_reward ON loyalty_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_status ON loyalty_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_order ON loyalty_redemptions(order_id);

-- Referrals Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate tier based on lifetime points
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(points INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN points >= 10000 THEN 'diamond'
    WHEN points >= 5000 THEN 'platinum'
    WHEN points >= 2000 THEN 'gold'
    WHEN points >= 500 THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add loyalty points
CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_new_balance INTEGER;
  v_lifetime_points INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Insert or update loyalty points
  INSERT INTO loyalty_points (user_id, points, lifetime_points, tier)
  VALUES (
    p_user_id,
    p_points,
    p_points,
    calculate_loyalty_tier(p_points)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    points = loyalty_points.points + p_points,
    lifetime_points = loyalty_points.lifetime_points + p_points,
    tier = calculate_loyalty_tier(loyalty_points.lifetime_points + p_points),
    updated_at = now()
  RETURNING points, lifetime_points INTO v_new_balance, v_lifetime_points;

  -- Get new tier
  v_new_tier := calculate_loyalty_tier(v_lifetime_points);

  -- Create transaction record
  INSERT INTO loyalty_transactions (
    user_id,
    points,
    transaction_type,
    reference_id,
    reference_type,
    description,
    balance_after,
    expires_at
  )
  VALUES (
    p_user_id,
    p_points,
    p_transaction_type,
    p_reference_id,
    p_reference_type,
    p_description,
    v_new_balance,
    p_expires_at
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem loyalty points
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_user_id UUID,
  p_reward_id UUID,
  p_points INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_redemption_id UUID;
  v_current_points INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT points INTO v_current_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_current_points IS NULL OR v_current_points < p_points THEN
    RAISE EXCEPTION 'Insufficient loyalty points';
  END IF;

  -- Deduct points
  UPDATE loyalty_points
  SET
    points = points - p_points,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING points INTO v_new_balance;

  -- Create redemption record
  INSERT INTO loyalty_redemptions (
    user_id,
    reward_id,
    points_used,
    status
  )
  VALUES (
    p_user_id,
    p_reward_id,
    p_points,
    'pending'
  )
  RETURNING id INTO v_redemption_id;

  -- Create transaction record
  INSERT INTO loyalty_transactions (
    user_id,
    points,
    transaction_type,
    reference_id,
    reference_type,
    description,
    balance_after
  )
  VALUES (
    p_user_id,
    -p_points,
    'redeemed_order',
    v_redemption_id,
    'redemption',
    'Redeemed reward',
    v_new_balance
  );

  RETURN v_redemption_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();

CREATE TRIGGER update_loyalty_rewards_updated_at
  BEFORE UPDATE ON loyalty_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Loyalty Points Policies
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all loyalty points"
  ON loyalty_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Loyalty Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Loyalty Rewards Policies
CREATE POLICY "Public can view active rewards"
  ON loyalty_rewards FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage rewards"
  ON loyalty_rewards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Loyalty Redemptions Policies
CREATE POLICY "Users can view own redemptions"
  ON loyalty_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all redemptions"
  ON loyalty_redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Referrals Policies
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- INITIAL DATA
-- ============================================

-- Default loyalty rewards
INSERT INTO loyalty_rewards (name, description, points_required, reward_type, reward_value, is_active)
VALUES
  ('10% Discount', 'Get 10% off on your next order', 100, 'discount_percentage', 10, true),
  ('₹50 Off', 'Get ₹50 off on your next order', 200, 'discount_fixed', 50, true),
  ('Free Shipping', 'Free shipping on your next order', 150, 'free_shipping', 0, true),
  ('₹100 Cashback', 'Get ₹100 cashback', 500, 'cashback', 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION calculate_loyalty_tier IS 'Calculates loyalty tier based on lifetime points';
COMMENT ON FUNCTION add_loyalty_points IS 'Adds loyalty points to user account and creates transaction record';
COMMENT ON FUNCTION redeem_loyalty_points IS 'Redeems loyalty points for a reward';









