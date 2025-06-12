-- Currency Dashboard Widgets Migration
-- Create tables for customizable currency dashboard widgets

-- Currency Dashboards table
CREATE TABLE IF NOT EXISTS "currency_dashboards" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "local_users"("id"),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_default" BOOLEAN DEFAULT false,
  "layout" JSONB DEFAULT '{"columns": 3, "rows": 4, "gap": 16}',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Currency Widgets table
CREATE TABLE IF NOT EXISTS "currency_widgets" (
  "id" SERIAL PRIMARY KEY,
  "dashboard_id" INTEGER NOT NULL REFERENCES "currency_dashboards"("id") ON DELETE CASCADE,
  "type" VARCHAR(50) NOT NULL, -- rate_card, rate_chart, rate_trend, rate_comparison, rate_history
  "title" VARCHAR(255) NOT NULL,
  "config" JSONB NOT NULL,
  "position" JSONB NOT NULL,
  "is_visible" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_currency_dashboards_user_id" ON "currency_dashboards"("user_id");
CREATE INDEX IF NOT EXISTS "idx_currency_dashboards_is_default" ON "currency_dashboards"("is_default");
CREATE INDEX IF NOT EXISTS "idx_currency_widgets_dashboard_id" ON "currency_widgets"("dashboard_id");
CREATE INDEX IF NOT EXISTS "idx_currency_widgets_type" ON "currency_widgets"("type");

-- Insert default dashboard for existing users
INSERT INTO "currency_dashboards" ("user_id", "name", "description", "is_default", "layout")
SELECT 
  "id",
  'Основна панель валют',
  'Стандартна панель для відстеження курсів валют',
  true,
  '{"columns": 3, "rows": 4, "gap": 16}'
FROM "local_users"
WHERE "id" NOT IN (SELECT "user_id" FROM "currency_dashboards" WHERE "is_default" = true);

-- Insert default widgets for new dashboards
WITH new_dashboards AS (
  SELECT "id", "user_id" FROM "currency_dashboards" 
  WHERE "name" = 'Основна панель валют' AND "is_default" = true
)
INSERT INTO "currency_widgets" ("dashboard_id", "type", "title", "config", "position")
SELECT 
  nd."id",
  'rate_card',
  'Курс USD',
  '{"currencies": ["USD"], "baseCurrency": "UAH", "showTrend": true, "precision": 2, "size": "medium"}',
  '{"x": 0, "y": 0, "width": 1, "height": 1}'
FROM new_dashboards nd
UNION ALL
SELECT 
  nd."id",
  'rate_card',
  'Курс EUR',
  '{"currencies": ["EUR"], "baseCurrency": "UAH", "showTrend": true, "precision": 2, "size": "medium"}',
  '{"x": 1, "y": 0, "width": 1, "height": 1}'
FROM new_dashboards nd
UNION ALL
SELECT 
  nd."id",
  'rate_chart',
  'Динаміка курсів за тиждень',
  '{"currencies": ["USD", "EUR"], "timeRange": "7d", "chartType": "line", "baseCurrency": "UAH", "showPercentage": false}',
  '{"x": 2, "y": 0, "width": 1, "height": 2}'
FROM new_dashboards nd;