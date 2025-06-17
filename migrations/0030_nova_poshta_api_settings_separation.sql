-- Міграція для винесення Nova Poshta API налаштувань в окрему таблицю
-- Створено: 2025-01-14

-- Створення таблиці API налаштувань Nova Poshта для клієнтів
CREATE TABLE IF NOT EXISTS client_nova_poshta_api_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Назва конфігурації для ідентифікації
    settings_name VARCHAR(255) NOT NULL,
    
    -- API налаштування
    api_key VARCHAR(255) NOT NULL,
    
    -- Налаштування відправника
    sender_ref VARCHAR(255), -- Референс відправника в НП
    sender_contact_ref VARCHAR(255), -- Референс контакту відправника
    sender_address_ref VARCHAR(255), -- Референс адреси відправника
    
    -- Інформація про відправника
    sender_company_name VARCHAR(255),
    sender_first_name VARCHAR(255),
    sender_last_name VARCHAR(255),
    sender_phone VARCHAR(50),
    sender_email VARCHAR(255),
    
    -- Адреса відправника
    sender_city_ref VARCHAR(255),
    sender_city_name VARCHAR(255),
    sender_warehouse_ref VARCHAR(255),
    sender_warehouse_address TEXT,
    
    -- Налаштування за замовчуванням
    default_service_type VARCHAR(100) DEFAULT 'WarehouseWarehouse',
    default_cargo_type VARCHAR(100) DEFAULT 'Parcel',
    default_payment_method VARCHAR(100) DEFAULT 'Cash',
    default_payer VARCHAR(100) DEFAULT 'Sender',
    
    -- Додаткові налаштування
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- основні налаштування для клієнта
    enable_third_party_shipping BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Перенесення існуючих API налаштувань з таблиці клієнтів
INSERT INTO client_nova_poshta_api_settings (
    client_id,
    settings_name,
    api_key,
    sender_ref,
    sender_contact_ref,
    sender_address_ref,
    enable_third_party_shipping,
    is_primary
)
SELECT 
    id,
    'Основні налаштування API',
    nova_poshta_api_key,
    nova_poshta_sender_ref,
    nova_poshta_contact_ref,
    nova_poshta_address_ref,
    enable_third_party_shipping,
    true
FROM clients 
WHERE nova_poshta_api_key IS NOT NULL;

-- Видалення Nova Poshta полів з таблиці клієнтів
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_api_key;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_sender_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_contact_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_address_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS enable_third_party_shipping;

-- Оновлення існуючої таблиці client_nova_poshta_settings для налаштувань доставки
ALTER TABLE client_nova_poshta_settings 
    ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS delivery_city_ref VARCHAR(255),
    ADD COLUMN IF NOT EXISTS delivery_city_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS delivery_warehouse_ref VARCHAR(255),
    ADD COLUMN IF NOT EXISTS delivery_warehouse_address TEXT,
    ADD COLUMN IF NOT EXISTS preferred_service_type VARCHAR(100) DEFAULT 'WarehouseWarehouse',
    ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(100) DEFAULT 'Cash',
    ADD COLUMN IF NOT EXISTS preferred_payer VARCHAR(100) DEFAULT 'Recipient';

-- Перейменування старих полів для уникнення конфліктів
ALTER TABLE client_nova_poshta_settings 
    RENAME COLUMN api_key TO old_api_key,
    RENAME COLUMN sender_ref TO old_sender_ref,
    RENAME COLUMN sender_address TO old_sender_address,
    RENAME COLUMN sender_city_ref TO old_sender_city_ref,
    RENAME COLUMN sender_phone TO old_sender_phone,
    RENAME COLUMN sender_contact TO old_sender_contact,
    RENAME COLUMN default_service_type TO old_default_service_type,
    RENAME COLUMN default_cargo_type TO old_default_cargo_type,
    RENAME COLUMN default_payment_method TO old_default_payment_method,
    RENAME COLUMN default_payer TO old_default_payer;

-- Створення індексів для продуктивності
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_api_settings_client_id ON client_nova_poshta_api_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_api_settings_is_active ON client_nova_poshta_api_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_api_settings_is_primary ON client_nova_poshta_api_settings(is_primary);

-- Комітування змін
COMMIT;