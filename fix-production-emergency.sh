#!/bin/bash

# Аварійне виправлення продакшн-системи REGMIK ERP
# Проблема: getUserByEmail використовує стару таблицю users замість local_users

echo "🚨 АВАРІЙНЕ ВИПРАВЛЕННЯ ПРОДАКШН-СИСТЕМИ"
echo "Виправлення помилки: column 'first_name' does not exist"

# Перевірка прав
if [ "$EUID" -ne 0 ]; then 
    echo "ПОМИЛКА: Запустіть з правами root"
    exit 1
fi

# Змінні
PROJECT_DIR="/opt/REGMIK_ERP"
SERVICE_NAME="regmik-erp.service"

cd "$PROJECT_DIR" || exit 1

echo "1. Зупинка сервісу..."
systemctl stop "$SERVICE_NAME"

echo "2. Бекап поточного стану..."
cp -r dist "dist_emergency_backup_$(date +%Y%m%d_%H%M%S)"

echo "3. Завантаження останнього коду..."
git fetch origin
git reset --hard origin/main

echo "4. Установка залежностей..."
npm ci

echo "5. Компіляція проекту..."
npm run build

echo "6. Виправлення бази даних..."
sudo -u postgres psql -d regmik_erp << 'EOF'
-- Додаємо відсутні колонки до email_settings
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- Перевіряємо структуру таблиць
\echo 'Структура local_users:'
\d local_users;
\echo 'Структура email_settings:'
\d email_settings;
EOF

echo "7. Запуск сервісу..."
systemctl start "$SERVICE_NAME"

sleep 3

echo "8. Перевірка статусу..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Сервіс запущено успішно"
else
    echo "❌ Помилка запуску сервісу"
    journalctl -u "$SERVICE_NAME" -n 10 --no-pager
    exit 1
fi

echo "9. Тестування API..."
echo "Тест 1: Demo вхід"
DEMO_RESULT=$(curl -s -X POST http://localhost:5000/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' | grep -o '"success":true')

if [ "$DEMO_RESULT" = '"success":true' ]; then
    echo "✅ Demo вхід працює"
else
    echo "❌ Demo вхід не працює"
fi

echo "Тест 2: Відновлення паролю"
FORGOT_RESULT=$(curl -s -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ihor@regmik.ua"}' | grep -o 'відправлено')

if [ "$FORGOT_RESULT" = 'відправлено' ]; then
    echo "✅ Відновлення паролю працює"
else
    echo "❌ Відновлення паролю не працює"
fi

echo ""
echo "🎉 АВАРІЙНЕ ВИПРАВЛЕННЯ ЗАВЕРШЕНО"
echo "📊 Результати:"
echo "   - Сервіс: $(systemctl is-active $SERVICE_NAME)"
echo "   - Demo вхід: $([ "$DEMO_RESULT" = '"success":true' ] && echo "Працює" || echo "Не працює")"
echo "   - Відновлення паролю: $([ "$FORGOT_RESULT" = 'відправлено' ] && echo "Працює" || echo "Не працює")"
echo ""
echo "🌐 Система доступна: http://192.168.0.247:5000"

exit 0