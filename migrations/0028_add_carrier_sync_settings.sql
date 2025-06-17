-- Migration: Add Carrier Sync Settings
-- Version: 14.06.2025 07:28:00
-- Description: Add sync time, interval and auto-sync settings for carriers with API integration

BEGIN;

-- Add sync settings columns to carriers table
ALTER TABLE carriers 
ADD COLUMN IF NOT EXISTS sync_time VARCHAR(5),
ADD COLUMN IF NOT EXISTS sync_interval INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS auto_sync BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN carriers.sync_time IS 'Час синхронізації у форматі HH:MM';
COMMENT ON COLUMN carriers.sync_interval IS 'Інтервал оновлення даних у годинах';
COMMENT ON COLUMN carriers.auto_sync IS 'Автоматична синхронізація';

-- Create index for auto-sync carriers for efficient queries
CREATE INDEX IF NOT EXISTS idx_carriers_auto_sync ON carriers(auto_sync) WHERE auto_sync = true;

-- Create index for sync time for scheduled operations
CREATE INDEX IF NOT EXISTS idx_carriers_sync_time ON carriers(sync_time) WHERE sync_time IS NOT NULL;

COMMIT;