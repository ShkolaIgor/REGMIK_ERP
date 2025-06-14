#!/bin/bash

# Скрипт для оновлення продакшн БД з правильною структурою Nova Poshta таблиць
# Використовувати після застосування міграцій 0028, 0029, 0030

echo "🚀 Початок оновлення продакшн БД для Nova Poshta..."

# Перевірка підключення до БД
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; then
    echo "❌ Помилка: Не вдалося підключитися до БД"
    exit 1
fi

echo "✅ Підключення до БД успішне"

# Застосування міграцій
echo "📋 Застосування міграцій..."

# Міграція 0028 - налаштування синхронізації перевізників
echo "Застосування міграції 0028..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0028_add_carrier_sync_settings.sql

if [ $? -ne 0 ]; then
    echo "❌ Помилка при застосуванні міграції 0028"
    exit 1
fi

# Міграція 0029 - базова структура Nova Poshta (буде перезаписана)
echo "Застосування міграції 0029..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0029_add_nova_poshta_integration.sql

if [ $? -ne 0 ]; then
    echo "❌ Помилка при застосуванні міграції 0029"
    exit 1
fi

# Міграція 0030 - виправлена структура Nova Poshta таблиць
echo "Застосування міграції 0030 (виправлена структура)..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0030_fix_nova_poshta_tables.sql

if [ $? -ne 0 ]; then
    echo "❌ Помилка при застосуванні міграції 0030"
    exit 1
fi

echo "✅ Всі міграції успішно застосовані"

# Перевірка структури таблиць
echo "🔍 Перевірка структури таблиць..."

# Перевірка таблиці nova_poshta_cities
echo "Перевірка nova_poshta_cities..."
CITIES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'nova_poshta_cities';" | xargs)

if [ "$CITIES_COUNT" -eq "13" ]; then
    echo "✅ Таблиця nova_poshta_cities має правильну кількість полів: $CITIES_COUNT"
else
    echo "⚠️ Увага: nova_poshta_cities має $CITIES_COUNT полів (очікувалося 13)"
fi

# Перевірка таблиці nova_poshta_warehouses
echo "Перевірка nova_poshta_warehouses..."
WAREHOUSES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'nova_poshta_warehouses';" | xargs)

if [ "$WAREHOUSES_COUNT" -eq "29" ]; then
    echo "✅ Таблиця nova_poshta_warehouses має правильну кількість полів: $WAREHOUSES_COUNT"
else
    echo "⚠️ Увага: nova_poshta_warehouses має $WAREHOUSES_COUNT полів (очікувалося 29)"
fi

# Перевірка індексів
echo "🔍 Перевірка індексів..."
INDEXES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('nova_poshta_cities', 'nova_poshta_warehouses');" | xargs)
echo "✅ Створено $INDEXES_COUNT індексів для Nova Poshta таблиць"

# Інформація про подальші кроки
echo ""
echo "🎉 Оновлення продакшн БД завершено успішно!"
echo ""
echo "📝 Наступні кроки:"
echo "1. Перезапустити додаток для застосування змін"
echo "2. Перейти в розділ 'Перевізники'"
echo "3. Знайти Nova Poshta та натиснути 'Синхронізувати'"
echo "4. Дочекатися завершення синхронізації міст та відділень"
echo ""
echo "🔧 Структура таблиць:"
echo "- nova_poshta_cities: міста з полями name, name_ru, area, area_ru, region, region_ru, тощо"
echo "- nova_poshta_warehouses: відділення з полями description, short_address, phone, schedule (JSON), тощо"
echo ""
echo "✅ Nova Poshta інтеграція готова до використання!"