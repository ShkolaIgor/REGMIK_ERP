-- Видалення унікального обмеження на serial_number в продакшн базі
-- Запустити цю команду в продакшн базі даних

-- Перевіряємо наявність constraint
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'serial_numbers' 
AND constraint_type = 'UNIQUE'
AND constraint_name LIKE '%serial_number%';

-- Видаляємо constraint якщо він існує
ALTER TABLE serial_numbers DROP CONSTRAINT IF EXISTS serial_numbers_serial_number_unique;
ALTER TABLE serial_numbers DROP CONSTRAINT IF EXISTS unique_serial_number;

-- Перевіряємо унікальні індекси
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'serial_numbers' 
AND indexdef LIKE '%UNIQUE%'
AND indexname LIKE '%serial_number%';

-- Видаляємо унікальний індекс якщо він існує (крім primary key)
-- Замініть 'index_name' на фактичну назву індексу з попереднього запиту
-- DROP INDEX IF EXISTS serial_numbers_serial_number_unique;