-- ============================================
-- Migration: Add Returns, Notifications, and Settings
-- ============================================
-- Adds returns management, notifications system,
-- app settings, and payment transactions
-- ============================================

-- ============================================
-- RETURNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'defective',
    'wrong_item',
    'damaged',
    'not_as_described',
    'size_issue',
    'changed_mind',
    'other'
  )),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'picked_up',
    'received',
    'processed',
    'refunded'
  )),
  return_type TEXT CHECK (return_type IN ('refund', 'exchange', 'store_credit')),
  exchange_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  refund_amount NUMERIC(10, 2) CHECK (refund_amount >= 0),
  pickup_address JSONB,
  tracking_number TEXT,
  picked_up_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE returns IS 'Product return requests and management';
COMMENT ON COLUMN returns.return_type IS 'Type of return: refund, exchange, or store credit';
COMMENT ON COLUMN returns.exchange_product_id IS 'Product ID for exchange (if return_type is exchange)';

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'order_placed',
    'order_confirmed',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'payment_success',
    'payment_failed',
    'review_request',
    'return_approved',
    'return_rejected',
    'promotion',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data (order_id, product_id, etc.)
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications (in-app, email, SMS)';
COMMENT ON COLUMN notifications.data IS 'Additional notification data as JSON (order_id, product_id, etc.)';

-- ============================================
-- APP SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'payment', 'shipping', 'email', 'general', 'site'
  is_public BOOLEAN DEFAULT false, -- Can be accessed without auth
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE app_settings IS 'Application-wide settings and configuration';
COMMENT ON COLUMN app_settings.is_public IS 'Whether this setting can be accessed without authentication';

-- ============================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_gateway TEXT NOT NULL, -- 'razorpay', 'stripe', 'cod'
  transaction_id TEXT NOT NULL,
  payment_id TEXT, -- Gateway payment ID
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'processing',
    'success',
    'failed',
    'refunded',
    'partially_refunded'
  )),
  payment_method TEXT, -- 'card', 'upi', 'netbanking', 'wallet', 'cod'
  gateway_response JSONB, -- Full gateway response
  failure_reason TEXT,
  refund_amount NUMERIC(10, 2) DEFAULT 0 CHECK (refund_amount >= 0),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE payment_transactions IS 'Detailed payment transaction history';
COMMENT ON COLUMN payment_transactions.gateway_response IS 'Full response from payment gateway';

-- ============================================
-- SAVED CARTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest users
  items JSONB NOT NULL, -- Cart items
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Add comments
COMMENT ON TABLE saved_carts IS 'Saved carts for logged-out users or abandoned carts';
COMMENT ON COLUMN saved_carts.session_id IS 'Session ID for guest users';

-- ============================================
-- INDEXES FOR RETURNS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_returns_user_status 
  ON returns(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_returns_order 
  ON returns(order_id);

CREATE INDEX IF NOT EXISTS idx_returns_pending 
  ON returns(status, created_at DESC) 
  WHERE status = 'pending';

-- ============================================
-- INDEXES FOR NOTIFICATIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type, created_at DESC);

-- ============================================
-- INDEXES FOR APP SETTINGS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_app_settings_key 
  ON app_settings(key);

CREATE INDEX IF NOT EXISTS idx_app_settings_category 
  ON app_settings(category) 
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_settings_public 
  ON app_settings(key) 
  WHERE is_public = true;

-- ============================================
-- INDEXES FOR PAYMENT TRANSACTIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order 
  ON payment_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user 
  ON payment_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
  ON payment_transactions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway 
  ON payment_transactions(payment_gateway, status);

-- ============================================
-- INDEXES FOR SAVED CARTS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_saved_carts_user 
  ON saved_carts(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_carts_session 
  ON saved_carts(session_id) 
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_carts_expires 
  ON saved_carts(expires_at) 
  WHERE expires_at IS NOT NULL;

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

-- Triggers for returns
DROP TRIGGER IF EXISTS update_returns_updated_at ON returns;
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for app_settings
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for payment_transactions
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for saved_carts
DROP TRIGGER IF EXISTS update_saved_carts_updated_at ON saved_carts;
CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON saved_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create Notification
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark Notification as Read
-- ============================================

CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = now()
  WHERE id = p_notification_id
  AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get Unread Notification Count
-- ============================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id
  AND is_read = false;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Returns - users can view/manage own, admins can view all
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all returns"
  ON returns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Notifications - users can view own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be validated by application logic

-- App settings - public read for public settings, admin write
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public settings"
  ON app_settings FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Authenticated can view all settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Payment transactions - users can view own, admins can view all
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Saved carts - users can manage own
ALTER TABLE saved_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved carts"
  ON saved_carts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- SEED INITIAL APP SETTINGS
-- ============================================

INSERT INTO app_settings (key, value, description, category, is_public) VALUES
  ('site_name', '"HeldeeLife"', 'Site name', 'site', true),
  ('site_description', '"Your Health & Wellness Partner"', 'Site description', 'site', true),
  ('free_shipping_threshold', '500', 'Order amount for free shipping', 'shipping', true),
  ('default_shipping_cost', '99', 'Default shipping cost in INR', 'shipping', true),
  ('default_tax_rate', '18', 'Default tax rate percentage', 'tax', true),
  ('currency', '"INR"', 'Default currency', 'general', true),
  ('maintenance_mode', 'false', 'Maintenance mode enabled', 'general', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- UPDATE TABLE STATISTICS
-- ============================================

ANALYZE returns;
ANALYZE notifications;
ANALYZE app_settings;
ANALYZE payment_transactions;
ANALYZE saved_carts;










