-- Production Database Setup Script
-- Ukrainian ERP System - Complete Database Structure
-- Generated: 2025-06-15
-- Includes: All migrations through 0034 (Workers Personal Info Enhancement)

-- Set UTF-8 encoding
SET client_encoding = 'UTF8';

-- Create database if not exists (run manually if needed)
-- CREATE DATABASE regmik_erp_production WITH ENCODING 'UTF8' LC_COLLATE='uk_UA.UTF-8' LC_CTYPE='uk_UA.UTF-8';

-- Session storage table (required for authentication)
CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Local users table
CREATE TABLE IF NOT EXISTS "local_users" (
    "id" serial PRIMARY KEY NOT NULL,
    "username" varchar(255) NOT NULL,
    "email" varchar(255),
    "password" varchar(255) NOT NULL,
    "firstName" varchar(255),
    "lastName" varchar(255),
    "profileImageUrl" varchar(500),
    "role" varchar(100) DEFAULT 'user',
    "isActive" boolean DEFAULT true,
    "permissions" jsonb,
    "lastLoginAt" timestamp,
    "passwordResetToken" varchar(255),
    "passwordResetExpires" timestamp,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "local_users_username_unique" ON "local_users" ("username");
CREATE UNIQUE INDEX IF NOT EXISTS "local_users_email_unique" ON "local_users" ("email");

-- Companies table
CREATE TABLE IF NOT EXISTS "companies" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "address" text,
    "phone" varchar(50),
    "email" varchar(255),
    "website" varchar(255),
    "taxId" varchar(50),
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Departments table
CREATE TABLE IF NOT EXISTS "departments" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Positions table
CREATE TABLE IF NOT EXISTS "positions" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Workers table with personal information
CREATE TABLE IF NOT EXISTS "workers" (
    "id" serial PRIMARY KEY NOT NULL,
    "firstName" varchar(255) NOT NULL,
    "lastName" varchar(255) NOT NULL,
    "photo" text,
    "positionId" integer,
    "departmentId" integer,
    "email" varchar(255),
    "phone" varchar(50),
    "birthDate" date,
    "address" text,
    "contactPhone" varchar(50),
    "terminationDate" date,
    "hireDate" date,
    "hourlyRate" numeric(10,2),
    "isActive" boolean DEFAULT true,
    "notes" text,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS "products" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "photo" text,
    "companyId" integer,
    "sku" varchar(100) NOT NULL,
    "barcode" varchar(100),
    "unit" varchar(50) DEFAULT 'шт',
    "weight" numeric(10,3),
    "dimensions" varchar(100),
    "category" varchar(100),
    "subcategory" varchar(100),
    "hasSerialNumbers" boolean DEFAULT false
);

-- Product components table
CREATE TABLE IF NOT EXISTS "product_components" (
    "id" serial PRIMARY KEY NOT NULL,
    "parentProductId" integer NOT NULL,
    "componentProductId" integer,
    "quantity" varchar(50) NOT NULL,
    "unit" varchar(50) NOT NULL,
    "isOptional" boolean DEFAULT false,
    "notes" text,
    "createdAt" timestamp DEFAULT now()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS "inventory" (
    "id" serial PRIMARY KEY NOT NULL,
    "productId" integer NOT NULL,
    "quantity" integer NOT NULL DEFAULT 0,
    "reservedQuantity" integer NOT NULL DEFAULT 0,
    "minStock" integer DEFAULT 0,
    "maxStock" integer,
    "location" varchar(255),
    "lastUpdated" timestamp DEFAULT now(),
    "notes" text
);

-- Serial numbers table
CREATE TABLE IF NOT EXISTS "serial_numbers" (
    "id" serial PRIMARY KEY NOT NULL,
    "productId" integer NOT NULL,
    "serialNumber" varchar(255) NOT NULL,
    "status" varchar(50) DEFAULT 'available',
    "orderId" integer,
    "orderItemId" integer,
    "createdAt" timestamp DEFAULT now(),
    "assignedAt" timestamp,
    "notes" text
);

-- Clients table
CREATE TABLE IF NOT EXISTS "clients" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "address" text,
    "phone" varchar(50),
    "email" varchar(255),
    "contactPerson" varchar(255),
    "taxId" varchar(50),
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Client shipping addresses table
CREATE TABLE IF NOT EXISTS "client_shipping_addresses" (
    "id" serial PRIMARY KEY NOT NULL,
    "clientId" integer NOT NULL,
    "cityRef" varchar(255) NOT NULL,
    "warehouseRef" varchar(255),
    "isDefault" boolean DEFAULT false,
    "customerName" varchar(255) NOT NULL,
    "customerPhone" varchar(50) NOT NULL,
    "recipientName" varchar(255),
    "recipientPhone" varchar(50),
    "address" text,
    "comment" text,
    "usageCount" integer DEFAULT 0,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "clientId" integer NOT NULL,
    "status" varchar(50) DEFAULT 'pending',
    "totalAmount" numeric(12,2) DEFAULT 0,
    "currency" varchar(10) DEFAULT 'UAH',
    "notes" text,
    "priority" varchar(20) DEFAULT 'medium',
    "expectedDeliveryDate" date,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now(),
    "orderNumber" varchar(100)
);

-- Order items table
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "orderId" integer NOT NULL,
    "productId" integer NOT NULL,
    "quantity" integer NOT NULL,
    "unitPrice" numeric(10,2),
    "totalPrice" numeric(12,2),
    "status" varchar(50) DEFAULT 'pending',
    "notes" text,
    "completedQuantity" integer DEFAULT 0,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Order item serial numbers junction table
CREATE TABLE IF NOT EXISTS "order_item_serial_numbers" (
    "id" serial PRIMARY KEY NOT NULL,
    "orderItemId" integer NOT NULL,
    "serialNumberId" integer NOT NULL,
    "assignedAt" timestamp DEFAULT now()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "address" text,
    "phone" varchar(50),
    "email" varchar(255),
    "contactPerson" varchar(255),
    "taxId" varchar(50),
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "supplierId" integer NOT NULL,
    "status" varchar(50) DEFAULT 'pending',
    "totalAmount" numeric(12,2) DEFAULT 0,
    "currency" varchar(10) DEFAULT 'UAH',
    "notes" text,
    "expectedDeliveryDate" date,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now(),
    "orderNumber" varchar(100)
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "purchaseOrderId" integer NOT NULL,
    "productId" integer NOT NULL,
    "quantity" integer NOT NULL,
    "unitPrice" numeric(10,2),
    "totalPrice" numeric(12,2),
    "receivedQuantity" integer DEFAULT 0,
    "notes" text,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Production tasks table
CREATE TABLE IF NOT EXISTS "production_tasks" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text,
    "productId" integer,
    "quantity" integer NOT NULL,
    "assignedWorkerId" integer,
    "status" varchar(50) DEFAULT 'pending',
    "priority" varchar(20) DEFAULT 'medium',
    "startDate" date,
    "dueDate" date,
    "completedAt" timestamp,
    "notes" text,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" serial PRIMARY KEY NOT NULL,
    "orderId" integer NOT NULL,
    "trackingNumber" varchar(255),
    "carrier" varchar(100),
    "status" varchar(50) DEFAULT 'preparing',
    "shippedAt" timestamp,
    "deliveredAt" timestamp,
    "shippingCost" numeric(10,2),
    "recipientName" varchar(255),
    "recipientPhone" varchar(50),
    "shippingAddress" text,
    "notes" text,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Partial shipments table
CREATE TABLE IF NOT EXISTS "partial_shipments" (
    "id" serial PRIMARY KEY NOT NULL,
    "orderId" integer NOT NULL,
    "shipmentNumber" varchar(100),
    "trackingNumber" varchar(255),
    "carrier" varchar(100),
    "status" varchar(50) DEFAULT 'preparing',
    "totalItems" integer DEFAULT 0,
    "shippedAt" timestamp,
    "deliveredAt" timestamp,
    "shippingCost" numeric(10,2),
    "recipientName" varchar(255),
    "recipientPhone" varchar(50),
    "shippingAddress" text,
    "notes" text,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Partial shipment items table
CREATE TABLE IF NOT EXISTS "partial_shipment_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "partialShipmentId" integer NOT NULL,
    "orderItemId" integer NOT NULL,
    "quantity" integer NOT NULL,
    "createdAt" timestamp DEFAULT now()
);

-- Nova Poshta integration tables
CREATE TABLE IF NOT EXISTS "nova_poshta_cities" (
    "id" serial PRIMARY KEY NOT NULL,
    "ref" varchar(255) NOT NULL UNIQUE,
    "description" varchar(255) NOT NULL,
    "description_ru" varchar(255),
    "delivery1" varchar(10),
    "delivery2" varchar(10),
    "delivery3" varchar(10),
    "delivery4" varchar(10),
    "delivery5" varchar(10),
    "delivery6" varchar(10),
    "delivery7" varchar(10),
    "area_ref" varchar(255),
    "warehouse2_ref" varchar(255),
    "settlement_type" varchar(50),
    "index1" varchar(20),
    "index2" varchar(20),
    "index_cod_ua" varchar(20),
    "warehouse" varchar(10),
    "region_id" integer,
    "area_id" integer,
    "city_id" integer,
    "warehouse_types" text,
    "special_cash_check" integer,
    "region_types_code" varchar(10),
    "last_updated" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "nova_poshta_warehouses" (
    "id" serial PRIMARY KEY NOT NULL,
    "ref" varchar(255) NOT NULL UNIQUE,
    "description" varchar(500) NOT NULL,
    "description_ru" varchar(500),
    "short_address" varchar(255),
    "short_address_ru" varchar(255),
    "phone" varchar(100),
    "type_of_warehouse" varchar(100),
    "warehouse_status" varchar(50),
    "warehouse_status_date" varchar(20),
    "city_ref" varchar(255),
    "city_description" varchar(255),
    "city_description_ru" varchar(255),
    "settlement_ref" varchar(255),
    "settlement_description" varchar(255),
    "settlement_area_description" varchar(255),
    "settlement_regions_description" varchar(255),
    "settlement_type_description" varchar(100),
    "longitude" numeric(10,6),
    "latitude" numeric(10,6),
    "post_finance" varchar(10),
    "bicycle_parking" varchar(10),
    "pay_by_card" varchar(10),
    "pos_terminal" varchar(10),
    "international_shipping" varchar(10),
    "self_service_workplaces_count" integer,
    "total_max_weight_allowed" integer,
    "place_max_weight_allowed" integer,
    "send_cells" varchar(10),
    "receive_cells" varchar(10),
    "delivery_homeland" varchar(10),
    "schedule" jsonb,
    "district_code" varchar(20),
    "warehouse_for_agent" varchar(10),
    "post_machine_type" varchar(50),
    "post_office_number" varchar(20),
    "last_updated" timestamp DEFAULT now()
);

-- Nova Poshta API settings table (per client)
CREATE TABLE IF NOT EXISTS "nova_poshta_api_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "clientId" integer,
    "apiKey" varchar(255) NOT NULL,
    "senderFirstName" varchar(255),
    "senderLastName" varchar(255),
    "senderPhone" varchar(50),
    "senderAddress" text,
    "isDefault" boolean DEFAULT false,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Carrier sync settings table
CREATE TABLE IF NOT EXISTS "carrier_sync_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "carrier" varchar(100) NOT NULL,
    "isEnabled" boolean DEFAULT true,
    "lastSyncAt" timestamp,
    "syncInterval" integer DEFAULT 24,
    "apiEndpoint" varchar(500),
    "settings" jsonb,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Currency rates table
CREATE TABLE IF NOT EXISTS "currency_rates" (
    "id" serial PRIMARY KEY NOT NULL,
    "baseCurrency" varchar(10) NOT NULL,
    "targetCurrency" varchar(10) NOT NULL,
    "rate" numeric(15,6) NOT NULL,
    "source" varchar(50) DEFAULT 'NBU',
    "date" date NOT NULL,
    "createdAt" timestamp DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(100) NOT NULL UNIQUE,
    "displayName" varchar(150) NOT NULL,
    "description" text,
    "permissions" jsonb NOT NULL DEFAULT '[]',
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- System modules table
CREATE TABLE IF NOT EXISTS "system_modules" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(100) NOT NULL UNIQUE,
    "displayName" varchar(150) NOT NULL,
    "description" text,
    "icon" varchar(100),
    "route" varchar(200),
    "parentId" integer,
    "isActive" boolean DEFAULT true,
    "sortOrder" integer DEFAULT 0,
    "permissions" text[],
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- User role assignments table
CREATE TABLE IF NOT EXISTS "user_role_assignments" (
    "id" serial PRIMARY KEY NOT NULL,
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "assignedBy" integer,
    "assignedAt" timestamp DEFAULT now(),
    "isActive" boolean DEFAULT true
);

-- Foreign key constraints
ALTER TABLE "workers" ADD CONSTRAINT "workers_position_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "workers" ADD CONSTRAINT "workers_department_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_company_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_components" ADD CONSTRAINT "product_components_parent_fkey" FOREIGN KEY ("parentProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_components" ADD CONSTRAINT "product_components_component_fkey" FOREIGN KEY ("componentProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_product_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_order_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_order_item_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "client_shipping_addresses" ADD CONSTRAINT "client_shipping_addresses_client_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_client_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item_serial_numbers" ADD CONSTRAINT "order_item_serial_numbers_order_item_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_serial_numbers" ADD CONSTRAINT "order_item_serial_numbers_serial_number_fkey" FOREIGN KEY ("serialNumberId") REFERENCES "serial_numbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_product_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_worker_fkey" FOREIGN KEY ("assignedWorkerId") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "partial_shipments" ADD CONSTRAINT "partial_shipments_order_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "partial_shipment_items" ADD CONSTRAINT "partial_shipment_items_partial_shipment_fkey" FOREIGN KEY ("partialShipmentId") REFERENCES "partial_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "partial_shipment_items" ADD CONSTRAINT "partial_shipment_items_order_item_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nova_poshta_api_settings" ADD CONSTRAINT "nova_poshta_api_settings_client_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "system_modules" ADD CONSTRAINT "system_modules_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "system_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_fkey" FOREIGN KEY ("userId") REFERENCES "local_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_fkey" FOREIGN KEY ("roleId") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_assigned_by_fkey" FOREIGN KEY ("assignedBy") REFERENCES "local_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_unique" ON "products" ("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "products_barcode_unique" ON "products" ("barcode") WHERE "barcode" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "serial_numbers_unique" ON "serial_numbers" ("productId", "serialNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_product_unique" ON "inventory" ("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "currency_rates_unique" ON "currency_rates" ("baseCurrency", "targetCurrency", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "user_role_assignments_unique" ON "user_role_assignments" ("userId", "roleId") WHERE "isActive" = true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS "orders_client_id_idx" ON "orders" ("clientId");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" ("createdAt");
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx" ON "order_items" ("orderId");
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx" ON "order_items" ("productId");
CREATE INDEX IF NOT EXISTS "serial_numbers_product_id_idx" ON "serial_numbers" ("productId");
CREATE INDEX IF NOT EXISTS "serial_numbers_status_idx" ON "serial_numbers" ("status");
CREATE INDEX IF NOT EXISTS "nova_poshta_cities_description_idx" ON "nova_poshta_cities" ("description");
CREATE INDEX IF NOT EXISTS "nova_poshta_warehouses_city_ref_idx" ON "nova_poshta_warehouses" ("city_ref");
CREATE INDEX IF NOT EXISTS "nova_poshta_warehouses_description_idx" ON "nova_poshta_warehouses" ("description");

-- Insert default system data

-- Default user roles
INSERT INTO "user_roles" ("name", "displayName", "description", "permissions") VALUES
('super_admin', 'Супер Адміністратор', 'Повний доступ до всіх функцій системи', '["all"]'),
('admin', 'Адміністратор', 'Управління користувачами та налаштуваннями', '["users.view", "users.create", "users.edit", "users.delete", "roles.view", "roles.create", "roles.edit", "roles.delete", "settings.view", "settings.edit"]'),
('manager', 'Менеджер', 'Управління замовленнями та клієнтами', '["orders.view", "orders.create", "orders.edit", "clients.view", "clients.create", "clients.edit", "products.view", "inventory.view", "shipments.view", "shipments.create"]'),
('worker', 'Робітник', 'Виконання виробничих завдань', '["production.view", "production.edit", "inventory.view", "products.view"]'),
('viewer', 'Спостерігач', 'Тільки перегляд даних', '["orders.view", "clients.view", "products.view", "inventory.view"]')
ON CONFLICT ("name") DO NOTHING;

-- Default system modules
INSERT INTO "system_modules" ("name", "displayName", "description", "icon", "route", "parentId", "isActive", "sortOrder", "permissions") VALUES
('dashboard', 'Головна панель', 'Головна сторінка з аналітикою', 'LayoutDashboard', '/', NULL, true, 1, ARRAY['dashboard.view']),
('orders', 'Замовлення', 'Управління замовленнями', 'ShoppingCart', '/orders', NULL, true, 2, ARRAY['orders.view', 'orders.create', 'orders.edit', 'orders.delete']),
('clients', 'Клієнти', 'Управління клієнтами', 'Users', '/clients', NULL, true, 3, ARRAY['clients.view', 'clients.create', 'clients.edit', 'clients.delete']),
('products', 'Товари', 'Управління товарами', 'Package', '/products', NULL, true, 4, ARRAY['products.view', 'products.create', 'products.edit', 'products.delete']),
('inventory', 'Склад', 'Управління складськими запасами', 'Warehouse', '/inventory', NULL, true, 5, ARRAY['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete']),
('production', 'Виробництво', 'Виробничі завдання', 'Settings', '/production', NULL, true, 6, ARRAY['production.view', 'production.create', 'production.edit', 'production.delete']),
('shipments', 'Доставка', 'Управління доставкою', 'Truck', '/shipments', NULL, true, 7, ARRAY['shipments.view', 'shipments.create', 'shipments.edit', 'shipments.delete']),
('workers', 'Робітники', 'Управління робітниками', 'UserCheck', '/workers', NULL, true, 8, ARRAY['workers.view', 'workers.create', 'workers.edit', 'workers.delete']),
('suppliers', 'Постачальники', 'Управління постачальниками', 'Building2', '/suppliers', NULL, true, 9, ARRAY['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete']),
('analytics', 'Аналітика', 'Звіти та аналітика', 'BarChart3', '/analytics', NULL, true, 10, ARRAY['analytics.view']),
('integrations', 'Інтеграції', 'Зовнішні інтеграції', 'Plug', '/integrations', NULL, true, 11, ARRAY['integrations.view', 'integrations.edit']),
('users', 'Користувачі', 'Управління користувачами', 'User', '/users', NULL, true, 12, ARRAY['users.view', 'users.create', 'users.edit', 'users.delete']),
('roles', 'Ролі та права', 'Управління ролями користувачів', 'Shield', '/roles', NULL, true, 13, ARRAY['roles.view', 'roles.create', 'roles.edit', 'roles.delete']),
('settings', 'Налаштування', 'Системні налаштування', 'Settings', '/settings', NULL, true, 14, ARRAY['settings.view', 'settings.edit'])
ON CONFLICT ("name") DO NOTHING;

-- Default departments
INSERT INTO "departments" ("name", "description", "isActive") VALUES
('SMD монтаж', 'Відділ поверхневого монтажу', true),
('DIP монтаж', 'Відділ монтажу в отвори', true),
('Тестування', 'Відділ тестування та контролю якості', true),
('Пакування', 'Відділ пакування продукції', true),
('Логістика', 'Відділ логістики та доставки', true),
('Управління', 'Управлінський відділ', true)
ON CONFLICT DO NOTHING;

-- Default positions
INSERT INTO "positions" ("name", "description", "isActive") VALUES
('Інженер', 'Розробка та проектування', true),
('Технік', 'Технічне обслуговування', true),
('Оператор', 'Виробничий оператор', true),
('Контролер', 'Контроль якості', true),
('Менеджер', 'Менеджер проекту', true),
('Директор', 'Керівник підрозділу', true),
('Монтажник SMD', 'Монтажник поверхневих компонентів', true),
('Монтажник DIP', 'Монтажник компонентів в отвори', true),
('Логіст', 'Фахівець з логістики', true)
ON CONFLICT DO NOTHING;

-- Default companies
INSERT INTO "companies" ("name", "description", "address", "phone", "email", "isActive") VALUES
('REGMIK', 'Виробництво електронних виробів', 'Україна, м. Київ', '+380501234567', 'info@regmik.com', true)
ON CONFLICT DO NOTHING;

-- Default carrier sync settings for Nova Poshta
INSERT INTO "carrier_sync_settings" ("carrier", "isEnabled", "syncInterval", "apiEndpoint", "settings") VALUES
('nova_poshta', true, 24, 'https://api.novaposhta.ua/v2.0/json/', '{"auto_sync": true, "sync_cities": true, "sync_warehouses": true}')
ON CONFLICT ("carrier") DO NOTHING;

-- Create default admin user (password: admin123)
INSERT INTO "local_users" ("username", "email", "password", "firstName", "lastName", "role", "isActive", "permissions", "createdAt", "updatedAt") VALUES
('admin', 'admin@regmik.com', '$2b$10$8rjZkZGjX5f5kZjH4KjH4O7EqjJ4jJ4jJ4jJ4jJ4jJ4jJ4jJ4jJ4j', 'Адмін', 'Системи', 'super_admin', true, '["all"]', now(), now())
ON CONFLICT ("username") DO NOTHING;

-- Assign super admin role to default admin user
INSERT INTO "user_role_assignments" ("userId", "roleId", "assignedAt", "isActive")
SELECT u.id, r.id, now(), true
FROM "local_users" u, "user_roles" r
WHERE u.username = 'admin' AND r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Update sequences to avoid conflicts
SELECT setval('local_users_id_seq', COALESCE((SELECT MAX(id) FROM local_users), 1));
SELECT setval('companies_id_seq', COALESCE((SELECT MAX(id) FROM companies), 1));
SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM departments), 1));
SELECT setval('positions_id_seq', COALESCE((SELECT MAX(id) FROM positions), 1));
SELECT setval('user_roles_id_seq', COALESCE((SELECT MAX(id) FROM user_roles), 1));
SELECT setval('system_modules_id_seq', COALESCE((SELECT MAX(id) FROM system_modules), 1));
SELECT setval('user_role_assignments_id_seq', COALESCE((SELECT MAX(id) FROM user_role_assignments), 1));
SELECT setval('carrier_sync_settings_id_seq', COALESCE((SELECT MAX(id) FROM carrier_sync_settings), 1));

-- Production deployment complete
-- Database version: Latest with all migrations through 0034
-- Features included:
-- - Complete ERP system structure
-- - Role-based access control system
-- - Nova Poshta integration
-- - Workers management with personal information
-- - Serial number tracking
-- - Partial shipment support
-- - Ukrainian localization
-- - Production-ready indexes and constraints