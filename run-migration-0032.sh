#!/bin/bash

# Migration 0032 Runner Script
# Скрипт для виконання міграції 0032_post_0031_complete_sync.sql

echo "🗃️ Запуск міграції 0032: Повна синхронізація після 0031..."

# Перевірка наявності файлу міграції
MIGRATION_FILE="migrations/0032_post_0031_complete_sync.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл міграції не знайдено: $MIGRATION_FILE"
    exit 1
fi

# Перевірка змінної DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Змінна DATABASE_URL не встановлена"
    echo "Налаштуйте підключення до бази даних перед запуском міграції"
    exit 1
fi

# Перевірка наявності psql
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL клієнт (psql) не встановлено"
    echo "Встановіть PostgreSQL для виконання міграції"
    exit 1
fi

# Створення резервної копії (опціонально)
BACKUP_DIR="backups"
if [ "$1" = "--backup" ]; then
    echo "📦 Створення резервної копії бази даних..."
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_before_0032_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
        echo "✅ Резервна копія створена: $BACKUP_FILE"
    else
        echo "⚠️  Не вдалося створити резервну копію, продовжую без неї"
    fi
fi

# Перевірка підключення до бази даних
echo "🔗 Перевірка підключення до бази даних..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Не вдається підключитися до бази даних"
    echo "Перевірте змінну DATABASE_URL та доступність бази даних"
    exit 1
fi

echo "✅ Підключення до бази даних успішне"

# Виконання міграції
echo "🚀 Виконання міграції 0032..."
echo "📄 Файл: $MIGRATION_FILE"
echo ""

if psql "$DATABASE_URL" -f "$MIGRATION_FILE"; then
    echo ""
    echo "✅ Міграція 0032 виконана успішно!"
    echo ""
    echo "📊 Перевірка результатів:"
    
    # Перевірка структури таблиці carriers
    echo "🔍 Структура таблиці carriers:"
    psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'carriers' ORDER BY ordinal_position;" 2>/dev/null || echo "⚠️ Не вдалося отримати структуру таблиці carriers"
    
    echo ""
    echo "🔍 Перевірка alternative_names:"
    psql "$DATABASE_URL" -c "SELECT id, name, alternative_names FROM carriers WHERE alternative_names IS NOT NULL LIMIT 3;" 2>/dev/null || echo "⚠️ Не вдалося перевірити alternative_names"
    
    echo ""
    echo "✅ Міграція завершена успішно"
else
    echo ""
    echo "❌ Помилка виконання міграції"
    echo "Перевірте логи вище для деталей"
    exit 1
fi

# Опціонально - запуск Drizzle push для синхронізації
if [ "$2" = "--drizzle-push" ] || [ "$1" = "--drizzle-push" ]; then
    echo ""
    echo "🔄 Запуск Drizzle push для синхронізації схеми..."
    if command -v npx &> /dev/null; then
        npx drizzle-kit push --config=drizzle.config.ts
        echo "✅ Drizzle push завершено"
    else
        echo "⚠️ npx не знайдено, пропускаю Drizzle push"
    fi
fi

echo ""
echo "🎉 Міграція 0032 повністю завершена!"