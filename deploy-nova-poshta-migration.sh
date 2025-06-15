#!/bin/bash

# Nova Poshta API Settings Migration Deployment Script
# Description: Deploys the complete Nova Poshta API settings functionality to production

set -e  # Exit on any error

# Configuration
MIGRATION_FILE="migrations/0031_production_nova_poshta_complete.sql"
BACKUP_DIR="migration_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="migration_log_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    error "Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting Nova Poshta API Settings Migration Deployment"
log "Migration file: $MIGRATION_FILE"
log "Backup directory: $BACKUP_DIR"
log "Log file: $LOG_FILE"

# Check database connection
log "Checking database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    error "Cannot connect to database. Please check DATABASE_URL environment variable."
    exit 1
fi
log "Database connection successful"

# Create backup of current schema
log "Creating database backup..."
BACKUP_FILE="${BACKUP_DIR}/schema_backup_${TIMESTAMP}.sql"
pg_dump "$DATABASE_URL" --schema-only > "$BACKUP_FILE"
log "Schema backup created: $BACKUP_FILE"

# Create backup of affected tables data
log "Creating data backup for affected tables..."
DATA_BACKUP_FILE="${BACKUP_DIR}/data_backup_${TIMESTAMP}.sql"
{
    echo "-- Data backup for Nova Poshta related tables"
    echo "-- Created: $(date)"
    echo ""
    
    # Backup client_nova_poshta_settings if exists
    if psql "$DATABASE_URL" -c "\dt client_nova_poshta_settings" >/dev/null 2>&1; then
        echo "-- Backup of client_nova_poshta_settings"
        pg_dump "$DATABASE_URL" --data-only --table=client_nova_poshta_settings
    fi
    
    # Backup client_nova_poshta_api_settings if exists
    if psql "$DATABASE_URL" -c "\dt client_nova_poshta_api_settings" >/dev/null 2>&1; then
        echo "-- Backup of client_nova_poshta_api_settings"
        pg_dump "$DATABASE_URL" --data-only --table=client_nova_poshta_api_settings
    fi
} > "$DATA_BACKUP_FILE"
log "Data backup created: $DATA_BACKUP_FILE"

# Verify migration file syntax
log "Verifying migration file syntax..."
if ! psql "$DATABASE_URL" --dry-run -f "$MIGRATION_FILE" >/dev/null 2>&1; then
    warning "Migration file syntax check failed, but proceeding (dry-run not supported by all PostgreSQL versions)"
fi

# Run the migration
log "Executing migration..."
if psql "$DATABASE_URL" -f "$MIGRATION_FILE" 2>&1 | tee -a "$LOG_FILE"; then
    log "Migration executed successfully"
else
    error "Migration failed! Check the log for details."
    error "You can restore from backup: $BACKUP_FILE"
    exit 1
fi

# Verify the migration results
log "Verifying migration results..."

# Check if new table exists
if psql "$DATABASE_URL" -c "\dt client_nova_poshta_api_settings" >/dev/null 2>&1; then
    log "✓ Table client_nova_poshta_api_settings created successfully"
else
    error "✗ Table client_nova_poshta_api_settings was not created"
    exit 1
fi

# Check if new columns exist in client_nova_poshta_settings
MISSING_COLUMNS=()
REQUIRED_COLUMNS=("recipient_name" "recipient_phone" "recipient_email" "delivery_city_ref" "delivery_city_name" "delivery_warehouse_ref" "delivery_warehouse_address" "service_type" "cargo_type" "payment_method" "payer" "description" "is_active" "is_primary" "created_at" "updated_at")

for column in "${REQUIRED_COLUMNS[@]}"; do
    if ! psql "$DATABASE_URL" -c "\d client_nova_poshta_settings" | grep -q "$column"; then
        MISSING_COLUMNS+=("$column")
    fi
done

if [ ${#MISSING_COLUMNS[@]} -eq 0 ]; then
    log "✓ All required columns added to client_nova_poshta_settings"
else
    error "✗ Missing columns in client_nova_poshta_settings: ${MISSING_COLUMNS[*]}"
    exit 1
fi

# Check indexes
log "Verifying indexes..."
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('client_nova_poshta_settings', 'client_nova_poshta_api_settings');")
if [ "$INDEX_COUNT" -ge 4 ]; then
    log "✓ Indexes created successfully"
else
    warning "Expected at least 4 indexes, found $INDEX_COUNT"
fi

# Check triggers
log "Verifying triggers..."
TRIGGER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE '%nova_poshta%updated_at%';")
if [ "$TRIGGER_COUNT" -ge 2 ]; then
    log "✓ Triggers created successfully"
else
    warning "Expected at least 2 triggers, found $TRIGGER_COUNT"
fi

# Display table information
log "Migration summary:"
log "===================="

# Count records in tables
CLIENT_SETTINGS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM client_nova_poshta_settings;" 2>/dev/null || echo "0")
API_SETTINGS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM client_nova_poshta_api_settings;" 2>/dev/null || echo "0")

log "client_nova_poshta_settings records: $CLIENT_SETTINGS_COUNT"
log "client_nova_poshta_api_settings records: $API_SETTINGS_COUNT"

# Show table structure
log "client_nova_poshta_api_settings structure:"
psql "$DATABASE_URL" -c "\d client_nova_poshta_api_settings" | tee -a "$LOG_FILE"

log ""
log "Migration deployment completed successfully!"
log "============================================"
log "Backup files created:"
log "  - Schema backup: $BACKUP_FILE"
log "  - Data backup: $DATA_BACKUP_FILE"
log "Log file: $LOG_FILE"
log ""
log "Next steps:"
log "1. Verify application functionality"
log "2. Test Nova Poshta API settings CRUD operations"
log "3. Monitor application logs for any issues"
log "4. Remove backup files after verification (optional)"

# Optional: Test basic functionality
if [ "$1" = "--test" ]; then
    log ""
    log "Running basic functionality tests..."
    
    # Test creating a test API setting (will be cleaned up)
    TEST_CLIENT_ID=1
    if psql "$DATABASE_URL" -c "SELECT 1 FROM clients WHERE id = $TEST_CLIENT_ID LIMIT 1;" >/dev/null 2>&1; then
        log "Testing API settings creation..."
        psql "$DATABASE_URL" -c "
            INSERT INTO client_nova_poshta_api_settings 
            (client_id, api_key, sender_phone, sender_contact_person, sender_address, is_primary, is_active) 
            VALUES 
            ($TEST_CLIENT_ID, 'test-migration-key', '+380501234567', 'Test Migration', 'Test Address', true, true);
        " >/dev/null 2>&1
        
        INSERTED_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM client_nova_poshta_api_settings WHERE api_key = 'test-migration-key';")
        if [ "$INSERTED_COUNT" -eq 1 ]; then
            log "✓ API settings creation test passed"
            
            # Cleanup test data
            psql "$DATABASE_URL" -c "DELETE FROM client_nova_poshta_api_settings WHERE api_key = 'test-migration-key';" >/dev/null 2>&1
            log "✓ Test data cleaned up"
        else
            warning "API settings creation test failed"
        fi
    else
        warning "No client with ID $TEST_CLIENT_ID found, skipping creation test"
    fi
fi

log "Deployment script completed at $(date)"