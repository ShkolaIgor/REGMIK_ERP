-- Швидке застосування UTF8 налаштувань для REGMIK ERP
-- Виконати після розгортання на Proxmox

SET client_encoding = 'UTF8';
SET timezone = 'Europe/Kiev';

-- Створення необхідних розширень
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Функція нормалізації українського тексту для пошуку
CREATE OR REPLACE FUNCTION normalize_ukrainian_search(input_text text) 
RETURNS text AS $$
BEGIN
    RETURN lower(trim(regexp_replace(input_text, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Функція для генерації slug з української назви
CREATE OR REPLACE FUNCTION ukrainian_to_slug(input_text text) 
RETURNS text AS $$
DECLARE
    result text;
BEGIN
    result := lower(input_text);
    
    result := replace(result, 'а', 'a');
    result := replace(result, 'б', 'b');
    result := replace(result, 'в', 'v');
    result := replace(result, 'г', 'h');
    result := replace(result, 'ґ', 'g');
    result := replace(result, 'д', 'd');
    result := replace(result, 'е', 'e');
    result := replace(result, 'є', 'ie');
    result := replace(result, 'ж', 'zh');
    result := replace(result, 'з', 'z');
    result := replace(result, 'и', 'y');
    result := replace(result, 'і', 'i');
    result := replace(result, 'ї', 'i');
    result := replace(result, 'й', 'i');
    result := replace(result, 'к', 'k');
    result := replace(result, 'л', 'l');
    result := replace(result, 'м', 'm');
    result := replace(result, 'н', 'n');
    result := replace(result, 'о', 'o');
    result := replace(result, 'п', 'p');
    result := replace(result, 'р', 'r');
    result := replace(result, 'с', 's');
    result := replace(result, 'т', 't');
    result := replace(result, 'у', 'u');
    result := replace(result, 'ф', 'f');
    result := replace(result, 'х', 'kh');
    result := replace(result, 'ц', 'ts');
    result := replace(result, 'ч', 'ch');
    result := replace(result, 'ш', 'sh');
    result := replace(result, 'щ', 'shch');
    result := replace(result, 'ь', '');
    result := replace(result, 'ю', 'iu');
    result := replace(result, 'я', 'ia');
    
    result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
    result := trim(both '-' from result);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Функція для перевірки UTF8 валідності
CREATE OR REPLACE FUNCTION is_valid_utf8(input_text text) 
RETURNS boolean AS $$
BEGIN
    BEGIN
        PERFORM convert_to(input_text, 'UTF8');
        RETURN true;
    EXCEPTION WHEN character_not_in_repertoire THEN
        RETURN false;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Тестування UTF8 функцій
SELECT 
    'UTF8 налаштування застосовано успішно' as status,
    normalize_ukrainian_search('РЕГМІК ERP Система') as normalized_test,
    ukrainian_to_slug('РЕГМІК ERP Система') as slug_test,
    is_valid_utf8('Тестовий український текст 🇺🇦') as utf8_test;