-- Migration 0039: Enforce tax_code to be exactly 10 digits
-- Date: 2025-06-16
-- Description: Update clients table tax_code column to enforce exactly 10 digits (ІПН only)

BEGIN;

-- Update existing tax codes that are not 10 digits
-- For demonstration, we'll pad shorter codes with zeros or truncate longer ones
-- In production, you may want to handle this data migration differently
UPDATE clients 
SET tax_code = LPAD(REGEXP_REPLACE(tax_code, '[^0-9]', '', 'g'), 10, '0')
WHERE LENGTH(REGEXP_REPLACE(tax_code, '[^0-9]', '', 'g')) < 10 
   OR LENGTH(REGEXP_REPLACE(tax_code, '[^0-9]', '', 'g')) > 10;

-- Add constraint to ensure tax_code is exactly 10 digits
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_tax_code_length_check;

ALTER TABLE clients 
ADD CONSTRAINT clients_tax_code_length_check 
CHECK (LENGTH(tax_code) = 10 AND tax_code ~ '^[0-9]{10}$');

-- Update column comment
COMMENT ON COLUMN clients.tax_code IS 'ІПН (Individual Tax Number) - exactly 10 digits';

COMMIT;