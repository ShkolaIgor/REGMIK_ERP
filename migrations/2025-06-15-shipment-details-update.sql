-- Міграція для оновлення структури відвантажень
-- Дата: 2025-06-15
-- Опис: Видалення полів ціни з shipment_items після оновлення UI

-- Перевіряємо чи існує стовпець unit_price в shipment_items
DO $$
BEGIN
    -- Видаляємо стовпець unit_price якщо він існує
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shipment_items' 
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE shipment_items DROP COLUMN unit_price;
        RAISE NOTICE 'Видалено стовпець unit_price з таблиці shipment_items';
    END IF;

    -- Видаляємо стовпець total_price якщо він існує
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shipment_items' 
        AND column_name = 'total_price'
    ) THEN
        ALTER TABLE shipment_items DROP COLUMN total_price;
        RAISE NOTICE 'Видалено стовпець total_price з таблиці shipment_items';
    END IF;
END $$;

-- Оновлюємо коментарі до таблиці
COMMENT ON TABLE shipment_items IS 'Товари у відвантаженнях без цінової інформації (тільки логістичні дані)';

-- Перевіряємо структуру таблиці після змін
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shipment_items' 
ORDER BY ordinal_position;