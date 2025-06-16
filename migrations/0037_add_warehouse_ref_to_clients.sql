BEGIN;

-- Add warehouse reference field to clients table
ALTER TABLE clients ADD COLUMN warehouse_ref VARCHAR(255);

-- Add index for better performance on warehouse lookups
CREATE INDEX IF NOT EXISTS idx_clients_warehouse_ref ON clients(warehouse_ref);

-- Add comment for documentation
COMMENT ON COLUMN clients.warehouse_ref IS 'Reference to Nova Poshta warehouse';

COMMIT;