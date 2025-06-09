# REGMIK ERP - Остаточне налаштування для Proxmox

## Для розгортання на 192.168.0.247:5000

### 1. Підготовка контейнера
```bash
# Встановлення Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Створення директорії та клонування
sudo mkdir -p /opt/REGMIK_ERP
cd /opt
sudo git clone <your-repository-url> REGMIK_ERP
sudo chown -R $(whoami):$(whoami) REGMIK_ERP
cd REGMIK_ERP
```

### 2. Встановлення залежностей
```bash
npm install
```

### 3. Налаштування environment
```bash
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_PQu4CAr9yIYq@ep-spring-flower-a552xsk9.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=regmik_production_secret_2025
NOVA_POSHTA_API_KEY=your_api_key_here
EOF
```

### 4. Тестовий запуск
```bash
# Завантаження environment variables
export $(cat .env.production | xargs)

# Запуск з повним UI
npx tsx server/production-ui.ts
```

Перевірте доступ: **http://192.168.0.247:5000**

### 5. Налаштування systemd service
```bash
# Оновлення шляхів у service файлі
sed 's|/home/runner/workspace|/opt/REGMIK_ERP|g' regmik-erp-simple.service > regmik-erp.service

# Встановлення service
sudo cp regmik-erp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable regmik-erp
sudo systemctl start regmik-erp

# Перевірка статусу
sudo systemctl status regmik-erp
```

### 6. Налаштування firewall
```bash
sudo ufw allow 5000/tcp
sudo ufw status
```

## Результат
REGMIK ERP доступний за адресою: **http://192.168.0.247:5000**

Система включає:
- Повний веб-інтерфейс з dashboard
- 21 модуль ERP системи
- Українська локалізація
- Nova Poshta інтеграція
- PostgreSQL база даних
- Автоматичний запуск через systemd

## Управління сервісом
```bash
# Статус
sudo systemctl status regmik-erp

# Логи
sudo journalctl -u regmik-erp -f

# Перезапуск
sudo systemctl restart regmik-erp

# Зупинка
sudo systemctl stop regmik-erp
```

## Вирішення проблем

**Якщо сторінка показує "Not Found":**
- Перевірте що service використовує production-ui.ts
- Перезапустіть service: `sudo systemctl restart regmik-erp`

**Якщо перенаправляє на /api/dashboard/stats:**
- Це означає що працює старий launcher
- Оновіть service файл на production-ui.ts
- Перезавантажте daemon: `sudo systemctl daemon-reload`