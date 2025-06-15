# Migration 0033: Roles and Permissions System - Deployment Guide

## Overview
This migration implements a comprehensive roles and permissions system for the RegMik ERP application, including:
- System modules structure
- Granular permissions management
- Role-based access control
- User role assignments

## Pre-Deployment Checklist

### 1. System Requirements
- [x] PostgreSQL database access
- [x] Application downtime window (5-10 minutes)
- [x] Database backup capability
- [x] Production environment variables configured

### 2. Files Required
- `migrations/0033_roles_permissions_system.sql` - Main migration file
- `run-migration-0033.sh` - Deployment script

## Migration Details

### Database Changes
1. **New Tables Created:**
   - `system_modules` - Application modules hierarchy
   - `permissions` - System permissions catalog
   - `roles` - User roles definitions
   - `role_permissions` - Role-permission associations

2. **Table Modifications:**
   - `users` table gets `role_id` column

3. **Data Populated:**
   - 11 system modules
   - 47+ granular permissions
   - 5 base roles (super_admin, admin, manager, operator, user)
   - Permission assignments for each role
   - ShkolaIhor user assigned super_admin role

### Default Roles and Permissions

#### Super Admin
- Full system access
- All permissions granted
- System administration capabilities

#### Admin
- Most permissions except critical system functions
- User and role management
- Business operations management

#### Manager
- Business operations focused
- Order and client management
- Reporting capabilities
- No system administration

#### Operator
- Daily operations
- Order processing
- Inventory management
- Limited administrative access

#### User
- Read-only access
- Basic viewing permissions
- No modification capabilities

## Deployment Instructions

### Option 1: Automated Deployment (Recommended)
```bash
# 1. Transfer files to production server
scp migrations/0033_roles_permissions_system.sql production-server:/opt/regmik-erp/migrations/
scp run-migration-0033.sh production-server:/opt/regmik-erp/

# 2. Connect to production server
ssh production-server

# 3. Navigate to application directory
cd /opt/regmik-erp

# 4. Run migration script
./run-migration-0033.sh
```

### Option 2: Manual Deployment
```bash
# 1. Create backup
pg_dump $DATABASE_URL > backup_before_migration_0033_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
psql $DATABASE_URL -f migrations/0033_roles_permissions_system.sql

# 3. Verify deployment
psql $DATABASE_URL -c "SELECT COUNT(*) FROM roles;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permissions;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM system_modules;"
```

## Post-Deployment Verification

### 1. Database Structure Verification
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('system_modules', 'permissions', 'roles', 'role_permissions');

-- Check data counts
SELECT 'roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'system_modules', COUNT(*) FROM system_modules
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions;
```

### 2. User Role Assignment Verification
```sql
-- Check ShkolaIhor has super_admin role
SELECT u.username, r.name as role_name, r.display_name
FROM users u 
JOIN roles r ON u.role_id = r.id 
WHERE u.username = 'ShkolaIhor';
```

### 3. Application Functionality Test
1. Restart application service
2. Login as ShkolaIhor user
3. Access `/roles` page
4. Verify all permissions are visible and modifiable
5. Test permission toggle functionality

## Rollback Instructions

If issues occur, restore from backup:
```bash
# Stop application
sudo systemctl stop regmik-erp

# Restore database
psql $DATABASE_URL < backup_before_migration_0033_YYYYMMDD_HHMMSS.sql

# Start application
sudo systemctl start regmik-erp
```

## Expected Results

### Database Objects Created
- 4 new tables with proper indexes
- 11 system modules
- 47+ permissions
- 5 roles with appropriate permission assignments
- Proper foreign key relationships

### Application Changes
- New "Roles & Permissions" menu item (for super_admin and admin)
- Role-based menu filtering
- Permission-based feature access control
- User role management interface

### User Experience
- ShkolaIhor user gets full administrative access
- Other users maintain current access until roles assigned
- New users can be assigned appropriate roles
- Granular permission control available

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Ensure DATABASE_URL has sufficient privileges
   - Check user has CREATE TABLE permissions

2. **Foreign Key Constraint Errors**
   - Verify all referenced tables exist
   - Check data consistency

3. **Application Not Loading Roles**
   - Restart application service
   - Check application logs for errors
   - Verify database connection

### Log Locations
- Application logs: `/opt/regmik-erp/logs/`
- System logs: `journalctl -u regmik-erp`
- Database logs: Check PostgreSQL logs

## Support

For issues during deployment:
1. Check application and database logs
2. Verify all migration files are present
3. Ensure database backup exists before rollback
4. Contact system administrator if persistent issues

## Migration Completion Checklist

- [ ] Database backup created
- [ ] Migration script executed successfully
- [ ] All tables created with correct structure
- [ ] Data populated correctly (roles, permissions, modules)
- [ ] ShkolaIhor assigned super_admin role
- [ ] Application service restarted
- [ ] Roles page accessible and functional
- [ ] Permission toggles working correctly
- [ ] No errors in application logs

## Next Steps After Migration

1. **User Role Assignment**
   - Review existing users
   - Assign appropriate roles based on job functions
   - Test access levels for each role

2. **Permission Fine-tuning**
   - Adjust role permissions as needed
   - Create custom roles if required
   - Document organizational access policies

3. **Training and Documentation**
   - Update user manuals
   - Train administrators on role management
   - Document permission structure for future reference