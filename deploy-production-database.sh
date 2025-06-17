#!/bin/bash

# Production Database Deployment Script
# Ukrainian ERP System - Complete Database Setup
# Usage: ./deploy-production-database.sh [DATABASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    print_error "psql не знайдено. Встановіть PostgreSQL клієнт."
    exit 1
fi

# Get database URL
if [ -z "$1" ]; then
    read -p "Введіть DATABASE_URL для продакшн бази даних: " DATABASE_URL
else
    DATABASE_URL="$1"
fi

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL не може бути порожнім"
    exit 1
fi

print_status "Підготовка до розгортання бази даних..."

# Check if production-complete.sql exists
if [ ! -f "production-complete.sql" ]; then
    print_error "Файл production-complete.sql не знайдено"
    exit 1
fi

# Test database connection
print_status "Тестування з'єднання з базою даних..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "Не вдалося підключитися до бази даних"
    print_error "Перевірте DATABASE_URL: $DATABASE_URL"
    exit 1
fi

print_success "З'єднання з базою даних успішне"

# Create backup of existing database (if tables exist)
print_status "Створення резервної копії існуючих даних..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

# Check if any tables exist
TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLES_COUNT" -gt "0" ]; then
    print_warning "Знайдено $TABLES_COUNT таблиць в базі даних"
    read -p "Створити резервну копію перед продовженням? (y/N): " CREATE_BACKUP
    
    if [[ $CREATE_BACKUP =~ ^[Yy]$ ]]; then
        print_status "Створення резервної копії в $BACKUP_FILE..."
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        print_success "Резервна копія створена: $BACKUP_FILE"
    fi
else
    print_status "База даних порожня, резервна копія не потрібна"
fi

# Warning about destructive operation
if [ "$TABLES_COUNT" -gt "0" ]; then
    print_warning "УВАГА: Цей скрипт створить нові таблиці та може змінити існуючі дані"
    print_warning "Переконайтеся, що у вас є резервна копія важливих даних"
    read -p "Продовжити розгортання? (y/N): " CONFIRM_DEPLOY
    
    if [[ ! $CONFIRM_DEPLOY =~ ^[Yy]$ ]]; then
        print_status "Розгортання скасовано користувачем"
        exit 0
    fi
fi

# Apply the production SQL
print_status "Застосування структури бази даних для продакшн..."
print_status "Це може зайняти кілька хвилин..."

if psql "$DATABASE_URL" -f production-complete.sql > deployment.log 2>&1; then
    print_success "База даних успішно розгорнута!"
else
    print_error "Помилка при розгортанні бази даних"
    print_error "Перевірте файл deployment.log для деталей"
    exit 1
fi

# Verify deployment
print_status "Перевірка розгортання..."

# Check if essential tables exist
ESSENTIAL_TABLES=("local_users" "sessions" "companies" "departments" "positions" "workers" "products" "clients" "orders" "user_roles" "system_modules")
MISSING_TABLES=()

for table in "${ESSENTIAL_TABLES[@]}"; do
    if ! psql "$DATABASE_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | grep -q 1; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -eq 0 ]; then
    print_success "Всі основні таблиці створені успішно"
else
    print_error "Відсутні таблиці: ${MISSING_TABLES[*]}"
    exit 1
fi

# Check if default data was inserted
print_status "Перевірка початкових даних..."

USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM local_users;" | tr -d ' ')
ROLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM user_roles;" | tr -d ' ')
MODULE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM system_modules;" | tr -d ' ')

print_status "Користувачів: $USER_COUNT"
print_status "Ролей: $ROLE_COUNT"
print_status "Модулів системи: $MODULE_COUNT"

if [ "$USER_COUNT" -gt "0" ] && [ "$ROLE_COUNT" -gt "0" ] && [ "$MODULE_COUNT" -gt "0" ]; then
    print_success "Початкові дані завантажені успішно"
else
    print_warning "Деякі початкові дані можуть бути відсутні"
fi

# Display connection info
print_success "Розгортання завершено!"
echo ""
print_status "Інформація для підключення:"
print_status "DATABASE_URL: $DATABASE_URL"
echo ""
print_status "Користувач за замовчуванням:"
print_status "Логін: admin"
print_status "Пароль: admin123"
echo ""
print_warning "ВАЖЛИВО: Змініть пароль адміністратора після першого входу!"
echo ""

# Optional: Test application connection
read -p "Запустити тест підключення програми? (y/N): " TEST_APP
if [[ $TEST_APP =~ ^[Yy]$ ]]; then
    print_status "Тестування підключення програми..."
    
    if command -v node &> /dev/null; then
        export DATABASE_URL="$DATABASE_URL"
        if timeout 10 node -e "
            const { Pool } = require('pg');
            const pool = new Pool({ connectionString: process.env.DATABASE_URL });
            pool.query('SELECT COUNT(*) FROM local_users')
                .then(res => {
                    console.log('✓ Підключення програми успішне');
                    console.log('✓ Знайдено', res.rows[0].count, 'користувачів');
                    process.exit(0);
                })
                .catch(err => {
                    console.error('✗ Помилка підключення:', err.message);
                    process.exit(1);
                });
        " 2>/dev/null; then
            print_success "Тест підключення програми пройшов успішно"
        else
            print_warning "Не вдалося протестувати підключення програми"
        fi
    else
        print_warning "Node.js не знайдено, пропуск тесту програми"
    fi
fi

print_success "Продакшн база даних готова до використання!"

# Clean up
if [ -f "deployment.log" ]; then
    print_status "Лог розгортання збережено в deployment.log"
fi