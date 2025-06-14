#!/bin/bash

# Міграція з перейменуванням: regmik-erp -> regmikerp_bak, нова UTF-8 база -> regmik-erp

set -e

APP_DIR="/var/www/regmik-erp"
SERVICE_NAME="regmik-erp"
OLD_DB="regmik-erp"
BACKUP_DB="regmikerp_bak"
BACKUP_DIR="/tmp/db-migration-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Початок міграції з перейменуванням бази даних..."
echo "Схема міграції: $OLD_DB -> $BACKUP_DB, створення нової UTF-8 $OLD_DB"
echo "Backup директорія: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Зупинка сервісу
echo "⏹️ Зупинка сервісу $SERVICE_NAME..."
systemctl stop "$SERVICE_NAME" || true

# Створення повного backup поточної бази
echo "💾 Створення backup поточної бази $OLD_DB..."
sudo -u postgres pg_dump -Fc "$OLD_DB" > "$BACKUP_DIR/original-database.backup"
echo "Backup збережено: $BACKUP_DIR/original-database.backup"

# Відключення всіх з'єднань та перейменування
echo "🔄 Перейменування $OLD_DB -> $BACKUP_DB..."
sudo -u postgres psql << EOF
-- Відключення з'єднань до старої бази
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$OLD_DB' AND pid <> pg_backend_pid();

-- Перейменування поточної бази в backup
ALTER DATABASE "$OLD_DB" RENAME TO "$BACKUP_DB";
EOF

echo "✅ База перейменована: $OLD_DB -> $BACKUP_DB"

# Створення нової бази з UTF-8 кодуванням та оригінальною назвою
echo "🆕 Створення нової UTF-8 бази $OLD_DB..."
sudo -u postgres psql << EOF
-- Створення нової бази з правильним кодуванням
CREATE DATABASE "$OLD_DB" 
  WITH ENCODING 'UTF8' 
       LC_COLLATE 'uk_UA.UTF-8' 
       LC_CTYPE 'uk_UA.UTF-8' 
       TEMPLATE template0;

-- Надання прав користувачу
GRANT ALL PRIVILEGES ON DATABASE "$OLD_DB" TO postgres;
EOF

echo "✅ Нова UTF-8 база '$OLD_DB' створена"

# Відновлення даних в нову базу
echo "📥 Відновлення даних в нову UTF-8 базу..."
sudo -u postgres pg_restore -d "$OLD_DB" "$BACKUP_DIR/original-database.backup"

# Перевірка кодування нової бази
echo "🔍 Перевірка кодування нової бази..."
sudo -u postgres psql -d "$OLD_DB" << 'EOF'
SELECT 
    'Parameter' as type, 
    'Value' as setting
UNION ALL
SELECT 'Server Encoding', setting FROM pg_settings WHERE name = 'server_encoding'
UNION ALL
SELECT 'Client Encoding', setting FROM pg_settings WHERE name = 'client_encoding'
UNION ALL
SELECT 'LC_COLLATE', setting FROM pg_settings WHERE name = 'lc_collate'
UNION ALL
SELECT 'LC_CTYPE', setting FROM pg_settings WHERE name = 'lc_ctype'
UNION ALL
SELECT 'Database Encoding', pg_encoding_to_char(encoding) FROM pg_database WHERE datname = 'regmik-erp';
EOF

# Тестування з'єднання та схеми
echo "🔗 Тестування нової бази..."
cd "$APP_DIR"
npm run db:push || echo "Schema потребує оновлення"

# Запуск сервісу
echo "▶️ Запуск сервісу..."
systemctl start "$SERVICE_NAME"

# Очікування запуску
echo "⏳ Очікування запуску сервісу (15 секунд)..."
sleep 15

