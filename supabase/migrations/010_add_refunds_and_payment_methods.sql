-- ============================================
-- Migration: Add Refunds and Payment Methods
-- ============================================
-- Adds refunds and payment_methods tables with
-- proper indexes, RLS policies, and triggers
-- ============================================

-- ============================================
-- REFUNDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'defective',
    'wrong_item',
    'damaged',
    'not_as_described',
    'changed_mind',
    'other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'processed'
  )),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE refunds IS 'Customer refund requests for orders';
COMMENT ON COLUMN refunds.reason IS 'Reason for refund request';
COMMENT ON COLUMN refunds.status IS 'Current status of refund request';
COMMENT ON COLUMN refunds.amount IS 'Refund amount (typically matches order total)';
COMMENT ON COLUMN refunds.rejection_reason IS 'Reason provided if refund is rejected';
COMMENT ON COLUMN refunds.processed_at IS 'Timestamp when refund was processed';

-- ============================================
-- PAYMENT METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'card',
    'upi',
    'netbanking',
    'wallet'
  )),
  provider TEXT NOT NULL,
  last_four TEXT,
  expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year INTEGER CHECK (expiry_year >= 2020 AND expiry_year <= 2100),
  cardholder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE payment_methods IS 'User saved payment methods for faster checkout';
COMMENT ON COLUMN payment_methods.type IS 'Type of payment method';
COMMENT ON COLUMN payment_methods.provider IS 'Payment provider (bank name, UPI ID, wallet name, etc.)';
COMMENT ON COLUMN payment_methods.last_four IS 'Last 4 digits of card number (for cards only)';
COMMENT ON COLUMN payment_methods.is_default IS 'Whether this is the default payment method';

-- ============================================
-- INDEXES FOR REFUNDS TABLE
-- ============================================

-- Composite index for user refund queries (most common)
-- Used when users view their refund requests
CREATE INDEX IF NOT EXISTS idx_refunds_user_status_created 
  ON refunds(user_id, status, created_at DESC);

-- Composite index for order refund lookup
-- Used when checking if order has refund
CREATE INDEX IF NOT EXISTS idx_refunds_order_status 
  ON refunds(order_id, status);

-- Composite index for admin refund queries
-- Used when admins view all refunds filtered by status
CREATE INDEX IF NOT EXISTS idx_refunds_status_created 
  ON refunds(status, created_at DESC);

-- Index for pending refunds (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_refunds_pending 
  ON refunds(status, created_at DESC) 
  WHERE status = 'pending';

-- Partial unique index to ensure only one pending refund per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_order_pending_unique 
  ON refunds(order_id) 
  WHERE status = 'pending';

-- Index for processed refunds
CREATE INDEX IF NOT EXISTS idx_refunds_processed 
  ON refunds(processed_at DESC) 
  WHERE processed_at IS NOT NULL;

-- ============================================
-- INDEXES FOR PAYMENT METHODS TABLE
-- ============================================

-- Composite index for user payment methods (most common)
-- Used when users view their saved payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default 
  ON payment_methods(user_id, is_default DESC, created_at DESC);

-- Index for default payment method lookup
-- Used when finding user's default payment method
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_default_true 
  ON payment_methods(user_id, is_default) 
  WHERE is_default = true;

-- Index for type-based filtering
CREATE INDEX IF NOT EXISTS idx_payment_methods_type 
  ON payment_methods(user_id, type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for refunds updated_at
DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payment_methods updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for default payment method
DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON payment_methods;
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Function to validate refund amount doesn't exceed order total
CREATE OR REPLACE FUNCTION validate_refund_amount()
RETURNS TRIGGER AS $$
DECLARE
  order_total NUMERIC(10, 2);
BEGIN
  SELECT total_amount INTO order_total
  FROM orders
  WHERE id = NEW.order_id;
  
  IF NEW.amount > order_total THEN
    RAISE EXCEPTION 'Refund amount cannot exceed order total';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for refund amount validation
DROP TRIGGER IF EXISTS trigger_validate_refund_amount ON refunds;
CREATE TRIGGER trigger_validate_refund_amount
  BEFORE INSERT OR UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION validate_refund_amount();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REFUNDS RLS POLICIES
-- ============================================

-- Users can view own refunds
CREATE POLICY "Users can view own refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create own refund requests
CREATE POLICY "Users can create own refunds"
  ON refunds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own pending refunds (to add more details)
CREATE POLICY "Users can update own pending refunds"
  ON refunds FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can manage all refunds
CREATE POLICY "Admins can manage all refunds"
  ON refunds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- PAYMENT METHODS RLS POLICIES
-- ============================================

-- Users can view own payment methods
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create own payment methods
CREATE POLICY "Users can create own payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update own payment methods
CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete own payment methods
CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all payment methods (for support purposes)
CREATE POLICY "Admins can view all payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- UPDATE TABLE STATISTICS
-- ============================================

-- Update table statistics for query planner
ANALYZE refunds;
ANALYZE payment_methods;

