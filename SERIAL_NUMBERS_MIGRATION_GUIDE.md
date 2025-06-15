# Serial Number Management Migration Guide

## Overview

This guide documents the migration of serial number management from individual products to product categories (groups) in the Ukrainian ERP system. This architectural change provides better organization and management of serial numbers at the category level.

## Migration Details

### Changes Made

#### Database Schema Changes
1. **Products Table**: Removed `has_serial_numbers` column
2. **Categories Table**: Added `has_serial_numbers` column
3. **Serial Numbers Table**: Added `category_id` reference column
4. **Backward Compatibility**: Created view `products_with_serial_numbers` for legacy compatibility

#### Code Changes
1. **Serial Number Generator**: Updated to work with category-based settings
2. **Schema**: Updated TypeScript interfaces and Drizzle schemas
3. **Migration Script**: Created comprehensive SQL migration with safety checks

### Files Modified

#### Core Files
- `shared/schema.ts` - Updated database schema definitions
- `server/serial-number-generator.ts` - Rewritten for category-based generation
- `migrations/0035_serial_numbers_to_categories.sql` - Migration script

#### Deployment Files
- `deploy-serial-numbers-migration.sh` - Automated deployment script

## Migration Script Features

### Safety Measures
- Full database backup before migration
- Table-specific backups for affected tables
- Rollback capability on failure
- Comprehensive verification checks
- Data integrity validation

### Migration Process
1. **Backup Creation**: Full database and table-specific backups
2. **Schema Changes**: Remove/add columns as needed
3. **Data Migration**: Move serial number settings from products to categories
4. **Index Creation**: Add performance indexes
5. **Verification**: Comprehensive post-migration checks

## How to Deploy

### Prerequisites
- Database access with migration privileges
- PostgreSQL client tools installed
- Backup storage space available

### Deployment Steps
```bash
# 1. Set database connection
export DATABASE_URL="your_database_connection_string"

# 2. Run migration script
./deploy-serial-numbers-migration.sh
```

### Post-Migration Steps
1. Update application code to use category-based serial number settings
2. Configure serial number templates for categories as needed
3. Test serial number generation with the new system
4. Monitor application logs for any issues

## New Serial Number System

### Category-Based Configuration
Serial number settings are now configured at the category level:

```sql
-- Enable serial numbers for a category
UPDATE categories 
SET has_serial_numbers = true,
    use_serial_numbers = true,
    serial_number_template = '{YYYY}{MM}{DD}-{####}',
    serial_number_prefix = 'CAT'
WHERE id = 1;
```

### Serial Number Generation
The new system generates serial numbers based on category settings:

```typescript
// Generate serial number for a product
const serialNumber = await serialNumberGenerator.generateUniqueSerialNumber({
  productId: 123,
  categoryId: 1  // Optional, will be auto-detected from product
});
```

### Template System
Categories can use custom templates for serial number generation:

- `{YYYY}` - 4-digit year
- `{YY}` - 2-digit year
- `{MM}` - 2-digit month
- `{DD}` - 2-digit day
- `{HH}` - 2-digit hour
- `{mm}` - 2-digit minute
- `{####}` - Counter with specified number of digits

Example templates:
- `ELE-{YYYY}-{####}` → `ELE-2025-0001`
- `{YY}{MM}{DD}-{######}` → `250615-000001`
- `SN{####}` → `SN0001`

## Backward Compatibility

### Database View
A view `products_with_serial_numbers` provides backward compatibility:

```sql
CREATE OR REPLACE VIEW products_with_serial_numbers AS
SELECT 
    p.*,
    COALESCE(c.has_serial_numbers, false) as has_serial_numbers,
    c.serial_number_template,
    c.serial_number_prefix,
    c.use_global_numbering
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
```

### Helper Functions
New database functions assist with the transition:

```sql
-- Check if product has serial numbers
SELECT product_has_serial_numbers(123);

-- Get category serial settings
SELECT * FROM get_category_serial_settings(1);
```

## Benefits of New System

### Improved Organization
- Serial number settings managed at logical category level
- Consistent numbering schemes within product categories
- Easier bulk configuration for similar products

### Enhanced Flexibility
- Category-specific templates and prefixes
- Global or category-specific numbering sequences
- Better tracking and reporting by category

### Simplified Management
- Reduce duplication of serial number settings
- Centralized configuration per product group
- Easier maintenance and updates

## Troubleshooting

### Common Issues

#### Migration Fails
1. Check database connection
2. Verify sufficient disk space for backups
3. Ensure migration user has required privileges
4. Review migration log files

#### Serial Number Generation Issues
1. Verify category has `has_serial_numbers = true`
2. Check product is assigned to correct category
3. Validate serial number template syntax
4. Monitor for uniqueness conflicts

### Rollback Procedure
If migration needs to be rolled back:

```bash
# Restore from full backup
psql $DATABASE_URL < backups/migration_0035_*/full_backup.sql
```

### Support
For issues related to this migration:
1. Check migration log files
2. Verify backup files are intact
3. Test with small dataset first
4. Contact system administrator if needed

## Testing

### Pre-Migration Testing
```sql
-- Test current state
SELECT COUNT(*) FROM products WHERE has_serial_numbers = true;
SELECT COUNT(*) FROM serial_numbers;
```

### Post-Migration Testing
```sql
-- Verify migration success
SELECT COUNT(*) FROM categories WHERE has_serial_numbers = true;
SELECT COUNT(*) FROM serial_numbers WHERE category_id IS NOT NULL;

-- Test serial number generation
SELECT * FROM get_category_serial_settings(1);
```

### Application Testing
1. Test category configuration interface
2. Verify serial number generation for different categories
3. Check serial number assignment to products
4. Validate reporting and tracking features

## Performance Considerations

### New Indexes
The migration creates optimized indexes:
- `idx_categories_has_serial_numbers` - Fast category lookup
- `idx_serial_numbers_category_id` - Category-based queries
- `idx_serial_numbers_category_status` - Status filtering by category

### Query Optimization
Category-based queries are now more efficient:
```sql
-- Efficient category-based serial number lookup
SELECT * FROM serial_numbers 
WHERE category_id = 1 AND status = 'available';
```

## Maintenance

### Regular Tasks
1. Monitor serial number generation performance
2. Review category configuration periodically
3. Clean up unused serial number templates
4. Update templates as business needs change

### Backup Strategy
- Regular database backups include new schema
- Test restore procedures with category data
- Document category-specific configurations

---

**Migration Date**: 2025-06-15  
**Migration ID**: 0035  
**System**: Ukrainian ERP - REGMIK  
**Database Version**: PostgreSQL with UTF-8 support