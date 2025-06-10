-- Налаштування UTF8 кодування для бази даних REGMIK ERP
-- Migration: 0001_setup_utf8_encoding.sql

-- Встановлення кодування сесії
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Створення або оновлення розширень для підтримки української мови
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Створення функції для нормалізації українського тексту для пошуку
CREATE OR REPLACE FUNCTION normalize_ukrainian_text(input_text text) 
RETURNS text AS $$
BEGIN
    -- Видаляємо зайві пробіли та приводимо до нижнього регістру
    RETURN lower(trim(regexp_replace(input_text, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Створення індексу для швидкого пошуку по українському тексту
-- Буде застосований до таблиць з текстовими полями після їх створення

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

-- Створення користувацького типу для зберігання багатомовних рядків
CREATE TYPE multilang_text AS (
    uk text,  -- український текст
    en text,  -- англійський текст
    ru text   -- російський текст (за потребою)
);

-- Функція для отримання тексту на потрібній мові
CREATE OR REPLACE FUNCTION get_text_by_lang(
    multilang multilang_text, 
    lang_code text DEFAULT 'uk'
) RETURNS text AS $$
BEGIN
    CASE lang_code
        WHEN 'uk' THEN RETURN multilang.uk;
        WHEN 'en' THEN RETURN multilang.en;
        WHEN 'ru' THEN RETURN multilang.ru;
        ELSE RETURN COALESCE(multilang.uk, multilang.en, multilang.ru);
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Створення таблиці для логування змін (audit log) з підтримкою UTF8
CREATE TABLE IF NOT EXISTS system_audit_log (
    id SERIAL PRIMARY KEY,
    table_name varchar(100) NOT NULL,
    operation varchar(10) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id integer,
    old_values jsonb,
    new_values jsonb,
    changed_by varchar(100),
    changed_at timestamp with time zone DEFAULT now(),
    user_ip inet,
    user_agent text
);

-- Індекс для швидкого пошуку в audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_operation ON system_audit_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON system_audit_log(changed_at);

-- Коментар з інформацією про кодування
COMMENT ON DATABASE regmik_erp IS 'REGMIK ERP System Database with UTF-8 encoding support for Ukrainian language';

-- Встановлення часового поясу для України
SET timezone = 'Europe/Kiev';