-- Production-compatible UTF-8 fix for SQL_ASCII server
-- Works within existing server constraints

-- Set session encoding
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

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

-- Recreate indexes for Nova Poshta tables with correct column names
-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_nova_poshta_cities_name;
DROP INDEX IF EXISTS idx_nova_poshta_warehouses_description;

-- Create new indexes on correct columns
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_name 
ON nova_poshta_cities(name);

CREATE INDEX IF NOT EXISTS idx_nova_poshta_warehouses_description 
ON nova_poshta_warehouses(description);

-- Test Ukrainian text search with correct column names
SELECT 
    'UTF-8 Search Test' as test_type,
    COUNT(*) as total_cities,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE name ILIKE '%че%') as che_search_cities,
    (SELECT COUNT(*) FROM nova_poshta_warehouses WHERE description ILIKE '%че%') as che_search_warehouses;

-- Additional search tests
SELECT 
    'Detailed Search Results' as test_name,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE name ILIKE '%Чернігів%') as chernihiv_cities,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE name ILIKE '%Київ%') as kyiv_cities,
    (SELECT COUNT(*) FROM nova_poshta_cities WHERE name ILIKE '%Харків%') as kharkiv_cities;