# Міграція для виправлення помилки серійних номерів

## Проблема
В продакшн базі даних існує унікальне обмеження на поле `serial_number` в таблиці `serial_numbers`, що перешкоджає імпорту дублікатів серійних номерів.

## Рішення
Потрібно видалити унікальне обмеження з продакшн бази даних.

## Команди для виконання

1. Підключитися до продакшн бази даних:
```bash
psql $DATABASE_URL
```

2. Перевірити наявність унікального обмеження:
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'serial_numbers' 
AND constraint_type = 'UNIQUE'
AND constraint_name LIKE '%serial_number%';
```

3. Видалити унікальне обмеження:
```sql
ALTER TABLE serial_numbers DROP CONSTRAINT IF EXISTS serial_numbers_serial_number_unique;
ALTER TABLE serial_numbers DROP CONSTRAINT IF EXISTS unique_serial_number;
```

4. Перевірити унікальні індекси:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'serial_numbers' 
AND indexdef LIKE '%UNIQUE%'
AND indexname LIKE '%serial_number%';
```

5. Якщо знайдено унікальний індекс, видалити його:
```sql
-- Замініть 'index_name' на фактичну назву індексу
DROP INDEX IF EXISTS [index_name];
```

6. Перезапустити додаток для застосування змін.

## Перевірка
Після виконання міграції помилка `duplicate key value violates unique constraint "serial_numbers_serial_number_unique"` має зникнути при імпорті позицій замовлень.