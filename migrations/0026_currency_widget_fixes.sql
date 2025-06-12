-- Migration: Currency Widget Fixes
-- Version: 12.06.2025 11:55:00
-- Description: Database updates for currency widget functionality

BEGIN;

-- Ensure currency dashboards table exists with proper structure
CREATE TABLE IF NOT EXISTS currency_dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    layout JSONB DEFAULT '{"columns": 3, "rows": 4, "gap": 4}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure currency widgets table exists with proper structure
CREATE TABLE IF NOT EXISTS currency_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER NOT NULL REFERENCES currency_dashboards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}',
    position JSONB DEFAULT '{"x": 0, "y": 0, "width": 1, "height": 1}',
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_currency_dashboards_user_id ON currency_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_currency_dashboards_is_default ON currency_dashboards(is_default);
CREATE INDEX IF NOT EXISTS idx_currency_widgets_dashboard_id ON currency_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_currency_widgets_type ON currency_widgets(type);

-- Update triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_currency_dashboards_updated_at ON currency_dashboards;
CREATE TRIGGER update_currency_dashboards_updated_at
    BEFORE UPDATE ON currency_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_currency_widgets_updated_at ON currency_widgets;
CREATE TRIGGER update_currency_widgets_updated_at
    BEFORE UPDATE ON currency_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default dashboard for existing users if not exists
INSERT INTO currency_dashboards (user_id, name, description, is_default, layout)
SELECT DISTINCT u.id, 'Основна панель валют', 'Панель валютної інформації за замовчуванням', true, 
       '{"columns": 3, "rows": 4, "gap": 4}'::jsonb
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM currency_dashboards cd WHERE cd.user_id = u.id AND cd.is_default = true
);

-- Add some default widgets for existing default dashboards
INSERT INTO currency_widgets (dashboard_id, type, title, config, position, is_visible)
SELECT cd.id, 'rate_card', 'Курс USD', 
       '{"currencies": ["USD"], "baseCurrency": "UAH", "precision": 4, "showTrend": true}'::jsonb,
       '{"x": 0, "y": 0, "width": 1, "height": 1}'::jsonb, true
FROM currency_dashboards cd
WHERE cd.is_default = true
AND NOT EXISTS (
    SELECT 1 FROM currency_widgets cw WHERE cw.dashboard_id = cd.id AND cw.type = 'rate_card' AND cw.title = 'Курс USD'
);

INSERT INTO currency_widgets (dashboard_id, type, title, config, position, is_visible)
SELECT cd.id, 'rate_card', 'Курс EUR', 
       '{"currencies": ["EUR"], "baseCurrency": "UAH", "precision": 4, "showTrend": true}'::jsonb,
       '{"x": 1, "y": 0, "width": 1, "height": 1}'::jsonb, true
FROM currency_dashboards cd
WHERE cd.is_default = true
AND NOT EXISTS (
    SELECT 1 FROM currency_widgets cw WHERE cw.dashboard_id = cd.id AND cw.type = 'rate_card' AND cw.title = 'Курс EUR'
);

INSERT INTO currency_widgets (dashboard_id, type, title, config, position, is_visible)
SELECT cd.id, 'rate_comparison', 'Порівняння валют', 
       '{"currencies": ["USD", "EUR"], "baseCurrency": "UAH", "showPercentage": true}'::jsonb,
       '{"x": 2, "y": 0, "width": 1, "height": 1}'::jsonb, true
FROM currency_dashboards cd
WHERE cd.is_default = true
AND NOT EXISTS (
    SELECT 1 FROM currency_widgets cw WHERE cw.dashboard_id = cd.id AND cw.type = 'rate_comparison'
);

-- Update existing widget types to ensure compatibility
UPDATE currency_widgets SET type = 'rate_card' WHERE type = 'rate-display';
UPDATE currency_widgets SET type = 'rate_chart' WHERE type = 'rate-chart';
UPDATE currency_widgets SET type = 'rate_comparison' WHERE type = 'currency-summary';

-- Ensure all configs have required baseCurrency field
UPDATE currency_widgets 
SET config = config || '{"baseCurrency": "UAH"}'::jsonb
WHERE NOT config ? 'baseCurrency';

COMMIT;