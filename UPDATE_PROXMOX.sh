#!/bin/bash

# Script to update Proxmox container to use full UI launcher
# Run this in your /opt/REGMIK_ERP directory

echo "Updating REGMIK ERP to full UI interface..."

# Stop current service if running
sudo systemctl stop regmik-erp 2>/dev/null || true

# Update service file to use production-ui.ts
sed 's|production-dev.ts|production-ui.ts|g' regmik-erp-simple.service > regmik-erp.service

# Copy updated service
sudo cp regmik-erp.service /etc/systemd/system/
sudo systemctl daemon-reload

# Start service with new UI
sudo systemctl start regmik-erp
sudo systemctl enable regmik-erp

echo "Service updated. Checking status..."
sleep 3

if sudo systemctl is-active --quiet regmik-erp; then
    echo "✓ REGMIK ERP with full UI is running on port 5000"
    echo "Access: http://192.168.0.247:5000"
else
    echo "✗ Service failed to start. Check logs:"
    sudo journalctl -u regmik-erp -n 20
fi