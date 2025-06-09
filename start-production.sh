#!/bin/bash

# REGMIK ERP Production Startup Script
# Запуск системи в production режимі без systemd

export NODE_ENV=production
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=regmik-erp
export PGUSER=regmik_user
export PGPASSWORD=npg_PQu4CAr9yIYq
export SESSION_SECRET=regmik_erp_production_session_2025

cd /opt/REGMIK_ERP

echo "Starting REGMIK ERP in production mode..."
echo "Database: $PGDATABASE"
echo "Host: $PGHOST:$PGPORT"

# Ініціалізація бази даних
node scripts/init-database.js

# Запуск сервера
npm start