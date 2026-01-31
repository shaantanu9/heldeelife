-- ============================================
-- Migration: Update Address Schema for AddressInput Component
-- ============================================
-- Adds missing fields from AddressInput: latitude, longitude, instructions
-- Also adds zipCode support for international addresses
-- ============================================

-- Add new columns to user_addresses table
ALTER TABLE user_addresses
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT, -- For US/International addresses
  ADD COLUMN IF NOT EXISTS building_name TEXT, -- Building/Complex name
  ADD COLUMN IF NOT EXISTS floor TEXT, -- Floor number
  ADD COLUMN IF NOT EXISTS unit TEXT; -- Unit/Apartment number

-- Update orders table to support new address structure
-- The shipping_address and billing_address JSONB columns already exist
-- We just need to ensure they can store all AddressInput fields

-- Add comment to document the expected structure
COMMENT ON COLUMN user_addresses.latitude IS 'Latitude from GPS or map picker';
COMMENT ON COLUMN user_addresses.longitude IS 'Longitude from GPS or map picker';
COMMENT ON COLUMN user_addresses.instructions IS 'Delivery instructions from AddressInput';
COMMENT ON COLUMN user_addresses.zip_code IS 'ZIP code for US/International addresses (alternative to pincode)';
COMMENT ON COLUMN user_addresses.building_name IS 'Building or complex name';
COMMENT ON COLUMN user_addresses.floor IS 'Floor number';
COMMENT ON COLUMN user_addresses.unit IS 'Unit or apartment number';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_user_addresses_location ON user_addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

