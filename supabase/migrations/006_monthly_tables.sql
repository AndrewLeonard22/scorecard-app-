-- Monthly submissions: one record per user per month, stores all KPI values as JSONB
CREATE TABLE IF NOT EXISTS monthly_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month text NOT NULL,              -- 'YYYY-MM'
  data jsonb NOT NULL DEFAULT '{}', -- role-specific KPI field values
  notes text,
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS monthly_submissions_user_month ON monthly_submissions(user_id, month);
CREATE INDEX IF NOT EXISTS monthly_submissions_month ON monthly_submissions(month);

-- Bonus rates: admin-configurable flat/percent rates per role
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

-- App-wide settings (reminders toggle, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
