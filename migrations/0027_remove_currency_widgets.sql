-- Migration: Remove Currency Widgets and Dashboards
-- Version: 13.06.2025 07:46:00
-- Description: Remove currency dashboard and widget system completely

BEGIN;

-- Drop tables in correct order (widgets first due to foreign key)
DROP TABLE IF EXISTS currency_widgets CASCADE;
DROP TABLE IF EXISTS currency_dashboards CASCADE;

-- Drop related indexes if they exist
DROP INDEX IF EXISTS idx_currency_widgets_dashboard_id;
DROP INDEX IF EXISTS idx_currency_widgets_type;
DROP INDEX IF EXISTS idx_currency_dashboards_user_id;
DROP INDEX IF EXISTS idx_currency_dashboards_is_default;

COMMIT;