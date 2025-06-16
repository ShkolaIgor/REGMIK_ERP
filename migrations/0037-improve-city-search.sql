-- Migration 0037: Improve Nova Poshta city search performance
-- This migration optimizes city search for better performance in production

-- Add indexes for case-insensitive city search
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_name_lower ON nova_poshta_cities(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_area_lower ON nova_poshta_cities(LOWER(area));

-- Add composite index for combined search
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_search ON nova_poshta_cities(LOWER(name), LOWER(area));

-- Add text search indexes for better Ukrainian language support
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_name_trgm ON nova_poshta_cities USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_nova_poshta_cities_area_trgm ON nova_poshta_cities USING gin(area gin_trgm_ops);

-- Enable trigram extension if not exists (PostgreSQL extension for fuzzy text search)
DO $$ 
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION 
    WHEN others THEN
        -- Extension already exists or insufficient privileges
        NULL;
END $$;

-- Add comment to document the optimization
COMMENT ON INDEX idx_nova_poshta_cities_name_lower IS 'Optimized index for case-insensitive city name search';
COMMENT ON INDEX idx_nova_poshta_cities_area_lower IS 'Optimized index for case-insensitive area search';
COMMENT ON INDEX idx_nova_poshta_cities_search IS 'Composite index for combined city and area search';

-- Update table statistics for better query planning
ANALYZE nova_poshta_cities;