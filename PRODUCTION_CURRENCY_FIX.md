# Швидке виправлення помилки валют на продакшені

## Проблема
```
Error: relation "currency_update_settings" does not exist
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

# 2. Виконати SQL команди:
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

# 3. Перезапустити сервіс
sudo systemctl restart regmik-erp
```

### Варіант 3: Через файл
```bash
cd /opt/REGMIK_ERP
psql "$DATABASE_URL" -f fix-currency-settings-table.sql
sudo systemctl restart regmik-erp
```

## Перевірка
```bash
# Перевірити статус сервісу
sudo systemctl status regmik-erp

# Переглянути логи
sudo journalctl -u regmik-erp -f
```

## Причина проблеми
Таблиця `currency_update_settings` була додана в схему локально, але міграція не була застосована на продакшені. Це типова проблема при оновленні без правильного розгортання міграцій.