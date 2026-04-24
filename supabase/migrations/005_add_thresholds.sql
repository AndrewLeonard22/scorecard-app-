-- Add threshold columns to kpi_definitions for green/yellow/red status logic
ALTER TABLE kpi_definitions
  ADD COLUMN IF NOT EXISTS green_threshold numeric,
  ADD COLUMN IF NOT EXISTS yellow_threshold numeric;
