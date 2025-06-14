#!/bin/bash

# Швидке оновлення продакшн сервера з виправленнями UTF-8 для Nova Poshta пошуку
# Дата: 2025-06-14

echo "🚀 Починаю оновлення продакшн сервера з виправленнями UTF-8..."

# Зупиняємо сервіс
sudo systemctl stop regmik-erp

# Переходимо в робочу директорію
cd /opt/regmik-erp

# Створюємо backup поточної версії
sudo cp -r deployment-package deployment-package-backup-$(date +%Y%m%d-%H%M%S)

# Копіюємо оновлені файли
echo "📁 Копіюю оновлені файли..."

# Копіюємо виправлений server/index.ts
sudo cp server/index.ts deployment-package/server/

# Копіюємо виправлений server/routes.ts  
sudo cp server/routes.ts deployment-package/server/

# Встановлюємо правильні права доступу
sudo chown -R regmik-erp:regmik-erp deployment-package/
sudo chmod +x deployment-package/server/index.ts

# Перебудовуємо додаток
echo "🔨 Перебудовую додаток..."
cd deployment-package
sudo -u regmik-erp npm run build

# Запускаємо сервіс
echo "▶️ Запускаю сервіс..."
sudo systemctl start regmik-erp

# Перевіряємо статус
sleep 3
sudo systemctl status regmik-erp

echo "✅ Оновлення завершено!"
echo "🔍 Тестую UTF-8 пошук..."

# Тестуємо пошук
curl -s "http://localhost:5000/api/nova-poshta/cities?q=чернігів" | head -1

echo ""
echo "📝 Лог сервісу:"
sudo journalctl -u regmik-erp -f --lines=10