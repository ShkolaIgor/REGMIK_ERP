#!/bin/bash

# Скрипт для оновлення продакшн-системи з виправленням помилки getUserByEmail

echo "=== Оновлення REGMIK ERP - Виправлення помилки getUserByEmail ==="

# Зупиняємо сервіс
echo "Зупиняємо сервіс..."
sudo systemctl stop regmik-erp.service

# Переходимо в директорію проекту
cd /opt/REGMIK_ERP

# Створюємо backup поточної версії
echo "Створюємо backup..."
sudo cp -r dist dist_backup_$(date +%Y%m%d_%H%M%S)

# Компілюємо TypeScript в JavaScript
echo "Компілюємо TypeScript..."
sudo npm run build

# Перевіряємо, чи компіляція успішна
if [ $? -eq 0 ]; then
    echo "Компіляція успішна!"
    
    # Запускаємо сервіс
    echo "Запускаємо сервіс..."
    sudo systemctl start regmik-erp.service
    
    # Перевіряємо статус
    echo "Перевіряємо статус сервісу..."
    sudo systemctl status regmik-erp.service --no-pager
    
    echo "=== Оновлення завершено успішно ==="
else
    echo "Помилка компіляції! Відновлюємо backup..."
    sudo rm -rf dist
    sudo cp -r dist_backup_$(date +%Y%m%d_%H%M%S) dist
    sudo systemctl start regmik-erp.service
    echo "Система відновлена до попереднього стану"
    exit 1
fi