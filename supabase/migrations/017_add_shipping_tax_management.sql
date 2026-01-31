-- ============================================
-- Migration: Add Shipping and Tax Management
-- ============================================
-- Adds shipping methods, shipping zones, tax rates,
-- and shipping calculation tables
-- ============================================

-- ============================================
-- SHIPPING METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Standard", "Express", "Same-Day"
  description TEXT,
  carrier TEXT, -- e.g., "FedEx", "BlueDart", "Delhivery", "Custom"
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  free_shipping_threshold NUMERIC(10, 2) CHECK (free_shipping_threshold >= 0),
  estimated_days_min INTEGER CHECK (estimated_days_min >= 0),
  estimated_days_max INTEGER CHECK (estimated_days_max >= 0),
  is_active BOOLEAN DEFAULT true,
  applicable_states TEXT[], -- States where available
  applicable_pincodes TEXT[], -- Pincodes where available
  weight_limit NUMERIC(10, 2) CHECK (weight_limit >= 0), -- Max weight in kg
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE shipping_methods IS 'Available shipping methods with rates and conditions';
COMMENT ON COLUMN shipping_methods.free_shipping_threshold IS 'Order amount above which shipping is free';
COMMENT ON COLUMN shipping_methods.estimated_days_min IS 'Minimum estimated delivery days';
COMMENT ON COLUMN shipping_methods.estimated_days_max IS 'Maximum estimated delivery days';

-- ============================================
-- SHIPPING ZONES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "North India", "Metro Cities", "Tier 1"
  states TEXT[] NOT NULL,
  pincodes TEXT[],
  base_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (base_cost >= 0),
  per_kg_cost NUMERIC(10, 2) DEFAULT 0 CHECK (per_kg_cost >= 0),
  free_shipping_threshold NUMERIC(10, 2) CHECK (free_shipping_threshold >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE shipping_zones IS 'Shipping zones with different rates based on location';
COMMENT ON COLUMN shipping_zones.per_kg_cost IS 'Additional cost per kilogram of weight';

-- ============================================
-- SHIPPING CALCULATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL,
  base_cost NUMERIC(10, 2) NOT NULL CHECK (base_cost >= 0),
  weight_cost NUMERIC(10, 2) DEFAULT 0 CHECK (weight_cost >= 0),
  distance_cost NUMERIC(10, 2) DEFAULT 0 CHECK (distance_cost >= 0),
  total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
  total_weight NUMERIC(10, 2) DEFAULT 0 CHECK (total_weight >= 0),
  estimated_delivery_date DATE,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id)
);

-- Add comments
COMMENT ON TABLE shipping_calculations IS 'Stored shipping cost calculations for orders';
COMMENT ON COLUMN shipping_calculations.weight_cost IS 'Cost based on total order weight';
COMMENT ON COLUMN shipping_calculations.distance_cost IS 'Cost based on shipping distance';

-- ============================================
-- TAX RATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "GST", "VAT", "Service Tax"
  rate NUMERIC(5, 2) NOT NULL CHECK (rate >= 0 AND rate <= 100), -- Percentage
  type TEXT NOT NULL CHECK (type IN ('gst', 'vat', 'service_tax', 'custom')),
  applicable_to TEXT CHECK (applicable_to IN ('all', 'category', 'product')),
  applicable_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  applicable_product_ids UUID[],
  applicable_states TEXT[],
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE tax_rates IS 'Tax rates configuration by location and product';
COMMENT ON COLUMN tax_rates.rate IS 'Tax rate as percentage (e.g., 18.00 for 18%)';
COMMENT ON COLUMN tax_rates.applicable_to IS 'What the tax applies to (all products, specific category, or specific products)';

-- ============================================
-- INDEXES FOR SHIPPING METHODS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shipping_methods_active 
  ON shipping_methods(is_active, display_order) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shipping_methods_carrier 
  ON shipping_methods(carrier) 
  WHERE carrier IS NOT NULL;

-- ============================================
-- INDEXES FOR SHIPPING ZONES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shipping_zones_active 
  ON shipping_zones(is_active) 
  WHERE is_active = true;

-- ============================================
-- INDEXES FOR SHIPPING CALCULATIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shipping_calculations_order 
  ON shipping_calculations(order_id);

CREATE INDEX IF NOT EXISTS idx_shipping_calculations_method 
  ON shipping_calculations(shipping_method_id) 
  WHERE shipping_method_id IS NOT NULL;

