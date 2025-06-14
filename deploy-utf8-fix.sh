#!/bin/bash

# Deploy UTF-8 fixes to production package
echo "Deploying UTF-8 fixes to production..."

# Create timestamped backup
BACKUP_NAME="utf8-search-fix-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_NAME" deployment-package/server/db.ts deployment-package/server/routes.ts

echo "Backup created: $BACKUP_NAME"

# Copy updated files with UTF-8 fixes
cp server/db.ts deployment-package/server/
cp server/routes.ts deployment-package/server/

echo "UTF-8 fixes deployed to deployment package"
echo "Ready for production deployment"