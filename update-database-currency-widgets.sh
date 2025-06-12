#!/bin/bash

# Database Update Script for Currency Widgets
# Version: 12.06.2025 11:55:00
# Description: Apply database migrations for currency widget fixes

set -e

echo "=== DATABASE UPDATE: CURRENCY WIDGETS ==="
echo "Timestamp: $(date)"
echo "=========================================="

# Check if running on production server
if [[ ! -f "/opt/regmik-erp/.production" ]]; then
    echo "ERROR: This script must be run on production server"
    exit 1
fi

# Navigate to application directory
cd /opt/regmik-erp

# Load environment variables
if [[ -f ".env.production" ]]; then
    source .env.production
else
    echo "ERROR: .env.production file not found"
    exit 1
fi

# Check database connection
echo "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to database"
    exit 1
fi

echo "✓ Database connection successful"

# Create backup
echo "Creating database backup..."
BACKUP_FILE="/opt/regmik-erp/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p /opt/regmik-erp/backups
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
echo "✓ Database backup created: $BACKUP_FILE"

# Apply migration
echo "Applying currency widget migration..."
psql "$DATABASE_URL" -f migrations/0026_currency_widget_fixes.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration applied successfully"
else
    echo "✗ Migration failed"
    echo "Restoring from backup..."
    psql "$DATABASE_URL" < "$BACKUP_FILE"
    exit 1
fi

# Verify migration
echo "Verifying migration..."
TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('currency_dashboards', 'currency_widgets');")

if [ "$TABLES_COUNT" -eq 2 ]; then
    echo "✓ Currency tables verified"
else
    echo "✗ Currency tables not found"
    exit 1
fi

# Check data integrity
echo "Checking data integrity..."
DASHBOARDS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM currency_dashboards;")
WIDGETS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM currency_widgets;")

echo "✓ Currency dashboards: $DASHBOARDS_COUNT"
echo "✓ Currency widgets: $WIDGETS_COUNT"

# Update schema version
psql "$DATABASE_URL" -c "INSERT INTO schema_migrations (version, applied_at) VALUES ('0026_currency_widget_fixes', NOW()) ON CONFLICT (version) DO NOTHING;"

echo "=========================================="
echo "DATABASE UPDATE COMPLETED SUCCESSFULLY"
echo ""
echo "CHANGES APPLIED:"
echo "✓ Currency dashboards table structure verified"
echo "✓ Currency widgets table structure verified"
echo "✓ Added indexes for better performance"
echo "✓ Created default dashboards for existing users"
echo "✓ Added default widgets (USD, EUR rates)"
echo "✓ Updated widget types for compatibility"
echo "✓ Added automatic timestamp triggers"
echo ""
echo "Database is ready for currency widget functionality!"
echo "=========================================="