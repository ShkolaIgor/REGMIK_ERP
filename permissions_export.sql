-- SQL скрипт для перенесення дозволів в продакшн
-- Створено: 2025-06-18

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
-- Спочатку отримуємо ID модулів для призначення
DO $$
DECLARE 
  users_module_id INT;
  clients_module_id INT;
  orders_module_id INT;
  products_module_id INT;
  warehouses_module_id INT;
  companies_module_id INT;
  departments_module_id INT;
  workers_module_id INT;
  reports_module_id INT;
  settings_module_id INT;
  nova_poshta_module_id INT;
  xml_import_module_id INT;
  email_module_id INT;
  system_module_id INT;
BEGIN
  -- Отримуємо ID модулів
  SELECT id INTO users_module_id FROM system_modules WHERE name = 'users';
  SELECT id INTO clients_module_id FROM system_modules WHERE name = 'clients';
  SELECT id INTO orders_module_id FROM system_modules WHERE name = 'orders';
  SELECT id INTO products_module_id FROM system_modules WHERE name = 'products';
  SELECT id INTO warehouses_module_id FROM system_modules WHERE name = 'warehouses';
  SELECT id INTO companies_module_id FROM system_modules WHERE name = 'companies';
  SELECT id INTO departments_module_id FROM system_modules WHERE name = 'departments';
  SELECT id INTO workers_module_id FROM system_modules WHERE name = 'workers';
  SELECT id INTO reports_module_id FROM system_modules WHERE name = 'reports';
  SELECT id INTO settings_module_id FROM system_modules WHERE name = 'settings';
  SELECT id INTO nova_poshta_module_id FROM system_modules WHERE name = 'nova_poshta';
  SELECT id INTO xml_import_module_id FROM system_modules WHERE name = 'xml_import';
  SELECT id INTO email_module_id FROM system_modules WHERE name = 'email';
  SELECT id INTO system_module_id FROM system_modules WHERE name = 'system';

INSERT INTO permissions (name, display_name, description, action, resource_type, module_id) 
VALUES 
  ('users.view', 'Перегляд користувачів', 'Перегляд користувачів', 'view', 'users', users_module_id),
  ('users.create', 'Створення користувачів', 'Створення користувачів', 'create', 'users', users_module_id),
  ('users.edit', 'Редагування користувачів', 'Редагування користувачів', 'edit', 'users', users_module_id),
  ('users.delete', 'Видалення користувачів', 'Видалення користувачів', 'delete', 'users', users_module_id),
  ('clients.view', 'Перегляд клієнтів', 'Перегляд клієнтів', 'view', 'clients', clients_module_id),
  ('clients.create', 'Створення клієнтів', 'Створення клієнтів', 'create', 'clients', clients_module_id),
  ('clients.edit', 'Редагування клієнтів', 'Редагування клієнтів', 'edit', 'clients', clients_module_id),
  ('clients.delete', 'Видалення клієнтів', 'Видалення клієнтів', 'delete', 'clients', clients_module_id),
  ('orders.view', 'Перегляд замовлень', 'Перегляд замовлень', 'view', 'orders', orders_module_id),
  ('orders.create', 'Створення замовлень', 'Створення замовлень', 'create', 'orders', orders_module_id),
  ('orders.edit', 'Редагування замовлень', 'Редагування замовлень', 'edit', 'orders', orders_module_id),
  ('orders.delete', 'Видалення замовлень', 'Видалення замовлень', 'delete', 'orders', orders_module_id),
  ('products.view', 'Перегляд товарів', 'Перегляд товарів', 'view', 'products', products_module_id),
  ('products.create', 'Створення товарів', 'Створення товарів', 'create', 'products', products_module_id),
  ('products.edit', 'Редагування товарів', 'Редагування товарів', 'edit', 'products', products_module_id),
  ('products.delete', 'Видалення товарів', 'Видалення товарів', 'delete', 'products', products_module_id),
  ('warehouses.view', 'Перегляд складів', 'Перегляд складів', 'view', 'warehouses', warehouses_module_id),
  ('warehouses.manage', 'Управління складами', 'Управління складами', 'manage', 'warehouses', warehouses_module_id),
  ('companies.view', 'Перегляд компаній', 'Перегляд компаній', 'view', 'companies', companies_module_id),
  ('companies.manage', 'Управління компаніями', 'Управління компаніями', 'manage', 'companies', companies_module_id),
  ('departments.view', 'Перегляд відділів', 'Перегляд відділів', 'view', 'departments', departments_module_id),
  ('departments.manage', 'Управління відділами', 'Управління відділами', 'manage', 'departments', departments_module_id),
  ('workers.view', 'Перегляд працівників', 'Перегляд працівників', 'view', 'workers', workers_module_id),
  ('workers.manage', 'Управління працівниками', 'Управління працівниками', 'manage', 'workers', workers_module_id),
  ('reports.view', 'Перегляд звітів', 'Перегляд звітів', 'view', 'reports', reports_module_id),
  ('reports.generate', 'Генерація звітів', 'Генерація звітів', 'generate', 'reports', reports_module_id),
  ('settings.view', 'Перегляд налаштувань', 'Перегляд налаштувань', 'view', 'settings', settings_module_id),
  ('settings.manage', 'Управління налаштуваннями', 'Управління налаштуваннями', 'manage', 'settings', settings_module_id),
  ('nova_poshta.view', 'Перегляд даних Нової Пошти', 'Перегляд даних Нової Пошти', 'view', 'nova_poshta', nova_poshta_module_id),
  ('nova_poshta.sync', 'Синхронізація з Новою Поштою', 'Синхронізація з Новою Поштою', 'sync', 'nova_poshta', nova_poshta_module_id),
  ('xml_import.view', 'Перегляд XML імпорту', 'Перегляд XML імпорту', 'view', 'xml_import', xml_import_module_id),
  ('xml_import.execute', 'Виконання XML імпорту', 'Виконання XML імпорту', 'execute', 'xml_import', xml_import_module_id),
  ('email.send', 'Відправка електронної пошти', 'Відправка електронної пошти', 'send', 'email', email_module_id),
  ('system.backup', 'Створення резервних копій', 'Створення резервних копій', 'backup', 'system', system_module_id),
  ('system.restore', 'Відновлення з резервних копій', 'Відновлення з резервних копій', 'restore', 'system', system_module_id)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  action = EXCLUDED.action,
  resource_type = EXCLUDED.resource_type,
  module_id = EXCLUDED.module_id;

END $$;

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
ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO UPDATE SET
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
ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO UPDATE SET
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
ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO UPDATE SET
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
ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO UPDATE SET
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