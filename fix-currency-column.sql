-- Виправлення структури таблиці currency_rates
-- Додаємо відсутню колонку exchange_date якщо її немає

DO $$
BEGIN
    -- Перевіряємо чи існує колонка exchange_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'exchange_date'
    ) THEN
        -- Додаємо колонку exchange_date
        ALTER TABLE currency_rates ADD COLUMN exchange_date TIMESTAMP;
        
        -- Якщо є колонка date, копіюємо дані
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'currency_rates' 
            AND column_name = 'date'
        ) THEN
            UPDATE currency_rates SET exchange_date = date WHERE exchange_date IS NULL;
            -- Видаляємо стару колонку
            ALTER TABLE currency_rates DROP COLUMN IF EXISTS date;
        END IF;
        
        -- Робимо колонку обов'язковою якщо вона пуста
        UPDATE currency_rates SET exchange_date = NOW() WHERE exchange_date IS NULL;
        ALTER TABLE currency_rates ALTER COLUMN exchange_date SET NOT NULL;
    END IF;
    
    -- Додаємо інші відсутні колонки
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'txt'
    ) THEN
        ALTER TABLE currency_rates ADD COLUMN txt VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'cc'
    ) THEN
        ALTER TABLE currency_rates ADD COLUMN cc VARCHAR(3);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'r030'
    ) THEN
        ALTER TABLE currency_rates ADD COLUMN r030 INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'currency_rates' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE currency_rates ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Створюємо індекс якщо його немає
CREATE INDEX IF NOT EXISTS currency_rates_code_date_idx ON currency_rates(currency_code, exchange_date);