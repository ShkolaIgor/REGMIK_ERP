#!/bin/bash

# REGMIK ERP Production Startup Script
echo "🚀 Запуск REGMIK ERP у продакшн режимі..."

# Встановлення змінних середовища
export NODE_ENV=production
export PORT=5000

# Перевірка наявності файлу оточення
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не знайдено. Копіюю з .env.production..."
    cp .env.production .env
fi

# Завантаження змінних оточення
set -a
source .env
set +a

echo "📊 Запуск сервера на порту $PORT..."
node dist/server.js