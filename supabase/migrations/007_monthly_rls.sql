-- Enable RLS on new tables
ALTER TABLE monthly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ── monthly_submissions ───────────────────────────────────────────────────────
-- All authenticated users can read all submissions (needed for shared dashboard)
CREATE POLICY "ms_select_authenticated"
  ON monthly_submissions FOR SELECT
  TO authenticated
  USING (true);

-- Owner can insert their own submission
CREATE POLICY "ms_insert_owner"
  ON monthly_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Owner can update when not locked; admin can update anything (for unlock)
CREATE POLICY "ms_update_owner_or_admin"
  ON monthly_submissions FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid() AND locked = false)
    OR is_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() AND locked = false)
    OR is_admin()
  );

-- ── bonus_rates ───────────────────────────────────────────────────────────────
-- Users can only read rates for their own role; admin sees all.
-- This prevents a CSM from computing another CSM's bonus (if there were two).
CREATE POLICY "br_select"
  ON bonus_rates FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR role = (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "br_insert_admin"
  ON bonus_rates FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "br_update_admin"
  ON bonus_rates FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── settings ──────────────────────────────────────────────────────────────────
CREATE POLICY "settings_select_authenticated"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "settings_insert_admin"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
