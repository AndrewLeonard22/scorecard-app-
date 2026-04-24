-- ── KPI thresholds ────────────────────────────────────────────────────────────
-- For lower_is_better: green_threshold = upper green boundary, yellow_threshold = upper yellow boundary
-- For higher_is_better: green_threshold = lower green boundary, yellow_threshold = lower yellow boundary

UPDATE kpi_definitions SET green_threshold = 8, yellow_threshold = 10
  WHERE key = 'churn_rate';
-- churn_rate: <8% green, 8-10% yellow, >10% red

UPDATE kpi_definitions SET green_threshold = 10, yellow_threshold = 14
  WHERE key = 'onboarding_to_launch_days';
-- launch days: ≤10d green, 11-14 yellow, >14 red

UPDATE kpi_definitions SET green_threshold = 180, yellow_threshold = 240
  WHERE key = 'cpa_dfy';
-- CPA: <$180 green, $180-240 yellow, >$240 red

UPDATE kpi_definitions SET green_threshold = 35, yellow_threshold = 55
  WHERE key = 'cpl_dwy';
-- CPL: <$35 green, $35-55 yellow, >$55 red

UPDATE kpi_definitions SET green_threshold = 12, yellow_threshold = 8
  WHERE key = 'new_creatives_tested';
-- higher_is_better: ≥12 green, 8-11 yellow, <8 red

UPDATE kpi_definitions SET target_monthly = 1600
  WHERE key = 'dials';

UPDATE kpi_definitions SET target_monthly = 240
  WHERE key = 'conversations';

UPDATE kpi_definitions SET target_monthly = 48
  WHERE key = 'appointments_booked';

-- ── Bonus rates ───────────────────────────────────────────────────────────────
INSERT INTO bonus_rates (role, key, label, rate_type, rate_value, display_order)
VALUES
  ('csm', 'websites_sold',     'Website sold',                 'flat_per_occurrence', 200, 1),
  ('csm', 'reviews_collected', 'Review (Google + Trustpilot)', 'flat_per_occurrence',  50, 2),
  ('csm', 'video_interviews',  'Video interview',              'flat_per_occurrence', 200, 3),
  ('csm', 'closed_referrals',  'Closed referral',              'flat_per_occurrence', 200, 4),
  ('csm', 'ad_spend_upsell',          'Ad spend upsell',                       'percent_of_value',      5, 5),
  ('csm', 'contract_extension_value', 'Contract extension (3m+ paid in full)', 'percent_of_value',     10, 6),
  ('csr', 'shows_completed',          'Shows completed',                       'flat_per_occurrence',  50, 1)
ON CONFLICT (role, key) DO NOTHING;

-- ── Settings ──────────────────────────────────────────────────────────────────
INSERT INTO settings (key, value)
VALUES
  ('reminders_enabled', 'true'),
  ('reminder_day', '"monday"')
ON CONFLICT (key) DO NOTHING;

-- ── Month lock function ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION lock_previous_month()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prev_month text := to_char(date_trunc('month', now()) - interval '1 day', 'YYYY-MM');
BEGIN
  UPDATE monthly_submissions
  SET locked = true
  WHERE month = prev_month AND locked = false;
END;
$$;
