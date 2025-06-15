-- Міграція для переміщення налаштувань Нової Пошти з таблиці clients в окрему таблицю
-- Migration 0031: Move Nova Poshta settings from clients table to separate table

-- Спочатку створюємо тимчасову резервну копію існуючих даних
CREATE TEMP TABLE temp_client_nova_poshta AS
SELECT 
    id as client_id,
    nova_poshta_api_key,
    nova_poshta_sender_ref,
    nova_poshta_contact_ref,
    nova_poshta_address_ref,
    enable_third_party_shipping
FROM clients 
WHERE nova_poshta_api_key IS NOT NULL AND nova_poshta_api_key != '';

-- Переносимо дані в нову таблицю client_nova_poshta_settings
INSERT INTO client_nova_poshta_settings (
    client_id,
    api_key,
    sender_ref,
    sender_contact,
    sender_address,
    is_active,
    is_primary,
    description,
    created_at,
    updated_at
)
SELECT 
    client_id,
    nova_poshta_api_key as api_key,
    nova_poshta_sender_ref as sender_ref,
    nova_poshta_contact_ref as sender_contact,
    nova_poshta_address_ref as sender_address,
    COALESCE(enable_third_party_shipping, false) as is_active,
    true as is_primary, -- встановлюємо як основні налаштування
    'Мігровано з таблиці clients' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM temp_client_nova_poshta
WHERE nova_poshta_api_key IS NOT NULL AND nova_poshta_api_key != '';

-- Видаляємо поля Нової Пошти з таблиці clients
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_api_key;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_sender_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_contact_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS nova_poshta_address_ref;
ALTER TABLE clients DROP COLUMN IF EXISTS enable_third_party_shipping;

-- Додаємо коментарі для документації
COMMENT ON TABLE client_nova_poshta_settings IS 'Налаштування API Нової Пошти для клієнтів (винесено з таблиці clients)';
COMMENT ON COLUMN client_nova_poshta_settings.client_id IS 'Зв''язок з таблицею clients';
COMMENT ON COLUMN client_nova_poshta_settings.api_key IS 'API ключ Нової Пошти клієнта';
COMMENT ON COLUMN client_nova_poshta_settings.sender_ref IS 'Референс відправника в системі Нової Пошти';
COMMENT ON COLUMN client_nova_poshta_settings.is_primary IS 'Основні налаштування для клієнта (може бути декілька наборів)';

-- Виводимо статистику міграції
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count FROM client_nova_poshta_settings;
    RAISE NOTICE 'Мігровано налаштувань Нової Пошти: %', migrated_count;
END $$;