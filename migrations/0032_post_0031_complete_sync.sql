-- Міграція для синхронізації всіх змін після 0031
-- Дата: 2025-06-15
-- Опис: Виправлення несумісності схеми з базою даних

BEGIN;

-- 1. Перевірка та оновлення структури таблиці carriers
DO $$
BEGIN
    -- Перевіряємо чи існує стовпець alternative_names як масив
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'carriers' 
        AND column_name = 'alternative_names'
        AND data_type = 'ARRAY'
    ) THEN
        -- Якщо стовпець не існує як масив, додаємо його
        ALTER TABLE carriers ADD COLUMN alternative_names TEXT[];
        RAISE NOTICE 'Додано стовпець alternative_names як масив до таблиці carriers';
    END IF;

    -- Додаємо інші поля якщо їх немає
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'api_key') THEN
        ALTER TABLE carriers ADD COLUMN api_key VARCHAR(500);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'last_sync_at') THEN
        ALTER TABLE carriers ADD COLUMN last_sync_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'cities_count') THEN
        ALTER TABLE carriers ADD COLUMN cities_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'warehouses_count') THEN
        ALTER TABLE carriers ADD COLUMN warehouses_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'sync_time') THEN
        ALTER TABLE carriers ADD COLUMN sync_time VARCHAR(5);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'sync_interval') THEN
        ALTER TABLE carriers ADD COLUMN sync_interval INTEGER DEFAULT 24;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'auto_sync') THEN
        ALTER TABLE carriers ADD COLUMN auto_sync BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Видалення полів ціни з shipment_items (якщо вони ще існують)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipment_items' AND column_name = 'unit_price') THEN
        ALTER TABLE shipment_items DROP COLUMN unit_price;
        RAISE NOTICE 'Видалено стовпець unit_price з таблиці shipment_items';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipment_items' AND column_name = 'total_price') THEN
        ALTER TABLE shipment_items DROP COLUMN total_price;
        RAISE NOTICE 'Видалено стовпець total_price з таблиці shipment_items';
    END IF;
END $$;

-- 3. Оновлення структури таблиці shipments для відповідності схемі
DO $$
BEGIN
    -- Перевіряємо та додаємо поля відправника
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_name') THEN
        ALTER TABLE shipments ADD COLUMN sender_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_phone') THEN
        ALTER TABLE shipments ADD COLUMN sender_phone VARCHAR(50);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_city_ref') THEN
        ALTER TABLE shipments ADD COLUMN sender_city_ref VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_city_name') THEN
        ALTER TABLE shipments ADD COLUMN sender_city_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_warehouse_ref') THEN
        ALTER TABLE shipments ADD COLUMN sender_warehouse_ref VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'sender_warehouse_address') THEN
        ALTER TABLE shipments ADD COLUMN sender_warehouse_address TEXT;
    END IF;

    -- Перевіряємо та додаємо поля отримувача з правильними назвами
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_city_ref') THEN
        ALTER TABLE shipments ADD COLUMN recipient_city_ref VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_city_name') THEN
        ALTER TABLE shipments ADD COLUMN recipient_city_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_warehouse_ref') THEN
        ALTER TABLE shipments ADD COLUMN recipient_warehouse_ref VARCHAR(255);
    END IF;

    -- Перейменовуємо recipient_warehouse_address з recipient_warehouse_address якщо потрібно
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_warehouse_address') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_warehouse_address') THEN
        ALTER TABLE shipments RENAME COLUMN recipient_warehouse_address TO recipient_warehouse_address;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'recipient_warehouse_address') THEN
        ALTER TABLE shipments ADD COLUMN recipient_warehouse_address TEXT;
    END IF;
END $$;

-- 4. Оновлення коментарів
COMMENT ON TABLE carriers IS 'Перевізники з підтримкою альтернативних назв та API інтеграції';
COMMENT ON COLUMN carriers.alternative_names IS 'Альтернативні назви перевізника для автоматичного розпізнавання';
COMMENT ON COLUMN carriers.api_key IS 'API ключ для інтеграції з системою перевізника';
COMMENT ON COLUMN carriers.auto_sync IS 'Автоматична синхронізація даних перевізника';

COMMENT ON TABLE shipment_items IS 'Товари у відвантаженнях без цінової інформації (тільки логістичні дані)';

COMMENT ON TABLE shipments IS 'Відвантаження з повною інформацією про відправника та отримувача';

-- 5. Створення індексів для оптимізації
CREATE INDEX IF NOT EXISTS idx_carriers_alternative_names ON carriers USING GIN (alternative_names);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id ON shipment_items(product_id);

-- 6. Оновлення тригерів для updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Додаємо тригер для carriers якщо його немає
DROP TRIGGER IF EXISTS update_carriers_updated_at ON carriers;
CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON carriers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Додаємо тригер для shipments якщо його немає
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Перевірка структури після міграції
SELECT 
    'carriers' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'carriers' 
ORDER BY ordinal_position;

-- Логування завершення міграції
DO $$
BEGIN
    RAISE NOTICE 'Міграція 0032_post_0031_complete_sync.sql завершена успішно о %', NOW();
END $$;