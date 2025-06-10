-- Налаштування UTF8 кодування для бази даних REGMIK ERP
-- Виконувати від імені власника бази даних

-- Встановлення кодування сесії
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Перевірка поточного кодування бази даних
SELECT datname, pg_encoding_to_char(encoding) as encoding 
FROM pg_database 
WHERE datname = current_database();

-- Встановлення параметрів для підтримки української мови
ALTER DATABASE regmik_erp SET timezone = 'Europe/Kiev';
ALTER DATABASE regmik_erp SET lc_messages = 'uk_UA.UTF-8';
ALTER DATABASE regmik_erp SET lc_monetary = 'uk_UA.UTF-8';
ALTER DATABASE regmik_erp SET lc_numeric = 'uk_UA.UTF-8';
ALTER DATABASE regmik_erp SET lc_time = 'uk_UA.UTF-8';

-- Створення функції для перевірки UTF8 підтримки
CREATE OR REPLACE FUNCTION check_utf8_support()
RETURNS TABLE(
    test_text text,
    length_bytes int,
    length_chars int,
    is_valid_utf8 boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Тестовий український текст: REGMIK ERP Система' as test_text,
        octet_length('Тестовий український текст: REGMIK ERP Система') as length_bytes,
        char_length('Тестовий український текст: REGMIK ERP Система') as length_chars,
        convert_from(convert_to('Тестовий український текст: REGMIK ERP Система', 'UTF8'), 'UTF8') = 'Тестовий український текст: REGMIK ERP Система' as is_valid_utf8;
END;
$$ LANGUAGE plpgsql;

-- Тестування UTF8 підтримки
SELECT * FROM check_utf8_support();

-- Інформація про поточне кодування та локалі
SHOW client_encoding;
SHOW lc_collate;
SHOW lc_ctype;
SHOW timezone;