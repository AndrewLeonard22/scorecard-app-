-- Seed KPI definitions
-- Weights default to 0 — Andrew sets them via admin panel once targets are finalized
-- target_weekly and target_monthly are NULL until Andrew sets them

-- ── CSM (Rory) ─────────────────────────────────────────────────────────────
INSERT INTO kpi_definitions (role, key, label, unit, target_weekly, target_monthly, direction, weight, display_order) VALUES
('csm', 'reviews_collected',    'Reviews Collected',            'number',       NULL, NULL, 'higher_is_better', 0, 1),
('csm', 'referrals_generated',  'Referrals Generated',          'number',       NULL, NULL, 'higher_is_better', 0, 2),
('csm', 'clients_active_start', 'Clients Active (Week Start)',  'number',       NULL, NULL, 'higher_is_better', 0, 3),
('csm', 'clients_active_end',   'Clients Active (Week End)',    'number',       NULL, NULL, 'higher_is_better', 0, 4),
('csm', 'clients_lost',         'Clients Lost',                 'number',       NULL, NULL, 'lower_is_better',  0, 5),
('csm', 'avg_launch_days',      'Avg Onboarding Days',         'duration_days', NULL, NULL, 'lower_is_better',  0, 6);

-- ── Media Buyer ─────────────────────────────────────────────────────────────
INSERT INTO kpi_definitions (role, key, label, unit, target_weekly, target_monthly, direction, weight, display_order) VALUES
('media_buyer', 'avg_cpl_dfy',            'Avg CPL (DFY)',             'currency', NULL, NULL, 'lower_is_better',  0, 1),
('media_buyer', 'avg_cpa_dfy',            'Avg CPA (DFY)',             'currency', NULL, NULL, 'lower_is_better',  0, 2),
('media_buyer', 'total_spend',            'Total Ad Spend',            'currency', NULL, NULL, 'higher_is_better', 0, 3),
('media_buyer', 'appt_show_rate',         'Appt Show Rate',            'percent',  NULL, NULL, 'higher_is_better', 0, 4),
('media_buyer', 'creative_tests_launched','Creative Tests Launched',   'number',   NULL, NULL, 'higher_is_better', 0, 5);

-- ── CSR / Setter (Alula) ─────────────────────────────────────────────────────
INSERT INTO kpi_definitions (role, key, label, unit, target_weekly, target_monthly, direction, weight, display_order) VALUES
('csr', 'dials',               'Dials',               'number',  NULL, NULL, 'higher_is_better', 0, 1),
('csr', 'connects',            'Connects',            'number',  NULL, NULL, 'higher_is_better', 0, 2),
('csr', 'appointments_booked', 'Appointments Booked', 'number',  NULL, NULL, 'higher_is_better', 0, 3),
('csr', 'show_rate',           'Show Rate',           'percent', NULL, NULL, 'higher_is_better', 0, 4),
('csr', 'booking_rate',        'Booking Rate',        'percent', NULL, NULL, 'higher_is_better', 0, 5);
