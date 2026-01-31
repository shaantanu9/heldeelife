-- ============================================
-- Migration: Seed Initial Product Data
-- ============================================
-- Seeds categories and products from hardcoded data
-- ============================================

-- Insert Categories
INSERT INTO product_categories (name, slug, description, display_order, is_active)
VALUES
  ('Cold Relief', 'cold-relief', 'Products for cold and congestion relief', 1, true),
  ('Cough Relief', 'cough-relief', 'Products for cough relief', 2, true),
  ('Immunity Booster', 'immunity-booster', 'Products to boost immunity', 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for reference
DO $$
DECLARE
  cold_relief_id UUID;
  cough_relief_id UUID;
  immunity_id UUID;
BEGIN
  SELECT id INTO cold_relief_id FROM product_categories WHERE slug = 'cold-relief';
  SELECT id INTO cough_relief_id FROM product_categories WHERE slug = 'cough-relief';
  SELECT id INTO immunity_id FROM product_categories WHERE slug = 'immunity-booster';

  -- Insert Products
  INSERT INTO products (
    name, slug, description, short_description, price, 
    category_id, image, benefits, ingredients, usage_instructions,
    storage_instructions, expiry_info, manufacturer, rating, reviews_count,
    is_active, is_featured, sku
  ) VALUES
    (
      'Saline Tulsi Nasal Spray 115ml',
      'saline-tulsi-nasal-spray-115ml',
      'A natural saline solution with Tulsi extract for nasal hygiene and relief from congestion. Safe for daily use and suitable for all ages.',
      'Natural saline solution with Tulsi extract for nasal hygiene',
      129.00,
      cold_relief_id,
      '🫙',
      ARRAY['Relieves nasal congestion', 'Moisturizes dry nasal passages', 'Natural Tulsi extract', 'Safe for daily use'],
      'Purified Water, Sodium Chloride, Tulsi Extract, Natural Preservatives',
      'Spray 2-3 times in each nostril, 2-3 times daily or as directed by physician.',
      'Store in a cool, dry place. Keep away from direct sunlight.',
      '24 months from date of manufacture',
      'heldeelife Pharmaceuticals',
      4.5,
      128,
      true,
      true,
      'SKU-001'
    ),
    (
      'Hot Kadha Mix Cough Cold',
      'hot-kadha-mix-cough-cold',
      'Traditional Ayurvedic kadha mix with herbs like ginger, tulsi, and turmeric. Helps relieve cough and cold symptoms naturally.',
      'Traditional Ayurvedic kadha mix for cough and cold',
      199.00,
      cough_relief_id,
      '📦',
      ARRAY['Relieves cough and cold', 'Boosts immunity', 'Traditional Ayurvedic formula', 'Natural ingredients'],
      'Ginger, Tulsi, Turmeric, Black Pepper, Cinnamon, Cardamom',
      'Mix 1 teaspoon with hot water. Consume 2-3 times daily after meals.',
      'Store in a cool, dry place. Keep container tightly closed.',
      '18 months from date of manufacture',
      'heldeelife Pharmaceuticals',
      4.7,
      95,
      true,
      true,
      'SKU-002'
    ),
    (
      'Vapor Patch',
      'vapor-patch',
      'Medicated vapor patch for external use. Provides long-lasting relief from nasal congestion and cold symptoms.',
      'Medicated vapor patch for nasal congestion relief',
      149.00,
      cold_relief_id,
      '🩹',
      ARRAY['Long-lasting relief', 'Easy to use', 'Non-invasive', 'Suitable for all ages'],
      'Menthol, Eucalyptus Oil, Camphor, Natural Adhesives',
      'Apply one patch on chest or back. Replace after 8 hours or as needed.',
      'Store in original packaging at room temperature.',
      '36 months from date of manufacture',
      'heldeelife Pharmaceuticals',
      4.3,
      67,
      true,
      false,
      'SKU-003'
    ),
    (
      'Complete Cold Relief Pack',
      'complete-cold-relief-pack',
      'Complete solution for cold relief including nasal spray, vapor patch, and kadha mix.',
      'Complete solution for cold relief',
      399.00,
      cold_relief_id,
      '📦',
      ARRAY['Complete solution', 'Value pack', 'Multiple products', 'Comprehensive relief'],
      'Contains Saline Tulsi Nasal Spray, Vapor Patch, and Hot Kadha Mix',
      'Use products as per individual instructions included in the pack.',
      'Store individual products as per their storage instructions.',
      'See individual product expiry dates',
      'heldeelife Pharmaceuticals',
      4.6,
      42,
      true,
      true,
      'SKU-004'
    ),
    (
      'Vapor Rub',
      'vapor-rub',
      'Ayurvedic vapor rub with natural ingredients for chest and throat relief from cough and congestion.',
      'Ayurvedic vapor rub for cough and congestion',
      179.00,
      cough_relief_id,
      '🧴',
      ARRAY['Chest and throat relief', 'Natural ingredients', 'Long-lasting effect', 'Easy application'],
      'Eucalyptus Oil, Camphor, Menthol, Turmeric, Natural Base',
      'Apply on chest and throat area. Massage gently. Use 2-3 times daily.',
      'Store in a cool, dry place. Keep tightly closed.',
      '24 months from date of manufacture',
      'heldeelife Pharmaceuticals',
      4.4,
      89,
      true,
      false,
      'SKU-005'
    ),
    (
      'Immunity Booster Mix',
      'immunity-booster-mix',
      'Powerful blend of immunity-boosting herbs and spices to strengthen your body''s natural defense system.',
      'Powerful blend of immunity-boosting herbs',
      299.00,
      immunity_id,
      '💊',
      ARRAY['Boosts immunity', 'Natural herbs', 'Daily wellness', 'Preventive care'],
      'Ashwagandha, Giloy, Turmeric, Amla, Tulsi, Black Pepper',
      'Mix 1 teaspoon with warm water or milk. Consume once daily in the morning.',
      'Store in a cool, dry place away from direct sunlight.',
      '18 months from date of manufacture',
      'heldeelife Pharmaceuticals',
      4.8,
      156,
      true,
      true,
      'SKU-006'
    )
  ON CONFLICT (slug) DO NOTHING;

  -- Insert Inventory for each product
  INSERT INTO inventory (product_id, quantity, low_stock_threshold, reorder_point, reorder_quantity, location)
  SELECT 
    p.id,
    100, -- Initial quantity
    10,  -- Low stock threshold
    20,  -- Reorder point
    50,  -- Reorder quantity
    'main'
  FROM products p
  WHERE p.sku IN ('SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005', 'SKU-006')
  ON CONFLICT (product_id, location, batch_number) DO NOTHING;

END $$;
