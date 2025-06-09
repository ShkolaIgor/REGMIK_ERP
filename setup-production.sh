#!/bin/bash

# REGMIK ERP Production Setup Script
# Автоматична конфігурація production середовища

set -e

echo "🚀 REGMIK ERP Production Setup"
echo "=============================="

# Перевірка прав адміністратора
if [[ $EUID -ne 0 ]]; then
   echo "❌ Цей скрипт потребує права адміністратора (sudo)"
   exit 1
fi

# Параметри за замовчуванням
APP_DIR="/opt/REGMIK_ERP"
DB_USER="regmik_user"
DB_NAME="regmik-erp"
SERVICE_USER="runner"

echo "📁 Налаштування каталогу додатку..."
cd "$APP_DIR"

# Встановлення залежностей якщо потрібно
if [ ! -d "node_modules" ]; then
    echo "📦 Встановлення Node.js залежностей..."
    npm ci --production
fi

# Створення .env файлу для production
echo "⚙️  Створення production конфігурації..."
cat > .env << EOF
# REGMIK ERP Production Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=npg_PQu4CAr9yIYq

# Security
SESSION_SECRET=regmik_erp_production_session_$(openssl rand -hex 16)

# SSL Configuration
SSL_REJECT_UNAUTHORIZED=false

# Nova Poshta API (додайте ваш ключ)
# NOVA_POSHTA_API_KEY=your_api_key_here

# Email Configuration (необов'язково)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@company.com
# SMTP_PASSWORD=your_app_password
EOF

# Встановлення прав доступу
chown $SERVICE_USER:$SERVICE_USER .env
chmod 600 .env

# Ініціалізація бази даних
echo "🗄️  Ініціалізація бази даних..."
sudo -u $SERVICE_USER node scripts/init-database.js

# Створення systemd service
echo "🔧 Налаштування systemd service..."
cat > /etc/systemd/system/regmik-erp.service << EOF
[Unit]
Description=REGMIK ERP System
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
EnvironmentFile=$APP_DIR/.env

StandardOutput=journal
StandardError=journal
SyslogIdentifier=regmik-erp

[Install]
WantedBy=multi-user.target
EOF

# Перезавантаження systemd та запуск сервісу
echo "🔄 Запуск служби..."
systemctl daemon-reload
systemctl enable regmik-erp
systemctl start regmik-erp

# Перевірка статусу
sleep 3
if systemctl is-active --quiet regmik-erp; then
    echo "✅ REGMIK ERP успішно запущено!"
    echo "🌐 Сервіс доступний на http://localhost:5000"
    echo ""
    echo "📊 Статус служби:"
    systemctl status regmik-erp --no-pager -l
    echo ""
    echo "📋 Корисні команди:"
    echo "   sudo systemctl status regmik-erp    # Перевірити статус"
    echo "   sudo systemctl restart regmik-erp   # Перезапустити"
    echo "   sudo journalctl -u regmik-erp -f    # Переглянути логи"
else
    echo "❌ Помилка запуску служби!"
    echo "📋 Перевірте логи: sudo journalctl -u regmik-erp -n 50"
    exit 1
fi
EOF