-- Migration 0036: XML Import Enhancements
-- This migration includes all database changes made after migration 0035
-- for XML import functionality improvements

-- Allow NULL values for tax_code to enable duplicate clients with empty tax codes
-- while maintaining unique constraint for non-empty values
ALTER TABLE clients 
ALTER COLUMN tax_code DROP NOT NULL;

-- Add unique constraint for external_id to prevent duplicate imports
-- Skip if constraint already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clients_external_id_unique'
    ) THEN
        ALTER TABLE clients 
        ADD CONSTRAINT clients_external_id_unique 
        UNIQUE (external_id);
    END IF;
END $$;

-- Add index on external_id for faster lookups during XML import
CREATE INDEX IF NOT EXISTS idx_clients_external_id ON clients(external_id);

-- Add index on tax_code for faster duplicate checking (only for non-NULL values)
CREATE INDEX IF NOT EXISTS idx_clients_tax_code ON clients(tax_code) WHERE tax_code IS NOT NULL;

-- Note: city_ref and warehouse_ref columns will be added in future migrations when needed

-- Add index on source field for filtering imported clients
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);

-- Ensure Nova Poshta cities table has proper indexes for XML import lookups
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_name ON nova_poshta_cities(name);

-- Ensure Nova Poshta warehouses table has proper indexes for city-specific lookups
CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_city_ref ON nova_poshta_warehouses(city_ref);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_description ON nova_poshta_warehouses(description);

-- Update any existing NULL external_id values to ensure data consistency
-- This is a safety measure for existing data
UPDATE clients 
SET external_id = NULL 
WHERE external_id = '' OR external_id = '0';

-- Add comment to document the changes
COMMENT ON COLUMN clients.tax_code IS 'Tax code (ЄДРПОУ/ІПН). NULL allowed for duplicate clients with empty tax codes from XML import';
COMMENT ON COLUMN clients.external_id IS 'External system ID for XML import. Must be unique to prevent duplicate imports';