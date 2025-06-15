#!/bin/bash

# Quick Migration Deployment for Nova Poshta API Settings
# Usage: ./quick-deploy-migration.sh

set -e

echo "🚀 Розгортання міграції Nova Poshta API Settings..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Помилка: DATABASE_URL не налаштовано"
    exit 1
fi

# Create backup
echo "📦 Створення резервної копії..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
echo "✅ Резервна копія створена: $BACKUP_FILE"

# Apply migration
echo "⚡ Застосування міграції..."
psql "$DATABASE_URL" -f migrations/0031_production_nova_poshta_complete.sql

# Verify
echo "🔍 Перевірка результатів..."
TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'client_nova_poshta_api_settings';")

if [ "$TABLE_EXISTS" -eq 1 ]; then
    echo "✅ Таблиця client_nova_poshta_api_settings створена успішно"
else
    echo "❌ Помилка: таблиця не створена"
    exit 1
fi

# Check columns
COLUMN_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'client_nova_poshta_settings' AND column_name IN ('recipient_name', 'recipient_phone', 'recipient_email');")

if [ "$COLUMN_COUNT" -eq 3 ]; then
    echo "✅ Колонки додані до client_nova_poshta_settings"
else
    echo "⚠️  Попередження: не всі колонки додані"
fi

echo ""
echo "🎉 Міграція завершена успішно!"
echo "📋 Резервна копія: $BACKUP_FILE"
echo "📖 Детальна документація: MIGRATION_DEPLOYMENT_GUIDE.md"