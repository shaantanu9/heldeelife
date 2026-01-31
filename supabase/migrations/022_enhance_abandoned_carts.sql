-- ============================================
-- Migration: Enhance Abandoned Cart Tracking
-- ============================================
-- Creates abandoned_carts table for proper tracking
-- and enhances cart_analytics
-- ============================================

-- ============================================
-- ABANDONED CARTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  email TEXT,
  cart_data JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  item_count INTEGER NOT NULL DEFAULT 0,
  recovery_attempts INTEGER DEFAULT 0 CHECK (recovery_attempts >= 0),
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  converted_to_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  abandoned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- When cart expires (e.g., 30 days)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE abandoned_carts IS 'Abandoned shopping carts for recovery campaigns';
COMMENT ON COLUMN abandoned_carts.cart_data IS 'Full cart items as JSON array';
COMMENT ON COLUMN abandoned_carts.recovery_attempts IS 'Number of recovery emails sent';
COMMENT ON COLUMN abandoned_carts.converted_to_order_id IS 'Order ID if cart was converted';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user 
  ON abandoned_carts(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email 
  ON abandoned_carts(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned 
  ON abandoned_carts(abandoned_at DESC, recovered) 
  WHERE recovered = false;

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered 
  ON abandoned_carts(recovered, recovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_abandoned_carts_session 
  ON abandoned_carts(session_id) 
  WHERE session_id IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Users can view own abandoned carts
CREATE POLICY "Users can view own abandoned carts"
  ON abandoned_carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all abandoned carts
CREATE POLICY "Admins can view all abandoned carts"
  ON abandoned_carts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can create abandoned carts
CREATE POLICY "System can create abandoned carts"
  ON abandoned_carts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update abandoned carts
CREATE POLICY "Admins can update abandoned carts"
  ON abandoned_carts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_abandoned_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_abandoned_carts_updated_at();

