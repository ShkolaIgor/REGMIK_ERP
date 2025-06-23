-- Add external_id column to supplier_receipts table in production
-- This script adds the missing external_id field and updates existing records

-- Add external_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'supplier_receipts' 
    AND column_name = 'external_id'
  ) THEN
    ALTER TABLE supplier_receipts 
    ADD COLUMN external_id VARCHAR(255);
    
    -- Create index for better performance
    CREATE INDEX idx_supplier_receipts_external_id 
    ON supplier_receipts(external_id);
    
    RAISE NOTICE 'Added external_id column and index to supplier_receipts';
  ELSE
    RAISE NOTICE 'external_id column already exists in supplier_receipts';
  END IF;
END $$;

-- Update existing records to have external_id equal to their id
UPDATE supplier_receipts 
SET external_id = id::text 
WHERE external_id IS NULL;

-- Verify the changes
SELECT 
  COUNT(*) as total_receipts,
  COUNT(external_id) as receipts_with_external_id,
  MIN(external_id) as min_external_id,
  MAX(external_id) as max_external_id
FROM supplier_receipts;

-- Show sample data
SELECT id, external_id, receipt_date, supplier_id
FROM supplier_receipts 
ORDER BY id 
LIMIT 5;