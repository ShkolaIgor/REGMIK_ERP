# Зміна власника бази даних regmik-erp на користувача regmik в продакшн

## Метод 1: Через суперкористувача PostgreSQL (Рекомендований)

### Крок 1: Підключення як суперкористувач
```bash
# Підключитися до PostgreSQL як суперкористувач
sudo -u postgres psql

# Або якщо використовуєте віддалений сервер
psql -h localhost -U postgres -d regmik-erp
```

### Крок 2: Виконання команд зміни власника
```sql
-- Створити користувача regmik (якщо не існує)
CREATE USER regmik WITH PASSWORD 'regmik_secure_prod_2025' CREATEDB CREATEROLE LOGIN;

-- Змінити власника бази даних
ALTER DATABASE "regmik-erp" OWNER TO regmik;

-- Надати всі привілеї
GRANT ALL PRIVILEGES ON DATABASE "regmik-erp" TO regmik;
GRANT ALL ON SCHEMA public TO regmik;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO regmik;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO regmik;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO regmik;
```

## Метод 2: Через системні команди (якщо PostgreSQL встановлено локально)

### Використовуючи sudo та psql
```bash
# Змінити власника бази даних
sudo -u postgres psql -c "ALTER DATABASE \"regmik-erp\" OWNER TO regmik;"

# Або виконати весь скрипт
sudo -u postgres psql -d regmik-erp -f change_db_owner_production.sql
```

## Метод 3: Через Docker (якщо PostgreSQL в контейнері)

```bash
# Увійти в контейнер PostgreSQL
docker exec -it postgres_container psql -U postgres -d regmik-erp

# Виконати команду зміни власника
ALTER DATABASE "regmik-erp" OWNER TO regmik;
```

## Перевірка результату

Після виконання перевірте зміни:

```sql
-- Перевірити власника бази даних
SELECT datname, pg_catalog.pg_get_userbyid(datdba) as owner
FROM pg_catalog.pg_database 
WHERE datname = 'regmik-erp';

-- Перевірити права користувача regmik
SELECT 
    has_database_privilege('regmik', 'regmik-erp', 'CONNECT') as can_connect,
    has_database_privilege('regmik', 'regmik-erp', 'CREATE') as can_create,
    has_database_privilege('regmik', 'regmik-erp', 'TEMP') as can_temp;
```

## Можливі помилки та рішення

### Помилка: "must be able to SET ROLE"
**Рішення**: Виконувати команди від імені суперкористувача PostgreSQL (postgres)

### Помилка: "permission denied"
**Рішення**: Переконатися що виконуєте команди з правами адміністратора

### Помилка: "database does not exist"
**Рішення**: Створити базу даних або перевірити правильність назви

```sql
-- Створити базу даних якщо не існує
CREATE DATABASE "regmik-erp" OWNER regmik;
```

## Автоматичний скрипт

Для автоматизації процесу:

```bash
#!/bin/bash
# change_owner.sh

DB_NAME="regmik-erp"
NEW_OWNER="regmik"
POSTGRES_USER="postgres"

echo "Зміна власника бази даних $DB_NAME на $NEW_OWNER..."

sudo -u $POSTGRES_USER psql << EOF
ALTER DATABASE "$DB_NAME" OWNER TO $NEW_OWNER;
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $NEW_OWNER;
\q
