-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_calculations ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
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

-- ── profiles ──────────────────────────────────────────────────────────────
-- Any authenticated user can read profiles (team transparency)
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only admin can insert/update profiles
CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── kpi_definitions ───────────────────────────────────────────────────────
CREATE POLICY "kpi_definitions_select_authenticated"
  ON kpi_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "kpi_definitions_insert_admin"
  ON kpi_definitions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "kpi_definitions_update_admin"
  ON kpi_definitions FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── submissions ───────────────────────────────────────────────────────────
-- All authenticated users can read all submissions
CREATE POLICY "submissions_select_authenticated"
  ON submissions FOR SELECT
  TO authenticated
  USING (true);

-- Owner can insert their own submission
CREATE POLICY "submissions_insert_owner"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can update when not locked; admin can update anything
CREATE POLICY "submissions_update_owner_or_admin"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid() AND locked = false)
    OR is_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() AND locked = false)
    OR is_admin()
  );

-- ── submission_values ─────────────────────────────────────────────────────
CREATE POLICY "submission_values_select_authenticated"
  ON submission_values FOR SELECT
  TO authenticated
  USING (true);

-- Owner can insert values for their own submissions
CREATE POLICY "submission_values_insert_owner"
  ON submission_values FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE id = submission_id AND user_id = auth.uid() AND locked = false
    )
  );

-- Owner can update when not locked; admin can update anything
CREATE POLICY "submission_values_update_owner_or_admin"
  ON submission_values FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = submission_id
        AND (
          (s.user_id = auth.uid() AND s.locked = false)
          OR is_admin()
        )
    )
  );

-- ── bonus_calculations ────────────────────────────────────────────────────
-- Only owner or admin can read bonus calculations
CREATE POLICY "bonus_calculations_select_owner_or_admin"
  ON bonus_calculations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Service role can insert/update (from edge function)
CREATE POLICY "bonus_calculations_insert_service"
  ON bonus_calculations FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "bonus_calculations_update_service"
  ON bonus_calculations FOR UPDATE
  TO service_role
  USING (true);
