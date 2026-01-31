-- ============================================
-- Migration: Ensure Product Tables Exist
-- ============================================
-- This migration ensures all product-related tables exist
-- with proper structure for e-commerce functionality
-- ============================================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  cost_price NUMERIC(10, 2) CHECK (cost_price >= 0),
  sku TEXT UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  image TEXT,
  images TEXT[],
  benefits TEXT[],
  ingredients TEXT,
  usage_instructions TEXT,
  storage_instructions TEXT,
  expiry_info TEXT,
  manufacturer TEXT,
  rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
  views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
  sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_digital BOOLEAN DEFAULT false,
  weight NUMERIC(10, 2),
  dimensions JSONB,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0),
  reorder_point INTEGER DEFAULT 20 CHECK (reorder_point >= 0),
  reorder_quantity INTEGER DEFAULT 50 CHECK (reorder_quantity >= 0),
  location TEXT DEFAULT 'main',
  batch_number TEXT,
  expiry_date DATE,
  cost_per_unit NUMERIC(10, 2),
  supplier TEXT,
  supplier_sku TEXT,
  notes TEXT,
  last_restocked_at TIMESTAMPTZ,
  last_restocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, location, batch_number)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online', 'card', 'upi', 'wallet')),
  payment_id TEXT,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory History
CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'sale', 'return', 'adjustment', 'reserve', 'unreserve', 'damaged', 'expired')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_product ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_inventory ON inventory_history(inventory_id);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_num INTEGER;
  order_num TEXT;
BEGIN
  date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || date_part || '-%';
  
  order_num := 'ORD-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON product_categories;
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();










