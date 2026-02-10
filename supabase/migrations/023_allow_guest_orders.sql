-- ============================================
-- Migration: Allow guest orders
-- ============================================
-- Makes orders.user_id nullable so guest checkout can create orders
-- without a user account. customer_name, customer_email, customer_phone
-- are already present (016) for guest order identification.
-- ============================================

ALTER TABLE orders
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN orders.user_id IS 'User ID when logged in; NULL for guest checkout.';
