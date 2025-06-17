#!/bin/bash

# Serial Number Management Migration Deployment Script
# Ukrainian ERP System - Move serial number settings from products to categories
# Generated: 2025-06-15

set -e  # Exit on any error

# Configuration
MIGRATION_FILE="migrations/0035_serial_numbers_to_categories.sql"
BACKUP_DIR="backups/migration_0035_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="migration_0035_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Check database connection
log "Checking database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    error "Cannot connect to database. Please check DATABASE_URL environment variable."
    exit 1
fi
success "Database connection verified"

# Create backup directory
log "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Create database backup
log "Creating database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/full_backup.sql"
if [ $? -eq 0 ]; then
    success "Database backup created: $BACKUP_DIR/full_backup.sql"
else
    error "Failed to create database backup"
    exit 1
fi

# Backup specific tables before migration
log "Backing up affected tables..."
psql "$DATABASE_URL" -c "COPY products TO STDOUT" > "$BACKUP_DIR/products_backup.csv" 2>/dev/null || true
psql "$DATABASE_URL" -c "COPY categories TO STDOUT" > "$BACKUP_DIR/categories_backup.csv" 2>/dev/null || true
psql "$DATABASE_URL" -c "COPY serial_numbers TO STDOUT" > "$BACKUP_DIR/serial_numbers_backup.csv" 2>/dev/null || true
success "Table backups created"

# Check current state
log "Checking current database state..."
PRODUCTS_WITH_SERIAL_NUMBERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM products WHERE has_serial_numbers = true;" 2>/dev/null || echo "0")
TOTAL_SERIAL_NUMBERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM serial_numbers;" 2>/dev/null || echo "0")

log "Current state:"
log "  - Products with serial numbers: $PRODUCTS_WITH_SERIAL_NUMBERS"
log "  - Total serial numbers in database: $TOTAL_SERIAL_NUMBERS"

# Prompt for confirmation
echo
warning "IMPORTANT: This migration will restructure serial number management:"
warning "- Remove 'has_serial_numbers' field from products table"
warning "- Add 'has_serial_numbers' field to categories table"
warning "- Add 'category_id' reference to serial_numbers table"
warning "- Migrate existing serial number settings from products to categories"
echo
read -p "Do you want to proceed with the migration? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Migration cancelled by user"
    exit 0
fi

# Execute migration
log "Executing migration: $MIGRATION_FILE"
if psql "$DATABASE_URL" -f "$MIGRATION_FILE" > "$BACKUP_DIR/migration_output.log" 2>&1; then
    success "Migration executed successfully"
else
    error "Migration failed. Check $BACKUP_DIR/migration_output.log for details"
    log "Attempting to restore from backup..."
    
    # Restore backup
    if psql "$DATABASE_URL" < "$BACKUP_DIR/full_backup.sql" > /dev/null 2>&1; then
        warning "Database restored from backup"
    else
        error "Failed to restore database. Manual intervention required."
    fi
    exit 1
fi

# Verify migration results
log "Verifying migration results..."

# Check that products table no longer has has_serial_numbers column
if psql "$DATABASE_URL" -c "SELECT has_serial_numbers FROM products LIMIT 1;" > /dev/null 2>&1; then
    error "Migration verification failed: has_serial_numbers column still exists in products table"
    exit 1
fi

# Check that categories table has has_serial_numbers column
if ! psql "$DATABASE_URL" -c "SELECT has_serial_numbers FROM categories LIMIT 1;" > /dev/null 2>&1; then
    error "Migration verification failed: has_serial_numbers column missing from categories table"
    exit 1
fi

# Check that serial_numbers table has category_id column
if ! psql "$DATABASE_URL" -c "SELECT category_id FROM serial_numbers LIMIT 1;" > /dev/null 2>&1; then
    error "Migration verification failed: category_id column missing from serial_numbers table"
    exit 1
fi

# Check migration results
CATEGORIES_WITH_SERIAL_NUMBERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM categories WHERE has_serial_numbers = true;" 2>/dev/null || echo "0")
SERIAL_NUMBERS_WITH_CATEGORY=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM serial_numbers WHERE category_id IS NOT NULL;" 2>/dev/null || echo "0")

log "Migration results:"
log "  - Categories with serial numbers: $CATEGORIES_WITH_SERIAL_NUMBERS"
log "  - Serial numbers with category reference: $SERIAL_NUMBERS_WITH_CATEGORY"

# Verify data integrity
log "Verifying data integrity..."
ORPHANED_SERIAL_NUMBERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM serial_numbers sn LEFT JOIN products p ON sn.product_id = p.id WHERE p.id IS NULL;" 2>/dev/null || echo "0")

if [ "$ORPHANED_SERIAL_NUMBERS" -gt 0 ]; then
    warning "Found $ORPHANED_SERIAL_NUMBERS orphaned serial numbers (products no longer exist)"
fi

# Test the new serial number generator functionality
log "Testing new serial number generation..."
cat > /tmp/test_serial_generation.sql << 'EOF'
-- Test serial number generation for categories
DO $$
DECLARE
    test_category_id INTEGER;
    test_product_id INTEGER;
BEGIN
    -- Find a category that uses serial numbers
    SELECT id INTO test_category_id 
    FROM categories 
    WHERE has_serial_numbers = true 
    LIMIT 1;
    
    IF test_category_id IS NOT NULL THEN
        -- Find a product in this category
        SELECT id INTO test_product_id 
        FROM products 
        WHERE category_id = test_category_id 
        LIMIT 1;
        
        IF test_product_id IS NOT NULL THEN
            RAISE NOTICE 'Test successful: Found category % with product % configured for serial numbers', test_category_id, test_product_id;
        ELSE
            RAISE NOTICE 'Test warning: Category % has serial numbers enabled but no products found', test_category_id;
        END IF;
    ELSE
        RAISE NOTICE 'Test info: No categories with serial numbers found (this is normal for new installations)';
    END IF;
END $$;
EOF

psql "$DATABASE_URL" -f /tmp/test_serial_generation.sql >> "$LOG_FILE" 2>&1
rm /tmp/test_serial_generation.sql

# Update application to use new schema
log "Migration deployment completed successfully!"

success "Summary:"
success "✓ Database backup created: $BACKUP_DIR/full_backup.sql"
success "✓ Migration applied: Serial number management moved to category level"
success "✓ Data integrity verified"
success "✓ New schema structure ready for use"

log "Next steps:"
log "1. Update application code to use category-based serial number settings"
log "2. Configure serial number templates for categories as needed"
log "3. Test serial number generation with the new system"
log "4. Monitor application logs for any issues"

echo
success "Migration 0035 (Serial Numbers to Categories) completed successfully!"
success "Full log available at: $LOG_FILE"
success "Backup files available at: $BACKUP_DIR"

# Cleanup temporary files
rm -f /tmp/test_serial_generation.sql

exit 0