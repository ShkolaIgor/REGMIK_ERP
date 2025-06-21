#!/bin/bash
echo "Copying updated routes.ts to production..."
rsync -avz --progress server/routes.ts root@78.141.224.114:/opt/REGMIK_ERP/server/

echo "Restarting regmik-erp service..."
ssh root@78.141.224.114 "cd /opt/REGMIK_ERP && systemctl restart regmik-erp"

echo "Checking service status..."
ssh root@78.141.224.114 "systemctl status regmik-erp --no-pager -l | head -20"
