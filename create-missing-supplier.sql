-- Create missing supplier with ID 512 for production
-- This fixes the foreign key constraint violation

INSERT INTO suppliers (id, name, contact_person, client_type_id, is_active, created_at, updated_at)
VALUES (
  512,
  'Постачальник #512 (Автоматично створений)',
  'Невідомий контакт',
  1,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Set the sequence to avoid conflicts
SELECT setval('suppliers_id_seq', (SELECT GREATEST(MAX(id), 512) FROM suppliers));

-- Verify the supplier was created
SELECT id, name, is_active FROM suppliers WHERE id = 512;