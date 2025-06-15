#!/bin/bash

# Скрипт для зміни власника бази даних regmik-erp на користувача regmik
# Використовувати в продакшн середовищі з правами суперкористувача

DB_NAME="regmik-erp"
NEW_OWNER="regmik"
PASSWORD="regmik_secure_prod_2025"

echo "Зміна власника бази даних $DB_NAME на $NEW_OWNER..."

# Метод 1: Локальний PostgreSQL
if command -v sudo >/dev/null 2>&1; then
    echo "Виконання через sudo..."
    sudo -u postgres psql << EOF
-- Створити користувача якщо не існує
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$NEW_OWNER') THEN
        CREATE USER $NEW_OWNER WITH PASSWORD '$PASSWORD' CREATEDB CREATEROLE LOGIN;
        RAISE NOTICE 'Користувач $NEW_OWNER створено';
    ELSE
        RAISE NOTICE 'Користувач $NEW_OWNER вже існує';
    END IF;
END
\$\$;

-- Змінити власника бази даних
ALTER DATABASE "$DB_NAME" OWNER TO $NEW_OWNER;

-- Надати всі привілеї
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO $NEW_OWNER;
GRANT ALL ON SCHEMA public TO $NEW_OWNER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $NEW_OWNER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $NEW_OWNER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $NEW_OWNER;

-- Перевірка
SELECT datname, pg_catalog.pg_get_userbyid(datdba) as owner 
FROM pg_catalog.pg_database WHERE datname = '$DB_NAME';
EOF
else
    echo "sudo не доступний. Використовуйте команди вручну:"
    echo "psql -U postgres -d $DB_NAME"
    echo "ALTER DATABASE \"$DB_NAME\" OWNER TO $NEW_OWNER;"
fi

echo "Завершено!"