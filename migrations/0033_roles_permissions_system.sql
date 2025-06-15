-- Migration 0033: Roles and Permissions System
-- Created: 2025-01-15
-- Description: Complete implementation of roles and permissions system

-- Create system_modules table
CREATE TABLE IF NOT EXISTS system_modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  route VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER,
  parent_module_id INTEGER REFERENCES system_modules(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  module_id INTEGER REFERENCES system_modules(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100),
  is_system_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- Add role_id to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role_id') THEN
    ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id);
  END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_module_id ON permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- Insert system modules
INSERT INTO system_modules (name, display_name, description, icon, route, sort_order) VALUES
('dashboard', 'Панель управління', 'Головна панель адміністратора з оглядом системи', 'LayoutDashboard', '/dashboard', 1),
('orders', 'Замовлення', 'Управління замовленнями клієнтів', 'ShoppingCart', '/orders', 2),
('products', 'Товари', 'Управління каталогом товарів', 'Package', '/products', 3),
('inventory', 'Склад', 'Управління запасами та складськими операціями', 'Warehouse', '/inventory', 4),
('shipping', 'Доставка', 'Управління відправленнями та логістикою', 'Truck', '/shipping', 5),
('clients', 'Клієнти', 'Управління базою клієнтів', 'Users', '/clients', 6),
('finances', 'Фінанси', 'Фінансовий облік та звітність', 'DollarSign', '/finances', 7),
('reports', 'Звіти', 'Аналітика та звітність', 'BarChart3', '/reports', 8),
('production', 'Виробництво', 'Планування та управління виробництвом', 'Factory', '/production', 9),
('integrations', 'Інтеграції', 'Налаштування зовнішніх інтеграцій', 'Settings', '/integrations', 10),
('administration', 'Адміністрування', 'Системне адміністрування', 'Shield', '/admin', 11)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  sort_order = EXCLUDED.sort_order;

-- Insert permissions for each module
INSERT INTO permissions (name, display_name, description, module_id, action, resource_type, is_system_permission) VALUES
-- Dashboard permissions
('dashboard_view', 'Перегляд панелі управління', 'Доступ до головної панелі управління', (SELECT id FROM system_modules WHERE name = 'dashboard'), 'read', 'dashboard', false),
('dashboard_analytics', 'Аналітика панелі', 'Перегляд аналітичних даних на панелі', (SELECT id FROM system_modules WHERE name = 'dashboard'), 'read', 'analytics', false),

-- Orders permissions
('orders_view', 'Перегляд замовлень', 'Перегляд списку замовлень', (SELECT id FROM system_modules WHERE name = 'orders'), 'read', 'order', false),
('orders_create', 'Створення замовлень', 'Створення нових замовлень', (SELECT id FROM system_modules WHERE name = 'orders'), 'create', 'order', false),
('orders_edit', 'Редагування замовлень', 'Редагування існуючих замовлень', (SELECT id FROM system_modules WHERE name = 'orders'), 'update', 'order', false),
('orders_delete', 'Видалення замовлень', 'Видалення замовлень', (SELECT id FROM system_modules WHERE name = 'orders'), 'delete', 'order', false),
('orders_status', 'Зміна статусу замовлень', 'Зміна статусу замовлень', (SELECT id FROM system_modules WHERE name = 'orders'), 'update', 'order_status', false),

-- Products permissions
('products_view', 'Перегляд товарів', 'Перегляд каталогу товарів', (SELECT id FROM system_modules WHERE name = 'products'), 'read', 'product', false),
('products_create', 'Створення товарів', 'Додавання нових товарів', (SELECT id FROM system_modules WHERE name = 'products'), 'create', 'product', false),
('products_edit', 'Редагування товарів', 'Редагування інформації про товари', (SELECT id FROM system_modules WHERE name = 'products'), 'update', 'product', false),
('products_delete', 'Видалення товарів', 'Видалення товарів з каталогу', (SELECT id FROM system_modules WHERE name = 'products'), 'delete', 'product', false),
('products_pricing', 'Управління цінами', 'Зміна цін на товари', (SELECT id FROM system_modules WHERE name = 'products'), 'update', 'price', false),

