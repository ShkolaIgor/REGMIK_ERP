#!/bin/bash

# Перевірка поточного кодування бази даних

echo "Перевірка кодування бази даних regmik-erp..."

sudo -u postgres psql -d regmik-erp << 'EOF'
SELECT 
    'Server Encoding' as parameter, 
    setting as value 
FROM pg_settings 
WHERE name = 'server_encoding'
UNION ALL
SELECT 
    'Client Encoding' as parameter, 
    setting as value 
FROM pg_settings 
WHERE name = 'client_encoding'
UNION ALL
SELECT 
    'LC_COLLATE' as parameter, 
    setting as value 
FROM pg_settings 
WHERE name = 'lc_collate'
UNION ALL
SELECT 
    'LC_CTYPE' as parameter, 
    setting as value 
FROM pg_settings 
WHERE name = 'lc_ctype'
UNION ALL
SELECT 
    'Database Encoding' as parameter,
    pg_encoding_to_char(encoding) as value
FROM pg_database 
WHERE datname = 'regmik-erp';

-- Тест пошуку української кириліці
SELECT 'Cities with "че"' as test, COUNT(*) as count 
FROM nova_poshta_cities 
WHERE name ILIKE '%че%';

SELECT 'Cities with "Київ"' as test, COUNT(*) as count 
FROM nova_poshta_cities 
WHERE name ILIKE '%Київ%';

SELECT 'Cities with "Чернівці"' as test, COUNT(*) as count 
FROM nova_poshta_cities 
WHERE name ILIKE '%Чернівці%';
EOF