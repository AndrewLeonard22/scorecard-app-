-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'csr' CHECK (role IN ('admin','csm','media_buyer','csr')),
  weekly_bonus_target numeric DEFAULT 0,
  ramp_end_date date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- KPI Definitions
CREATE TABLE kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('admin','csm','media_buyer','csr')),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('number','currency','percent','duration_days')),
  target_weekly numeric,
  target_monthly numeric,
  direction text NOT NULL CHECK (direction IN ('higher_is_better','lower_is_better')),
  weight numeric NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 1),
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

-- Submissions (one per user per week)
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false,
  notes text,
  UNIQUE(user_id, week_start)
);

-- Submission Values
CREATE TABLE submission_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  kpi_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  UNIQUE(submission_id, kpi_id)
);

-- Bonus Calculations
CREATE TABLE bonus_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period text NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('weekly','monthly')),
  total_earned numeric NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}',
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, period_type)
);

-- Indexes
CREATE INDEX submissions_user_week ON submissions(user_id, week_start);
CREATE INDEX submissions_week ON submissions(week_start);
CREATE INDEX submission_values_submission ON submission_values(submission_id);
CREATE INDEX bonus_calculations_user ON bonus_calculations(user_id, period_type);
