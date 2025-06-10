# REGMIK ERP - Company Management Module Update for Proxmox

## Issue
The production server on Proxmox (192.168.0.247:5000) has an outdated build that causes errors:
- `storage.getCompanies is not a function`
- `storage.createCompany is not a function`

## Solution
The production build needs to be updated with the latest company management functionality.

## Deployment Steps

### 1. Create Production Build
```bash
# On development machine
./build-for-proxmox.sh
```

### 2. Upload to Proxmox Server
```bash
# Upload deployment-package directory to server
scp -r deployment-package/* root@192.168.0.247:/tmp/regmik-update/
```

### 3. Deploy on Proxmox Server
```bash
# SSH to Proxmox server
ssh root@192.168.0.247

# Stop service
sudo systemctl stop regmik-erp

# Create backup
sudo cp -r /opt/REGMIK_ERP /opt/REGMIK_ERP_backup_$(date +%Y%m%d_%H%M%S)

# Update files
sudo cp -r /tmp/regmik-update/* /opt/REGMIK_ERP/

# Set permissions
sudo chown -R regmik:regmik /opt/REGMIK_ERP
sudo chmod +x /opt/REGMIK_ERP/start-production.sh

# Install dependencies
cd /opt/REGMIK_ERP
sudo -u regmik npm install --production

# Update database schema
sudo -u regmik npm run db:push

# Start service
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

### 4. Verify Deployment
```bash
# Check logs
sudo journalctl -u regmik-erp -f

# Test company functionality
curl -b cookies.txt http://192.168.0.247:5000/api/companies
```

## Files Updated
- `server/db-storage.ts` - Added company management methods
- `server/storage.ts` - Updated storage interface
- `server/routes.ts` - Added company API endpoints
- `client/src/pages/companies.tsx` - Company management UI
- `shared/schema.ts` - Company data structures

## Expected Result
After deployment, the Companies module should work correctly:
- List companies: ✅
- Create new companies: ✅
- Edit existing companies: ✅
- No "function not found" errors: ✅