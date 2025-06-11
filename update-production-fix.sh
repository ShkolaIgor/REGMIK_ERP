#!/bin/bash

# Спеціальний скрипт для виправлення getUserByEmail на продакшн-сервері
# Проблема: compiled код все ще використовує стару таблицю users

echo "Виправлення getUserByEmail на продакшн-сервері..."

# Функція для виконання команд на сервері
run_remote() {
    ssh root@192.168.0.247 "$1"
}

# Перевірка доступу
if ! run_remote "echo 'Connected'"; then
    echo "Помилка: Немає SSH доступу до 192.168.0.247"
    echo "Виконайте команди вручну на сервері:"
    echo ""
    echo "cd /opt/REGMIK_ERP"
    echo "systemctl stop regmik-erp.service"
    echo "cp dist/index.js dist/index.js.backup_\$(date +%Y%m%d_%H%M%S)"
    echo ""
    echo "# Пряме виправлення в compiled файлі:"
    echo "sed -i 's/\\.select().from(users).where(eq(users\\.email/\\.select().from(localUsers).where(eq(localUsers.email/g' dist/index.js"
    echo "sed -i 's/\\.from(users)/\\.from(localUsers)/g' dist/index.js"
    echo ""
    echo "# Виправлення бази даних:"
    echo "sudo -u postgres psql -d regmik_erp -c \"ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;\""
    echo ""
    echo "systemctl start regmik-erp.service"
    exit 1
fi

echo "1. Зупинка сервісу..."
run_remote "systemctl stop regmik-erp.service"

echo "2. Створення бекапу..."
run_remote "cd /opt/REGMIK_ERP && cp dist/index.js dist/index.js.backup_\$(date +%Y%m%d_%H%M%S)"

echo "3. Пряме виправлення getUserByEmail в compiled файлі..."
run_remote "cd /opt/REGMIK_ERP && sed -i 's/\\.select().from(users).where(eq(users\\.email/\\.select().from(localUsers).where(eq(localUsers.email/g' dist/index.js"

echo "4. Виправлення всіх посилань на стару таблицю users..."
run_remote "cd /opt/REGMIK_ERP && sed -i 's/\\.from(users)/\\.from(localUsers)/g' dist/index.js"

echo "5. Виправлення бази даних..."
run_remote "sudo -u postgres psql -d regmik_erp -c \"ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP; UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;\""

echo "6. Запуск сервісу..."
run_remote "systemctl start regmik-erp.service"

sleep 3

echo "7. Перевірка статусу..."
STATUS=$(run_remote "systemctl is-active regmik-erp.service")
if [ "$STATUS" = "active" ]; then
    echo "Сервіс запущено успішно"
else
    echo "Помилка запуску сервісу"
    run_remote "journalctl -u regmik-erp.service -n 10 --no-pager"
    exit 1
fi

echo "8. Тестування виправлених функцій..."

# Тест відновлення паролю
echo "Тестування відновлення паролю..."
FORGOT_TEST=$(run_remote "curl -s -X POST http://localhost:5000/api/auth/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"ihor@regmik.ua\"}' | head -1")

if echo "$FORGOT_TEST" | grep -q "відправлено\|Якщо email"; then
    echo "✅ Відновлення паролю працює"
else
    echo "❌ Відновлення паролю не працює: $FORGOT_TEST"
fi

# Тест demo входу
echo "Тестування demo входу..."
DEMO_TEST=$(run_remote "curl -s -X POST http://localhost:5000/api/auth/simple-login -H 'Content-Type: application/json' -d '{\"username\":\"demo\",\"password\":\"demo123\"}' | head -1")

if echo "$DEMO_TEST" | grep -q "success.*true"; then
    echo "✅ Demo вхід працює"
else
    echo "❌ Demo вхід не працює: $DEMO_TEST"
fi

echo ""
echo "Виправлення завершено. Перевірте систему: http://192.168.0.247:5000"
echo "Логи сервісу: journalctl -u regmik-erp.service -f"

exit 0