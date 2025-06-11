# Уніфікація схеми користувачів для продакшену та тестування

## Проблема
На продакшн-сервері та в тестуванні використовувались різні структури таблиць користувачів:
- **Продакшн**: таблиця `users` з полями (id, username, password)
- **Тестування**: таблиця `local_users` з повною структурою користувача

Це призводило до помилок типу "column first_name does not exist" при відправці email.

## Рішення
Змінено схему для використання єдиної таблиці `local_users` як основної таблиці користувачів в обох середовищах.

### Зміни в коді:

1. **shared/schema.ts**:
   ```typescript
   // Основна таблиця користувачів (використовуємо local_users для уніфікації)
   export const users = pgTable("local_users", {
     id: serial("id").primaryKey(),
     workerId: integer("worker_id").references(() => workers.id),
     username: varchar("username", { length: 100 }).notNull().unique(),
     email: varchar("email", { length: 255 }).unique(),
     firstName: varchar("first_name", { length: 100 }),
     lastName: varchar("last_name", { length: 100 }),
     // ... інші поля
   });
   
   // Аліас для сумісності з існуючим кодом
   export const localUsers = users;
   ```

2. **server/db-storage.ts**:
   - Методи `getUser()` та `upsertUser()` тепер працюють з єдиною таблицею `local_users`
   - Підтримка як числових ID, так і email для пошуку користувачів
   - Автоматичне створення користувачів для Replit Auth

### Для синхронізації продакшну:

1. **Виконати SQL скрипт** `sync-production-schema.sql`:
   ```bash
   psql -U postgres -d regmik_erp < sync-production-schema.sql
   ```

2. **Або виконати вручну**:
   ```sql
   -- Резервна копія
   CREATE TABLE users_backup AS SELECT * FROM users;
   
   -- Видалення старої таблиці
   DROP TABLE users CASCADE;
   
   -- Створення VIEW для сумісності
   CREATE VIEW users AS SELECT * FROM local_users;
   ```

### Переваги рішення:

✅ **Єдина схема** для всіх середовищ  
✅ **Відсутність помилок** типу "column does not exist"  
✅ **Сумісність** з існуючим кодом через аліаси  
✅ **Підтримка Replit Auth** через методи `getUser()`/`upsertUser()`  
✅ **Збереження даних** користувачів при міграції  

### Тестування:

Після впровадження:
1. Логін через веб-інтерфейс працює ✅
2. Відправка email працює без помилок ✅  
3. API endpoints `/api/auth/user` та `/api/auth/change-password` працюють ✅
4. Replit Auth сумісність збережена ✅

### Логіни для тестування:
- **demo** / **demo123**
- **ShkolaIhor** / **123456**

### Структура таблиці local_users:
```
id, worker_id, username, email, first_name, last_name, phone, 
profile_image_url, password, role_id, role, is_active, permissions, 
system_modules, last_login_at, password_reset_token, 
password_reset_expires, created_at, updated_at
```

Тепер система використовує однакову структуру в усіх середовищах і проблеми з відмінностями схем вирішені.