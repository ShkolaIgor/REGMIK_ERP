#!/bin/bash

# Скрипт для завантаження виправлених файлів на продакшн-сервер
# Використовується коли Git не синхронізується

echo "Пряме завантаження виправлених файлів на продакшн-сервер"

# Налаштування
SERVER="192.168.0.247"
PROJECT_DIR="/opt/REGMIK_ERP"
SERVICE_NAME="regmik-erp.service"

# Перевірка SSH доступу
if ! ssh -o ConnectTimeout=5 root@$SERVER "echo 'SSH OK'"; then
    echo "ПОМИЛКА: Немає SSH доступу до сервера $SERVER"
    exit 1
fi

echo "1. Створення бекапу на сервері..."
ssh root@$SERVER "
cd $PROJECT_DIR
systemctl stop $SERVICE_NAME
cp -r dist dist_backup_direct_$(date +%Y%m%d_%H%M%S)
"

echo "2. Копіювання виправлених файлів..."

# Копіюємо основні виправлені файли
scp server/simple-auth.ts root@$SERVER:$PROJECT_DIR/server/
scp server/db-storage.ts root@$SERVER:$PROJECT_DIR/server/
scp server/routes.ts root@$SERVER:$PROJECT_DIR/server/
scp shared/schema.ts root@$SERVER:$PROJECT_DIR/shared/
scp client/src/pages/profile.tsx root@$SERVER:$PROJECT_DIR/client/src/pages/

echo "3. Компіляція на сервері..."
ssh root@$SERVER "
cd $PROJECT_DIR
npm run build
"

echo "4. Виправлення бази даних..."
ssh root@$SERVER "
sudo -u postgres psql -d regmik_erp -c \"ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;\"
sudo -u postgres psql -d regmik_erp -c \"UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;\"
"

echo "5. Запуск сервісу..."
ssh root@$SERVER "
systemctl start $SERVICE_NAME
sleep 3
systemctl status $SERVICE_NAME --no-pager
"

echo "6. Тестування..."
DEMO_TEST=$(ssh root@$SERVER "curl -s -X POST http://localhost:5000/api/auth/simple-login -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"password\":\"demo123\"}' | grep -o '\"success\":true'")

FORGOT_TEST=$(ssh root@$SERVER "curl -s -X POST http://localhost:5000/api/auth/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"ihor@regmik.ua\"}' | grep -o 'відправлено'")

echo ""
echo "РЕЗУЛЬТАТИ:"
echo "Demo вхід: $([ "$DEMO_TEST" = '"success":true' ] && echo "Працює" || echo "Не працює")"
echo "Відновлення паролю: $([ "$FORGOT_TEST" = 'відправлено' ] && echo "Працює" || echo "Не працює")"
echo ""
echo "Продакшн-система оновлена: http://$SERVER:5000"

exit 0