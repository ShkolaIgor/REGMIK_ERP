-- Скрипт для синхронізації схеми між тестуванням та продакшном
-- Виконувати на продакшн-сервері для приведення до єдиної структури

-- 1. Резервне копіювання старої таблиці users
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- 2. Видалення старої таблиці users (вона має лише id, username, password)
DROP TABLE IF EXISTS users CASCADE;

-- 3. Створення VIEW users що посилається на local_users для уніфікації
CREATE VIEW users AS SELECT * FROM local_users;

-- 4. Оновлення всіх foreign key що посилались на стару таблицю users
-- (При потребі можна додати ALTER TABLE команди для зміни зв'язків)

-- 5. Перевірка що всі необхідні поля існують у local_users
DO $$
BEGIN
    -- Перевіряємо наявність усіх полів
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'local_users' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE local_users ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'local_users' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE local_users ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'local_users' AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE local_users ADD COLUMN profile_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'local_users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE local_users ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- 6. Додавання відсутніх індексів для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_local_users_email ON local_users(email);
CREATE INDEX IF NOT EXISTS idx_local_users_username ON local_users(username);
CREATE INDEX IF NOT EXISTS idx_local_users_role ON local_users(role);
CREATE INDEX IF NOT EXISTS idx_local_users_is_active ON local_users(is_active);

-- 7. Перевірка що все працює правильно
SELECT 
    'local_users' as table_name,
    COUNT(*) as record_count,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'local_users' AND table_schema = 'public'
GROUP BY table_name;

-- 8. Показати структуру VIEW users
SELECT 
    'users (view)' as table_name,
    COUNT(*) as record_count
FROM users;

COMMIT;