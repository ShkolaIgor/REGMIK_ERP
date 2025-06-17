#!/bin/bash

# ERP System Startup Script
# Скрипт запуску ERP системи

echo "🚀 Запуск ERP системи..."

# Перевірка наявності Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не встановлено. Встановіть Node.js 18+ для роботи системи."
    exit 1
fi

# Перевірка наявності npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не встановлено. Встановіть npm для роботи системи."
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

# Перевірка наявності node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Встановлення залежностей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Помилка встановлення залежностей."
        exit 1
    fi
fi

# Перевірка змінних середовища
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Змінна DATABASE_URL не встановлена. Переконайтеся що база даних налаштована."
fi

# Запуск системи в режимі розробки
echo "🔄 Запуск сервера..."
echo "📊 ERP система буде доступна за адресою: http://localhost:5000"
echo "🛑 Для зупинки натисніть Ctrl+C"
echo ""

# Запуск з обробкою сигналів
trap 'echo "🛑 Зупинка сервера..."; exit 0' INT TERM

npm run dev