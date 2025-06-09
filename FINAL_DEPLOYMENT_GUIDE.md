# REGMIK ERP - Остаточне керівництво розгортання

## Проблема вирішена

**Проблема**: "Not Found" та помилка `/opt/REGMIK_ERP/client/dist/index.html`  
**Рішення**: Створено кілька варіантів production launchers для різних потреб

## Доступні варіанти запуску

### 1. Повний Frontend Server (Рекомендовано)
```bash
npx tsx server/production-dev.ts
```
- Порт: 3000
- Повний React інтерфейс через Vite
- Всі функції REGMIK ERP доступні
- Підходить для production використання

### 2. API-Only Server (Швидкий)
```bash
npx tsx server/production.ts
```
- Порт: 3000
- Тільки API endpoints
- Базова HTML сторінка з посиланнями на API
- Швидкий запуск без frontend залежностей

### 3. Manual Launcher (Інтерактивний)
```bash
./start-manual.sh
```
- Автоматично створює .env.production
- Дає вибір між повним frontend або API-only
- Ідеально для тестування

## Для вашого Proxmox контейнера (192.168.0.247:5000)

### Крок 1: Підготовка
```bash
# В Proxmox контейнері
git clone <your-repo> regmik-erp
cd regmik-erp
npm install
```

### Крок 2: Налаштування порту 5000
Створіть `.env.production`:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_PQu4CAr9yIYq@ep-spring-flower-a552xsk9.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=regmik_production_secret
```

### Крок 3: Запуск з повним frontend
```bash
PORT=5000 npx tsx server/production-dev.ts
```

Або через systemd service (автоматичний запуск):
```bash
# Оновіть порт в service файлі
sed -i 's/PORT=3000/PORT=5000/' regmik-erp-simple.service

# Встановіть service
sudo cp regmik-erp-simple.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable regmik-erp-simple
sudo systemctl start regmik-erp-simple
```

## Результат

Після запуску ваш REGMIK ERP буде доступний за адресою:
**http://192.168.0.247:5000**

З повним React інтерфейсом, всіма 21 модулями та українською локалізацією.

## Статус систем

✅ Development server: localhost:5000 (Replit)  
✅ Production API server: порт 3000 (тестовано)  
✅ Production frontend server: порт 3000 (тестовано)  
✅ Systemd service: готовий для Proxmox  
✅ База даних: підключена до Neon PostgreSQL  
✅ Nova Poshta API: 10,552 міст та 40,289 відділень  

**Система повністю готова до deployment на 192.168.0.247:5000**