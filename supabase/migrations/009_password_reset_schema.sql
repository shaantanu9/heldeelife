-- ============================================
-- Migration: Password Reset Schema
-- ============================================
-- Ensures users table exists with all required columns
-- Adds optional password reset tracking for security/audit
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
-- Ensure users table exists with all required columns
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add phone_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_number TEXT UNIQUE;
  END IF;

  -- Add full_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name TEXT;
  END IF;

  -- Add role if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- ============================================
-- PASSWORD RESET ATTEMPTS TABLE (Optional Audit)
-- ============================================
-- Tracks password reset requests for security monitoring
-- Helps identify potential abuse or security issues
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested', 'completed', 'expired', 'failed')),
  reset_token_hash TEXT, -- Hashed token for reference (not the actual token)
  requested_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Password reset attempts indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_user_id ON password_reset_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email ON password_reset_attempts(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_status ON password_reset_attempts(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_requested_at ON password_reset_attempts(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_user_status ON password_reset_attempts(user_id, status, requested_at DESC);

-- Composite index for recent reset attempts (rate limiting queries)
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_recent ON password_reset_attempts(email, requested_at DESC) 
  WHERE requested_at > now() - INTERVAL '24 hours';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile (except role)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND (role IS NULL OR role = (SELECT role FROM users WHERE id = auth.uid()))
  );

-- Admins can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can update all users
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Enable RLS on password_reset_attempts table
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own password reset attempts
DROP POLICY IF EXISTS "Users can view own reset attempts" ON password_reset_attempts;
CREATE POLICY "Users can view own reset attempts"
  ON password_reset_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all password reset attempts
DROP POLICY IF EXISTS "Admins can view all reset attempts" ON password_reset_attempts;
CREATE POLICY "Admins can view all reset attempts"
  ON password_reset_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can create password reset attempts (via API)
DROP POLICY IF EXISTS "System can create reset attempts" ON password_reset_attempts;
CREATE POLICY "System can create reset attempts"
  ON password_reset_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp for users table
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Function to log password reset attempt
-- This can be called from the API route to track reset requests
CREATE OR REPLACE FUNCTION log_password_reset_attempt(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'requested',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO password_reset_attempts (
    user_id,
    email,
    ip_address,
    user_agent,
    status,
    expires_at
  ) VALUES (
    p_user_id,
    p_email,
    p_ip_address,
    p_user_agent,
    p_status,
    p_expires_at
  )
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check recent password reset attempts (for rate limiting)
-- Returns count of reset attempts in the last 24 hours for an email
CREATE OR REPLACE FUNCTION get_recent_reset_attempts(
  p_email TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM password_reset_attempts
  WHERE email = p_email
    AND requested_at > now() - (p_hours || ' hours')::INTERVAL
    AND status IN ('requested', 'completed');
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark password reset as completed
CREATE OR REPLACE FUNCTION mark_password_reset_completed(
  p_attempt_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE password_reset_attempts
  SET 
    status = 'completed',
    completed_at = now()
  WHERE id = p_attempt_id
    AND status = 'requested';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ANALYZE TABLES
-- ============================================

ANALYZE users;
ANALYZE password_reset_attempts;










