#!/bin/bash

echo "🚨 ПОВНЕ ВІДНОВЛЕННЯ ПРОДАКШН СЕРВЕРА"
echo "======================================"

# Зупинка сервісу
echo "Зупинка сервісу regmik-erp..."
sudo systemctl stop regmik-erp

# Створення backup поточного стану
echo "Створення backup..."
cd /opt/regmik-erp
sudo cp -r deployment-package deployment-package-backup-$(date +%Y%m%d-%H%M%S)

# Оновлення всіх критичних файлів
echo "Оновлення файлів сервера..."
sudo cp server/db-storage.ts deployment-package/server/db-storage.ts
sudo cp server/index.ts deployment-package/server/index.ts
sudo cp server/routes.ts deployment-package/server/routes.ts

# Копіювання Nova Poshta сервісу якщо існує
if [ -f server/nova-poshta-service.ts ]; then
    sudo cp server/nova-poshta-service.ts deployment-package/server/nova-poshta-service.ts
    echo "Nova Poshta сервіс оновлено"
fi

# Встановлення правильних прав доступу
echo "Встановлення прав доступу..."
sudo chown -R regmik-erp:regmik-erp deployment-package/
sudo chmod -R 755 deployment-package/
sudo chmod 644 deployment-package/server/*.ts

# Очищення cache та старих збірок
echo "Очищення кешу..."
cd deployment-package
sudo rm -rf node_modules/.cache
sudo rm -rf dist

# Перебудова проекту
echo "Перебудова проекту..."
sudo -u regmik-erp npm run build 2>&1 | tee build.log

# Перевірка результату збірки
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Збірка успішна"
    
    # Запуск сервісу
    echo "Запуск сервісу..."
    sudo systemctl start regmik-erp
    
    # Очікування запуску
    sleep 10
    
    # Перевірка статусу
    echo "Перевірка статусу сервісу..."
    if sudo systemctl is-active --quiet regmik-erp; then
        echo "✅ Сервіс запущено"
        
        # Тестування HTTP
        echo "Тестування сервера..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ Сервер відповідає HTTP 200"
            echo "✅ ВІДНОВЛЕННЯ ЗАВЕРШЕНО УСПІШНО"
        else
            echo "❌ Сервер відповідає HTTP $HTTP_CODE"
            echo "Перевірка логів..."
            sudo journalctl -u regmik-erp -n 20 --no-pager
        fi
    else
        echo "❌ Сервіс не запустився"
        sudo journalctl -u regmik-erp -n 20 --no-pager
    fi
else
    echo "❌ Помилка збірки"
    echo "Логи збірки:"
    tail -20 build.log
    
    echo "Відновлення з backup..."
    sudo rm -rf deployment-package
    sudo mv deployment-package-backup-* deployment-package
    sudo systemctl start regmik-erp
    echo "❌ ВІДНОВЛЕННЯ НЕВДАЛЕ - ПОВЕРНЕНО ДО ПОПЕРЕДНЬОГО СТАНУ"
fi

echo "======================================"
echo "Відновлення завершено"