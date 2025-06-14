-- Fix PostgreSQL server encoding for production UTF-8 support
-- This script addresses the SQL_ASCII server_encoding issue

-- Update database encoding settings (requires superuser privileges)
-- Note: Some operations may require database restart

-- Set session encoding to UTF8
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- Update locale settings for text operations
-- These may require restart to take full effect
ALTER DATABASE postgres SET lc_ctype = 'en_US.UTF-8';
ALTER DATABASE postgres SET lc_collate = 'en_US.UTF-8';
ALTER DATABASE postgres SET default_text_search_config = 'pg_catalog.english';

-- Create a function to check encoding status
CREATE OR REPLACE FUNCTION check_encoding_status()
RETURNS TABLE(
    setting_name text,
    current_value text,
    description text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'server_encoding'::text as setting_name,
        current_setting('server_encoding') as current_value,
        'Server character encoding'::text as description
    UNION ALL
    SELECT 
        'client_encoding'::text,
        current_setting('client_encoding'),
        'Client character encoding'::text
    UNION ALL
    SELECT 
        'lc_ctype'::text,
        current_setting('lc_ctype'),
        'Character classification locale'::text
    UNION ALL
    SELECT 
        'lc_collate'::text,
        current_setting('lc_collate'),
        'String sort order locale'::text;
END;
$$ LANGUAGE plpgsql;

-- Check current encoding status
SELECT * FROM check_encoding_status();

-- Force UTF-8 for current session
SET lc_ctype = 'en_US.UTF-8';
SET lc_collate = 'en_US.UTF-8';

-- Update Nova Poshta tables to ensure UTF-8 compatibility
-- Recreate indexes with proper collation if needed
DROP INDEX IF EXISTS idx_nova_poshta_cities_description;
CREATE INDEX idx_nova_poshta_cities_description 
ON nova_poshta_cities(description COLLATE "en_US.UTF-8");

DROP INDEX IF EXISTS idx_nova_poshta_warehouses_description;
CREATE INDEX idx_nova_poshta_warehouses_description 
ON nova_poshta_warehouses(description COLLATE "en_US.UTF-8");

-- Test Ukrainian text search after changes
SELECT 
    'UTF-8 Test Results' as test_type,
    COUNT(*) as total_cities,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE description ILIKE '%че%') as che_search,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE description ILIKE '%Чернігів%') as chernihiv_search;