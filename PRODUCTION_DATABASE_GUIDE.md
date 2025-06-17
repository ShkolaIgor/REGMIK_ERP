# Production Database Setup Guide
Ukrainian ERP System - Complete Database Deployment

## Overview

This guide covers the complete deployment of the Ukrainian ERP system database for production environments. The system includes:

- **Complete ERP Structure**: Orders, products, inventory, clients, suppliers
- **Role-Based Access Control**: User roles and permissions system
- **Nova Poshta Integration**: Full carrier integration with cities and warehouses
- **Workers Management**: Enhanced with personal information fields
- **Serial Number Tracking**: Product serialization support
- **Ukrainian Localization**: Full UTF-8 support for Ukrainian language

## Files Included

- `production-complete.sql` - Complete database structure and initial data
- `deploy-production-database.sh` - Automated deployment script
- `PRODUCTION_DATABASE_GUIDE.md` - This guide

## Prerequisites

1. **PostgreSQL 12+** installed and running
2. **psql client** available in PATH
3. **Database created** with UTF-8 encoding
4. **Connection URL** with admin privileges

## Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x deploy-production-database.sh

# Run deployment
./deploy-production-database.sh "postgresql://username:password@host:port/database"

# Or run interactively
./deploy-production-database.sh
```

### Option 2: Manual Deployment

```bash
# Apply SQL directly
psql "postgresql://username:password@host:port/database" -f production-complete.sql

# Verify deployment
psql "postgresql://username:password@host:port/database" -c "SELECT COUNT(*) FROM local_users;"
```

## Database Structure

### Core Tables

#### Authentication & Users
- `sessions` - Session storage for authentication
- `local_users` - User accounts with authentication
- `user_roles` - System roles definition
- `system_modules` - Available system modules
- `user_role_assignments` - User role mappings

#### Business Entities
- `companies` - Company information
- `departments` - Company departments
- `positions` - Employee positions
- `workers` - Employee records with personal info
- `clients` - Customer database
- `suppliers` - Supplier management
- `products` - Product catalog
- `inventory` - Stock management

#### Operations
- `orders` - Customer orders
- `order_items` - Order line items
- `purchase_orders` - Supplier orders
- `purchase_order_items` - Purchase line items
- `production_tasks` - Manufacturing tasks
- `shipments` - Delivery tracking
- `partial_shipments` - Partial delivery support

#### Integration
- `nova_poshta_cities` - Nova Poshta city database
- `nova_poshta_warehouses` - Nova Poshta warehouse locations
- `nova_poshta_api_settings` - Per-client API configurations
- `carrier_sync_settings` - Carrier synchronization settings

#### Supporting Tables
- `client_shipping_addresses` - Client delivery addresses
- `serial_numbers` - Product serial number tracking
- `product_components` - Product composition
- `currency_rates` - Exchange rate history

## Default System Data

### Default Roles

1. **super_admin** - Full system access
2. **admin** - User and settings management
3. **manager** - Orders and client management
4. **worker** - Production tasks
5. **viewer** - Read-only access

### Default User

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Super Administrator
- **Email**: `admin@regmik.com`

⚠️ **IMPORTANT**: Change the default password after first login!

### System Modules

Pre-configured modules with proper permissions:
- Dashboard
- Orders Management
- Client Management
- Product Catalog
- Inventory Control
- Production Tasks
- Shipment Tracking
- Worker Management
- Supplier Management
- Analytics & Reports
- External Integrations
- User Management
- Role Management
- System Settings

## Security Configuration

### Password Security

The default admin password is hashed using bcrypt. For production:

1. Change default password immediately
2. Enforce strong password policies
3. Enable two-factor authentication if available
4. Regular password rotation

### Database Security

1. **Connection Security**:
   ```sql
   -- Enable SSL connections
   ssl = on
   ssl_cert_file = 'server.crt'
   ssl_key_file = 'server.key'
   ```

2. **User Privileges**:
   ```sql
   -- Create application user with limited privileges
   CREATE USER app_user WITH PASSWORD 'secure_password';
   GRANT CONNECT ON DATABASE your_db TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
   ```

3. **Network Security**:
   - Configure `pg_hba.conf` for IP restrictions
   - Use firewall rules to limit database access
   - Consider VPN for remote connections

## Performance Optimization

### Indexes

The deployment includes optimized indexes for:
- Order lookups by client and status
- Product searches
- Serial number tracking
- Nova Poshta city/warehouse searches
- User authentication

### Database Configuration

Recommended PostgreSQL settings for production:

```postgresql
# Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Connections
max_connections = 100

# Logging
log_statement = 'mod'
log_duration = on
log_min_duration_statement = 1000

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_URL="postgresql://user:pass@host:port/database"

# Create backup
pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
```

### Backup Verification

```bash
# Test backup integrity
gunzip -t backup_20250615_120000.sql.gz

# Test restore on test database
gunzip -c backup_20250615_120000.sql.gz | psql "postgresql://user:pass@testhost:port/testdb"
```

## Monitoring

### Health Checks

```sql
-- Check database connectivity
SELECT 1;

-- Verify essential tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user count
SELECT COUNT(*) as user_count FROM local_users WHERE "isActive" = true;

-- Check recent activity
SELECT COUNT(*) as recent_orders FROM orders 
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Performance Monitoring

```sql
-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Connection status
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   ```bash
   # Test connection
   psql "postgresql://user:pass@host:port/database" -c "SELECT 1;"
   
   # Check if database exists
   psql "postgresql://user:pass@host:port/postgres" -c "\l"
   ```

2. **Permission Errors**:
   ```sql
   -- Check user permissions
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name='local_users';
   ```

3. **Encoding Issues**:
   ```sql
   -- Check database encoding
   SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();
   
   -- Should return: UTF8
   ```

### Log Analysis

```bash
# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-13-main.log

# Filter for errors
grep "ERROR" /var/log/postgresql/postgresql-13-main.log
```

## Migration from Development

If migrating from development environment:

1. **Export development data**:
   ```bash
   pg_dump --data-only --exclude-table=sessions development_db > dev_data.sql
   ```

2. **Apply to production** (after structure deployment):
   ```bash
   psql production_db -f dev_data.sql
   ```

3. **Update sequences**:
   ```sql
   SELECT setval('local_users_id_seq', (SELECT MAX(id) FROM local_users));
   -- Repeat for all sequences
   ```

## Environment Variables

Required environment variables for application:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=app_user
PGPASSWORD=secure_password
PGDATABASE=regmik_erp_production

# Application
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret-here
```

## Maintenance Tasks

### Regular Maintenance

```sql
-- Weekly vacuum and analyze
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE regmik_erp_production;

-- Update statistics
ANALYZE;
```

### Monthly Tasks

1. Review and archive old data
2. Check for unused indexes
3. Update database statistics
4. Review access logs
5. Test backup restoration

## Support

For technical support or questions:

1. Check application logs first
2. Review database logs for errors
3. Verify network connectivity
4. Check system resources (CPU, memory, disk)

## Version Information

- **Database Version**: PostgreSQL 12+
- **Schema Version**: Latest (includes migrations through 0034)
- **Features**: Complete ERP with roles, Nova Poshta integration, worker enhancements
- **Deployment Date**: 2025-06-15
- **UTF-8 Support**: Full Ukrainian localization