#!/bin/bash

# Migration 0036: XML Import Enhancements
# Run this script to apply database changes for improved XML import functionality

echo "Starting Migration 0036: XML Import Enhancements..."

# Check if we're in production environment
if [ -f "production.env" ]; then
    echo "Loading production environment..."
    source production.env
    DB_URL="$DATABASE_URL"
elif [ -f ".env" ]; then
    echo "Loading development environment..."
    source .env
    DB_URL="$DATABASE_URL"
else
    echo "No environment file found. Using system DATABASE_URL..."
fi

if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL not found in environment"
    echo "Please set DATABASE_URL environment variable or create .env file"
    exit 1
fi

echo "Database URL: ${DB_URL:0:20}..." # Show only first 20 chars for security

# Backup current migration state
echo "Backing up current database state..."
pg_dump "$DB_URL" --schema-only > "backup_schema_$(date +%Y%m%d_%H%M%S).sql"

# Run the migration
echo "Applying migration 0036..."
psql "$DB_URL" -f migrations/0036-xml-import-enhancements.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration 0036 completed successfully!"
    
    # Update migration tracking table if it exists
    psql "$DB_URL" -c "
    INSERT INTO migration_history (version, description, applied_at) 
    VALUES ('0036', 'XML Import Enhancements - Allow NULL tax_code, unique external_id, performance indexes', NOW())
    ON CONFLICT (version) DO UPDATE SET 
        applied_at = NOW(),
        description = EXCLUDED.description;
    " 2>/dev/null || echo "Note: Migration tracking table not found (this is normal)"
    
    echo ""
    echo "Migration 0036 Summary:"
    echo "- ✓ Allowed NULL values for tax_code field"
    echo "- ✓ Added unique constraint for external_id"
    echo "- ✓ Added performance indexes for XML import"
    echo "- ✓ Updated Nova Poshta lookup indexes"
    echo "- ✓ Cleaned up existing data consistency"
    echo "- ✓ Removed references to non-existent city_ref/warehouse_ref columns"
    echo ""
    echo "XML import functionality is now enhanced!"
    
else
    echo "✗ Migration 0036 failed!"
    echo "Please check the error messages above and fix any issues before retrying."
    exit 1
fi

echo "Migration 0036 completed at $(date)"