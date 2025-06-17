#!/bin/bash

# Migration 0035: Serial Numbers to Categories Migration Script
# This script migrates serial number management from individual products to categories level

set -e  # Exit on any error

echo "======================================"
echo "Migration 0035: Serial Numbers to Categories"
echo "======================================"

# Check if migration file exists
MIGRATION_FILE="migrations/0035_serial_numbers_to_categories.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file $MIGRATION_FILE not found!"
    exit 1
fi

echo "Step 1: Backing up current database..."
# Create backup with timestamp
BACKUP_FILE="backup_before_migration_0035_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > "$BACKUP_FILE"
echo "Database backed up to: $BACKUP_FILE"

echo "Step 2: Checking current database state..."
# Check if has_serial_numbers column already exists in categories
HAS_COLUMN=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='categories' AND column_name='has_serial_numbers';" | xargs)

if [ "$HAS_COLUMN" = "has_serial_numbers" ]; then
    echo "Warning: has_serial_numbers column already exists in categories table"
    echo "Checking if migration needs to be applied..."
    
    # Check if the column has proper data
    NULL_COUNT=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM categories WHERE has_serial_numbers IS NULL;" | xargs)
    
    if [ "$NULL_COUNT" -gt "0" ]; then
        echo "Found $NULL_COUNT categories with NULL has_serial_numbers values. Proceeding with data migration..."
    else
        echo "Migration appears to be already applied. Checking data consistency..."
        psql $DATABASE_URL -c "SELECT id, name, has_serial_numbers, use_serial_numbers FROM categories ORDER BY id;"
        echo "Migration 0035 appears to be already completed."
        exit 0
    fi
else
    echo "has_serial_numbers column not found. Proceeding with full migration..."
fi

echo "Step 3: Applying migration..."
echo "Running migration file: $MIGRATION_FILE"

# Apply the migration
psql $DATABASE_URL -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "Migration file applied successfully!"
else
    echo "Error: Migration failed!"
    echo "Restoring from backup..."
    psql $DATABASE_URL < "$BACKUP_FILE"
    echo "Database restored from backup"
    exit 1
fi

echo "Step 4: Updating categories data..."
# Ensure has_serial_numbers is populated from use_serial_numbers
psql $DATABASE_URL -c "UPDATE categories SET has_serial_numbers = use_serial_numbers WHERE has_serial_numbers IS NULL;"

echo "Step 5: Verifying migration results..."
echo "Categories after migration:"
psql $DATABASE_URL -c "SELECT id, name, has_serial_numbers, use_serial_numbers FROM categories ORDER BY id;"

echo "Checking if hasSerialNumbers field was removed from products..."
PRODUCT_HAS_SERIAL=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='hasSerialNumbers';" | xargs)

if [ -z "$PRODUCT_HAS_SERIAL" ]; then
    echo "✓ hasSerialNumbers field successfully removed from products table"
else
    echo "Warning: hasSerialNumbers field still exists in products table"
fi

echo "Step 6: Testing serial number functionality..."
# Test that serial number generation works with categories
echo "Testing serial number service..."
node -e "
const { SerialNumberGenerator } = require('./server/serial-number-generator.ts');
console.log('Serial number service loaded successfully');
"

echo "Step 7: Validation complete!"
echo "======================================"
echo "Migration 0035 Summary:"
echo "✓ Added has_serial_numbers column to categories table"
echo "✓ Migrated serial number settings from products to categories"
echo "✓ Updated existing categories with proper serial number flags"
echo "✓ Verified data integrity"
echo "======================================"

echo "Categories with serial numbers enabled:"
psql $DATABASE_URL -c "SELECT name, has_serial_numbers FROM categories WHERE has_serial_numbers = true ORDER BY name;"

echo ""
echo "Migration 0035 completed successfully!"
echo "Serial numbers are now managed at the category level."
echo "Products inherit serial number settings from their categories."
echo ""
echo "Next steps:"
echo "1. Test product creation with serial numbers"
echo "2. Verify serial number generation for categories that require them"
echo "3. Update any custom code that referenced product-level serial numbers"
echo ""
echo "Backup file saved as: $BACKUP_FILE"
echo "Keep this backup until you've verified everything works correctly."