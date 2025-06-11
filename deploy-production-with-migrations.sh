#!/bin/bash

# Скрипт для безпечного розгортання оновлень ERP на продакшені з міграціями
# Використання: ./deploy-production-with-migrations.sh

set -e

PROD_SERVER="192.168.0.247"
PROD_USER="root"
PROD_PATH="/opt/REGMIK_ERP"
APP_SERVICE="regmik-erp"

echo "🚀 Початок розгортання ERP оновлень на продакшені..."

# Створюємо backup бази даних
echo "💾 Створення backup бази даних..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && pg_dump \$DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql"

# Зупиняємо сервіс
echo "⏹️ Зупинення ERP сервісу..."
ssh $PROD_USER@$PROD_SERVER "systemctl stop $APP_SERVICE"

# Синхронізуємо файли
echo "📁 Синхронізація файлів..."
rsync -avz --exclude=node_modules --exclude=.git --exclude=backup_*.sql . $PROD_USER@$PROD_SERVER:$PROD_PATH/

# Встановлюємо залежності та збираємо проект
echo "📦 Встановлення залежностей..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && npm ci --production"

echo "🔨 Збірка проекту..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && npm run build"

# Застосовуємо міграції бази даних
echo "🗃️ Застосування міграцій..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && psql \$DATABASE_URL -f fix-currency-settings-table.sql || true"

# Запускаємо сервіс
echo "▶️ Запуск ERP сервісу..."
ssh $PROD_USER@$PROD_SERVER "systemctl start $APP_SERVICE"

# Перевіряємо статус
echo "🔍 Перевірка статусу сервісу..."
sleep 5
ssh $PROD_USER@$PROD_SERVER "systemctl is-active $APP_SERVICE && echo '✅ Сервіс активний' || echo '❌ Сервіс не активний'"

echo "📊 Показ останніх логів:"
ssh $PROD_USER@$PROD_SERVER "journalctl -u $APP_SERVICE -n 20 --no-pager"

echo "✅ Розгортання завершено!"
echo "🌐 ERP доступний за адресою: http://$PROD_SERVER:5000"