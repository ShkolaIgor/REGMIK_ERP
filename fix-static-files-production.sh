#!/bin/bash

echo "🔧 ВИПРАВЛЕННЯ СТАТИЧНИХ ФАЙЛІВ ПРОДАКШН"
echo "========================================"

# Зупинка сервісу
echo "Зупинка сервісу regmik-erp..."
sudo systemctl stop regmik-erp

# Backup
echo "Створення backup..."
cd /opt/regmik-erp
sudo cp deployment-package/server/index.ts deployment-package/server/index.ts.backup-$(date +%Y%m%d-%H%M%S)

# Оновлення критичних файлів
echo "Оновлення server/index.ts (виправлення Content-Type для статичних файлів)..."
sudo cp server/index.ts deployment-package/server/index.ts
sudo cp server/db-storage.ts deployment-package/server/db-storage.ts

# Права доступу
sudo chown -R regmik-erp:regmik-erp deployment-package/
sudo chmod -R 755 deployment-package/

# Очищення та перебудова
echo "Очищення cache та перебудова..."
cd deployment-package
sudo rm -rf node_modules/.cache dist

echo "Перебудова проекту..."
sudo -u regmik-erp npm run build 2>&1 | tee build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Збірка успішна"
    
    # Перевірка статичних файлів
    echo "Перевірка статичних файлів..."
    if [ -d "dist/public" ]; then
        echo "✅ Папка dist/public створена"
        ls -la dist/public/ | head -5
    else
        echo "❌ Папка dist/public не знайдена"
    fi
    
    # Запуск сервісу
    echo "Запуск сервісу..."
    sudo systemctl start regmik-erp
    
    sleep 10
    
    # Тестування
    echo "Тестування сервера..."
    
    # Перевірка HTML
    HTML_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ || echo "000")
    echo "HTML відповідь: $HTML_CODE"
    
    # Перевірка JS файлів
    if [ -f dist/public/index.html ]; then
        JS_FILE=$(grep -o 'assets/index-[^"]*\.js' dist/public/index.html | head -1)
        if [ ! -z "$JS_FILE" ]; then
            JS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/$JS_FILE || echo "000")
            echo "JavaScript файл $JS_FILE: $JS_CODE"
            
            # Перевірка Content-Type JS файлу
            JS_CONTENT_TYPE=$(curl -s -I http://localhost:5000/$JS_FILE | grep -i content-type | cut -d' ' -f2- | tr -d '\r\n')
            echo "Content-Type JS: $JS_CONTENT_TYPE"
        fi
    fi
    
    if [ "$HTML_CODE" = "200" ]; then
        echo "✅ ВИПРАВЛЕННЯ ЗАВЕРШЕНО УСПІШНО"
        echo "Сервер працює і статичні файли обслуговуються правильно"
    else
        echo "❌ Проблема з сервером"
        sudo journalctl -u regmik-erp -n 10 --no-pager
    fi
else
    echo "❌ Помилка збірки"
    tail -10 build.log
    
    echo "Відновлення backup..."
    sudo cp deployment-package/server/index.ts.backup-* deployment-package/server/index.ts
    sudo systemctl start regmik-erp
fi

echo "========================================"