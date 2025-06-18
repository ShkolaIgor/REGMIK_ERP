-- SQL скрипт для перенесення дозволів в продакшн
-- Створено: 2025-06-18

-- 0. Створюємо необхідні унікальні індекси
CREATE UNIQUE INDEX IF NOT EXISTS permissions_name_unique ON permissions (name);
CREATE UNIQUE INDEX IF NOT EXISTS roles_name_unique ON roles (name);
CREATE UNIQUE INDEX IF NOT EXISTS system_modules_name_unique ON system_modules (name);

-- 1. Спочатку створюємо ролі, якщо їх немає
INSERT INTO roles (name, display_name, description, permissions) 
VALUES 
  ('admin', 'Адміністратор', 'Повні права доступу до системи', '[]'),
  ('manager', 'Менеджер', 'Права менеджера для управління замовленнями та клієнтами', '[]'),
  ('operator', 'Оператор', 'Базові права для роботи з замовленнями', '[]'),
  ('viewer', 'Глядач', 'Права тільки для перегляду', '[]')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- 2. Створюємо дозволи, якщо їх немає
INSERT INTO permissions (name, display_name, description, action) 
VALUES 
  ('users.view', 'Перегляд користувачів', 'Перегляд користувачів', 'view'),
  ('users.create', 'Створення користувачів', 'Створення користувачів', 'create'),
  ('users.edit', 'Редагування користувачів', 'Редагування користувачів', 'edit'),
  ('users.delete', 'Видалення користувачів', 'Видалення користувачів', 'delete'),
  ('clients.view', 'Перегляд клієнтів', 'Перегляд клієнтів', 'view'),
  ('clients.create', 'Створення клієнтів', 'Створення клієнтів', 'create'),
  ('clients.edit', 'Редагування клієнтів', 'Редагування клієнтів', 'edit'),
  ('clients.delete', 'Видалення клієнтів', 'Видалення клієнтів', 'delete'),
  ('orders.view', 'Перегляд замовлень', 'Перегляд замовлень', 'view'),
  ('orders.create', 'Створення замовлень', 'Створення замовлень', 'create'),
  ('orders.edit', 'Редагування замовлень', 'Редагування замовлень', 'edit'),
  ('orders.delete', 'Видалення замовлень', 'Видалення замовлень', 'delete'),
  ('products.view', 'Перегляд товарів', 'Перегляд товарів', 'view'),
  ('products.create', 'Створення товарів', 'Створення товарів', 'create'),
  ('products.edit', 'Редагування товарів', 'Редагування товарів', 'edit'),
  ('products.delete', 'Видалення товарів', 'Видалення товарів', 'delete'),
  ('warehouses.view', 'Перегляд складів', 'Перегляд складів', 'view'),
  ('warehouses.manage', 'Управління складами', 'Управління складами', 'manage'),
  ('companies.view', 'Перегляд компаній', 'Перегляд компаній', 'view'),
  ('companies.manage', 'Управління компаніями', 'Управління компаніями', 'manage'),
  ('departments.view', 'Перегляд відділів', 'Перегляд відділів', 'view'),
  ('departments.manage', 'Управління відділами', 'Управління відділами', 'manage'),
  ('workers.view', 'Перегляд працівників', 'Перегляд працівників', 'view'),
  ('workers.manage', 'Управління працівниками', 'Управління працівниками', 'manage'),
  ('reports.view', 'Перегляд звітів', 'Перегляд звітів', 'view'),
  ('reports.generate', 'Генерація звітів', 'Генерація звітів', 'generate'),
  ('settings.view', 'Перегляд налаштувань', 'Перегляд налаштувань', 'view'),
  ('settings.manage', 'Управління налаштуваннями', 'Управління налаштуваннями', 'manage'),
  ('nova_poshta.view', 'Перегляд даних Нової Пошти', 'Перегляд даних Нової Пошти', 'view'),
  ('nova_poshta.sync', 'Синхронізація з Новою Поштою', 'Синхронізація з Новою Поштою', 'sync'),
  ('xml_import.view', 'Перегляд XML імпорту', 'Перегляд XML імпорту', 'view'),
  ('xml_import.execute', 'Виконання XML імпорту', 'Виконання XML імпорту', 'execute'),
  ('email.send', 'Відправка електронної пошти', 'Відправка електронної пошти', 'send'),
  ('system.backup', 'Створення резервних копій', 'Створення резервних копій', 'backup'),
  ('system.restore', 'Відновлення з резервних копій', 'Відновлення з резервних копій', 'restore')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  action = EXCLUDED.action;

-- 3. Призначаємо дозволи ролям
-- Адміністратор - всі дозволи
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  p.id as permission_id,
  true as granted
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted;

-- Менеджер - більшість дозволів окрім системних
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  p.id as permission_id,
  true as granted
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'manager' 
  AND p.name NOT IN ('system.backup', 'system.restore', 'settings.manage', 'users.delete')
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted;

-- Оператор - основні дозволи для роботи
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  p.id as permission_id,
  true as granted
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'operator' 
  AND p.name IN (
    'clients.view', 'clients.create', 'clients.edit',
    'orders.view', 'orders.create', 'orders.edit',
    'products.view', 'products.create', 'products.edit',
    'warehouses.view',
    'nova_poshta.view',
    'email.send',
    'reports.view'
  )
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted;

-- Глядач - тільки перегляд
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
  r.id as role_id,
  p.id as permission_id,
  true as granted
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer' 
  AND p.name LIKE '%.view'
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  granted = EXCLUDED.granted;

-- 4. Оновлюємо системні модулі
INSERT INTO system_modules (name, display_name, description, is_active, sort_order) 
VALUES 
  ('users', 'Користувачі', 'Управління користувачами системи', true, 1),
  ('clients', 'Клієнти', 'Управління клієнтами', true, 2),
  ('orders', 'Замовлення', 'Управління замовленнями', true, 3),
  ('products', 'Товари', 'Управління товарами', true, 4),
  ('warehouses', 'Склади', 'Управління складами', true, 5),
  ('companies', 'Компанії', 'Управління компаніями', true, 6),
  ('departments', 'Відділи', 'Управління відділами', true, 7),
  ('workers', 'Працівники', 'Управління працівниками', true, 8),
  ('reports', 'Звіти', 'Генерація звітів', true, 9),
  ('settings', 'Налаштування', 'Системні налаштування', true, 10),
  ('nova_poshta', 'Нова Пошта', 'Інтеграція з Новою Поштою', true, 11),
  ('xml_import', 'XML Імпорт', 'Імпорт даних з XML', true, 12),
  ('email', 'Електронна пошта', 'Відправка пошти', true, 13),
  ('system', 'Система', 'Системні функції', true, 14)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 5. Перевіряємо результат
SELECT 
  'Створено ролей:' as type,
  COUNT(*) as count
FROM roles
UNION ALL
SELECT 
  'Створено дозволів:' as type,
  COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
  'Призначено дозволів:' as type,
  COUNT(*) as count
FROM role_permissions
WHERE granted = true
UNION ALL
SELECT 
  'Системних модулів:' as type,
  COUNT(*) as count
FROM system_modules;

-- 6. Показуємо призначені дозволи по ролях
SELECT 
  r.name as role_name,
  COUNT(CASE WHEN rp.granted = true THEN 1 END) as granted_permissions,
  COUNT(rp.id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.name;