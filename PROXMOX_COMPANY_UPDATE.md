# REGMIK ERP - Оновлення модуля "Компанії" для Proxmox

## Проблема
Продакшн сервер на Proxmox (192.168.0.247:5000) має застарілу збірку, що викликає помилки:
- `storage.getCompanies is not a function`
- `storage.createCompany is not a function`
- `Cannot find package 'vite'` - Vite не повинен бути в продакшні

## Рішення
Продакшн збірка потребує оновлення з новою функціональністю управління компаніями та виправленням залежностей.

## Кроки розгортання

### 1. Створення продакшн збірки
```bash
# На машині розробки
./build-for-proxmox.sh
```

### 2. Завантаження на Proxmox сервер
```bash
# Завантажити deployment-package на сервер
scp -r deployment-package/* root@192.168.0.247:/tmp/regmik-update/
```

### 3. Розгортання на Proxmox сервері
```bash
# Підключення до Proxmox сервера
ssh root@192.168.0.247

# Зупинка сервісу
sudo systemctl stop regmik-erp

# Створення резервної копії
sudo cp -r /opt/REGMIK_ERP /opt/REGMIK_ERP_backup_$(date +%Y%m%d_%H%M%S)

# Оновлення файлів
sudo cp -r /tmp/regmik-update/* /opt/REGMIK_ERP/

# Встановлення прав доступу
sudo chown -R regmik:regmik /opt/REGMIK_ERP
sudo chmod +x /opt/REGMIK_ERP/start-production.sh

# Встановлення залежностей
cd /opt/REGMIK_ERP
sudo -u regmik npm install --production

# Застосування UTF8 налаштувань (ВАЖЛИВО!)
sudo -u regmik psql $DATABASE_URL -f apply-utf8-setup.sql

# Оновлення схеми бази даних (опціонально, якщо потрібно)
# sudo -u regmik npm run db:push

# Запуск сервісу
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

### 4. Перевірка розгортання
```bash
# Перегляд логів
sudo journalctl -u regmik-erp -f

# Тестування функціональності компаній
curl -b cookies.txt http://192.168.0.247:5000/api/companies
```

## Оновлені файли
- `server/production.ts` - Новий продакшн сервер без Vite залежностей
- `server/db-storage.ts` - Додані методи управління компаніями
- `server/storage.ts` - Оновлений інтерфейс сховища
- `server/routes.ts` - Додані API ендпоінти для компаній
- `client/src/pages/companies.tsx` - UI управління компаніями
- `shared/schema.ts` - Структури даних компаній

## Очікуваний результат
Після розгортання модуль "Компанії" повинен працювати коректно:
- Перегляд списку компаній: ✅
- Створення нових компаній: ✅
- Редагування існуючих компаній: ✅
- Відсутність помилок "function not found": ✅
- Відсутність помилок Vite залежностей: ✅