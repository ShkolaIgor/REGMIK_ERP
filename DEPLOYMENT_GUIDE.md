# REGMIK ERP - Посібник з розгортання в Proxmox

## Огляд системи
REGMIK ERP - це комплексна система управління підприємством з 21 основним модулем, розроблена для роботи в українському бізнес-середовищі з повною локалізацією інтерфейсу.

## Основні модулі системи
1. **Управління запасами** - облік товарів, складські операції
2. **Управління виробництвом** - планування та контроль виробничих процесів
3. **Відправка замовлень** - інтеграція з Новою Поштою
4. **Мультивалютність** - підтримка різних валют
5. **Облік витрат** - калькуляція собівартості
6. **Сканування штрих-кодів** - автоматизація складських операцій
7. **Управління користувачами** - рольова модель доступу
8. **Аналітична панель** - звіти та KPI
9. **Доставка між клієнтами** - B2B логістика
10. **Кореспонденція** - управління документообігом
11. **Інтеграція з Bitrix24/1C** - синхронізація даних
12. **Мультикомпанійні продажі** - робота з кількома юридичними особами

## Технічний стек
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **База даних**: PostgreSQL
- **Автентифікація**: Replit Auth (OpenID Connect)
- **API інтеграції**: Nova Poshta API

## Вимоги до системи

### Мінімальні вимоги для Proxmox контейнера:
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB SSD
- **OS**: Ubuntu 22.04 LTS

### Рекомендовані вимоги:
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 50 GB SSD
- **Мережа**: 1 Gbps

## Покрокова інструкція розгортання

### Крок 1: Підготовка Proxmox контейнера

```bash
# Створення LXC контейнера в Proxmox
pct create 100 ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --cores 4 \
  --memory 8192 \
  --rootfs local-lvm:50 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --hostname regmik-erp \
  --unprivileged 1

# Запуск контейнера
pct start 100

# Підключення до контейнера
pct enter 100
```

### Крок 2: Встановлення залежностей

```bash
# Оновлення системи
apt update && apt upgrade -y

# Встановлення Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Встановлення PostgreSQL
apt install -y postgresql postgresql-contrib

# Встановлення додаткових інструментів
apt install -y git nginx certbot python3-certbot-nginx
```

### Крок 3: Налаштування PostgreSQL

```bash
# Створення користувача та бази даних
sudo -u postgres psql
CREATE USER regmik WITH PASSWORD 'secure_password_here';
CREATE DATABASE "regmik-erp" OWNER regmik;
GRANT ALL PRIVILEGES ON DATABASE "regmik-erp" TO regmik;
\q

# Налаштування pg_hba.conf для локального доступу
echo "local   regmik-erp      regmik                                  md5" >> /etc/postgresql/14/main/pg_hba.conf
systemctl restart postgresql
```

### Крок 4: Клонування та налаштування проекту

```bash
# Створення директорії проекту
mkdir -p /opt/regmik-erp
cd /opt/regmik-erp

# Клонування коду (замінити на ваш репозиторій)
git clone <your-repository-url> .

# Встановлення залежностей
npm install

# Копіювання та налаштування змінних середовища
cp .env.example .env
```

### Крок 5: Налаштування змінних середовища

```bash
# Редагування .env файлу
nano .env
```

```env
# База даних
DATABASE_URL=postgresql://regmik:secure_password_here@localhost:5432/regmik-erp
PGHOST=localhost
PGPORT=5432
PGUSER=regmik
PGPASSWORD=secure_password_here
PGDATABASE=regmik-erp

# Сесії
SESSION_SECRET=your_very_secure_session_secret_here

# Nova Poshta API
NOVA_POSHTA_API_KEY=your_nova_poshta_api_key

# SMTP налаштування
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Replit домени (для production)
REPLIT_DOMAINS=your-domain.com
REPL_ID=your_repl_id
```

### Крок 6: Ініціалізація бази даних

```bash
# Запуск скрипту ініціалізації
node scripts/init-database.js

# Застосування оптимізацій
node scripts/manual-migration.js
```

### Крок 7: Налаштування Nginx

```bash
# Створення конфігурації Nginx
nano /etc/nginx/sites-available/regmik-erp
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активація конфігурації
ln -s /etc/nginx/sites-available/regmik-erp /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Крок 8: Налаштування SSL сертифікату

```bash
# Отримання SSL сертифікату від Let's Encrypt
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Крок 9: Створення systemd сервісу

```bash
# Створення файлу сервісу
nano /etc/systemd/system/regmik-erp.service
```

```ini
[Unit]
Description=REGMIK ERP Application
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/regmik-erp
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Активація та запуск сервісу
systemctl daemon-reload
systemctl enable regmik-erp
systemctl start regmik-erp
```

### Крок 10: Налаштування резервного копіювання

```bash
# Створення скрипту резервного копіювання
nano /opt/regmik-erp/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Резервна копія бази даних
pg_dump -h localhost -U regmik -d regmik-erp > $BACKUP_DIR/regmik_db_$DATE.sql

# Архівування файлів проекту
tar -czf $BACKUP_DIR/regmik_files_$DATE.tar.gz /opt/regmik-erp --exclude=node_modules

# Видалення старих копій (старше 30 днів)
find $BACKUP_DIR -name "regmik_*" -mtime +30 -delete
```

```bash
# Налаштування cron для автоматичного резервного копіювання
chmod +x /opt/regmik-erp/backup.sh
crontab -e

# Додати рядок для щоденного резервного копіювання о 2:00 ранку
0 2 * * * /opt/regmik-erp/backup.sh
```

## Моніторинг та обслуговування

### Перевірка статусу системи
```bash
# Статус сервісу
systemctl status regmik-erp

# Логи програми
journalctl -u regmik-erp -f

# Статус бази даних
systemctl status postgresql

# Статус Nginx
systemctl status nginx
```

### Оновлення системи
```bash
cd /opt/regmik-erp
git pull origin main
npm install
node scripts/manual-migration.js
systemctl restart regmik-erp
```

## Безпека

### Налаштування фаєрволу
```bash
# Встановлення UFW
apt install ufw

# Базові правила
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443

# Активація фаєрволу
ufw enable
```

### Регулярні оновлення безпеки
```bash
# Автоматичні оновлення безпеки
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## Усунення неполадок

### Проблеми з базою даних
```bash
# Перевірка підключення до БД
psql -h localhost -U regmik -d regmik-erp

# Перезапуск PostgreSQL
systemctl restart postgresql
```

### Проблеми з Node.js
```bash
# Перевірка версії Node.js
node --version

# Очищення кешу npm
npm cache clean --force
```

### Проблеми з Nova Poshta API
- Перевірте правильність API ключа в .env файлі
- Переконайтеся, що сервер має доступ до інтернету
- Перевірте логи: `journalctl -u regmik-erp | grep "Nova Poshta"`

## Контакти підтримки
Для отримання технічної підтримки зверніться до команди розробки REGMIK ERP.