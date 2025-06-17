# REGMIK ERP - Управління базою даних

## Огляд
Система REGMIK ERP використовує власну систему управління схемою бази даних замість стандартного drizzle-kit через проблеми сумісності.

## Команди управління базою даних

### Замість npm run db:push використовуйте:
```bash
./scripts/db-push.sh
```

### Доступні скрипти:

#### 1. Ініціалізація бази даних
```bash
node scripts/init-database.js
```
- Створює всі необхідні таблиці
- Перевіряє foreign keys
- Синхронізує схему з кодом

#### 2. Ручні міграції
```bash
node scripts/manual-migration.js
```
- Застосовує нові міграції
- Створює індекси для продуктивності
- Оновлює версійний контроль

#### 3. Повне управління схемою
```bash
node scripts/schema-manager.js
```
- Замінює drizzle-kit
- Блокує застарілі інструменти
- Синхронізує повну схему

#### 4. Обхід drizzle проблем
```bash
node scripts/bypass-drizzle.js
```
- Очищає метадані drizzle
- Перевіряє цілісність схеми
- Оптимізує таблиці

## Версійний контроль схеми

Система використовує таблицю `schema_versions` для відстеження змін:

```sql
-- Перевірка поточної версії
SELECT * FROM schema_versions ORDER BY version DESC LIMIT 1;

-- Статус всіх таблиць
SELECT * FROM schema_status;
```

### Поточні версії:
- **Версія 1**: Базова синхронізація типів client_id
- **Версія 2**: Створення індексів для продуктивності  
- **Версія 3**: Повна синхронізація client_mail з новими колонками

## Структура таблиць

### Основні таблиці:
- **orders** (22 колонки) - замовлення та рахунки
- **client_mail** (21 колонка) - кореспонденція з клієнтами
- **products** (20 колонок) - каталог продукції
- **clients** (20 колонок) - база клієнтів
- **users** - користувачі системи
- **sessions** - сесії автентифікації

### Ключові foreign keys:
- `orders.client_id` → `clients.id`
- `client_mail.client_id` → `clients.id`
- `client_contacts.client_id` → `clients.id`
- `client_nova_poshta_settings.client_id` → `clients.id`
- `invoices.client_id` → `clients.id`

## Оптимізація продуктивності

### Створені індекси:
- `idx_orders_client_id` - швидкий пошук замовлень клієнта
- `idx_client_mail_client_id` - швидкий пошук листування
- `idx_products_sku` - пошук за артикулом
- `idx_inventory_product_id` - складські операції

### Автоматичні оптимізації:
- ANALYZE для оновлення статистик
- VACUUM для очищення
- Compression для великих таблиць

## Резервне копіювання

### Ручне резервне копіювання:
```bash
# База даних
pg_dump -h localhost -U regmik -d regmik-erp > backup_$(date +%Y%m%d).sql

# Файли проекту
tar -czf regmik_backup_$(date +%Y%m%d).tar.gz /opt/regmik-erp --exclude=node_modules
```

### Автоматичне резервне копіювання:
Використовуйте скрипт з DEPLOYMENT_GUIDE.md для налаштування cron.

## Усунення неполадок

### Проблема: "client_id cannot be cast to integer"
**Рішення**: Використовуйте `./scripts/db-push.sh` замість `npm run db:push`

### Проблема: Foreign key порушення
**Рішення**: 
```bash
node scripts/init-database.js
```

### Проблема: Відсутні індекси
**Рішення**:
```bash
node scripts/manual-migration.js
```

### Проблема: Конфлікти drizzle-kit
**Рішення**:
```bash
node scripts/bypass-drizzle.js
```

## Моніторинг

### Перевірка статусу таблиць:
```sql
SELECT 
    schemaname, 
    tablename, 
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Перевірка розміру таблиць:
```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Перевірка індексів:
```sql
SELECT 
    indexname,
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

## Важливі примітки

1. **Ніколи не використовуйте** `drizzle-kit push` - він заблокований
2. **Завжди використовуйте** власні скрипти управління схемою
3. **Перевіряйте версію** перед застосуванням змін
4. **Створюйте резервні копії** перед важливими змінами
5. **Моніторьте продуктивність** через pg_stat_user_tables

## Команди для швидкого доступу

```bash
# Статус системи
./scripts/db-push.sh

# Повна перевірка
node scripts/init-database.js && node scripts/manual-migration.js

# Екстрене відновлення
node scripts/bypass-drizzle.js && node scripts/schema-manager.js
```