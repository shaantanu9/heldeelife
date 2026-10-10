-- ============================================
-- Migration: Checkout integrity
-- ============================================
-- Makes the database the single source of truth for stock, order numbers
-- and coupon consumption so checkout is correct under concurrency:
--
--  * order_items.discount_amount (selected/inserted by the API but only ever
--    defined in the non-numbered product_schema.sql)
--  * order numbers from a sequence (MAX()+1 collided under concurrent checkouts)
--  * place_order(): validates stock, reserves it, inserts order + items and
--    consumes the coupon in ONE transaction (no overselling, no double use)
--  * inventory trigger rewritten around order *phases* so every transition
--    adjusts stock exactly once (previously the API and the trigger both
--    reserved/deducted, counting stock two or three times)
--  * expire_stale_online_orders(): releases stock held by abandoned
--    online-payment orders
-- ============================================

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_image TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- payment_id stores the Razorpay order id. Databases bootstrapped from
-- product_schema.sql lack it (that file's orders table predates it).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- --------------------------------------------
-- Order numbers: ORD-YYYYMMDD-000123 from a sequence (collision-free)
-- --------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
    LPAD(nextval('order_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Inventory: one row per product is assumed by the storefront; when several
-- exist (locations/batches) we operate on the oldest row.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION order_phase(p_status TEXT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN p_status IN ('pending', 'confirmed', 'processing') THEN 'reserved'
    WHEN p_status IN ('shipped', 'delivered') THEN 'fulfilled'
    ELSE 'closed' -- cancelled, refunded
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_inventory_on_order_status()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_from TEXT := order_phase(OLD.status);
  v_to TEXT := order_phase(NEW.status);
BEGIN
  IF OLD.status = NEW.status OR v_from = v_to THEN
    RETURN NEW;
  END IF;

  FOR item IN
    SELECT product_id, SUM(quantity)::INT AS quantity
    FROM order_items
    WHERE order_id = NEW.id AND product_id IS NOT NULL
    GROUP BY product_id
  LOOP
    IF v_from = 'reserved' AND v_to = 'fulfilled' THEN
      -- Goods leave the warehouse: deduct stock, release the reservation
      UPDATE inventory
      SET quantity = GREATEST(0, quantity - item.quantity),
          reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - item.quantity)
      WHERE id = (SELECT id FROM inventory WHERE product_id = item.product_id
                  ORDER BY created_at, id LIMIT 1);
      UPDATE products
      SET sales_count = COALESCE(sales_count, 0) + item.quantity
      WHERE id = item.product_id;
    ELSIF v_from = 'reserved' AND v_to = 'closed' THEN
      -- Cancelled before shipping: just release the hold
      UPDATE inventory
      SET reserved_quantity = GREATEST(0, COALESCE(reserved_quantity, 0) - item.quantity)
      WHERE id = (SELECT id FROM inventory WHERE product_id = item.product_id
                  ORDER BY created_at, id LIMIT 1);
    ELSIF v_from = 'fulfilled' AND v_to = 'closed' THEN
      -- Cancelled/refunded after shipping: goods come back into stock
      UPDATE inventory
      SET quantity = quantity + item.quantity
      WHERE id = (SELECT id FROM inventory WHERE product_id = item.product_id
                  ORDER BY created_at, id LIMIT 1);
      UPDATE products
      SET sales_count = GREATEST(0, COALESCE(sales_count, 0) - item.quantity)
      WHERE id = item.product_id;
    END IF;
    -- closed -> anything: no automatic stock movement (re-opening a
    -- cancelled order must go through a new order).
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timestamps belong in a BEFORE trigger (setting NEW.* in an AFTER trigger
-- has no effect).
CREATE OR REPLACE FUNCTION set_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'shipped' AND NEW.shipped_at IS NULL THEN
      NEW.shipped_at := now();
    ELSIF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    ELSIF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;
  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid'
     AND NEW.paid_at IS NULL THEN
    NEW.paid_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_status_timestamps ON orders;
CREATE TRIGGER trigger_set_order_status_timestamps
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_status_timestamps();

DROP TRIGGER IF EXISTS trigger_update_inventory_on_order_status ON orders;
CREATE TRIGGER trigger_update_inventory_on_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_order_status();

-- --------------------------------------------
-- place_order: atomic order creation
-- --------------------------------------------
-- p_order: { user_id, shipping_address, billing_address, payment_method,
--            subtotal, tax_amount, shipping_amount, discount_amount,
--            total_amount, notes, customer_name, customer_email,
--            customer_phone, coupon_id }
-- p_items: [{ product_id, product_name, product_sku, product_image,
--             quantity, unit_price, total_price, discount_amount }]
-- Prices/totals are computed by the API from the products table; this
-- function guarantees stock and coupon limits atomically.
-- Errors are raised with a machine-readable prefix:
--   OUT_OF_STOCK:<product name>:<available>
--   COUPON_EXHAUSTED
CREATE OR REPLACE FUNCTION place_order(p_order JSONB, p_items JSONB)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_need RECORD;
  v_inv RECORD;
  v_order orders%ROWTYPE;
  v_coupon_id UUID := NULLIF(p_order->>'coupon_id', '')::UUID;
  v_user_id UUID := NULLIF(p_order->>'user_id', '')::UUID;
BEGIN
  -- 1. Lock and check stock for every product (aggregated, in a stable
  --    order to avoid deadlocks between concurrent checkouts).
  FOR v_need IN
    SELECT (e->>'product_id')::UUID AS product_id,
           MIN(e->>'product_name') AS product_name,
           SUM((e->>'quantity')::INT) AS quantity
    FROM jsonb_array_elements(p_items) e
    GROUP BY 1
    ORDER BY 1
  LOOP
    SELECT id, quantity, COALESCE(reserved_quantity, 0) AS reserved
    INTO v_inv
    FROM inventory
    WHERE product_id = v_need.product_id
    ORDER BY created_at, id
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND OR v_inv.quantity - v_inv.reserved < v_need.quantity THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%:%', v_need.product_name,
        GREATEST(0, COALESCE(v_inv.quantity - v_inv.reserved, 0));
    END IF;

    UPDATE inventory
    SET reserved_quantity = v_inv.reserved + v_need.quantity
    WHERE id = v_inv.id;
  END LOOP;

  -- 2. Consume the coupon atomically (respecting usage_limit)
  IF v_coupon_id IS NOT NULL THEN
    UPDATE coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = v_coupon_id
      AND is_active = true
      AND (usage_limit IS NULL OR COALESCE(used_count, 0) < usage_limit);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'COUPON_EXHAUSTED';
    END IF;
  END IF;

  -- 3. Insert the order
  INSERT INTO orders (
    user_id, status, payment_status, payment_method,
    subtotal, tax_amount, shipping_amount, discount_amount, total_amount,
    shipping_address, billing_address, notes,
    customer_name, customer_email, customer_phone, coupon_id
  ) VALUES (
    v_user_id, 'pending', 'pending', COALESCE(p_order->>'payment_method', 'cod'),
    (p_order->>'subtotal')::NUMERIC, (p_order->>'tax_amount')::NUMERIC,
    (p_order->>'shipping_amount')::NUMERIC, (p_order->>'discount_amount')::NUMERIC,
    (p_order->>'total_amount')::NUMERIC,
    p_order->'shipping_address',
    COALESCE(p_order->'billing_address', p_order->'shipping_address'),
    NULLIF(p_order->>'notes', ''),
    p_order->>'customer_name', p_order->>'customer_email', p_order->>'customer_phone',
    v_coupon_id
  )
  RETURNING * INTO v_order;

  -- 4. Items
  INSERT INTO order_items (
    order_id, product_id, product_name, product_sku, product_image,
    quantity, unit_price, total_price, discount_amount
  )
  SELECT v_order.id,
         (e->>'product_id')::UUID,
         e->>'product_name',
         NULLIF(e->>'product_sku', ''),
         NULLIF(e->>'product_image', ''),
         (e->>'quantity')::INT,
         (e->>'unit_price')::NUMERIC,
         (e->>'total_price')::NUMERIC,
         COALESCE((e->>'discount_amount')::NUMERIC, 0)
  FROM jsonb_array_elements(p_items) e;

  -- 5. Per-user coupon usage record (guests have no user row)
  IF v_coupon_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
    VALUES (v_coupon_id, v_user_id, v_order.id, (p_order->>'discount_amount')::NUMERIC)
    ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number);
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Release stock held by unpaid online orders
-- --------------------------------------------
CREATE OR REPLACE FUNCTION expire_stale_online_orders(p_minutes INT DEFAULT 60)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE orders
  SET status = 'cancelled',
      cancelled_reason = 'Payment not completed in time'
  WHERE status = 'pending'
    AND payment_method <> 'cod'
    AND payment_status IN ('pending', 'failed')
    AND created_at < now() - make_interval(mins => p_minutes);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- These run with the caller's privileges; only the service role (server)
-- may call them.
REVOKE ALL ON FUNCTION place_order(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION expire_stale_online_orders(INT) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION place_order(JSONB, JSONB) TO service_role;
    GRANT EXECUTE ON FUNCTION expire_stale_online_orders(INT) TO service_role;
  END IF;
END $$;
