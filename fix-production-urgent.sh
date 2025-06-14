#!/bin/bash

echo "🚨 ТЕРМІНОВИЙ ВИПРАВЛЕННЯ ПРОДАКШН СЕРВЕРА"
echo "Виправлення дублікатів методів у db-storage.ts"

# Зупиняємо сервіс
echo "Зупинка сервісу..."
sudo systemctl stop regmik-erp

# Створюємо backup
echo "Створення backup..."
cd /opt/regmik-erp
sudo cp deployment-package/server/db-storage.ts deployment-package/server/db-storage.ts.backup-$(date +%Y%m%d-%H%M%S)

# Копіюємо виправлений файл
echo "Оновлення файлу db-storage.ts..."
sudo cp server/db-storage.ts deployment-package/server/db-storage.ts

# Встановлюємо права доступу
sudo chown regmik-erp:regmik-erp deployment-package/server/db-storage.ts

# Перебудовуємо проект
echo "Перебудова проекту..."
cd deployment-package
sudo -u regmik-erp npm run build

if [ $? -eq 0 ]; then
    echo "✅ Збірка успішна"
    
    # Запускаємо сервіс
    echo "Запуск сервісу..."
    sudo systemctl start regmik-erp
    
    # Перевіряємо статус
    sleep 5
    echo "Перевірка статусу..."
    sudo systemctl status regmik-erp --no-pager
    
    echo "Тестування сервера..."
    curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ && echo " - Сервер відповідає"
    
    echo "✅ ВИПРАВЛЕННЯ ЗАВЕРШЕНО"
else
    echo "❌ Помилка збірки. Відновлення backup..."
    sudo cp deployment-package/server/db-storage.ts.backup-* deployment-package/server/db-storage.ts
    sudo systemctl start regmik-erp
    echo "❌ ВИПРАВЛЕННЯ НЕВДАЛЕ"
fi