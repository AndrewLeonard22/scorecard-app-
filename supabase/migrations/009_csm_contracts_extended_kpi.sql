-- Add "clients on longer-term contracts" KPI for CSM dashboard visibility
-- This tracks count only; the dollar value lives in monthly_submissions.data as contract_extension_value
INSERT INTO kpi_definitions (role, key, label, unit, target_monthly, direction, green_threshold, yellow_threshold, display_order, active)
VALUES ('csm', 'contracts_extended', 'Clients on longer-term contracts', 'number', 1, 'higher_is_better', 1, 0, 7, true)
ON CONFLICT DO NOTHING;
