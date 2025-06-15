#!/bin/bash

# Migration 0034: Add personal information fields to workers table
# This script adds birth_date, address, contact_phone, and termination_date to workers

echo "Starting migration 0034: Workers personal information fields..."

# Check if database connection is available
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Error: Cannot connect to database. Please check DATABASE_URL."
    exit 1
fi

# Check if migration has already been applied
if psql "$DATABASE_URL" -c "SELECT birth_date FROM workers LIMIT 1;" > /dev/null 2>&1; then
    echo "Migration 0034 appears to already be applied (birth_date column exists)."
    echo "Skipping migration."
    exit 0
fi

echo "Applying migration 0034..."

# Apply the migration
if psql "$DATABASE_URL" -f migrations/0034_workers_personal_info.sql; then
    echo "✓ Migration 0034 applied successfully!"
    echo "✓ Added personal information fields to workers table:"
    echo "  - birth_date (дата народження)"
    echo "  - address (адреса проживання)" 
    echo "  - contact_phone (контактний телефон)"
    echo "  - termination_date (дата звільнення)"
else
    echo "✗ Migration 0034 failed!"
    exit 1
fi

echo "Migration 0034 completed successfully!"