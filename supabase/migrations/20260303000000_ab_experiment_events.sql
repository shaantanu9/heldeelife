-- A/B Experiment Events Table
-- Tracks which variant was shown and user interaction events

CREATE TABLE IF NOT EXISTS ab_experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  variant_id TEXT NOT NULL CHECK (variant_id IN ('control', 'benefit', 'urgency', 'social')),
  event_type TEXT NOT NULL CHECK (event_type IN ('variant_shown', 'cta_clicked', 'purchase_completed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ab_experiment_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (anon + authenticated) to INSERT events
CREATE POLICY "Allow anyone to insert ab events"
  ON ab_experiment_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users with admin role to SELECT
CREATE POLICY "Allow admins to read ab events"
  ON ab_experiment_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_ab_experiment_events_variant_id
  ON ab_experiment_events (variant_id);

CREATE INDEX IF NOT EXISTS idx_ab_experiment_events_created_at
  ON ab_experiment_events (created_at);
