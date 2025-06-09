#!/bin/bash

# REGMIK ERP - Локальне оновлення бази даних
# Використовуйте цей скрипт для оновлення структури бази даних після змін

echo "🔄 REGMIK ERP - Оновлення локальної бази даних"
echo "=============================================="

# Перевіряємо чи існує .env файл
if [ ! -f .env ]; then
    echo "❌ Файл .env не знайдено. Створіть його з налаштуваннями бази даних."
    exit 1
fi

# Створюємо backup бази даних (опціонально)
echo "💾 Створюємо backup бази даних..."
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).sql"
if command -v pg_dump &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "$BACKUP_NAME"
    echo "✅ Backup створено: $BACKUP_NAME"
else
    echo "⚠️  pg_dump недоступний або DATABASE_URL не встановлено"
fi

# Синхронізуємо схему бази даних
echo "🔄 Синхронізація схеми бази даних..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Схема бази даних успішно оновлена"
else
    echo "❌ Помилка при оновленні схеми бази даних"
    exit 1
fi

# Перевіряємо статус підключення до бази
echo "🔍 Перевіряємо підключення до бази даних..."
node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW() as current_time')
  .then(result => {
    console.log('✅ Підключення до бази даних успішне');
    console.log('⏰ Час сервера:', result.rows[0].current_time);
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Помилка підключення до бази даних:', err.message);
    process.exit(1);
  });
"

echo ""
echo "🎉 Оновлення бази даних завершено!"
echo ""
echo "🔧 Корисні команди:"
echo "   npm run db:push          # синхронізація схеми"
echo "   npm run db:studio        # веб-інтерфейс бази даних"
echo "   npm run dev              # запуск додатка"