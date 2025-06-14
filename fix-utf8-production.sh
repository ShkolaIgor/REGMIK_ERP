#!/bin/bash

# Script to fix UTF-8 encoding issues in production
# This script addresses the SQL_ASCII client_encoding problem

echo "🔧 Fixing UTF-8 encoding in production..."

# Stop the production service
echo "Stopping production service..."
sudo systemctl stop regmik-erp

# Backup current deployment
echo "Creating backup..."
BACKUP_NAME="production-utf8-fix-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" \
    server/db.ts \
    deployment-package/server/db.ts \
    server/routes.ts \
    deployment-package/server/routes.ts

echo "Backup created: $BACKUP_NAME"

# Copy updated files with UTF-8 fixes
echo "Deploying UTF-8 fixes..."
cp deployment-package/server/db.ts /opt/regmik-erp/server/
cp deployment-package/server/routes.ts /opt/regmik-erp/server/

# Set proper ownership
sudo chown -R regmik:regmik /opt/regmik-erp/

# Start the production service
echo "Starting production service..."
sudo systemctl start regmik-erp

# Wait for startup
sleep 10

# Test UTF-8 functionality
echo "Testing UTF-8 functionality..."
RESPONSE=$(curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че" 2>/dev/null || echo "ERROR")

if [[ "$RESPONSE" == *"client_encoding"* ]]; then
    echo "✅ UTF-8 diagnostic endpoint working"
    
    # Parse encoding from response
    if [[ "$RESPONSE" == *"UTF8"* ]]; then
        echo "✅ UTF-8 encoding configured correctly"
    else
        echo "⚠️  UTF-8 encoding may still need attention"
    fi
else
    echo "❌ Failed to test UTF-8 diagnostic endpoint"
fi

# Test Ukrainian city search
echo "Testing Ukrainian city search..."
CITIES_RESPONSE=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Чернігів" 2>/dev/null || echo "ERROR")

if [[ "$CITIES_RESPONSE" == *"Чернігів"* ]]; then
    echo "✅ Ukrainian city search working correctly"
else
    echo "❌ Ukrainian city search may have issues"
fi

echo "🎉 UTF-8 fix deployment completed!"
echo "Check logs with: sudo journalctl -u regmik-erp -f"