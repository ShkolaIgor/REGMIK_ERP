#!/bin/bash

# Скрипт для виправлення критичних помилок в продакшн-системі REGMIK ERP
# Версія: 2.0
# Дата: 2025-06-10

set -e  # Зупинка при помилці

echo "🔧 Початок оновлення продакшн-системи REGMIK ERP..."

# Перевірка, що скрипт запущено з root правами
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Помилка: Скрипт повинен бути запущено з правами root"
    exit 1
fi

# Змінні
PROJECT_DIR="/opt/REGMIK_ERP"
BACKUP_DIR="/opt/backups/regmik_erp"
SERVICE_NAME="regmik-erp.service"
DB_NAME="regmik_erp"
DB_USER="postgres"

# Створення директорії для бекапів
mkdir -p "$BACKUP_DIR"

echo "📁 Робоча директорія: $PROJECT_DIR"

# Перехід в робочу директорію
cd "$PROJECT_DIR"

echo "⏹️  Зупинка сервісу..."
systemctl stop "$SERVICE_NAME" || echo "⚠️  Сервіс вже зупинено"

echo "💾 Створення бекапу поточної версії..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/regmik_erp_backup_$TIMESTAMP.tar.gz" dist/ || echo "⚠️  Помилка створення бекапу"

echo "📥 Оновлення коду з Git..."
git fetch origin
git pull origin main

echo "🔨 Компіляція проекту..."
npm run build

echo "🗄️  Виправлення схеми бази даних..."
# Створення SQL скрипта для виправлення
cat > fix_schema.sql << 'EOF'
-- Додаємо відсутню колонку created_at до таблиці email_settings
ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Оновлюємо існуючі записи, якщо created_at = NULL
UPDATE email_settings 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;

-- Перевіряємо структуру таблиць
\d email_settings;
\d local_users;
EOF

# Виконання SQL скрипта
sudo -u postgres psql -d "$DB_NAME" -f fix_schema.sql

echo "🚀 Запуск сервісу..."
systemctl start "$SERVICE_NAME"

echo "⏳ Очікування запуску сервісу..."
sleep 5

echo "✅ Перевірка статусу сервісу..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Сервіс успішно запущено"
    systemctl status "$SERVICE_NAME" --no-pager -l
else
    echo "❌ Помилка запуску сервісу"
    echo "📋 Останні логи:"
    journalctl -u "$SERVICE_NAME" -n 20 --no-pager
    exit 1
fi

echo "🧪 Тестування API endpoints..."

# Тестування basic endpoints
echo "Тестування /api/auth/user..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/user && echo " - OK" || echo " - Помилка"

echo "Тестування /api/products..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/products && echo " - OK" || echo " - Помилка"

echo "🔍 Перевірка логів на помилки..."
if journalctl -u "$SERVICE_NAME" -n 50 --no-pager | grep -i "error\|exception\|failed" | tail -5; then
    echo "⚠️  Знайдено помилки в логах (показано останні 5)"
else
    echo "✅ Критичних помилок не знайдено"
fi

echo ""
echo "🎉 Оновлення завершено!"
echo "📊 Статистика:"
echo "   - Бекап збережено: $BACKUP_DIR/regmik_erp_backup_$TIMESTAMP.tar.gz"
echo "   - Сервіс статус: $(systemctl is-active $SERVICE_NAME)"
echo "   - Час завершення: $(date)"
echo ""
echo "🌐 Система доступна за адресою: http://192.168.0.247:5000"
echo ""
echo "📝 Для перевірки функціоналу:"
echo "   1. Demo вхід: логін 'demo', пароль 'demo123'"
echo "   2. Відновлення паролю: ihor@regmik.ua"
echo "   3. Налаштування email: перевірити збереження"

# Очищення тимчасових файлів
rm -f fix_schema.sql

exit 0