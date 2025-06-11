#!/bin/bash

# Скрипт для виправлення відсутніх таблиць валют на продакшені
# Виконати на сервері: chmod +x fix-production-currency-tables.sh && ./fix-production-currency-tables.sh

echo "🔧 Виправлення відсутніх таблиць валют на продакшені..."

# Перевіряємо чи встановлено PostgreSQL клієнт
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL клієнт не знайдено. Встановлюємо..."
    sudo apt update && sudo apt install -y postgresql-client
fi

# Читаємо конфігурацію бази даних з .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Файл .env не знайдено!"
    exit 1
fi

# Виконуємо SQL скрипти
echo "📊 Створюємо відсутні таблиці..."
psql "$DATABASE_URL" -f fix-currency-settings-table.sql

echo "🔧 Виправляємо структуру таблиці currency_rates..."
psql "$DATABASE_URL" -f fix-currency-column.sql

echo "🔒 Додаємо унікальне обмеження для ON CONFLICT..."
psql "$DATABASE_URL" -f fix-unique-constraint.sql

if [ $? -eq 0 ]; then
    echo "✅ Таблиці успішно створено!"
    
    # Перезапускаємо сервіс
    echo "🔄 Перезапускаємо ERP сервіс..."
    sudo systemctl restart regmik-erp
    
    echo "✅ Виправлення завершено. Перевірте логи: sudo journalctl -u regmik-erp -f"
else
    echo "❌ Помилка при створенні таблиць!"
    exit 1
fi