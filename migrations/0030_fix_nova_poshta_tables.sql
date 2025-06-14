-- Migration: Fix Nova Poshta Tables Structure
-- Version: 14.06.2025 08:20:00
-- Description: Fix Nova Poshta cities and warehouses tables to match actual code structure

BEGIN;

-- Drop existing tables if they exist (they have incorrect structure)
DROP TABLE IF EXISTS nova_poshta_warehouses CASCADE;
DROP TABLE IF EXISTS nova_poshta_cities CASCADE;

-- Create nova_poshta_cities table with correct structure
CREATE TABLE nova_poshta_cities (
    id SERIAL PRIMARY KEY,
    ref VARCHAR UNIQUE NOT NULL, -- UUID від Нової Пошти
    name VARCHAR NOT NULL, -- Description
    name_ru VARCHAR, -- DescriptionRu
    area VARCHAR NOT NULL, -- AreaDescription
    area_ru VARCHAR, -- AreaDescriptionRu
    region VARCHAR, -- RegionDescription
    region_ru VARCHAR, -- RegionDescriptionRu
    settlement_type VARCHAR, -- SettlementTypeDescription
    delivery_city VARCHAR, -- DeliveryCity
    warehouses INTEGER DEFAULT 0, -- Warehouses count
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create nova_poshta_warehouses table with correct structure
CREATE TABLE nova_poshta_warehouses (
    id SERIAL PRIMARY KEY,
    ref VARCHAR UNIQUE NOT NULL, -- UUID від Нової Пошти
    city_ref VARCHAR NOT NULL REFERENCES nova_poshta_cities(ref) ON DELETE CASCADE,
    number VARCHAR, -- Number
    description TEXT NOT NULL, -- Description
    description_ru TEXT, -- DescriptionRu
    short_address VARCHAR, -- ShortAddress
    short_address_ru VARCHAR, -- ShortAddressRu
    phone VARCHAR, -- Phone
    type_of_warehouse VARCHAR, -- TypeOfWarehouse
    category_of_warehouse VARCHAR, -- CategoryOfWarehouse
    schedule JSONB, -- Schedule (JSON)
    reception JSONB, -- Reception (JSON)
    delivery JSONB, -- Delivery (JSON)
    district_code VARCHAR, -- DistrictCode
    ward_code VARCHAR, -- WardCode
    settlement_area_description VARCHAR, -- SettlementAreaDescription
    place_max_weight_allowed INTEGER, -- PlaceMaxWeightAllowed
    sending_limitations_on_dimensions JSONB, -- SendingLimitationsOnDimensions (JSON)
    receiving_limitations_on_dimensions JSONB, -- ReceivingLimitationsOnDimensions (JSON)
    post_finance BOOLEAN DEFAULT false, -- PostFinance
    bicycle_parking BOOLEAN DEFAULT false, -- BicycleParking
    payment_access BOOLEAN DEFAULT false, -- PaymentAccess
    pos_terminal BOOLEAN DEFAULT false, -- POSTerminal
    international_shipping BOOLEAN DEFAULT false, -- InternationalShipping
    self_service_workplaces_count INTEGER DEFAULT 0, -- SelfServiceWorkplacesCount
    total_max_weight_allowed INTEGER, -- TotalMaxWeightAllowed
    longitude DECIMAL(10,7), -- Longitude
    latitude DECIMAL(10,7), -- Latitude
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_nova_poshta_cities_ref ON nova_poshta_cities(ref);
CREATE INDEX idx_nova_poshta_cities_name ON nova_poshta_cities(name);
CREATE INDEX idx_nova_poshta_cities_area ON nova_poshta_cities(area);
CREATE INDEX idx_nova_poshta_cities_active ON nova_poshta_cities(is_active);

CREATE INDEX idx_nova_poshta_warehouses_ref ON nova_poshta_warehouses(ref);
CREATE INDEX idx_nova_poshta_warehouses_city_ref ON nova_poshta_warehouses(city_ref);
CREATE INDEX idx_nova_poshta_warehouses_number ON nova_poshta_warehouses(number);
CREATE INDEX idx_nova_poshta_warehouses_active ON nova_poshta_warehouses(is_active);

-- Add comments for documentation
COMMENT ON TABLE nova_poshta_cities IS 'Міста Нової Пошти з повною структурою полів';
COMMENT ON TABLE nova_poshta_warehouses IS 'Відділення Нової Пошти з повною структурою полів';

COMMENT ON COLUMN nova_poshta_cities.ref IS 'UUID міста від Нової Пошти';
COMMENT ON COLUMN nova_poshta_cities.name IS 'Назва міста українською';
COMMENT ON COLUMN nova_poshta_cities.name_ru IS 'Назва міста російською';
COMMENT ON COLUMN nova_poshta_cities.area IS 'Область українською';
COMMENT ON COLUMN nova_poshta_cities.area_ru IS 'Область російською';
COMMENT ON COLUMN nova_poshta_cities.region IS 'Регіон українською';
COMMENT ON COLUMN nova_poshta_cities.region_ru IS 'Регіон російською';
COMMENT ON COLUMN nova_poshta_cities.settlement_type IS 'Тип населеного пункту';
COMMENT ON COLUMN nova_poshta_cities.delivery_city IS 'Місто доставки';
COMMENT ON COLUMN nova_poshta_cities.warehouses IS 'Кількість відділень у місті';

COMMENT ON COLUMN nova_poshta_warehouses.ref IS 'UUID відділення від Нової Пошти';
COMMENT ON COLUMN nova_poshta_warehouses.city_ref IS 'Референс міста';
COMMENT ON COLUMN nova_poshta_warehouses.number IS 'Номер відділення';
COMMENT ON COLUMN nova_poshta_warehouses.description IS 'Опис відділення українською';
COMMENT ON COLUMN nova_poshta_warehouses.description_ru IS 'Опис відділення російською';
COMMENT ON COLUMN nova_poshta_warehouses.short_address IS 'Коротка адреса українською';
COMMENT ON COLUMN nova_poshta_warehouses.short_address_ru IS 'Коротка адреса російською';
COMMENT ON COLUMN nova_poshta_warehouses.schedule IS 'Розклад роботи (JSON)';
COMMENT ON COLUMN nova_poshta_warehouses.reception IS 'Прийом відправлень (JSON)';
COMMENT ON COLUMN nova_poshta_warehouses.delivery IS 'Видача відправлень (JSON)';
COMMENT ON COLUMN nova_poshta_warehouses.sending_limitations_on_dimensions IS 'Обмеження на відправку (JSON)';
COMMENT ON COLUMN nova_poshta_warehouses.receiving_limitations_on_dimensions IS 'Обмеження на отримання (JSON)';

COMMIT;