-- Migration: Add Nova Poshta Integration
-- Version: 14.06.2025 07:30:00
-- Description: Add Nova Poshta API integration, cities, warehouses and client settings

BEGIN;

-- Add Nova Poshta settings to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS nova_poshta_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS nova_poshta_sender_ref VARCHAR(255),
ADD COLUMN IF NOT EXISTS nova_poshta_contact_ref VARCHAR(255),
ADD COLUMN IF NOT EXISTS nova_poshta_address_ref VARCHAR(255),
ADD COLUMN IF NOT EXISTS enable_third_party_shipping BOOLEAN DEFAULT false;

-- Create Nova Poshta cities table
CREATE TABLE IF NOT EXISTS nova_poshta_cities (
    id SERIAL PRIMARY KEY,
    ref VARCHAR UNIQUE NOT NULL, -- UUID від Нової Пошти
    name VARCHAR NOT NULL,
    area VARCHAR NOT NULL,
    region VARCHAR,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create Nova Poshta warehouses table
CREATE TABLE IF NOT EXISTS nova_poshta_warehouses (
    id SERIAL PRIMARY KEY,
    ref VARCHAR UNIQUE NOT NULL, -- UUID від Нової Пошти
    city_ref VARCHAR NOT NULL REFERENCES nova_poshta_cities(ref),
    description TEXT NOT NULL,
    description_ru TEXT,
    short_address VARCHAR,
    phone VARCHAR,
    schedule TEXT,
    number VARCHAR,
    place_max_weight_allowed INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create client Nova Poshta settings table
CREATE TABLE IF NOT EXISTS client_nova_poshta_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- API налаштування
    api_key VARCHAR(255) NOT NULL,
    
    -- Налаштування відправника
    sender_ref VARCHAR(255), -- Референс відправника в НП
    sender_address VARCHAR(255), -- Адреса відправника
    sender_city_ref VARCHAR(255), -- Референс міста відправника
    sender_phone VARCHAR(50),
    sender_contact VARCHAR(255),
    
    -- Налаштування за замовчуванням
    default_service_type VARCHAR(100) DEFAULT 'WarehouseWarehouse', -- WarehouseWarehouse, WarehouseDoors, DoorsWarehouse, DoorsDoors
    default_cargo_type VARCHAR(100) DEFAULT 'Parcel', -- Parcel, Cargo
    default_payment_method VARCHAR(100) DEFAULT 'Cash', -- Cash, NonCash
    default_payer VARCHAR(100) DEFAULT 'Sender', -- Sender, Recipient, ThirdPerson
    
    -- Додаткові налаштування
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- основні налаштування для клієнта
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_ref ON nova_poshta_cities(ref);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_name ON nova_poshta_cities(name);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_area ON nova_poshta_cities(area);

CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_ref ON nova_poshta_warehouses(ref);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_city_ref ON nova_poshta_warehouses(city_ref);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_number ON nova_poshta_warehouses(number);

CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_settings_client_id ON client_nova_poshta_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_settings_active ON client_nova_poshta_settings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_settings_primary ON client_nova_poshta_settings(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_clients_nova_poshta_api_key ON clients(nova_poshta_api_key) WHERE nova_poshta_api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_third_party_shipping ON clients(enable_third_party_shipping) WHERE enable_third_party_shipping = true;

-- Add comments for documentation
COMMENT ON TABLE nova_poshta_cities IS 'Міста Нової Пошти';
COMMENT ON TABLE nova_poshta_warehouses IS 'Відділення Нової Пошти';
COMMENT ON TABLE client_nova_poshta_settings IS 'Налаштування Нової Пошти для клієнтів';

COMMENT ON COLUMN clients.nova_poshta_api_key IS 'API ключ Нової Пошти клієнта';
COMMENT ON COLUMN clients.nova_poshta_sender_ref IS 'Референс відправника Нової Пошти';
COMMENT ON COLUMN clients.nova_poshta_contact_ref IS 'Референс контакту Нової Пошти';
COMMENT ON COLUMN clients.nova_poshta_address_ref IS 'Референс адреси Нової Пошти';
COMMENT ON COLUMN clients.enable_third_party_shipping IS 'Дозволити доставку третьою стороною';

COMMENT ON COLUMN nova_poshta_cities.ref IS 'UUID міста від Нової Пошти';
COMMENT ON COLUMN nova_poshta_warehouses.ref IS 'UUID відділення від Нової Пошти';
COMMENT ON COLUMN nova_poshta_warehouses.city_ref IS 'Референс міста';

COMMIT;