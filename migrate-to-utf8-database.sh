#!/bin/bash

# Міграція до нової бази даних з UTF-8 кодуванням
# Цей скрипт створює нову базу з правильним кодуванням та мігрує всі дані

set -e

APP_DIR="/var/www/regmik-erp"
SERVICE_NAME="regmik-erp"
OLD_DB="regmik-erp"
NEW_DB="regmik-erp-utf8"
BACKUP_DIR="/tmp/db-migration-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Початок міграції до UTF-8 бази даних..."
echo "Створюється backup директорія: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Зупинка сервісу
echo "⏹️ Зупинка сервісу..."
systemctl stop "$SERVICE_NAME" || true

# Створення повного backup поточної бази
echo "💾 Створення backup поточної бази..."
sudo -u postgres pg_dump -Fc "$OLD_DB" > "$BACKUP_DIR/old-database.backup"
echo "Backup збережено: $BACKUP_DIR/old-database.backup"

# Створення нової бази з UTF-8 кодуванням
echo "🆕 Створення нової бази з UTF-8 кодуванням..."
sudo -u postgres psql << EOF
-- Відключення з'єднань до старої бази
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$OLD_DB' AND pid <> pg_backend_pid();

-- Створення нової бази з правильним кодуванням
DROP DATABASE IF EXISTS "$NEW_DB";
CREATE DATABASE "$NEW_DB" 
  WITH ENCODING 'UTF8' 
       LC_COLLATE 'uk_UA.UTF-8' 
       LC_CTYPE 'uk_UA.UTF-8' 
       TEMPLATE template0;

-- Надання прав користувачу
GRANT ALL PRIVILEGES ON DATABASE "$NEW_DB" TO postgres;
EOF

echo "✅ Нова база '$NEW_DB' створена з UTF-8 кодуванням"

# Відновлення даних в нову базу
echo "📥 Відновлення даних в нову базу..."
sudo -u postgres pg_restore -d "$NEW_DB" "$BACKUP_DIR/old-database.backup"

# Перевірка кодування нової бази
echo "🔍 Перевірка кодування нової бази..."
sudo -u postgres psql -d "$NEW_DB" -c "SHOW server_encoding; SHOW client_encoding; SHOW lc_collate; SHOW lc_ctype;"

# Backup конфігурації
echo "💾 Backup конфігурації..."
cp "$APP_DIR/.env" "$BACKUP_DIR/env.backup" 2>/dev/null || echo "Файл .env не знайдено"

# Оновлення DATABASE_URL в конфігурації
echo "⚙️ Оновлення конфігурації..."
if [ -f "$APP_DIR/.env" ]; then
    # Створення backup .env файлу
    cp "$APP_DIR/.env" "$APP_DIR/.env.backup"
    
    # Оновлення DATABASE_URL
    sed -i "s/DATABASE_URL=.*regmik-erp/DATABASE_URL=postgresql:\/\/postgres@localhost:5432\/$NEW_DB/" "$APP_DIR/.env"
    echo "DATABASE_URL оновлено для нової бази"
else
    echo "⚠️ Файл .env не знайдено, потрібно вручну налаштувати DATABASE_URL"
fi

# Тестування з'єднання з новою базою
echo "🔗 Тестування з'єднання з новою базою..."
cd "$APP_DIR"
DATABASE_URL="postgresql://postgres@localhost:5432/$NEW_DB" npm run db:push || echo "Помилка при тестуванні schema"

# Запуск сервісу
echo "▶️ Запуск сервісу..."
systemctl start "$SERVICE_NAME"

# Очікування запуску
echo "⏳ Очікування запуску сервісу..."
sleep 10

# Тестування Unicode пошуку
echo "🧪 Тестування Unicode пошуку..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Сервіс запущено, тестуємо пошук..."
    sleep 5
    
    # Тест діагностики
    DIAGNOSTIC_RESULT=$(curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че" 2>/dev/null || echo "failed")
    
    if [[ "$DIAGNOSTIC_RESULT" == *"1451"* ]]; then
        echo "🎉 УСПІХ! UTF-8 пошук працює правильно!"
        echo "Знайдено 1451 міст для запиту 'че'"
        
        # Додаткові тести
        echo "Додаткові тести..."
        CHERNIVTSI_TEST=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Чернівці" 2>/dev/null | jq '.length // 0' 2>/dev/null || echo "0")
        KYIV_TEST=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Київ" 2>/dev/null | jq '.length // 0' 2>/dev/null || echo "0")
        
        echo "Чернівці: $CHERNIVTSI_TEST результатів"
        echo "Київ: $KYIV_TEST результатів"
        
        if [ "$CHERNIVTSI_TEST" -gt 0 ] && [ "$KYIV_TEST" -gt 0 ]; then
            echo "✅ Всі тести пройдені успішно!"
            echo ""
            echo "🔄 Остаточні кроки:"
            echo "1. Перевірте роботу системи"
            echo "2. Після підтвердження видаліть стару базу: DROP DATABASE \"$OLD_DB\";"
            echo "3. Перейменуйте нову базу: ALTER DATABASE \"$NEW_DB\" RENAME TO \"$OLD_DB\";"
            echo ""
            echo "📁 Backup файли зберігаються в: $BACKUP_DIR"
        else
            echo "⚠️ Деякі тести не пройшли, перевірте логи"
        fi
    else
        echo "❌ Тести не пройшли. Відповідь сервера: $DIAGNOSTIC_RESULT"
        echo "Можливо потрібен rollback..."
    fi
else
    echo "❌ Сервіс не запустився, перевірте логи"
    echo "Для rollback виконайте: systemctl stop $SERVICE_NAME && cp $APP_DIR/.env.backup $APP_DIR/.env && systemctl start $SERVICE_NAME"
fi

echo ""
echo "📋 Інформація про міграцію:"
echo "Стара база: $OLD_DB"
echo "Нова база: $NEW_DB"
echo "Backup: $BACKUP_DIR"
echo "Логи сервісу: journalctl -u $SERVICE_NAME -f"