
# PRODUCTION FIX: Missing Supplier

## Issue
Foreign key constraint violation: supplier_id 512 doesn't exist in suppliers table.

## Solution
Run: psql -d $DATABASE_URL -f create-missing-supplier.sql

This creates the missing supplier and prevents future foreign key errors.

