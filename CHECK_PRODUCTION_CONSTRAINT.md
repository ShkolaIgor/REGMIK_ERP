# Перевірка унікального обмеження в продакшн

## Команди для перевірки

1. Підключитися до продакшн бази:
```bash
psql $DATABASE_URL
```

2. Перевірити чи існує унікальне обмеження на serial_number:
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'serial_numbers' 
AND constraint_type = 'UNIQUE'
AND constraint_name LIKE '%serial_number%';
```

3. Перевірити унікальні індекси:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'serial_numbers' 
AND indexdef LIKE '%UNIQUE%'
AND indexname LIKE '%serial_number%';
```

4. Якщо знайдено constraint або індекс з serial_number - видалити:
```sql
-- Видалити constraint
ALTER TABLE serial_numbers DROP CONSTRAINT IF EXISTS serial_numbers_serial_number_unique;

-- Видалити індекс (замінити назву на фактичну)
DROP INDEX IF EXISTS [назва_індексу];
```

## Якщо помилка все ще є

Перевірити логи під час імпорту - повинні з'явитися детальні повідомлення про помилки.