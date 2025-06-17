-- Migration 0038: Add client types table and update clients/suppliers
-- Date: 2025-06-16
-- Description: Create client_types table and replace type field with clientTypeId

BEGIN;

-- Create client_types table
CREATE TABLE IF NOT EXISTS client_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default client types
INSERT INTO client_types (name, description) VALUES 
  ('Юридична особа', 'Організація, підприємство'),
  ('Фізична особа', 'Приватна особа, індивідуальний підприємець'),
  ('Відокремлений підрозділ', 'Філія, представництво, відокремлений підрозділ')
ON CONFLICT (name) DO NOTHING;

-- Add clientTypeId column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS client_type_id INTEGER REFERENCES client_types(id);

-- Set default client type based on existing type field
UPDATE clients 
SET client_type_id = (
  CASE 
    WHEN type = 'organization' THEN (SELECT id FROM client_types WHERE name = 'Юридична особа')
    WHEN type = 'individual' THEN (SELECT id FROM client_types WHERE name = 'Фізична особа')
    ELSE (SELECT id FROM client_types WHERE name = 'Фізична особа')
  END
)
WHERE client_type_id IS NULL;

-- Make client_type_id NOT NULL after setting values
ALTER TABLE clients 
ALTER COLUMN client_type_id SET NOT NULL;

-- Drop old type column
ALTER TABLE clients 
DROP COLUMN IF EXISTS type;

-- Add clientTypeId column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS client_type_id INTEGER REFERENCES client_types(id);

-- Set default client type for suppliers (assuming organization)
UPDATE suppliers 
SET client_type_id = (SELECT id FROM client_types WHERE name = 'Юридична особа')
WHERE client_type_id IS NULL;

-- Make client_type_id NOT NULL for suppliers
ALTER TABLE suppliers 
ALTER COLUMN client_type_id SET NOT NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_client_type_id ON clients(client_type_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_client_type_id ON suppliers(client_type_id);

-- Add comments for documentation
COMMENT ON TABLE client_types IS 'Dictionary of client and supplier types';
COMMENT ON COLUMN clients.client_type_id IS 'Reference to client type';
COMMENT ON COLUMN suppliers.client_type_id IS 'Reference to supplier type';

COMMIT;