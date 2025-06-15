-- Скрипт для зміни власника бази даних regmik-erp на користувача regmik в продакшн
-- Використовувати з правами суперкористувача PostgreSQL

-- 1. Створення користувача regmik (якщо не існує)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'regmik') THEN
        CREATE USER regmik WITH PASSWORD 'regmik_secure_prod_2025' CREATEDB CREATEROLE LOGIN;
        RAISE NOTICE 'Користувач regmik створено';
    ELSE
        RAISE NOTICE 'Користувач regmik вже існує';
    END IF;
END
$$;

-- 2. Надання повних прав на базу даних
GRANT ALL PRIVILEGES ON DATABASE "regmik-erp" TO regmik;

-- 3. Зміна власника бази даних (потребує привілеїв суперкористувача)
-- ALTER DATABASE "regmik-erp" OWNER TO regmik;

-- 4. Надання прав на всі схеми
GRANT ALL ON SCHEMA public TO regmik;
GRANT USAGE ON SCHEMA public TO regmik;

-- 5. Надання прав на всі існуючі об'єкти
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO regmik;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO regmik;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO regmik;

-- 6. Налаштування прав за замовчуванням для майбутніх об'єктів
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO regmik;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO regmik;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO regmik;

-- 7. Створення схеми для regmik (опціонально)
CREATE SCHEMA IF NOT EXISTS regmik_admin AUTHORIZATION regmik;

-- Перевірка результатів
SELECT 
    d.datname as database_name,
    pg_catalog.pg_get_userbyid(d.datdba) as current_owner,
    has_database_privilege('regmik', d.datname, 'CONNECT') as can_connect,
    has_database_privilege('regmik', d.datname, 'CREATE') as can_create
FROM pg_catalog.pg_database d 
WHERE d.datname IN ('regmik-erp', 'neondb');

SELECT 
    r.rolname,
    r.rolsuper,
    r.rolcreaterole, 
    r.rolcreatedb,
    r.rolcanlogin
FROM pg_roles r 
WHERE r.rolname = 'regmik';
