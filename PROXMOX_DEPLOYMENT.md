# REGMIK ERP - Розгортання в Proxmox Container

## Огляд

Цей документ описує повний процес розгортання REGMIK ERP в Proxmox контейнері з автоматизованим налаштуванням production середовища.

## Системні вимоги

### Proxmox Container
- **OS**: Ubuntu 20.04/22.04 LTS або Debian 11/12
- **RAM**: Мінімум 2GB (рекомендовано 4GB)
- **Storage**: Мінімум 20GB
- **CPU**: 2 cores (рекомендовано 4 cores)
- **Network**: Повний доступ до інтернету

### Програмне забезпечення
- Node.js 18+ та npm
- Git для клонування репозиторію
- PostgreSQL клієнт (опціонально для діагностики)

## Швидке розгортання

### 1. Підготовка контейнера

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Встановлення додаткових пакетів
sudo apt install -y git curl build-essential netstat-nat
```

### 2. Клонування проекту

```bash
# Клонування репозиторію
git clone <your-repo-url> regmik-erp
cd regmik-erp

# Перевірка файлів
ls -la
```

### 3. Автоматичне розгортання

```bash
# Запуск автоматичного розгортання
./deploy-proxmox.sh
```

Скрипт автоматично:
- Встановить залежності
- Створить .env.production файл
- Ініціалізує базу даних
- Налаштує systemd service
- Запустить production сервер
- Налаштує firewall

### 3.1. Швидкий запуск (альтернатива)

Для швидкого тестування без systemd:

```bash
# Швидкий manual запуск
./start-manual.sh
```

Цей скрипт:
- Автоматично створює .env.production
- Завантажує environment variables
- Запускає production server на порті 3000

### 4. Ручне налаштування змінних оточення

Відредагуйте `.env.production`:

```bash
nano .env.production
```

Основні параметри для налаштування:
- `NOVA_POSHTA_API_KEY` - ваш API ключ Nova Poshta
- `SMTP_*` параметри для електронної пошти

### 5. Перезапуск після налаштування

```bash
sudo systemctl restart regmik-erp
sudo systemctl status regmik-erp
```

## Ручне розгортання

Якщо автоматичний скрипт не працює, використовуйте ручне розгортання:

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування оточення

```bash
cp .env.production.example .env.production
nano .env.production
```

### 3. Ініціалізація бази даних

```bash
npm run db:push
```

### 4. Тестування production launcher

```bash
# Завантаження змінних оточення
export $(grep -v '^#' .env.production | xargs)

# Тестовий запуск
npx tsx server/production.ts
```

### 5. Налаштування systemd service

```bash
# Оновлення шляхів в service файлі
sed "s|/home/runner/workspace|$(pwd)|g" regmik-erp-simple.service > regmik-erp.service
sed -i "s|User=runner|User=$(whoami)|g" regmik-erp.service

# Встановлення service
sudo cp regmik-erp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable regmik-erp
sudo systemctl start regmik-erp
```

## Управління сервісом

### Основні команди

```bash
# Статус сервісу
sudo systemctl status regmik-erp

# Перегляд логів в реальному часі
sudo journalctl -u regmik-erp -f

# Перезапуск сервісу
sudo systemctl restart regmik-erp

# Зупинка сервісу
sudo systemctl stop regmik-erp

# Відключення автозапуску
sudo systemctl disable regmik-erp
```

### Перегляд портів

```bash
# Перевірка відкритих портів
netstat -tuln | grep :3000

# Перевірка процесів
ps aux | grep regmik
```

## Мережеве налаштування

### Firewall (UFW)

```bash
# Дозвіл трафіку на порт 3000
sudo ufw allow 3000/tcp
sudo ufw status
```

### Proxmox налаштування

В Proxmox web interface:
1. Відкрийте налаштування контейнера
2. Network → Додайте правило port forwarding
3. Host port: 3000 → Container port: 3000

## Доступ до додатка

Після успішного розгортання:

- **Local access**: http://localhost:3000
- **Network access**: http://[container-ip]:3000
- **Proxmox host**: http://[proxmox-ip]:3000 (з port forwarding)

## Діагностика проблем

### Перевірка сервісу

```bash
# Статус
sudo systemctl is-active regmik-erp

# Детальна інформація
sudo systemctl status regmik-erp -l

# Повні логи
sudo journalctl -u regmik-erp --no-pager
```

### Перевірка бази даних

```bash
# Тестування з'єднання
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => {
  console.log('Database connected:', res.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('Database error:', err.message);
  process.exit(1);
});
"
```

### Типові проблеми

1. **Port already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 [PID]
   ```

2. **Permission denied**
   ```bash
   sudo chown -R $(whoami):$(whoami) /path/to/regmik-erp
   ```

3. **Database connection failed**
   - Перевірте змінні оточення в `.env.production`
   - Перевірте мережеве з'єднання до Neon database

## Оновлення системи

### Оновлення коду

```bash
cd /path/to/regmik-erp
git pull origin main
npm install
sudo systemctl restart regmik-erp
```

### Оновлення бази даних

```bash
npm run db:push
sudo systemctl restart regmik-erp
```

## Безпека

### Рекомендації

1. Використовуйте сильні паролі в `.env.production`
2. Обмежте доступ до файлів конфігурації:
   ```bash
   chmod 600 .env.production
   ```
3. Регулярно оновлюйте систему та залежності
4. Використовуйте firewall для обмеження доступу

### Backup

```bash
# Backup конфігурації
cp .env.production .env.production.backup.$(date +%Y%m%d)

# Backup логів
sudo journalctl -u regmik-erp > regmik-erp.logs.$(date +%Y%m%d)
```

## Підтримка

У разі проблем:
1. Перевірте логи: `sudo journalctl -u regmik-erp -f`
2. Перевірте статус: `sudo systemctl status regmik-erp`
3. Перевірте мережеве з'єднання
4. Перевірте файли конфігурації

**Система готова до production використання!**