#!/bin/bash

# Rollback скрипт для відновлення оригінальної бази з backup

set -e

SERVICE_NAME="regmik-erp"
OLD_DB="regmik-erp"
BACKUP_DB="regmikerp_bak"

echo "🔄 Початок rollback міграції бази даних..."
echo "Відновлення: $BACKUP_DB -> $OLD_DB"

# Зупинка сервісу
echo "⏹️ Зупинка сервісу..."
systemctl stop "$SERVICE_NAME" || true

# Перевірка існування backup бази
echo "🔍 Перевірка наявності backup бази..."
BACKUP_EXISTS=$(sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -w "$BACKUP_DB" | wc -l)

if [ "$BACKUP_EXISTS" -eq 0 ]; then
    echo "❌ Backup база '$BACKUP_DB' не знайдена!"
    echo "Доступні бази:"
    sudo -u postgres psql -l
    exit 1
fi

echo "✅ Backup база '$BACKUP_DB' знайдена"

# Відключення з'єднань та видалення поточної бази
echo "🗑️ Видалення поточної бази '$OLD_DB'..."
sudo -u postgres psql << EOF
-- Відключення з'єднань
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$OLD_DB' AND pid <> pg_backend_pid();

-- Видалення поточної бази
DROP DATABASE IF EXISTS "$OLD_DB";
EOF

# Перейменування backup бази назад в оригінальну
echo "🔄 Відновлення backup бази '$BACKUP_DB' -> '$OLD_DB'..."
sudo -u postgres psql << EOF
ALTER DATABASE "$BACKUP_DB" RENAME TO "$OLD_DB";
EOF

echo "✅ База відновлена з backup"

# Запуск сервісу
echo "▶️ Запуск сервісу..."
systemctl start "$SERVICE_NAME"

# Перевірка запуску
echo "⏳ Очікування запуску сервісу..."
sleep 10

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Сервіс успішно запущено"
    
    # Перевірка кодування відновленої бази
    echo "🔍 Перевірка кодування відновленої бази..."
    sudo -u postgres psql -d "$OLD_DB" -c "SELECT 'Server Encoding: ' || setting FROM pg_settings WHERE name = 'server_encoding';"
    
    echo ""
    echo "🎯 Rollback завершено успішно!"
    echo "Оригінальна база '$OLD_DB' відновлена з backup"
else
    echo "❌ Помилка запуску сервісу після rollback"
    echo "Перевірте логи: journalctl -u $SERVICE_NAME -n 20"
fi