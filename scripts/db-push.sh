#!/bin/bash

# Заміна для npm run db:push
# Використовує власну систему управління схемою замість drizzle-kit

echo "Запуск власної системи управління схемою..."

# Запуск schema manager замість drizzle-kit
node scripts/schema-manager.js

if [ $? -eq 0 ]; then
    echo "Схема успішно оновлена!"
else
    echo "Помилка оновлення схеми"
    exit 1
fi