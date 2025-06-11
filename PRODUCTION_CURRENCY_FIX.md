# Швидке виправлення помилки валют на продакшені

## Проблеми
```
Error: relation "currency_update_settings" does not exist
Error: column "exchange_date" of relation "currency_rates" does not exist
Error: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Рішення

### Варіант 1: Автоматичний скрипт
```bash
cd /opt/REGMIK_ERP
chmod +x fix-production-currency-tables.sh
./fix-production-currency-tables.sh
```

### Варіант 2: Ручне виконання
```bash
# 1. Підключитися до бази даних
psql "$DATABASE_URL"

# 2. Виконати SQL команди для створення таблиць:
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

INSERT INTO currency_update_settings (auto_update_enabled, update_time, enabled_currencies)
SELECT true, '09:00', '["USD", "EUR"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM currency_update_settings);

# 3. Виправити структуру таблиці currency_rates:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'exchange_date'
    ) THEN
        ALTER TABLE currency_rates ADD COLUMN exchange_date TIMESTAMP;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'currency_rates' 
            AND column_name = 'date'
        ) THEN
            UPDATE currency_rates SET exchange_date = date WHERE exchange_date IS NULL;
            ALTER TABLE currency_rates DROP COLUMN IF EXISTS date;
        END IF;
        
        UPDATE currency_rates SET exchange_date = NOW() WHERE exchange_date IS NULL;
        ALTER TABLE currency_rates ALTER COLUMN exchange_date SET NOT NULL;
    END IF;
END $$;

# 4. Перезапустити сервіс
sudo systemctl restart regmik-erp
```

### Варіант 3: Через файли
```bash
cd /opt/REGMIK_ERP
psql "$DATABASE_URL" -f fix-currency-settings-table.sql
psql "$DATABASE_URL" -f fix-currency-column.sql
sudo systemctl restart regmik-erp
```

### Варіант 4: Швидке виправлення тільки ON CONFLICT помилки
```bash
cd /opt/REGMIK_ERP
psql "$DATABASE_URL" -f fix-unique-constraint.sql
sudo systemctl restart regmik-erp
```

## Перевірка
```bash
# Перевірити статус сервісу
sudo systemctl status regmik-erp

# Переглянути логи
sudo journalctl -u regmik-erp -f
```

## Причина проблем
1. Таблиця `currency_update_settings` була додана в схему локально, але міграція не була застосована на продакшені
2. Колонка `exchange_date` в таблиці `currency_rates` має неправильну назву або відсутня
3. Відсутнє унікальне обмеження (currency_code, exchange_date) для підтримки ON CONFLICT операцій
4. Це типова проблема при оновленні без правильного розгортання міграцій схеми бази даних