-- ============================================
-- INDEXES FOR TAX RATES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tax_rates_active 
  ON tax_rates(is_active, valid_from, valid_until) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tax_rates_type 
  ON tax_rates(type, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tax_rates_category 
  ON tax_rates(applicable_category_id) 
  WHERE applicable_category_id IS NOT NULL;

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

-- Triggers for shipping_methods
DROP TRIGGER IF EXISTS update_shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER update_shipping_methods_updated_at
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for shipping_zones
DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER update_shipping_zones_updated_at
  BEFORE UPDATE ON shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for tax_rates
DROP TRIGGER IF EXISTS update_tax_rates_updated_at ON tax_rates;
CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Calculate Shipping Cost
-- ============================================

CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  p_order_id UUID,
  p_shipping_method_id UUID,
  p_address JSONB,
  p_order_total NUMERIC(10, 2),
  p_order_weight NUMERIC(10, 2) DEFAULT 0
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_shipping_method RECORD;
  v_shipping_zone RECORD;
  v_base_cost NUMERIC(10, 2) := 0;
  v_weight_cost NUMERIC(10, 2) := 0;
  v_total_cost NUMERIC(10, 2) := 0;
  v_pincode TEXT;
  v_state TEXT;
BEGIN
  -- Extract address details
  v_pincode := p_address->>'pincode';
  v_state := p_address->>'state';

  -- Get shipping method
  SELECT * INTO v_shipping_method
  FROM shipping_methods
  WHERE id = p_shipping_method_id
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0; -- Default to free shipping if method not found
  END IF;

  -- Check if free shipping threshold is met
  IF v_shipping_method.free_shipping_threshold IS NOT NULL 
     AND p_order_total >= v_shipping_method.free_shipping_threshold THEN
    RETURN 0;
  END IF;

  -- Find shipping zone for the address
  SELECT * INTO v_shipping_zone
  FROM shipping_zones
  WHERE is_active = true
  AND (
    v_state = ANY(states) OR
    v_pincode = ANY(pincodes)
  )
  ORDER BY 
    CASE WHEN v_pincode = ANY(pincodes) THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;

  -- Calculate base cost
  IF v_shipping_zone IS NOT NULL THEN
    v_base_cost := v_shipping_zone.base_cost;
    -- Add weight-based cost
    IF v_shipping_zone.per_kg_cost > 0 AND p_order_weight > 0 THEN
      v_weight_cost := v_shipping_zone.per_kg_cost * p_order_weight;
    END IF;
  ELSE
    -- Use shipping method default cost
    v_base_cost := v_shipping_method.cost;
  END IF;

  -- Check zone free shipping threshold
  IF v_shipping_zone IS NOT NULL 
     AND v_shipping_zone.free_shipping_threshold IS NOT NULL
     AND p_order_total >= v_shipping_zone.free_shipping_threshold THEN
    RETURN 0;
  END IF;

  -- Calculate total
  v_total_cost := v_base_cost + v_weight_cost;

  -- Store calculation
  INSERT INTO shipping_calculations (
    order_id,
    shipping_method_id,
    shipping_zone_id,
    base_cost,
    weight_cost,
    total_cost,
    total_weight,
    estimated_delivery_date
  ) VALUES (
    p_order_id,
    p_shipping_method_id,
    v_shipping_zone.id,
    v_base_cost,
    v_weight_cost,
    v_total_cost,
    p_order_weight,
    CURRENT_DATE + (v_shipping_method.estimated_days_max || ' days')::INTERVAL
  )
  ON CONFLICT (order_id) DO UPDATE SET
    shipping_method_id = EXCLUDED.shipping_method_id,
    shipping_zone_id = EXCLUDED.shipping_zone_id,
    base_cost = EXCLUDED.base_cost,
    weight_cost = EXCLUDED.weight_cost,
    total_cost = EXCLUDED.total_cost,
    total_weight = EXCLUDED.total_weight,
    estimated_delivery_date = EXCLUDED.estimated_delivery_date,
    calculated_at = now();

  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Calculate Tax
-- ============================================

CREATE OR REPLACE FUNCTION calculate_tax(
  p_order_id UUID,
  p_address JSONB,
  p_subtotal NUMERIC(10, 2)
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
  v_tax_rate RECORD;
  v_tax_amount NUMERIC(10, 2) := 0;
  v_state TEXT;
  v_order_items RECORD;
  v_item_tax NUMERIC(10, 2);
BEGIN
  -- Extract state from address
  v_state := p_address->>'state';

  -- Get applicable tax rate
  SELECT * INTO v_tax_rate
  FROM tax_rates
  WHERE is_active = true
  AND (valid_from IS NULL OR valid_from <= now())
  AND (valid_until IS NULL OR valid_until >= now())
  AND (
    applicable_to = 'all' OR
    (applicable_to = 'category' AND applicable_category_id IN (
      SELECT category_id FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = p_order_id
    )) OR
    (applicable_to = 'product' AND id = ANY(
      SELECT unnest(applicable_product_ids) FROM tax_rates
      WHERE applicable_product_ids && ARRAY(
        SELECT product_id FROM order_items WHERE order_id = p_order_id
      )
    ))
  )
  AND (
    applicable_states IS NULL OR
    v_state = ANY(applicable_states)
  )
  ORDER BY 
    CASE WHEN applicable_to = 'product' THEN 1
         WHEN applicable_to = 'category' THEN 2
         ELSE 3 END
  LIMIT 1;

  -- If no specific tax rate found, use default GST (18%)
  IF NOT FOUND THEN
    v_tax_amount := p_subtotal * 0.18;
  ELSE
    v_tax_amount := p_subtotal * (v_tax_rate.rate / 100);
  END IF;

  -- Update order with tax amount
  UPDATE orders
  SET tax_amount = v_tax_amount
  WHERE id = p_order_id;

  RETURN v_tax_amount;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Shipping methods - public read, admin write
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shipping methods"
  ON shipping_methods FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage shipping methods"
  ON shipping_methods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Shipping zones - public read, admin write
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active shipping zones"
  ON shipping_zones FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage shipping zones"
  ON shipping_zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Tax rates - public read, admin write
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active tax rates"
  ON tax_rates FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage tax rates"
  ON tax_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Shipping calculations - users can view their own, admins can view all
ALTER TABLE shipping_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shipping calculations"
  ON shipping_calculations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = shipping_calculations.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all shipping calculations"
  ON shipping_calculations FOR SELECT
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

ANALYZE shipping_methods;
ANALYZE shipping_zones;
ANALYZE shipping_calculations;
ANALYZE tax_rates;










