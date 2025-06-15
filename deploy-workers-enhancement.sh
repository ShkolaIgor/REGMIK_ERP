#!/bin/bash

# Workers Personal Information Enhancement Deployment Script
# Ukrainian ERP System - Workers Table Update
# Usage: ./deploy-workers-enhancement.sh [DATABASE_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Підготовка до оновлення таблиці workers..."

# Check if SQL file exists
if [ ! -f "workers_personal_info_production.sql" ]; then
    print_error "Файл workers_personal_info_production.sql не знайдено"
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

# Check if workers table exists
print_status "Перевірка існування таблиці workers..."
WORKERS_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workers');" | tr -d ' ')

if [ "$WORKERS_EXISTS" != "t" ]; then
    print_error "Таблиця workers не існує в базі даних"
    print_error "Спочатку розгорніть основну структуру бази даних"
    exit 1
fi

print_success "Таблиця workers знайдена"

# Check if fields already exist
print_status "Перевірка існуючих полів..."
EXISTING_FIELDS=$(psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'workers' AND column_name IN ('birth_date', 'address', 'contact_phone', 'termination_date');" | tr -d ' ' | wc -l)

if [ "$EXISTING_FIELDS" -eq "4" ]; then
    print_warning "Всі нові поля вже існують в таблиці workers"
    read -p "Продовжити оновлення? (y/N): " CONTINUE_UPDATE
    
    if [[ ! $CONTINUE_UPDATE =~ ^[Yy]$ ]]; then
        print_status "Оновлення скасовано"
        exit 0
    fi
elif [ "$EXISTING_FIELDS" -gt "0" ]; then
    print_warning "Деякі поля вже існують ($EXISTING_FIELDS з 4)"
    print_status "Скрипт безпечно додасть тільки відсутні поля"
fi

# Create backup of workers table
print_status "Створення резервної копії таблиці workers..."
BACKUP_FILE="workers_backup_$(date +%Y%m%d_%H%M%S).sql"

if pg_dump "$DATABASE_URL" --table=workers --data-only > "$BACKUP_FILE" 2>/dev/null; then
    print_success "Резервна копія створена: $BACKUP_FILE"
else
    print_warning "Не вдалося створити резервну копію, але продовжуємо..."
fi

# Get current workers count
WORKERS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM workers;" | tr -d ' ')
print_status "Знайдено $WORKERS_COUNT робітників в таблиці"

# Apply the enhancement
print_status "Застосування оновлення таблиці workers..."

if psql "$DATABASE_URL" -f workers_personal_info_production.sql > workers_enhancement.log 2>&1; then
    print_success "Таблиця workers успішно оновлена!"
else
    print_error "Помилка при оновленні таблиці workers"
    print_error "Перевірте файл workers_enhancement.log для деталей"
    exit 1
fi

# Verify the enhancement
print_status "Перевірка оновлення..."

# Check if all new fields exist
NEW_FIELDS=("birth_date" "address" "contact_phone" "termination_date")
MISSING_FIELDS=()

for field in "${NEW_FIELDS[@]}"; do
    if ! psql "$DATABASE_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'workers' AND column_name = '$field';" | grep -q "$field"; then
        MISSING_FIELDS+=("$field")
    fi
done

if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
    print_success "Всі нові поля додані успішно"
else
    print_error "Відсутні поля: ${MISSING_FIELDS[*]}"
    exit 1
fi

# Verify data integrity
print_status "Перевірка цілісності даних..."
WORKERS_COUNT_AFTER=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM workers;" | tr -d ' ')

if [ "$WORKERS_COUNT" -eq "$WORKERS_COUNT_AFTER" ]; then
    print_success "Кількість робітників незмінна: $WORKERS_COUNT"
else
    print_error "Кількість робітників змінилася! До: $WORKERS_COUNT, Після: $WORKERS_COUNT_AFTER"
    exit 1
fi

# Show new table structure
print_status "Нова структура таблиці workers:"
psql "$DATABASE_URL" -c "\d+ workers" 2>/dev/null | grep -E "(birth_date|address|contact_phone|termination_date|Стовпець|Column)" || echo "Інформація про структуру недоступна"

print_success "Оновлення таблиці workers завершено успішно!"
echo ""
print_status "Додані поля:"
print_status "• birth_date - Дата народження (date)"
print_status "• address - Адреса проживання (text)"
print_status "• contact_phone - Контактний телефон (varchar 50)"
print_status "• termination_date - Дата звільнення (date)"
echo ""
print_status "Додані індекси для оптимізації:"
print_status "• idx_workers_birth_date"
print_status "• idx_workers_termination_date"
print_status "• idx_workers_contact_phone"
echo ""
print_status "Додані обмеження:"
print_status "• Дата народження не може бути в майбутньому"
print_status "• Дата звільнення не може бути раніше дати найму"
echo ""

# Test query
print_status "Тестовий запит до оновленої таблиці:"
psql "$DATABASE_URL" -c "SELECT id, \"firstName\", \"lastName\", birth_date, address, contact_phone, termination_date FROM workers LIMIT 3;" 2>/dev/null || print_warning "Не вдалося виконати тестовий запит"

print_success "Таблиця workers готова до використання з новими полями!"

# Clean up log if successful
if [ -f "workers_enhancement.log" ]; then
    if grep -q "SUCCESS" workers_enhancement.log 2>/dev/null; then
        rm -f workers_enhancement.log
    else
        print_status "Лог оновлення збережено в workers_enhancement.log"
    fi
fi