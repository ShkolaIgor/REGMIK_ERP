#!/bin/bash

# Швидке виправлення пошуку міст Nova Poshta у продакшн
echo "Оновлення продакшн версії для виправлення пошуку міст..."

# Зупиняємо сервіс
sudo systemctl stop regmik-erp

# Копіюємо виправлені файли
echo "Копіювання виправлених файлів..."
cp deployment-package/server/db-storage.ts /var/www/regmik-erp/server/
cp deployment-package/server/nova-poshta-cache.ts /var/www/regmik-erp/server/

# Перезапускаємо сервіс
echo "Перезапуск сервісу..."
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp

echo "Виправлення пошуку міст завершено!"
echo "Тепер пошук має повертати всі результати з бази даних без обмежень."