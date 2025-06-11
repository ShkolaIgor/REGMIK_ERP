-- Швидке виправлення унікального обмеження для currency_rates
-- Це виправляє помилку: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Видаляємо дублікати якщо вони є
DELETE FROM currency_rates a USING currency_rates b 
WHERE a.id < b.id 
AND a.currency_code = b.currency_code 
AND a.exchange_date = b.exchange_date;

-- Додаємо унікальне обмеження
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'currency_rates_code_date_unique'
    ) THEN
        ALTER TABLE currency_rates 
        ADD CONSTRAINT currency_rates_code_date_unique 
        UNIQUE (currency_code, exchange_date);
        
        RAISE NOTICE 'Унікальне обмеження currency_rates_code_date_unique створено';
    ELSE
        RAISE NOTICE 'Унікальне обмеження currency_rates_code_date_unique вже існує';
    END IF;
END $$;

-- Перевіряємо результат
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'currency_rates'::regclass 
AND contype = 'u';