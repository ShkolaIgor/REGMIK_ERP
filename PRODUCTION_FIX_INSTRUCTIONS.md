# Інструкції для виправлення критичних помилок в продакшн-системі

## Проблеми
1. Помилка `column "first_name" does not exist` при відновленні паролю
2. Помилка `column "created_at" does not exist` при оновленні email налаштувань
3. Помилка `invalid input syntax for type integer: "NaN"` при demo входi

## Причина
Продакшн-система використовує застарілий скомпільований код в `/opt/REGMIK_ERP/dist/`, який не містить останніх виправлень.

## Швидке виправлення

### Варіант 1: Оновлення через Git та компіляцію
```bash
# Підключитися до продакшн-сервера
ssh root@192.168.0.247

# Перейти в директорію проекту
cd /opt/REGMIK_ERP

# Зупинити сервіс
systemctl stop regmik-erp.service

# Створити backup
cp -r dist dist_backup_$(date +%Y%m%d_%H%M%S)

# Отримати останні зміни з Git
git pull origin main

# Перекомпілювати проект
npm run build

# Виправити схему бази даних
psql -U postgres -d regmik_erp -f fix-email-settings-schema.sql

# Запустити сервіс
systemctl start regmik-erp.service

# Перевірити статус
systemctl status regmik-erp.service
```

### Варіант 2: Ручне оновлення файлів
1. Скопіювати файли `shared/schema.ts` та `server/db-storage.ts` на продакшн-сервер
2. Запустити компіляцію
3. Перезапустити сервіс

## Перевірка виправлення
Після оновлення спробувати відновлення паролю через API:
```bash
curl -X POST http://192.168.0.247:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ihor@regmik.ua"}'
```

Очікуваний результат: статус 200 замість 500.

## Файли, що потребують оновлення
- `shared/schema.ts` - виправлена схема emailSettings з додаванням createdAt
- `server/db-storage.ts` - метод getUserByEmail використовує правильну таблицю localUsers
- `client/src/pages/profile.tsx` - додано функціонал зміни паролю

## Додаткові перевірки
1. Переконатися, що таблиця `local_users` має колонки `first_name` та `last_name`
2. Перевірити, що метод `getUserByEmail` звертається до `localUsers`, а не до `users`
3. Протестувати функціонал зміни паролю в профілі користувача