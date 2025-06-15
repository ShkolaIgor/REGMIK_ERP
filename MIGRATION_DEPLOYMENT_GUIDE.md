# Інструкція розгортання міграції Nova Poshta API Settings

## Огляд
Ця міграція додає функціональність окремих налаштувань API Nova Poshta для кожного клієнта та виправляє існуючі проблеми схеми бази даних.

## Файли міграції

### 1. Основна міграція
```
migrations/0031_production_nova_poshta_complete.sql
```

### 2. Скрипт розгортання
```
deploy-nova-poshta-migration.sh
```

## Що включає міграція

### Нова таблиця: `client_nova_poshta_api_settings`
- Зберігає API ключі та налаштування відправника для кожного клієнта
- Підтримує декілька конфігурацій API на клієнта
- Система primary/backup налаштувань

### Виправлення існуючої таблиці: `client_nova_poshta_settings`
Додає відсутні колонки:
- `recipient_name` - ім'я отримувача
- `recipient_phone` - телефон отримувача
- `recipient_email` - email отримувача
- `delivery_city_ref` - референс міста доставки
- `delivery_city_name` - назва міста доставки
- `delivery_warehouse_ref` - референс відділення
- `delivery_warehouse_address` - адреса відділення
- `service_type` - тип послуги
- `cargo_type` - тип вантажу
- `payment_method` - спосіб оплати
- `payer` - платник
- `description` - опис
- `is_active` - активність
- `is_primary` - первинність
- `created_at` - дата створення
- `updated_at` - дата оновлення

## Кроки розгортання

### 1. Підготовка
```bash
# Переконайтеся, що змінна DATABASE_URL налаштована
echo $DATABASE_URL

# Перевірте підключення до бази даних
psql "$DATABASE_URL" -c "SELECT version();"
```

### 2. Створення резервної копії
```bash
# Створити резервну копію схеми
pg_dump "$DATABASE_URL" --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Створити резервну копію даних
pg_dump "$DATABASE_URL" --data-only > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Виконання міграції

#### Автоматичне розгортання (рекомендовано)
```bash
# Виконати скрипт автоматичного розгортання
./deploy-nova-poshta-migration.sh

# Із тестуванням
./deploy-nova-poshta-migration.sh --test
```

#### Ручне розгортання
```bash
# Виконати міграцію вручну
psql "$DATABASE_URL" -f migrations/0031_production_nova_poshta_complete.sql
```

### 4. Перевірка результатів

#### Перевірка таблиць
```sql
-- Перевірити нову таблицю
\dt client_nova_poshta_api_settings

-- Перевірити структуру
\d client_nova_poshta_api_settings
\d client_nova_poshta_settings
```

#### Перевірка індексів
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('client_nova_poshta_settings', 'client_nova_poshta_api_settings');
```

#### Перевірка тригерів
```sql
SELECT trigger_name, table_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%nova_poshta%updated_at%';
```

## Тестування функціональності

### 1. Створення API налаштувань
```sql
INSERT INTO client_nova_poshta_api_settings 
(client_id, api_key, sender_phone, sender_contact_person, sender_address, is_primary, is_active) 
VALUES 
(1, 'test-api-key-123', '+380501234567', 'Іван Іваненко', 'м. Київ, вул. Хрещатик, 1', true, true);
```

### 2. Перевірка API ендпоінтів
```bash
# Отримати налаштування клієнта
curl -X GET "http://localhost:5000/api/clients/1/nova-poshta-api-settings"

# Створити нові налаштування
curl -X POST "http://localhost:5000/api/clients/1/nova-poshta-api-settings" \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test-key", "senderPhone": "+380501234567", "isPrimary": false}'
```

## Відкат міграції

У разі проблем:

### 1. Видалення нової таблиці
```sql
DROP TABLE IF EXISTS client_nova_poshta_api_settings CASCADE;
```

### 2. Відновлення з резервної копії
```bash
# Відновити повну схему
psql "$DATABASE_URL" < schema_backup_YYYYMMDD_HHMMSS.sql

# Відновити дані
psql "$DATABASE_URL" < data_backup_YYYYMMDD_HHMMSS.sql
```

## Моніторинг після розгортання

### 1. Перевірка логів додатку
```bash
# Перевірити логи на помилки
tail -f production.log | grep -i "nova.poshta\|error"
```

### 2. Перевірка продуктивності
```sql
-- Перевірити використання індексів
EXPLAIN ANALYZE SELECT * FROM client_nova_poshta_api_settings WHERE client_id = 1;
```

### 3. Перевірка цілісності даних
```sql
-- Перевірити обмеження primary налаштувань
SELECT client_id, COUNT(*) as primary_count 
FROM client_nova_poshta_api_settings 
WHERE is_primary = true 
GROUP BY client_id 
HAVING COUNT(*) > 1;
```

## Очікувані результати

### 1. Нова функціональність
- ✅ Можливість створювати декілька API конфігурацій на клієнта
- ✅ Система primary/backup налаштувань
- ✅ Окремі налаштування відправника для кожної конфігурації

### 2. Виправлені проблеми
- ✅ Відсутня колонка `recipient_name` в `client_nova_poshta_settings`
- ✅ Повна схема для налаштувань доставки Nova Poshta
- ✅ Автоматичне оновлення timestamps

### 3. Покращення продуктивності
- ✅ Індекси для швидкого пошуку
- ✅ Обмеження цілісності даних
- ✅ Тригери для автоматичного оновлення

## Контрольний список

- [ ] Створено резервну копію бази даних
- [ ] Виконано міграцію без помилок
- [ ] Перевірено створення нової таблиці
- [ ] Перевірено додавання колонок до існуючої таблиці
- [ ] Протестовано API ендпоінти
- [ ] Перевірено обмеження primary налаштувань
- [ ] Перевірено роботу тригерів
- [ ] Перевірено логи додатку
- [ ] Видалено тестові дані

## Підтримка

У разі проблем:
1. Перевірте логи в файлі `migration_log_TIMESTAMP.log`
2. Використайте резервні копії для відкату
3. Перевірте налаштування DATABASE_URL
4. Переконайтеся в правильності прав доступу до бази даних