-- ============================================
-- Migration: Backend Improvements
-- ============================================
-- Adds database functions for inventory management,
-- order processing, and analytics
-- ============================================

-- Function to update inventory on order status change
CREATE OR REPLACE FUNCTION update_inventory_on_order_status()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Only process if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Handle different status transitions
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Reserve inventory when order is confirmed
    FOR item_record IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      IF item_record.product_id IS NOT NULL THEN
        UPDATE inventory
        SET reserved_quantity = COALESCE(reserved_quantity, 0) + item_record.quantity
        WHERE product_id = item_record.product_id;
      END IF;
    END LOOP;
  END IF;

  IF NEW.status = 'shipped' AND OLD.status IN ('confirmed', 'processing') THEN
    -- Deduct inventory and release reservation when shipped
    FOR item_record IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      IF item_record.product_id IS NOT NULL THEN
        UPDATE inventory
        SET 
          quantity = quantity - item_record.quantity,
          reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - item_record.quantity)
        WHERE product_id = item_record.product_id;
        
        -- Update product sales count
        UPDATE products
        SET sales_count = COALESCE(sales_count, 0) + item_record.quantity
        WHERE id = item_record.product_id;
      END IF;
    END LOOP;
    
    -- Set shipped_at timestamp
    NEW.shipped_at = now();
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Release reserved inventory when cancelled
    FOR item_record IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      IF item_record.product_id IS NOT NULL THEN
        UPDATE inventory
        SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - item_record.quantity)
        WHERE product_id = item_record.product_id;
      END IF;
    END LOOP;
    
    -- Set cancelled_at timestamp
    NEW.cancelled_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_update_inventory_on_order_status ON orders;
CREATE TRIGGER trigger_update_inventory_on_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order_status();

-- Function to check and create inventory alerts
CREATE OR REPLACE FUNCTION check_inventory_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock
  IF NEW.available_quantity <= NEW.low_stock_threshold AND NEW.available_quantity > 0 THEN
    INSERT INTO inventory_alerts (inventory_id, product_id, alert_type, current_quantity, threshold_quantity, is_resolved)
    VALUES (NEW.id, NEW.product_id, 'low_stock', NEW.available_quantity, NEW.low_stock_threshold, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for out of stock
  IF NEW.available_quantity = 0 THEN
    INSERT INTO inventory_alerts (inventory_id, product_id, alert_type, current_quantity, threshold_quantity, is_resolved)
    VALUES (NEW.id, NEW.product_id, 'out_of_stock', NEW.available_quantity, 0, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for reorder needed
  IF NEW.available_quantity <= NEW.reorder_point THEN
    INSERT INTO inventory_alerts (inventory_id, product_id, alert_type, current_quantity, threshold_quantity, is_resolved)
    VALUES (NEW.id, NEW.product_id, 'reorder_needed', NEW.available_quantity, NEW.reorder_point, false)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory alerts
DROP TRIGGER IF EXISTS trigger_check_inventory_alerts ON inventory;
CREATE TRIGGER trigger_check_inventory_alerts
  AFTER INSERT OR UPDATE OF quantity, reserved_quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_alerts();

-- Function to log inventory history
CREATE OR REPLACE FUNCTION log_inventory_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if quantity changed
  IF OLD.quantity = NEW.quantity AND OLD.reserved_quantity = NEW.reserved_quantity THEN
    RETURN NEW;
  END IF;

  -- Determine change type
  DECLARE
    change_type TEXT;
    quantity_change INTEGER;
  BEGIN
    IF NEW.quantity > OLD.quantity THEN
      change_type := 'restock';
      quantity_change := NEW.quantity - OLD.quantity;
    ELSIF NEW.quantity < OLD.quantity THEN
      change_type := 'sale';
      quantity_change := NEW.quantity - OLD.quantity;
    ELSIF NEW.reserved_quantity > OLD.reserved_quantity THEN
      change_type := 'reserve';
      quantity_change := NEW.reserved_quantity - OLD.reserved_quantity;
    ELSIF NEW.reserved_quantity < OLD.reserved_quantity THEN
      change_type := 'unreserve';
      quantity_change := NEW.reserved_quantity - OLD.reserved_quantity;
    ELSE
      change_type := 'adjustment';
      quantity_change := NEW.quantity - OLD.quantity;
    END IF;

    INSERT INTO inventory_history (
      inventory_id,
      product_id,
      change_type,
      quantity_change,
      quantity_before,
      quantity_after,
      notes
    ) VALUES (
      NEW.id,
      NEW.product_id,
      change_type,
      quantity_change,
      OLD.quantity,
      NEW.quantity,
      'Automatic log from trigger'
    );
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory history
DROP TRIGGER IF EXISTS trigger_log_inventory_history ON inventory;
CREATE TRIGGER trigger_log_inventory_history
  AFTER UPDATE OF quantity, reserved_quantity ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_history();

-- Function to update product views count
CREATE OR REPLACE FUNCTION update_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product views
DROP TRIGGER IF EXISTS trigger_update_product_views ON product_views;
CREATE TRIGGER trigger_update_product_views
  AFTER INSERT ON product_views
  FOR EACH ROW
  EXECUTE FUNCTION update_product_views();

-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(available_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved, alert_type);

-- Function to get order statistics
CREATE OR REPLACE FUNCTION get_order_statistics(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  average_order_value NUMERIC,
  pending_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as average_order_value,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as completed_orders,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders
  FROM orders
  WHERE 
    (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
END;
$$ LANGUAGE plpgsql;










