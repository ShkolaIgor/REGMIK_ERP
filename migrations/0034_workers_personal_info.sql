-- Migration 0034: Add personal information fields to workers table
-- Adds birth date, address, contact phone, and termination date

ALTER TABLE workers 
ADD COLUMN birth_date TIMESTAMP,
ADD COLUMN address TEXT,
ADD COLUMN contact_phone VARCHAR(20),
ADD COLUMN termination_date TIMESTAMP;

-- Add comments for the new columns
COMMENT ON COLUMN workers.birth_date IS 'Дата народження робітника';
COMMENT ON COLUMN workers.address IS 'Адреса проживання робітника';
COMMENT ON COLUMN workers.contact_phone IS 'Контактний телефон робітника';
COMMENT ON COLUMN workers.termination_date IS 'Дата звільнення робітника';