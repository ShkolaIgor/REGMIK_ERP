# Налаштування UTF8 кодування для REGMIK ERP

## Статус
✅ База даних вже налаштована з UTF8 кодуванням (neondb, UTF8, C.UTF-8)
✅ Сервер налаштований для підтримки української мови
✅ Створено функції для роботи з українським текстом

## Створені функції

### 1. Нормалізація тексту для пошуку
```sql
SELECT normalize_ukrainian_search('РЕГМІК ERP Система');
-- Результат: регмік erp система
```

### 2. Генерація slug з української назви
```sql
SELECT ukrainian_to_slug('Управління компаніями та виробництвом');
-- Результат: upravlinnia-kompaniiamy-ta-vyrobnytstvom
```

## Автоматичні налаштування

### Підключення до бази даних
- Автоматичне встановлення `client_encoding=UTF8`
- Часовий пояс `Europe/Kiev`
- Правильні заголовки HTTP для UTF8

### Express сервер
- JSON парсер з підтримкою UTF8
- URL-encoded парсер з підтримкою UTF8
- Правильні Content-Type заголовки

## Тестування

Виконайте наступні SQL команди для перевірки:

```sql
-- Перевірка кодування
SELECT 
    datname as database_name,
    pg_encoding_to_char(encoding) as encoding,
    datcollate as collate,
    datctype as ctype
FROM pg_database 
WHERE datname = current_database();

-- Тестування української мови
SELECT 
    'Тестовий український текст: РЕГМІК ERP Система 🇺🇦' as ukrainian_text,
    length('Тестовий український текст: РЕГМІК ERP Система 🇺🇦') as char_length,
    octet_length('Тестовий український текст: РЕГМІК ERP Система 🇺🇦') as byte_length;

-- Перевірка функцій
SELECT 
    normalize_ukrainian_search('РЕГМІК ERP Система') as normalized,
    ukrainian_to_slug('РЕГМІК ERP Система') as slug;
```

## Результат
Система повністю підтримує українську мову у всіх 21 модулі ERP системи.