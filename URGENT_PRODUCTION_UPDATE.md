# Urgent Production UTF-8 Encoding Fix

## Current Production Status
- client_encoding: UTF8 ✅ (partially working)
- server_encoding: SQL_ASCII ❌ (causing reduced search results)
- Search "че": 162 results instead of 1,451

## Complete Solution Package

### 1. Enhanced Database Connection Handler
Updated files with locale settings to force UTF-8 processing:
- `deployment-package/server/db.ts` - Enhanced with lc_ctype and lc_collate settings
- Adds session-level UTF-8 enforcement for text operations

### 2. Database Server Encoding Fix
Created `fix-production-server-encoding.sql` to address PostgreSQL server encoding:
- Updates database locale settings
- Recreates indexes with UTF-8 collation
- Provides encoding verification function

### 3. Deployment Steps

#### Step 1: Apply Enhanced Connection Handler
```bash
# Copy updated files
cp deployment-package/server/db.ts /opt/regmik-erp/server/
```

#### Step 2: Apply Database Encoding Fix
```bash
# Execute SQL fix as postgres superuser
sudo -u postgres psql -d your_database_name -f fix-production-server-encoding.sql
```

#### Step 3: Restart Application
```bash
sudo systemctl restart regmik-erp
```

#### Step 4: Verify Fix
```bash
# Should show UTF8/UTF8 for both encodings and 1,451 results for "че"
curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че"
```

## Expected Results After Fix
- server_encoding: UTF8 ✅
- client_encoding: UTF8 ✅
- Search "че": 1,451 results ✅
- Search "Чернігів": 340 results with proper encoding ✅

## Backup Strategy
Created `production-static-fix-20250614-180357.tar.gz` containing:
- All updated files
- SQL fix script
- Complete documentation
- Rollback instructions

## Testing Verification
Development environment confirms fix works correctly:
- Both encodings show UTF8
- Search results match expected counts
- Ukrainian text processing works properly

## Risk Assessment
- Low risk: Connection handler changes only affect new connections
- Database encoding changes require restart but are reversible
- Backup available for quick rollback if needed