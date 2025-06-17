#!/bin/bash

# ERP System Production Startup Script
# Скрипт запуску ERP системи в продакшн режимі

echo "🏭 Запуск ERP системи в продакшн режимі..."

# Перевірка наявності Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не встановлено. Встановіть Node.js 18+ для роботи системи."
    exit 1
fi

# Перевірка версії Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Потрібна версія Node.js 18 або вища. Поточна версія: $(node --version)"
    exit 1
fi

# Перевірка наявності package.json
if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не знайдено. Запустіть скрипт з кореневої директорії проекту."
    exit 1
fi

# Перевірка обов'язкових змінних середовища
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Змінна DATABASE_URL не встановлена. Налаштуйте підключення до бази даних."
    exit 1
fi

if [ -z "$PORT" ]; then
    export PORT=5000
    echo "⚠️  PORT не встановлено, використовується 5000"
fi

# Встановлення NODE_ENV якщо не встановлено
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
    echo "🔧 NODE_ENV встановлено в production"
fi

# Перевірка наявності node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Встановлення залежностей..."
    npm ci --production
    if [ $? -ne 0 ]; then
        echo "❌ Помилка встановлення залежностей."
        exit 1
    fi
fi

# Збірка проекту якщо потрібно
if [ ! -d "dist" ] && [ -f "tsconfig.json" ]; then
    echo "🔨 Збірка проекту..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Помилка збірки проекту."
        exit 1
    fi
fi

# Запуск міграцій бази даних
echo "🗃️ Перевірка міграцій бази даних..."
if command -v drizzle-kit &> /dev/null; then
    npx drizzle-kit push --config=drizzle.config.ts || echo "⚠️ Міграції не виконано"
fi

# Запуск системи в продакшн режимі
echo "🚀 Запуск продакшн сервера на порту $PORT..."
echo "🌐 ERP система буде доступна за адресою: http://localhost:$PORT"
echo "📊 Режим: $NODE_ENV"
echo "🛑 Для зупинки натисніть Ctrl+C"
echo ""

# Створення PID файлу
PID_FILE="./erp-system.pid"
echo $$ > $PID_FILE

# Обробка сигналів
cleanup() {
    echo "🛑 Зупинка продакшн сервера..."
    rm -f $PID_FILE
    exit 0
}

trap cleanup INT TERM

# Запуск сервера
if [ -f "dist/server/index.js" ]; then
    node dist/server/index.js
elif [ -f "server/index.ts" ]; then
    npx tsx server/index.ts
else
    npm start
fi