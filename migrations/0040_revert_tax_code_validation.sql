-- Migration 0040: Revert tax_code validation to support optional 8/10 digits
-- Date: 2025-06-16
-- Description: Make tax_code optional and support both 8 digits (ЄДРПОУ) and 10 digits (ІПН)

BEGIN;

-- Remove the strict 10-digit constraint
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_tax_code_length_check;

-- Add flexible constraint for 8 or 10 digits or empty
ALTER TABLE clients 
ADD CONSTRAINT clients_tax_code_format_check 
CHECK (
  tax_code IS NULL 
  OR tax_code = '' 
  OR (LENGTH(tax_code) = 8 AND tax_code ~ '^[0-9]{8}$')
  OR (LENGTH(tax_code) = 10 AND tax_code ~ '^[0-9]{10}$')
);

-- Update column comment
COMMENT ON COLUMN clients.tax_code IS 'ЄДРПОУ (8 digits) for legal entities/branches or ІПН (10 digits) for individuals - optional field';

COMMIT;