#!/bin/bash

# Скрипт для оновлення продакшн версії Nova Poshta кешу

echo "=== Оновлення продакшн версії Nova Poshta кешу ==="

# Копіюємо виправлені файли з розробки до продакшн пакету
echo "Копіювання виправлених файлів..."

# Копіюємо server/nova-poshta-cache.ts
cp server/nova-poshta-cache.ts deployment-package/server/

# Копіюємо server/routes.ts (з HTTP заголовками для відключення кешування)
cp server/routes.ts deployment-package/server/

# Копіюємо client/src/components/NovaPoshtaIntegration.tsx (з відключеним React Query кешем)
mkdir -p deployment-package/client/src/components/
cp client/src/components/NovaPoshtaIntegration.tsx deployment-package/client/src/components/

echo "Файли успішно скопійовано"

# Перевіряємо, чи існують ключові методи в deployment-package/server/db-storage.ts
echo "Перевіряємо наявність методів у db-storage..."

if grep -q "getNovaPoshtaCities" deployment-package/server/db-storage.ts; then
    echo "✓ Метод getNovaPoshtaCities знайдено"
else
    echo "✗ Метод getNovaPoshtaCities НЕ знайдено - потрібно додати"
fi

if grep -q "getNovaPoshtaWarehouses" deployment-package/server/db-storage.ts; then
    echo "✓ Метод getNovaPoshtaWarehouses знайдено"
else
    echo "✗ Метод getNovaPoshtaWarehouses НЕ знайдено - потрібно додати"
fi

echo "=== Оновлення завершено ==="