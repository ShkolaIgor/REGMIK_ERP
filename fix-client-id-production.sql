-- ВИПРАВЛЕННЯ ПОМИЛКИ В ПРОДАКШЕНІ
-- Помилка: column "client_id" of relation "orders" contains null values

-- РІШЕННЯ - виконати команди в такому порядку:

-- 1. Підключитися до бази даних PostgreSQL:
-- psql $DATABASE_URL

-- 2. Виконати SQL запит:
ALTER TABLE orders ALTER COLUMN client_id DROP NOT NULL;

-- 3. Вийти з psql та виконати:
-- npm run db:push

-- 4. Перевірити результат:
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'client_id';
-- Результат: is_nullable = YES

-- ГОТОВО! Тепер Nova Poshta налаштування будуть працювати