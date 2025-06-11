#!/bin/bash

# Остаточне виправлення для продакшн-сервера
# Виправляє помилку first_name в upsertUser методі

echo "Застосування остаточного виправлення для продакшн-сервера..."

SERVER="192.168.0.247"
PROJECT_DIR="/opt/REGMIK_ERP"
SERVICE_NAME="regmik-erp.service"

run_remote() {
    ssh root@$SERVER "$1"
}

if ! run_remote "echo 'Connected'"; then
    echo "Немає SSH доступу. Виконайте команди вручну на сервері:"
    echo ""
    echo "cd /opt/REGMIK_ERP"
    echo "systemctl stop regmik-erp.service"
    echo "git fetch origin && git reset --hard origin/main"
    echo "npm run build"
    echo "sudo -u postgres psql -d regmik_erp -c \"ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;\""
    echo "systemctl start regmik-erp.service"
    exit 1
fi

echo "1. Зупинка сервісу..."
run_remote "systemctl stop $SERVICE_NAME"

echo "2. Оновлення коду з Git..."
run_remote "cd $PROJECT_DIR && git fetch origin && git reset --hard origin/main"

echo "3. Встановлення залежностей..."
run_remote "cd $PROJECT_DIR && npm ci"

echo "4. Компіляція з виправленим upsertUser..."
run_remote "cd $PROJECT_DIR && npm run build"

echo "5. Виправлення бази даних..."
run_remote "sudo -u postgres psql -d regmik_erp -c \"
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
\""

echo "6. Запуск сервісу..."
run_remote "systemctl start $SERVICE_NAME"

sleep 5

echo "7. Перевірка роботи..."
STATUS=$(run_remote "systemctl is-active $SERVICE_NAME")

if [ "$STATUS" = "active" ]; then
    echo "Сервіс запущено успішно"
    
    # Тестування відновлення паролю
    echo "Тестування відновлення паролю..."
    FORGOT_TEST=$(run_remote "curl -s -X POST http://localhost:5000/api/auth/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"ihor@regmik.ua\"}'")
    
    if echo "$FORGOT_TEST" | grep -q "відправлено\|Якщо email"; then
        echo "✅ Відновлення паролю працює"
    else
        echo "❌ Помилка відновлення паролю"
        echo "Відповідь: $FORGOT_TEST"
    fi

    # Тестування demo входу
    echo "Тестування demo входу..."
    DEMO_TEST=$(run_remote "curl -s -X POST http://localhost:5000/api/auth/simple-login -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"password\":\"demo123\"}'")
    
    if echo "$DEMO_TEST" | grep -q "success.*true"; then
        echo "✅ Demo вхід працює"
    else
        echo "❌ Помилка demo входу"
        echo "Відповідь: $DEMO_TEST"
    fi
    
else
    echo "❌ Помилка запуску сервісу"
    run_remote "journalctl -u $SERVICE_NAME -n 15 --no-pager"
fi

echo ""
echo "Система доступна: http://$SERVER:5000"
echo "Для перегляду логів: ssh root@$SERVER journalctl -u $SERVICE_NAME -f"

exit 0