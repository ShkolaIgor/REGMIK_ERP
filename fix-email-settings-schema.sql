-- Додаємо відсутню колонку created_at до таблиці email_settings
-- Це виправлення для продакшн-системи

ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Оновлюємо існуючі записи, якщо created_at = NULL
UPDATE email_settings 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;