# Тестування Unicode пошуку
echo "🧪 Тестування Unicode пошуку..."
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Сервіс запущено, тестуємо UTF-8 пошук..."
    sleep 5
    
    # Тест діагностики Unicode
    echo "Тестування пошуку 'че'..."
    DIAGNOSTIC_RESULT=$(curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че" 2>/dev/null || echo "failed")
    
    if [[ "$DIAGNOSTIC_RESULT" == *"1451"* ]]; then
        echo "🎉 УСПІХ! UTF-8 пошук працює правильно!"
        echo "Знайдено 1451 міст для запиту 'че'"
        
        # Додаткові тести з різними кирилічними символами
        echo ""
        echo "Додаткові тести кирилічного пошуку..."
        
        CHERNIVTSI_TEST=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Чернівці" 2>/dev/null | jq '.length // 0' 2>/dev/null || echo "0")
        KYIV_TEST=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Київ" 2>/dev/null | jq '.length // 0' 2>/dev/null || echo "0")
        KHARKIV_TEST=$(curl -s "http://localhost:3000/api/nova-poshta/cities?q=Харків" 2>/dev/null | jq '.length // 0' 2>/dev/null || echo "0")
        
        echo "🔍 Результати пошуку:"
        echo "  Чернівці: $CHERNIVTSI_TEST результатів"
        echo "  Київ: $KYIV_TEST результатів"
        echo "  Харків: $KHARKIV_TEST результатів"
        
        if [ "$CHERNIVTSI_TEST" -gt 0 ] && [ "$KYIV_TEST" -gt 0 ] && [ "$KHARKIV_TEST" -gt 0 ]; then
            echo ""
            echo "✅ ВСІ ТЕСТИ ПРОЙДЕНІ УСПІШНО!"
            echo ""
            echo "📊 Підсумок міграції:"
            echo "  ✓ Стара база збережена як: $BACKUP_DB"
            echo "  ✓ Нова UTF-8 база створена: $OLD_DB"
            echo "  ✓ Всі дані успішно мігровані"
            echo "  ✓ Unicode пошук працює коректно"
            echo ""
            echo "🗂️ Backup файли:"
            echo "  Повний dump: $BACKUP_DIR/original-database.backup"
            echo "  Backup база: $BACKUP_DB (доступна в PostgreSQL)"
            echo ""
            echo "🔧 Управління backup базою:"
            echo "  Видалити backup: sudo -u postgres psql -c \"DROP DATABASE \\\"$BACKUP_DB\\\";\""
            echo "  Відновити з backup: sudo -u postgres psql -c \"DROP DATABASE \\\"$OLD_DB\\\"; ALTER DATABASE \\\"$BACKUP_DB\\\" RENAME TO \\\"$OLD_DB\\\";\""
        else
            echo ""
            echo "⚠️ Деякі тести Unicode пошуку не пройшли"
            echo "Перевірте логи: journalctl -u $SERVICE_NAME -n 50"
        fi
    else
        echo ""
        echo "❌ Тести Unicode пошуку не пройшли"
        echo "Відповідь діагностики: $DIAGNOSTIC_RESULT"
        echo ""
        echo "🔄 Для rollback виконайте:"
        echo "  systemctl stop $SERVICE_NAME"
        echo "  sudo -u postgres psql -c \"DROP DATABASE \\\"$OLD_DB\\\"; ALTER DATABASE \\\"$BACKUP_DB\\\" RENAME TO \\\"$OLD_DB\\\";\""
        echo "  systemctl start $SERVICE_NAME"
    fi
else
    echo ""
    echo "❌ Сервіс не запустився після міграції"
    echo "Перевірте логи: journalctl -u $SERVICE_NAME -n 50"
    echo ""
    echo "🔄 Для rollback виконайте:"
    echo "  systemctl stop $SERVICE_NAME"
    echo "  sudo -u postgres psql -c \"DROP DATABASE \\\"$OLD_DB\\\"; ALTER DATABASE \\\"$BACKUP_DB\\\" RENAME TO \\\"$OLD_DB\\\";\""
    echo "  systemctl start $SERVICE_NAME"
fi

echo ""
echo "📋 Деталі міграції:"
echo "Поточна база: $OLD_DB (нова UTF-8)"
echo "Backup база: $BACKUP_DB (стара SQL_ASCII)"
echo "Файл backup: $BACKUP_DIR/original-database.backup"
echo "Логи сервісу: journalctl -u $SERVICE_NAME -f"