-- Inventory permissions
('inventory_view', 'Перегляд складу', 'Перегляд залишків на складі', (SELECT id FROM system_modules WHERE name = 'inventory'), 'read', 'inventory', false),
('inventory_update', 'Оновлення залишків', 'Зміна кількості товарів на складі', (SELECT id FROM system_modules WHERE name = 'inventory'), 'update', 'inventory', false),
('inventory_movements', 'Рух товарів', 'Перегляд та управління рухом товарів', (SELECT id FROM system_modules WHERE name = 'inventory'), 'read', 'movement', false),
('inventory_alerts', 'Сповіщення складу', 'Налаштування сповіщень про низькі залишки', (SELECT id FROM system_modules WHERE name = 'inventory'), 'read', 'alert', false),

-- Shipping permissions
('shipping_view', 'Перегляд відправлень', 'Перегляд списку відправлень', (SELECT id FROM system_modules WHERE name = 'shipping'), 'read', 'shipment', false),
('shipping_create', 'Створення відправлень', 'Створення нових відправлень', (SELECT id FROM system_modules WHERE name = 'shipping'), 'create', 'shipment', false),
('shipping_edit', 'Редагування відправлень', 'Редагування відправлень', (SELECT id FROM system_modules WHERE name = 'shipping'), 'update', 'shipment', false),
('shipping_tracking', 'Відстеження', 'Відстеження статусу доставки', (SELECT id FROM system_modules WHERE name = 'shipping'), 'read', 'tracking', false),
('shipping_labels', 'Друк етикеток', 'Друк поштових етикеток', (SELECT id FROM system_modules WHERE name = 'shipping'), 'create', 'label', false),

-- Clients permissions
('clients_view', 'Перегляд клієнтів', 'Перегляд бази клієнтів', (SELECT id FROM system_modules WHERE name = 'clients'), 'read', 'client', false),
('clients_create', 'Створення клієнтів', 'Додавання нових клієнтів', (SELECT id FROM system_modules WHERE name = 'clients'), 'create', 'client', false),
('clients_edit', 'Редагування клієнтів', 'Редагування інформації про клієнтів', (SELECT id FROM system_modules WHERE name = 'clients'), 'update', 'client', false),
('clients_delete', 'Видалення клієнтів', 'Видалення клієнтів з бази', (SELECT id FROM system_modules WHERE name = 'clients'), 'delete', 'client', false),
('clients_history', 'Історія клієнтів', 'Перегляд історії замовлень клієнтів', (SELECT id FROM system_modules WHERE name = 'clients'), 'read', 'client_history', false),

-- Finances permissions
('finances_view', 'Перегляд фінансів', 'Перегляд фінансових даних', (SELECT id FROM system_modules WHERE name = 'finances'), 'read', 'finance', false),
('finances_transactions', 'Операції', 'Управління фінансовими операціями', (SELECT id FROM system_modules WHERE name = 'finances'), 'create', 'transaction', false),
('finances_reports', 'Фінансові звіти', 'Створення фінансових звітів', (SELECT id FROM system_modules WHERE name = 'finances'), 'read', 'financial_report', false),
('finances_settings', 'Налаштування фінансів', 'Налаштування фінансових параметрів', (SELECT id FROM system_modules WHERE name = 'finances'), 'update', 'finance_settings', false),

-- Reports permissions
('reports_view', 'Перегляд звітів', 'Перегляд звітів та аналітики', (SELECT id FROM system_modules WHERE name = 'reports'), 'read', 'report', false),
('reports_create', 'Створення звітів', 'Створення власних звітів', (SELECT id FROM system_modules WHERE name = 'reports'), 'create', 'report', false),
('reports_export', 'Експорт звітів', 'Експорт звітів у різні формати', (SELECT id FROM system_modules WHERE name = 'reports'), 'export', 'report', false),
('reports_schedule', 'Планування звітів', 'Налаштування автоматичних звітів', (SELECT id FROM system_modules WHERE name = 'reports'), 'create', 'scheduled_report', false),

-- Production permissions
('production_view', 'Перегляд виробництва', 'Перегляд виробничих планів', (SELECT id FROM system_modules WHERE name = 'production'), 'read', 'production', false),
('production_plan', 'Планування виробництва', 'Створення виробничих планів', (SELECT id FROM system_modules WHERE name = 'production'), 'create', 'production_plan', false),
('production_tasks', 'Виробничі завдання', 'Управління виробничими завданнями', (SELECT id FROM system_modules WHERE name = 'production'), 'update', 'production_task', false),
('production_materials', 'Матеріали', 'Управління виробничими матеріалами', (SELECT id FROM system_modules WHERE name = 'production'), 'read', 'material', false),

