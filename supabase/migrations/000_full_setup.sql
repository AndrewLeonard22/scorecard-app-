-- ════════════════════════════════════════════════════════════
-- SocialWorks Scorecard — Full Database Setup
-- Run this once in Supabase SQL Editor for a fresh project
-- ════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'csr' CHECK (role IN ('admin','csm','media_buyer','csr')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── kpi_definitions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin','csm','media_buyer','csr')),
  key text NOT NULL,
  label text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('number','currency','percent','duration_days')),
  target_monthly numeric,
  direction text NOT NULL CHECK (direction IN ('higher_is_better','lower_is_better')),
  green_threshold numeric,
  yellow_threshold numeric,
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(role, key)
);

-- ── monthly_submissions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  notes text,
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS monthly_submissions_user_month ON monthly_submissions(user_id, month);
CREATE INDEX IF NOT EXISTS monthly_submissions_month ON monthly_submissions(month);

-- ── bonus_rates ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bonus_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('csm', 'media_buyer', 'csr')),
  key text NOT NULL,
  label text NOT NULL,
  rate_type text NOT NULL CHECK (rate_type IN ('flat_per_occurrence', 'percent_of_value')),
  rate_value numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  UNIQUE(role, key)
);

-- ── settings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- kpi_definitions
CREATE POLICY "kpis_select" ON kpi_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kpis_write_admin" ON kpi_definitions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- monthly_submissions
CREATE POLICY "ms_select" ON monthly_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ms_insert_owner" ON monthly_submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ms_update_owner_or_admin" ON monthly_submissions FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() AND locked = false) OR is_admin())
  WITH CHECK ((user_id = auth.uid() AND locked = false) OR is_admin());

-- bonus_rates
CREATE POLICY "br_select" ON bonus_rates FOR SELECT TO authenticated
  USING (is_admin() OR role = (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1));
CREATE POLICY "br_write_admin" ON bonus_rates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- settings
CREATE POLICY "settings_select" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write_admin" ON settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ── Profile auto-create trigger ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'csr')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Month lock function (called by pg_cron on 5th of each month) ──────────────
CREATE OR REPLACE FUNCTION lock_previous_month()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prev_month text := to_char(date_trunc('month', now()) - interval '1 day', 'YYYY-MM');
BEGIN
  UPDATE monthly_submissions SET locked = true
  WHERE month = prev_month AND locked = false;
END;
$$;

-- ── KPI definitions ───────────────────────────────────────────────────────────
INSERT INTO kpi_definitions (role, key, label, unit, target_monthly, direction, green_threshold, yellow_threshold, display_order, active)
VALUES
  -- CSM
  ('csm', 'churn_rate',              'Churn Rate',                        'percent',       8,    'lower_is_better',  8,   10,  1, true),
  ('csm', 'onboarding_to_launch_days','Onboarding → Launch',              'duration_days', 10,   'lower_is_better',  10,  14,  2, true),
  ('csm', 'websites_sold',           'Websites Sold',                     'number',        2,    'higher_is_better', 2,   1,   3, true),
  ('csm', 'reviews_collected',       'Reviews Collected',                 'number',        3,    'higher_is_better', 3,   2,   4, true),
  ('csm', 'video_interviews',        'Video Interviews',                  'number',        2,    'higher_is_better', 2,   1,   5, true),
  ('csm', 'closed_referrals',        'Closed Referrals',                  'number',        2,    'higher_is_better', 2,   1,   6, true),
  ('csm', 'contracts_extended',      'Clients on longer-term contracts',  'number',        1,    'higher_is_better', 1,   0,   7, true),
  -- Media Buyer
  ('media_buyer', 'cpa_dfy',                 'CPA (DFY)',               'currency',  null, 'lower_is_better',  180, 240, 1, true),
  ('media_buyer', 'cpl_dwy',                 'CPL (DWY)',               'currency',  null, 'lower_is_better',  35,  55,  2, true),
  ('media_buyer', 'new_creatives_tested',    'New Creatives Tested',    'number',    12,   'higher_is_better', 12,  8,   3, true),
  ('media_buyer', 'onboarding_to_launch_days','Onboarding → Launch',   'duration_days', 10, 'lower_is_better', 10, 14,  4, true),
  -- CSR
  ('csr', 'dials',              'Dials',               'number', 1600, 'higher_is_better', 1600, 1120, 1, true),
  ('csr', 'conversations',      'Conversations',       'number',  240, 'higher_is_better',  240,  168, 2, true),
  ('csr', 'appointments_booked','Appointments Booked', 'number',   48, 'higher_is_better',   48,   34, 3, true)
ON CONFLICT (role, key) DO NOTHING;

-- ── Bonus rates ───────────────────────────────────────────────────────────────
INSERT INTO bonus_rates (role, key, label, rate_type, rate_value, display_order)
VALUES
  ('csm', 'websites_sold',           'Website sold',                        'flat_per_occurrence', 200, 1),
  ('csm', 'reviews_collected',       'Review (Google + Trustpilot)',        'flat_per_occurrence',  50, 2),
  ('csm', 'video_interviews',        'Video interview',                     'flat_per_occurrence', 200, 3),
  ('csm', 'closed_referrals',        'Closed referral',                     'flat_per_occurrence', 200, 4),
  ('csm', 'ad_spend_upsell',         'Ad spend upsell',                     'percent_of_value',      5, 5),
  ('csm', 'contract_extension_value','Contract extension (3m+ paid in full)','percent_of_value',    10, 6),
  ('csr', 'shows_completed',         'Shows completed',                     'flat_per_occurrence',  50, 1)
ON CONFLICT (role, key) DO NOTHING;

-- ── Settings ──────────────────────────────────────────────────────────────────
INSERT INTO settings (key, value)
VALUES
  ('reminders_enabled', 'true'),
  ('reminder_day', '"monday"')
ON CONFLICT (key) DO NOTHING;
