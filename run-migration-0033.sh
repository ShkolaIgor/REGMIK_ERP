#!/bin/bash

# Production Migration Script for 0033_roles_permissions_system
# Run this script on the production server to apply roles and permissions system

set -e  # Exit on any error

echo "=== RegMik ERP Production Migration 0033 ==="
echo "Migration: Roles and Permissions System"
echo "Date: $(date)"
echo "============================================="

# Check if we're running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "Warning: Running as root. Please run as the application user."
   read -p "Continue anyway? (y/N): " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# Set production environment
export NODE_ENV=production

# Load production environment variables
if [ -f "/opt/regmik-erp/production.env" ]; then
    echo "Loading production environment..."
    source /opt/regmik-erp/production.env
elif [ -f "./production.env" ]; then
    echo "Loading local production environment..."
    source ./production.env
else
    echo "Warning: No production.env file found. Using system environment."
fi

# Check database connection
echo "Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Error: Cannot connect to database. Please check DATABASE_URL."
    echo "Current DATABASE_URL: ${DATABASE_URL:0:20}..."
    exit 1
fi

echo "Database connection successful."

# Create backup
BACKUP_FILE="/opt/regmik-erp/backups/backup_before_migration_0033_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating database backup..."
mkdir -p /opt/regmik-erp/backups

if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
    echo "Backup created: $BACKUP_FILE"
else
    echo "Warning: Backup failed. Continue anyway?"
    read -p "Continue without backup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if migration has already been applied
echo "Checking migration status..."
MIGRATION_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'roles');" | tr -d ' ')

if [ "$MIGRATION_EXISTS" = "t" ]; then
    echo "Warning: Roles table already exists. This migration may have been applied."
    read -p "Continue with migration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled."
        exit 0
    fi
fi

# Apply migration
echo "Applying migration 0033..."
if [ -f "./migrations/0033_roles_permissions_system.sql" ]; then
    MIGRATION_FILE="./migrations/0033_roles_permissions_system.sql"
elif [ -f "/opt/regmik-erp/migrations/0033_roles_permissions_system.sql" ]; then
    MIGRATION_FILE="/opt/regmik-erp/migrations/0033_roles_permissions_system.sql"
else
    echo "Error: Migration file not found!"
    echo "Looked in:"
    echo "  - ./migrations/0033_roles_permissions_system.sql"
    echo "  - /opt/regmik-erp/migrations/0033_roles_permissions_system.sql"
    exit 1
fi

echo "Using migration file: $MIGRATION_FILE"

# Execute migration with error handling
if psql "$DATABASE_URL" -f "$MIGRATION_FILE"; then
    echo "Migration 0033 applied successfully!"
else
    echo "Error: Migration failed!"
    echo "Check the logs above for details."
    if [ -f "$BACKUP_FILE" ]; then
        echo "You can restore from backup: $BACKUP_FILE"
        echo "Restore command: psql \"\$DATABASE_URL\" < \"$BACKUP_FILE\""
    fi
    exit 1
fi

# Verify migration
echo "Verifying migration..."
TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('system_modules', 'permissions', 'roles', 'role_permissions');" | tr -d ' ')

if [ "$TABLES_COUNT" = "4" ]; then
    echo "✓ All required tables created successfully"
else
    echo "✗ Warning: Expected 4 tables, found $TABLES_COUNT"
fi

# Check data
ROLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles;" | tr -d ' ')
PERMISSIONS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions;" | tr -d ' ')
MODULES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM system_modules;" | tr -d ' ')

echo "Data verification:"
echo "  - Roles: $ROLES_COUNT"
echo "  - Permissions: $PERMISSIONS_COUNT"
echo "  - Modules: $MODULES_COUNT"

# Check if ShkolaIhor user has super_admin role
SUPER_ADMIN_ASSIGNED=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS(SELECT 1 FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = 'ShkolaIhor' AND r.name = 'super_admin');" | tr -d ' ')

if [ "$SUPER_ADMIN_ASSIGNED" = "t" ]; then
    echo "✓ ShkolaIhor assigned super_admin role"
else
    echo "✗ Warning: ShkolaIhor not assigned super_admin role"
fi

# Log migration completion
echo "Recording migration completion..."
psql "$DATABASE_URL" -c "INSERT INTO migration_log (migration_name, applied_at, status) VALUES ('0033_roles_permissions_system', NOW(), 'completed') ON CONFLICT DO NOTHING;" 2>/dev/null || echo "Note: migration_log table not available"

echo ""
echo "============================================="
echo "Migration 0033 completed successfully!"
echo "Date: $(date)"
echo ""
echo "Summary of changes:"
echo "  - Created roles and permissions system"
echo "  - Added 5 base roles with appropriate permissions"
echo "  - Created 11 system modules"
echo "  - Added 47+ granular permissions"
echo "  - Assigned super_admin role to ShkolaIhor"
echo ""
echo "Next steps:"
echo "  1. Restart the application service"
echo "  2. Test the roles and permissions functionality"
echo "  3. Assign roles to other users as needed"
echo ""
echo "Backup location: $BACKUP_FILE"
echo "============================================="

# Optional: Restart service
read -p "Restart regmik-erp service now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Restarting regmik-erp service..."
    if systemctl is-active --quiet regmik-erp; then
        sudo systemctl restart regmik-erp
        echo "Service restarted successfully."
    else
        echo "Service not running or not found. Please start manually."
    fi
fi

echo "Migration script completed."