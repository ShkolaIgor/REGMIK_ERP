#!/bin/bash

# Universal Migration Runner Script
# Універсальний скрипт для запуску міграцій

MIGRATION_DIR="migrations"

# Функція показу допомоги
show_help() {
    echo "Використання: ./run-migration.sh [OPTIONS] [MIGRATION_FILE]"
    echo ""
    echo "Опції:"
    echo "  --backup          Створити резервну копію перед міграцією"
    echo "  --list            Показати всі доступні міграції"
    echo "  --latest          Запустити останню міграцію"
    echo "  --drizzle-push    Запустити drizzle push після міграції"
    echo "  --help            Показати цю довідку"
    echo ""
    echo "Приклади:"
    echo "  ./run-migration.sh 0032_post_0031_complete_sync.sql"
    echo "  ./run-migration.sh --backup --latest"
    echo "  ./run-migration.sh --list"
}

# Функція показу списку міграцій
list_migrations() {
    echo "📋 Доступні міграції в $MIGRATION_DIR:"
    if [ -d "$MIGRATION_DIR" ]; then
        find "$MIGRATION_DIR" -name "*.sql" -type f | sort | while read -r file; do
            echo "  - $(basename "$file")"
        done
    else
        echo "❌ Директорія міграцій не знайдена: $MIGRATION_DIR"
    fi
}

# Функція знаходження останньої міграції
get_latest_migration() {
    if [ -d "$MIGRATION_DIR" ]; then
        find "$MIGRATION_DIR" -name "*.sql" -type f | sort | tail -1
    fi
}

# Функція створення резервної копії
create_backup() {
    local backup_dir="backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local migration_name=$(basename "$1" .sql)
    local backup_file="$backup_dir/backup_before_${migration_name}_${timestamp}.sql"
    
    echo "📦 Створення резервної копії..."
    mkdir -p "$backup_dir"
    
    if pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
        echo "✅ Резервна копія створена: $backup_file"
        return 0
    else
        echo "⚠️  Не вдалося створити резервну копію"
        return 1
    fi
}

# Функція виконання міграції
run_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    echo "🗃️ Запуск міграції: $migration_name"
    echo "📄 Файл: $migration_file"
    echo ""
    
    if psql "$DATABASE_URL" -f "$migration_file"; then
        echo ""
        echo "✅ Міграція $migration_name виконана успішно!"
        return 0
    else
        echo ""
        echo "❌ Помилка виконання міграції $migration_name"
        return 1
    fi
}

# Перевірка аргументів
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

# Парсинг аргументів
BACKUP=false
LIST=false
LATEST=false
DRIZZLE_PUSH=false
MIGRATION_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP=true
            shift
            ;;
        --list)
            LIST=true
            shift
            ;;
        --latest)
            LATEST=true
            shift
            ;;
        --drizzle-push)
            DRIZZLE_PUSH=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *.sql)
            MIGRATION_FILE="$1"
            shift
            ;;
        *)
            # Якщо файл без розширення, додаємо .sql
            if [ -f "$MIGRATION_DIR/$1.sql" ]; then
                MIGRATION_FILE="$MIGRATION_DIR/$1.sql"
            elif [ -f "$MIGRATION_DIR/$1" ]; then
                MIGRATION_FILE="$MIGRATION_DIR/$1"
            else
                MIGRATION_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Виконання команд
if [ "$LIST" = true ]; then
    list_migrations
    exit 0
fi

if [ "$LATEST" = true ]; then
    MIGRATION_FILE=$(get_latest_migration)
    if [ -z "$MIGRATION_FILE" ]; then
        echo "❌ Не знайдено жодної міграції"
        exit 1
    fi
    echo "🔍 Знайдено останню міграцію: $(basename "$MIGRATION_FILE")"
fi

# Перевірка наявності файлу міграції
if [ -z "$MIGRATION_FILE" ]; then
    echo "❌ Не вказано файл міграції"
    show_help
    exit 1
fi

# Якщо файл не містить шлях, шукаємо в директорії міграцій
if [[ "$MIGRATION_FILE" != */* ]]; then
    MIGRATION_FILE="$MIGRATION_DIR/$MIGRATION_FILE"
fi

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Файл міграції не знайдено: $MIGRATION_FILE"
    list_migrations
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

# Перевірка підключення до бази даних
echo "🔗 Перевірка підключення до бази даних..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Не вдається підключитися до бази даних"
    echo "Перевірте змінну DATABASE_URL та доступність бази даних"
    exit 1
fi

echo "✅ Підключення до бази даних успішне"

# Створення резервної копії якщо потрібно
if [ "$BACKUP" = true ]; then
    create_backup "$MIGRATION_FILE"
fi

# Виконання міграції
if run_migration "$MIGRATION_FILE"; then
    # Запуск Drizzle push якщо потрібно
    if [ "$DRIZZLE_PUSH" = true ]; then
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
    echo "🎉 Міграція повністю завершена!"
else
    exit 1
fi