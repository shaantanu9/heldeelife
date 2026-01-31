-- ============================================
-- Migration: Setup Row Level Security Policies
-- ============================================
-- RLS policies for e-commerce tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Product Categories Policies
-- Public can view active categories
CREATE POLICY "Public can view active categories"
  ON product_categories FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all categories
CREATE POLICY "Authenticated users can view all categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Products Policies
-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all products
CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage products
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Inventory Policies
-- Public cannot view inventory
-- Authenticated users can view inventory for active products
CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = inventory.product_id
      AND products.is_active = true
    )
  );

-- Admins can manage inventory
CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Orders Policies
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending orders
CREATE POLICY "Users can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admins can view and manage all orders
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Order Items Policies
-- Users can view items of their own orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can create items for their own orders
CREATE POLICY "Users can create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Inventory History Policies
-- Admins can view all inventory history
CREATE POLICY "Admins can view inventory history"
  ON inventory_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can create inventory history (via triggers)
CREATE POLICY "System can create inventory history"
  ON inventory_history FOR INSERT
  TO authenticated
  WITH CHECK (true);