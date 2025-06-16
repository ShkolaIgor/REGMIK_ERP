-- Migration 0036: Add carrier_id field to clients table
-- Date: 2025-06-16
-- Description: Add carrier relationship to clients table for XML import functionality

BEGIN;

-- Add carrier_id column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS carrier_id INTEGER REFERENCES carriers(id);

-- Add index for better performance on carrier lookups
CREATE INDEX IF NOT EXISTS idx_clients_carrier_id ON clients(carrier_id);

-- Add comment for documentation
COMMENT ON COLUMN clients.carrier_id IS 'Carrier relationship for client';

COMMIT;