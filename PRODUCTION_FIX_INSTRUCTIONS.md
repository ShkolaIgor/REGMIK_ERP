# ІНСТРУКЦІЇ ДЛЯ ВИПРАВЛЕННЯ ПРОДАКШН-СЕРВЕРА

## Проблема
Помилка: `column "first_name" does not exist` виникає тому, що метод `getUserByEmail` в компільованому коді використовує стару таблицю `users` замість `localUsers`.

## ШВИДКЕ ВИПРАВЛЕННЯ (5 хвилин)

### Спосіб 1: Автоматичний скрипт
```bash
chmod +x update-production-fix.sh
./update-production-fix.sh
```

### Спосіб 2: Ручні команди на сервері
Підключіться до сервера та виконайте:

```bash
ssh root@192.168.0.247
cd /opt/REGMIK_ERP

# Зупинити сервіс
systemctl stop regmik-erp.service

# Зробити бекап
cp dist/index.js dist/index.js.backup_$(date +%Y%m%d_%H%M%S)

# Виправити getUserByEmail метод
sed -i 's/\.select().from(users).where(eq(users\.email/\.select().from(localUsers).where(eq(localUsers.email/g' dist/index.js

# Виправити всі посилання на users в контексті email
sed -i 's/\.from(users)/\.from(localUsers)/g' dist/index.js

# Виправити базу даних
sudo -u postgres psql -d regmik_erp -c "
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
"

# Запустити сервіс
systemctl start regmik-erp.service

# Перевірити статус
systemctl status regmik-erp.service
```

## ТЕСТУВАННЯ ПІСЛЯ ВИПРАВЛЕННЯ

### Тест 1: Відновлення паролю
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ihor@regmik.ua"}'
```
**Очікувана відповідь:** `{"message":"Якщо email існує в системі, лист буде відправлено"}`

### Тест 2: Demo вхід
```bash
curl -X POST http://localhost:5000/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```
**Очікувана відповідь:** `{"success":true,"user":{...}}`

### Тест 3: Перевірка логів
```bash
# Не повинно бути помилок про first_name
journalctl -u regmik-erp.service -n 20 | grep -i error
```

## АЛЬТЕРНАТИВНЕ РІШЕННЯ

Якщо SSH недоступний, скопіюйте файли з цього репозиторію на сервер:

1. **Завантажити виправлений код:**
```bash
# На локальному комп'ютері
scp server/db-storage.ts root@192.168.0.247:/opt/REGMIK_ERP/server/
scp server/routes.ts root@192.168.0.247:/opt/REGMIK_ERP/server/

# На сервері
cd /opt/REGMIK_ERP
npm run build
systemctl restart regmik-erp.service
```

## РЕЗУЛЬТАТ

Після виправлення:
- ✅ Відновлення паролю працює без помилок
- ✅ Demo вхід функціонує (demo/demo123)  
- ✅ Зміна паролю доступна в профілі
- ✅ Email налаштування зберігаються

## ПЕРЕВІРКА УСПІШНОСТІ

Відкрийте http://192.168.0.247:5000 та:
1. Спробуйте demo вхід (demo/demo123)
2. Перейдіть в профіль 
3. Спробуйте змінити пароль
4. Спробуйте відновлення паролю

Всі функції повинні працювати без помилок в логах.