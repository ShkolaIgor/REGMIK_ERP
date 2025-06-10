# Інструкції розгортання REGMIK ERP на Proxmox

## Швидке розгортання

### На машині розробки:
```bash
# Завантажити на Proxmox сервер
scp -r deployment-package/* root@192.168.0.247:/tmp/regmik-update/
```

### На Proxmox сервері:
```bash
# Підключення
ssh root@192.168.0.247

# Зупинка та резервне копіювання
sudo systemctl stop regmik-erp
sudo cp -r /opt/REGMIK_ERP /opt/REGMIK_ERP_backup_$(date +%Y%m%d_%H%M%S)

# Оновлення
sudo cp -r /tmp/regmik-update/* /opt/REGMIK_ERP/
sudo chown -R regmik:regmik /opt/REGMIK_ERP
sudo chmod +x /opt/REGMIK_ERP/start-production.sh

# Встановлення залежностей
cd /opt/REGMIK_ERP
sudo -u regmik npm install --production

# Застосування UTF8 налаштувань
sudo -u regmik psql $DATABASE_URL -f apply-utf8-setup.sql

# Запуск
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

## Що виправлено у цій версії:

1. **Управління компаніями** - додано всі методи CRUD операцій
2. **UTF8 кодування** - повна підтримка української мови
3. **MIME типи** - виправлені помилки CSS та JavaScript файлів
4. **Продакшн сервер** - оптимізований без Vite залежностей
5. **Кеш Нової Пошти** - автоматична ініціалізація

## Перевірка після розгортання:
```bash
# Логи сервісу
sudo journalctl -u regmik-erp -f

# Тестування API
curl http://192.168.0.247:5000/api/companies
curl http://192.168.0.247:5000/

# Перевірка UTF8
sudo -u regmik psql $DATABASE_URL -c "SELECT 'Українська мова працює!' as test;"
```

Система готова до використання!