-- Створення таблиці currency_update_settings для продакшену
CREATE TABLE IF NOT EXISTS currency_update_settings (
  id SERIAL PRIMARY KEY,
  auto_update_enabled BOOLEAN DEFAULT true,
  update_time VARCHAR(5) DEFAULT '09:00',
  last_update_date TIMESTAMP,
  last_update_status VARCHAR(20) DEFAULT 'pending',
  last_update_error TEXT,
  enabled_currencies JSONB DEFAULT '["USD", "EUR"]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Вставляємо початкові налаштування якщо таблиця порожня
INSERT INTO currency_update_settings (auto_update_enabled, update_time, enabled_currencies)
SELECT true, '09:00', '["USD", "EUR"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM currency_update_settings);

-- Також перевіряємо чи існують інші необхідні таблиці
CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currency_rates (
  id SERIAL PRIMARY KEY,
  currency_code VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 4) NOT NULL,
  exchange_date TIMESTAMP NOT NULL,
  txt VARCHAR(100),
  cc VARCHAR(3),
  r030 INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Створюємо індекс для швидкого пошуку по коду валюти та даті
CREATE INDEX IF NOT EXISTS currency_rates_code_date_idx ON currency_rates(currency_code, exchange_date);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  currency_id INTEGER REFERENCES currencies(id),
  rate DECIMAL(12, 6) NOT NULL,
  exchange_date TIMESTAMP NOT NULL,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Додаємо базові валюти якщо їх немає
INSERT INTO currencies (code, name, symbol) VALUES
('UAH', 'Українська гривня', '₴'),
('USD', 'Долар США', '$'),
('EUR', 'Євро', '€')
ON CONFLICT (code) DO NOTHING;