-- IMMEDIATE PRODUCTION FIX for supplier_receipts table
-- This script must be run in production to resolve the missing table error

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

-- Add foreign key constraints
ALTER TABLE supplier_receipt_items 
ADD CONSTRAINT IF NOT EXISTS supplier_receipt_items_receipt_id_fkey 
FOREIGN KEY (receipt_id) REFERENCES supplier_receipts(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_supplier_id ON supplier_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_receipts_receipt_date ON supplier_receipts(receipt_date);
CREATE INDEX IF NOT EXISTS idx_supplier_receipt_items_receipt_id ON supplier_receipt_items(receipt_id);

-- Test query to verify table creation
SELECT 'supplier_receipts table created successfully' as status;