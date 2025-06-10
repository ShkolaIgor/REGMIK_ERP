# ОСТАТОЧНЕ РІШЕННЯ ДЛЯ ПРОДАКШН-СИСТЕМИ

## Поточна проблема
Продакшн-сервер 192.168.0.247:5000 використовує застарілий код, який викликає помилки:
- `column "first_name" does not exist` при відновленні паролю
- `column "created_at" does not exist` при налаштуваннях email
- `invalid input syntax for type integer: "NaN"` при demo вході

## ПРОСТИЙ СПОСІБ ВИПРАВЛЕННЯ

### Варіант 1: Пряме завантаження через SCP (рекомендується)
```bash
# Запустити з вашого комп'ютера
chmod +x deploy-to-production.sh
./deploy-to-production.sh
```

### Варіант 2: Ручне оновлення через SSH
Підключитися до сервера та виконати:

```bash
ssh root@192.168.0.247
cd /opt/REGMIK_ERP

# Зупинити сервіс
systemctl stop regmik-erp.service

# Створити бекап
cp -r dist dist_emergency_$(date +%Y%m%d_%H%M%S)

# Примусове оновлення
git fetch origin
git reset --hard origin/main
git clean -fd

# Перекомпілювати
rm -rf node_modules dist
npm ci
npm run build

# Виправити базу даних
sudo -u postgres psql -d regmik_erp -c "
ALTER TABLE email_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
UPDATE email_settings SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
"

# Запустити сервіс
systemctl start regmik-erp.service
systemctl status regmik-erp.service
```

### Варіант 3: Аварійний скрипт
```bash
# Завантажити та запустити аварійний скрипт
chmod +x fix-production-emergency.sh
sudo ./fix-production-emergency.sh
```

## ПЕРЕВІРКА ПІСЛЯ ОНОВЛЕННЯ

### Тест 1: Demo вхід
```bash
curl -X POST http://localhost:5000/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```
Очікується: `{"success":true,"user":{...}}`

### Тест 2: Відновлення паролю
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ihor@regmik.ua"}'
```
Очікується: `{"message":"Якщо email існує в системі, лист буде відправлено"}`

## АЛЬТЕРНАТИВНЕ РІШЕННЯ (якщо вище не працює)

### Пряме редагування скомпільованого файлу
Якщо оновлення через Git не працює, можна прямо відредагувати `/opt/REGMIK_ERP/dist/index.js`:

1. Знайти рядок з `getUserByEmail`
2. Замінити `.from(users)` на `.from(localUsers)`
3. Перезапустити сервіс

### Команди для пошуку та заміни:
```bash
# Знайти проблемну лінію
grep -n "getUserByEmail" /opt/REGMIK_ERP/dist/index.js

# Зробити backup
cp /opt/REGMIK_ERP/dist/index.js /opt/REGMIK_ERP/dist/index.js.backup

# Замінити users на localUsers в методі getUserByEmail
sed -i 's/\.from(users)/\.from(localUsers)/g' /opt/REGMIK_ERP/dist/index.js

# Перезапустити
systemctl restart regmik-erp.service
```

## РЕЗУЛЬТАТ ПІСЛЯ ВИПРАВЛЕННЯ

✅ Demo вхід працює (demo/demo123)
✅ Відновлення паролю не падає з помилкою
✅ Email налаштування зберігаються  
✅ Функція зміни паролю доступна в профілі

## КОНТАКТ ДЛЯ ПІДТРИМКИ

Якщо жоден з варіантів не працює:
1. Надішліть вивід команди: `journalctl -u regmik-erp.service -n 20`
2. Перевірте статус: `systemctl status regmik-erp.service`
3. Перевірте файли: `ls -la /opt/REGMIK_ERP/dist/`