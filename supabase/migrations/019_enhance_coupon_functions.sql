-- ============================================
-- Migration: Enhance Coupon Functions
-- ============================================
-- Adds coupon validation function and auto-expire function
-- ============================================

-- ============================================
-- FUNCTION: Validate Coupon
-- ============================================

CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_order_amount NUMERIC(10, 2),
  p_product_ids UUID[] DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_usage_count INTEGER;
  v_user_usage_count INTEGER;
  v_discount_amount NUMERIC(10, 2) := 0;
  v_result JSONB;
BEGIN
  -- Get coupon
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_code))
  AND is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Invalid or expired coupon code'
    );
  END IF;

  -- Check minimum purchase amount
  IF v_coupon.min_purchase_amount > 0 AND p_order_amount < v_coupon.min_purchase_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Minimum purchase amount of Rs. %s required', v_coupon.min_purchase_amount)
    );
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usage
    WHERE coupon_id = v_coupon.id;

    IF v_usage_count >= v_coupon.usage_limit THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'Coupon usage limit reached'
      );
    END IF;
  END IF;

  -- Check if user has already used this coupon
  SELECT COUNT(*) INTO v_user_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;

  IF v_user_usage_count > 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'You have already used this coupon'
    );
  END IF;

  -- Check applicability
  IF v_coupon.applicable_to = 'category' THEN
    IF v_coupon.applicable_category_id IS NULL OR 
       (p_category_id IS NULL OR p_category_id != v_coupon.applicable_category_id) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'This coupon is not applicable to your cart'
      );
    END IF;
  ELSIF v_coupon.applicable_to = 'product' THEN
    IF v_coupon.applicable_product_ids IS NULL OR
       (p_product_ids IS NULL OR NOT (v_coupon.applicable_product_ids && p_product_ids)) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error', 'This coupon is not applicable to your cart'
      );
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount_amount := p_order_amount * (v_coupon.discount_value / 100);
    -- Apply max discount if set
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.max_discount_amount THEN
      v_discount_amount := v_coupon.max_discount_amount;
    END IF;
  ELSE
    v_discount_amount := v_coupon.discount_value;
  END IF;

  -- Ensure discount doesn't exceed order amount
  IF v_discount_amount > p_order_amount THEN
    v_discount_amount := p_order_amount;
  END IF;

  -- Return success
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'name', v_coupon.name,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount_amount,
    'max_discount_amount', v_coupon.max_discount_amount
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Apply Coupon to Order
-- ============================================

CREATE OR REPLACE FUNCTION apply_coupon_to_order(
  p_order_id UUID,
  p_coupon_id UUID,
  p_user_id UUID,
  p_discount_amount NUMERIC(10, 2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update order with discount
  UPDATE orders
  SET discount_amount = p_discount_amount,
      total_amount = subtotal + tax_amount + shipping_amount - p_discount_amount
  WHERE id = p_order_id;

  -- Record coupon usage
  INSERT INTO coupon_usage (
    coupon_id,
    user_id,
    order_id,
    discount_amount
  ) VALUES (
    p_coupon_id,
    p_user_id,
    p_order_id,
    p_discount_amount
  )
  ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;

  -- Increment coupon used count
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-Expire Coupons
-- ============================================

CREATE OR REPLACE FUNCTION expire_coupons()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Mark expired coupons as inactive
  UPDATE coupons
  SET is_active = false
  WHERE is_active = true
  AND valid_until IS NOT NULL
  AND valid_until < now();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Aggregate Daily Analytics
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_daily_analytics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  -- Aggregate product views
  INSERT INTO product_sales_analytics (
    product_id,
    date,
    views_count,
    sales_count,
    revenue
  )
  SELECT 
    pv.product_id,
    p_date,
    COUNT(*) as views_count,
    0 as sales_count,
    0 as revenue
  FROM product_views pv
  WHERE DATE(pv.viewed_at) = p_date
  GROUP BY pv.product_id
  ON CONFLICT (product_id, date) DO UPDATE SET
    views_count = product_sales_analytics.views_count + EXCLUDED.views_count;

  -- Aggregate sales
  UPDATE product_sales_analytics psa
  SET 
    sales_count = COALESCE((
      SELECT SUM(oi.quantity)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = psa.product_id
      AND DATE(o.created_at) = p_date
      AND o.status != 'cancelled'
    ), 0),
    revenue = COALESCE((
      SELECT SUM(oi.total_price)
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = psa.product_id
      AND DATE(o.created_at) = p_date
      AND o.status != 'cancelled'
    ), 0)
  WHERE psa.date = p_date;

  -- Create entries for products with sales but no views
  INSERT INTO product_sales_analytics (
    product_id,
    date,
    views_count,
    sales_count,
    revenue
  )
  SELECT 
    oi.product_id,
    p_date,
    0 as views_count,
    SUM(oi.quantity) as sales_count,
    SUM(oi.total_price) as revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE DATE(o.created_at) = p_date
  AND o.status != 'cancelled'
  AND NOT EXISTS (
    SELECT 1 FROM product_sales_analytics
    WHERE product_id = oi.product_id
    AND date = p_date
  )
  GROUP BY oi.product_id
  ON CONFLICT (product_id, date) DO UPDATE SET
    sales_count = EXCLUDED.sales_count,
    revenue = EXCLUDED.revenue;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOB: Auto-Expire Coupons (Daily)
-- ============================================
-- Note: This requires pg_cron extension
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then schedule: SELECT cron.schedule('expire-coupons', '0 0 * * *', 'SELECT expire_coupons();');

-- ============================================
-- SCHEDULED JOB: Aggregate Daily Analytics (Daily)
-- ============================================
-- Note: This requires pg_cron extension
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then schedule: SELECT cron.schedule('aggregate-analytics', '0 1 * * *', 'SELECT aggregate_daily_analytics();');