-- Integrations permissions
('integrations_view', 'Перегляд інтеграцій', 'Перегляд налаштувань інтеграцій', (SELECT id FROM system_modules WHERE name = 'integrations'), 'read', 'integration', false),
('integrations_config', 'Налаштування інтеграцій', 'Налаштування зовнішніх інтеграцій', (SELECT id FROM system_modules WHERE name = 'integrations'), 'update', 'integration_config', false),
('integrations_sync', 'Синхронізація', 'Запуск синхронізації з зовнішніми системами', (SELECT id FROM system_modules WHERE name = 'integrations'), 'execute', 'sync', false),

-- Administration permissions (system permissions)
('admin_users', 'Управління користувачами', 'Управління користувачами системи', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'user', true),
('admin_roles', 'Управління ролями', 'Управління ролями та дозволами', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'role', true),
('admin_permissions', 'Управління дозволами', 'Управління дозволами системи', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'permission', true),
('admin_system', 'Системне адміністрування', 'Доступ до системних налаштувань', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'system', true),
('admin_logs', 'Системні логи', 'Перегляд системних логів', (SELECT id FROM system_modules WHERE name = 'administration'), 'read', 'log', true),
('admin_backup', 'Резервне копіювання', 'Управління резервними копіями', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'backup', true),
('admin_security', 'Безпека', 'Управління налаштуваннями безпеки', (SELECT id FROM system_modules WHERE name = 'administration'), 'manage', 'security', true)
ON CONFLICT (name) DO NOTHING;

-- Create base roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Супер адміністратор', 'Повний доступ до всіх функцій системи', true),
('admin', 'Адміністратор', 'Адміністративні функції та управління', true),
('manager', 'Менеджер', 'Управління замовленнями та клієнтами', true),
('operator', 'Оператор', 'Обробка замовлень та основні операції', true),
('user', 'Користувач', 'Базовий доступ для перегляду', true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role;

-- Assign all permissions to super_admin
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'super_admin'),
    id,
    true
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to admin (all except super admin specific)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id,
    true
FROM permissions
WHERE name NOT IN ('admin_system', 'admin_backup', 'admin_security')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to manager
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'manager'),
    id,
    true
FROM permissions
WHERE name IN (
    'dashboard_view', 'dashboard_analytics',
    'orders_view', 'orders_create', 'orders_edit', 'orders_status',
    'products_view', 'products_edit', 'products_pricing',
    'inventory_view', 'inventory_movements', 'inventory_alerts',
    'shipping_view', 'shipping_create', 'shipping_edit', 'shipping_tracking',
    'clients_view', 'clients_create', 'clients_edit', 'clients_history',
    'finances_view', 'finances_reports',
    'reports_view', 'reports_create', 'reports_export',
    'production_view', 'production_plan'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to operator
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'operator'),
    id,
    true
FROM permissions
WHERE name IN (
    'dashboard_view',
    'orders_view', 'orders_create', 'orders_edit', 'orders_status',
    'products_view',
    'inventory_view', 'inventory_update', 'inventory_movements',
    'shipping_view', 'shipping_create', 'shipping_tracking', 'shipping_labels',
    'clients_view', 'clients_create', 'clients_edit',
    'production_view', 'production_tasks'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to user (read-only access)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT 
    (SELECT id FROM roles WHERE name = 'user'),
    id,
    true
FROM permissions
WHERE name IN (
    'dashboard_view',
    'orders_view',
    'products_view',
    'inventory_view',
    'clients_view',
    'reports_view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign super_admin role to ShkolaIhor user
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'super_admin')
WHERE username = 'ShkolaIhor'
AND role_id IS NULL;

-- Create updated_at trigger for roles table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_roles_updated_at') THEN
        CREATE TRIGGER update_roles_updated_at
            BEFORE UPDATE ON roles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Migration complete
COMMENT ON TABLE system_modules IS 'System modules for role-based access control';
COMMENT ON TABLE permissions IS 'System permissions for fine-grained access control';
COMMENT ON TABLE roles IS 'User roles with associated permissions';
COMMENT ON TABLE role_permissions IS 'Junction table for role-permission associations';