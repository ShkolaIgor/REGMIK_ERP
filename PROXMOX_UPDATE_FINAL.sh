#!/bin/bash

# REGMIK ERP - Фінальне оновлення для Proxmox контейнера
# Використовуйте цей скрипт для оновлення системи на 192.168.0.247:5000

echo "🚀 REGMIK ERP - Фінальне оновлення системи"
echo "=========================================="

# Зупиняємо сервіс
echo "⏹️  Зупиняємо сервіс..."
sudo systemctl stop regmik-erp

# Створюємо backup поточної версії
echo "💾 Створюємо backup..."
sudo cp -r /opt/REGMIK_ERP /opt/REGMIK_ERP_backup_$(date +%Y%m%d_%H%M%S)

# Оновлюємо файли
echo "📥 Оновлюємо файли системи..."
cd /opt/REGMIK_ERP

# Завантажуємо оновлену версію з production build
echo "📦 Копіюємо production build..."
sudo cp -r dist/* /opt/REGMIK_ERP/

# Встановлюємо права доступу
echo "🔐 Встановлюємо права доступу..."
sudo chown -R regmik:regmik /opt/REGMIK_ERP
sudo chmod +x /opt/REGMIK_ERP/start-production.sh

# Перезапускаємо сервіс
echo "🔄 Перезапускаємо сервіс..."
sudo systemctl daemon-reload
sudo systemctl start regmik-erp
sudo systemctl enable regmik-erp

# Перевіряємо статус
echo "✅ Перевіряємо статус сервісу..."
sleep 3
sudo systemctl status regmik-erp --no-pager

echo ""
echo "🎉 Оновлення завершено!"
echo "📍 Веб-інтерфейс доступний: http://192.168.0.247:5000"
echo "📧 Модуль 'Кореспонденція клієнтів' тепер доступний в веб-інтерфейсі"
echo ""
echo "🔧 Додаткові команди:"
echo "   sudo systemctl status regmik-erp    # статус сервісу"
echo "   sudo systemctl restart regmik-erp   # перезапуск"
echo "   sudo journalctl -u regmik-erp -f    # перегляд логів"