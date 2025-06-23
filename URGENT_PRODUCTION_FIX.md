
# CRITICAL PRODUCTION FIX

## Issue
The production environment is missing the `supplier_receipts` table, causing errors when trying to create supplier receipts.

## Error in Production Logs
```
Error creating supplier receipt: error: relation "supplier_receipts" does not exist
```

## Solution
Run the `production-db-fix.sql` script in production to create the missing table with proper structure.

## How to Apply
1. Connect to production database
2. Execute: `psql -d $DATABASE_URL -f production-db-fix.sql`
3. The script will show verification results automatically

## Commands to Run in Production
```bash
# Apply the fix
psql -d $DATABASE_URL -f production-db-fix.sql

# Additional verification if needed
psql -d $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%supplier%';"
```

## Verification
After running the script, test supplier receipt creation should work without errors. The script includes automatic verification and will show which tables exist.

