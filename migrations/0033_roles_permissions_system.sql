-- Migration 0033: Система ролей та дозволів користувачів
-- Створення таблиць для управління ролями, дозволами та доступом до модулів системи

-- Таблиця дозволів
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    module_id INTEGER REFERENCES system_modules(id),
    action VARCHAR(50) NOT NULL, -- read, write, delete, execute
    resource_type VARCHAR(100), -- orders, products, clients тощо
    is_system_permission BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблиця зв'язку ролей з дозволами
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) NOT NULL,
    granted BOOLEAN DEFAULT true, -- дозволено чи заборонено
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Таблиця персональних дозволів користувачів
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES local_users(id) NOT NULL,
    permission_id INTEGER REFERENCES permissions(id) NOT NULL,
    granted BOOLEAN DEFAULT true,
    grantor INTEGER REFERENCES local_users(id), -- хто надав дозвіл
    expires_at TIMESTAMP, -- термін дії дозволу
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- Індекси для оптимізації
CREATE INDEX IF NOT EXISTS idx_permissions_module_id ON permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_type ON permissions(resource_type);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Базові модулі системи
INSERT INTO system_modules (name, display_name, description, icon, route, is_active, sort_order) VALUES
('dashboard', 'Головна панель', 'Головна сторінка з аналітикою та статистикою', 'Home', '/', true, 1),
('orders', 'Замовлення', 'Управління замовленнями клієнтів', 'ShoppingCart', '/orders', true, 2),
('products', 'Товари', 'Управління каталогом товарів', 'Package', '/products', true, 3),
('clients', 'Клієнти', 'Управління базою клієнтів', 'Users', '/clients', true, 4),
('warehouses', 'Склади', 'Управління складськими приміщеннями', 'Building', '/warehouses', true, 5),
('shipments', 'Відвантаження', 'Логістика та відправка товарів', 'Truck', '/shipments', true, 6),
('nova_poshta', 'Нова Пошта', 'Інтеграція з перевізником Нова Пошта', 'Package2', '/nova-poshta', true, 7),
('inventory', 'Складські залишки', 'Управління залишками товарів на складах', 'Boxes', '/inventory', true, 8),
('serial_numbers', 'Серійні номери', 'Облік серійних номерів товарів', 'Hash', '/serial-numbers', true, 9),
('companies', 'Компанії', 'Управління компаніями в мультифірмовому режимі', 'Building2', '/companies', true, 10),
('users', 'Користувачі', 'Управління користувачами системи', 'UserCog', '/users', true, 11),
('roles', 'Ролі та дозволи', 'Налаштування ролей користувачів та дозволів', 'Shield', '/roles', true, 12),
('reports', 'Звіти', 'Генерація та перегляд звітів', 'FileText', '/reports', true, 13),
('settings', 'Налаштування', 'Системні налаштування', 'Settings', '/settings', true, 14),
('email', 'Email', 'Налаштування email та поштових розсилок', 'Mail', '/email-settings', true, 15);

-- Базові дозволи для кожного модуля
INSERT INTO permissions (name, display_name, description, module_id, action, resource_type) 
SELECT 
    CONCAT(sm.name, '_read'), 
    CONCAT('Перегляд - ', sm.display_name), 
    CONCAT('Дозвіл на перегляд даних модуля ', sm.display_name), 
    sm.id, 
    'read', 
    sm.name
FROM system_modules sm;

INSERT INTO permissions (name, display_name, description, module_id, action, resource_type) 
SELECT 
    CONCAT(sm.name, '_write'), 
    CONCAT('Редагування - ', sm.display_name), 
    CONCAT('Дозвіл на створення та редагування даних модуля ', sm.display_name), 
    sm.id, 
    'write', 
    sm.name
FROM system_modules sm;

INSERT INTO permissions (name, display_name, description, module_id, action, resource_type) 
SELECT 
    CONCAT(sm.name, '_delete'), 
    CONCAT('Видалення - ', sm.display_name), 
    CONCAT('Дозвіл на видалення даних модуля ', sm.display_name), 
    sm.id, 
    'delete', 
    sm.name
FROM system_modules sm;

-- Базові ролі системи
INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
('super_admin', 'Супер Адміністратор', 'Повний доступ до всіх функцій системи', '{"all": true}', true),
('admin', 'Адміністратор', 'Адміністративний доступ до основних функцій', '{"modules": ["*"], "restrictions": []}', true),
('manager', 'Менеджер', 'Доступ до управління замовленнями та клієнтами', '{"modules": ["orders", "clients", "products", "shipments"], "actions": ["read", "write"]}', true),
('operator', 'Оператор', 'Доступ до введення та обробки замовлень', '{"modules": ["orders", "clients", "products"], "actions": ["read", "write"]}', true),
('warehouse_manager', 'Завідувач складу', 'Управління складськими операціями', '{"modules": ["warehouses", "inventory", "serial_numbers", "products"], "actions": ["read", "write"]}', true),
('viewer', 'Переглядач', 'Тільки перегляд інформації', '{"modules": ["orders", "clients", "products", "inventory"], "actions": ["read"]}', true);

-- Призначення всіх дозволів супер адміністратору
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'), 
    p.id, 
    true
FROM permissions p;

-- Призначення дозволів адміністратору (всі крім системних налаштувань ролей)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'), 
    p.id, 
    true
FROM permissions p
WHERE p.resource_type != 'roles';

-- Призначення дозволів менеджеру
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'), 
    p.id, 
    true
FROM permissions p
WHERE p.resource_type IN ('orders', 'clients', 'products', 'shipments', 'nova_poshta', 'dashboard')
AND p.action IN ('read', 'write');

-- Призначення дозволів оператору
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'operator'), 
    p.id, 
    true
FROM permissions p
WHERE p.resource_type IN ('orders', 'clients', 'products', 'dashboard')
AND p.action IN ('read', 'write');

-- Призначення дозволів завідувачу складу
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'warehouse_manager'), 
    p.id, 
    true
FROM permissions p
WHERE p.resource_type IN ('warehouses', 'inventory', 'serial_numbers', 'products', 'dashboard')
AND p.action IN ('read', 'write');

-- Призначення дозволів переглядачу
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'viewer'), 
    p.id, 
    true
FROM permissions p
WHERE p.resource_type IN ('orders', 'clients', 'products', 'inventory', 'dashboard')
AND p.action = 'read';

-- Створення тригера для автоматичного призначення базової ролі новим користувачам
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role_id IS NULL THEN
        NEW.role_id := (SELECT id FROM roles WHERE name = 'viewer' LIMIT 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_default_role
    BEFORE INSERT ON local_users
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_role();

-- Коментарі до таблиць
COMMENT ON TABLE permissions IS 'Таблиця дозволів системи для детального управління доступом';
COMMENT ON TABLE role_permissions IS 'Зв''язок ролей з дозволами';
COMMENT ON TABLE user_permissions IS 'Персональні дозволи користувачів, які перевизначають ролі';

COMMENT ON COLUMN permissions.action IS 'Тип дії: read (читання), write (запис), delete (видалення), execute (виконання)';
COMMENT ON COLUMN permissions.resource_type IS 'Тип ресурсу до якого застосовується дозвіл';
COMMENT ON COLUMN user_permissions.expires_at IS 'Дата закінчення дії персонального дозволу';
COMMENT ON COLUMN user_permissions.grantor IS 'ID користувача, який надав персональний дозвіл';