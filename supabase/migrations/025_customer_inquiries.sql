-- Migration 025: Customer inquiries
-- Stores submissions from public forms (contact, consultation booking,
-- newsletter signup). Written only by the server via the service role.

CREATE TABLE IF NOT EXISTS customer_inquiries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN ('contact', 'consultation', 'newsletter')),
  name        text,
  email       text        NOT NULL,
  phone       text,
  subject     text,
  message     text,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status      text        NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_type_created_at
  ON customer_inquiries (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_email
  ON customer_inquiries (email);

-- Enable RLS
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- No public policies — only the service role (which bypasses RLS) can read/write
