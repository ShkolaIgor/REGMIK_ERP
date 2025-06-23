#!/bin/bash

# Emergency deployment fix for supplier_receipts table
# This script should be run on the production server

echo "🚨 EMERGENCY FIX: Creating missing supplier_receipts table"
echo "Timestamp: $(date)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    exit 1
fi

# Apply the database fix
echo "Applying database fix..."
psql "$DATABASE_URL" -f production-fix-immediate.sql

if [ $? -eq 0 ]; then
    echo "✅ SUCCESS: Database fix applied successfully"
    echo "Testing table creation..."
    
    # Test if table exists
    psql "$DATABASE_URL" -c "SELECT 'Table exists: supplier_receipts' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_receipts');"
    
    echo "✅ Production fix completed. Supplier receipts should now work."
else
    echo "❌ ERROR: Failed to apply database fix"
    exit 1
fi