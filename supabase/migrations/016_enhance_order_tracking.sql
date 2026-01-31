-- ============================================
-- Migration: Enhance Order Tracking
-- ============================================
-- Adds order tracking enhancements including:
-- - order_status_history table for tracking status changes
-- - carrier and estimated_delivery fields to orders
-- - product_image field to order_items
-- ============================================

-- ============================================
-- ADD FIELDS TO ORDERS TABLE
-- ============================================

-- Add carrier field for shipping carrier name
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Add estimated_delivery field
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;

-- Add customer fields if not present
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add currency field if not present
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Add payment_transaction_id if not present (for online payments)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- ============================================
-- ADD PRODUCT_IMAGE TO ORDER_ITEMS
-- ============================================

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_image TEXT;

-- ============================================
-- ORDER STATUS HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  previous_status TEXT,
  notes TEXT,
  location TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE order_status_history IS 'Complete history of order status changes for tracking';
COMMENT ON COLUMN order_status_history.status IS 'New status after the change';
COMMENT ON COLUMN order_status_history.previous_status IS 'Previous status before the change';
COMMENT ON COLUMN order_status_history.location IS 'Location where status change occurred (e.g., warehouse, transit, delivery hub)';
COMMENT ON COLUMN order_status_history.notes IS 'Additional notes about the status change';

-- ============================================
-- INDEXES FOR ORDER STATUS HISTORY
-- ============================================

-- Composite index for order status history queries (most common)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created 
  ON order_status_history(order_id, created_at DESC);

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_status 
  ON order_status_history(status, created_at DESC);

-- Index for recent status changes
CREATE INDEX IF NOT EXISTS idx_order_status_history_recent 
  ON order_status_history(created_at DESC) 
  WHERE created_at > now() - INTERVAL '30 days';

-- ============================================
-- INDEXES FOR ORDERS TABLE
-- ============================================

-- Index for carrier queries
CREATE INDEX IF NOT EXISTS idx_orders_carrier 
  ON orders(carrier) 
  WHERE carrier IS NOT NULL;

-- Index for estimated delivery queries
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery 
  ON orders(estimated_delivery) 
  WHERE estimated_delivery IS NOT NULL;

-- Composite index for tracking queries
CREATE INDEX IF NOT EXISTS idx_orders_tracking 
  ON orders(tracking_number, carrier) 
  WHERE tracking_number IS NOT NULL;

-- ============================================
-- FUNCTION TO LOG STATUS CHANGES
-- ============================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      status,
      previous_status,
      updated_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.status,
      OLD.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'shipped' AND NEW.tracking_number IS NOT NULL THEN
          'Order shipped with tracking: ' || NEW.tracking_number
        WHEN NEW.status = 'delivered' THEN
          'Order delivered successfully'
        WHEN NEW.status = 'cancelled' THEN
          COALESCE('Cancelled: ' || NEW.cancelled_reason, 'Order cancelled')
        ELSE
          NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER FOR STATUS CHANGE LOGGING
-- ============================================

DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- FUNCTION TO AUTO-SET ESTIMATED DELIVERY
-- ============================================

CREATE OR REPLACE FUNCTION set_estimated_delivery()
RETURNS TRIGGER AS $$
BEGIN
  -- Set estimated delivery when order is shipped
  IF NEW.status = 'shipped' AND NEW.estimated_delivery IS NULL THEN
    -- Default: 3-5 business days from shipping date
    NEW.estimated_delivery := NEW.shipped_at + INTERVAL '4 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER FOR ESTIMATED DELIVERY
-- ============================================

DROP TRIGGER IF EXISTS trigger_set_estimated_delivery ON orders;
CREATE TRIGGER trigger_set_estimated_delivery
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_estimated_delivery();

-- ============================================
-- ROW LEVEL SECURITY FOR ORDER_STATUS_HISTORY
-- ============================================

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view status history for their own orders
CREATE POLICY "Users can view own order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order status history
CREATE POLICY "Admins can view all order status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can insert status history
CREATE POLICY "Admins can insert order status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================
-- UPDATE TABLE STATISTICS
-- ============================================

ANALYZE orders;
ANALYZE order_items;
ANALYZE order_status_history;










