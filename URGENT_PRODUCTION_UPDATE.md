# ТЕРМІНОВЕ ОНОВЛЕННЯ ПРОДАКШН-СИСТЕМИ

## Поточна ситуація
Продакшн-система на 192.168.0.247:5000 використовує застарілий код і має критичні помилки:
- Demo вхід не працює
- Відновлення паролю падає з помилкою
- Email налаштування не зберігаються

## НЕГАЙНІ ДІЇ

### 1. Підключитися до сервера
```bash
ssh root@192.168.0.247
```

### 2. Перейти в директорію проекту
```bash
cd /opt/REGMIK_ERP
```

### 3. Зупинити сервіс
```bash
systemctl stop regmik-erp.service
```

### 4. Створити бекап
```bash
cp -r dist dist_backup_$(date +%Y%m%d_%H%M%S)
```

### 5. Оновити код
```bash
git fetch origin
git pull origin main
```

### 6. Перекомпілювати
```bash
npm run build
```

### 7. Виправити базу даних
```bash
cat > fix_db.sql << 'EOF'
ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE email_settings 
SET created_at = CURRENT_TIMESTAMP 
WHERE created_at IS NULL;
EOF

sudo -u postgres psql -d regmik_erp -f fix_db.sql
```

### 8. Запустити сервіс
```bash
systemctl start regmik-erp.service
systemctl status regmik-erp.service
```

### 9. Перевірити роботу
```bash
# Тест demo входу
curl -X POST http://localhost:5000/api/auth/simple-login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# Тест відновлення паролю
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"ihor@regmik.ua"}'
```

## Альтернативний спосіб (якщо немає доступу до SSH)

### Через веб-інтерфейс хостингу:
1. Зайти в файловий менеджер
2. Завантажити файли з цього проекту в `/opt/REGMIK_ERP/`
3. Перезапустити сервіс через панель керування

### Файли для завантаження:
- `server/simple-auth.ts`
- `server/routes.ts` 
- `shared/schema.ts`
- `client/src/pages/profile.tsx`

## Очікувані результати після оновлення:
✅ Demo вхід працює (demo/demo123)
✅ Відновлення паролю надсилає email
✅ Зміна паролю працює в профілі
✅ Email налаштування зберігаються

## У разі проблем:
```bash
# Переглянути логи
journalctl -u regmik-erp.service -f

# Відкатитися до бекапу
systemctl stop regmik-erp.service
rm -rf dist
mv dist_backup_YYYYMMDD_HHMMSS dist
systemctl start regmik-erp.service
```

## Контакт для допомоги
Якщо виникнуть проблеми під час оновлення, надішліть логи помилок.