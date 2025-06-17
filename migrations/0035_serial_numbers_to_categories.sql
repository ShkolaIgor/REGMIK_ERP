-- Migration 0035: Move serial number settings from products to categories
-- Ukrainian ERP System - Serial Number Management Restructure
-- Generated: 2025-06-15

-- Set UTF-8 encoding
SET client_encoding = 'UTF8';

-- Begin transaction for safety
BEGIN;

-- Step 1: Remove hasSerialNumbers field from products table
ALTER TABLE products 
DROP COLUMN IF EXISTS has_serial_numbers;

-- Step 2: Add hasSerialNumbers field to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS has_serial_numbers boolean DEFAULT false;

-- Step 3: Update categories table with additional serial number settings
-- (These fields already exist but ensuring they're present)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS serial_number_template text,
ADD COLUMN IF NOT EXISTS serial_number_prefix text,
ADD COLUMN IF NOT EXISTS serial_number_start_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS use_serial_numbers boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS use_global_numbering boolean DEFAULT true;

-- Step 4: Update existing data - migrate serial number settings from products to categories
-- First, identify categories that should have serial numbers based on their products
UPDATE categories 
SET has_serial_numbers = true,
    use_serial_numbers = true
WHERE id IN (
    SELECT DISTINCT p.category_id 
    FROM products p 
    WHERE p.category_id IS NOT NULL
);

-- Step 5: Update serial_numbers table to reference category instead of individual product
-- Add categoryId column to serial_numbers table
ALTER TABLE serial_numbers 
ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(id);

-- Step 6: Populate category_id in serial_numbers based on product's category
UPDATE serial_numbers 
SET category_id = (
    SELECT p.category_id 
    FROM products p 
    WHERE p.id = serial_numbers.product_id
)
WHERE category_id IS NULL AND product_id IS NOT NULL;

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_has_serial_numbers 
ON categories(has_serial_numbers) WHERE has_serial_numbers = true;

CREATE INDEX IF NOT EXISTS idx_serial_numbers_category_id 
ON serial_numbers(category_id);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_category_status 
ON serial_numbers(category_id, status);

-- Step 8: Add constraints for data integrity
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'chk_categories_serial_settings_consistency'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT chk_categories_serial_settings_consistency 
        CHECK (
            (has_serial_numbers = false) OR 
            (has_serial_numbers = true AND use_serial_numbers = true)
        );
    END IF;
END $$;

-- Step 9: Update comments for documentation
COMMENT ON COLUMN categories.has_serial_numbers IS 'Чи використовує ця категорія серійні номери';
COMMENT ON COLUMN categories.use_serial_numbers IS 'Активні налаштування серійних номерів для категорії';
COMMENT ON COLUMN categories.serial_number_template IS 'Шаблон серійного номера для категорії';
COMMENT ON COLUMN categories.serial_number_prefix IS 'Префікс серійних номерів для категорії';
COMMENT ON COLUMN serial_numbers.category_id IS 'Посилання на категорію товару';

-- Step 10: Create view for backward compatibility
CREATE OR REPLACE VIEW products_with_serial_numbers AS
SELECT 
    p.*,
    COALESCE(c.has_serial_numbers, false) as has_serial_numbers,
    c.serial_number_template,
    c.serial_number_prefix,
    c.use_global_numbering
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Step 11: Update function to check if product has serial numbers
CREATE OR REPLACE FUNCTION product_has_serial_numbers(product_id integer)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    has_serials boolean := false;
BEGIN
    SELECT COALESCE(c.has_serial_numbers, false)
    INTO has_serials
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = product_id;
    
    RETURN COALESCE(has_serials, false);
END;
$$;

-- Step 12: Create function to get category serial settings
CREATE OR REPLACE FUNCTION get_category_serial_settings(category_id integer)
RETURNS TABLE(
    has_serial_numbers boolean,
    serial_number_template text,
    serial_number_prefix text,
    serial_number_start_number integer,
    use_global_numbering boolean
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.has_serial_numbers,
        c.serial_number_template,
        c.serial_number_prefix,
        c.serial_number_start_number,
        c.use_global_numbering
    FROM categories c
    WHERE c.id = category_id;
END;
$$;

-- Commit transaction
COMMIT;

-- Verification queries
SELECT 'Migration completed successfully' as status;

-- Show categories with serial number settings
SELECT 
    id,
    name,
    has_serial_numbers,
    use_serial_numbers,
    serial_number_prefix,
    serial_number_template
FROM categories 
WHERE has_serial_numbers = true 
ORDER BY name;

-- Show count of serial numbers by category
SELECT 
    c.name as category_name,
    COUNT(sn.id) as serial_numbers_count
FROM categories c
LEFT JOIN serial_numbers sn ON c.id = sn.category_id
WHERE c.has_serial_numbers = true
GROUP BY c.id, c.name
ORDER BY c.name;