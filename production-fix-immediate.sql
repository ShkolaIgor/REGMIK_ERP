-- IMMEDIATE PRODUCTION FIX for supplier_receipts table
-- This script must be run in production to resolve the missing table error

-- First create supplier_document_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS supplier_document_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Insert default document types
INSERT INTO supplier_document_types (name, description) 
SELECT * FROM (VALUES 
  ('Накладна', 'Товарна накладна від постачальника'),
  ('Рахунок-фактура', 'Рахунок-фактура на товари'),
  ('Акт приймання', 'Акт приймання товарів')
) AS t(name, description)
WHERE NOT EXISTS (SELECT 1 FROM supplier_document_types);

-- Create supplier_receipts table with exact structure
CREATE TABLE IF NOT EXISTS supplier_receipts (
  id SERIAL PRIMARY KEY,
  receipt_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  supplier_id INTEGER NOT NULL,
  document_type_id INTEGER NOT NULL,
  supplier_document_date TIMESTAMP WITHOUT TIME ZONE,
  supplier_document_number VARCHAR(100),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  purchase_order_id INTEGER
);

-- Create supplier_receipt_items table
CREATE TABLE IF NOT EXISTS supplier_receipt_items (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER NOT NULL,
  component_id INTEGER NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_component_name VARCHAR(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints safely
DO $$
BEGIN
  -- Add supplier_receipts foreign keys
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipts_supplier_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
      ALTER TABLE supplier_receipts ADD CONSTRAINT supplier_receipts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
    END IF;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supplier_receipts_document_type_id_fkey') THEN
    ALTER TABLE supplier_receipts ADD CONSTRAINT supplier_receipts_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES supplier_document_types(id);
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_supplier_id ON supplier_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_receipt_date ON supplier_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_supplier_receipt_items_receipt_id ON supplier_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_supplier_receipt_items_component_id ON supplier_receipt_items(component_id);

-- Verify all tables were created successfully
SELECT 
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_name IN ('supplier_document_types', 'supplier_receipts', 'supplier_receipt_items')
  AND table_schema = 'public'
ORDER BY table_name;