# REGMIK ERP - Швидке налаштування для Proxmox (192.168.0.247:5000)

## Виконайте в вашому Proxmox контейнері:

### 1. Встановлення Node.js та клонування
```bash
# Встановлення Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Клонування проекту
cd /opt
sudo git clone <your-git-repo> REGMIK_ERP
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
EOF
```

### 4. Тестовий запуск
```bash
# Завантажити environment
export $(cat .env.production | xargs)

# Запустити сервер
npx tsx server/production-dev.ts
```

Відкрийте браузер: **http://192.168.0.247:5000**

### 5. Автоматичний запуск через systemd
```bash
# Оновити шляхи в service файлі
sed 's|/home/runner/workspace|/opt/REGMIK_ERP|g' regmik-erp-simple.service > regmik-erp.service

# Встановити service
sudo cp regmik-erp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable regmik-erp
sudo systemctl start regmik-erp

# Перевірити статус
sudo systemctl status regmik-erp
```

### 6. Налаштування firewall (якщо потрібно)
```bash
sudo ufw allow 5000/tcp
```

## Результат
REGMIK ERP буде доступний за адресою: **http://192.168.0.247:5000**

Всі 21 модуль ERP системи з українською локалізацією, Nova Poshta інтеграцією та повним інтерфейсом.

## Перевірка роботи
```bash
# Статус сервісу
sudo systemctl status regmik-erp

# Логи в реальному часі
sudo journalctl -u regmik-erp -f

# Перевірка порту
netstat -tuln | grep :5000
```