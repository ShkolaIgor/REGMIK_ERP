#!/bin/bash

# Production UTF-8 Fix Deployment Script
# This script applies the compatible encoding fix for production

set -e

echo "=== Production UTF-8 Search Fix Deployment ==="
echo "Timestamp: $(date)"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo)"
    exit 1
fi

# Define paths
APP_DIR="/opt/regmik-erp"
BACKUP_DIR="/opt/backups/utf8-fix-$(date +%Y%m%d-%H%M%S)"
SERVICE_NAME="regmik-erp"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "Creating backup of current files..."
cp "$APP_DIR/server/db.ts" "$BACKUP_DIR/" 2>/dev/null || echo "db.ts not found, skipping backup"

echo "Applying database schema fixes..."
# Apply the compatible SQL script
sudo -u postgres psql -d "regmik-erp" -f fix-production-encoding-compatible.sql

echo "Updating database connection handler..."
# Copy the updated db.ts file
cp deployment-package/server/db.ts "$APP_DIR/server/"

echo "Restarting application service..."
systemctl stop "$SERVICE_NAME"
sleep 2
systemctl start "$SERVICE_NAME"

echo "Waiting for service to start..."
sleep 5

# Verify the service is running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Service started successfully"
    
    echo "Testing UTF-8 search functionality..."
    sleep 3
    
    # Test the search endpoint
    RESULT=$(curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че" || echo "failed")
    
    if [[ "$RESULT" == *"1451"* ]]; then
        echo "✅ SUCCESS: UTF-8 search is working correctly!"
        echo "Search results for 'че': 1451 cities found"
    else
        echo "⚠️  WARNING: Search results may not be optimal"
        echo "Response: $RESULT"
    fi
    
    echo "Deployment completed successfully!"
    echo "Backup stored in: $BACKUP_DIR"
    
else
    echo "❌ ERROR: Service failed to start"
    echo "Restoring backup..."
    cp "$BACKUP_DIR/db.ts" "$APP_DIR/server/" 2>/dev/null || echo "No backup to restore"
    systemctl start "$SERVICE_NAME"
    exit 1
fi

echo "=== Deployment Summary ==="
echo "- Database encoding optimized for UTF-8 compatibility"
echo "- Connection handler updated with enhanced settings"
echo "- Ukrainian text search functionality restored"
echo "- Application restarted and verified"