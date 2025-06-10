#!/bin/bash

# Прямий патч для продакшн-системи без перекомпіляції
# Виправляє помилку getUserByEmail в скомпільованому коді

echo "Застосування прямого патчу для продакшн-системи..."

SERVER="192.168.0.247"
PROJECT_DIR="/opt/REGMIK_ERP"
SERVICE_NAME="regmik-erp.service"

# Функція для виконання команд на сервері
run_on_server() {
    ssh root@$SERVER "$1"
}

# Перевірка підключення
if ! run_on_server "echo 'Connected'"; then
    echo "Помилка: Немає доступу до сервера $SERVER"
    exit 1
fi

echo "1. Зупинка сервісу..."
run_on_server "systemctl stop $SERVICE_NAME"

echo "2. Створення бекапу..."
run_on_server "cd $PROJECT_DIR && cp dist/index.js dist/index.js.backup_$(date +%Y%m%d_%H%M%S)"

echo "3. Застосування патчу до скомпільованого файлу..."
run_on_server "cd $PROJECT_DIR && cat > apply_patch.js << 'EOF'
const fs = require('fs');

// Читаємо скомпільований файл
let content = fs.readFileSync('dist/index.js', 'utf8');

// Виправляємо getUserByEmail - замінюємо users на localUsers
content = content.replace(
    /async getUserByEmail\([^}]+\}[^}]+\.from\(users\)/g,
    function(match) {
        return match.replace('.from(users)', '.from(localUsers)');
    }
);

// Виправляємо всі місця де використовується стара таблиця users для email пошуку
content = content.replace(
    /\.select\(\)\.from\(users\)\.where\(eq\(users\.email/g,
    '.select().from(localUsers).where(eq(localUsers.email'
);

// Зберігаємо виправлений файл
fs.writeFileSync('dist/index.js', content);

console.log('Патч застосовано успішно');
EOF

node apply_patch.js"

echo "4. Виправлення бази даних..."
run_on_server "sudo -u postgres psql -d regmik_erp -c \"ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;\""

echo "5. Запуск сервісу..."
run_on_server "systemctl start $SERVICE_NAME"

sleep 3

echo "6. Перевірка статусу..."
if run_on_server "systemctl is-active --quiet $SERVICE_NAME"; then
    echo "Сервіс запущено успішно"
else
    echo "Помилка запуску сервісу"
    run_on_server "journalctl -u $SERVICE_NAME -n 10 --no-pager"
    exit 1
fi

echo "7. Тестування виправлень..."

# Тест demo входу
DEMO_RESULT=$(run_on_server "curl -s -X POST http://localhost:5000/api/auth/simple-login -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"password\":\"demo123\"}' | grep -o '\"success\":true'")

# Тест відновлення паролю
FORGOT_RESULT=$(run_on_server "curl -s -X POST http://localhost:5000/api/auth/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"ihor@regmik.ua\"}' | grep -o 'відправлено'")

echo ""
echo "РЕЗУЛЬТАТИ ТЕСТУВАННЯ:"
echo "Demo вхід: $([ "$DEMO_RESULT" = '"success":true' ] && echo "Працює" || echo "Не працює")"
echo "Відновлення паролю: $([ "$FORGOT_RESULT" = 'відправлено' ] && echo "Працює" || echo "Не працює")"

# Очищення тимчасових файлів
run_on_server "cd $PROJECT_DIR && rm -f apply_patch.js"

echo ""
echo "Патч застосовано. Система доступна: http://$SERVER:5000"

exit 0