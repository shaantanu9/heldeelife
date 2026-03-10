-- Migration 024: CAN-SPAM email opt-out / unsubscribe table
-- Stores emails that have opted out of cart recovery emails.

CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text        NOT NULL UNIQUE,
  unsubscribed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes (email);

-- Enable RLS
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to insert — no auth needed to unsubscribe
CREATE POLICY "allow_anon_insert_unsubscribes"
  ON email_unsubscribes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No public SELECT policy — data stays private
