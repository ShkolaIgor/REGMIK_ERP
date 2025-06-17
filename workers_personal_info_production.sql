-- Production SQL for Workers Personal Information Enhancement
-- Ukrainian ERP System - Workers Table Enhancement
-- Generated: 2025-06-15
-- Adds: birth_date, address, contact_phone, termination_date fields

-- Set UTF-8 encoding
SET client_encoding = 'UTF8';

-- Begin transaction for safety
BEGIN;

-- Add new personal information fields to workers table
ALTER TABLE workers 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS contact_phone varchar(50),
ADD COLUMN IF NOT EXISTS termination_date date;

-- Add comments for documentation
COMMENT ON COLUMN workers.birth_date IS 'Дата народження робітника';
COMMENT ON COLUMN workers.address IS 'Адреса проживання робітника';
COMMENT ON COLUMN workers.contact_phone IS 'Контактний телефон (альтернативний)';
COMMENT ON COLUMN workers.termination_date IS 'Дата звільнення робітника';

-- Create indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_workers_birth_date ON workers(birth_date);
CREATE INDEX IF NOT EXISTS idx_workers_termination_date ON workers(termination_date);
CREATE INDEX IF NOT EXISTS idx_workers_contact_phone ON workers(contact_phone);

-- Add check constraints for data integrity
ALTER TABLE workers 
ADD CONSTRAINT IF NOT EXISTS chk_workers_birth_date_valid 
CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE);

ALTER TABLE workers 
ADD CONSTRAINT IF NOT EXISTS chk_workers_termination_after_hire 
CHECK (termination_date IS NULL OR hire_date IS NULL OR termination_date >= hire_date);

-- Update workers table comment
COMMENT ON TABLE workers IS 'Таблиця робітників з розширеною особистою інформацією';

-- Commit transaction
COMMIT;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'workers' 
    AND column_name IN ('birth_date', 'address', 'contact_phone', 'termination_date')
ORDER BY ordinal_position;

-- Show table structure for verification
\d+ workers;

-- Success message
SELECT 'Workers table successfully enhanced with personal information fields' as status;