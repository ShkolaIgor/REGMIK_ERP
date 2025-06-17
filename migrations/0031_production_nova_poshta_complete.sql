-- Production Migration: Complete Nova Poshta API Settings Implementation
-- Date: 2025-06-15
-- Description: Creates client_nova_poshta_api_settings table and fixes existing schema issues

BEGIN;

-- 1. Create the new Nova Poshta API settings table
CREATE TABLE IF NOT EXISTS client_nova_poshta_api_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    sender_phone TEXT,
    sender_contact_person TEXT,
    sender_address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_api_settings_client_id 
ON client_nova_poshta_api_settings(client_id);

-- 3. Create unique constraint for primary settings (only one primary per client)
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_nova_poshta_api_settings_primary 
ON client_nova_poshta_api_settings(client_id) WHERE is_primary = true;

-- 4. Fix existing client_nova_poshta_settings table schema issues
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check and add recipient_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'recipient_name') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN recipient_name VARCHAR(255);
    END IF;

    -- Check and add recipient_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'recipient_phone') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN recipient_phone VARCHAR(50);
    END IF;

    -- Check and add recipient_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'recipient_email') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN recipient_email VARCHAR(255);
    END IF;

    -- Check and add delivery_city_ref column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'delivery_city_ref') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN delivery_city_ref VARCHAR(255);
    END IF;

    -- Check and add delivery_city_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'delivery_city_name') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN delivery_city_name VARCHAR(255);
    END IF;

    -- Check and add delivery_warehouse_ref column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'delivery_warehouse_ref') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN delivery_warehouse_ref VARCHAR(255);
    END IF;

    -- Check and add delivery_warehouse_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'delivery_warehouse_address') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN delivery_warehouse_address TEXT;
    END IF;

    -- Check and add service_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'service_type') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN service_type VARCHAR(100) DEFAULT 'WarehouseWarehouse';
    END IF;

    -- Check and add cargo_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'cargo_type') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN cargo_type VARCHAR(100) DEFAULT 'Parcel';
    END IF;

    -- Check and add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'payment_method') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN payment_method VARCHAR(100) DEFAULT 'Cash';
    END IF;

    -- Check and add payer column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'payer') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN payer VARCHAR(100) DEFAULT 'Sender';
    END IF;

    -- Check and add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'description') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN description TEXT;
    END IF;

    -- Check and add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Check and add is_primary column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'is_primary') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
    END IF;

    -- Check and add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'client_nova_poshta_settings' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE client_nova_poshta_settings 
        ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;

END $$;

-- 5. Create indexes for client_nova_poshta_settings if they don't exist
CREATE INDEX IF NOT EXISTS idx_client_nova_poshta_settings_client_id 
ON client_nova_poshta_settings(client_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_nova_poshta_settings_primary 
ON client_nova_poshta_settings(client_id) WHERE is_primary = true;

-- 6. Update existing data in client_nova_poshta_settings
-- Set default values for new columns where they're NULL
UPDATE client_nova_poshta_settings 
SET 
    service_type = COALESCE(service_type, 'WarehouseWarehouse'),
    cargo_type = COALESCE(cargo_type, 'Parcel'),
    payment_method = COALESCE(payment_method, 'Cash'),
    payer = COALESCE(payer, 'Sender'),
    is_active = COALESCE(is_active, TRUE),
    is_primary = COALESCE(is_primary, FALSE),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE 
    service_type IS NULL 
    OR cargo_type IS NULL 
    OR payment_method IS NULL 
    OR payer IS NULL 
    OR is_active IS NULL 
    OR is_primary IS NULL 
    OR created_at IS NULL 
    OR updated_at IS NULL;

-- 7. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to client_nova_poshta_api_settings
DROP TRIGGER IF EXISTS update_client_nova_poshta_api_settings_updated_at ON client_nova_poshta_api_settings;
CREATE TRIGGER update_client_nova_poshta_api_settings_updated_at
    BEFORE UPDATE ON client_nova_poshta_api_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to client_nova_poshta_settings
DROP TRIGGER IF EXISTS update_client_nova_poshta_settings_updated_at ON client_nova_poshta_settings;
CREATE TRIGGER update_client_nova_poshta_settings_updated_at
    BEFORE UPDATE ON client_nova_poshta_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add comments for documentation
COMMENT ON TABLE client_nova_poshta_api_settings IS 'Nova Poshta API credentials and sender settings for clients - enables shipping on behalf of clients';
COMMENT ON COLUMN client_nova_poshta_api_settings.api_key IS 'Client Nova Poshta API key for shipping operations';
COMMENT ON COLUMN client_nova_poshta_api_settings.is_primary IS 'Indicates if this is the primary API configuration for the client';
COMMENT ON COLUMN client_nova_poshta_api_settings.sender_phone IS 'Sender phone number for Nova Poshta shipments';
COMMENT ON COLUMN client_nova_poshta_api_settings.sender_contact_person IS 'Sender contact person name';
COMMENT ON COLUMN client_nova_poshta_api_settings.sender_address IS 'Sender address for Nova Poshta shipments';

COMMENT ON TABLE client_nova_poshta_settings IS 'Nova Poshta delivery preferences and recipient settings for clients';
COMMENT ON COLUMN client_nova_poshta_settings.recipient_name IS 'Default recipient name for deliveries';
COMMENT ON COLUMN client_nova_poshta_settings.delivery_city_ref IS 'Nova Poshta city reference for delivery';
COMMENT ON COLUMN client_nova_poshta_settings.delivery_warehouse_ref IS 'Nova Poshta warehouse reference for delivery';

-- 9. Grant necessary permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON client_nova_poshta_api_settings TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE client_nova_poshta_api_settings_id_seq TO your_app_user;

COMMIT;

-- Migration completed successfully
-- Log the migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 0031_production_nova_poshta_complete.sql completed successfully at %', NOW();
END $$;