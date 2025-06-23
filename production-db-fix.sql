-- Production Database Schema Fix
-- Critical fix for supplier_receipts table missing in production
-- Run this script in production to resolve the table creation issue

-- 1. Create supplier_receipts table with exact structure from development
CREATE TABLE IF NOT EXISTS supplier_receipts (
  id SERIAL PRIMARY KEY,
  receipt_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  supplier_id INTEGER NOT NULL,
  document_type_id INTEGER NOT NULL,
  supplier_document_date TIMESTAMP WITHOUT TIME ZONE,
  supplier_document_number VARCHAR(255),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  comment TEXT,
  purchase_order_id INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supplier_receipts' AND column_name = 'purchase_order_id') THEN
    ALTER TABLE supplier_receipts ADD COLUMN purchase_order_id INTEGER;
  END IF;
END $$;

-- 3. Ensure supplier_receipt_items table exists
CREATE TABLE IF NOT EXISTS supplier_receipt_items (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_component_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Add foreign key constraints safely
DO $$
BEGIN
  -- Add supplier_receipts foreign keys
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipts_supplier_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
      ALTER TABLE supplier_receipts ADD CONSTRAINT supplier_receipts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
    END IF;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipts_document_type_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_document_types') THEN
      ALTER TABLE supplier_receipts ADD CONSTRAINT supplier_receipts_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES supplier_document_types(id);
    END IF;
  END IF;
  
  -- Add supplier_receipt_items foreign keys
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipt_items_receipt_id_fkey') THEN
    ALTER TABLE supplier_receipt_items ADD CONSTRAINT supplier_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES supplier_receipts(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipt_items_component_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'components') THEN
      ALTER TABLE supplier_receipt_items ADD CONSTRAINT supplier_receipt_items_component_id_fkey FOREIGN KEY (component_id) REFERENCES components(id);
    END IF;
  END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_supplier_id ON supplier_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_receipt_date ON supplier_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_supplier_receipt_items_receipt_id ON supplier_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_supplier_receipt_items_component_id ON supplier_receipt_items(component_id);

-- 6. Verify tables exist
SELECT 
  t.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
  VALUES 
    ('suppliers'),
    ('supplier_document_types'), 
    ('supplier_receipts'),
    ('supplier_receipt_items'),
    ('components')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = required_tables.table_name 
  AND t.table_schema = 'public'
ORDER BY required_tables.table_name;