-- A/B experiment events aggregation function
-- Returns counts grouped by variant_id and event_type for the admin dashboard

CREATE OR REPLACE FUNCTION get_ab_event_counts()
RETURNS TABLE(variant_id text, event_type text, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT variant_id, event_type, count(*) as count
  FROM ab_experiment_events
  GROUP BY variant_id, event_type;
$$;
