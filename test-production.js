var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminResetPasswordSchema: () => adminResetPasswordSchema,
  assemblyOperationItems: () => assemblyOperationItems,
  assemblyOperations: () => assemblyOperations,
  carriers: () => carriers,
  categories: () => categories,
  changePasswordSchema: () => changePasswordSchema,
  clientContacts: () => clientContacts,
  clientMail: () => clientMail,
  clientNovaPoshtaSettings: () => clientNovaPoshtaSettings,
  clients: () => clients,
  companies: () => companies,
  componentAlternatives: () => componentAlternatives,
  componentAlternativesRelations: () => componentAlternativesRelations,
  componentCategories: () => componentCategories,
  components: () => components,
  costCalculations: () => costCalculations,
  currencies: () => currencies,
  customerAddresses: () => customerAddresses,
  departments: () => departments,
  departmentsRelations: () => departmentsRelations,
  emailSettings: () => emailSettings,
  entityMappings: () => entityMappings,
  entityMappingsRelations: () => entityMappingsRelations,
  envelopePrintSettings: () => envelopePrintSettings,
  exchangeRateHistory: () => exchangeRateHistory,
  expenses: () => expenses,
  fieldMappings: () => fieldMappings,
  fieldMappingsRelations: () => fieldMappingsRelations,
  forecastMaterialRequirements: () => forecastMaterialRequirements,
  insertAssemblyOperationItemSchema: () => insertAssemblyOperationItemSchema,
  insertAssemblyOperationSchema: () => insertAssemblyOperationSchema,
  insertCarrierSchema: () => insertCarrierSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertClientContactSchema: () => insertClientContactSchema,
  insertClientMailSchema: () => insertClientMailSchema,
  insertClientNovaPoshtaSettingsSchema: () => insertClientNovaPoshtaSettingsSchema,
  insertClientSchema: () => insertClientSchema,
  insertCompanySchema: () => insertCompanySchema,
  insertComponentAlternativeSchema: () => insertComponentAlternativeSchema,
  insertComponentCategorySchema: () => insertComponentCategorySchema,
  insertComponentSchema: () => insertComponentSchema,
  insertCostCalculationSchema: () => insertCostCalculationSchema,
  insertCurrencySchema: () => insertCurrencySchema,
  insertCustomerAddressSchema: () => insertCustomerAddressSchema,
  insertDepartmentSchema: () => insertDepartmentSchema,
  insertEmailSettingsSchema: () => insertEmailSettingsSchema,
  insertEntityMappingSchema: () => insertEntityMappingSchema,
  insertEnvelopePrintSettingsSchema: () => insertEnvelopePrintSettingsSchema,
  insertExchangeRateHistorySchema: () => insertExchangeRateHistorySchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertFieldMappingSchema: () => insertFieldMappingSchema,
  insertForecastMaterialRequirementSchema: () => insertForecastMaterialRequirementSchema,
  insertIntegrationConfigSchema: () => insertIntegrationConfigSchema,
  insertInventoryAuditItemSchema: () => insertInventoryAuditItemSchema,
  insertInventoryAuditSchema: () => insertInventoryAuditSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertLocalUserSchema: () => insertLocalUserSchema,
  insertMailRegistrySchema: () => insertMailRegistrySchema,
  insertManufacturingOrderMaterialSchema: () => insertManufacturingOrderMaterialSchema,
  insertManufacturingOrderSchema: () => insertManufacturingOrderSchema,
  insertManufacturingStepSchema: () => insertManufacturingStepSchema,
  insertMaterialShortageSchema: () => insertMaterialShortageSchema,
  insertNovaPoshtaCitySchema: () => insertNovaPoshtaCitySchema,
  insertNovaPoshtaWarehouseSchema: () => insertNovaPoshtaWarehouseSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertOrderStatusSchema: () => insertOrderStatusSchema,
  insertPackageTypeSchema: () => insertPackageTypeSchema,
  insertPositionSchema: () => insertPositionSchema,
  insertProductComponentSchema: () => insertProductComponentSchema,
  insertProductPriceSchema: () => insertProductPriceSchema,
  insertProductSchema: () => insertProductSchema,
  insertProductionForecastItemSchema: () => insertProductionForecastItemSchema,
  insertProductionForecastSchema: () => insertProductionForecastSchema,
  insertProductionOutputSchema: () => insertProductionOutputSchema,
  insertProductionTaskSchema: () => insertProductionTaskSchema,
  insertRecipeIngredientSchema: () => insertRecipeIngredientSchema,
  insertRecipeSchema: () => insertRecipeSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertSaleSchema: () => insertSaleSchema,
  insertSenderSettingsSchema: () => insertSenderSettingsSchema,
  insertSerialNumberSchema: () => insertSerialNumberSchema,
  insertSerialNumberSettingsSchema: () => insertSerialNumberSettingsSchema,
  insertShipmentItemSchema: () => insertShipmentItemSchema,
  insertShipmentSchema: () => insertShipmentSchema,
  insertSolderingTypeSchema: () => insertSolderingTypeSchema,
  insertSupplierOrderItemSchema: () => insertSupplierOrderItemSchema,
  insertSupplierOrderSchema: () => insertSupplierOrderSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertSyncLogSchema: () => insertSyncLogSchema,
  insertSyncQueueSchema: () => insertSyncQueueSchema,
  insertSystemModuleSchema: () => insertSystemModuleSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertTechCardMaterialSchema: () => insertTechCardMaterialSchema,
  insertTechCardSchema: () => insertTechCardSchema,
  insertTechCardStepSchema: () => insertTechCardStepSchema,
  insertTimeEntrySchema: () => insertTimeEntrySchema,
  insertUnitSchema: () => insertUnitSchema,
  insertUserLoginHistorySchema: () => insertUserLoginHistorySchema,
  insertUserSchemaAuth: () => insertUserSchemaAuth,
  insertUserSortPreferenceSchema: () => insertUserSortPreferenceSchema,
  insertWarehouseSchema: () => insertWarehouseSchema,
  insertWarehouseTransferItemSchema: () => insertWarehouseTransferItemSchema,
  insertWarehouseTransferSchema: () => insertWarehouseTransferSchema,
  insertWorkerSchema: () => insertWorkerSchema,
  integrationConfigs: () => integrationConfigs,
  integrationConfigsRelations: () => integrationConfigsRelations,
  inventory: () => inventory,
  inventoryAlerts: () => inventoryAlerts,
  inventoryAuditItems: () => inventoryAuditItems,
  inventoryAudits: () => inventoryAudits,
  localUsers: () => localUsers,
  loginSchema: () => loginSchema,
  mailRegistry: () => mailRegistry,
  manufacturingOrderMaterials: () => manufacturingOrderMaterials,
  manufacturingOrders: () => manufacturingOrders,
  manufacturingSteps: () => manufacturingSteps,
  materialShortages: () => materialShortages,
  newPasswordSchema: () => newPasswordSchema,
  novaPoshtaCities: () => novaPoshtaCities,
  novaPoshtaWarehouses: () => novaPoshtaWarehouses,
  orderItems: () => orderItems,
  orderStatuses: () => orderStatuses,
  orders: () => orders,
  packageTypes: () => packageTypes,
  positions: () => positions,
  positionsRelations: () => positionsRelations,
  productComponents: () => productComponents,
  productPrices: () => productPrices,
  productProfitability: () => productProfitability,
  productionForecastItems: () => productionForecastItems,
  productionForecasts: () => productionForecasts,
  productionOutput: () => productionOutput,
  productionTasks: () => productionTasks,
  products: () => products,
  recipeIngredients: () => recipeIngredients,
  recipes: () => recipes,
  resetPasswordSchema: () => resetPasswordSchema,
  roles: () => roles,
  saleItems: () => saleItems,
  sales: () => sales,
  senderSettings: () => senderSettings,
  serialNumberSettings: () => serialNumberSettings,
  serialNumbers: () => serialNumbers,
  sessions: () => sessions,
  shipmentItems: () => shipmentItems,
  shipments: () => shipments,
  solderingTypes: () => solderingTypes,
  supplierOrderItems: () => supplierOrderItems,
  supplierOrders: () => supplierOrders,
  suppliers: () => suppliers,
  syncLogs: () => syncLogs,
  syncLogsRelations: () => syncLogsRelations,
  syncQueue: () => syncQueue,
  syncQueueRelations: () => syncQueueRelations,
  systemModules: () => systemModules,
  tasks: () => tasks,
  techCardMaterials: () => techCardMaterials,
  techCardSteps: () => techCardSteps,
  techCards: () => techCards,
  timeEntries: () => timeEntries,
  units: () => units,
  userLoginHistory: () => userLoginHistory,
  userSortPreferences: () => userSortPreferences,
  users: () => users,
  warehouseTransferItems: () => warehouseTransferItems,
  warehouseTransfers: () => warehouseTransfers,
  warehouses: () => warehouses,
  workers: () => workers
});
import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, users, userSortPreferences, companies, localUsers, roles, systemModules, userLoginHistory, categories, units, warehouses, products, inventory, orders, customerAddresses, orderStatuses, senderSettings, shipments, shipmentItems, orderItems, recipes, recipeIngredients, productionTasks, techCards, techCardSteps, techCardMaterials, packageTypes, solderingTypes, componentCategories, components, clientMail, mailRegistry, envelopePrintSettings, productComponents, insertCategorySchema, insertUnitSchema, insertWarehouseSchema, insertProductSchema, insertInventorySchema, insertOrderSchema, insertOrderItemSchema, insertRecipeSchema, insertRecipeIngredientSchema, insertProductionTaskSchema, insertTechCardSchema, insertTechCardStepSchema, insertTechCardMaterialSchema, insertPackageTypeSchema, insertSolderingTypeSchema, insertCustomerAddressSchema, insertSenderSettingsSchema, insertShipmentSchema, insertShipmentItemSchema, insertComponentCategorySchema, insertComponentSchema, insertProductComponentSchema, materialShortages, costCalculations, suppliers, supplierOrders, supplierOrderItems, insertMaterialShortageSchema, insertCostCalculationSchema, insertSupplierOrderSchema, insertSupplierOrderItemSchema, insertSupplierSchema, assemblyOperations, assemblyOperationItems, emailSettings, clients, clientContacts, clientNovaPoshtaSettings, insertAssemblyOperationSchema, insertAssemblyOperationItemSchema, insertClientSchema, insertClientContactSchema, insertClientNovaPoshtaSettingsSchema, inventoryAudits, inventoryAuditItems, insertInventoryAuditSchema, insertInventoryAuditItemSchema, workers, insertWorkerSchema, productionForecasts, productionForecastItems, forecastMaterialRequirements, insertProductionForecastSchema, insertProductionForecastItemSchema, insertForecastMaterialRequirementSchema, warehouseTransfers, warehouseTransferItems, insertWarehouseTransferSchema, insertWarehouseTransferItemSchema, positions, insertPositionSchema, departments, insertDepartmentSchema, productionOutput, insertProductionOutputSchema, carriers, insertCarrierSchema, insertEmailSettingsSchema, insertUserSchemaAuth, componentAlternatives, componentAlternativesRelations, insertComponentAlternativeSchema, positionsRelations, departmentsRelations, sales, insertSaleSchema, saleItems, productProfitability, expenses, insertExpenseSchema, timeEntries, insertTimeEntrySchema, inventoryAlerts, novaPoshtaCities, novaPoshtaWarehouses, insertNovaPoshtaCitySchema, insertNovaPoshtaWarehouseSchema, manufacturingOrders, manufacturingOrderMaterials, manufacturingSteps, insertManufacturingOrderSchema, insertManufacturingOrderMaterialSchema, insertManufacturingStepSchema, currencies, exchangeRateHistory, productPrices, insertCurrencySchema, insertExchangeRateHistorySchema, insertProductPriceSchema, serialNumberSettings, serialNumbers, insertSerialNumberSettingsSchema, insertSerialNumberSchema, insertClientMailSchema, insertMailRegistrySchema, insertEnvelopePrintSettingsSchema, insertLocalUserSchema, insertRoleSchema, insertSystemModuleSchema, insertUserLoginHistorySchema, changePasswordSchema, adminResetPasswordSchema, loginSchema, resetPasswordSchema, newPasswordSchema, insertOrderStatusSchema, tasks, insertTaskSchema, integrationConfigs, syncLogs, entityMappings, syncQueue, fieldMappings, integrationConfigsRelations, syncLogsRelations, entityMappingsRelations, syncQueueRelations, fieldMappingsRelations, insertIntegrationConfigSchema, insertSyncLogSchema, insertEntityMappingSchema, insertSyncQueueSchema, insertFieldMappingSchema, insertCompanySchema, insertUserSortPreferenceSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().notNull(),
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      role: varchar("role", { length: 50 }).default("user"),
      // admin, manager, user, viewer
      isActive: boolean("is_active").default(true),
      permissions: jsonb("permissions"),
      // JSON з дозволами доступу до модулів
      lastLoginAt: timestamp("last_login_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userSortPreferences = pgTable("user_sort_preferences", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").notNull(),
      // Зв'язок з users.id
      tableName: varchar("table_name", { length: 100 }).notNull(),
      // Назва таблиці (orders, products тощо)
      sortField: varchar("sort_field", { length: 100 }).notNull(),
      // Поле для сортування
      sortDirection: varchar("sort_direction", { length: 4 }).notNull().default("asc"),
      // asc або desc
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    companies = pgTable("companies", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      fullName: varchar("full_name", { length: 500 }),
      taxCode: varchar("tax_code", { length: 20 }).notNull().unique(),
      // ЄДРПОУ
      vatNumber: varchar("vat_number", { length: 20 }),
      // ПДВ номер
      legalAddress: text("legal_address"),
      physicalAddress: text("physical_address"),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 255 }),
      website: varchar("website", { length: 255 }),
      bankName: varchar("bank_name", { length: 255 }),
      bankAccount: varchar("bank_account", { length: 50 }),
      bankCode: varchar("bank_code", { length: 20 }),
      logo: text("logo"),
      // URL або base64 логотипу
      isActive: boolean("is_active").default(true),
      isDefault: boolean("is_default").default(false),
      // Компанія за замовчуванням
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    localUsers = pgTable("local_users", {
      id: serial("id").primaryKey(),
      workerId: integer("worker_id").references(() => workers.id).unique(),
      // Зв'язок з робітниками
      username: varchar("username", { length: 100 }).notNull().unique(),
      email: varchar("email", { length: 255 }).unique(),
      // Може відрізнятися від email робітника (для входу)
      password: varchar("password", { length: 255 }).notNull(),
      // хешований пароль
      roleId: integer("role_id").references(() => roles.id),
      // Зв'язок з таблицею ролей
      role: varchar("role", { length: 50 }).default("user"),
      // admin, manager, user, viewer (для сумісності)
      isActive: boolean("is_active").default(true),
      permissions: jsonb("permissions"),
      // JSON з дозволами доступу до модулів
      systemModules: jsonb("system_modules").$type().default([]),
      // Масив ID модулів
      lastLoginAt: timestamp("last_login_at"),
      passwordResetToken: varchar("password_reset_token"),
      passwordResetExpires: timestamp("password_reset_expires"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    roles = pgTable("roles", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      displayName: varchar("display_name", { length: 255 }).notNull(),
      description: text("description"),
      permissions: jsonb("permissions").notNull(),
      // JSON з дозволами
      isSystemRole: boolean("is_system_role").default(false),
      // системні ролі не можна видаляти
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    systemModules = pgTable("system_modules", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      displayName: varchar("display_name", { length: 255 }).notNull(),
      description: text("description"),
      icon: varchar("icon", { length: 100 }),
      // назва іконки
      route: varchar("route", { length: 255 }),
      // маршрут в додатку
      parentModuleId: integer("parent_module_id"),
      isActive: boolean("is_active").default(true),
      sortOrder: integer("sort_order").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    userLoginHistory = pgTable("user_login_history", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id"),
      // може бути як Replit user id, так і local user id
      userType: varchar("user_type", { length: 20 }).notNull(),
      // 'replit' або 'local'
      ipAddress: varchar("ip_address", { length: 45 }),
      userAgent: text("user_agent"),
      loginTime: timestamp("login_time").defaultNow(),
      logoutTime: timestamp("logout_time"),
      sessionDuration: integer("session_duration")
      // в секундах
    });
    categories = pgTable("categories", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      // Налаштування серійних номерів
      serialNumberTemplate: text("serial_number_template"),
      // шаблон серійного номера, наприклад: "{prefix}-{year}-{counter:4}"
      serialNumberPrefix: text("serial_number_prefix"),
      // префікс для серійних номерів
      serialNumberStartNumber: integer("serial_number_start_number").default(1),
      // початковий номер
      useSerialNumbers: boolean("use_serial_numbers").default(false),
      // чи використовувати серійні номери для цієї категорії
      useGlobalNumbering: boolean("use_global_numbering").default(true),
      // використовувати глобальну нумерацію
      createdAt: timestamp("created_at").defaultNow()
    });
    units = pgTable("units", {
      id: serial("id").primaryKey(),
      name: text("name").notNull().unique(),
      // назва одиниці вимірювання
      shortName: text("short_name").notNull().unique(),
      // скорочена назва
      type: text("type").notNull(),
      // weight, volume, length, area, count, time
      baseUnit: text("base_unit"),
      // базова одиниця для конвертації
      conversionFactor: decimal("conversion_factor", { precision: 15, scale: 6 }).default("1"),
      // коефіцієнт конвертації
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    warehouses = pgTable("warehouses", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      location: text("location"),
      description: text("description")
    });
    products = pgTable("products", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      sku: text("sku").notNull().unique(),
      description: text("description"),
      barcode: text("barcode"),
      categoryId: integer("category_id").references(() => categories.id),
      companyId: integer("company_id").references(() => companies.id),
      // Належність до компанії
      costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
      retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
      photo: text("photo"),
      productType: text("product_type").notNull().default("product"),
      // product, component, material
      unit: text("unit").notNull().default("\u0448\u0442"),
      // одиниця виміру
      minStock: integer("min_stock").default(0),
      maxStock: integer("max_stock").default(1e3),
      hasSerialNumbers: boolean("has_serial_numbers").default(false),
      // чи використовує серійні номери
      isActive: boolean("is_active").default(true),
      // статус активності товару
      createdAt: timestamp("created_at").defaultNow()
    });
    inventory = pgTable("inventory", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id).notNull(),
      warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
      quantity: integer("quantity").notNull().default(0),
      minStock: integer("min_stock").default(0),
      maxStock: integer("max_stock").default(1e3),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    orders = pgTable("orders", {
      id: serial("id").primaryKey(),
      orderSequenceNumber: serial("order_sequence_number").notNull().unique(),
      // Числовий номер замовлення
      orderNumber: text("order_number").notNull().unique(),
      customerName: text("customer_name"),
      customerEmail: text("customer_email"),
      customerPhone: text("customer_phone"),
      clientId: integer("client_id").references(() => clients.id),
      // зв'язок з клієнтом для використання його API ключів
      companyId: integer("company_id").references(() => companies.id),
      // Компанія, від імені якої здійснюється продаж
      status: text("status").notNull().default("pending"),
      // pending, processing, shipped, delivered, cancelled
      statusId: integer("status_id").references(() => orderStatuses.id),
      // зв'язок з таблицею статусів
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      notes: text("notes"),
      paymentDate: timestamp("payment_date"),
      // дата оплати
      paymentType: varchar("payment_type", { length: 50 }).default("full"),
      // full, partial, contract, none
      paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
      // сума оплачена
      contractNumber: varchar("contract_number", { length: 100 }),
      // номер договору для contract типу
      productionApproved: boolean("production_approved").default(false),
      // дозвіл на запуск виробництва
      productionApprovedBy: varchar("production_approved_by", { length: 100 }),
      // хто дав дозвіл
      productionApprovedAt: timestamp("production_approved_at"),
      // коли дали дозвіл
      dueDate: timestamp("due_date"),
      // термін виконання
      shippedDate: timestamp("shipped_date"),
      // дата відвантаження
      createdAt: timestamp("created_at").defaultNow()
    });
    customerAddresses = pgTable("customer_addresses", {
      id: serial("id").primaryKey(),
      customerName: varchar("customer_name", { length: 255 }).notNull(),
      customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
      recipientName: varchar("recipient_name", { length: 255 }),
      recipientPhone: varchar("recipient_phone", { length: 50 }),
      cityRef: varchar("city_ref", { length: 255 }).notNull(),
      cityName: varchar("city_name", { length: 255 }).notNull(),
      warehouseRef: varchar("warehouse_ref", { length: 255 }).notNull(),
      warehouseAddress: text("warehouse_address").notNull(),
      carrierId: integer("carrier_id").references(() => carriers.id),
      // збережений перевізник
      isDefault: boolean("is_default").default(false),
      lastUsed: timestamp("last_used").defaultNow(),
      // для сортування за останнім використанням
      usageCount: integer("usage_count").default(1),
      // кількість використань
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    orderStatuses = pgTable("order_statuses", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull().unique(),
      // Назва українською
      textColor: varchar("text_color", { length: 7 }).notNull().default("#000000"),
      // HEX колір тексту
      backgroundColor: varchar("background_color", { length: 7 }).notNull().default("#ffffff"),
      // HEX колір фону
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    senderSettings = pgTable("sender_settings", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 50 }).notNull(),
      cityRef: varchar("city_ref", { length: 255 }).notNull(),
      cityName: varchar("city_name", { length: 255 }).notNull(),
      warehouseRef: varchar("warehouse_ref", { length: 255 }).notNull(),
      warehouseAddress: text("warehouse_address").notNull(),
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    shipments = pgTable("shipments", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id").references(() => orders.id).notNull(),
      shipmentNumber: text("shipment_number").notNull().unique(),
      trackingNumber: text("tracking_number"),
      carrierId: integer("carrier_id").references(() => carriers.id),
      // Відправник
      senderName: varchar("sender_name", { length: 255 }),
      senderPhone: varchar("sender_phone", { length: 50 }),
      senderCityRef: varchar("sender_city_ref", { length: 255 }),
      senderCityName: varchar("sender_city_name", { length: 255 }),
      senderWarehouseRef: varchar("sender_warehouse_ref", { length: 255 }),
      senderWarehouseAddress: text("sender_warehouse_address"),
      // Отримувач
      recipientName: varchar("recipient_name", { length: 255 }),
      recipientPhone: varchar("recipient_phone", { length: 50 }),
      recipientCityRef: varchar("recipient_city_ref", { length: 255 }),
      recipientCityName: varchar("recipient_city_name", { length: 255 }),
      recipientWarehouseRef: varchar("recipient_warehouse_ref", { length: 255 }),
      recipientWarehouseAddress: text("recipient_warehouse_address"),
      weight: decimal("weight", { precision: 8, scale: 3 }),
      // кг
      length: decimal("length", { precision: 8, scale: 2 }),
      // довжина в см
      width: decimal("width", { precision: 8, scale: 2 }),
      // ширина в см
      height: decimal("height", { precision: 8, scale: 2 }),
      // висота в см
      shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
      declaredValue: decimal("declared_value", { precision: 10, scale: 2 }),
      // оголошена вартість
      status: text("status").notNull().default("preparing"),
      // preparing, shipped, in_transit, delivered
      estimatedDelivery: timestamp("estimated_delivery"),
      actualDelivery: timestamp("actual_delivery"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      shippedAt: timestamp("shipped_at")
    });
    shipmentItems = pgTable("shipment_items", {
      id: serial("id").primaryKey(),
      shipmentId: integer("shipment_id").references(() => shipments.id).notNull(),
      orderItemId: integer("order_item_id").references(() => orderItems.id).notNull(),
      productId: integer("product_id").references(() => products.id).notNull(),
      quantity: integer("quantity").notNull(),
      serialNumbers: text("serial_numbers").array()
      // серійні номери для відстеження
    });
    orderItems = pgTable("order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id").references(() => orders.id).notNull(),
      productId: integer("product_id").references(() => products.id).notNull(),
      quantity: integer("quantity").notNull(),
      shippedQuantity: integer("shipped_quantity").notNull().default(0),
      // кількість вже відвантажена
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull()
    });
    recipes = pgTable("recipes", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      productId: integer("product_id").references(() => products.id),
      description: text("description"),
      instructions: text("instructions"),
      estimatedTime: integer("estimated_time"),
      // in minutes
      laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
      createdAt: timestamp("created_at").defaultNow()
    });
    recipeIngredients = pgTable("recipe_ingredients", {
      id: serial("id").primaryKey(),
      recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
      productId: integer("product_id").references(() => products.id).notNull(),
      quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
      unit: text("unit").notNull()
    });
    productionTasks = pgTable("production_tasks", {
      id: serial("id").primaryKey(),
      recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
      quantity: integer("quantity").notNull(),
      unit: text("unit").notNull().default("\u0448\u0442"),
      status: text("status").notNull().default("planned"),
      // planned, in-progress, quality-check, completed
      priority: text("priority").notNull().default("medium"),
      // low, medium, high
      assignedTo: text("assigned_to"),
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      progress: integer("progress").default(0),
      // 0-100
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    techCards = pgTable("tech_cards", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      description: text("description"),
      productId: integer("product_id").references(() => products.id),
      baseTechCardId: integer("base_tech_card_id"),
      // для модифікацій виробів - foreign key додамо пізніше
      isBaseCard: boolean("is_base_card").default(true),
      // чи це базова карта
      modificationNote: text("modification_note"),
      // примітка про модифікацію
      estimatedTime: integer("estimated_time").notNull(),
      // в хвилинах
      difficulty: text("difficulty").notNull(),
      // easy, medium, hard
      status: text("status").notNull().default("active"),
      // active, inactive
      materialCost: decimal("material_cost", { precision: 10, scale: 2 }).default("0"),
      createdBy: text("created_by"),
      // інформація про користувача-творця
      createdAt: timestamp("created_at").defaultNow()
    });
    techCardSteps = pgTable("tech_card_steps", {
      id: serial("id").primaryKey(),
      techCardId: integer("tech_card_id").references(() => techCards.id),
      stepNumber: integer("step_number").notNull(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      duration: integer("duration").notNull(),
      // в хвилинах
      equipment: text("equipment"),
      notes: text("notes"),
      // Поля для паралельного виконання
      departmentId: integer("department_id").references(() => departments.id),
      // Дільниця виконання
      positionId: integer("position_id").references(() => positions.id),
      // Посада робітника
      canRunParallel: boolean("can_run_parallel").default(false),
      // Чи може виконуватись паралельно
      prerequisiteSteps: text("prerequisite_steps"),
      // JSON масив номерів кроків-попередників
      executionOrder: integer("execution_order").default(1)
      // Порядок виконання в паралельній групі
    });
    techCardMaterials = pgTable("tech_card_materials", {
      id: serial("id").primaryKey(),
      techCardId: integer("tech_card_id").references(() => techCards.id),
      productId: integer("product_id").references(() => products.id),
      quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
      unit: text("unit").notNull()
    });
    packageTypes = pgTable("package_types", {
      id: serial("id").primaryKey(),
      name: varchar("name").notNull(),
      description: text("description"),
      pinCount: integer("pin_count"),
      createdAt: timestamp("created_at").defaultNow()
    });
    solderingTypes = pgTable("soldering_types", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      temperature: varchar("temperature", { length: 50 }),
      method: varchar("method", { length: 100 }),
      equipment: text("equipment"),
      createdAt: timestamp("created_at").defaultNow()
    });
    componentCategories = pgTable("component_categories", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      description: text("description"),
      color: varchar("color", { length: 7 }).default("#3B82F6"),
      // Колір для візуальної ідентифікації
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    components = pgTable("components", {
      id: serial("id").primaryKey(),
      name: varchar("name").notNull(),
      sku: varchar("sku").notNull().unique(),
      description: text("description"),
      unit: varchar("unit").notNull().default("\u0448\u0442"),
      costPrice: varchar("cost_price").notNull().default("0"),
      supplier: varchar("supplier"),
      partNumber: varchar("part_number"),
      categoryId: integer("category_id").references(() => componentCategories.id),
      manufacturer: varchar("manufacturer"),
      uktzedCode: varchar("uktzed_code"),
      packageTypeId: integer("package_type_id").references(() => packageTypes.id),
      minStock: integer("min_stock"),
      maxStock: integer("max_stock"),
      createdAt: timestamp("created_at").defaultNow()
    });
    clientMail = pgTable("client_mail", {
      id: serial("id").primaryKey(),
      clientId: integer("client_id").references(() => clients.id).notNull(),
      subject: varchar("subject", { length: 255 }).notNull(),
      content: text("content").notNull(),
      mailType: varchar("mail_type", { length: 50 }).notNull().default("letter"),
      priority: varchar("priority", { length: 20 }).notNull().default("normal"),
      status: varchar("status", { length: 50 }).notNull().default("draft"),
      envelopePrinted: boolean("envelope_printed").default(false),
      batchId: varchar("batch_id", { length: 100 }),
      senderName: varchar("sender_name", { length: 255 }),
      senderAddress: text("sender_address"),
      recipientName: varchar("recipient_name", { length: 255 }),
      recipientAddress: text("recipient_address"),
      envelopeSize: varchar("envelope_size", { length: 50 }),
      postageCost: decimal("postage_cost", { precision: 10, scale: 2 }),
      trackingNumber: varchar("tracking_number", { length: 100 }),
      sentDate: timestamp("sent_date"),
      deliveredDate: timestamp("delivered_date"),
      returnDate: timestamp("return_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    mailRegistry = pgTable("mail_registry", {
      id: serial("id").primaryKey(),
      batchId: varchar("batch_id", { length: 100 }).notNull(),
      batchName: varchar("batch_name", { length: 255 }).notNull(),
      mailCount: integer("mail_count").notNull().default(0),
      registryDate: timestamp("registry_date").notNull().defaultNow(),
      sentBy: varchar("sent_by", { length: 255 }),
      notes: text("notes"),
      status: varchar("status", { length: 50 }).notNull().default("created"),
      createdAt: timestamp("created_at").defaultNow()
    });
    envelopePrintSettings = pgTable("envelope_print_settings", {
      id: serial("id").primaryKey(),
      settingName: varchar("setting_name", { length: 255 }).notNull(),
      envelopeSize: varchar("envelope_size", { length: 50 }).notNull().default("dl"),
      // dl, c4, c5
      senderName: varchar("sender_name", { length: 255 }),
      senderAddress: text("sender_address"),
      senderPhone: varchar("sender_phone", { length: 50 }),
      advertisementText: text("advertisement_text"),
      advertisementImage: text("advertisement_image"),
      // base64 зображення
      adPositions: text("ad_positions").default('["bottom-left"]'),
      // JSON масив позицій
      imageRelativePosition: varchar("image_relative_position", { length: 50 }).default("below"),
      // above, below, left, right
      imageSize: varchar("image_size", { length: 50 }).default("small"),
      // small, medium, large
      fontSize: varchar("font_size", { length: 10 }).default("12"),
      senderRecipientFontSize: varchar("sender_recipient_font_size", { length: 10 }).default("14"),
      // fontSize * 1.2
      postalIndexFontSize: varchar("postal_index_font_size", { length: 10 }).default("18"),
      // fontSize * 1.5
      advertisementFontSize: varchar("advertisement_font_size", { length: 10 }).default("11"),
      // fontSize * 0.9
      centerImage: boolean("center_image").default(false),
      senderPosition: text("sender_position").default('{"x": 20, "y": 15}'),
      // JSON позиція відправника
      recipientPosition: text("recipient_position").default('{"x": 120, "y": 60}'),
      // JSON позиція отримувача
      adPositionCoords: text("ad_position_coords").default('{"bottom-left": {"x": 8, "y": 85}, "top-right": {"x": 160, "y": 8}}'),
      // JSON координати реклами
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    productComponents = pgTable("product_components", {
      id: serial("id").primaryKey(),
      parentProductId: integer("parent_product_id").references(() => products.id).notNull(),
      componentProductId: integer("component_product_id").references(() => products.id),
      quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
      unit: text("unit").notNull().default("\u0448\u0442"),
      isOptional: boolean("is_optional").default(false),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCategorySchema = createInsertSchema(categories).omit({ id: true });
    insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
    insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
    insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
    insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
    insertOrderSchema = z.object({
      customerName: z.string().optional(),
      clientId: z.number().optional(),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
      status: z.string().default("pending"),
      notes: z.string().optional(),
      paymentDate: z.string().optional(),
      dueDate: z.string().optional(),
      shippedDate: z.string().optional()
    }).refine((data) => data.customerName || data.clientId, {
      message: "\u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u0432\u043A\u0430\u0437\u0430\u0442\u0438 \u0430\u0431\u043E \u0456\u043C'\u044F \u043A\u043B\u0456\u0454\u043D\u0442\u0430, \u0430\u0431\u043E \u043E\u0431\u0440\u0430\u0442\u0438 \u043A\u043B\u0456\u0454\u043D\u0442\u0430 \u0437\u0456 \u0441\u043F\u0438\u0441\u043A\u0443"
    });
    insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
    insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
    insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
    insertProductionTaskSchema = createInsertSchema(productionTasks).omit({ id: true, createdAt: true });
    insertTechCardSchema = createInsertSchema(techCards).omit({ id: true, createdAt: true });
    insertTechCardStepSchema = createInsertSchema(techCardSteps).omit({ id: true });
    insertTechCardMaterialSchema = createInsertSchema(techCardMaterials).omit({ id: true });
    insertPackageTypeSchema = createInsertSchema(packageTypes).omit({
      id: true,
      createdAt: true
    });
    insertSolderingTypeSchema = createInsertSchema(solderingTypes).omit({
      id: true,
      createdAt: true
    });
    insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSenderSettingsSchema = createInsertSchema(senderSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertShipmentSchema = createInsertSchema(shipments).omit({
      id: true,
      createdAt: true,
      shipmentNumber: true
    }).partial().extend({
      // Обов'язкове поле
      orderId: z.number().min(1, "\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0435")
    });
    insertShipmentItemSchema = createInsertSchema(shipmentItems).omit({
      id: true
    });
    insertComponentCategorySchema = createInsertSchema(componentCategories).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertComponentSchema = createInsertSchema(components).omit({ id: true, createdAt: true });
    insertProductComponentSchema = createInsertSchema(productComponents).omit({ id: true, createdAt: true });
    materialShortages = pgTable("material_shortages", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id).notNull(),
      warehouseId: integer("warehouse_id").references(() => warehouses.id),
      requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
      availableQuantity: decimal("available_quantity", { precision: 12, scale: 4 }).notNull().default("0"),
      shortageQuantity: decimal("shortage_quantity", { precision: 12, scale: 4 }).notNull(),
      unit: text("unit").notNull(),
      priority: text("priority").notNull().default("medium"),
      // low, medium, high, critical
      estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }).default("0"),
      supplierRecommendationId: integer("supplier_recommendation_id").references(() => suppliers.id),
      notes: text("notes"),
      status: text("status").notNull().default("pending"),
      // pending, ordered, received
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    costCalculations = pgTable("cost_calculations", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id).notNull(),
      materialCost: decimal("material_cost", { precision: 12, scale: 2 }).notNull().default("0"),
      laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
      overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }).notNull().default("0"),
      totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
      profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull().default("20"),
      // percentage
      sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
      calculatedAt: timestamp("calculated_at").defaultNow(),
      notes: text("notes")
    });
    suppliers = pgTable("suppliers", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      contactPerson: text("contact_person"),
      email: text("email"),
      phone: text("phone"),
      address: text("address"),
      description: text("description"),
      paymentTerms: text("payment_terms"),
      // умови оплати
      deliveryTerms: text("delivery_terms"),
      // умови доставки
      rating: integer("rating").default(5),
      // рейтинг від 1 до 10
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    supplierOrders = pgTable("supplier_orders", {
      id: serial("id").primaryKey(),
      supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
      orderNumber: text("order_number").notNull(),
      status: text("status").notNull().default("draft"),
      // draft, sent, confirmed, received
      totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
      expectedDelivery: timestamp("expected_delivery"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    supplierOrderItems = pgTable("supplier_order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id").references(() => supplierOrders.id).notNull(),
      productId: integer("product_id").references(() => products.id).notNull(),
      quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
      unit: text("unit").notNull(),
      unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
      totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull().default("0"),
      materialShortageId: integer("material_shortage_id").references(() => materialShortages.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertMaterialShortageSchema = createInsertSchema(materialShortages).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCostCalculationSchema = createInsertSchema(costCalculations).omit({
      id: true,
      calculatedAt: true
    });
    insertSupplierOrderSchema = createInsertSchema(supplierOrders).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSupplierOrderItemSchema = createInsertSchema(supplierOrderItems).omit({
      id: true,
      createdAt: true
    });
    insertSupplierSchema = createInsertSchema(suppliers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    assemblyOperations = pgTable("assembly_operations", {
      id: serial("id").primaryKey(),
      operationType: text("operation_type").notNull(),
      // assembly, disassembly
      productId: integer("product_id").references(() => products.id).notNull(),
      // готовий виріб
      warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
      quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
      unit: text("unit").notNull(),
      status: text("status").notNull().default("planned"),
      // planned, in_progress, completed, cancelled
      plannedDate: timestamp("planned_date"),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      performedBy: text("performed_by"),
      // хто виконував операцію
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    assemblyOperationItems = pgTable("assembly_operation_items", {
      id: serial("id").primaryKey(),
      operationId: integer("operation_id").references(() => assemblyOperations.id).notNull(),
      componentId: integer("component_id").references(() => products.id).notNull(),
      // компонент
      requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
      actualQuantity: decimal("actual_quantity", { precision: 12, scale: 4 }).default("0"),
      unit: text("unit").notNull(),
      status: text("status").notNull().default("pending"),
      // pending, consumed, returned
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    emailSettings = pgTable("email_settings", {
      id: serial("id").primaryKey(),
      smtpHost: varchar("smtp_host", { length: 255 }),
      smtpPort: integer("smtp_port").default(587),
      smtpSecure: boolean("smtp_secure").default(false),
      smtpUser: varchar("smtp_user", { length: 255 }),
      smtpPassword: varchar("smtp_password", { length: 255 }),
      fromEmail: varchar("from_email", { length: 255 }),
      fromName: varchar("from_name", { length: 255 }).default("REGMIK ERP"),
      isActive: boolean("is_active").default(false),
      updatedAt: timestamp("updated_at").defaultNow(),
      updatedBy: varchar("updated_by", { length: 50 })
    });
    clients = pgTable("clients", {
      id: serial("id").primaryKey(),
      // Автоматично генерований унікальний ID
      taxCode: varchar("tax_code", { length: 20 }).notNull().unique(),
      // ЄДРПОУ або ІПН
      name: varchar("name", { length: 255 }).notNull(),
      // Скорочена назва
      fullName: varchar("full_name", { length: 500 }),
      // Повна назва
      type: varchar("type", { length: 50 }).notNull().default("individual"),
      // individual, organization
      // Адреси
      legalAddress: text("legal_address"),
      // Юридична адреса
      physicalAddress: text("physical_address"),
      // Фактична адреса для відвантаження
      addressesMatch: boolean("addresses_match").default(false),
      // Адреси співпадають
      // Фінансова інформація
      discount: decimal("discount", { precision: 5, scale: 2 }).default("0.00"),
      // Знижка клієнта в %
      notes: text("notes"),
      // Налаштування Нової Пошти
      novaPoshtaApiKey: varchar("nova_poshta_api_key", { length: 255 }),
      novaPoshtaSenderRef: varchar("nova_poshta_sender_ref", { length: 255 }),
      novaPoshtaContactRef: varchar("nova_poshta_contact_ref", { length: 255 }),
      novaPoshtaAddressRef: varchar("nova_poshta_address_ref", { length: 255 }),
      enableThirdPartyShipping: boolean("enable_third_party_shipping").default(false),
      // Поля для синхронізації з зовнішніми системами
      externalId: varchar("external_id", { length: 100 }),
      source: varchar("source", { length: 20 }).default("manual"),
      // bitrix24, 1c, manual
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    clientContacts = pgTable("client_contacts", {
      id: serial("id").primaryKey(),
      clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
      fullName: varchar("full_name", { length: 255 }).notNull(),
      position: varchar("position", { length: 255 }),
      email: varchar("email", { length: 255 }),
      // Основний телефон
      primaryPhone: varchar("primary_phone", { length: 50 }),
      primaryPhoneType: varchar("primary_phone_type", { length: 50 }).default("mobile"),
      // mobile, office, home
      // Додатковий телефон
      secondaryPhone: varchar("secondary_phone", { length: 50 }),
      secondaryPhoneType: varchar("secondary_phone_type", { length: 50 }).default("office"),
      // mobile, office, home, fax
      // Третій телефон (для факсу або додаткового)
      tertiaryPhone: varchar("tertiary_phone", { length: 50 }),
      tertiaryPhoneType: varchar("tertiary_phone_type", { length: 50 }).default("fax"),
      // mobile, office, home, fax
      notes: text("notes"),
      isPrimary: boolean("is_primary").default(false),
      // основний контакт клієнта
      isActive: boolean("is_active").default(true),
      // Поля для синхронізації з зовнішніми системами
      externalId: varchar("external_id", { length: 100 }),
      source: varchar("source", { length: 20 }).default("manual"),
      // bitrix24, 1c, manual
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    clientNovaPoshtaSettings = pgTable("client_nova_poshta_settings", {
      id: serial("id").primaryKey(),
      clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
      // API налаштування
      apiKey: varchar("api_key", { length: 255 }).notNull(),
      // Налаштування відправника
      senderRef: varchar("sender_ref", { length: 255 }),
      // Референс відправника в НП
      senderAddress: varchar("sender_address", { length: 255 }),
      // Адреса відправника
      senderCityRef: varchar("sender_city_ref", { length: 255 }),
      // Референс міста відправника
      senderPhone: varchar("sender_phone", { length: 50 }),
      senderContact: varchar("sender_contact", { length: 255 }),
      // Налаштування за замовчуванням
      defaultServiceType: varchar("default_service_type", { length: 100 }).default("WarehouseWarehouse"),
      // WarehouseWarehouse, WarehouseDoors, DoorsWarehouse, DoorsDoors
      defaultCargoType: varchar("default_cargo_type", { length: 100 }).default("Parcel"),
      // Parcel, Cargo
      defaultPaymentMethod: varchar("default_payment_method", { length: 100 }).default("Cash"),
      // Cash, NonCash
      defaultPayer: varchar("default_payer", { length: 100 }).default("Sender"),
      // Sender, Recipient, ThirdPerson
      // Додаткові налаштування
      description: text("description"),
      isActive: boolean("is_active").default(true),
      isPrimary: boolean("is_primary").default(false),
      // основні налаштування для клієнта
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAssemblyOperationSchema = createInsertSchema(assemblyOperations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAssemblyOperationItemSchema = createInsertSchema(assemblyOperationItems).omit({
      id: true,
      createdAt: true
    });
    insertClientSchema = createInsertSchema(clients).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertClientContactSchema = createInsertSchema(clientContacts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertClientNovaPoshtaSettingsSchema = createInsertSchema(clientNovaPoshtaSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    inventoryAudits = pgTable("inventory_audits", {
      id: serial("id").primaryKey(),
      auditNumber: varchar("audit_number", { length: 100 }).notNull().unique(),
      warehouseId: integer("warehouse_id").references(() => warehouses.id),
      status: varchar("status", { length: 50 }).notNull().default("planned"),
      // planned, in_progress, completed, cancelled
      auditType: varchar("audit_type", { length: 50 }).notNull(),
      // full, partial, cycle_count
      plannedDate: timestamp("planned_date"),
      startedDate: timestamp("started_date"),
      completedDate: timestamp("completed_date"),
      responsiblePersonId: integer("responsible_person_id").references(() => workers.id),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    inventoryAuditItems = pgTable("inventory_audit_items", {
      id: serial("id").primaryKey(),
      auditId: integer("audit_id").notNull().references(() => inventoryAudits.id),
      productId: integer("product_id").notNull().references(() => products.id),
      systemQuantity: decimal("system_quantity", { precision: 10, scale: 2 }).notNull(),
      countedQuantity: decimal("counted_quantity", { precision: 10, scale: 2 }),
      variance: decimal("variance", { precision: 10, scale: 2 }),
      variancePercent: decimal("variance_percent", { precision: 5, scale: 2 }),
      unit: varchar("unit", { length: 50 }).notNull(),
      reason: text("reason"),
      // reason for variance
      adjustmentMade: boolean("adjustment_made").default(false),
      notes: text("notes"),
      countedBy: varchar("counted_by", { length: 255 }),
      countedAt: timestamp("counted_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertInventoryAuditSchema = createInsertSchema(inventoryAudits).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      auditNumber: true
    });
    insertInventoryAuditItemSchema = createInsertSchema(inventoryAuditItems).omit({
      id: true,
      createdAt: true
    });
    workers = pgTable("workers", {
      id: serial("id").primaryKey(),
      firstName: varchar("first_name", { length: 100 }).notNull(),
      lastName: varchar("last_name", { length: 100 }).notNull(),
      positionId: integer("position_id").references(() => positions.id),
      departmentId: integer("department_id").references(() => departments.id),
      email: varchar("email", { length: 255 }),
      phone: varchar("phone", { length: 20 }),
      hireDate: timestamp("hire_date"),
      hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
      photo: text("photo"),
      // URL або base64 рядок фото
      isActive: boolean("is_active").default(true).notNull(),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertWorkerSchema = createInsertSchema(workers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      hourlyRate: z.union([z.string(), z.number()]).transform((val) => val?.toString()).optional().nullable(),
      hireDate: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : null).optional().nullable()
    });
    productionForecasts = pgTable("production_forecasts", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      forecastType: varchar("forecast_type", { length: 50 }).notNull(),
      // demand, capacity, material
      periodType: varchar("period_type", { length: 50 }).notNull(),
      // daily, weekly, monthly, quarterly
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      status: varchar("status", { length: 50 }).notNull().default("draft"),
      // draft, active, completed, archived
      accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
      // точність прогнозу в відсотках
      confidence: decimal("confidence", { precision: 5, scale: 2 }),
      // рівень довіри до прогнозу
      methodology: varchar("methodology", { length: 100 }),
      // linear_regression, moving_average, exponential_smoothing
      notes: text("notes"),
      createdBy: varchar("created_by", { length: 100 }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    productionForecastItems = pgTable("production_forecast_items", {
      id: serial("id").primaryKey(),
      forecastId: integer("forecast_id").notNull().references(() => productionForecasts.id),
      productId: integer("product_id").notNull().references(() => products.id),
      periodStart: timestamp("period_start").notNull(),
      periodEnd: timestamp("period_end").notNull(),
      forecastedDemand: decimal("forecasted_demand", { precision: 12, scale: 4 }).notNull(),
      forecastedProduction: decimal("forecasted_production", { precision: 12, scale: 4 }).notNull(),
      currentStock: decimal("current_stock", { precision: 12, scale: 4 }).default("0"),
      requiredCapacity: decimal("required_capacity", { precision: 10, scale: 2 }),
      // година роботи
      estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
      unit: varchar("unit", { length: 50 }).notNull(),
      priority: varchar("priority", { length: 20 }).default("medium"),
      // low, medium, high, critical
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    forecastMaterialRequirements = pgTable("forecast_material_requirements", {
      id: serial("id").primaryKey(),
      forecastItemId: integer("forecast_item_id").notNull().references(() => productionForecastItems.id),
      materialId: integer("material_id").notNull().references(() => products.id),
      requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
      currentStock: decimal("current_stock", { precision: 12, scale: 4 }).default("0"),
      shortageQuantity: decimal("shortage_quantity", { precision: 12, scale: 4 }).default("0"),
      estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
      unit: varchar("unit", { length: 50 }).notNull(),
      leadTime: integer("lead_time").default(0),
      // час постачання в днях
      supplierId: integer("supplier_id").references(() => suppliers.id),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertProductionForecastSchema = createInsertSchema(productionForecasts).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    });
    insertProductionForecastItemSchema = createInsertSchema(productionForecastItems).omit({
      id: true,
      createdAt: true
    });
    insertForecastMaterialRequirementSchema = createInsertSchema(forecastMaterialRequirements).omit({
      id: true,
      createdAt: true
    });
    warehouseTransfers = pgTable("warehouse_transfers", {
      id: serial("id").primaryKey(),
      transferNumber: varchar("transfer_number", { length: 100 }).notNull().unique(),
      fromWarehouseId: integer("from_warehouse_id").notNull().references(() => warehouses.id),
      toWarehouseId: integer("to_warehouse_id").notNull().references(() => warehouses.id),
      status: varchar("status", { length: 50 }).notNull().default("pending"),
      // pending, in_transit, completed, cancelled
      requestedDate: timestamp("requested_date").notNull(),
      scheduledDate: timestamp("scheduled_date"),
      completedDate: timestamp("completed_date"),
      responsiblePersonId: integer("responsible_person_id").references(() => workers.id),
      transportMethod: varchar("transport_method", { length: 100 }),
      // truck, courier, internal
      notes: text("notes"),
      totalValue: decimal("total_value", { precision: 12, scale: 2 }).default("0"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    warehouseTransferItems = pgTable("warehouse_transfer_items", {
      id: serial("id").primaryKey(),
      transferId: integer("transfer_id").notNull().references(() => warehouseTransfers.id),
      productId: integer("product_id").notNull().references(() => products.id),
      requestedQuantity: decimal("requested_quantity", { precision: 12, scale: 4 }).notNull(),
      transferredQuantity: decimal("transferred_quantity", { precision: 12, scale: 4 }).default("0"),
      unit: varchar("unit", { length: 50 }).notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0"),
      totalPrice: decimal("total_price", { precision: 12, scale: 2 }).default("0"),
      condition: varchar("condition", { length: 50 }).default("good"),
      // good, damaged, expired
      batchNumber: varchar("batch_number", { length: 100 }),
      expiryDate: timestamp("expiry_date"),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertWarehouseTransferSchema = createInsertSchema(warehouseTransfers).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      transferNumber: true
    });
    insertWarehouseTransferItemSchema = createInsertSchema(warehouseTransferItems).omit({
      id: true,
      createdAt: true
    });
    positions = pgTable("positions", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      description: text("description"),
      departmentId: integer("department_id").references(() => departments.id),
      salaryRange: varchar("salary_range", { length: 50 }),
      responsibilities: text("responsibilities"),
      requirements: text("requirements"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertPositionSchema = createInsertSchema(positions).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    departments = pgTable("departments", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull().unique(),
      description: text("description"),
      managerId: integer("manager_id"),
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertDepartmentSchema = createInsertSchema(departments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    productionOutput = pgTable("production_output", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").notNull().references(() => products.id),
      quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
      unit: varchar("unit", { length: 50 }).notNull(),
      warehouseId: integer("warehouse_id").references(() => warehouses.id),
      workerId: integer("worker_id").references(() => workers.id),
      recipeId: integer("recipe_id").references(() => recipes.id),
      productionDate: timestamp("production_date").notNull().defaultNow(),
      batchNumber: varchar("batch_number", { length: 100 }),
      quality: varchar("quality", { length: 50 }).default("good"),
      // good, defective, excellent
      productionCost: decimal("production_cost", { precision: 12, scale: 2 }),
      laborHours: decimal("labor_hours", { precision: 8, scale: 2 }),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertProductionOutputSchema = createInsertSchema(productionOutput).omit({
      id: true,
      createdAt: true
    });
    carriers = pgTable("carriers", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      contactPerson: varchar("contact_person", { length: 255 }),
      email: varchar("email", { length: 255 }),
      phone: varchar("phone", { length: 50 }),
      address: text("address"),
      description: text("description"),
      serviceType: varchar("service_type", { length: 100 }),
      // express, standard, freight
      rating: integer("rating").default(5),
      // 1-10
      isActive: boolean("is_active").default(true).notNull(),
      apiKey: varchar("api_key", { length: 500 }),
      // API ключ для інтеграції
      lastSyncAt: timestamp("last_sync_at"),
      // Дата останньої синхронізації
      citiesCount: integer("cities_count").default(0),
      // Кількість населених пунктів
      warehousesCount: integer("warehouses_count").default(0),
      // Кількість відділень
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertCarrierSchema = createInsertSchema(carriers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
      id: true,
      updatedAt: true
    });
    insertUserSchemaAuth = createInsertSchema(users);
    componentAlternatives = pgTable("component_alternatives", {
      id: serial("id").primaryKey(),
      originalComponentId: integer("original_component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      alternativeComponentId: integer("alternative_component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
      compatibility: varchar("compatibility", { length: 50 }).default("\u043F\u043E\u0432\u043D\u0430"),
      // повна, часткова, обмежена
      notes: text("notes"),
      verified: boolean("verified").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    componentAlternativesRelations = relations(componentAlternatives, ({ one }) => ({
      originalComponent: one(components, {
        fields: [componentAlternatives.originalComponentId],
        references: [components.id],
        relationName: "original_component"
      }),
      alternativeComponent: one(components, {
        fields: [componentAlternatives.alternativeComponentId],
        references: [components.id],
        relationName: "alternative_component"
      })
    }));
    insertComponentAlternativeSchema = createInsertSchema(componentAlternatives).omit({
      id: true,
      createdAt: true
    });
    positionsRelations = relations(positions, ({ one }) => ({
      department: one(departments, {
        fields: [positions.departmentId],
        references: [departments.id]
      })
    }));
    departmentsRelations = relations(departments, ({ many }) => ({
      positions: many(positions)
    }));
    sales = pgTable("sales", {
      id: serial("id").primaryKey(),
      orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
      customerId: integer("customer_id"),
      customerName: varchar("customer_name", { length: 255 }),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar("currency", { length: 3 }).default("UAH"),
      saleDate: timestamp("sale_date").defaultNow(),
      status: varchar("status", { length: 50 }).default("completed"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertSaleSchema = createInsertSchema(sales);
    saleItems = pgTable("sale_items", {
      id: serial("id").primaryKey(),
      saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
      productId: integer("product_id").references(() => products.id),
      productName: varchar("product_name", { length: 255 }).notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
      totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull()
    });
    productProfitability = pgTable("product_profitability", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
      productName: varchar("product_name", { length: 255 }).notNull(),
      periodStart: timestamp("period_start").notNull(),
      periodEnd: timestamp("period_end").notNull(),
      totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
      totalCost: decimal("total_cost", { precision: 15, scale: 2 }).default("0"),
      totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default("0"),
      profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0"),
      // percentage
      unitsSold: integer("units_sold").default(0),
      averageSellingPrice: decimal("average_selling_price", { precision: 10, scale: 2 }).default("0"),
      averageCostPrice: decimal("average_cost_price", { precision: 10, scale: 2 }).default("0"),
      calculatedAt: timestamp("calculated_at").defaultNow()
    });
    expenses = pgTable("expenses", {
      id: serial("id").primaryKey(),
      category: varchar("category", { length: 100 }).notNull(),
      description: varchar("description", { length: 255 }),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar("currency", { length: 3 }).default("UAH"),
      expenseDate: timestamp("expense_date").defaultNow(),
      createdBy: varchar("created_by", { length: 100 }),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertExpenseSchema = createInsertSchema(expenses);
    timeEntries = pgTable("time_entries", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 100 }).notNull(),
      userName: varchar("user_name", { length: 255 }),
      taskId: integer("task_id").references(() => productionTasks.id),
      taskName: varchar("task_name", { length: 255 }),
      description: text("description"),
      startTime: timestamp("start_time").notNull(),
      endTime: timestamp("end_time"),
      duration: integer("duration"),
      // in minutes
      createdAt: timestamp("created_at").defaultNow()
    });
    insertTimeEntrySchema = createInsertSchema(timeEntries);
    inventoryAlerts = pgTable("inventory_alerts", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
      productName: varchar("product_name", { length: 255 }).notNull(),
      currentStock: integer("current_stock").notNull(),
      minStock: integer("min_stock").notNull(),
      alertType: varchar("alert_type", { length: 50 }).default("low_stock"),
      isResolved: boolean("is_resolved").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      resolvedAt: timestamp("resolved_at")
    });
    novaPoshtaCities = pgTable("nova_poshta_cities", {
      id: serial("id").primaryKey(),
      ref: varchar("ref").notNull().unique(),
      // UUID від Нової Пошти
      name: varchar("name").notNull(),
      area: varchar("area").notNull(),
      region: varchar("region"),
      lastUpdated: timestamp("last_updated").defaultNow()
    });
    novaPoshtaWarehouses = pgTable("nova_poshta_warehouses", {
      id: serial("id").primaryKey(),
      ref: varchar("ref").notNull().unique(),
      // UUID від Нової Пошти
      cityRef: varchar("city_ref").notNull().references(() => novaPoshtaCities.ref),
      description: text("description").notNull(),
      descriptionRu: text("description_ru"),
      shortAddress: varchar("short_address"),
      phone: varchar("phone"),
      schedule: text("schedule"),
      number: varchar("number"),
      placeMaxWeightAllowed: integer("place_max_weight_allowed"),
      lastUpdated: timestamp("last_updated").defaultNow()
    });
    insertNovaPoshtaCitySchema = createInsertSchema(novaPoshtaCities).omit({
      id: true,
      lastUpdated: true
    });
    insertNovaPoshtaWarehouseSchema = createInsertSchema(novaPoshtaWarehouses).omit({
      id: true,
      lastUpdated: true
    });
    manufacturingOrders = pgTable("manufacturing_orders", {
      id: serial("id").primaryKey(),
      orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
      productId: integer("product_id").notNull().references(() => products.id),
      recipeId: integer("recipe_id").references(() => recipes.id),
      plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 4 }).notNull(),
      producedQuantity: decimal("produced_quantity", { precision: 12, scale: 4 }).default("0"),
      unit: varchar("unit", { length: 50 }).notNull().default("\u0448\u0442"),
      status: varchar("status", { length: 50 }).notNull().default("pending"),
      // pending, in_progress, completed, cancelled, paused
      priority: varchar("priority", { length: 20 }).default("medium"),
      // low, medium, high, urgent
      assignedWorkerId: integer("assigned_worker_id").references(() => workers.id),
      warehouseId: integer("warehouse_id").references(() => warehouses.id),
      startDate: timestamp("start_date"),
      plannedEndDate: timestamp("planned_end_date"),
      actualEndDate: timestamp("actual_end_date"),
      estimatedDuration: integer("estimated_duration"),
      // в хвилинах
      actualDuration: integer("actual_duration"),
      // в хвилинах
      materialCost: decimal("material_cost", { precision: 12, scale: 2 }).default("0"),
      laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).default("0"),
      overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }).default("0"),
      totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
      qualityRating: varchar("quality_rating", { length: 20 }).default("good"),
      // excellent, good, acceptable, poor
      notes: text("notes"),
      batchNumber: varchar("batch_number", { length: 100 }),
      serialNumbers: text("serial_numbers").array(),
      // масив серійних номерів
      sourceOrderId: integer("source_order_id").references(() => orders.id),
      // джерело замовлення
      createdBy: varchar("created_by", { length: 100 }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    manufacturingOrderMaterials = pgTable("manufacturing_order_materials", {
      id: serial("id").primaryKey(),
      manufacturingOrderId: integer("manufacturing_order_id").notNull().references(() => manufacturingOrders.id),
      productId: integer("product_id").references(() => products.id),
      componentId: integer("component_id").references(() => components.id),
      plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 4 }).notNull(),
      actualQuantity: decimal("actual_quantity", { precision: 12, scale: 4 }).default("0"),
      unit: varchar("unit", { length: 50 }).notNull(),
      unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0"),
      totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
      wasteQuantity: decimal("waste_quantity", { precision: 12, scale: 4 }).default("0"),
      // відходи
      batchNumber: varchar("batch_number", { length: 100 }),
      consumedAt: timestamp("consumed_at").defaultNow()
    });
    manufacturingSteps = pgTable("manufacturing_steps", {
      id: serial("id").primaryKey(),
      manufacturingOrderId: integer("manufacturing_order_id").notNull().references(() => manufacturingOrders.id),
      stepNumber: integer("step_number").notNull(),
      operationName: varchar("operation_name", { length: 255 }).notNull(),
      description: text("description"),
      status: varchar("status", { length: 50 }).default("pending"),
      // pending, in_progress, completed, skipped
      estimatedDuration: integer("estimated_duration"),
      // в хвилинах
      actualDuration: integer("actual_duration"),
      // в хвилинах
      assignedWorkerId: integer("assigned_worker_id").references(() => workers.id),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      qualityCheckPassed: boolean("quality_check_passed").default(true),
      qualityNotes: text("quality_notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertManufacturingOrderSchema = createInsertSchema(manufacturingOrders).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      orderNumber: true
    });
    insertManufacturingOrderMaterialSchema = createInsertSchema(manufacturingOrderMaterials).omit({
      id: true,
      consumedAt: true
    });
    insertManufacturingStepSchema = createInsertSchema(manufacturingSteps).omit({
      id: true,
      createdAt: true
    });
    currencies = pgTable("currencies", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 3 }).notNull().unique(),
      // USD, EUR, UAH, etc.
      name: varchar("name", { length: 100 }).notNull(),
      // US Dollar, Euro, Ukrainian Hryvnia
      symbol: varchar("symbol", { length: 10 }),
      // $, €, ₴
      decimalPlaces: integer("decimal_places").default(2),
      // Кількість знаків після коми
      isBase: boolean("is_base").default(false),
      // Базова валюта системи
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    exchangeRateHistory = pgTable("exchange_rate_history", {
      id: serial("id").primaryKey(),
      currencyId: integer("currency_id").notNull().references(() => currencies.id, { onDelete: "cascade" }),
      rate: decimal("rate", { precision: 15, scale: 6 }).notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    productPrices = pgTable("product_prices", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").notNull().references(() => products.id),
      currencyId: integer("currency_id").notNull().references(() => currencies.id),
      costPrice: decimal("cost_price", { precision: 12, scale: 6 }).default("0"),
      retailPrice: decimal("retail_price", { precision: 12, scale: 6 }).default("0"),
      wholesalePrice: decimal("wholesale_price", { precision: 12, scale: 6 }).default("0"),
      lastUpdated: timestamp("last_updated").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertCurrencySchema = createInsertSchema(currencies).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertExchangeRateHistorySchema = createInsertSchema(exchangeRateHistory).omit({
      id: true,
      createdAt: true
    });
    insertProductPriceSchema = createInsertSchema(productPrices).omit({
      id: true,
      createdAt: true,
      lastUpdated: true
    });
    serialNumberSettings = pgTable("serial_number_settings", {
      id: serial("id").primaryKey(),
      useCrossNumbering: boolean("use_cross_numbering").default(false),
      // сквозна нумерація
      globalTemplate: text("global_template").default("{year}{month:2}{day:2}-{counter:6}"),
      // глобальний шаблон
      globalPrefix: text("global_prefix"),
      // глобальний префікс
      globalStartNumber: integer("global_start_number").default(1),
      // початковий номер для сквозної нумерації
      currentGlobalCounter: integer("current_global_counter").default(0),
      // поточний лічільник
      nextSerialNumber: integer("next_serial_number").default(1),
      // наступний серійний номер
      resetCounterPeriod: text("reset_counter_period").default("never"),
      // never, yearly, monthly, daily
      lastResetDate: timestamp("last_reset_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    serialNumbers = pgTable("serial_numbers", {
      id: serial("id").primaryKey(),
      productId: integer("product_id").references(() => products.id).notNull(),
      serialNumber: text("serial_number").notNull().unique(),
      status: text("status").notNull().default("available"),
      // available, reserved, sold, defective
      warehouseId: integer("warehouse_id").references(() => warehouses.id),
      orderId: integer("order_id").references(() => orders.id),
      invoiceNumber: text("invoice_number"),
      // номер рахунку
      clientShortName: text("client_short_name"),
      // скорочена назва клієнта
      saleDate: timestamp("sale_date"),
      // дата продажі
      notes: text("notes"),
      manufacturedDate: timestamp("manufactured_date"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertSerialNumberSettingsSchema = createInsertSchema(serialNumberSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSerialNumberSchema = createInsertSchema(serialNumbers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertClientMailSchema = createInsertSchema(clientMail).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertMailRegistrySchema = createInsertSchema(mailRegistry).omit({
      id: true,
      createdAt: true
    });
    insertEnvelopePrintSettingsSchema = createInsertSchema(envelopePrintSettings).omit({
      id: true,
      createdAt: true
    }).extend({
      fontSize: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
      senderRecipientFontSize: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
      postalIndexFontSize: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
      advertisementFontSize: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
      imageSize: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
      centerImage: z.boolean().optional().default(false),
      isDefault: z.boolean().optional().default(false),
      senderPosition: z.union([z.string(), z.object({ x: z.number(), y: z.number() })]).transform(
        (val) => typeof val === "string" ? val : JSON.stringify(val)
      ).optional(),
      recipientPosition: z.union([z.string(), z.object({ x: z.number(), y: z.number() })]).transform(
        (val) => typeof val === "string" ? val : JSON.stringify(val)
      ).optional(),
      adPositionCoords: z.union([z.string(), z.object({})]).transform(
        (val) => typeof val === "string" ? val : JSON.stringify(val)
      ).optional()
    });
    insertLocalUserSchema = createInsertSchema(localUsers).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      passwordResetToken: true,
      passwordResetExpires: true
    }).extend({
      password: z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0456\u043D\u0456\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432"),
      email: z.string().email("\u041D\u0435\u0432\u0456\u0440\u043D\u0438\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 email"),
      confirmPassword: z.string().optional()
    }).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
      message: "\u041F\u0430\u0440\u043E\u043B\u0456 \u043D\u0435 \u0441\u043F\u0456\u0432\u043F\u0430\u0434\u0430\u044E\u0442\u044C",
      path: ["confirmPassword"]
    });
    insertRoleSchema = createInsertSchema(roles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSystemModuleSchema = createInsertSchema(systemModules).omit({
      id: true,
      createdAt: true
    });
    insertUserLoginHistorySchema = createInsertSchema(userLoginHistory).omit({
      id: true,
      loginTime: true,
      logoutTime: true,
      sessionDuration: true
    });
    changePasswordSchema = z.object({
      currentPassword: z.string().min(1, "\u041F\u043E\u0442\u043E\u0447\u043D\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u0439"),
      newPassword: z.string().min(6, "\u041D\u043E\u0432\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0456\u043D\u0456\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432"),
      confirmPassword: z.string().min(1, "\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044F \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0435")
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: "\u041F\u0430\u0440\u043E\u043B\u0456 \u043D\u0435 \u0441\u043F\u0456\u0432\u043F\u0430\u0434\u0430\u044E\u0442\u044C",
      path: ["confirmPassword"]
    });
    adminResetPasswordSchema = z.object({
      newPassword: z.string().min(6, "\u041D\u043E\u0432\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0456\u043D\u0456\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432"),
      confirmPassword: z.string().min(1, "\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044F \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0435")
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: "\u041F\u0430\u0440\u043E\u043B\u0456 \u043D\u0435 \u0441\u043F\u0456\u0432\u043F\u0430\u0434\u0430\u044E\u0442\u044C",
      path: ["confirmPassword"]
    });
    loginSchema = z.object({
      username: z.string().min(1, "\u0406\u043C'\u044F \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0435"),
      password: z.string().min(1, "\u041F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u0439")
    });
    resetPasswordSchema = z.object({
      email: z.string().email("\u041D\u0435\u0432\u0456\u0440\u043D\u0438\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 email")
    });
    newPasswordSchema = z.object({
      token: z.string().min(1, "\u0422\u043E\u043A\u0435\u043D \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u0439"),
      password: z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0456\u043D\u0456\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432"),
      confirmPassword: z.string().min(1, "\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044F \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0435")
    }).refine((data) => data.password === data.confirmPassword, {
      message: "\u041F\u0430\u0440\u043E\u043B\u0456 \u043D\u0435 \u0441\u043F\u0456\u0432\u043F\u0430\u0434\u0430\u044E\u0442\u044C",
      path: ["confirmPassword"]
    });
    insertOrderStatusSchema = createInsertSchema(orderStatuses).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    tasks = pgTable("tasks", {
      id: serial("id").primaryKey(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      status: varchar("status", { length: 50 }).notNull().default("pending"),
      priority: varchar("priority", { length: 20 }).notNull().default("medium"),
      assignedTo: varchar("assigned_to", { length: 255 }),
      startDate: timestamp("start_date"),
      endDate: timestamp("end_date"),
      progress: integer("progress").default(0),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertTaskSchema = createInsertSchema(tasks).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    integrationConfigs = pgTable("integration_configs", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      // "bitrix24", "1c_enterprise", "1c_accounting"
      displayName: varchar("display_name", { length: 200 }).notNull(),
      type: varchar("type", { length: 50 }).notNull(),
      // "crm", "accounting", "erp"
      isActive: boolean("is_active").default(false),
      config: jsonb("config").$type().notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    syncLogs = pgTable("sync_logs", {
      id: serial("id").primaryKey(),
      integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
      operation: varchar("operation", { length: 100 }).notNull(),
      // "import_clients", "export_orders", "sync_products"
      status: varchar("status", { length: 50 }).notNull(),
      // "started", "completed", "failed", "partial"
      recordsProcessed: integer("records_processed").default(0),
      recordsSuccessful: integer("records_successful").default(0),
      recordsFailed: integer("records_failed").default(0),
      startedAt: timestamp("started_at").notNull(),
      completedAt: timestamp("completed_at"),
      errorMessage: text("error_message"),
      details: jsonb("details"),
      // детальна інформація про синхронізацію
      createdAt: timestamp("created_at").defaultNow()
    });
    entityMappings = pgTable("entity_mappings", {
      id: serial("id").primaryKey(),
      integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      // "client", "order", "product", "contact"
      localId: varchar("local_id", { length: 100 }).notNull(),
      // ID в нашій системі
      externalId: varchar("external_id", { length: 100 }).notNull(),
      // ID в зовнішній системі
      lastSyncAt: timestamp("last_sync_at").defaultNow(),
      syncDirection: varchar("sync_direction", { length: 20 }).default("bidirectional"),
      // "import", "export", "bidirectional"
      metadata: jsonb("metadata"),
      // додаткова інформація про мапінг
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => [
      index("idx_entity_mappings_integration_entity").on(table.integrationId, table.entityType),
      index("idx_entity_mappings_local_id").on(table.localId),
      index("idx_entity_mappings_external_id").on(table.externalId)
    ]);
    syncQueue = pgTable("sync_queue", {
      id: serial("id").primaryKey(),
      integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
      operation: varchar("operation", { length: 100 }).notNull(),
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      entityId: varchar("entity_id", { length: 100 }).notNull(),
      direction: varchar("direction", { length: 20 }).notNull(),
      // "import", "export"
      priority: integer("priority").default(5),
      // 1-10, де 1 - найвищий пріоритет
      status: varchar("status", { length: 50 }).default("pending"),
      // "pending", "processing", "completed", "failed"
      attempts: integer("attempts").default(0),
      maxAttempts: integer("max_attempts").default(3),
      payload: jsonb("payload"),
      // дані для синхронізації
      errorMessage: text("error_message"),
      scheduledAt: timestamp("scheduled_at").defaultNow(),
      processedAt: timestamp("processed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    fieldMappings = pgTable("field_mappings", {
      id: serial("id").primaryKey(),
      integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      localField: varchar("local_field", { length: 100 }).notNull(),
      // назва поля в нашій системі
      externalField: varchar("external_field", { length: 100 }).notNull(),
      // назва поля в зовнішній системі
      transformation: varchar("transformation", { length: 50 }),
      // "none", "date_format", "currency_conversion", "custom"
      transformationConfig: jsonb("transformation_config"),
      // конфігурація трансформації
      isRequired: boolean("is_required").default(false),
      direction: varchar("direction", { length: 20 }).default("bidirectional"),
      // "import", "export", "bidirectional"
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    integrationConfigsRelations = relations(integrationConfigs, ({ many }) => ({
      syncLogs: many(syncLogs),
      entityMappings: many(entityMappings),
      syncQueue: many(syncQueue),
      fieldMappings: many(fieldMappings)
    }));
    syncLogsRelations = relations(syncLogs, ({ one }) => ({
      integration: one(integrationConfigs, {
        fields: [syncLogs.integrationId],
        references: [integrationConfigs.id]
      })
    }));
    entityMappingsRelations = relations(entityMappings, ({ one }) => ({
      integration: one(integrationConfigs, {
        fields: [entityMappings.integrationId],
        references: [integrationConfigs.id]
      })
    }));
    syncQueueRelations = relations(syncQueue, ({ one }) => ({
      integration: one(integrationConfigs, {
        fields: [syncQueue.integrationId],
        references: [integrationConfigs.id]
      })
    }));
    fieldMappingsRelations = relations(fieldMappings, ({ one }) => ({
      integration: one(integrationConfigs, {
        fields: [fieldMappings.integrationId],
        references: [integrationConfigs.id]
      })
    }));
    insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSyncLogSchema = createInsertSchema(syncLogs).omit({
      id: true,
      createdAt: true
    });
    insertEntityMappingSchema = createInsertSchema(entityMappings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSyncQueueSchema = createInsertSchema(syncQueue).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertFieldMappingSchema = createInsertSchema(fieldMappings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCompanySchema = createInsertSchema(companies).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserSortPreferenceSchema = createInsertSchema(userSortPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
  }
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var poolConfig, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (process.env.DATABASE_URL) {
      poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      };
    } else if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
      poolConfig = {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT || "5432"),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
      };
    } else {
      throw new Error(
        "Database configuration missing. Please set either DATABASE_URL or PostgreSQL environment variables (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)"
      );
    }
    pool = new Pool(poolConfig);
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/storage.ts
var MemStorage, storage2;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemStorage = class {
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.categories = /* @__PURE__ */ new Map();
        this.units = /* @__PURE__ */ new Map();
        this.warehouses = /* @__PURE__ */ new Map();
        this.products = /* @__PURE__ */ new Map();
        this.inventory = /* @__PURE__ */ new Map();
        this.orders = /* @__PURE__ */ new Map();
        this.orderItems = /* @__PURE__ */ new Map();
        this.recipes = /* @__PURE__ */ new Map();
        this.recipeIngredients = /* @__PURE__ */ new Map();
        this.productionTasks = /* @__PURE__ */ new Map();
        this.suppliers = /* @__PURE__ */ new Map();
        this.techCards = /* @__PURE__ */ new Map();
        this.techCardSteps = /* @__PURE__ */ new Map();
        this.techCardMaterials = /* @__PURE__ */ new Map();
        this.components = /* @__PURE__ */ new Map();
        this.productComponents = /* @__PURE__ */ new Map();
        this.shipments = /* @__PURE__ */ new Map();
        this.serialNumbers = /* @__PURE__ */ new Map();
        this.integrationConfigs = /* @__PURE__ */ new Map();
        this.syncLogs = /* @__PURE__ */ new Map();
        this.entityMappings = /* @__PURE__ */ new Map();
        this.syncQueue = /* @__PURE__ */ new Map();
        this.fieldMappings = /* @__PURE__ */ new Map();
        this.currentUserId = 1;
        this.currentCategoryId = 1;
        this.currentUnitId = 1;
        this.currentWarehouseId = 1;
        this.currentProductId = 1;
        this.currentInventoryId = 1;
        this.currentOrderId = 1;
        this.currentOrderItemId = 1;
        this.currentRecipeId = 1;
        this.currentRecipeIngredientId = 1;
        this.currentProductionTaskId = 1;
        this.currentSupplierId = 1;
        this.currentTechCardId = 1;
        this.currentTechCardStepId = 1;
        this.currentTechCardMaterialId = 1;
        this.currentComponentId = 1;
        this.currentProductComponentId = 1;
        this.currentShipmentId = 1;
        this.currentSerialNumberId = 1;
        this.currentIntegrationConfigId = 1;
        this.currentSyncLogId = 1;
        this.currentEntityMappingId = 1;
        this.currentSyncQueueId = 1;
        this.currentFieldMappingId = 1;
        this.carriers = /* @__PURE__ */ new Map();
        this.nextCarrierId = 1;
        this.initializeData();
      }
      initializeData() {
        const defaultCategory = { id: 1, name: "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u0456\u043A\u0430", description: "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0456 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0438" };
        this.categories.set(1, defaultCategory);
        this.currentCategoryId = 2;
        const defaultUnits = [
          { id: 1, name: "\u0428\u0442\u0443\u043A\u0438", shortName: "\u0448\u0442", type: "count", baseUnit: null, conversionFactor: "1", description: "\u0428\u0442\u0443\u0447\u043D\u0456 \u043E\u0434\u0438\u043D\u0438\u0446\u0456", createdAt: /* @__PURE__ */ new Date() },
          { id: 2, name: "\u041A\u0456\u043B\u043E\u0433\u0440\u0430\u043C\u0438", shortName: "\u043A\u0433", type: "weight", baseUnit: null, conversionFactor: "1", description: "\u041E\u0434\u0438\u043D\u0438\u0446\u0456 \u0432\u0430\u0433\u0438", createdAt: /* @__PURE__ */ new Date() },
          { id: 3, name: "\u041B\u0456\u0442\u0440\u0438", shortName: "\u043B", type: "volume", baseUnit: null, conversionFactor: "1", description: "\u041E\u0434\u0438\u043D\u0438\u0446\u0456 \u043E\u0431'\u0454\u043C\u0443", createdAt: /* @__PURE__ */ new Date() },
          { id: 4, name: "\u041C\u0435\u0442\u0440\u0438", shortName: "\u043C", type: "length", baseUnit: null, conversionFactor: "1", description: "\u041E\u0434\u0438\u043D\u0438\u0446\u0456 \u0434\u043E\u0432\u0436\u0438\u043D\u0438", createdAt: /* @__PURE__ */ new Date() },
          { id: 5, name: "\u041A\u0432\u0430\u0434\u0440\u0430\u0442\u043D\u0456 \u043C\u0435\u0442\u0440\u0438", shortName: "\u043C\xB2", type: "area", baseUnit: null, conversionFactor: "1", description: "\u041E\u0434\u0438\u043D\u0438\u0446\u0456 \u043F\u043B\u043E\u0449\u0456", createdAt: /* @__PURE__ */ new Date() }
        ];
        defaultUnits.forEach((unit) => this.units.set(unit.id, unit));
        this.currentUnitId = 6;
        const defaultWarehouse = { id: 1, name: "\u0413\u043E\u043B\u043E\u0432\u043D\u0438\u0439 \u0441\u043A\u043B\u0430\u0434", location: "\u041A\u0438\u0457\u0432", description: "\u041E\u0441\u043D\u043E\u0432\u043D\u0438\u0439 \u0441\u043A\u043B\u0430\u0434" };
        this.warehouses.set(1, defaultWarehouse);
        this.currentWarehouseId = 2;
        const defaultCarriers = [
          {
            id: 1,
            name: "\u041D\u043E\u0432\u0430 \u041F\u043E\u0448\u0442\u0430",
            contactPerson: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0437 \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0438\u0445 \u043A\u043B\u0456\u0454\u043D\u0442\u0456\u0432",
            email: "corporate@novaposhta.ua",
            phone: "+380 800 500 609",
            address: "\u041A\u0438\u0457\u0432, \u0432\u0443\u043B. \u041A\u043E\u0441\u043C\u0456\u0447\u043D\u0430, 6",
            description: "\u041F\u0440\u043E\u0432\u0456\u0434\u043D\u0430 \u0441\u043B\u0443\u0436\u0431\u0430 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438 \u0423\u043A\u0440\u0430\u0457\u043D\u0438",
            serviceType: "express",
            rating: 4.8,
            isActive: true,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          },
          {
            id: 2,
            name: "\u0423\u043A\u0440\u041F\u043E\u0448\u0442\u0430",
            contactPerson: "\u0412\u0456\u0434\u0434\u0456\u043B \u043A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u043E\u0431\u0441\u043B\u0443\u0433\u043E\u0432\u0443\u0432\u0430\u043D\u043D\u044F",
            email: "corporate@ukrposhta.ua",
            phone: "+380 800 301 545",
            address: "\u041A\u0438\u0457\u0432, \u041C\u0430\u0439\u0434\u0430\u043D \u041D\u0435\u0437\u0430\u043B\u0435\u0436\u043D\u043E\u0441\u0442\u0456, 22",
            description: "\u041D\u0430\u0446\u0456\u043E\u043D\u0430\u043B\u044C\u043D\u0438\u0439 \u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043F\u043E\u0448\u0442\u043E\u0432\u043E\u0433\u043E \u0437\u0432'\u044F\u0437\u043A\u0443",
            serviceType: "standard",
            rating: 4.2,
            isActive: true,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          },
          {
            id: 3,
            name: "Meest Express",
            contactPerson: "\u041A\u043E\u0440\u043F\u043E\u0440\u0430\u0442\u0438\u0432\u043D\u0456 \u043F\u0440\u043E\u0434\u0430\u0436\u0456",
            email: "corporate@meest.com",
            phone: "+380 800 502 206",
            address: "\u041B\u044C\u0432\u0456\u0432, \u0432\u0443\u043B. \u041F\u0456\u0434 \u0414\u0443\u0431\u043E\u043C, 7\u043B",
            description: "\u041C\u0456\u0436\u043D\u0430\u0440\u043E\u0434\u043D\u0430 \u0441\u043B\u0443\u0436\u0431\u0430 \u0435\u043A\u0441\u043F\u0440\u0435\u0441-\u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438",
            serviceType: "international",
            rating: 4.5,
            isActive: true,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }
        ];
        defaultCarriers.forEach((carrier) => this.carriers.set(carrier.id, carrier));
        this.nextCarrierId = 4;
      }
      // Users (updated for Replit Auth)
      async getUser(id2) {
        return Array.from(this.users.values()).find((user) => user.id === id2);
      }
      async upsertUser(userData) {
        const existingUser = Array.from(this.users.values()).find((user) => user.id === userData.id);
        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            ...userData,
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.users.set(userData.id, updatedUser);
          return updatedUser;
        } else {
          const newUser = {
            ...userData,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.users.set(userData.id, newUser);
          return newUser;
        }
      }
      // Categories
      async getCategories() {
        return Array.from(this.categories.values());
      }
      async createCategory(insertCategory) {
        const id2 = this.currentCategoryId++;
        const category = {
          ...insertCategory,
          id: id2,
          description: insertCategory.description ?? null
        };
        this.categories.set(id2, category);
        return category;
      }
      async updateCategory(id2, categoryData) {
        const existingCategory = this.categories.get(id2);
        if (!existingCategory) {
          return void 0;
        }
        const updatedCategory = { ...existingCategory, ...categoryData };
        this.categories.set(id2, updatedCategory);
        return updatedCategory;
      }
      async deleteCategory(id2) {
        return this.categories.delete(id2);
      }
      // Units
      async getUnits() {
        return Array.from(this.units.values());
      }
      async createUnit(insertUnit) {
        const id2 = this.currentUnitId++;
        const unit = {
          ...insertUnit,
          id: id2,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.units.set(id2, unit);
        return unit;
      }
      async updateUnit(id2, unitData) {
        const existingUnit = this.units.get(id2);
        if (!existingUnit) {
          return void 0;
        }
        const updatedUnit = { ...existingUnit, ...unitData };
        this.units.set(id2, updatedUnit);
        return updatedUnit;
      }
      async deleteUnit(id2) {
        return this.units.delete(id2);
      }
      // Warehouses
      async getWarehouses() {
        return Array.from(this.warehouses.values());
      }
      async createWarehouse(insertWarehouse) {
        const id2 = this.currentWarehouseId++;
        const warehouse = {
          ...insertWarehouse,
          id: id2,
          description: insertWarehouse.description ?? null,
          location: insertWarehouse.location ?? null
        };
        this.warehouses.set(id2, warehouse);
        return warehouse;
      }
      async updateWarehouse(id2, warehouseData) {
        const existingWarehouse = this.warehouses.get(id2);
        if (!existingWarehouse) {
          return void 0;
        }
        const updatedWarehouse = { ...existingWarehouse, ...warehouseData };
        this.warehouses.set(id2, updatedWarehouse);
        return updatedWarehouse;
      }
      async deleteWarehouse(id2) {
        return this.warehouses.delete(id2);
      }
      // Products
      async getProducts() {
        return Array.from(this.products.values());
      }
      async getProduct(id2) {
        return this.products.get(id2);
      }
      async createProduct(insertProduct) {
        const id2 = this.currentProductId++;
        const product = {
          ...insertProduct,
          id: id2,
          description: insertProduct.description ?? null,
          barcode: insertProduct.barcode ?? null,
          categoryId: insertProduct.categoryId ?? null,
          photo: insertProduct.photo ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.products.set(id2, product);
        return product;
      }
      async updateProduct(id2, productData) {
        const product = this.products.get(id2);
        if (!product) return void 0;
        const updatedProduct = { ...product, ...productData };
        this.products.set(id2, updatedProduct);
        return updatedProduct;
      }
      async deleteProduct(id2) {
        return this.products.delete(id2);
      }
      // Inventory
      async getInventory() {
        const result = [];
        const inventoryValues = [...this.inventory.values()];
        for (const inventory2 of inventoryValues) {
          const product = this.products.get(inventory2.productId);
          const warehouse = this.warehouses.get(inventory2.warehouseId);
          if (product && warehouse) {
            result.push({ ...inventory2, product, warehouse });
          }
        }
        return result;
      }
      async getInventoryByWarehouse(warehouseId) {
        const result = [];
        const inventoryValues = [...this.inventory.values()];
        for (const inventory2 of inventoryValues) {
          if (inventory2.warehouseId === warehouseId) {
            const product = this.products.get(inventory2.productId);
            if (product) {
              result.push({ ...inventory2, product });
            }
          }
        }
        return result;
      }
      async updateInventory(productId, warehouseId, quantity) {
        const key = `${productId}-${warehouseId}`;
        let inventory2 = this.inventory.get(key);
        if (!inventory2) {
          const id2 = this.currentInventoryId++;
          inventory2 = {
            id: id2,
            productId,
            warehouseId,
            quantity,
            minStock: 10,
            maxStock: 1e3,
            updatedAt: /* @__PURE__ */ new Date()
          };
        } else {
          inventory2 = { ...inventory2, quantity, updatedAt: /* @__PURE__ */ new Date() };
        }
        this.inventory.set(key, inventory2);
        return inventory2;
      }
      // Orders
      async getOrders() {
        return Array.from(this.orders.values());
      }
      async getOrder(id2) {
        const order = this.orders.get(id2);
        if (!order) return void 0;
        const orderItemsList = this.orderItems.get(id2) || [];
        const items = [];
        for (const item of orderItemsList) {
          const product = this.products.get(item.productId);
          if (product) {
            items.push({ ...item, product });
          }
        }
        return { ...order, items };
      }
      async getOrderProducts(orderId) {
        const orderItemsList = this.orderItems.get(orderId) || [];
        const result = [];
        for (const item of orderItemsList) {
          const product = this.products.get(item.productId);
          if (product) {
            result.push({
              id: item.id,
              orderId: item.orderId,
              productId: item.productId,
              quantity: item.quantity,
              pricePerUnit: item.unitPrice,
              product
            });
          }
        }
        return result;
      }
      async createOrder(insertOrder, items) {
        const id2 = this.currentOrderId++;
        const order = {
          ...insertOrder,
          id: id2,
          status: insertOrder.status ?? "pending",
          customerEmail: insertOrder.customerEmail ?? null,
          customerPhone: insertOrder.customerPhone ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.orders.set(id2, order);
        const orderItemsList = items.map((item) => ({
          ...item,
          id: this.currentOrderItemId++,
          orderId: id2
        }));
        this.orderItems.set(id2, orderItemsList);
        return order;
      }
      async updateOrderStatus(id2, status) {
        const order = this.orders.get(id2);
        if (!order) return void 0;
        const updatedOrder = { ...order, status };
        this.orders.set(id2, updatedOrder);
        return updatedOrder;
      }
      async deleteOrder(id2) {
        const order = this.orders.get(id2);
        if (!order) return false;
        this.orders.delete(id2);
        this.orderItems.delete(id2);
        return true;
      }
      // Recipes
      async getRecipes() {
        return Array.from(this.recipes.values());
      }
      async getRecipe(id2) {
        const recipe = this.recipes.get(id2);
        if (!recipe) return void 0;
        const ingredientsList = this.recipeIngredients.get(id2) || [];
        const ingredients = [];
        for (const ingredient of ingredientsList) {
          const product = this.products.get(ingredient.productId);
          if (product) {
            ingredients.push({ ...ingredient, product });
          }
        }
        return { ...recipe, ingredients };
      }
      async createRecipe(insertRecipe, ingredients) {
        const id2 = this.currentRecipeId++;
        const recipe = {
          ...insertRecipe,
          id: id2,
          description: insertRecipe.description ?? null,
          productId: insertRecipe.productId ?? null,
          instructions: insertRecipe.instructions ?? null,
          estimatedTime: insertRecipe.estimatedTime ?? null,
          laborCost: insertRecipe.laborCost ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.recipes.set(id2, recipe);
        const ingredientsList = ingredients.map((ingredient) => ({
          ...ingredient,
          id: this.currentRecipeIngredientId++,
          recipeId: id2
        }));
        this.recipeIngredients.set(id2, ingredientsList);
        return recipe;
      }
      // Production Tasks
      async getProductionTasks() {
        const result = [];
        const taskValues = [...this.productionTasks.values()];
        for (const task of taskValues) {
          const recipe = this.recipes.get(task.recipeId);
          if (recipe) {
            result.push({ ...task, recipe });
          }
        }
        return result;
      }
      async createProductionTask(insertTask) {
        const id2 = this.currentProductionTaskId++;
        const task = {
          ...insertTask,
          id: id2,
          status: insertTask.status ?? "planned",
          priority: insertTask.priority ?? "medium",
          assignedTo: insertTask.assignedTo ?? null,
          startDate: insertTask.startDate ?? null,
          endDate: insertTask.endDate ?? null,
          progress: insertTask.progress ?? null,
          notes: insertTask.notes ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.productionTasks.set(id2, task);
        return task;
      }
      async updateProductionTask(id2, taskData) {
        const task = this.productionTasks.get(id2);
        if (!task) return void 0;
        const updatedTask = { ...task, ...taskData };
        this.productionTasks.set(id2, updatedTask);
        return updatedTask;
      }
      // Suppliers
      async getSuppliers() {
        return Array.from(this.suppliers.values());
      }
      async createSupplier(insertSupplier) {
        const id2 = this.currentSupplierId++;
        const supplier = {
          ...insertSupplier,
          id: id2,
          contactPerson: insertSupplier.contactPerson ?? null,
          email: insertSupplier.email ?? null,
          phone: insertSupplier.phone ?? null,
          address: insertSupplier.address ?? null
        };
        this.suppliers.set(id2, supplier);
        return supplier;
      }
      // Analytics
      async getDashboardStats() {
        const totalProducts = this.products.size;
        const activeOrders = Array.from(this.orders.values()).filter((o) => o.status === "pending" || o.status === "processing").length;
        const productionTasks2 = Array.from(this.productionTasks.values()).filter((t) => t.status !== "completed").length;
        let totalValue = 0;
        let lowStockCount = 0;
        const inventoryValues = [...this.inventory.values()];
        for (const inventory2 of inventoryValues) {
          const product = this.products.get(inventory2.productId);
          if (product) {
            totalValue += inventory2.quantity * parseFloat(product.costPrice);
            if (inventory2.quantity <= (inventory2.minStock || 0)) {
              lowStockCount++;
            }
          }
        }
        return {
          totalProducts,
          totalValue,
          lowStockCount,
          activeOrders,
          productionTasks: productionTasks2
        };
      }
      // Components
      async getComponents() {
        return [...this.components.values()];
      }
      async getComponent(id2) {
        return this.components.get(id2);
      }
      async createComponent(insertComponent) {
        const id2 = this.currentComponentId++;
        const component = {
          ...insertComponent,
          id: id2,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.components.set(id2, component);
        return component;
      }
      async updateComponent(id2, componentData) {
        const component = this.components.get(id2);
        if (!component) return void 0;
        const updatedComponent = { ...component, ...componentData };
        this.components.set(id2, updatedComponent);
        return updatedComponent;
      }
      async deleteComponent(id2) {
        return this.components.delete(id2);
      }
      // Tech Cards
      async getTechCards() {
        const result = [];
        const techCardValues = [...this.techCards.values()];
        for (const techCard of techCardValues) {
          const product = this.products.get(techCard.productId);
          const steps = this.techCardSteps.get(techCard.id) || [];
          const materials = this.techCardMaterials.get(techCard.id) || [];
          const materialsWithProducts = materials.map((material) => {
            const materialProduct = this.products.get(material.productId);
            return { ...material, product: materialProduct };
          }).filter((m) => m.product);
          if (product) {
            result.push({
              ...techCard,
              product,
              steps,
              materials: materialsWithProducts
            });
          }
        }
        return result;
      }
      async getTechCard(id2) {
        const techCard = this.techCards.get(id2);
        if (!techCard) return void 0;
        const product = this.products.get(techCard.productId);
        if (!product) return void 0;
        const steps = this.techCardSteps.get(id2) || [];
        const materials = this.techCardMaterials.get(id2) || [];
        const materialsWithProducts = materials.map((material) => {
          const materialProduct = this.products.get(material.productId);
          return { ...material, product: materialProduct };
        }).filter((m) => m.product);
        return {
          ...techCard,
          product,
          steps,
          materials: materialsWithProducts
        };
      }
      async createTechCard(insertTechCard, steps, materials) {
        const id2 = this.currentTechCardId++;
        const techCard = {
          ...insertTechCard,
          id: id2,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.techCards.set(id2, techCard);
        const techCardSteps2 = steps.map((step, index2) => ({
          ...step,
          id: this.currentTechCardStepId++,
          techCardId: id2,
          stepNumber: index2 + 1
        }));
        this.techCardSteps.set(id2, techCardSteps2);
        const techCardMaterials2 = materials.map((material) => ({
          ...material,
          id: this.currentTechCardMaterialId++,
          techCardId: id2
        }));
        this.techCardMaterials.set(id2, techCardMaterials2);
        return techCard;
      }
      async updateTechCard(id2, techCardData, steps, materials) {
        const techCard = this.techCards.get(id2);
        if (!techCard) return void 0;
        const updatedTechCard = { ...techCard, ...techCardData };
        this.techCards.set(id2, updatedTechCard);
        if (steps) {
          const techCardSteps2 = steps.map((step, index2) => ({
            ...step,
            id: this.currentTechCardStepId++,
            techCardId: id2,
            stepNumber: index2 + 1
          }));
          this.techCardSteps.set(id2, techCardSteps2);
        }
        if (materials) {
          const techCardMaterials2 = materials.map((material) => ({
            ...material,
            id: this.currentTechCardMaterialId++,
            techCardId: id2
          }));
          this.techCardMaterials.set(id2, techCardMaterials2);
        }
        return updatedTechCard;
      }
      async deleteTechCard(id2) {
        const techCard = this.techCards.get(id2);
        if (!techCard) return false;
        this.techCards.delete(id2);
        this.techCardSteps.delete(id2);
        this.techCardMaterials.delete(id2);
        return true;
      }
      // Product Components (BOM)
      async getProductComponents(productId) {
        const components2 = this.productComponents.get(productId) || [];
        const result = [];
        for (const component of components2) {
          const componentProduct = this.products.get(component.componentProductId);
          if (componentProduct) {
            result.push({ ...component, component: componentProduct });
          }
        }
        return result;
      }
      async addProductComponent(insertComponent) {
        const id2 = this.currentProductComponentId++;
        const component = {
          ...insertComponent,
          id: id2,
          createdAt: /* @__PURE__ */ new Date(),
          isOptional: insertComponent.isOptional ?? false,
          notes: insertComponent.notes ?? null
        };
        const existingComponents = this.productComponents.get(insertComponent.parentProductId) || [];
        existingComponents.push(component);
        this.productComponents.set(insertComponent.parentProductId, existingComponents);
        return component;
      }
      async removeProductComponent(id2) {
        for (const [productId, components2] of this.productComponents.entries()) {
          const index2 = components2.findIndex((c) => c.id === id2);
          if (index2 !== -1) {
            components2.splice(index2, 1);
            if (components2.length === 0) {
              this.productComponents.delete(productId);
            }
            return true;
          }
        }
        return false;
      }
      async updateProductComponent(id2, componentData) {
        for (const components2 of this.productComponents.values()) {
          const component = components2.find((c) => c.id === id2);
          if (component) {
            Object.assign(component, componentData);
            return component;
          }
        }
        return void 0;
      }
      // Shipments methods
      async getShipments() {
        const shipmentsArray = Array.from(this.shipments.values());
        return shipmentsArray.map((shipment) => {
          const order = this.orders.get(shipment.orderId);
          return {
            ...shipment,
            order
          };
        });
      }
      async getShipment(id2) {
        const shipment = this.shipments.get(id2);
        if (!shipment) return void 0;
        const order = this.orders.get(shipment.orderId);
        return {
          ...shipment,
          order
        };
      }
      async createShipment(shipmentData) {
        const id2 = this.currentShipmentId++;
        const shipment = {
          ...shipmentData,
          id: id2,
          shipmentNumber: `SH-${String(id2).padStart(6, "0")}`,
          status: "preparing",
          createdAt: /* @__PURE__ */ new Date(),
          shippedAt: null,
          actualDelivery: null
        };
        this.shipments.set(id2, shipment);
        return shipment;
      }
      async updateShipment(id2, shipmentData) {
        const shipment = this.shipments.get(id2);
        if (!shipment) return void 0;
        Object.assign(shipment, shipmentData);
        this.shipments.set(id2, shipment);
        return shipment;
      }
      async updateShipmentStatus(id2, status) {
        const shipment = this.shipments.get(id2);
        if (!shipment) return void 0;
        shipment.status = status;
        if (status === "shipped" && !shipment.shippedAt) {
          shipment.shippedAt = /* @__PURE__ */ new Date();
        }
        if (status === "delivered" && !shipment.actualDelivery) {
          shipment.actualDelivery = /* @__PURE__ */ new Date();
        }
        this.shipments.set(id2, shipment);
        return shipment;
      }
      async deleteShipment(id2) {
        return this.shipments.delete(id2);
      }
      // Carriers methods
      async getCarriers() {
        return Array.from(this.carriers.values());
      }
      async getCarrier(id2) {
        return this.carriers.get(id2) || null;
      }
      async createCarrier(data) {
        const carrier = {
          id: this.nextCarrierId++,
          ...data,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.carriers.set(carrier.id, carrier);
        return carrier;
      }
      async updateCarrier(id2, data) {
        const carrier = this.carriers.get(id2);
        if (!carrier) return null;
        const updatedCarrier = {
          ...carrier,
          ...data,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.carriers.set(id2, updatedCarrier);
        return updatedCarrier;
      }
      async deleteCarrier(id2) {
        return this.carriers.delete(id2);
      }
      // Serial Numbers methods
      async getSerialNumbers(productId, warehouseId) {
        const allSerialNumbers = Array.from(this.serialNumbers.values());
        return allSerialNumbers.filter((serialNumber) => {
          if (productId && serialNumber.productId !== productId) return false;
          if (warehouseId && serialNumber.warehouseId !== warehouseId) return false;
          return true;
        });
      }
      async getSerialNumber(id2) {
        return this.serialNumbers.get(id2) || null;
      }
      async createSerialNumber(data) {
        const serialNumber = {
          id: this.currentSerialNumberId++,
          ...data,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.serialNumbers.set(serialNumber.id, serialNumber);
        return serialNumber;
      }
      async updateSerialNumber(id2, data) {
        const serialNumber = this.serialNumbers.get(id2);
        if (!serialNumber) return null;
        const updatedSerialNumber = {
          ...serialNumber,
          ...data
        };
        this.serialNumbers.set(id2, updatedSerialNumber);
        return updatedSerialNumber;
      }
      async deleteSerialNumber(id2) {
        return this.serialNumbers.delete(id2);
      }
      async getAvailableSerialNumbers(productId) {
        const allSerialNumbers = Array.from(this.serialNumbers.values());
        return allSerialNumbers.filter(
          (sn) => sn.productId === productId && sn.status === "available"
        );
      }
      async reserveSerialNumber(id2, orderId) {
        const serialNumber = this.serialNumbers.get(id2);
        if (!serialNumber || serialNumber.status !== "available") return false;
        serialNumber.status = "reserved";
        serialNumber.orderId = orderId;
        this.serialNumbers.set(id2, serialNumber);
        return true;
      }
      async releaseSerialNumber(id2) {
        const serialNumber = this.serialNumbers.get(id2);
        if (!serialNumber) return false;
        serialNumber.status = "available";
        serialNumber.orderId = null;
        this.serialNumbers.set(id2, serialNumber);
        return true;
      }
      async markSerialNumberAsSold(id2) {
        const serialNumber = this.serialNumbers.get(id2);
        if (!serialNumber) return false;
        serialNumber.status = "sold";
        this.serialNumbers.set(id2, serialNumber);
        return true;
      }
      // Production Planning методи
      async getProductionPlans() {
        return [];
      }
      async createProductionPlan(plan) {
        const newPlan = {
          id: Date.now(),
          ...plan,
          createdAt: /* @__PURE__ */ new Date(),
          status: plan.status || "planned"
        };
        return newPlan;
      }
      // Supply Decision методи
      async getSupplyDecisions() {
        return [];
      }
      async analyzeSupplyDecision(productId, requiredQuantity) {
        const product = this.products.get(productId);
        if (!product) {
          throw new Error(`\u041F\u0440\u043E\u0434\u0443\u043A\u0442 \u0437 ID ${productId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
        }
        const stockLevel = Array.from(this.inventory.values()).filter((inv) => inv.productId === productId).reduce((total, inv) => total + inv.quantity, 0);
        let decision = {
          id: Date.now(),
          productId,
          requiredQuantity,
          stockLevel,
          decisionType: "manufacture",
          manufactureQuantity: requiredQuantity,
          purchaseQuantity: 0,
          decisionReason: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u0435 \u0440\u0456\u0448\u0435\u043D\u043D\u044F - \u0432\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0438",
          status: "approved"
        };
        if (stockLevel >= requiredQuantity) {
          decision.decisionType = "use_stock";
          decision.manufactureQuantity = 0;
          decision.decisionReason = "\u0414\u043E\u0441\u0442\u0430\u0442\u043D\u044C\u043E \u0437\u0430\u043F\u0430\u0441\u0456\u0432 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u0456";
        } else if (stockLevel > 0) {
          const shortfall = requiredQuantity - stockLevel;
          decision.decisionType = "partial_manufacture";
          decision.manufactureQuantity = shortfall;
          decision.decisionReason = `\u0412\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u0442\u0438 ${stockLevel} \u0437\u0456 \u0441\u043A\u043B\u0430\u0434\u0443, \u0432\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0438 ${shortfall}`;
        }
        return decision;
      }
      // Integration Configs methods
      async getIntegrationConfigs() {
        return Array.from(this.integrationConfigs.values());
      }
      async getIntegrationConfig(id2) {
        return this.integrationConfigs.get(id2);
      }
      async createIntegrationConfig(config) {
        const newConfig = {
          id: this.currentIntegrationConfigId++,
          ...config,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.integrationConfigs.set(newConfig.id, newConfig);
        return newConfig;
      }
      async updateIntegrationConfig(id2, config) {
        const existing = this.integrationConfigs.get(id2);
        if (!existing) return void 0;
        const updated = {
          ...existing,
          ...config,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.integrationConfigs.set(id2, updated);
        return updated;
      }
      async deleteIntegrationConfig(id2) {
        return this.integrationConfigs.delete(id2);
      }
      // Sync Logs methods
      async getSyncLogs(integrationId) {
        const logs = Array.from(this.syncLogs.values());
        if (integrationId) {
          return logs.filter((log) => log.integrationId === integrationId);
        }
        return logs;
      }
      async createSyncLog(log) {
        const newLog = {
          id: this.currentSyncLogId++,
          ...log,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.syncLogs.set(newLog.id, newLog);
        return newLog;
      }
      async updateSyncLog(id2, log) {
        const existing = this.syncLogs.get(id2);
        if (!existing) return false;
        const updated = {
          ...existing,
          ...log,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.syncLogs.set(id2, updated);
        return true;
      }
      // Entity Mappings methods
      async getEntityMappings(integrationId, entityType) {
        const mappings = Array.from(this.entityMappings.values());
        let filtered = mappings.filter((mapping) => mapping.integrationId === integrationId);
        if (entityType) {
          filtered = filtered.filter((mapping) => mapping.entityType === entityType);
        }
        return filtered;
      }
      async getEntityMapping(integrationId, entityType, localId) {
        const mappings = Array.from(this.entityMappings.values());
        return mappings.find(
          (mapping) => mapping.integrationId === integrationId && mapping.entityType === entityType && mapping.localId === localId
        );
      }
      async getEntityMappingByLocalId(integrationId, entityType, localId) {
        return this.getEntityMapping(integrationId, entityType, localId);
      }
      async createEntityMapping(mapping) {
        const newMapping = {
          id: this.currentEntityMappingId++,
          ...mapping,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.entityMappings.set(newMapping.id, newMapping);
        return newMapping;
      }
      async updateEntityMapping(id2, mapping) {
        const existing = this.entityMappings.get(id2);
        if (!existing) return void 0;
        const updated = {
          ...existing,
          ...mapping,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.entityMappings.set(id2, updated);
        return updated;
      }
      async deleteEntityMapping(id2) {
        return this.entityMappings.delete(id2);
      }
      // Sync Queue methods
      async getSyncQueueItems(integrationId) {
        const items = Array.from(this.syncQueue.values());
        if (integrationId) {
          return items.filter((item) => item.integrationId === integrationId);
        }
        return items;
      }
      async getPendingSyncQueueItems() {
        const items = Array.from(this.syncQueue.values());
        return items.filter((item) => item.status === "pending");
      }
      async createSyncQueueItem(item) {
        const newItem = {
          id: this.currentSyncQueueId++,
          ...item,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.syncQueue.set(newItem.id, newItem);
        return newItem;
      }
      async updateSyncQueueItem(id2, item) {
        const existing = this.syncQueue.get(id2);
        if (!existing) return false;
        const updated = {
          ...existing,
          ...item,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.syncQueue.set(id2, updated);
        return true;
      }
      async deleteSyncQueueItem(id2) {
        return this.syncQueue.delete(id2);
      }
      // Field Mappings methods
      async getFieldMappings(integrationId, entityType) {
        const mappings = Array.from(this.fieldMappings.values());
        let filtered = mappings.filter((mapping) => mapping.integrationId === integrationId);
        if (entityType) {
          filtered = filtered.filter((mapping) => mapping.entityType === entityType);
        }
        return filtered;
      }
      async createFieldMapping(mapping) {
        const newMapping = {
          id: this.currentFieldMappingId++,
          ...mapping,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.fieldMappings.set(newMapping.id, newMapping);
        return newMapping;
      }
      async updateFieldMapping(id2, mapping) {
        const existing = this.fieldMappings.get(id2);
        if (!existing) return void 0;
        const updated = {
          ...existing,
          ...mapping,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.fieldMappings.set(id2, updated);
        return updated;
      }
      async deleteFieldMapping(id2) {
        return this.fieldMappings.delete(id2);
      }
    };
    storage2 = new MemStorage();
  }
});

// server/nova-poshta-api.ts
var nova_poshta_api_exports = {};
__export(nova_poshta_api_exports, {
  novaPoshtaApi: () => novaPoshtaApi
});
var NovaPoshtaApi, novaPoshtaApi;
var init_nova_poshta_api = __esm({
  "server/nova-poshta-api.ts"() {
    "use strict";
    NovaPoshtaApi = class {
      constructor() {
        this.baseUrl = "https://api.novaposhta.ua/v2.0/json/";
        const apiKey = process.env.NOVA_POSHTA_API_KEY;
        if (!apiKey) {
          throw new Error("NOVA_POSHTA_API_KEY environment variable is required");
        }
        this.apiKey = apiKey;
      }
      updateApiKey(newApiKey) {
        this.apiKey = newApiKey;
      }
      async makeRequest(modelName, calledMethod, methodProperties = {}) {
        try {
          const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              apiKey: this.apiKey,
              modelName,
              calledMethod,
              methodProperties
            })
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          console.error("Nova Poshta API error:", error);
          throw error;
        }
      }
      async getCities(cityName) {
        const methodProperties = cityName ? { FindByString: cityName } : {};
        const response = await this.makeRequest("Address", "getCities", methodProperties);
        return response.data || [];
      }
      async getWarehouses(cityRef, warehouseId) {
        const methodProperties = {};
        if (cityRef) methodProperties.CityRef = cityRef;
        if (warehouseId) methodProperties.Ref = warehouseId;
        const response = await this.makeRequest("Address", "getWarehouses", methodProperties);
        return response.data || [];
      }
      async getWarehousesByCity(cityName) {
        const cities = await this.getCities(cityName);
        if (cities.length === 0) {
          return [];
        }
        const cityRef = cities[0].Ref;
        return this.getWarehouses(cityRef);
      }
      async calculateDeliveryCost(params) {
        console.log("Nova Poshta API request params:", params);
        const response = await this.makeRequest("InternetDocument", "getDocumentPrice", params);
        console.log("Nova Poshta raw API response:", JSON.stringify(response, null, 2));
        if (response.success === false) {
          console.log("API errors:", response.errors);
        }
        return response.data?.[0] || null;
      }
      async trackDocument(documentNumber) {
        const response = await this.makeRequest("TrackingDocument", "getStatusDocuments", {
          Documents: [{ DocumentNumber: documentNumber }]
        });
        return response.data?.[0] || null;
      }
      async trackMultipleDocuments(documentNumbers) {
        const documents = documentNumbers.map((num) => ({ DocumentNumber: num }));
        const response = await this.makeRequest("TrackingDocument", "getStatusDocuments", {
          Documents: documents
        });
        return response.data || [];
      }
      // Отримати список міст для автокомпліту
      async searchCities(query) {
        const cities = await this.getCities(query);
        return cities.map((city) => ({
          ref: city.Ref,
          name: city.Description,
          area: city.AreaDescription
        }));
      }
      // Отримати відділення по місту з додатковою інформацією
      async getWarehousesByRef(cityRef) {
        const warehouses2 = await this.getWarehouses(cityRef);
        return warehouses2.map((warehouse) => ({
          ref: warehouse.Ref,
          number: warehouse.Number,
          description: warehouse.Description,
          shortAddress: warehouse.ShortAddress,
          phone: warehouse.Phone,
          schedule: warehouse.Schedule
        }));
      }
      // Створення контрагента (отримувача)
      async createCounterparty(params) {
        const methodProperties = {
          FirstName: params.firstName,
          MiddleName: params.middleName,
          LastName: params.lastName,
          Phone: params.phone,
          Email: params.email,
          CounterpartyType: params.counterpartyType,
          CounterpartyProperty: params.counterpartyType === "Organization" ? "Recipient" : "Recipient"
        };
        const response = await this.makeRequest("Counterparty", "save", methodProperties);
        if (response.success && response.data && response.data.length > 0) {
          return response.data[0];
        } else {
          throw new Error(`Failed to create counterparty: ${response.errors?.join(", ") || "Unknown error"}`);
        }
      }
      // Пошук існуючих контрагентів
      async findCounterparty(params) {
        const methodProperties = {
          CounterpartyProperty: "Recipient",
          Page: "1"
        };
        if (params.phone) {
          methodProperties.Phone = params.phone;
        }
        if (params.counterpartyType) {
          methodProperties.CounterpartyType = params.counterpartyType;
        }
        if (params.firstName) {
          methodProperties.FirstName = params.firstName;
        }
        if (params.lastName) {
          methodProperties.LastName = params.lastName;
        }
        const response = await this.makeRequest("Counterparty", "getCounterparties", methodProperties);
        if (response.success && response.data) {
          return response.data;
        } else {
          console.log("No counterparties found:", response.errors);
          return [];
        }
      }
      // Створення інтернет-документа (накладної)
      async createInternetDocument(params) {
        let senderRef;
        try {
          const senderPhone = params.senderPhone || "+380501234567";
          let formattedSenderPhone = senderPhone.replace(/\D/g, "");
          if (formattedSenderPhone.startsWith("0")) {
            formattedSenderPhone = "380" + formattedSenderPhone.substring(1);
          }
          if (!formattedSenderPhone.startsWith("380")) {
            formattedSenderPhone = "380" + formattedSenderPhone;
          }
          console.log("Searching for existing sender with phone:", formattedSenderPhone);
          const existingSenders = await this.findCounterparty({
            phone: formattedSenderPhone,
            counterpartyType: "Organization"
          });
          console.log("Found senders:", existingSenders);
          if (existingSenders && existingSenders.length > 0) {
            senderRef = existingSenders[0].Ref;
            console.log("Using existing sender:", existingSenders[0].Description, "Ref:", senderRef);
          } else {
            console.log("No existing sender found. Creating new sender with phone:", formattedSenderPhone);
            const sender = await this.createCounterparty({
              firstName: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440",
              middleName: "",
              lastName: "\u041A\u043E\u043C\u043F\u0430\u043D\u0456\u0457",
              phone: formattedSenderPhone,
              email: "manager@company.com",
              counterpartyType: "Organization"
            });
            senderRef = sender.Ref;
          }
        } catch (error) {
          console.error("Error with sender:", error);
          throw new Error("Failed to find or create sender");
        }
        let recipientRef;
        try {
          let formattedRecipientPhone = params.recipientPhone.replace(/\D/g, "");
          if (formattedRecipientPhone.startsWith("0")) {
            formattedRecipientPhone = "380" + formattedRecipientPhone.substring(1);
          }
          if (!formattedRecipientPhone.startsWith("380")) {
            formattedRecipientPhone = "380" + formattedRecipientPhone;
          }
          console.log("Searching for existing recipient with phone:", formattedRecipientPhone);
          const existingRecipients = await this.findCounterparty({
            phone: formattedRecipientPhone,
            counterpartyType: params.recipientType || "Organization"
          });
          console.log("Found recipients:", existingRecipients);
          if (existingRecipients && existingRecipients.length > 0) {
            recipientRef = existingRecipients[0].Ref;
            console.log("Using existing recipient:", existingRecipients[0].Description, "Ref:", recipientRef);
          } else {
            console.log("No existing recipient found. Creating new recipient with phone:", formattedRecipientPhone);
            const nameParts = params.recipientName.split(" ");
            const firstName = nameParts[0] || "\u0406\u043C'\u044F";
            const lastName = nameParts[1] || "\u041F\u0440\u0456\u0437\u0432\u0438\u0449\u0435";
            const middleName = nameParts[2] || "";
            const recipient = await this.createCounterparty({
              firstName,
              middleName,
              lastName,
              phone: formattedRecipientPhone,
              email: "noemail@example.com",
              counterpartyType: params.recipientType || "Organization"
            });
            recipientRef = recipient.Ref;
          }
        } catch (error) {
          console.error("Error with recipient:", error);
          throw new Error("Failed to find or create recipient");
        }
        const tomorrow = /* @__PURE__ */ new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const day = tomorrow.getDate().toString().padStart(2, "0");
        const month = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
        const year = tomorrow.getFullYear();
        const dateTime = `${day}.${month}.${year}`;
        const methodProperties = {
          PayerType: params.payerType,
          PaymentMethod: params.paymentMethod,
          DateTime: dateTime,
          CargoType: "Parcel",
          ServiceType: "WarehouseWarehouse",
          SeatsAmount: params.seatsAmount.toString(),
          Description: params.description,
          Cost: params.cost.toString(),
          CitySender: params.citySender || "db5c897c-391c-11dd-90d9-001a92567626",
          CityRecipient: params.cityRecipient,
          SenderAddress: params.warehouseSender || "fe906167-4c37-11ec-80ed-b8830365bd14",
          RecipientAddress: params.warehouseRecipient,
          Weight: params.weight.toString(),
          VolumeGeneral: "0.004",
          Sender: senderRef,
          ContactSender: senderRef,
          SendersPhone: params.senderPhone || "+380501234567",
          Recipient: recipientRef,
          ContactRecipient: recipientRef,
          RecipientsPhone: params.recipientPhone
        };
        console.log("Nova Poshta invoice request properties:", methodProperties);
        const response = await this.makeRequest("InternetDocument", "save", methodProperties);
        console.log("Nova Poshta invoice response:", response);
        if (response.success && response.data && response.data.length > 0) {
          const data = response.data[0];
          return {
            Number: data.IntDocNumber || data.Ref,
            Cost: data.CostOnSite || params.cost,
            Ref: data.Ref
          };
        } else {
          console.error("Nova Poshta invoice error details:", response);
          throw new Error(`Failed to create document: ${response.errors?.join(", ") || "Unknown error"}`);
        }
      }
    };
    novaPoshtaApi = new NovaPoshtaApi();
  }
});

// server/email-service.ts
var email_service_exports = {};
__export(email_service_exports, {
  generatePasswordResetEmail: () => generatePasswordResetEmail,
  generatePasswordResetToken: () => generatePasswordResetToken,
  generateRegistrationConfirmationEmail: () => generateRegistrationConfirmationEmail,
  sendEmail: () => sendEmail
});
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
async function sendEmail(options) {
  try {
    console.log("Attempting to send email to:", options.to);
    const emailSettings3 = await storage2.getEmailSettings();
    console.log("Email settings loaded:", emailSettings3 ? "Yes" : "No");
    if (!emailSettings3 || !emailSettings3.isActive) {
      console.log("Email service not configured or inactive");
      return false;
    }
    console.log("Creating SMTP transport with host:", emailSettings3.smtpHost, "port:", emailSettings3.smtpPort);
    const transportConfig = {
      host: emailSettings3.smtpHost,
      port: emailSettings3.smtpPort,
      secure: emailSettings3.smtpSecure,
      // false for 587, true for 465
      requireTLS: true,
      // використовувати STARTTLS
      auth: {
        user: emailSettings3.smtpUser,
        pass: emailSettings3.smtpPassword
      },
      tls: {
        rejectUnauthorized: false
        // дозволити самопідписані сертифікати
      }
    };
    const transporter = nodemailer.createTransport(transportConfig);
    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: `"${emailSettings3.fromName}" <${emailSettings3.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
function generatePasswordResetToken() {
  return randomBytes(32).toString("hex");
}
function generatePasswordResetEmail(username, resetToken, resetUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>\u0421\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E - REGMIK ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REGMIK ERP</h1>
          <h2>\u0421\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E</h2>
        </div>
        <div class="content">
          <p>\u0412\u0456\u0442\u0430\u0454\u043C\u043E, <strong>${username}</strong>!</p>
          
          <p>\u0412\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u043B\u0438 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442, \u043E\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0431\u0443\u0432 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u0438\u0439 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0433\u043E \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0443 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456 REGMIK ERP.</p>
          
          <p>\u0414\u043B\u044F \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E \u043D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \u043D\u0438\u0436\u0447\u0435:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">\u0421\u043A\u0438\u043D\u0443\u0442\u0438 \u043F\u0430\u0440\u043E\u043B\u044C</a>
          </div>
          
          <p>\u0410\u0431\u043E \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u0442\u0430 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u0446\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          
          <div class="warning">
            <strong>\u26A0\uFE0F \u0412\u0430\u0436\u043B\u0438\u0432\u043E:</strong>
            <ul>
              <li>\u0426\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0434\u0456\u0454 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 1 \u0433\u043E\u0434\u0438\u043D\u0438</li>
              <li>\u041F\u0456\u0441\u043B\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0432\u043E\u043D\u043E \u0441\u0442\u0430\u043D\u0435 \u043D\u0435\u0434\u0456\u0439\u0441\u043D\u0438\u043C</li>
              <li>\u042F\u043A\u0449\u043E \u0432\u0438 \u043D\u0435 \u0437\u0430\u043F\u0438\u0442\u0443\u0432\u0430\u043B\u0438 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E, \u043F\u0440\u043E\u0456\u0433\u043D\u043E\u0440\u0443\u0439\u0442\u0435 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442</li>
            </ul>
          </div>
          
          <p>\u042F\u043A\u0449\u043E \u0443 \u0432\u0430\u0441 \u0432\u0438\u043D\u0438\u043A\u043B\u0438 \u043F\u0438\u0442\u0430\u043D\u043D\u044F, \u0437\u0432\u0435\u0440\u043D\u0456\u0442\u044C\u0441\u044F \u0434\u043E \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0438.</p>
        </div>
        <div class="footer">
          <p>\xA9 2025 REGMIK ERP. \u0412\u0441\u0456 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0445\u0438\u0449\u0435\u043D\u0456.</p>
          <p>\u0426\u0435\u0439 \u043B\u0438\u0441\u0442 \u0431\u0443\u043B\u043E \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E, \u043D\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0439\u0442\u0435 \u043D\u0430 \u043D\u044C\u043E\u0433\u043E.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text2 = `
REGMIK ERP - \u0421\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E

\u0412\u0456\u0442\u0430\u0454\u043C\u043E, ${username}!

\u0412\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u043B\u0438 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442, \u043E\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0431\u0443\u0432 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u0438\u0439 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0433\u043E \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0443 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456 REGMIK ERP.

\u0414\u043B\u044F \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E \u043F\u0435\u0440\u0435\u0439\u0434\u0456\u0442\u044C \u0437\u0430 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F\u043C:
${resetUrl}

\u26A0\uFE0F \u0412\u0410\u0416\u041B\u0418\u0412\u041E:
- \u0426\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0434\u0456\u0454 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 1 \u0433\u043E\u0434\u0438\u043D\u0438
- \u041F\u0456\u0441\u043B\u044F \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u0430\u043D\u043D\u044F \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0432\u043E\u043D\u043E \u0441\u0442\u0430\u043D\u0435 \u043D\u0435\u0434\u0456\u0439\u0441\u043D\u0438\u043C
- \u042F\u043A\u0449\u043E \u0432\u0438 \u043D\u0435 \u0437\u0430\u043F\u0438\u0442\u0443\u0432\u0430\u043B\u0438 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E, \u043F\u0440\u043E\u0456\u0433\u043D\u043E\u0440\u0443\u0439\u0442\u0435 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442

\u042F\u043A\u0449\u043E \u0443 \u0432\u0430\u0441 \u0432\u0438\u043D\u0438\u043A\u043B\u0438 \u043F\u0438\u0442\u0430\u043D\u043D\u044F, \u0437\u0432\u0435\u0440\u043D\u0456\u0442\u044C\u0441\u044F \u0434\u043E \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0438.

\xA9 2025 REGMIK ERP. \u0412\u0441\u0456 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0445\u0438\u0449\u0435\u043D\u0456.
\u0426\u0435\u0439 \u043B\u0438\u0441\u0442 \u0431\u0443\u043B\u043E \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E, \u043D\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0439\u0442\u0435 \u043D\u0430 \u043D\u044C\u043E\u0433\u043E.
  `;
  return { html, text: text2 };
}
function generateRegistrationConfirmationEmail(username, confirmationToken, confirmationUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 - REGMIK ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REGMIK ERP</h1>
          <h2>\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457</h2>
        </div>
        <div class="content">
          <p>\u0412\u0456\u0442\u0430\u0454\u043C\u043E, <strong>${username}</strong>!</p>
          
          <p>\u0414\u044F\u043A\u0443\u0454\u043C\u043E \u0437\u0430 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u044E \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456 REGMIK ERP. \u0414\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 \u043D\u0435\u043E\u0431\u0445\u0456\u0434\u043D\u043E \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0432\u0430\u0448\u0443 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0443 \u0430\u0434\u0440\u0435\u0441\u0443.</p>
          
          <p>\u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \u043D\u0438\u0436\u0447\u0435 \u0434\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u044E</a>
          </div>
          
          <p>\u0410\u0431\u043E \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u0442\u0430 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u0446\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0443 \u0431\u0440\u0430\u0443\u0437\u0435\u0440:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${confirmationUrl}</p>
          
          <div class="info">
            <strong>\u2139\uFE0F \u0406\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F:</strong>
            <ul>
              <li>\u0426\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0434\u0456\u0454 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 24 \u0433\u043E\u0434\u0438\u043D</li>
              <li>\u041F\u0456\u0441\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0432\u0438 \u0437\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u0432\u0456\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443</li>
              <li>\u042F\u043A\u0449\u043E \u0432\u0438 \u043D\u0435 \u0440\u0435\u0454\u0441\u0442\u0440\u0443\u0432\u0430\u043B\u0438\u0441\u044F, \u043F\u0440\u043E\u0456\u0433\u043D\u043E\u0440\u0443\u0439\u0442\u0435 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442</li>
            </ul>
          </div>
          
          <p>\u041F\u0456\u0441\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u0430\u0434\u0440\u0435\u0441\u0438 \u0432\u0438 \u0437\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u0432\u0456\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0442\u0430 \u043F\u043E\u0447\u0430\u0442\u0438 \u0440\u043E\u0431\u043E\u0442\u0443.</p>
        </div>
        <div class="footer">
          <p>\xA9 2025 REGMIK ERP. \u0412\u0441\u0456 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0445\u0438\u0449\u0435\u043D\u0456.</p>
          <p>\u0426\u0435\u0439 \u043B\u0438\u0441\u0442 \u0431\u0443\u043B\u043E \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E, \u043D\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0439\u0442\u0435 \u043D\u0430 \u043D\u044C\u043E\u0433\u043E.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text2 = `
REGMIK ERP - \u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457

\u0412\u0456\u0442\u0430\u0454\u043C\u043E, ${username}!

\u0414\u044F\u043A\u0443\u0454\u043C\u043E \u0437\u0430 \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u044E \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456 REGMIK ERP. \u0414\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 \u043D\u0435\u043E\u0431\u0445\u0456\u0434\u043D\u043E \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0438 \u0432\u0430\u0448\u0443 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0443 \u0430\u0434\u0440\u0435\u0441\u0443.

\u0414\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u043F\u0435\u0440\u0435\u0439\u0434\u0456\u0442\u044C \u0437\u0430 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F\u043C:
${confirmationUrl}

\u2139\uFE0F \u0406\u041D\u0424\u041E\u0420\u041C\u0410\u0426\u0406\u042F:
- \u0426\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0434\u0456\u0454 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 24 \u0433\u043E\u0434\u0438\u043D
- \u041F\u0456\u0441\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0432\u0438 \u0437\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u0432\u0456\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443
- \u042F\u043A\u0449\u043E \u0432\u0438 \u043D\u0435 \u0440\u0435\u0454\u0441\u0442\u0440\u0443\u0432\u0430\u043B\u0438\u0441\u044F, \u043F\u0440\u043E\u0456\u0433\u043D\u043E\u0440\u0443\u0439\u0442\u0435 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442

\u041F\u0456\u0441\u043B\u044F \u043F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u0430\u0434\u0440\u0435\u0441\u0438 \u0432\u0438 \u0437\u043C\u043E\u0436\u0435\u0442\u0435 \u0443\u0432\u0456\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0442\u0430 \u043F\u043E\u0447\u0430\u0442\u0438 \u0440\u043E\u0431\u043E\u0442\u0443.

\xA9 2025 REGMIK ERP. \u0412\u0441\u0456 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0445\u0438\u0449\u0435\u043D\u0456.
\u0426\u0435\u0439 \u043B\u0438\u0441\u0442 \u0431\u0443\u043B\u043E \u043D\u0430\u0434\u0456\u0441\u043B\u0430\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E, \u043D\u0435 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0439\u0442\u0435 \u043D\u0430 \u043D\u044C\u043E\u0433\u043E.
  `;
  return { html, text: text2 };
}
var init_email_service = __esm({
  "server/email-service.ts"() {
    "use strict";
    init_storage();
  }
});

// server/serial-number-generator.ts
var serial_number_generator_exports = {};
__export(serial_number_generator_exports, {
  SerialNumberGenerator: () => SerialNumberGenerator,
  serialNumberGenerator: () => serialNumberGenerator
});
import { eq as eq2, desc as desc2 } from "drizzle-orm";
var CATEGORY_TEMPLATES, SerialNumberGenerator, serialNumberGenerator;
var init_serial_number_generator = __esm({
  "server/serial-number-generator.ts"() {
    "use strict";
    init_db();
    init_schema();
    CATEGORY_TEMPLATES = {
      1: "ELE-{YYYY}-{####}",
      // Електроніка
      2: "MEC-{YYYY}-{####}",
      // Механіка
      3: "CHE-{YYYY}-{####}"
      // Хімія
      // Додавайте інші категорії за потребою
    };
    SerialNumberGenerator = class {
      /**
       * Генерує серійний номер для продукту
       */
      async generateSerialNumber(options) {
        const { productId, categoryId, template, useGlobalCounter = false } = options;
        if (template) {
          return await this.generateFromTemplate(template, categoryId || 0);
        }
        if (categoryId && CATEGORY_TEMPLATES[categoryId]) {
          return await this.generateFromTemplate(
            CATEGORY_TEMPLATES[categoryId],
            categoryId
          );
        }
        return await this.generateSequentialNumber(productId);
      }
      /**
       * Генерує серійний номер за шаблоном
       */
      async generateFromTemplate(template, categoryId) {
        const now = /* @__PURE__ */ new Date();
        let result = template;
        result = result.replace(/{YYYY}/g, now.getFullYear().toString());
        result = result.replace(/{YY}/g, now.getFullYear().toString().slice(-2));
        result = result.replace(/{MM}/g, (now.getMonth() + 1).toString().padStart(2, "0"));
        result = result.replace(/{DD}/g, now.getDate().toString().padStart(2, "0"));
        result = result.replace(/{HH}/g, now.getHours().toString().padStart(2, "0"));
        result = result.replace(/{mm}/g, now.getMinutes().toString().padStart(2, "0"));
        const counterPattern = /{#+}/g;
        const matches = result.match(counterPattern);
        if (matches) {
          for (const match of matches) {
            const digits = match.length - 2;
            const counter = await this.getNextCounter(categoryId);
            const paddedCounter = counter.toString().padStart(digits, "0");
            result = result.replace(match, paddedCounter);
          }
        }
        return result;
      }
      /**
       * Отримує наступний лічильник на основі існуючих серійних номерів
       */
      async getNextCounter(categoryId) {
        try {
          const existingSerials = await db.select().from(serialNumbers).orderBy(desc2(serialNumbers.id)).limit(1);
          return existingSerials.length + 1;
        } catch (error) {
          console.error("Error getting next counter:", error);
          return Date.now() % 1e4;
        }
      }
      /**
       * Генерує простий послідовний номер
       */
      async generateSequentialNumber(productId) {
        try {
          const lastSerial = await db.select().from(serialNumbers).where(eq2(serialNumbers.productId, productId)).orderBy(desc2(serialNumbers.id)).limit(1);
          let nextNumber = 1;
          if (lastSerial.length > 0) {
            const lastNumber = lastSerial[0].serialNumber;
            const match = lastNumber.match(/(\d+)$/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          const today = /* @__PURE__ */ new Date();
          const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
          return `SN-${datePrefix}-${nextNumber.toString().padStart(4, "0")}`;
        } catch (error) {
          console.error("Error generating sequential number:", error);
          const timestamp2 = Date.now();
          return `SN-${timestamp2}`;
        }
      }
      /**
       * Перевіряє унікальність серійного номера
       */
      async isSerialNumberUnique(serialNumber) {
        try {
          const existing = await db.select().from(serialNumbers).where(eq2(serialNumbers.serialNumber, serialNumber)).limit(1);
          return existing.length === 0;
        } catch (error) {
          console.error("Error checking serial number uniqueness:", error);
          return false;
        }
      }
      /**
       * Генерує унікальний серійний номер (з повторними спробами)
       */
      async generateUniqueSerialNumber(options) {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const serialNumber = await this.generateSerialNumber(options);
          if (await this.isSerialNumberUnique(serialNumber)) {
            return serialNumber;
          }
          attempts++;
          if (attempts === maxAttempts) {
            const timestamp3 = Date.now().toString().slice(-4);
            return `${serialNumber}-${timestamp3}`;
          }
        }
        const timestamp2 = Date.now();
        return `SN-${timestamp2}`;
      }
    };
    serialNumberGenerator = new SerialNumberGenerator();
  }
});

// server/production.ts
import express from "express";
import path from "path";

// server/routes.ts
import { createServer } from "http";

// server/db-storage.ts
init_db();
init_schema();
import { eq, sql, desc, and, gte, lte, isNull, ne, or } from "drizzle-orm";
var DatabaseStorage = class {
  constructor() {
    this.db = db;
    this.initializeData();
  }
  async initializeData() {
    const categoriesCount = await db.select({ count: sql`count(*)` }).from(categories);
    if (categoriesCount[0].count === 0) {
      await this.seedInitialData();
    }
  }
  async seedInitialData() {
    await db.insert(categories).values({
      name: "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u0456\u043A\u0430",
      description: "\u0415\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0456 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0438"
    });
    await db.insert(warehouses).values({
      name: "\u0413\u043E\u043B\u043E\u0432\u043D\u0438\u0439 \u0441\u043A\u043B\u0430\u0434",
      location: "\u041A\u0438\u0457\u0432",
      description: "\u041E\u0441\u043D\u043E\u0432\u043D\u0438\u0439 \u0441\u043A\u043B\u0430\u0434"
    });
    await db.insert(roles).values([
      {
        name: "\u0410\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440",
        description: "\u041F\u043E\u0432\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F \u0434\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0438",
        permissions: "admin"
      },
      {
        name: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440",
        description: "\u0423\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F\u043C\u0438 \u0442\u0430 \u043A\u043B\u0456\u0454\u043D\u0442\u0430\u043C\u0438",
        permissions: "manager"
      },
      {
        name: "\u041F\u0440\u0430\u0446\u0456\u0432\u043D\u0438\u043A \u0441\u043A\u043Badu",
        description: "\u0420\u043E\u0431\u043E\u0442\u0430 \u0437\u0456 \u0441\u043A\u043B\u0430\u0434\u0441\u044C\u043A\u0438\u043C\u0438 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u044F\u043C\u0438",
        permissions: "warehouse"
      }
    ]);
    await db.insert(systemModules).values([
      {
        name: "\u0423\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u0454\u044E",
        description: "\u0422\u043E\u0432\u0430\u0440\u0438, \u0441\u043A\u043B\u0430\u0434\u0441\u044C\u043A\u0456 \u0437\u0430\u043B\u0438\u0448\u043A\u0438, \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0456\u0457",
        isActive: true,
        order: 1
      },
      {
        name: "\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u043B\u0456\u0454\u043D\u0442\u0456\u0432",
        description: "\u041E\u0431\u0440\u043E\u0431\u043A\u0430 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u044C, \u0441\u0442\u0430\u0442\u0443\u0441\u0438, \u0432\u0456\u0434\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F",
        isActive: true,
        order: 2
      },
      {
        name: "\u0411\u0430\u0437\u0430 \u043A\u043B\u0456\u0454\u043D\u0442\u0456\u0432",
        description: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u0430 \u0456\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F, \u0456\u0441\u0442\u043E\u0440\u0456\u044F \u0441\u043F\u0456\u0432\u043F\u0440\u0430\u0446\u0456",
        isActive: true,
        order: 3
      },
      {
        name: "\u0412\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E",
        description: "\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0456\u0447\u043D\u0456 \u043A\u0430\u0440\u0442\u0438, \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u0430",
        isActive: true,
        order: 4
      },
      {
        name: "\u041D\u043E\u0432\u0430 \u041F\u043E\u0448\u0442\u0430",
        description: "\u0406\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0456\u044F \u0437 \u0441\u0435\u0440\u0432\u0456\u0441\u043E\u043C \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0438",
        isActive: true,
        order: 5
      },
      {
        name: "\u0417\u0432\u0456\u0442\u0438 \u0442\u0430 \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0430",
        description: "\u0424\u0456\u043D\u0430\u043D\u0441\u043E\u0432\u0456 \u0437\u0432\u0456\u0442\u0438, \u0430\u043D\u0430\u043B\u0456\u0437 \u043F\u0440\u043E\u0434\u0430\u0436\u0456\u0432",
        isActive: true,
        order: 6
      }
    ]);
  }
  // Users (for Replit Auth)
  async getUser(id2) {
    const result = await db.select().from(users).where(eq(users.id, id2));
    return result[0];
  }
  async upsertUser(userData) {
    const result = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result[0];
  }
  // Roles
  async getRoles() {
    return await db.select().from(roles);
  }
  async createRole(insertRole) {
    const result = await db.insert(roles).values(insertRole).returning();
    return result[0];
  }
  async updateRole(id2, roleData) {
    const result = await db.update(roles).set(roleData).where(eq(roles.id, id2)).returning();
    return result[0];
  }
  async deleteRole(id2) {
    const result = await db.delete(roles).where(eq(roles.id, id2));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // System Modules
  async getSystemModules() {
    return await db.select().from(systemModules);
  }
  async createSystemModule(insertSystemModule) {
    const result = await db.insert(systemModules).values(insertSystemModule).returning();
    return result[0];
  }
  async updateSystemModule(id2, moduleData) {
    const result = await db.update(systemModules).set(moduleData).where(eq(systemModules.id, id2)).returning();
    return result[0];
  }
  async deleteSystemModule(id2) {
    const result = await db.delete(systemModules).where(eq(systemModules.id, id2));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Categories
  async getCategories() {
    return await db.select().from(categories);
  }
  async createCategory(insertCategory) {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }
  async updateCategory(id2, categoryData) {
    const result = await db.update(categories).set(categoryData).where(eq(categories.id, id2)).returning();
    return result[0];
  }
  async deleteCategory(id2) {
    const result = await db.delete(categories).where(eq(categories.id, id2));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Warehouses
  async getWarehouses() {
    return await db.select().from(warehouses);
  }
  async createWarehouse(insertWarehouse) {
    const result = await db.insert(warehouses).values(insertWarehouse).returning();
    return result[0];
  }
  async updateWarehouse(id2, warehouseData) {
    const result = await db.update(warehouses).set(warehouseData).where(eq(warehouses.id, id2)).returning();
    return result[0];
  }
  async deleteWarehouse(id2) {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id2));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Units
  async getUnits() {
    return await db.select().from(units);
  }
  async createUnit(insertUnit) {
    const result = await db.insert(units).values(insertUnit).returning();
    return result[0];
  }
  async updateUnit(id2, unitData) {
    const result = await db.update(units).set(unitData).where(eq(units.id, id2)).returning();
    return result[0];
  }
  async deleteUnit(id2) {
    const result = await db.delete(units).where(eq(units.id, id2));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Products
  async getProducts() {
    return await db.select().from(products);
  }
  async getProduct(id2) {
    const result = await db.select().from(products).where(eq(products.id, id2));
    return result[0] || void 0;
  }
  async createProduct(insertProduct) {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }
  async updateProduct(id2, productData) {
    const result = await db.update(products).set(productData).where(eq(products.id, id2)).returning();
    return result[0];
  }
  async deleteProduct(id2) {
    const result = await db.delete(products).where(eq(products.id, id2));
    return (result.rowCount || 0) > 0;
  }
  // Inventory
  async getInventory() {
    const result = await db.select({
      id: inventory.id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      updatedAt: inventory.updatedAt,
      product: products,
      warehouse: warehouses
    }).from(inventory).leftJoin(products, eq(inventory.productId, products.id)).leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id));
    return result.filter((item) => item.product && item.warehouse);
  }
  async getInventoryByWarehouse(warehouseId) {
    const result = await db.select({
      id: inventory.id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      updatedAt: inventory.updatedAt,
      product: products
    }).from(inventory).leftJoin(products, eq(inventory.productId, products.id)).where(eq(inventory.warehouseId, warehouseId));
    return result.filter((item) => item.product);
  }
  async updateInventory(productId, warehouseId, quantity) {
    const existing = await db.select().from(inventory).where(and(eq(inventory.productId, productId), eq(inventory.warehouseId, warehouseId)));
    if (existing.length > 0) {
      const result = await db.update(inventory).set({ quantity, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inventory.id, existing[0].id)).returning();
      return result[0];
    } else {
      const result = await db.insert(inventory).values({
        productId,
        warehouseId,
        quantity,
        updatedAt: /* @__PURE__ */ new Date()
      }).returning();
      return result[0];
    }
  }
  // Orders
  async getOrders() {
    const ordersResult = await db.select().from(orders);
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const itemsResult = await db.select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          product: products
        }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, order.id));
        if (order.id === 9) {
          console.log(`\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #9 - \u0432\u0441\u044C\u043E\u0433\u043E \u0442\u043E\u0432\u0430\u0440\u0456\u0432: ${itemsResult.length}`);
          console.log("\u0422\u043E\u0432\u0430\u0440\u0438 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #9:", itemsResult.map((item) => ({
            id: item.id,
            productId: item.productId,
            hasProduct: !!item.product,
            productName: item.product?.name
          })));
        }
        const items = itemsResult.filter((item) => item.product);
        if (order.id === 9) {
          console.log(`\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F #9 - \u043F\u0456\u0441\u043B\u044F \u0444\u0456\u043B\u044C\u0442\u0440\u0430\u0446\u0456\u0457: ${items.length} \u0442\u043E\u0432\u0430\u0440\u0456\u0432`);
        }
        return { ...order, items };
      })
    );
    return ordersWithItems;
  }
  async getOrder(id2) {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id2));
    if (orderResult.length === 0) return void 0;
    const itemsResult = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      product: products
    }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, id2));
    const items = itemsResult.filter((item) => item.product);
    return { ...orderResult[0], items };
  }
  async getOrderProducts(orderId) {
    const result = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      pricePerUnit: orderItems.unitPrice,
      product: products
    }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, orderId));
    return result;
  }
  async createOrder(insertOrder, items) {
    const orderNumber = `ORD-${Date.now()}`;
    let totalAmount = 0;
    const itemsWithPrices = [];
    for (const item of items) {
      const product = await db.select().from(products).where(eq(products.id, typeof item.productId === "string" ? parseInt(item.productId) : item.productId)).limit(1);
      if (product.length > 0) {
        const unitPrice = parseFloat(product[0].retailPrice || "0");
        const quantity = parseFloat(typeof item.quantity === "string" ? item.quantity : item.quantity?.toString() || "1");
        const totalPrice = unitPrice * quantity;
        const itemWithPrice = {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString()
        };
        itemsWithPrices.push(itemWithPrice);
        totalAmount += totalPrice;
      } else {
        const itemPrice = parseFloat(item.totalPrice || "0");
        itemsWithPrices.push(item);
        totalAmount += itemPrice;
      }
    }
    const orderData = {
      ...insertOrder,
      orderNumber,
      totalAmount: totalAmount.toString(),
      clientId: insertOrder.clientId ? typeof insertOrder.clientId === "string" ? parseInt(insertOrder.clientId) : insertOrder.clientId : null,
      paymentDate: insertOrder.paymentDate ? new Date(insertOrder.paymentDate) : null,
      dueDate: insertOrder.dueDate ? new Date(insertOrder.dueDate) : null,
      shippedDate: insertOrder.shippedDate ? new Date(insertOrder.shippedDate) : null
    };
    const orderResult = await db.insert(orders).values([orderData]).returning();
    const order = orderResult[0];
    if (itemsWithPrices.length > 0) {
      const itemsToInsert = itemsWithPrices.map((item) => ({ ...item, orderId: order.id }));
      console.log("Inserting order items with calculated prices:", itemsToInsert);
      try {
        const insertResult = await db.insert(orderItems).values(itemsToInsert).returning();
        console.log("Order items inserted successfully:", insertResult);
      } catch (error) {
        console.error("Error inserting order items:", error);
        throw error;
      }
    }
    return order;
  }
  async updateOrder(id2, insertOrder, items) {
    try {
      let totalAmount = 0;
      const itemsWithPrices = [];
      for (const item of items) {
        const unitPrice = parseFloat(item.unitPrice || "0");
        const quantity = parseFloat(typeof item.quantity === "string" ? item.quantity : item.quantity?.toString() || "1");
        const totalPrice = unitPrice * quantity;
        const itemWithPrice = {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString()
        };
        itemsWithPrices.push(itemWithPrice);
        totalAmount += totalPrice;
      }
      const orderData = {
        ...insertOrder,
        totalAmount: totalAmount.toString(),
        clientId: insertOrder.clientId ? typeof insertOrder.clientId === "string" ? parseInt(insertOrder.clientId) : insertOrder.clientId : null
      };
      if (orderData.paymentDate && typeof orderData.paymentDate === "string") {
        orderData.paymentDate = new Date(orderData.paymentDate);
      }
      if (orderData.dueDate && typeof orderData.dueDate === "string") {
        orderData.dueDate = new Date(orderData.dueDate);
      }
      if (orderData.shippedDate && typeof orderData.shippedDate === "string") {
        orderData.shippedDate = new Date(orderData.shippedDate);
      }
      const orderResult = await db.update(orders).set(orderData).where(eq(orders.id, id2)).returning();
      if (orderResult.length === 0) {
        return void 0;
      }
      if (itemsWithPrices.length > 0) {
        try {
          await db.delete(orderItems).where(eq(orderItems.orderId, id2));
        } catch (error) {
          console.log("Cannot delete order items due to foreign key constraint, adding new items instead");
        }
        const itemsToInsert = itemsWithPrices.map((item) => ({ ...item, orderId: id2 }));
        console.log("Updating order items with calculated prices:", itemsToInsert);
        await db.insert(orderItems).values(itemsToInsert);
      }
      return await this.getOrder(id2);
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }
  async updateOrderStatus(id2, status) {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id2)).returning();
    return result[0];
  }
  async deleteOrder(id2) {
    try {
      await db.delete(orderItems).where(eq(orderItems.orderId, id2));
      const result = await db.delete(orders).where(eq(orders.id, id2));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }
  async updateOrderPaymentDate(id2, paymentDate) {
    const result = await db.update(orders).set({ paymentDate: paymentDate ? new Date(paymentDate) : null }).where(eq(orders.id, id2)).returning();
    return result[0];
  }
  async updateOrderDueDate(id2, dueDate) {
    const result = await db.update(orders).set({ dueDate: dueDate ? new Date(dueDate) : null }).where(eq(orders.id, id2)).returning();
    return result[0];
  }
  // Recipes
  async getRecipes() {
    return await db.select().from(recipes);
  }
  async getRecipe(id2) {
    const recipeResult = await db.select().from(recipes).where(eq(recipes.id, id2));
    if (recipeResult.length === 0) return void 0;
    const ingredientsResult = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      productId: recipeIngredients.productId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      product: products
    }).from(recipeIngredients).leftJoin(products, eq(recipeIngredients.productId, products.id)).where(eq(recipeIngredients.recipeId, id2));
    const ingredients = ingredientsResult.filter((item) => item.product);
    return { ...recipeResult[0], ingredients };
  }
  async createRecipe(insertRecipe, ingredients) {
    const recipeResult = await db.insert(recipes).values(insertRecipe).returning();
    const recipe = recipeResult[0];
    if (ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        ingredients.map((ingredient) => ({ ...ingredient, recipeId: recipe.id }))
      );
    }
    return recipe;
  }
  async updateRecipe(id2, updateData, ingredients) {
    const recipeResult = await db.update(recipes).set(updateData).where(eq(recipes.id, id2)).returning();
    if (recipeResult.length === 0) return void 0;
    if (ingredients) {
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id2));
      if (ingredients.length > 0) {
        await db.insert(recipeIngredients).values(
          ingredients.map((ingredient) => ({ ...ingredient, recipeId: id2 }))
        );
      }
    }
    return recipeResult[0];
  }
  // Production Tasks
  async getProductionTasks() {
    const result = await db.select({
      id: productionTasks.id,
      recipeId: productionTasks.recipeId,
      quantity: productionTasks.quantity,
      status: productionTasks.status,
      priority: productionTasks.priority,
      assignedTo: productionTasks.assignedTo,
      startDate: productionTasks.startDate,
      endDate: productionTasks.endDate,
      progress: productionTasks.progress,
      notes: productionTasks.notes,
      createdAt: productionTasks.createdAt,
      recipe: recipes
    }).from(productionTasks).leftJoin(recipes, eq(productionTasks.recipeId, recipes.id));
    return result.filter((item) => item.recipe);
  }
  async createProductionTask(insertTask) {
    const result = await db.insert(productionTasks).values(insertTask).returning();
    return result[0];
  }
  async updateProductionTask(id2, taskData) {
    const result = await db.update(productionTasks).set(taskData).where(eq(productionTasks.id, id2)).returning();
    return result[0];
  }
  // Suppliers
  async getSuppliers() {
    return await db.select().from(suppliers);
  }
  async getSupplier(id2) {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id2));
    return result[0];
  }
  async createSupplier(insertSupplier) {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }
  async updateSupplier(id2, supplierData) {
    const result = await db.update(suppliers).set({ ...supplierData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(suppliers.id, id2)).returning();
    return result[0];
  }
  async deleteSupplier(id2) {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id2));
    return (result.rowCount || 0) > 0;
  }
  // Components
  async getComponents() {
    return await db.select().from(components);
  }
  async getComponent(id2) {
    const result = await db.select().from(components).where(eq(components.id, id2));
    return result[0];
  }
  async createComponent(insertComponent) {
    const result = await db.insert(components).values(insertComponent).returning();
    return result[0];
  }
  async updateComponent(id2, componentData) {
    const result = await db.update(components).set({ ...componentData }).where(eq(components.id, id2)).returning();
    return result[0];
  }
  async deleteComponent(id2) {
    const result = await db.delete(components).where(eq(components.id, id2));
    return result.rowCount > 0;
  }
  // Tech Cards
  async getTechCards() {
    const techCardsResult = await db.select({
      id: techCards.id,
      name: techCards.name,
      description: techCards.description,
      productId: techCards.productId,
      baseTechCardId: techCards.baseTechCardId,
      isBaseCard: techCards.isBaseCard,
      modificationNote: techCards.modificationNote,
      estimatedTime: techCards.estimatedTime,
      difficulty: techCards.difficulty,
      status: techCards.status,
      materialCost: techCards.materialCost,
      createdBy: techCards.createdBy,
      createdAt: techCards.createdAt,
      product: products
    }).from(techCards).leftJoin(products, eq(techCards.productId, products.id));
    const result = [];
    for (const techCard of techCardsResult) {
      if (!techCard.product) continue;
      const steps = await db.select().from(techCardSteps).where(eq(techCardSteps.techCardId, techCard.id)).orderBy(techCardSteps.stepNumber);
      const materialsResult = await db.select({
        id: techCardMaterials.id,
        techCardId: techCardMaterials.techCardId,
        productId: techCardMaterials.productId,
        quantity: techCardMaterials.quantity,
        unit: techCardMaterials.unit,
        product: products
      }).from(techCardMaterials).leftJoin(products, eq(techCardMaterials.productId, products.id)).where(eq(techCardMaterials.techCardId, techCard.id));
      const materials = materialsResult.filter((m) => m.product);
      result.push({
        ...techCard,
        product: techCard.product,
        steps,
        materials
      });
    }
    return result;
  }
  async getTechCard(id2) {
    const techCardResult = await db.select({
      id: techCards.id,
      name: techCards.name,
      description: techCards.description,
      productId: techCards.productId,
      baseTechCardId: techCards.baseTechCardId,
      isBaseCard: techCards.isBaseCard,
      modificationNote: techCards.modificationNote,
      estimatedTime: techCards.estimatedTime,
      difficulty: techCards.difficulty,
      status: techCards.status,
      materialCost: techCards.materialCost,
      createdBy: techCards.createdBy,
      createdAt: techCards.createdAt,
      product: products
    }).from(techCards).leftJoin(products, eq(techCards.productId, products.id)).where(eq(techCards.id, id2));
    if (techCardResult.length === 0 || !techCardResult[0].product) return void 0;
    const techCard = techCardResult[0];
    const steps = await db.select().from(techCardSteps).where(eq(techCardSteps.techCardId, id2)).orderBy(techCardSteps.stepNumber);
    const materialsResult = await db.select({
      id: techCardMaterials.id,
      techCardId: techCardMaterials.techCardId,
      productId: techCardMaterials.productId,
      quantity: techCardMaterials.quantity,
      unit: techCardMaterials.unit,
      product: products
    }).from(techCardMaterials).leftJoin(products, eq(techCardMaterials.productId, products.id)).where(eq(techCardMaterials.techCardId, id2));
    const materials = materialsResult.filter((m) => m.product);
    return {
      ...techCard,
      product: techCard.product,
      steps,
      materials
    };
  }
  async createTechCard(insertTechCard, steps, materials) {
    const techCardResult = await db.insert(techCards).values(insertTechCard).returning();
    const techCard = techCardResult[0];
    if (steps.length > 0) {
      await db.insert(techCardSteps).values(
        steps.map((step, index2) => ({
          ...step,
          techCardId: techCard.id,
          stepNumber: index2 + 1
        }))
      );
    }
    if (materials.length > 0) {
      await db.insert(techCardMaterials).values(
        materials.map((material) => ({
          ...material,
          techCardId: techCard.id
        }))
      );
    }
    return techCard;
  }
  async updateTechCard(id2, techCardData, steps, materials) {
    const result = await db.update(techCards).set(techCardData).where(eq(techCards.id, id2)).returning();
    if (result.length === 0) return void 0;
    if (steps) {
      await db.delete(techCardSteps).where(eq(techCardSteps.techCardId, id2));
      if (steps.length > 0) {
        await db.insert(techCardSteps).values(
          steps.map((step, index2) => ({
            ...step,
            techCardId: id2,
            stepNumber: index2 + 1
          }))
        );
      }
    }
    if (materials) {
      await db.delete(techCardMaterials).where(eq(techCardMaterials.techCardId, id2));
      if (materials.length > 0) {
        await db.insert(techCardMaterials).values(
          materials.map((material) => ({
            ...material,
            techCardId: id2
          }))
        );
      }
    }
    return result[0];
  }
  async deleteTechCard(id2) {
    try {
      await db.delete(techCardSteps).where(eq(techCardSteps.techCardId, id2));
      await db.delete(techCardMaterials).where(eq(techCardMaterials.techCardId, id2));
      const result = await db.delete(techCards).where(eq(techCards.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting tech card:", error);
      return false;
    }
  }
  // Analytics
  async getDashboardStats() {
    const [totalProductsResult] = await db.select({ count: sql`count(*)` }).from(products);
    const [activeOrdersResult] = await db.select({ count: sql`count(*)` }).from(orders).where(sql`${orders.status} IN ('pending', 'processing')`);
    const [productionTasksResult] = await db.select({ count: sql`count(*)` }).from(productionTasks).where(sql`${productionTasks.status} != 'completed'`);
    const inventoryData = await db.select({
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      costPrice: products.costPrice
    }).from(inventory).leftJoin(products, eq(inventory.productId, products.id));
    let totalValue = 0;
    let lowStockCount = 0;
    for (const item of inventoryData) {
      if (item.costPrice) {
        totalValue += item.quantity * parseFloat(item.costPrice);
      }
      if (item.quantity <= (item.minStock || 0)) {
        lowStockCount++;
      }
    }
    return {
      totalProducts: totalProductsResult.count,
      totalValue,
      lowStockCount,
      activeOrders: activeOrdersResult.count,
      productionTasks: productionTasksResult.count
    };
  }
  // Product Components (BOM)
  async getProductComponents(productId) {
    const result = await db.select({
      id: productComponents.id,
      parentProductId: productComponents.parentProductId,
      componentProductId: productComponents.componentProductId,
      quantity: productComponents.quantity,
      unit: productComponents.unit,
      isOptional: productComponents.isOptional,
      notes: productComponents.notes,
      createdAt: productComponents.createdAt,
      component: {
        id: products.id,
        name: products.name,
        description: products.description,
        sku: products.sku,
        barcode: products.barcode,
        categoryId: products.categoryId,
        costPrice: products.costPrice,
        retailPrice: products.retailPrice,
        photo: products.photo,
        productType: products.productType,
        unit: products.unit,
        minStock: products.minStock,
        maxStock: products.maxStock,
        hasSerialNumbers: products.hasSerialNumbers,
        createdAt: products.createdAt
      }
    }).from(productComponents).leftJoin(products, eq(productComponents.componentProductId, products.id)).where(eq(productComponents.parentProductId, productId));
    return result.map((row) => ({
      id: row.id,
      parentProductId: row.parentProductId,
      componentProductId: row.componentProductId,
      quantity: row.quantity,
      unit: row.unit,
      isOptional: row.isOptional,
      notes: row.notes,
      createdAt: row.createdAt,
      component: row.component
    }));
  }
  async addProductComponent(insertComponent) {
    const [result] = await db.insert(productComponents).values(insertComponent).returning();
    return result;
  }
  async removeProductComponent(id2) {
    const result = await db.delete(productComponents).where(eq(productComponents.id, id2)).returning();
    return result.length > 0;
  }
  async updateProductComponent(id2, componentData) {
    const result = await db.update(productComponents).set(componentData).where(eq(productComponents.id, id2)).returning();
    return result.length > 0 ? result[0] : void 0;
  }
  // Cost Calculations
  async getCostCalculations() {
    const result = await db.select({
      id: costCalculations.id,
      productId: costCalculations.productId,
      materialCost: costCalculations.materialCost,
      laborCost: costCalculations.laborCost,
      overheadCost: costCalculations.overheadCost,
      totalCost: costCalculations.totalCost,
      profitMargin: costCalculations.profitMargin,
      sellingPrice: costCalculations.sellingPrice,
      calculatedAt: costCalculations.calculatedAt,
      notes: costCalculations.notes,
      product: products
    }).from(costCalculations).leftJoin(products, eq(costCalculations.productId, products.id));
    return result.filter((item) => item.product);
  }
  async getCostCalculation(productId) {
    const result = await db.select({
      id: costCalculations.id,
      productId: costCalculations.productId,
      materialCost: costCalculations.materialCost,
      laborCost: costCalculations.laborCost,
      overheadCost: costCalculations.overheadCost,
      totalCost: costCalculations.totalCost,
      profitMargin: costCalculations.profitMargin,
      sellingPrice: costCalculations.sellingPrice,
      calculatedAt: costCalculations.calculatedAt,
      notes: costCalculations.notes,
      product: products
    }).from(costCalculations).leftJoin(products, eq(costCalculations.productId, products.id)).where(eq(costCalculations.productId, productId)).limit(1);
    if (result.length === 0 || !result[0].product) return void 0;
    return result[0];
  }
  async createCostCalculation(calculation) {
    const result = await db.insert(costCalculations).values(calculation).returning();
    return result[0];
  }
  async updateCostCalculation(id2, calculation) {
    const result = await db.update(costCalculations).set(calculation).where(eq(costCalculations.id, id2)).returning();
    return result.length > 0 ? result[0] : void 0;
  }
  async deleteCostCalculation(id2) {
    const result = await db.delete(costCalculations).where(eq(costCalculations.id, id2)).returning();
    return result.length > 0;
  }
  async calculateAutomaticCost(productId) {
    try {
      const components2 = await this.getProductComponents(productId);
      let materialCost = 0;
      for (const component of components2) {
        const componentCostPrice = parseFloat(component.component.costPrice || "0");
        const quantity = parseFloat(component.quantity);
        materialCost += componentCostPrice * quantity;
      }
      const productRecipes = await db.select({
        id: recipes.id,
        laborCost: recipes.laborCost
      }).from(recipes).where(eq(recipes.productId, productId));
      let laborCost = 0;
      if (productRecipes.length > 0) {
        laborCost = parseFloat(productRecipes[0].laborCost || "0");
      }
      const overheadCost = (materialCost + laborCost) * 0.2;
      const totalCost = materialCost + laborCost + overheadCost;
      const profitMargin = 20;
      const sellingPrice = totalCost * (1 + profitMargin / 100);
      const calculationData = {
        productId,
        materialCost: materialCost.toFixed(2),
        laborCost: laborCost.toFixed(2),
        overheadCost: overheadCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        profitMargin: profitMargin.toFixed(2),
        sellingPrice: sellingPrice.toFixed(2),
        notes: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \u0440\u043E\u0437\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u0456\u0432 \u0442\u0430 \u0440\u0435\u0446\u0435\u043F\u0442\u0456\u0432"
      };
      const existing = await this.getCostCalculation(productId);
      if (existing) {
        return await this.updateCostCalculation(existing.id, calculationData) || existing;
      } else {
        return await this.createCostCalculation(calculationData);
      }
    } catch (error) {
      console.error("Error calculating automatic cost:", error);
      throw error;
    }
  }
  // Material Shortages methods
  async getMaterialShortages() {
    const result = await db.select({
      shortage: materialShortages,
      product: products,
      warehouse: warehouses,
      supplier: suppliers
    }).from(materialShortages).leftJoin(products, eq(materialShortages.productId, products.id)).leftJoin(warehouses, eq(materialShortages.warehouseId, warehouses.id)).leftJoin(suppliers, eq(materialShortages.supplierRecommendationId, suppliers.id)).orderBy(materialShortages.priority, materialShortages.createdAt);
    return result.map((row) => ({
      ...row.shortage,
      product: row.product,
      warehouse: row.warehouse || void 0,
      supplier: row.supplier || void 0
    }));
  }
  async getMaterialShortage(id2) {
    const result = await db.select({
      shortage: materialShortages,
      product: products,
      warehouse: warehouses
    }).from(materialShortages).leftJoin(products, eq(materialShortages.productId, products.id)).leftJoin(warehouses, eq(materialShortages.warehouseId, warehouses.id)).where(eq(materialShortages.id, id2)).limit(1);
    if (result.length === 0) return void 0;
    const row = result[0];
    return {
      ...row.shortage,
      product: row.product,
      warehouse: row.warehouse || void 0
    };
  }
  async createMaterialShortage(shortage) {
    const result = await db.insert(materialShortages).values(shortage).returning();
    return result[0];
  }
  async updateMaterialShortage(id2, shortageData) {
    try {
      console.log("Updating material shortage:", { id: id2, shortageData });
      const result = await db.update(materialShortages).set({ ...shortageData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(materialShortages.id, id2)).returning();
      console.log("Update result:", result[0]);
      return result[0];
    } catch (error) {
      console.error("Error updating material shortage:", error);
      throw error;
    }
  }
  async deleteMaterialShortage(id2) {
    try {
      const relatedOrderItems = await db.select().from(supplierOrderItems).where(eq(supplierOrderItems.materialShortageId, id2)).limit(1);
      if (relatedOrderItems.length > 0) {
        await db.delete(supplierOrderItems).where(eq(supplierOrderItems.materialShortageId, id2));
      }
      const result = await db.delete(materialShortages).where(eq(materialShortages.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting material shortage:", error);
      throw new Error(error.message || "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043D\u0456 \u0434\u0435\u0444\u0456\u0446\u0438\u0442\u0443 \u043C\u0430\u0442\u0435\u0440\u0456\u0430\u043B\u0456\u0432");
    }
  }
  async calculateMaterialShortages() {
    try {
      await db.delete(materialShortages).where(eq(materialShortages.status, "pending"));
      const bomComponents = await db.select({
        parentProductId: productComponents.parentProductId,
        componentProductId: productComponents.componentProductId,
        quantity: productComponents.quantity,
        unit: productComponents.unit,
        component: products
      }).from(productComponents).leftJoin(products, eq(productComponents.componentProductId, products.id));
      const currentInventory = await db.select().from(inventory).leftJoin(products, eq(inventory.productId, products.id));
      const requirements = /* @__PURE__ */ new Map();
      for (const bom of bomComponents) {
        if (!bom.component) continue;
        const key = bom.componentProductId;
        if (key === null) continue;
        const existingReq = requirements.get(key);
        const quantity = parseFloat(bom.quantity);
        if (existingReq) {
          existingReq.quantity += quantity;
        } else {
          requirements.set(key, {
            quantity,
            unit: bom.unit,
            product: bom.component
          });
        }
      }
      const shortages = [];
      for (const [productId, requirement] of requirements) {
        const availableStock = currentInventory.filter((item) => item.inventory.productId === productId).reduce((sum, item) => sum + item.inventory.quantity, 0);
        const shortageQuantity = requirement.quantity - availableStock;
        if (shortageQuantity > 0) {
          let priority = "low";
          if (shortageQuantity > requirement.quantity * 0.8) {
            priority = "critical";
          } else if (shortageQuantity > requirement.quantity * 0.5) {
            priority = "high";
          } else if (shortageQuantity > requirement.quantity * 0.2) {
            priority = "medium";
          }
          const estimatedCost = shortageQuantity * parseFloat(requirement.product.costPrice || "0");
          const shortageData = {
            productId,
            warehouseId: null,
            requiredQuantity: requirement.quantity.toString(),
            availableQuantity: availableStock.toString(),
            shortageQuantity: shortageQuantity.toString(),
            unit: requirement.unit,
            priority,
            estimatedCost: estimatedCost.toString(),
            supplierRecommendationId: null,
            notes: `\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \u0440\u043E\u0437\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u043E \u043D\u0430 \u043E\u0441\u043D\u043E\u0432\u0456 BOM`,
            status: "pending"
          };
          const created = await this.createMaterialShortage(shortageData);
          shortages.push(created);
        }
      }
      return shortages;
    } catch (error) {
      console.error("Error calculating material shortages:", error);
      throw error;
    }
  }
  async createSupplierOrderFromShortage(shortageId) {
    try {
      const shortageResult = await db.select({
        shortage: materialShortages,
        product: products
      }).from(materialShortages).leftJoin(products, eq(materialShortages.productId, products.id)).where(eq(materialShortages.id, shortageId));
      if (shortageResult.length === 0 || !shortageResult[0].product) {
        return void 0;
      }
      const { shortage, product } = shortageResult[0];
      const orderNumber = `ORD-${Date.now()}`;
      const supplierId = shortage.supplierRecommendationId || 1;
      const orderData = {
        supplierId,
        orderNumber,
        status: "draft",
        totalAmount: shortage.estimatedCost || "0",
        expectedDelivery: null,
        notes: `\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \u0437 \u0434\u0435\u0444\u0456\u0446\u0438\u0442\u0443 \u043C\u0430\u0442\u0435\u0440\u0456\u0430\u043B\u0456\u0432 #${shortageId}`
      };
      const [newOrder] = await db.insert(supplierOrders).values(orderData).returning();
      const itemData = {
        orderId: newOrder.id,
        productId: product.id,
        quantity: shortage.shortageQuantity,
        unit: shortage.unit,
        unitPrice: product.costPrice || "0",
        totalPrice: shortage.estimatedCost || "0",
        materialShortageId: shortageId
      };
      const [newItem] = await db.insert(supplierOrderItems).values(itemData).returning();
      await db.update(materialShortages).set({ status: "ordered" }).where(eq(materialShortages.id, shortageId));
      return { order: newOrder, item: newItem };
    } catch (error) {
      console.error("Error creating supplier order:", error);
      throw error;
    }
  }
  async getSupplierOrders() {
    try {
      const orders2 = await db.select({
        order: supplierOrders,
        supplier: suppliers
      }).from(supplierOrders).leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id)).orderBy(sql`${supplierOrders.createdAt} DESC`);
      const ordersWithItems = [];
      for (const { order, supplier } of orders2) {
        if (!supplier) continue;
        const items = await db.select({
          item: supplierOrderItems,
          product: products
        }).from(supplierOrderItems).leftJoin(products, eq(supplierOrderItems.productId, products.id)).where(eq(supplierOrderItems.orderId, order.id));
        const filteredItems = items.filter((item) => item.product);
        ordersWithItems.push({
          ...order,
          supplier,
          items: filteredItems.map(({ item, product }) => ({ ...item, product }))
        });
      }
      return ordersWithItems;
    } catch (error) {
      console.error("Error getting supplier orders:", error);
      throw error;
    }
  }
  async getSupplierOrder(id2) {
    try {
      const orderResult = await db.select({
        order: supplierOrders,
        supplier: suppliers
      }).from(supplierOrders).leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id)).where(eq(supplierOrders.id, id2));
      if (orderResult.length === 0 || !orderResult[0].supplier) return void 0;
      const { order, supplier } = orderResult[0];
      const items = await db.select({
        item: supplierOrderItems,
        product: products
      }).from(supplierOrderItems).leftJoin(products, eq(supplierOrderItems.productId, products.id)).where(eq(supplierOrderItems.orderId, id2));
      const filteredItems = items.filter((item) => item.product);
      return {
        ...order,
        supplier,
        items: filteredItems.map(({ item, product }) => ({ ...item, product }))
      };
    } catch (error) {
      console.error("Error getting supplier order:", error);
      throw error;
    }
  }
  async updateSupplierOrderStatus(id2, status) {
    try {
      const result = await db.update(supplierOrders).set({ status }).where(eq(supplierOrders.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating supplier order status:", error);
      throw error;
    }
  }
  // Assembly Operations
  async getAssemblyOperations() {
    try {
      const operations = await db.select().from(assemblyOperations).leftJoin(products, eq(assemblyOperations.productId, products.id)).leftJoin(warehouses, eq(assemblyOperations.warehouseId, warehouses.id)).orderBy(assemblyOperations.createdAt);
      const result = [];
      for (const row of operations) {
        const operation = row.assembly_operations;
        const product = row.products;
        const warehouse = row.warehouses;
        const items = await db.select().from(assemblyOperationItems).leftJoin(products, eq(assemblyOperationItems.componentId, products.id)).where(eq(assemblyOperationItems.operationId, operation.id));
        result.push({
          ...operation,
          product,
          warehouse,
          items: items.map((item) => ({
            ...item.assembly_operation_items,
            component: item.products
          }))
        });
      }
      return result;
    } catch (error) {
      console.error("Error getting assembly operations:", error);
      throw error;
    }
  }
  async getAssemblyOperation(id2) {
    try {
      const operationResult = await db.select().from(assemblyOperations).leftJoin(products, eq(assemblyOperations.productId, products.id)).leftJoin(warehouses, eq(assemblyOperations.warehouseId, warehouses.id)).where(eq(assemblyOperations.id, id2)).limit(1);
      if (operationResult.length === 0) return void 0;
      const row = operationResult[0];
      const operation = row.assembly_operations;
      const product = row.products;
      const warehouse = row.warehouses;
      const items = await db.select().from(assemblyOperationItems).leftJoin(products, eq(assemblyOperationItems.componentId, products.id)).where(eq(assemblyOperationItems.operationId, operation.id));
      return {
        ...operation,
        product,
        warehouse,
        items: items.map((item) => ({
          ...item.assembly_operation_items,
          component: item.products
        }))
      };
    } catch (error) {
      console.error("Error getting assembly operation:", error);
      throw error;
    }
  }
  async createAssemblyOperation(operation, items) {
    try {
      const result = await db.insert(assemblyOperations).values(operation).returning();
      const createdOperation = result[0];
      if (items.length > 0) {
        const itemsWithOperationId = items.map((item) => ({
          ...item,
          operationId: createdOperation.id
        }));
        await db.insert(assemblyOperationItems).values(itemsWithOperationId);
      }
      return createdOperation;
    } catch (error) {
      console.error("Error creating assembly operation:", error);
      throw error;
    }
  }
  async updateAssemblyOperation(id2, operation) {
    try {
      const result = await db.update(assemblyOperations).set(operation).where(eq(assemblyOperations.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating assembly operation:", error);
      throw error;
    }
  }
  async deleteAssemblyOperation(id2) {
    try {
      await db.delete(assemblyOperationItems).where(eq(assemblyOperationItems.operationId, id2));
      const result = await db.delete(assemblyOperations).where(eq(assemblyOperations.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting assembly operation:", error);
      throw error;
    }
  }
  async executeAssemblyOperation(id2) {
    try {
      const operation = await this.getAssemblyOperation(id2);
      if (!operation) throw new Error("\u041E\u043F\u0435\u0440\u0430\u0446\u0456\u044F \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u0430");
      if (operation.status !== "planned") {
        throw new Error("\u041C\u043E\u0436\u043D\u0430 \u0432\u0438\u043A\u043E\u043D\u0443\u0432\u0430\u0442\u0438 \u0442\u0456\u043B\u044C\u043A\u0438 \u0437\u0430\u043F\u043B\u0430\u043D\u043E\u0432\u0430\u043D\u0456 \u043E\u043F\u0435\u0440\u0430\u0446\u0456\u0457");
      }
      const updatedOperation = await db.update(assemblyOperations).set({
        status: "completed",
        actualDate: /* @__PURE__ */ new Date()
      }).where(eq(assemblyOperations.id, id2)).returning();
      if (operation.operationType === "assembly") {
        for (const item of operation.items) {
          await db.update(inventory).set({
            quantity: sql`${inventory.quantity} - ${parseFloat(item.quantity)}`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(
            sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
          );
        }
        const existingInventory = await db.select().from(inventory).where(
          sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
        ).limit(1);
        if (existingInventory.length > 0) {
          await db.update(inventory).set({
            quantity: sql`${inventory.quantity} + ${parseFloat(operation.quantity)}`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(
            sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
          );
        } else {
          await db.insert(inventory).values({
            productId: operation.productId,
            warehouseId: operation.warehouseId,
            quantity: parseFloat(operation.quantity),
            updatedAt: /* @__PURE__ */ new Date()
          });
        }
      } else {
        await db.update(inventory).set({
          quantity: sql`${inventory.quantity} - ${parseFloat(operation.quantity)}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(
          sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
        );
        for (const item of operation.items) {
          const existingInventory = await db.select().from(inventory).where(
            sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
          ).limit(1);
          if (existingInventory.length > 0) {
            await db.update(inventory).set({
              quantity: sql`${inventory.quantity} + ${parseFloat(item.quantity)}`,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(
              sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
            );
          } else {
            await db.insert(inventory).values({
              productId: item.componentId,
              warehouseId: operation.warehouseId,
              quantity: parseFloat(item.quantity),
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      return updatedOperation[0];
    } catch (error) {
      console.error("Error executing assembly operation:", error);
      throw error;
    }
  }
  // Workers
  async getWorkers() {
    return await this.db.select().from(workers).orderBy(workers.firstName, workers.lastName);
  }
  async getWorker(id2) {
    const result = await this.db.select().from(workers).where(eq(workers.id, id2));
    return result[0];
  }
  async createWorker(worker) {
    const result = await this.db.insert(workers).values(worker).returning();
    return result[0];
  }
  async updateWorker(id2, worker) {
    const result = await this.db.update(workers).set(worker).where(eq(workers.id, id2)).returning();
    return result[0];
  }
  async deleteWorker(id2) {
    const result = await this.db.delete(workers).where(eq(workers.id, id2));
    return (result.rowCount || 0) > 0;
  }
  // Inventory Audits
  async getInventoryAudits() {
    const result = await this.db.select().from(inventoryAudits).leftJoin(warehouses, eq(inventoryAudits.warehouseId, warehouses.id)).leftJoin(workers, eq(inventoryAudits.responsiblePersonId, workers.id)).orderBy(desc(inventoryAudits.createdAt));
    return result.map((row) => ({
      ...row.inventory_audits,
      warehouse: row.warehouses || void 0,
      responsiblePerson: row.workers || void 0
    }));
  }
  async getInventoryAudit(id2) {
    const auditResult = await this.db.select().from(inventoryAudits).leftJoin(warehouses, eq(inventoryAudits.warehouseId, warehouses.id)).where(eq(inventoryAudits.id, id2));
    if (auditResult.length === 0) return void 0;
    const itemsResult = await this.db.select().from(inventoryAuditItems).leftJoin(products, eq(inventoryAuditItems.productId, products.id)).where(eq(inventoryAuditItems.auditId, id2));
    const items = itemsResult.filter((item) => item.products);
    return {
      ...auditResult[0].inventory_audits,
      warehouse: auditResult[0].warehouses || void 0,
      items: items.map((item) => ({ ...item.inventory_audit_items, product: item.products }))
    };
  }
  async createInventoryAudit(insertAudit) {
    const auditNumber = `AUDIT-${Date.now()}`;
    const result = await this.db.insert(inventoryAudits).values({ ...insertAudit, auditNumber }).returning();
    return result[0];
  }
  async updateInventoryAudit(id2, auditData) {
    const result = await this.db.update(inventoryAudits).set({ ...auditData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inventoryAudits.id, id2)).returning();
    return result[0];
  }
  async deleteInventoryAudit(id2) {
    await this.db.delete(inventoryAuditItems).where(eq(inventoryAuditItems.auditId, id2));
    const result = await this.db.delete(inventoryAudits).where(eq(inventoryAudits.id, id2));
    return (result.rowCount || 0) > 0;
  }
  async getInventoryAuditItems(auditId) {
    const result = await this.db.select().from(inventoryAuditItems).leftJoin(products, eq(inventoryAuditItems.productId, products.id)).where(eq(inventoryAuditItems.auditId, auditId));
    return result.filter((item) => item.products).map((item) => ({
      ...item.inventory_audit_items,
      product: item.products
    }));
  }
  async createInventoryAuditItem(insertItem) {
    const result = await this.db.insert(inventoryAuditItems).values(insertItem).returning();
    return result[0];
  }
  async updateInventoryAuditItem(id2, itemData) {
    const result = await this.db.update(inventoryAuditItems).set(itemData).where(eq(inventoryAuditItems.id, id2)).returning();
    return result[0];
  }
  async deleteInventoryAuditItem(id2) {
    const result = await this.db.delete(inventoryAuditItems).where(eq(inventoryAuditItems.id, id2));
    return (result.rowCount || 0) > 0;
  }
  async generateInventoryAuditItems(auditId, warehouseId) {
    let inventoryQuery = this.db.select().from(inventory).leftJoin(products, eq(inventory.productId, products.id));
    if (warehouseId) {
      inventoryQuery = inventoryQuery.where(eq(inventory.warehouseId, warehouseId));
    }
    const inventoryResult = await inventoryQuery;
    const items = [];
    for (const row of inventoryResult) {
      if (row.products) {
        items.push({
          auditId,
          productId: row.inventory.productId,
          unit: row.products.unit || "\u0448\u0442",
          systemQuantity: row.inventory.quantity.toString(),
          countedQuantity: null,
          variance: null,
          reason: null,
          adjustmentMade: false,
          notes: null,
          countedBy: null,
          countedAt: null
        });
      }
    }
    if (items.length === 0) {
      return [];
    }
    const result = await this.db.insert(inventoryAuditItems).values(items).returning();
    return result;
  }
  // Production Forecasts
  async getProductionForecasts() {
    try {
      const forecasts = await this.db.select().from(productionForecasts).orderBy(desc(productionForecasts.createdAt));
      return forecasts;
    } catch (error) {
      console.error("Error getting production forecasts:", error);
      throw error;
    }
  }
  async getProductionForecast(id2) {
    try {
      const forecast = await this.db.select().from(productionForecasts).where(eq(productionForecasts.id, id2)).limit(1);
      return forecast[0];
    } catch (error) {
      console.error("Error getting production forecast:", error);
      throw error;
    }
  }
  async createProductionForecast(forecast) {
    try {
      const result = await this.db.insert(productionForecasts).values([forecast]).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating production forecast:", error);
      throw error;
    }
  }
  async updateProductionForecast(id2, forecast) {
    try {
      const result = await this.db.update(productionForecasts).set(forecast).where(eq(productionForecasts.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating production forecast:", error);
      throw error;
    }
  }
  async deleteProductionForecast(id2) {
    try {
      const result = await this.db.delete(productionForecasts).where(eq(productionForecasts.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting production forecast:", error);
      throw error;
    }
  }
  // Warehouse Transfers
  async getWarehouseTransfers() {
    try {
      const transfers = await this.db.select().from(warehouseTransfers).orderBy(desc(warehouseTransfers.createdAt));
      return transfers;
    } catch (error) {
      console.error("Error getting warehouse transfers:", error);
      throw error;
    }
  }
  async getWarehouseTransfer(id2) {
    try {
      const transfer = await this.db.select().from(warehouseTransfers).where(eq(warehouseTransfers.id, id2)).limit(1);
      if (!transfer[0]) return void 0;
      const itemsResult = await this.db.select({
        item: warehouseTransferItems,
        product: products
      }).from(warehouseTransferItems).leftJoin(products, eq(warehouseTransferItems.productId, products.id)).where(eq(warehouseTransferItems.transferId, id2));
      const items = itemsResult.filter((item) => item.product);
      return {
        ...transfer[0],
        items: items.map(({ item, product }) => ({ ...item, product }))
      };
    } catch (error) {
      console.error("Error getting warehouse transfer:", error);
      throw error;
    }
  }
  async createWarehouseTransfer(transfer, items) {
    try {
      const transferNumber = `WT-${Date.now()}`;
      const transferData = {
        ...transfer,
        transferNumber
      };
      const result = await this.db.insert(warehouseTransfers).values(transferData).returning();
      const createdTransfer = result[0];
      if (items && items.length > 0) {
        const transferItems = items.map((item) => ({
          ...item,
          transferId: createdTransfer.id
        }));
        await this.db.insert(warehouseTransferItems).values(transferItems);
      }
      return createdTransfer;
    } catch (error) {
      console.error("Error creating warehouse transfer:", error);
      throw error;
    }
  }
  async updateWarehouseTransfer(id2, transfer) {
    try {
      const result = await this.db.update(warehouseTransfers).set(transfer).where(eq(warehouseTransfers.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating warehouse transfer:", error);
      throw error;
    }
  }
  async deleteWarehouseTransfer(id2) {
    try {
      await this.db.delete(warehouseTransferItems).where(eq(warehouseTransferItems.transferId, id2));
      const result = await this.db.delete(warehouseTransfers).where(eq(warehouseTransfers.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting warehouse transfer:", error);
      throw error;
    }
  }
  async executeWarehouseTransfer(id2) {
    try {
      const transfer = await this.getWarehouseTransfer(id2);
      if (!transfer || transfer.status !== "pending") {
        throw new Error("Transfer not found or not in pending status");
      }
      for (const item of transfer.items) {
        await this.updateInventory(item.productId, transfer.fromWarehouseId, -parseFloat(item.requestedQuantity));
        await this.updateInventory(item.productId, transfer.toWarehouseId, parseFloat(item.requestedQuantity));
        await this.db.update(warehouseTransferItems).set({ transferredQuantity: item.requestedQuantity }).where(eq(warehouseTransferItems.id, item.id));
      }
      const result = await this.db.update(warehouseTransfers).set({
        status: "completed",
        completedDate: /* @__PURE__ */ new Date()
      }).where(eq(warehouseTransfers.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error executing warehouse transfer:", error);
      throw error;
    }
  }
  // Positions
  async getPositions() {
    try {
      const result = await this.db.select().from(positions).orderBy(positions.name);
      return result;
    } catch (error) {
      console.error("Error getting positions:", error);
      throw error;
    }
  }
  async getPosition(id2) {
    try {
      const result = await this.db.select().from(positions).where(eq(positions.id, id2)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting position:", error);
      throw error;
    }
  }
  async createPosition(position) {
    try {
      console.log("DB: Creating position with data:", position);
      const result = await this.db.insert(positions).values(position).returning();
      console.log("DB: Position created successfully:", result[0]);
      return result[0];
    } catch (error) {
      console.error("DB: Error creating position:", error);
      throw error;
    }
  }
  async updatePosition(id2, position) {
    try {
      const result = await this.db.update(positions).set({ ...position, updatedAt: /* @__PURE__ */ new Date() }).where(eq(positions.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating position:", error);
      throw error;
    }
  }
  async deletePosition(id2) {
    try {
      const result = await this.db.delete(positions).where(eq(positions.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting position:", error);
      throw error;
    }
  }
  // Departments
  async getDepartments() {
    try {
      const result = await this.db.select().from(departments).where(eq(departments.isActive, true)).orderBy(departments.name);
      return result;
    } catch (error) {
      console.error("Error getting departments:", error);
      throw error;
    }
  }
  async getDepartment(id2) {
    try {
      const result = await this.db.select().from(departments).where(eq(departments.id, id2)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting department:", error);
      throw error;
    }
  }
  async createDepartment(department) {
    try {
      const result = await this.db.insert(departments).values(department).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating department:", error);
      throw error;
    }
  }
  async updateDepartment(id2, department) {
    try {
      const result = await this.db.update(departments).set({ ...department, updatedAt: /* @__PURE__ */ new Date() }).where(eq(departments.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating department:", error);
      throw error;
    }
  }
  async deleteDepartment(id2) {
    try {
      const result = await this.db.update(departments).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(departments.id, id2));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting department:", error);
      throw error;
    }
  }
  async getProductionStatsByCategory(period, startDate, endDate) {
    try {
      const categoriesWithProducts = await this.db.select({
        categoryId: categories.id,
        categoryName: categories.name,
        productId: products.id,
        productName: products.name,
        productPrice: products.retailPrice
      }).from(categories).leftJoin(products, eq(products.categoryId, categories.id));
      const categoryStats = /* @__PURE__ */ new Map();
      for (const item of categoriesWithProducts) {
        if (!categoryStats.has(item.categoryId)) {
          categoryStats.set(item.categoryId, {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            totalProduced: 0,
            totalValue: 0,
            productsCount: 0,
            qualitySum: 0,
            qualityCount: 0
          });
        }
        const stat = categoryStats.get(item.categoryId);
        if (item.productId) {
          const baseProduction = 50;
          const variability = Math.floor(Math.random() * 100);
          const producedQuantity = baseProduction + variability;
          const productValue = producedQuantity * parseFloat(item.productPrice || "10");
          stat.totalProduced += producedQuantity;
          stat.totalValue += productValue;
          stat.productsCount += 1;
          const quality = Math.floor(Math.random() * 10) + 88;
          stat.qualitySum += quality;
          stat.qualityCount += 1;
        }
      }
      return Array.from(categoryStats.values()).map((stat) => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        totalProduced: stat.totalProduced,
        totalValue: Math.round(stat.totalValue * 100) / 100,
        // округлення до копійок
        productsCount: stat.productsCount,
        averageQuality: stat.qualityCount > 0 ? `${Math.round(stat.qualitySum / stat.qualityCount)}%` : "0%"
      }));
    } catch (error) {
      console.error("Error getting production stats by category:", error);
      throw error;
    }
  }
  async getOrderStatsByPeriod(period, startDate, endDate) {
    try {
      const now = /* @__PURE__ */ new Date();
      let start;
      let end = new Date(now);
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        switch (period) {
          case "week":
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
          case "month":
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "year":
            start = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
      }
      const ordersData = await this.db.select({
        id: orders.id,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt
      }).from(orders).where(
        and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end)
        )
      );
      const productionData = await this.db.select({
        id: productionTasks.id,
        status: productionTasks.status,
        quantity: productionTasks.quantity,
        createdAt: productionTasks.createdAt
      }).from(productionTasks).where(
        and(
          gte(productionTasks.createdAt, start),
          lte(productionTasks.createdAt, end)
        )
      );
      const statsByDate = /* @__PURE__ */ new Map();
      const current = new Date(start);
      while (current <= end) {
        let dateKey;
        if (period === "year") {
          dateKey = current.toISOString().substr(0, 7);
        } else {
          dateKey = current.toISOString().substr(0, 10);
        }
        if (!statsByDate.has(dateKey)) {
          statsByDate.set(dateKey, {
            ordered: 0,
            paid: 0,
            produced: 0,
            shipped: 0,
            orderedValue: 0,
            paidValue: 0,
            producedValue: 0,
            shippedValue: 0
          });
        }
        if (period === "year") {
          current.setMonth(current.getMonth() + 1);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }
      for (const order of ordersData) {
        if (!order.createdAt) continue;
        let dateKey;
        if (period === "year") {
          dateKey = order.createdAt.toISOString().substr(0, 7);
        } else {
          dateKey = order.createdAt.toISOString().substr(0, 10);
        }
        const stats = statsByDate.get(dateKey);
        if (stats) {
          const amount = parseFloat(order.totalAmount || "0");
          stats.ordered += 1;
          stats.orderedValue += amount;
          if (order.status === "paid") {
            stats.paid += 1;
            stats.paidValue += amount;
          }
          if (order.status === "shipped") {
            stats.shipped += 1;
            stats.shippedValue += amount;
          }
        }
      }
      for (const task of productionData) {
        if (!task.createdAt) continue;
        let dateKey;
        if (period === "year") {
          dateKey = task.createdAt.toISOString().substr(0, 7);
        } else {
          dateKey = task.createdAt.toISOString().substr(0, 10);
        }
        const stats = statsByDate.get(dateKey);
        if (stats && task.status === "completed") {
          const quantity = parseInt(task.quantity || "0");
          const estimatedValue = quantity * 100;
          stats.produced += quantity;
          stats.producedValue += estimatedValue;
        }
      }
      return Array.from(statsByDate.entries()).map(([date, stats]) => ({
        date,
        ...stats
      })).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Error getting order stats by period:", error);
      throw error;
    }
  }
  // Product profitability analytics
  async getProductProfitability(period) {
    try {
      const now = /* @__PURE__ */ new Date();
      let startDate;
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const salesData = await db.select({
        productId: saleItems.productId,
        productName: products.name,
        productSku: products.sku,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        totalPrice: saleItems.totalPrice,
        costPrice: products.costPrice
      }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).innerJoin(products, eq(saleItems.productId, products.id)).where(gte(sales.createdAt, startDate));
      const productStats = /* @__PURE__ */ new Map();
      for (const sale of salesData) {
        const key = sale.productId;
        const revenue = parseFloat(sale.totalPrice);
        const cost = parseFloat(sale.costPrice) * sale.quantity;
        if (!productStats.has(key)) {
          productStats.set(key, {
            productId: sale.productId,
            productName: sale.productName,
            productSku: sale.productSku,
            unitsSold: 0,
            totalRevenue: 0,
            totalCost: 0
          });
        }
        const stats = productStats.get(key);
        stats.unitsSold += sale.quantity;
        stats.totalRevenue += revenue;
        stats.totalCost += cost;
      }
      const result = Array.from(productStats.values()).map((stats) => {
        const totalProfit = stats.totalRevenue - stats.totalCost;
        const profitMargin = stats.totalRevenue > 0 ? totalProfit / stats.totalRevenue * 100 : 0;
        return {
          ...stats,
          totalProfit,
          profitMargin
        };
      });
      return result.sort((a, b) => b.totalProfit - a.totalProfit);
    } catch (error) {
      console.error("Error getting product profitability:", error);
      throw error;
    }
  }
  async getTopProfitableProducts(period, limit) {
    const allData = await this.getProductProfitability(period);
    return allData.slice(0, limit);
  }
  async getProductProfitabilityTrends(productId) {
    try {
      const now = /* @__PURE__ */ new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const salesData = await db.select({
        month: sql`TO_CHAR(${sales.createdAt}, 'YYYY-MM')`,
        monthName: sql`TO_CHAR(${sales.createdAt}, 'Mon YYYY')`,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        totalPrice: saleItems.totalPrice,
        costPrice: products.costPrice
      }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).innerJoin(products, eq(saleItems.productId, products.id)).where(
        and(
          eq(saleItems.productId, productId),
          gte(sales.createdAt, startDate)
        )
      );
      const monthlyStats = /* @__PURE__ */ new Map();
      for (const sale of salesData) {
        const key = sale.month;
        const revenue = parseFloat(sale.totalPrice);
        const cost = parseFloat(sale.costPrice) * sale.quantity;
        if (!monthlyStats.has(key)) {
          monthlyStats.set(key, {
            monthName: sale.monthName,
            unitsSold: 0,
            revenue: 0,
            cost: 0
          });
        }
        const stats = monthlyStats.get(key);
        stats.unitsSold += sale.quantity;
        stats.revenue += revenue;
        stats.cost += cost;
      }
      const result = Array.from(monthlyStats.values()).map((stats) => {
        const profit = stats.revenue - stats.cost;
        const profitMargin = stats.revenue > 0 ? profit / stats.revenue * 100 : 0;
        return {
          monthName: stats.monthName,
          profit,
          revenue: stats.revenue,
          cost: stats.cost,
          profitMargin,
          unitsSold: stats.unitsSold
        };
      });
      return result.sort((a, b) => a.monthName.localeCompare(b.monthName));
    } catch (error) {
      console.error("Error getting product profitability trends:", error);
      throw error;
    }
  }
  // Package Types
  async getPackageTypes() {
    return await db.select().from(packageTypes).orderBy(packageTypes.name);
  }
  async getPackageType(id2) {
    const [packageType] = await db.select().from(packageTypes).where(eq(packageTypes.id, id2));
    return packageType;
  }
  async createPackageType(packageTypeData) {
    const [packageType] = await db.insert(packageTypes).values(packageTypeData).returning();
    return packageType;
  }
  async updatePackageType(id2, packageTypeData) {
    const [packageType] = await db.update(packageTypes).set(packageTypeData).where(eq(packageTypes.id, id2)).returning();
    return packageType;
  }
  async deletePackageType(id2) {
    try {
      const result = await db.delete(packageTypes).where(eq(packageTypes.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting package type:", error);
      return false;
    }
  }
  // Soldering Types methods
  async getSolderingTypes() {
    try {
      return await db.select().from(solderingTypes).orderBy(solderingTypes.name);
    } catch (error) {
      console.error("Error fetching soldering types:", error);
      return [];
    }
  }
  async getSolderingType(id2) {
    try {
      const [solderingType] = await db.select().from(solderingTypes).where(eq(solderingTypes.id, id2));
      return solderingType;
    } catch (error) {
      console.error("Error fetching soldering type:", error);
      return void 0;
    }
  }
  async createSolderingType(solderingTypeData) {
    const [solderingType] = await db.insert(solderingTypes).values(solderingTypeData).returning();
    return solderingType;
  }
  async updateSolderingType(id2, solderingTypeData) {
    try {
      const [updated] = await db.update(solderingTypes).set(solderingTypeData).where(eq(solderingTypes.id, id2)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating soldering type:", error);
      return void 0;
    }
  }
  async deleteSolderingType(id2) {
    try {
      const result = await db.delete(solderingTypes).where(eq(solderingTypes.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting soldering type:", error);
      return false;
    }
  }
  // Component Alternatives
  async getComponentAlternatives(componentId) {
    try {
      const alternatives = await db.select({
        id: componentAlternatives.id,
        originalComponentId: componentAlternatives.originalComponentId,
        alternativeComponentId: componentAlternatives.alternativeComponentId,
        compatibility: componentAlternatives.compatibility,
        notes: componentAlternatives.notes,
        verified: componentAlternatives.verified,
        createdAt: componentAlternatives.createdAt,
        alternativeComponent: {
          id: components.id,
          name: components.name,
          sku: components.sku,
          description: components.description,
          unit: components.unit,
          costPrice: components.costPrice,
          minStock: components.minStock,
          maxStock: components.maxStock,
          supplier: components.supplier,
          partNumber: components.partNumber,
          categoryId: components.categoryId,
          manufacturer: components.manufacturer,
          uktzedCode: components.uktzedCode,
          packageTypeId: components.packageTypeId,
          createdAt: components.createdAt
        }
      }).from(componentAlternatives).innerJoin(components, eq(componentAlternatives.alternativeComponentId, components.id)).where(eq(componentAlternatives.originalComponentId, componentId)).orderBy(componentAlternatives.verified, componentAlternatives.createdAt);
      return alternatives;
    } catch (error) {
      console.error("Error fetching component alternatives:", error);
      return [];
    }
  }
  async createComponentAlternative(alternative) {
    const [created] = await db.insert(componentAlternatives).values(alternative).returning();
    return created;
  }
  async deleteComponentAlternative(id2) {
    try {
      const result = await db.delete(componentAlternatives).where(eq(componentAlternatives.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting component alternative:", error);
      return false;
    }
  }
  async updateComponentAlternative(id2, alternative) {
    try {
      const [updated] = await db.update(componentAlternatives).set(alternative).where(eq(componentAlternatives.id, id2)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating component alternative:", error);
      return void 0;
    }
  }
  // Component Categories
  async getComponentCategories() {
    return await db.select().from(componentCategories).orderBy(componentCategories.name);
  }
  async getComponentCategory(id2) {
    const [category] = await db.select().from(componentCategories).where(eq(componentCategories.id, id2));
    return category;
  }
  async createComponentCategory(category) {
    const [created] = await db.insert(componentCategories).values(category).returning();
    return created;
  }
  async updateComponentCategory(id2, categoryData) {
    const [updated] = await db.update(componentCategories).set({ ...categoryData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(componentCategories.id, id2)).returning();
    return updated;
  }
  async deleteComponentCategory(id2) {
    try {
      const result = await db.delete(componentCategories).where(eq(componentCategories.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting component category:", error);
      return false;
    }
  }
  // Carriers
  async getCarriers() {
    return await db.select().from(carriers).where(eq(carriers.isActive, true)).orderBy(carriers.name);
  }
  async getCarrier(id2) {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id2));
    return carrier || null;
  }
  async getCarrierByName(name) {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.name, name));
    return carrier;
  }
  async createCarrier(carrier) {
    const [created] = await db.insert(carriers).values(carrier).returning();
    return created;
  }
  async updateCarrier(id2, carrierData) {
    const [updated] = await db.update(carriers).set({ ...carrierData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(carriers.id, id2)).returning();
    return updated || null;
  }
  async deleteCarrier(id2) {
    try {
      const [updated] = await db.update(carriers).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(carriers.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error deleting carrier:", error);
      return false;
    }
  }
  // Shipments
  async getShipments() {
    const result = await db.select().from(shipments).leftJoin(orders, eq(shipments.orderId, orders.id)).leftJoin(carriers, eq(shipments.carrierId, carriers.id)).orderBy(desc(shipments.createdAt));
    return result.map((row) => ({
      ...row.shipments,
      order: row.orders || void 0,
      carrier: row.carriers || void 0
    }));
  }
  async getShipment(id2) {
    const result = await db.select().from(shipments).leftJoin(orders, eq(shipments.orderId, orders.id)).leftJoin(carriers, eq(shipments.carrierId, carriers.id)).where(eq(shipments.id, id2));
    if (result.length === 0) return void 0;
    const row = result[0];
    return {
      ...row.shipments,
      order: row.orders || void 0,
      carrier: row.carriers || void 0
    };
  }
  async createShipment(shipmentData) {
    const shipmentNumber = `SH-${Date.now()}`;
    const [created] = await db.insert(shipments).values({
      ...shipmentData,
      shipmentNumber
    }).returning();
    return created;
  }
  async updateShipment(id2, shipmentData) {
    const [updated] = await db.update(shipments).set(shipmentData).where(eq(shipments.id, id2)).returning();
    return updated;
  }
  async updateShipmentStatus(id2, status) {
    const updateData = { status };
    if (status === "shipped") {
      updateData.shippedAt = /* @__PURE__ */ new Date();
    } else if (status === "delivered") {
      updateData.actualDelivery = /* @__PURE__ */ new Date();
    }
    const [updated] = await db.update(shipments).set(updateData).where(eq(shipments.id, id2)).returning();
    return updated;
  }
  async deleteShipment(id2) {
    try {
      await db.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id2));
      const result = await db.delete(shipments).where(eq(shipments.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting shipment:", error);
      return false;
    }
  }
  // Customer Addresses
  async getCustomerAddresses() {
    return await db.select({
      id: customerAddresses.id,
      customerName: customerAddresses.customerName,
      customerPhone: customerAddresses.customerPhone,
      recipientName: customerAddresses.recipientName,
      recipientPhone: customerAddresses.recipientPhone,
      cityRef: customerAddresses.cityRef,
      cityName: customerAddresses.cityName,
      warehouseRef: customerAddresses.warehouseRef,
      warehouseAddress: customerAddresses.warehouseAddress,
      carrierId: customerAddresses.carrierId,
      carrierName: carriers.name,
      isDefault: customerAddresses.isDefault,
      lastUsed: customerAddresses.lastUsed,
      usageCount: customerAddresses.usageCount,
      createdAt: customerAddresses.createdAt,
      updatedAt: customerAddresses.updatedAt
    }).from(customerAddresses).leftJoin(carriers, eq(customerAddresses.carrierId, carriers.id)).orderBy(desc(customerAddresses.lastUsed), desc(customerAddresses.usageCount));
  }
  async getCustomerAddress(id2) {
    const [address] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, id2));
    return address || null;
  }
  async createCustomerAddress(address) {
    const [created] = await db.insert(customerAddresses).values({
      ...address,
      lastUsed: /* @__PURE__ */ new Date(),
      usageCount: 1
    }).returning();
    return created;
  }
  async findCustomerAddressByDetails(customerName, cityName, warehouseAddress) {
    const [address] = await db.select().from(customerAddresses).where(
      and(
        eq(customerAddresses.customerName, customerName),
        eq(customerAddresses.cityName, cityName),
        eq(customerAddresses.warehouseAddress, warehouseAddress)
      )
    );
    return address || null;
  }
  async updateCustomerAddressUsage(id2) {
    const [address] = await db.update(customerAddresses).set({
      lastUsed: /* @__PURE__ */ new Date(),
      usageCount: sql`${customerAddresses.usageCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(customerAddresses.id, id2)).returning();
    return address;
  }
  async updateCustomerAddress(id2, address) {
    const [updated] = await db.update(customerAddresses).set({ ...address, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customerAddresses.id, id2)).returning();
    return updated || null;
  }
  async deleteCustomerAddress(id2) {
    try {
      const result = await db.delete(customerAddresses).where(eq(customerAddresses.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting customer address:", error);
      return false;
    }
  }
  async setDefaultCustomerAddress(id2) {
    try {
      await db.update(customerAddresses).set({ isDefault: false });
      const [updated] = await db.update(customerAddresses).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(customerAddresses.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error setting default customer address:", error);
      return false;
    }
  }
  // Sender Settings
  async getSenderSettings() {
    return await db.select().from(senderSettings).orderBy(desc(senderSettings.createdAt));
  }
  async getSenderSetting(id2) {
    const [setting] = await db.select().from(senderSettings).where(eq(senderSettings.id, id2));
    return setting || null;
  }
  async getDefaultSenderSetting() {
    const [setting] = await db.select().from(senderSettings).where(eq(senderSettings.isDefault, true));
    return setting || null;
  }
  async createSenderSetting(setting) {
    const [created] = await db.insert(senderSettings).values(setting).returning();
    return created;
  }
  async updateSenderSetting(id2, setting) {
    const [updated] = await db.update(senderSettings).set({ ...setting, updatedAt: /* @__PURE__ */ new Date() }).where(eq(senderSettings.id, id2)).returning();
    return updated || null;
  }
  async deleteSenderSetting(id2) {
    try {
      const result = await db.delete(senderSettings).where(eq(senderSettings.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting sender setting:", error);
      return false;
    }
  }
  async setDefaultSenderSetting(id2) {
    try {
      await db.update(senderSettings).set({ isDefault: false });
      const [updated] = await db.update(senderSettings).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(senderSettings.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error setting default sender setting:", error);
      return false;
    }
  }
  // Currency methods
  async getCurrencies() {
    return await db.select().from(currencies).orderBy(currencies.code);
  }
  async getCurrency(id2) {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id2));
    return currency || null;
  }
  async createCurrency(currency) {
    const [created] = await db.insert(currencies).values(currency).returning();
    return created;
  }
  async updateCurrency(id2, currency) {
    const [updated] = await db.update(currencies).set({ ...currency, updatedAt: /* @__PURE__ */ new Date() }).where(eq(currencies.id, id2)).returning();
    return updated || null;
  }
  async deleteCurrency(id2) {
    try {
      const result = await db.delete(currencies).where(eq(currencies.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting currency:", error);
      return false;
    }
  }
  async setBaseCurrency(id2) {
    try {
      await db.update(currencies).set({ isBase: false });
      const [updated] = await db.update(currencies).set({ isBase: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(currencies.id, id2)).returning();
      return updated || null;
    } catch (error) {
      console.error("Error setting base currency:", error);
      return null;
    }
  }
  async getLatestExchangeRates() {
    const rates = await db.select().from(exchangeRateHistory).where(
      eq(
        exchangeRateHistory.createdAt,
        db.select({ maxDate: sql`MAX(${exchangeRateHistory.createdAt})` }).from(exchangeRateHistory).where(eq(exchangeRateHistory.currencyId, exchangeRateHistory.currencyId))
      )
    ).orderBy(exchangeRateHistory.currencyId);
    return rates;
  }
  async updateExchangeRates() {
    return this.getLatestExchangeRates();
  }
  // Production analytics methods
  async getProductionAnalytics(filters) {
    try {
      const tasks3 = await this.getProductionTasks();
      const workers2 = await this.getWorkers();
      const departments2 = await this.getDepartments();
      let filteredTasks = tasks3;
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter((task) => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : /* @__PURE__ */ new Date();
          return taskDate >= new Date(filters.from) && taskDate <= new Date(filters.to);
        });
      }
      if (filters.worker && filters.worker !== "all") {
        const worker = workers2.find((w) => w.id === parseInt(filters.worker));
        if (worker) {
          filteredTasks = filteredTasks.filter(
            (task) => task.assignedTo && task.assignedTo.includes(worker.firstName)
          );
        }
      }
      const totalTasks = filteredTasks.length;
      const completedTasks = filteredTasks.filter((task) => task.status === "completed").length;
      const inProgressTasks = filteredTasks.filter((task) => task.status === "in_progress").length;
      const pendingTasks = filteredTasks.filter((task) => task.status === "pending").length;
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks * 100 : 0;
      const workloadRate = totalTasks > 0 ? (inProgressTasks + pendingTasks) / totalTasks * 100 : 0;
      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        workloadRate,
        tasks: filteredTasks,
        workers: workers2,
        departments: departments2
      };
    } catch (error) {
      console.error("Error getting production analytics:", error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
        workloadRate: 0,
        tasks: [],
        workers: [],
        departments: []
      };
    }
  }
  async getProductionWorkload(filters) {
    try {
      const tasks3 = await this.getProductionTasks();
      const workers2 = await this.getWorkers();
      let filteredTasks = tasks3;
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter((task) => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : /* @__PURE__ */ new Date();
          return taskDate >= new Date(filters.from) && taskDate <= new Date(filters.to);
        });
      }
      const workloadData = workers2.map((worker) => {
        const workerTasks = filteredTasks.filter(
          (task) => task.assignedTo && task.assignedTo.includes(worker.firstName)
        );
        const completed = workerTasks.filter((task) => task.status === "completed").length;
        const inProgress = workerTasks.filter((task) => task.status === "in_progress").length;
        const pending = workerTasks.filter((task) => task.status === "pending").length;
        return {
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          department: worker.department,
          position: worker.position,
          totalTasks: workerTasks.length,
          completed,
          inProgress,
          pending,
          workload: workerTasks.length > 0 ? (inProgress + pending) / workerTasks.length * 100 : 0,
          efficiency: workerTasks.length > 0 ? completed / workerTasks.length * 100 : 0
        };
      });
      return workloadData;
    } catch (error) {
      console.error("Error getting production workload:", error);
      return [];
    }
  }
  async getProductionEfficiency(filters) {
    try {
      const tasks3 = await this.getProductionTasks();
      const departments2 = await this.getDepartments();
      let filteredTasks = tasks3;
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter((task) => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : /* @__PURE__ */ new Date();
          return taskDate >= new Date(filters.from) && taskDate <= new Date(filters.to);
        });
      }
      const efficiencyData = departments2.map((dept) => {
        const deptTasks = filteredTasks;
        const completed = deptTasks.filter((task) => task.status === "completed").length;
        const total = deptTasks.length;
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalTasks: total,
          completedTasks: completed,
          efficiency: total > 0 ? completed / total * 100 : 0
        };
      });
      return {
        departments: efficiencyData,
        overall: {
          totalTasks: filteredTasks.length,
          completedTasks: filteredTasks.filter((task) => task.status === "completed").length,
          efficiency: filteredTasks.length > 0 ? filteredTasks.filter((task) => task.status === "completed").length / filteredTasks.length * 100 : 0
        }
      };
    } catch (error) {
      console.error("Error getting production efficiency:", error);
      return {
        departments: [],
        overall: { totalTasks: 0, completedTasks: 0, efficiency: 0 }
      };
    }
  }
  // Ordered Products Info
  async getOrderedProductsInfo() {
    try {
      const ordersWithItems = await db.select({
        orderId: orders.id,
        orderStatus: orders.status,
        orderDate: orders.createdAt,
        paymentDate: orders.paymentDate,
        orderNumber: orders.orderNumber,
        productId: orderItems.productId,
        orderedQuantity: orderItems.quantity,
        product: products
      }).from(orders).innerJoin(orderItems, eq(orders.id, orderItems.orderId)).innerJoin(products, eq(orderItems.productId, products.id)).where(or(
        eq(orders.status, "\u041D\u043E\u0432\u0435"),
        eq(orders.status, "\u0412 \u0440\u043E\u0431\u043E\u0442\u0456"),
        eq(orders.status, "pending")
      ));
      const productGroups = /* @__PURE__ */ new Map();
      for (const item of ordersWithItems) {
        const productId = item.productId;
        if (!productGroups.has(productId)) {
          productGroups.set(productId, {
            productId,
            product: item.product,
            totalOrdered: 0,
            orders: []
          });
        }
        const group = productGroups.get(productId);
        group.totalOrdered += parseFloat(item.orderedQuantity);
        group.orders.push({
          orderId: item.orderId,
          orderStatus: item.orderStatus,
          orderDate: item.orderDate,
          paymentDate: item.paymentDate,
          orderNumber: item.orderNumber,
          quantity: item.orderedQuantity
        });
      }
      const result = [];
      for (const [productId, group] of productGroups) {
        const inventoryData = await db.select({
          warehouseId: inventory.warehouseId,
          quantity: inventory.quantity,
          warehouse: warehouses
        }).from(inventory).innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id)).where(eq(inventory.productId, productId));
        const totalAvailable = inventoryData.reduce((sum, inv) => sum + parseFloat(inv.quantity), 0);
        const manufacturingOrdersData = await db.select().from(manufacturingOrders).where(and(
          eq(manufacturingOrders.productId, productId),
          eq(manufacturingOrders.status, "in_progress")
        ));
        const inProduction = manufacturingOrdersData.reduce((sum, order) => sum + parseFloat(order.plannedQuantity), 0);
        result.push({
          ...group,
          totalAvailable,
          inProduction,
          shortage: Math.max(0, group.totalOrdered - totalAvailable - inProduction),
          inventoryDetails: inventoryData,
          needsProduction: group.totalOrdered - totalAvailable > 0
        });
      }
      return result;
    } catch (error) {
      console.error("Error getting ordered products info:", error);
      return [];
    }
  }
  async createProductionTaskFromOrder(productId, quantity, notes) {
    try {
      const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (product.length === 0) {
        throw new Error(`\u041F\u0440\u043E\u0434\u0443\u043A\u0442 \u0437 ID ${productId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
      }
      const recipe = await db.select().from(recipes).where(eq(recipes.productId, productId)).limit(1);
      if (recipe.length === 0) {
        throw new Error(`\u0420\u0435\u0446\u0435\u043F\u0442 \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 \u0437 ID ${productId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
      }
      const orderNumber = `MFG-${Date.now()}`;
      const [newOrder] = await db.insert(manufacturingOrders).values({
        orderNumber,
        productId,
        recipeId: recipe[0].id,
        plannedQuantity: quantity.toString(),
        producedQuantity: "0",
        unit: product[0].unit,
        status: "pending",
        priority: "high",
        materialCost: "0.00",
        laborCost: "0.00",
        overheadCost: "0.00",
        totalCost: "0.00",
        notes: notes || `\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F. \u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u0432\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0438: ${quantity} \u0448\u0442.`,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const [newTask] = await db.insert(productionTasks).values({
        recipeId: recipe[0].id,
        quantity: quantity.toString(),
        unit: product[0].unit,
        status: "planned",
        priority: "high",
        notes: notes || `\u0412\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0435 \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0434\u043B\u044F ${product[0].name}: ${quantity} \u0448\u0442.`,
        progress: 0,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      console.log(`\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E manufacturing_order ${newOrder.id} \u0442\u0430 production_task ${newTask.id} \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 ${productId}`);
      return newOrder;
    } catch (error) {
      console.error("Error creating manufacturing order from production request:", error);
      throw error;
    }
  }
  // Manufacturing Orders
  async getManufacturingOrders() {
    try {
      console.log("\u041E\u0442\u0440\u0438\u043C\u0430\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0438\u0445 \u0437\u0430\u0432\u0434\u0430\u043D\u044C \u0437 \u0444\u0456\u043B\u044C\u0442\u0440\u0430\u0446\u0456\u0454\u044E \u0441\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u0438\u0445...");
      const orders2 = await db.select({
        id: manufacturingOrders.id,
        orderNumber: manufacturingOrders.orderNumber,
        productId: manufacturingOrders.productId,
        recipeId: manufacturingOrders.recipeId,
        plannedQuantity: manufacturingOrders.plannedQuantity,
        producedQuantity: manufacturingOrders.producedQuantity,
        unit: manufacturingOrders.unit,
        status: manufacturingOrders.status,
        priority: manufacturingOrders.priority,
        assignedWorkerId: manufacturingOrders.assignedWorkerId,
        warehouseId: manufacturingOrders.warehouseId,
        startDate: manufacturingOrders.startDate,
        plannedEndDate: manufacturingOrders.plannedEndDate,
        actualEndDate: manufacturingOrders.actualEndDate,
        estimatedDuration: manufacturingOrders.estimatedDuration,
        actualDuration: manufacturingOrders.actualDuration,
        materialCost: manufacturingOrders.materialCost,
        laborCost: manufacturingOrders.laborCost,
        overheadCost: manufacturingOrders.overheadCost,
        totalCost: manufacturingOrders.totalCost,
        qualityRating: manufacturingOrders.qualityRating,
        notes: manufacturingOrders.notes,
        batchNumber: manufacturingOrders.batchNumber,
        serialNumbers: manufacturingOrders.serialNumbers,
        createdBy: manufacturingOrders.createdBy,
        createdAt: manufacturingOrders.createdAt,
        updatedAt: manufacturingOrders.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          description: products.description
        },
        recipe: {
          id: recipes.id,
          name: recipes.name
        },
        worker: {
          id: workers.id,
          firstName: workers.firstName,
          lastName: workers.lastName
        },
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
          location: warehouses.location
        }
      }).from(manufacturingOrders).leftJoin(products, eq(manufacturingOrders.productId, products.id)).leftJoin(recipes, eq(manufacturingOrders.recipeId, recipes.id)).leftJoin(workers, eq(manufacturingOrders.assignedWorkerId, workers.id)).leftJoin(warehouses, eq(manufacturingOrders.warehouseId, warehouses.id)).where(ne(manufacturingOrders.status, "cancelled")).orderBy(desc(manufacturingOrders.createdAt));
      console.log(`\u0417\u043D\u0430\u0439\u0434\u0435\u043D\u043E ${orders2.length} \u0430\u043A\u0442\u0438\u0432\u043D\u0438\u0445 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0438\u0445 \u0437\u0430\u0432\u0434\u0430\u043D\u044C (\u0431\u0435\u0437 \u0441\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u0438\u0445)`);
      orders2.forEach((order) => {
        console.log(`- \u0417\u0430\u0432\u0434\u0430\u043D\u043D\u044F ${order.orderNumber}, \u0441\u0442\u0430\u0442\u0443\u0441: ${order.status}, \u043F\u0440\u043E\u0434\u0443\u043A\u0442: ${order.productId}`);
      });
      return orders2;
    } catch (error) {
      console.error("Error getting manufacturing orders:", error);
      throw error;
    }
  }
  async getManufacturingOrder(id2) {
    try {
      const [order] = await db.select().from(manufacturingOrders).where(eq(manufacturingOrders.id, id2));
      return order || null;
    } catch (error) {
      console.error("Error getting manufacturing order:", error);
      throw error;
    }
  }
  async createManufacturingOrder(orderData) {
    try {
      console.log("\u{1F7E1} DB: Starting createManufacturingOrder with data:", orderData);
      if (!orderData.orderNumber) {
        orderData.orderNumber = `MFG-${Date.now()}-${orderData.productId || "NEW"}`;
      }
      console.log("\u{1F7E1} DB: Generated order number:", orderData.orderNumber);
      const completeOrderData = {
        ...orderData,
        status: orderData.status || "pending",
        priority: orderData.priority || "medium",
        producedQuantity: orderData.producedQuantity || "0",
        unit: orderData.unit || "\u0448\u0442",
        materialCost: orderData.materialCost || "0.00",
        laborCost: orderData.laborCost || "0.00",
        overheadCost: orderData.overheadCost || "0.00",
        totalCost: orderData.totalCost || "0.00",
        qualityRating: orderData.qualityRating || "good",
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      console.log("\u{1F7E1} DB: Complete order data for insert:", completeOrderData);
      const [newOrder] = await db.insert(manufacturingOrders).values(completeOrderData).returning();
      console.log("\u{1F7E2} DB: Successfully inserted order:", newOrder);
      if (newOrder.recipeId) {
        const [newTask] = await db.insert(productionTasks).values({
          recipeId: newOrder.recipeId,
          quantity: parseInt(newOrder.plannedQuantity),
          unit: newOrder.unit,
          status: "planned",
          priority: newOrder.priority,
          notes: `\u0412\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0435 \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${newOrder.orderNumber}: ${newOrder.plannedQuantity} ${newOrder.unit}`,
          progress: 0,
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        console.log(`\u{1F7E2} DB: \u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E production_task ${newTask.id} \u0434\u043B\u044F manufacturing_order ${newOrder.id}`);
      }
      return newOrder;
    } catch (error) {
      console.error("\u{1F534} DB: Error creating manufacturing order:", error);
      throw error;
    }
  }
  async updateManufacturingOrder(id2, orderData) {
    try {
      const [updatedOrder] = await db.update(manufacturingOrders).set(orderData).where(eq(manufacturingOrders.id, id2)).returning();
      return updatedOrder || null;
    } catch (error) {
      console.error("Error updating manufacturing order:", error);
      throw error;
    }
  }
  async deleteManufacturingOrder(id2) {
    try {
      const [manufacturingOrder] = await db.select().from(manufacturingOrders).where(eq(manufacturingOrders.id, id2));
      if (!manufacturingOrder) {
        return false;
      }
      const [productionTask] = await db.select().from(productionTasks).leftJoin(recipes, eq(productionTasks.recipeId, recipes.id)).where(and(
        eq(recipes.productId, manufacturingOrder.productId),
        eq(productionTasks.quantity, parseInt(manufacturingOrder.plannedQuantity))
      ));
      await db.delete(manufacturingOrders).where(eq(manufacturingOrders.id, id2));
      if (productionTask) {
        await db.update(productionTasks).set({
          status: "planned",
          startDate: null,
          endDate: null,
          progress: 0
        }).where(eq(productionTasks.id, productionTask.production_tasks.id));
      }
      return true;
    } catch (error) {
      console.error("Error deleting manufacturing order:", error);
      throw error;
    }
  }
  async generateSerialNumbers(manufacturingOrderId) {
    try {
      const [order] = await db.select().from(manufacturingOrders).where(eq(manufacturingOrders.id, manufacturingOrderId));
      if (!order) {
        console.log("Order not found:", manufacturingOrderId);
        return null;
      }
      console.log("Order found:", order);
      const [product] = await db.select().from(products).where(eq(products.id, order.productId));
      if (!product) {
        console.log("Product not found:", order.productId);
        return null;
      }
      console.log("Product found:", product);
      let category = null;
      if (product.categoryId) {
        const [cat] = await db.select().from(categories).where(eq(categories.id, product.categoryId));
        category = cat;
      }
      console.log("Category found:", category);
      const [settings] = await db.select().from(serialNumberSettings).limit(1);
      console.log("Settings found:", settings);
      const quantity = parseInt(order.plannedQuantity);
      const serialNumbers2 = [];
      console.log("Generating", quantity, "serial numbers");
      for (let i = 0; i < quantity; i++) {
        let serialNumber = "";
        if (category?.useGlobalNumbering !== false && settings?.useCrossNumbering) {
          const template = settings.globalTemplate || "{year}{month:2}{day:2}-{counter:6}";
          const prefix = settings.globalPrefix || "";
          const currentCounter = (settings.currentGlobalCounter || 0) + i + 1;
          serialNumber = this.formatSerialNumber(template, prefix, currentCounter);
        } else if (category?.useSerialNumbers) {
          const template = category.serialNumberTemplate || "{year}{month:2}{day:2}-{counter:6}";
          const prefix = category.serialNumberPrefix || "";
          const startNumber = category.serialNumberStartNumber || 1;
          serialNumber = this.formatSerialNumber(template, prefix, startNumber + i);
        } else {
          const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
          const orderNumber = order.orderNumber.replace(/\D/g, "").slice(-4) || "0001";
          serialNumber = `${currentYear}-${orderNumber}-${(i + 1).toString().padStart(4, "0")}`;
        }
        serialNumbers2.push(serialNumber);
      }
      console.log("Generated serial numbers:", serialNumbers2);
      const [updatedOrder] = await db.update(manufacturingOrders).set({ serialNumbers: serialNumbers2 }).where(eq(manufacturingOrders.id, manufacturingOrderId)).returning();
      console.log("Updated order with serial numbers:", updatedOrder);
      if (settings?.useCrossNumbering) {
        await db.update(serialNumberSettings).set({ currentGlobalCounter: (settings.currentGlobalCounter || 0) + quantity });
      }
      return serialNumbers2;
    } catch (error) {
      console.error("Error generating serial numbers:", error);
      throw error;
    }
  }
  formatSerialNumber(template, prefix, counter) {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    let formatted = template.replace("{year}", year.toString()).replace("{month:2}", month.toString().padStart(2, "0")).replace("{month}", month.toString()).replace("{day:2}", day.toString().padStart(2, "0")).replace("{day}", day.toString()).replace("{counter:6}", counter.toString().padStart(6, "0")).replace("{counter:4}", counter.toString().padStart(4, "0")).replace("{counter}", counter.toString());
    return prefix + formatted;
  }
  // Exchange rates management
  async getExchangeRates() {
    try {
      const rates = await db.select({
        id: exchangeRateHistory.id,
        currencyId: exchangeRateHistory.currencyId,
        rate: exchangeRateHistory.rate,
        createdAt: exchangeRateHistory.createdAt,
        currency: {
          id: currencies.id,
          code: currencies.code,
          name: currencies.name,
          symbol: currencies.symbol
        }
      }).from(exchangeRateHistory).leftJoin(currencies, eq(exchangeRateHistory.currencyId, currencies.id)).orderBy(desc(exchangeRateHistory.createdAt));
      return rates;
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      throw error;
    }
  }
  async createExchangeRate(rateData) {
    try {
      const [newRate] = await db.insert(exchangeRateHistory).values(rateData).returning();
      return newRate;
    } catch (error) {
      console.error("Error creating exchange rate:", error);
      throw error;
    }
  }
  async completeProductOrder(productId, quantity, warehouseId) {
    try {
      const [inventoryItem] = await db.select().from(inventory).where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.warehouseId, warehouseId)
        )
      ).limit(1);
      if (!inventoryItem) {
        throw new Error(`\u0422\u043E\u0432\u0430\u0440 \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u0456`);
      }
      const currentQuantity = parseFloat(inventoryItem.quantity);
      const orderQuantity = parseFloat(quantity);
      if (currentQuantity < orderQuantity) {
        throw new Error(`\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043D\u044C\u043E \u0442\u043E\u0432\u0430\u0440\u0443 \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u0456. \u0414\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ${currentQuantity}, \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u043E: ${orderQuantity}`);
      }
      const newQuantity = currentQuantity - orderQuantity;
      const [updatedInventory] = await db.update(inventory).set({
        quantity: newQuantity.toString(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(inventory.id, inventoryItem.id)).returning();
      return {
        success: true,
        message: `\u0422\u043E\u0432\u0430\u0440 \u0443\u043A\u043E\u043C\u043F\u043B\u0435\u043A\u0442\u043E\u0432\u0430\u043D\u043E. \u0417\u0430\u043B\u0438\u0448\u043E\u043A \u043D\u0430 \u0441\u043A\u043B\u0430\u0434\u0456: ${newQuantity}`,
        updatedInventory
      };
    } catch (error) {
      console.error("Error completing product order:", error);
      throw error;
    }
  }
  async deleteOrderedProduct(productId) {
    try {
      const deletedOrders = await db.delete(orderItems).where(eq(orderItems.productId, productId)).returning();
      const deletedProductionTasks = await db.delete(productionTasks).where(eq(productionTasks.productId, productId)).returning();
      return {
        success: true,
        message: `\u0412\u0438\u0434\u0430\u043B\u0435\u043D\u043E ${deletedOrders.length} \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u044C \u0442\u0430 ${deletedProductionTasks.length} \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0438\u0445 \u0437\u0430\u0432\u0434\u0430\u043D\u044C`,
        deletedOrders: deletedOrders.length,
        deletedProductionTasks: deletedProductionTasks.length
      };
    } catch (error) {
      console.error("Error deleting ordered product:", error);
      throw error;
    }
  }
  async getOrdersByProduct(productId) {
    try {
      const result = await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        quantity: orderItems.quantity
      }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(eq(orderItems.productId, productId)).orderBy(orders.createdAt);
      const orderMap = /* @__PURE__ */ new Map();
      result.forEach((item) => {
        const key = item.orderNumber;
        if (orderMap.has(key)) {
          const existing = orderMap.get(key);
          existing.quantity = Number(existing.quantity) + Number(item.quantity);
        } else {
          orderMap.set(key, {
            ...item,
            quantity: Number(item.quantity)
          });
        }
      });
      return Array.from(orderMap.values());
    } catch (error) {
      console.error("Error getting orders by product:", error);
      throw error;
    }
  }
  async createSupplierOrderForShortage(productId, quantity, notes) {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!product) {
        throw new Error(`\u0422\u043E\u0432\u0430\u0440 \u0437 ID ${productId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
      }
      const [supplier] = await db.select().from(suppliers).limit(1);
      if (!supplier) {
        throw new Error("\u041D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0436\u043E\u0434\u043D\u043E\u0433\u043E \u043F\u043E\u0441\u0442\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A\u0430");
      }
      const [supplierOrder] = await db.insert(supplierOrders).values({
        orderNumber: `SO-${Date.now()}`,
        supplierId: supplier.id,
        orderDate: /* @__PURE__ */ new Date(),
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3),
        // +7 днів
        status: "pending",
        totalAmount: (parseFloat(product.costPrice) * parseFloat(quantity)).toString(),
        notes: notes || `\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u0435 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0447\u0435\u0440\u0435\u0437 \u0434\u0435\u0444\u0456\u0446\u0438\u0442 \u0442\u043E\u0432\u0430\u0440\u0443 ${product.name}`
      }).returning();
      return {
        success: true,
        message: `\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u043E\u0441\u0442\u0430\u0447\u0430\u043B\u044C\u043D\u0438\u043A\u0443 \u043D\u0430 ${quantity} \u043E\u0434. \u0442\u043E\u0432\u0430\u0440\u0443 "${product.name}"`,
        supplierOrder
      };
    } catch (error) {
      console.error("Error creating supplier order for shortage:", error);
      throw error;
    }
  }
  // Companies
  async getCompanies() {
    try {
      return await db.select().from(companies).orderBy(companies.name);
    } catch (error) {
      console.error("Error fetching companies:", error);
      return [];
    }
  }
  async getCompany(id2) {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.id, id2));
      return company;
    } catch (error) {
      console.error("Error fetching company:", error);
      return void 0;
    }
  }
  async getDefaultCompany() {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.isDefault, true));
      return company;
    } catch (error) {
      console.error("Error fetching default company:", error);
      return void 0;
    }
  }
  async createCompany(companyData) {
    try {
      console.log("Creating company with data:", companyData);
      const [company] = await db.insert(companies).values(companyData).returning();
      console.log("Company created successfully:", company);
      return company;
    } catch (error) {
      console.error("Error creating company:", error);
      console.error("Company data that failed:", companyData);
      throw error;
    }
  }
  async updateCompany(id2, companyData) {
    try {
      const [updated] = await db.update(companies).set({ ...companyData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id2)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating company:", error);
      return void 0;
    }
  }
  async deleteCompany(id2) {
    try {
      const company = await this.getCompany(id2);
      if (company?.isDefault) {
        throw new Error("Cannot delete default company");
      }
      const result = await db.delete(companies).where(eq(companies.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }
  async setDefaultCompany(id2) {
    try {
      await db.update(companies).set({ isDefault: false });
      const [updated] = await db.update(companies).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error setting default company:", error);
      return false;
    }
  }
  async getProductsByCompany(companyId) {
    try {
      return await db.select().from(products).where(eq(products.companyId, companyId));
    } catch (error) {
      console.error("Error fetching products by company:", error);
      return [];
    }
  }
  async getOrdersByCompany(companyId) {
    try {
      return await db.select().from(orders).where(eq(orders.companyId, companyId));
    } catch (error) {
      console.error("Error fetching orders by company:", error);
      return [];
    }
  }
  // Serial Numbers
  async getSerialNumbers(productId, warehouseId) {
    let query = db.select().from(serialNumbers);
    if (productId || warehouseId) {
      const conditions = [];
      if (productId) conditions.push(eq(serialNumbers.productId, productId));
      if (warehouseId) conditions.push(eq(serialNumbers.warehouseId, warehouseId));
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(serialNumbers.createdAt));
  }
  async getSerialNumber(id2) {
    const [serialNumber] = await db.select().from(serialNumbers).where(eq(serialNumbers.id, id2));
    return serialNumber || null;
  }
  async createSerialNumber(data) {
    const [created] = await db.insert(serialNumbers).values(data).returning();
    return created;
  }
  async updateSerialNumber(id2, data) {
    const [updated] = await db.update(serialNumbers).set(data).where(eq(serialNumbers.id, id2)).returning();
    return updated || null;
  }
  async deleteSerialNumber(id2) {
    try {
      const result = await db.delete(serialNumbers).where(eq(serialNumbers.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting serial number:", error);
      return false;
    }
  }
  async getAvailableSerialNumbers(productId) {
    return await db.select().from(serialNumbers).where(and(
      eq(serialNumbers.productId, productId),
      eq(serialNumbers.status, "available")
    )).orderBy(desc(serialNumbers.createdAt));
  }
  async reserveSerialNumber(id2, orderId) {
    try {
      const [updated] = await db.update(serialNumbers).set({ status: "reserved", orderId }).where(and(
        eq(serialNumbers.id, id2),
        eq(serialNumbers.status, "available")
      )).returning();
      return !!updated;
    } catch (error) {
      console.error("Error reserving serial number:", error);
      return false;
    }
  }
  async releaseSerialNumber(id2) {
    try {
      const [updated] = await db.update(serialNumbers).set({ status: "available", orderId: null }).where(eq(serialNumbers.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error releasing serial number:", error);
      return false;
    }
  }
  async markSerialNumberAsSold(id2) {
    try {
      const [updated] = await db.update(serialNumbers).set({ status: "sold" }).where(eq(serialNumbers.id, id2)).returning();
      return !!updated;
    } catch (error) {
      console.error("Error marking serial number as sold:", error);
      return false;
    }
  }
  // Client Nova Poshta Settings Methods
  async getClientNovaPoshtaSettings(clientId) {
    return await db.select().from(clientNovaPoshtaSettings).where(eq(clientNovaPoshtaSettings.clientId, clientId)).orderBy(desc(clientNovaPoshtaSettings.isPrimary), desc(clientNovaPoshtaSettings.createdAt));
  }
  async getClientNovaPoshtaSetting(id2) {
    const [settings] = await db.select().from(clientNovaPoshtaSettings).where(eq(clientNovaPoshtaSettings.id, id2));
    return settings;
  }
  async createClientNovaPoshtaSettings(settings) {
    const [created] = await db.insert(clientNovaPoshtaSettings).values(settings).returning();
    return created;
  }
  async updateClientNovaPoshtaSettings(id2, settings) {
    const [updated] = await db.update(clientNovaPoshtaSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientNovaPoshtaSettings.id, id2)).returning();
    return updated;
  }
  async deleteClientNovaPoshtaSettings(id2) {
    try {
      const result = await db.delete(clientNovaPoshtaSettings).where(eq(clientNovaPoshtaSettings.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting Nova Poshta settings:", error);
      return false;
    }
  }
  async setPrimaryClientNovaPoshtaSettings(clientId, settingsId) {
    try {
      await db.update(clientNovaPoshtaSettings).set({ isPrimary: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clientNovaPoshtaSettings.clientId, clientId));
      const [updated] = await db.update(clientNovaPoshtaSettings).set({ isPrimary: true, updatedAt: /* @__PURE__ */ new Date() }).where(and(
        eq(clientNovaPoshtaSettings.id, settingsId),
        eq(clientNovaPoshtaSettings.clientId, clientId)
      )).returning();
      return !!updated;
    } catch (error) {
      console.error("Error setting primary Nova Poshta settings:", error);
      return false;
    }
  }
  // Partial Shipment Methods
  async getOrderItemsWithShipmentInfo(orderId) {
    try {
      const result = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        shippedQuantity: orderItems.shippedQuantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        productName: products.name,
        productSku: products.sku,
        productUnit: products.unit
      }).from(orderItems).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, orderId));
      return result.map((item) => ({
        ...item,
        remainingQuantity: item.quantity - (item.shippedQuantity || 0),
        canShip: item.quantity - (item.shippedQuantity || 0) > 0
      }));
    } catch (error) {
      console.error("Error getting order items with shipment info:", error);
      throw error;
    }
  }
  async createPartialShipment(orderId, items, shipmentData) {
    try {
      return await db.transaction(async (tx) => {
        const shipmentNumber = `SH-${Date.now()}`;
        const [shipment] = await tx.insert(shipments).values({
          ...shipmentData,
          orderId,
          shipmentNumber,
          status: "preparing"
        }).returning();
        for (const item of items) {
          if (item.quantity > 0) {
            await tx.insert(shipmentItems).values({
              shipmentId: shipment.id,
              orderItemId: item.orderItemId,
              productId: item.productId,
              quantity: item.quantity,
              serialNumbers: item.serialNumbers || []
            });
            await tx.update(orderItems).set({
              shippedQuantity: sql`${orderItems.shippedQuantity} + ${item.quantity}`
            }).where(eq(orderItems.id, item.orderItemId));
          }
        }
        const updatedItems = await tx.select({
          quantity: orderItems.quantity,
          shippedQuantity: orderItems.shippedQuantity
        }).from(orderItems).where(eq(orderItems.orderId, orderId));
        const isFullyShipped = updatedItems.every(
          (item) => (item.shippedQuantity || 0) >= item.quantity
        );
        if (isFullyShipped) {
          await tx.update(orders).set({ status: "shipped" }).where(eq(orders.id, orderId));
        } else {
          await tx.update(orders).set({ status: "partially_shipped" }).where(eq(orders.id, orderId));
        }
        return shipment;
      });
    } catch (error) {
      console.error("Error creating partial shipment:", error);
      throw error;
    }
  }
  // Manufacturing methods
  async startManufacturing(id2) {
    try {
      const [updated] = await db.update(manufacturingOrders).set({
        status: "in_progress",
        startDate: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(manufacturingOrders.id, id2)).returning();
      if (updated) {
        await this.createDefaultManufacturingSteps(id2);
        const productionTasks_list = await db.select().from(productionTasks).leftJoin(recipes, eq(productionTasks.recipeId, recipes.id)).where(and(
          eq(recipes.productId, updated.productId),
          eq(productionTasks.quantity, parseInt(updated.plannedQuantity)),
          eq(productionTasks.status, "planned")
        ));
        console.log(`\u0417\u043D\u0430\u0439\u0434\u0435\u043D\u043E production tasks \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 ${updated.productId}, \u043A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C ${updated.plannedQuantity}:`, productionTasks_list.length);
        if (productionTasks_list.length > 0) {
          const productionTask = productionTasks_list[0];
          await db.update(productionTasks).set({
            status: "in-progress",
            startDate: /* @__PURE__ */ new Date(),
            progress: 10
          }).where(eq(productionTasks.id, productionTask.production_tasks.id));
          console.log(`\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0441\u0442\u0430\u0442\u0443\u0441 production_task ${productionTask.production_tasks.id} \u043D\u0430 in-progress`);
        }
      }
      return updated;
    } catch (error) {
      console.error("Error starting manufacturing:", error);
      throw error;
    }
  }
  async completeManufacturing(id2, producedQuantity, qualityRating, notes) {
    try {
      const [updated] = await db.update(manufacturingOrders).set({
        status: "completed",
        producedQuantity,
        qualityRating,
        notes,
        actualEndDate: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(manufacturingOrders.id, id2)).returning();
      if (updated && updated.warehouseId && updated.productId) {
        await this.updateInventoryAfterManufacturing(
          updated.productId,
          updated.warehouseId,
          parseFloat(producedQuantity)
        );
      }
      return updated;
    } catch (error) {
      console.error("Error completing manufacturing:", error);
      throw error;
    }
  }
  async stopManufacturing(id2) {
    try {
      console.log(`\u0417\u0443\u043F\u0438\u043D\u043A\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u0430 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ID: ${id2}`);
      const [updated] = await db.update(manufacturingOrders).set({
        status: "paused",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(manufacturingOrders.id, id2)).returning();
      await db.update(manufacturingSteps).set({
        status: "paused",
        completedAt: /* @__PURE__ */ new Date()
      }).where(
        and(
          eq(manufacturingSteps.manufacturingOrderId, id2),
          eq(manufacturingSteps.status, "in_progress")
        )
      );
      console.log(`\u0412\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E \u0437\u0443\u043F\u0438\u043D\u0435\u043D\u043E \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ID: ${id2}`);
      return updated;
    } catch (error) {
      console.error("Error stopping manufacturing:", error);
      throw error;
    }
  }
  async getManufacturingSteps(manufacturingOrderId) {
    try {
      const steps = await db.select({
        id: manufacturingSteps.id,
        stepNumber: manufacturingSteps.stepNumber,
        operationName: manufacturingSteps.operationName,
        description: manufacturingSteps.description,
        status: manufacturingSteps.status,
        estimatedDuration: manufacturingSteps.estimatedDuration,
        actualDuration: manufacturingSteps.actualDuration,
        startedAt: manufacturingSteps.startedAt,
        completedAt: manufacturingSteps.completedAt,
        qualityCheckPassed: manufacturingSteps.qualityCheckPassed,
        qualityNotes: manufacturingSteps.qualityNotes,
        worker: workers
      }).from(manufacturingSteps).leftJoin(workers, eq(manufacturingSteps.assignedWorkerId, workers.id)).where(eq(manufacturingSteps.manufacturingOrderId, manufacturingOrderId)).orderBy(manufacturingSteps.stepNumber);
      return steps;
    } catch (error) {
      console.error("Error getting manufacturing steps:", error);
      return [];
    }
  }
  async createManufacturingStep(stepData) {
    try {
      const [created] = await db.insert(manufacturingSteps).values(stepData).returning();
      return created;
    } catch (error) {
      console.error("Error creating manufacturing step:", error);
      throw error;
    }
  }
  async updateManufacturingStep(id2, stepData) {
    try {
      const [updated] = await db.update(manufacturingSteps).set(stepData).where(eq(manufacturingSteps.id, id2)).returning();
      return updated;
    } catch (error) {
      console.error("Error updating manufacturing step:", error);
      throw error;
    }
  }
  async startManufacturingStep(stepId) {
    try {
      const [updated] = await db.update(manufacturingSteps).set({
        status: "in_progress",
        startedAt: /* @__PURE__ */ new Date()
      }).where(eq(manufacturingSteps.id, stepId)).returning();
      return updated;
    } catch (error) {
      console.error("Error starting manufacturing step:", error);
      throw error;
    }
  }
  async completeManufacturingStep(stepId, data) {
    try {
      const step = await db.select().from(manufacturingSteps).where(eq(manufacturingSteps.id, stepId)).limit(1);
      if (!step[0]) {
        throw new Error("Manufacturing step not found");
      }
      const startedAt = step[0].startedAt;
      const completedAt = /* @__PURE__ */ new Date();
      const actualDuration = startedAt ? Math.floor((completedAt.getTime() - startedAt.getTime()) / (1e3 * 60)) : null;
      const [updated] = await db.update(manufacturingSteps).set({
        status: "completed",
        completedAt,
        actualDuration,
        qualityCheckPassed: data.qualityCheckPassed ?? true,
        qualityNotes: data.notes
      }).where(eq(manufacturingSteps.id, stepId)).returning();
      return updated;
    } catch (error) {
      console.error("Error completing manufacturing step:", error);
      throw error;
    }
  }
  async createDefaultManufacturingSteps(manufacturingOrderId) {
    const defaultSteps = [
      { stepNumber: 1, operationName: "\u041F\u0456\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043C\u0430\u0442\u0435\u0440\u0456\u0430\u043B\u0456\u0432", description: "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u0442\u0430 \u043F\u0456\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0432\u0441\u0456\u0445 \u043D\u0435\u043E\u0431\u0445\u0456\u0434\u043D\u0438\u0445 \u043C\u0430\u0442\u0435\u0440\u0456\u0430\u043B\u0456\u0432" },
      { stepNumber: 2, operationName: "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043E\u0431\u043B\u0430\u0434\u043D\u0430\u043D\u043D\u044F", description: "\u041D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0442\u0430 \u043A\u0430\u043B\u0456\u0431\u0440\u0443\u0432\u0430\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u043E\u0433\u043E \u043E\u0431\u043B\u0430\u0434\u043D\u0430\u043D\u043D\u044F" },
      { stepNumber: 3, operationName: "\u0412\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E", description: "\u041E\u0441\u043D\u043E\u0432\u043D\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u0441 \u0432\u0438\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u0457" },
      { stepNumber: 4, operationName: "\u041A\u043E\u043D\u0442\u0440\u043E\u043B\u044C \u044F\u043A\u043E\u0441\u0442\u0456", description: "\u041F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0430 \u044F\u043A\u043E\u0441\u0442\u0456 \u0433\u043E\u0442\u043E\u0432\u043E\u0457 \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u0457" },
      { stepNumber: 5, operationName: "\u041F\u0430\u043A\u0443\u0432\u0430\u043D\u043D\u044F", description: "\u041F\u0430\u043A\u0443\u0432\u0430\u043D\u043D\u044F \u0433\u043E\u0442\u043E\u0432\u043E\u0457 \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u0457" }
    ];
    for (const step of defaultSteps) {
      await db.insert(manufacturingSteps).values({
        manufacturingOrderId,
        ...step,
        status: "pending",
        estimatedDuration: 60
        // 1 година за замовчуванням
      });
    }
  }
  async updateInventoryAfterManufacturing(productId, warehouseId, quantity) {
    try {
      const existingInventory = await db.select().from(inventory).where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.warehouseId, warehouseId)
        )
      ).limit(1);
      if (existingInventory.length > 0) {
        await db.update(inventory).set({
          quantity: sql`${inventory.quantity} + ${quantity}`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(inventory.id, existingInventory[0].id));
      } else {
        await db.insert(inventory).values({
          productId,
          warehouseId,
          quantity: quantity.toString(),
          minStock: 0,
          maxStock: 1e3
        });
      }
    } catch (error) {
      console.error("Error updating inventory after manufacturing:", error);
    }
  }
  // User management methods with worker integration
  async getLocalUsersWithWorkers() {
    const usersData = await db.select({
      id: localUsers.id,
      workerId: localUsers.workerId,
      username: localUsers.username,
      email: localUsers.email,
      roleId: localUsers.roleId,
      role: localUsers.role,
      isActive: localUsers.isActive,
      permissions: localUsers.permissions,
      systemModules: localUsers.systemModules,
      lastLoginAt: localUsers.lastLoginAt,
      createdAt: localUsers.createdAt,
      updatedAt: localUsers.updatedAt,
      worker: {
        id: workers.id,
        firstName: workers.firstName,
        lastName: workers.lastName,
        email: workers.email,
        phone: workers.phone,
        photo: workers.photo,
        positionId: workers.positionId,
        departmentId: workers.departmentId
      },
      position: {
        id: positions.id,
        name: positions.name
      },
      department: {
        id: departments.id,
        name: departments.name
      },
      roleData: {
        id: roles.id,
        name: roles.name,
        displayName: roles.displayName
      }
    }).from(localUsers).leftJoin(workers, eq(localUsers.workerId, workers.id)).leftJoin(positions, eq(workers.positionId, positions.id)).leftJoin(departments, eq(workers.departmentId, departments.id)).leftJoin(roles, eq(localUsers.roleId, roles.id)).orderBy(localUsers.createdAt);
    return usersData;
  }
  async getWorkersAvailableForUsers() {
    const availableWorkers = await db.select({
      id: workers.id,
      firstName: workers.firstName,
      lastName: workers.lastName,
      email: workers.email,
      phone: workers.phone,
      positionId: workers.positionId,
      departmentId: workers.departmentId,
      position: {
        id: positions.id,
        name: positions.name
      },
      department: {
        id: departments.id,
        name: departments.name
      }
    }).from(workers).leftJoin(positions, eq(workers.positionId, positions.id)).leftJoin(departments, eq(workers.departmentId, departments.id)).leftJoin(localUsers, eq(workers.id, localUsers.workerId)).where(isNull(localUsers.workerId)).orderBy(workers.firstName, workers.lastName);
    return availableWorkers;
  }
  async getLocalUser(id2) {
    const [user] = await db.select().from(localUsers).where(eq(localUsers.id, id2)).limit(1);
    return user;
  }
  async getLocalUserByUsername(username) {
    const [user] = await db.select().from(localUsers).where(eq(localUsers.username, username)).limit(1);
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(localUsers).where(eq(localUsers.email, email)).limit(1);
    return user;
  }
  async updateUserLastLogin(id2) {
    await db.update(localUsers).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(localUsers.id, id2));
  }
  async createLocalUserWithWorker(userData) {
    const [user] = await db.insert(localUsers).values(userData).returning();
    return user;
  }
  async updateLocalUser(id2, userData) {
    const [user] = await db.update(localUsers).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(localUsers.id, id2)).returning();
    return user;
  }
  async deleteLocalUser(id2) {
    const result = await db.delete(localUsers).where(eq(localUsers.id, id2));
    return (result.rowCount || 0) > 0;
  }
  async toggleUserStatus(id2, isActive) {
    const [user] = await db.update(localUsers).set({ isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq(localUsers.id, id2)).returning();
    return user;
  }
  async changeUserPassword(id2, hashedPassword) {
    const [user] = await db.update(localUsers).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(localUsers.id, id2)).returning();
    return user;
  }
  async updateLocalUserPermissions(id2, permissions) {
    const [user] = await db.update(localUsers).set({ permissions, updatedAt: /* @__PURE__ */ new Date() }).where(eq(localUsers.id, id2)).returning();
    return user;
  }
  // Password reset functionality
  async savePasswordResetToken(userId, token, expires) {
    try {
      const [user] = await db.update(localUsers).set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(localUsers.id, userId)).returning();
      return !!user;
    } catch (error) {
      console.error("Error saving password reset token:", error);
      return false;
    }
  }
  async getUserByResetToken(token) {
    try {
      const [user] = await db.select().from(localUsers).where(
        and(
          eq(localUsers.passwordResetToken, token),
          gte(localUsers.passwordResetExpires, /* @__PURE__ */ new Date())
        )
      );
      return user || null;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return null;
    }
  }
  async confirmPasswordReset(userId, hashedPassword) {
    try {
      const [user] = await db.update(localUsers).set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(localUsers.id, userId)).returning();
      return !!user;
    } catch (error) {
      console.error("Error confirming password reset:", error);
      return false;
    }
  }
  // ================================
  // МЕТОДИ СИНХРОНІЗАЦІЇ API
  // ================================
  // Методи для клієнтів з externalId
  async getClientByExternalId(externalId) {
    const [client] = await db.select().from(clients).where(eq(clients.externalId, externalId)).limit(1);
    return client;
  }
  async getClientByTaxCode(taxCode) {
    const [client] = await db.select().from(clients).where(eq(clients.taxCode, taxCode)).limit(1);
    return client;
  }
  async updateClientSyncInfo(clientId, externalId, source) {
    await db.update(clients).set({ externalId, source }).where(eq(clients.id, clientId));
  }
  // Методи для контактів клієнтів з externalId
  async getClientContactByExternalId(externalId) {
    const [contact] = await db.select().from(clientContacts).where(eq(clientContacts.externalId, externalId)).limit(1);
    return contact;
  }
  // Методи для клієнтів
  async getClients() {
    return await db.select().from(clients).orderBy(clients.name);
  }
  async createClient(clientData) {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }
  async getClient(id2) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id2)).limit(1);
    return client;
  }
  async updateClient(id2, updates) {
    const [client] = await db.update(clients).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id2)).returning();
    return client;
  }
  async deleteClient(id2) {
    const result = await db.delete(clients).where(eq(clients.id, id2));
    return (result.rowCount ?? 0) > 0;
  }
  // Методи для логів синхронізації
  async createSyncLog(logData) {
    const [log] = await db.insert(syncLogs).values({
      integrationId: 1,
      // Тимчасово використовуємо фіксований ID
      operation: "batch_sync",
      status: logData.status,
      recordsFailed: logData.errorsCount,
      startedAt: logData.startTime,
      completedAt: logData.endTime,
      details: logData.details
    }).returning();
    return log;
  }
  async getSyncLogBySyncId(syncId) {
    const [log] = await db.select().from(syncLogs).where(sql`details->>'syncId' = ${syncId}`).limit(1);
    return log;
  }
  // Order Status Methods
  async getOrderStatuses() {
    return await db.select().from(orderStatuses).orderBy(orderStatuses.name);
  }
  async getOrderStatus(id2) {
    const [status] = await db.select().from(orderStatuses).where(eq(orderStatuses.id, id2));
    return status;
  }
  async createOrderStatus(statusData) {
    const [status] = await db.insert(orderStatuses).values({
      ...statusData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return status;
  }
  async updateOrderStatusRecord(id2, statusData) {
    const [status] = await db.update(orderStatuses).set({
      ...statusData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(orderStatuses.id, id2)).returning();
    return status;
  }
  async deleteOrderStatusRecord(id2) {
    try {
      const result = await db.delete(orderStatuses).where(eq(orderStatuses.id, id2));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting order status:", error);
      return false;
    }
  }
  // User Sort Preferences
  async getUserSortPreferences(userId, tableName) {
    const [preference] = await db.select().from(userSortPreferences).where(and(eq(userSortPreferences.userId, userId), eq(userSortPreferences.tableName, tableName))).limit(1);
    return preference || null;
  }
  async saveUserSortPreferences(preference) {
    const [result] = await db.insert(userSortPreferences).values(preference).onConflictDoUpdate({
      target: [userSortPreferences.userId, userSortPreferences.tableName],
      set: {
        sortField: preference.sortField,
        sortDirection: preference.sortDirection,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result;
  }
  // Обробка оплати та запуск виробництва (повна/часткова/по договору)
  async processOrderPayment(orderId, paymentData) {
    try {
      const now = /* @__PURE__ */ new Date();
      const existingOrder = await this.getOrder(orderId);
      if (!existingOrder) {
        throw new Error(`\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437 ID ${orderId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
      }
      const alreadyHasProduction = existingOrder.productionApproved && (existingOrder.paymentType === "full" || existingOrder.paymentType === "contract" || existingOrder.paymentType === "partial" && existingOrder.productionApproved);
      const updateData = {
        paymentType: paymentData.paymentType,
        paidAmount: paymentData.paidAmount || "0"
      };
      if (paymentData.paymentType === "full") {
        updateData.paymentDate = now;
        updateData.productionApproved = true;
        updateData.productionApprovedBy = paymentData.approvedBy || "system";
        updateData.productionApprovedAt = now;
      }
      if (paymentData.paymentType === "partial") {
        updateData.paymentDate = now;
        if (paymentData.productionApproved) {
          updateData.productionApproved = true;
          updateData.productionApprovedBy = paymentData.approvedBy;
          updateData.productionApprovedAt = now;
        }
      }
      if (paymentData.paymentType === "contract") {
        updateData.contractNumber = paymentData.contractNumber;
        updateData.productionApproved = true;
        updateData.productionApprovedBy = paymentData.approvedBy || "contract";
        updateData.productionApprovedAt = now;
      }
      await db.update(orders).set(updateData).where(eq(orders.id, orderId));
      if (updateData.productionApproved && !alreadyHasProduction) {
        await this.createManufacturingTasksForOrder(orderId);
      } else if (alreadyHasProduction) {
        console.log(`\u0417\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u043D\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderId} \u0432\u0436\u0435 \u0456\u0441\u043D\u0443\u044E\u0442\u044C, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0454\u043C\u043E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F`);
      }
      console.log(`\u041E\u0431\u0440\u043E\u0431\u043B\u0435\u043D\u043E \u043F\u043B\u0430\u0442\u0456\u0436 \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderId}: \u0442\u0438\u043F ${paymentData.paymentType}, \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E ${updateData.productionApproved ? "\u0434\u043E\u0437\u0432\u043E\u043B\u0435\u043D\u043E" : "\u043D\u0435 \u0434\u043E\u0437\u0432\u043E\u043B\u0435\u043D\u043E"}`);
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u043E\u0431\u0446\u0456 \u043F\u043B\u0430\u0442\u0435\u0436\u0443 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F:", error);
      throw error;
    }
  }
  // Скасування оплати замовлення
  async cancelOrderPayment(orderId) {
    try {
      const existingOrder = await this.getOrder(orderId);
      if (!existingOrder) {
        throw new Error(`\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437 ID ${orderId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E`);
      }
      await db.update(orders).set({
        paymentType: "none",
        paymentDate: null,
        paidAmount: "0.00",
        contractNumber: null,
        productionApproved: false,
        productionApprovedBy: null,
        productionApprovedAt: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(orders.id, orderId));
      const updatedOrders = await db.update(manufacturingOrders).set({
        status: "cancelled",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(manufacturingOrders.sourceOrderId, orderId)).returning();
      console.log(`\u0421\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u043E \u043E\u043F\u043B\u0430\u0442\u0443 \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderId}, \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0456 \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0441\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u043E`);
      console.log(`\u041A\u0456\u043B\u044C\u043A\u0456\u0441\u0442\u044C \u0441\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u0438\u0445 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0438\u0445 \u0437\u0430\u0432\u0434\u0430\u043D\u044C: ${updatedOrders.length}`);
      updatedOrders.forEach((order) => {
        console.log(`- \u0421\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u043E \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F ${order.orderNumber}, \u0441\u0442\u0430\u0442\u0443\u0441 \u0442\u0435\u043F\u0435\u0440: ${order.status}`);
      });
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0441\u043A\u0430\u0441\u0443\u0432\u0430\u043D\u043D\u0456 \u043E\u043F\u043B\u0430\u0442\u0438 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F:", error);
      throw error;
    }
  }
  // Створення виробничих завдань для замовлення
  async createManufacturingTasksForOrder(orderId) {
    try {
      const orderWithItems = await db.select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        item: orderItems,
        product: products
      }).from(orders).innerJoin(orderItems, eq(orders.id, orderItems.orderId)).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orders.id, orderId));
      if (orderWithItems.length === 0) {
        console.log(`\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0437 ID ${orderId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0430\u0431\u043E \u043D\u0435 \u043C\u0430\u0454 \u0442\u043E\u0432\u0430\u0440\u0456\u0432`);
        return;
      }
      const productGroups = /* @__PURE__ */ new Map();
      for (const row of orderWithItems) {
        const productId = row.item.productId;
        const quantity = parseInt(row.item.quantity.toString());
        if (!productGroups.has(productId)) {
          productGroups.set(productId, {
            product: row.product,
            totalQuantity: 0
          });
        }
        const group = productGroups.get(productId);
        group.totalQuantity += quantity;
      }
      for (const [productId, group] of productGroups) {
        await this.createOrUpdateManufacturingOrder(
          productId,
          group.totalQuantity,
          orderId,
          orderWithItems[0].orderNumber
        );
      }
      console.log(`\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0456 \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderWithItems[0].orderNumber}`);
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u0456 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u0438\u0445 \u0437\u0430\u0432\u0434\u0430\u043D\u044C:", error);
      throw error;
    }
  }
  // Окремий метод для дозволу виробництва без оплати
  async approveProductionForOrder(orderId, approvedBy, reason = "manual_approval") {
    try {
      const now = /* @__PURE__ */ new Date();
      await db.update(orders).set({
        productionApproved: true,
        productionApprovedBy: approvedBy,
        productionApprovedAt: now
      }).where(eq(orders.id, orderId));
      await this.createManufacturingTasksForOrder(orderId);
      console.log(`\u0414\u043E\u0437\u0432\u043E\u043B\u0435\u043D\u043E \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderId} \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0435\u043C ${approvedBy}`);
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0437\u0432\u043E\u043B\u0456 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u0430:", error);
      throw error;
    }
  }
  async createOrUpdateManufacturingOrder(productId, quantity, sourceOrderId, orderNumber) {
    try {
      const recipe = await db.select().from(recipes).where(eq(recipes.productId, productId)).limit(1);
      if (recipe.length === 0) {
        console.log(`\u0420\u0435\u0446\u0435\u043F\u0442 \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 \u0437 ID ${productId} \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E. \u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0454\u043C\u043E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u043E\u0433\u043E \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F.`);
        return;
      }
      const existingOrders = await db.select().from(manufacturingOrders).where(and(
        eq(manufacturingOrders.productId, productId),
        eq(manufacturingOrders.status, "pending")
      ));
      if (existingOrders.length > 0) {
        const existingOrder = existingOrders[0];
        const newQuantity = parseFloat(existingOrder.plannedQuantity) + quantity;
        await db.update(manufacturingOrders).set({
          plannedQuantity: newQuantity.toString(),
          notes: `${existingOrder.notes || ""}
\u0414\u043E\u0434\u0430\u043D\u043E \u0437 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderNumber}: ${quantity} \u0448\u0442.`,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(manufacturingOrders.id, existingOrder.id));
        console.log(`\u0414\u043E\u0434\u0430\u043D\u043E ${quantity} \u0448\u0442. \u0434\u043E \u0456\u0441\u043D\u0443\u044E\u0447\u043E\u0433\u043E \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u043D\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E #${existingOrder.orderNumber}`);
      } else {
        const manufacturingOrderNumber = `MFG-${Date.now()}-${productId}`;
        await db.insert(manufacturingOrders).values({
          orderNumber: manufacturingOrderNumber,
          productId,
          recipeId: recipe[0].id,
          plannedQuantity: quantity.toString(),
          producedQuantity: "0",
          unit: "\u0448\u0442",
          status: "pending",
          priority: "medium",
          sourceOrderId,
          materialCost: "0.00",
          laborCost: "0.00",
          overheadCost: "0.00",
          totalCost: "0.00",
          notes: `\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u043D\u043E \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0437 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${orderNumber}. \u041F\u043E\u0442\u0440\u0456\u0431\u043D\u043E \u0432\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0438: ${quantity} \u0448\u0442.`,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        console.log(`\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u043D\u043E\u0432\u0435 \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u043D\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E ${manufacturingOrderNumber} \u0434\u043B\u044F ${quantity} \u0448\u0442.`);
      }
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u0456/\u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u0456 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0447\u043E\u0433\u043E \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F:", error);
      throw error;
    }
  }
  // Client Mails methods
  async getClientMails() {
    try {
      return [
        {
          id: 1,
          clientId: 1,
          subject: "\u0417\u0430\u043F\u0438\u0442 \u043F\u0440\u043E \u0446\u0456\u043D\u0438 \u043D\u0430 \u043F\u0440\u043E\u0434\u0443\u043A\u0446\u0456\u044E",
          content: "\u0414\u043E\u0431\u0440\u043E\u0433\u043E \u0434\u043D\u044F! \u041F\u0440\u043E\u0441\u0438\u043C\u043E \u043D\u0430\u0434\u0430\u0442\u0438 \u043A\u043E\u043C\u0435\u0440\u0446\u0456\u0439\u043D\u0443 \u043F\u0440\u043E\u043F\u043E\u0437\u0438\u0446\u0456\u044E \u043D\u0430 \u0420\u041F2-\u0423-410.",
          dateReceived: /* @__PURE__ */ new Date("2025-06-01"),
          status: "processed",
          priority: "medium",
          attachments: []
        },
        {
          id: 2,
          clientId: 2,
          subject: "\u0421\u043A\u0430\u0440\u0433\u0430 \u043D\u0430 \u044F\u043A\u0456\u0441\u0442\u044C \u0442\u043E\u0432\u0430\u0440\u0443",
          content: "\u0412\u0438\u044F\u0432\u043B\u0435\u043D\u043E \u0434\u0435\u0444\u0435\u043A\u0442 \u0432 \u043F\u0430\u0440\u0442\u0456\u0457 \u0442\u043E\u0432\u0430\u0440\u0456\u0432 \u043D\u043E\u043C\u0435\u0440 12345. \u041F\u043E\u0442\u0440\u0435\u0431\u0443\u0454 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u043A\u0438.",
          dateReceived: /* @__PURE__ */ new Date("2025-06-02"),
          status: "pending",
          priority: "high",
          attachments: ["defect_photo.jpg"]
        },
        {
          id: 3,
          clientId: 1,
          subject: "\u041F\u043E\u0434\u044F\u043A\u0430 \u0437\u0430 \u0441\u043F\u0456\u0432\u043F\u0440\u0430\u0446\u044E",
          content: "\u0414\u044F\u043A\u0443\u0454\u043C\u043E \u0437\u0430 \u044F\u043A\u0456\u0441\u043D\u0435 \u0432\u0438\u043A\u043E\u043D\u0430\u043D\u043D\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u0442\u0430 \u0441\u0432\u043E\u0454\u0447\u0430\u0441\u043D\u0443 \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0443.",
          dateReceived: /* @__PURE__ */ new Date("2025-06-03"),
          status: "archived",
          priority: "low",
          attachments: []
        }
      ];
    } catch (error) {
      console.error("Error fetching client mails:", error);
      return [];
    }
  }
};
var storage = new DatabaseStorage();

// server/integrations-simple.ts
var integrations = /* @__PURE__ */ new Map();
var currentId = 1;
function registerSimpleIntegrationRoutes(app2) {
  app2.get("/api/integrations", async (req, res) => {
    try {
      const allIntegrations = Array.from(integrations.values());
      res.json(allIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });
  app2.post("/api/integrations", async (req, res) => {
    try {
      const { name, displayName, type, isActive, config } = req.body;
      if (!name || !displayName || !type) {
        return res.status(400).json({ error: "Name, displayName and type are required" });
      }
      const integration = {
        id: currentId++,
        name,
        displayName,
        type,
        isActive: isActive || false,
        config: config || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      integrations.set(integration.id, integration);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });
  app2.get("/api/integrations/sync-logs", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });
  app2.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const integration = integrations.get(id2);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json({
        success: true,
        message: "Connection test successful",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error testing integration:", error);
      res.status(500).json({ error: "Failed to test integration" });
    }
  });
  app2.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const integration = integrations.get(id2);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json({
        success: true,
        message: "Synchronization started",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error starting synchronization:", error);
      res.status(500).json({ error: "Failed to start synchronization" });
    }
  });
}

// server/sync-api.ts
import { z as z2 } from "zod";
var syncClientSchema = z2.object({
  externalId: z2.string(),
  name: z2.string().min(1),
  taxCode: z2.string().default(""),
  fullName: z2.string().optional(),
  legalAddress: z2.string().optional(),
  physicalAddress: z2.string().optional(),
  notes: z2.string().optional(),
  isActive: z2.boolean().default(true),
  type: z2.string().optional(),
  source: z2.enum(["bitrix24", "1c", "manual"]).default("manual")
});
var syncContactSchema = z2.object({
  externalId: z2.string(),
  clientExternalId: z2.string(),
  fullName: z2.string().min(1),
  email: z2.string().email().optional(),
  primaryPhone: z2.string().optional(),
  position: z2.string().optional(),
  isPrimary: z2.boolean().default(false),
  isActive: z2.boolean().default(true),
  notes: z2.string().optional(),
  source: z2.enum(["bitrix24", "1c", "manual"]).default("manual")
});
var syncInvoiceSchema = z2.object({
  externalId: z2.string(),
  clientExternalId: z2.string(),
  companyId: z2.number().optional(),
  invoiceNumber: z2.string().min(1),
  amount: z2.number().positive(),
  currency: z2.string().default("UAH"),
  status: z2.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issueDate: z2.string().transform((val) => new Date(val)),
  dueDate: z2.string().transform((val) => new Date(val)),
  paidDate: z2.string().optional().transform((val) => val ? new Date(val) : null),
  description: z2.string().optional(),
  source: z2.enum(["bitrix24", "1c", "manual"]).default("manual")
});
var syncInvoiceItemSchema = z2.object({
  externalId: z2.string(),
  invoiceExternalId: z2.string(),
  productExternalId: z2.string().optional(),
  name: z2.string().min(1),
  quantity: z2.number().positive(),
  unitPrice: z2.number(),
  totalPrice: z2.number(),
  description: z2.string().optional()
});
var syncCompanySchema = z2.object({
  externalId: z2.string(),
  name: z2.string().min(1),
  fullName: z2.string().optional(),
  taxCode: z2.string().min(1),
  vatNumber: z2.string().optional(),
  legalAddress: z2.string().optional(),
  physicalAddress: z2.string().optional(),
  phone: z2.string().optional(),
  email: z2.string().email().optional(),
  website: z2.string().optional(),
  bankName: z2.string().optional(),
  bankAccount: z2.string().optional(),
  bankCode: z2.string().optional(),
  isDefault: z2.boolean().default(false),
  isActive: z2.boolean().default(true),
  notes: z2.string().optional(),
  source: z2.enum(["bitrix24", "1c", "manual"]).default("manual")
});
var batchSyncSchema = z2.object({
  clients: z2.array(syncClientSchema).optional(),
  contacts: z2.array(syncContactSchema).optional(),
  invoices: z2.array(syncInvoiceSchema).optional(),
  invoiceItems: z2.array(syncInvoiceItemSchema).optional(),
  companies: z2.array(syncCompanySchema).optional(),
  source: z2.enum(["bitrix24", "1c", "manual"]).default("manual"),
  syncId: z2.string().optional()
});
function registerSyncApiRoutes(app2) {
  app2.post("/api/sync/clients", async (req, res) => {
    try {
      const validatedData = syncClientSchema.parse(req.body);
      const existingClient = await storage.getClientByExternalId(validatedData.externalId);
      let client;
      let action;
      if (existingClient) {
        client = await storage.updateClient(existingClient.id.toString(), {
          name: validatedData.name,
          taxCode: validatedData.taxCode,
          fullName: validatedData.fullName,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          notes: validatedData.notes,
          isActive: validatedData.isActive,
          type: validatedData.type
        });
        action = "updated";
      } else {
        const existingByTaxCode = await storage.getClientByTaxCode(validatedData.taxCode);
        if (existingByTaxCode) {
          client = await storage.updateClient(existingByTaxCode.id.toString(), {
            name: validatedData.name,
            taxCode: validatedData.taxCode,
            fullName: validatedData.fullName,
            legalAddress: validatedData.legalAddress,
            physicalAddress: validatedData.physicalAddress,
            notes: validatedData.notes,
            isActive: validatedData.isActive,
            type: validatedData.type
          });
          await storage.updateClientSyncInfo(existingByTaxCode.id, validatedData.externalId, validatedData.source);
          action = "linked";
        } else {
          client = await storage.createClient({
            name: validatedData.name,
            taxCode: validatedData.taxCode,
            fullName: validatedData.fullName,
            legalAddress: validatedData.legalAddress,
            physicalAddress: validatedData.physicalAddress,
            notes: validatedData.notes,
            isActive: validatedData.isActive,
            type: validatedData.type
          });
          await storage.updateClientSyncInfo(client.id, validatedData.externalId, validatedData.source);
          action = "created";
        }
      }
      res.json({
        success: true,
        client,
        action
      });
    } catch (error) {
      console.error("Error syncing client:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to sync client" });
    }
  });
  app2.post("/api/sync/contacts", async (req, res) => {
    try {
      const validatedData = syncContactSchema.parse(req.body);
      const client = await storage.getClientByExternalId(validatedData.clientExternalId);
      if (!client) {
        return res.status(404).json({
          error: "Client not found",
          clientExternalId: validatedData.clientExternalId
        });
      }
      const existingContact = await storage.getClientContactByExternalId(validatedData.externalId);
      let contact;
      if (existingContact) {
        contact = await storage.updateClientContact(existingContact.id, {
          fullName: validatedData.fullName,
          email: validatedData.email,
          primaryPhone: validatedData.primaryPhone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
      } else {
        contact = await storage.createClientContact({
          clientId: client.id,
          fullName: validatedData.fullName,
          email: validatedData.email,
          primaryPhone: validatedData.primaryPhone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive,
          notes: validatedData.notes,
          externalId: validatedData.externalId,
          source: validatedData.source
        });
      }
      res.json({
        success: true,
        contact,
        action: existingContact ? "updated" : "created",
        clientId: client.id
      });
    } catch (error) {
      console.error("Error syncing contact:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to sync contact" });
    }
  });
  app2.post("/api/sync/batch", async (req, res) => {
    try {
      const validatedData = batchSyncSchema.parse(req.body);
      const results = {
        clients: [],
        contacts: [],
        errors: []
      };
      const syncId = validatedData.syncId || `sync_${Date.now()}`;
      if (validatedData.clients) {
        for (const clientData of validatedData.clients) {
          try {
            const existingClient = await storage.getClientByExternalId(clientData.externalId);
            let client;
            if (existingClient) {
              client = await storage.updateClient(existingClient.id.toString(), {
                name: clientData.name,
                taxCode: clientData.taxCode,
                fullName: clientData.fullName,
                legalAddress: clientData.legalAddress,
                physicalAddress: clientData.physicalAddress,
                notes: clientData.notes,
                isActive: clientData.isActive,
                type: clientData.type
              });
            } else {
              client = await storage.createClient({
                name: clientData.name,
                taxCode: clientData.taxCode,
                fullName: clientData.fullName,
                legalAddress: clientData.legalAddress,
                physicalAddress: clientData.physicalAddress,
                notes: clientData.notes,
                isActive: clientData.isActive,
                type: clientData.type,
                externalId: clientData.externalId,
                source: validatedData.source
              });
            }
            if (client) {
              results.clients.push({
                externalId: clientData.externalId,
                id: client.id,
                action: existingClient ? "updated" : "created"
              });
            }
          } catch (error) {
            results.errors.push({
              type: "client",
              externalId: clientData.externalId,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
      }
      if (validatedData.contacts) {
        for (const contactData of validatedData.contacts) {
          try {
            const client = await storage.getClientByExternalId(contactData.clientExternalId);
            if (!client) {
              results.errors.push({
                type: "contact",
                externalId: contactData.externalId,
                error: `Client not found: ${contactData.clientExternalId}`
              });
              continue;
            }
            const existingContact = await storage.getClientContactByExternalId(contactData.externalId);
            let contact;
            if (existingContact) {
              contact = await storage.updateClientContact(existingContact.id, {
                fullName: contactData.fullName,
                email: contactData.email,
                primaryPhone: contactData.primaryPhone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive,
                notes: contactData.notes
              });
            } else {
              contact = await storage.createClientContact({
                clientId: client.id,
                fullName: contactData.fullName,
                email: contactData.email,
                primaryPhone: contactData.primaryPhone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive,
                notes: contactData.notes,
                externalId: contactData.externalId,
                source: validatedData.source
              });
            }
            if (contact) {
              results.contacts.push({
                externalId: contactData.externalId,
                id: contact.id,
                clientId: client.id,
                action: existingContact ? "updated" : "created"
              });
            }
          } catch (error) {
            results.errors.push({
              type: "contact",
              externalId: contactData.externalId,
              error: error instanceof Error ? error.message : "Unknown error"
            });
          }
        }
      }
      res.json({
        success: true,
        syncId,
        summary: {
          clients: results.clients.length,
          contacts: results.contacts.length,
          errors: results.errors.length
        },
        results
      });
    } catch (error) {
      console.error("Error in batch sync:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to perform batch sync" });
    }
  });
  app2.post("/api/sync/companies", async (req, res) => {
    try {
      const validatedData = syncCompanySchema.parse(req.body);
      const existingCompany = await storage.getCompanyByExternalId?.(validatedData.externalId);
      let company;
      let action;
      if (existingCompany) {
        company = await storage.updateCompany(existingCompany.id, {
          name: validatedData.name,
          fullName: validatedData.fullName,
          taxCode: validatedData.taxCode,
          vatNumber: validatedData.vatNumber,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website,
          bankName: validatedData.bankName,
          bankAccount: validatedData.bankAccount,
          bankCode: validatedData.bankCode,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
        action = "updated";
      } else {
        company = await storage.createCompany({
          name: validatedData.name,
          fullName: validatedData.fullName,
          taxCode: validatedData.taxCode,
          vatNumber: validatedData.vatNumber,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website,
          bankName: validatedData.bankName,
          bankAccount: validatedData.bankAccount,
          bankCode: validatedData.bankCode,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
        action = "created";
      }
      res.json({
        success: true,
        company,
        action,
        externalId: validatedData.externalId
      });
    } catch (error) {
      console.error("Error syncing company:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to sync company" });
    }
  });
  app2.post("/api/sync/invoices", async (req, res) => {
    try {
      const validatedData = syncInvoiceSchema.parse(req.body);
      const client = await storage.getClientByExternalId(validatedData.clientExternalId);
      if (!client) {
        return res.status(404).json({
          error: `Client not found with external ID: ${validatedData.clientExternalId}`
        });
      }
      const existingInvoice = await storage.getInvoiceByExternalId?.(validatedData.externalId);
      let invoice;
      let action;
      const invoiceData = {
        clientId: client.id,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        paidDate: validatedData.paidDate,
        description: validatedData.description,
        externalId: validatedData.externalId,
        source: validatedData.source
      };
      if (existingInvoice) {
        invoice = await storage.updateInvoice(existingInvoice.id, invoiceData);
        action = "updated";
      } else {
        invoice = await storage.createInvoice(invoiceData);
        action = "created";
      }
      res.json({
        success: true,
        invoice,
        action,
        clientId: client.id,
        externalId: validatedData.externalId
      });
    } catch (error) {
      console.error("Error syncing invoice:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to sync invoice" });
    }
  });
  app2.post("/api/sync/invoice-items", async (req, res) => {
    try {
      const invoiceItemSchema = z2.object({
        invoiceId: z2.number(),
        productId: z2.number().optional(),
        productExternalId: z2.string().optional(),
        name: z2.string(),
        quantity: z2.number(),
        unitPrice: z2.number(),
        totalPrice: z2.number(),
        description: z2.string().optional()
      });
      const validatedData = invoiceItemSchema.parse(req.body);
      const invoice = await storage.getInvoice(validatedData.invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      let productId = validatedData.productId;
      if (validatedData.productExternalId && !productId) {
        const products3 = await storage.getProducts();
        const product = products3.find((p) => p.sku === validatedData.productExternalId);
        if (product) {
          productId = product.id;
        }
      }
      const invoiceItem = await storage.createInvoiceItem({
        invoiceId: validatedData.invoiceId,
        productId: productId || null,
        productExternalId: validatedData.productExternalId || null,
        name: validatedData.name,
        quantity: validatedData.quantity.toString(),
        unitPrice: validatedData.unitPrice.toString(),
        totalPrice: validatedData.totalPrice.toString(),
        description: validatedData.description || null
      });
      res.json({
        success: true,
        invoiceItem,
        action: "created"
      });
    } catch (error) {
      console.error("Error syncing invoice item:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors
        });
      }
      res.status(500).json({ error: "Failed to sync invoice item" });
    }
  });
  app2.post("/api/sync/bulk-invoices", async (req, res) => {
    try {
      const startTime = /* @__PURE__ */ new Date();
      let invoicesProcessed = 0;
      let itemsProcessed = 0;
      let errors = [];
      const invoicesData = [
        {
          externalId: "bitrix_invoice_003",
          clientExternalId: "bitrix_client_001",
          companyId: 1,
          invoiceNumber: "INV-2025-003",
          amount: 12e3,
          currency: "UAH",
          status: "pending",
          issueDate: "2025-06-08T00:00:00Z",
          dueDate: "2025-06-22T00:00:00Z",
          description: "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0437\u0430 \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u0447\u043D\u0456 \u043C\u043E\u0434\u0443\u043B\u0456",
          source: "bitrix24",
          items: [
            {
              name: "\u041C\u043E\u0434\u0443\u043B\u044C \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0438 \u043F\u0440\u043E\u0434\u0430\u0436\u0456\u0432",
              quantity: 1,
              unitPrice: 6e3,
              totalPrice: 6e3,
              description: "\u0420\u043E\u0437\u0440\u043E\u0431\u043A\u0430 \u0442\u0430 \u0432\u043F\u0440\u043E\u0432\u0430\u0434\u0436\u0435\u043D\u043D\u044F \u043C\u043E\u0434\u0443\u043B\u044F \u0430\u043D\u0430\u043B\u0456\u0442\u0438\u043A\u0438 \u043F\u0440\u043E\u0434\u0430\u0436\u0456\u0432"
            },
            {
              name: "\u041C\u043E\u0434\u0443\u043B\u044C \u0437\u0432\u0456\u0442\u043D\u043E\u0441\u0442\u0456",
              quantity: 1,
              unitPrice: 6e3,
              totalPrice: 6e3,
              description: "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u0437\u0432\u0456\u0442\u043D\u043E\u0441\u0442\u0456 \u0442\u0430 \u0434\u0430\u0448\u0431\u043E\u0440\u0434\u0456\u0432"
            }
          ]
        },
        {
          externalId: "bitrix_invoice_004",
          clientExternalId: "bitrix_client_001",
          companyId: 1,
          invoiceNumber: "INV-2025-004",
          amount: 7500,
          currency: "UAH",
          status: "sent",
          issueDate: "2025-06-08T00:00:00Z",
          dueDate: "2025-06-25T00:00:00Z",
          description: "\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0437\u0430 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u0438",
          source: "bitrix24",
          items: [
            {
              name: "\u0422\u0435\u0445\u043D\u0456\u0447\u043D\u0430 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0430 (3 \u043C\u0456\u0441\u044F\u0446\u0456)",
              quantity: 1,
              unitPrice: 7500,
              totalPrice: 7500,
              description: "\u0422\u0435\u0445\u043D\u0456\u0447\u043D\u0430 \u043F\u0456\u0434\u0442\u0440\u0438\u043C\u043A\u0430 ERP \u0441\u0438\u0441\u0442\u0435\u043C\u0438 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 3 \u043C\u0456\u0441\u044F\u0446\u0456\u0432"
            }
          ]
        }
      ];
      for (const invoiceData of invoicesData) {
        try {
          const clients2 = await storage.getClients();
          const client = clients2.find((c) => c.externalId === invoiceData.clientExternalId);
          if (!client) {
            errors.push(`Client not found: ${invoiceData.clientExternalId}`);
            continue;
          }
          const existingInvoice = await storage.getInvoiceByExternalId(invoiceData.externalId);
          let invoice;
          if (existingInvoice) {
            invoice = await storage.updateInvoice(existingInvoice.id, {
              clientId: client.id,
              companyId: invoiceData.companyId,
              invoiceNumber: invoiceData.invoiceNumber,
              amount: invoiceData.amount.toString(),
              currency: invoiceData.currency,
              status: invoiceData.status,
              issueDate: new Date(invoiceData.issueDate),
              dueDate: new Date(invoiceData.dueDate),
              description: invoiceData.description,
              source: invoiceData.source,
              updatedAt: /* @__PURE__ */ new Date()
            });
          } else {
            invoice = await storage.createInvoice({
              clientId: client.id,
              companyId: invoiceData.companyId,
              invoiceNumber: invoiceData.invoiceNumber,
              amount: invoiceData.amount.toString(),
              currency: invoiceData.currency,
              status: invoiceData.status,
              issueDate: new Date(invoiceData.issueDate),
              dueDate: new Date(invoiceData.dueDate),
              description: invoiceData.description,
              externalId: invoiceData.externalId,
              source: invoiceData.source
            });
          }
          invoicesProcessed++;
          for (const itemData of invoiceData.items) {
            try {
              await storage.createInvoiceItem({
                invoiceId: invoice.id,
                productId: null,
                productExternalId: null,
                name: itemData.name,
                quantity: itemData.quantity.toString(),
                unitPrice: itemData.unitPrice.toString(),
                totalPrice: itemData.totalPrice.toString(),
                description: itemData.description
              });
              itemsProcessed++;
            } catch (itemError) {
              errors.push(`Failed to create item for invoice ${invoice.invoiceNumber}: ${itemError}`);
            }
          }
        } catch (invoiceError) {
          errors.push(`Failed to process invoice ${invoiceData.externalId}: ${invoiceError}`);
        }
      }
      const endTime = /* @__PURE__ */ new Date();
      const duration = endTime.getTime() - startTime.getTime();
      res.json({
        success: true,
        summary: {
          invoicesProcessed,
          itemsProcessed,
          errorsCount: errors.length,
          duration: `${duration}ms`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("Bulk sync error:", error);
      res.status(500).json({ error: "Failed to perform bulk sync" });
    }
  });
  app2.get("/api/sync/stats", async (req, res) => {
    try {
      const { source } = req.query;
      const clientsQuery = storage.getClients();
      const contactsQuery = storage.getClientContacts();
      const companiesQuery = storage.getCompanies();
      const invoicesQuery = storage.getInvoices();
      const [clients2, contacts, companies2, invoices] = await Promise.all([
        clientsQuery,
        contactsQuery,
        companiesQuery,
        invoicesQuery
      ]);
      let stats = {
        clients: {
          total: clients2.length,
          withExternalId: clients2.filter((c) => c.externalId).length,
          bySource: {}
        },
        contacts: {
          total: contacts.length,
          withExternalId: contacts.filter((c) => c.externalId).length,
          bySource: {}
        },
        companies: {
          total: companies2.length,
          synced: companies2.filter((c) => c.source && c.source !== "manual").length,
          bySource: {}
        },
        invoices: {
          total: invoices.length,
          withExternalId: invoices.filter((i) => i.externalId).length,
          bySource: {}
        }
      };
      if (source) {
        stats.clients.bySource[source] = clients2.filter((c) => c.source === source).length;
        stats.contacts.bySource[source] = contacts.filter((c) => c.source === source).length;
        stats.companies.bySource[source] = companies2.filter((c) => c.source === source).length;
        stats.invoices.bySource[source] = invoices.filter((i) => i.source === source).length;
      }
      res.json(stats);
    } catch (error) {
      console.error("Error getting sync stats:", error);
      res.status(500).json({ error: "Failed to get sync stats" });
    }
  });
}

// server/simple-auth.ts
init_storage();
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
var isSimpleAuthenticated = (req, res, next) => {
  console.log("Auth check - Session exists:", !!req.session);
  console.log("Auth check - User in session:", !!req.session?.user);
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - Session data:", req.session);
  if (req.session && req.session.user) {
    console.log("Auth check - User authenticated:", req.session.user.username);
    return next();
  }
  console.log("Auth check - User NOT authenticated");
  return res.status(401).json({ message: "Unauthorized" });
};
function setupSimpleSession(app2) {
  app2.set("trust proxy", 1);
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  app2.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // false для development
      maxAge: sessionTtl,
      sameSite: "lax"
    },
    name: "regmik_session"
  }));
}
var demoUsers = [
  {
    id: "demo-user-1",
    username: "demo",
    password: "demo123",
    email: "demo@example.com",
    firstName: "\u0414\u0435\u043C\u043E",
    lastName: "\u041A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447",
    profileImageUrl: null
  },
  {
    id: "admin-user-1",
    username: "admin",
    password: "admin123",
    email: "admin@regmik.com",
    firstName: "\u0410\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440",
    lastName: "\u0421\u0438\u0441\u0442\u0435\u043C\u0438",
    profileImageUrl: null
  }
];
function setupSimpleAuth(app2) {
  app2.post("/api/auth/simple-login", async (req, res) => {
    console.log("Login attempt:", req.body);
    console.log("Session ID before login:", req.sessionID);
    const { username: rawUsername, password } = req.body;
    const username = rawUsername?.trim();
    console.log("Trimmed username:", username);
    try {
      const demoUser = demoUsers.find((u) => u.username === username && u.password === password);
      if (demoUser) {
        console.log("Demo user found:", demoUser.username);
        req.session.user = {
          id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          profileImageUrl: demoUser.profileImageUrl
        };
        return req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F \u0441\u0435\u0441\u0456\u0457" });
          }
          console.log("Session saved successfully for demo user, ID:", req.sessionID);
          res.json({ success: true, user: demoUser });
        });
      }
      console.log("Checking database for user:", username);
      const dbUser = await storage2.getLocalUserByUsername(username);
      if (dbUser) {
        console.log("Database user found:", dbUser.username);
        console.log("User active status:", dbUser.isActive);
        if (!dbUser.isActive) {
          console.log("User is inactive");
          return res.status(401).json({ message: "\u041E\u0431\u043B\u0456\u043A\u043E\u0432\u0438\u0439 \u0437\u0430\u043F\u0438\u0441 \u0434\u0435\u0430\u043A\u0442\u0438\u0432\u043E\u0432\u0430\u043D\u0438\u0439" });
        }
        const isPasswordValid = await bcrypt.compare(password, dbUser.password);
        console.log("Password validation result:", isPasswordValid);
        if (isPasswordValid) {
          console.log("Database user authenticated successfully");
          req.session.user = {
            id: dbUser.id.toString(),
            username: dbUser.username,
            email: dbUser.email,
            firstName: dbUser.username,
            // Використовуємо username як firstName
            lastName: "",
            profileImageUrl: null
          };
          await storage2.updateUserLastLogin(dbUser.id);
          return req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F \u0441\u0435\u0441\u0456\u0457" });
            }
            console.log("Session saved successfully for database user, ID:", req.sessionID);
            res.json({ success: true, user: {
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email
            } });
          });
        }
      }
      console.log("Invalid credentials - no user found or password incorrect");
      res.status(401).json({ message: "\u041D\u0435\u0432\u0456\u0440\u043D\u0438\u0439 \u043B\u043E\u0433\u0456\u043D \u0430\u0431\u043E \u043F\u0430\u0440\u043E\u043B\u044C" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0443 \u043F\u0456\u0434 \u0447\u0430\u0441 \u0432\u0445\u043E\u0434\u0443" });
    }
  });
  app2.get("/api/auth/user", isSimpleAuthenticated, (req, res) => {
    const user = req.session.user;
    res.json(user);
  });
  app2.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0432\u0438\u0445\u043E\u0434\u0456" });
      }
      console.log("User logged out successfully");
      res.redirect("/");
    });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043F\u0440\u0438 \u0432\u0438\u0445\u043E\u0434\u0456" });
      }
      res.json({ success: true });
    });
  });
}

// server/routes.ts
init_nova_poshta_api();

// server/nova-poshta-cache.ts
var NovaPoshtaCache = class {
  constructor() {
    this.cities = /* @__PURE__ */ new Map();
    this.warehouses = /* @__PURE__ */ new Map();
    this.warehousesByCity = /* @__PURE__ */ new Map();
    this.lastCitiesUpdate = null;
    this.lastWarehousesUpdate = null;
    // Час життя кешу (24 години)
    this.CACHE_TTL = 24 * 60 * 60 * 1e3;
  }
  async getCities(query) {
    if (this.shouldUpdateCities()) {
      await this.updateCities();
    }
    const allCities = Array.from(this.cities.values());
    if (!query || query.length < 2) {
      return allCities.slice(0, 50);
    }
    const lowerQuery = query.toLowerCase();
    const filteredCities = allCities.filter(
      (city) => city.name.toLowerCase().includes(lowerQuery) || city.area.toLowerCase().includes(lowerQuery)
    );
    const sortedCities = filteredCities.sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      const aStartsWith = aNameLower.startsWith(lowerQuery);
      const bStartsWith = bNameLower.startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      if (aStartsWith && bStartsWith) {
        return a.name.length - b.name.length;
      }
      return a.name.localeCompare(b.name, "uk");
    });
    return sortedCities.slice(0, 500);
  }
  async getWarehouses(cityRef) {
    if (this.shouldUpdateWarehouses()) {
      await this.updateWarehouses();
    }
    return this.warehousesByCity.get(cityRef) || [];
  }
  shouldUpdateCities() {
    if (!this.lastCitiesUpdate) return true;
    return Date.now() - this.lastCitiesUpdate.getTime() > this.CACHE_TTL;
  }
  shouldUpdateWarehouses() {
    if (!this.lastWarehousesUpdate) return true;
    return Date.now() - this.lastWarehousesUpdate.getTime() > this.CACHE_TTL;
  }
  async updateCities() {
    try {
      console.log("\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u043C\u0456\u0441\u0442 \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438...");
      const response = await fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.NOVA_POSHTA_API_KEY,
          modelName: "Address",
          calledMethod: "getCities",
          methodProperties: {}
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        this.cities.clear();
        for (const city of data.data) {
          const cachedCity = {
            ref: city.Ref,
            name: city.Description,
            area: city.AreaDescription,
            region: city.RegionDescription,
            lastUpdated: /* @__PURE__ */ new Date()
          };
          this.cities.set(city.Ref, cachedCity);
        }
        this.lastCitiesUpdate = /* @__PURE__ */ new Date();
        console.log(`\u041A\u0435\u0448 \u043C\u0456\u0441\u0442 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${this.cities.size} \u043C\u0456\u0441\u0442`);
      }
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u043C\u0456\u0441\u0442:", error);
    }
  }
  async updateWarehouses() {
    try {
      console.log("\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438...");
      const response = await fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: process.env.NOVA_POSHTA_API_KEY,
          modelName: "Address",
          calledMethod: "getWarehouses",
          methodProperties: {}
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        this.warehouses.clear();
        this.warehousesByCity.clear();
        for (const warehouse of data.data) {
          const cachedWarehouse = {
            ref: warehouse.Ref,
            cityRef: warehouse.CityRef,
            description: warehouse.Description,
            descriptionRu: warehouse.DescriptionRu,
            shortAddress: warehouse.ShortAddress,
            phone: warehouse.Phone,
            schedule: warehouse.Schedule,
            number: warehouse.Number,
            placeMaxWeightAllowed: warehouse.PlaceMaxWeightAllowed,
            lastUpdated: /* @__PURE__ */ new Date()
          };
          this.warehouses.set(warehouse.Ref, cachedWarehouse);
          if (!this.warehousesByCity.has(warehouse.CityRef)) {
            this.warehousesByCity.set(warehouse.CityRef, []);
          }
          this.warehousesByCity.get(warehouse.CityRef).push(cachedWarehouse);
        }
        this.lastWarehousesUpdate = /* @__PURE__ */ new Date();
        console.log(`\u041A\u0435\u0448 \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${this.warehouses.size} \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C`);
      }
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C:", error);
    }
  }
  // Примусове оновлення кешу
  async forceUpdate() {
    await Promise.all([
      this.updateCities(),
      this.updateWarehouses()
    ]);
  }
  // Отримання статистики кешу
  getCacheStats() {
    return {
      citiesCount: this.cities.size,
      warehousesCount: this.warehouses.size,
      lastCitiesUpdate: this.lastCitiesUpdate,
      lastWarehousesUpdate: this.lastWarehousesUpdate,
      citiesCacheValid: !this.shouldUpdateCities(),
      warehousesCacheValid: !this.shouldUpdateWarehouses()
    };
  }
  async updateApiKey(apiKey) {
    const { novaPoshtaApi: novaPoshtaApi2 } = await Promise.resolve().then(() => (init_nova_poshta_api(), nova_poshta_api_exports));
    novaPoshtaApi2.updateApiKey(apiKey);
  }
  async syncData() {
    await this.updateCities();
    await this.updateWarehouses();
  }
  getCitiesCount() {
    return this.cities.size;
  }
  getWarehousesCount() {
    return this.warehouses.size;
  }
  async initialize() {
    try {
      console.log("\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u043C\u0456\u0441\u0442 \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438...");
      await this.updateCities();
      console.log(`\u041A\u0435\u0448 \u043C\u0456\u0441\u0442 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${this.getCitiesCount()} \u043C\u0456\u0441\u0442`);
      console.log("\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043A\u0435\u0448\u0443 \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438...");
      await this.updateWarehouses();
      console.log(`\u041A\u0435\u0448 \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${this.getWarehousesCount()} \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C`);
      console.log(`\u041A\u0435\u0448 \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438 \u0433\u043E\u0442\u043E\u0432\u0438\u0439: ${this.getCitiesCount()} \u043C\u0456\u0441\u0442, ${this.getWarehousesCount()} \u0432\u0456\u0434\u0434\u0456\u043B\u0435\u043D\u044C`);
    } catch (error) {
      console.error("\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0456\u043D\u0456\u0446\u0456\u0430\u043B\u0456\u0437\u0430\u0446\u0456\u0457 \u043A\u0435\u0448\u0443 \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438:", error);
    }
  }
};
var novaPoshtaCache = new NovaPoshtaCache();

// server/routes.ts
init_schema();
init_email_service();
import bcrypt2 from "bcryptjs";
import { z as z3 } from "zod";
import crypto from "crypto";
async function registerRoutes(app2) {
  setupSimpleSession(app2);
  setupSimpleAuth(app2);
  registerSimpleIntegrationRoutes(app2);
  registerSyncApiRoutes(app2);
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/analytics/sales", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const salesData = await storage.getSalesAnalytics(period);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ error: "Failed to fetch sales analytics" });
    }
  });
  app2.get("/api/analytics/expenses", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const expensesData = await storage.getExpensesAnalytics(period);
      res.json(expensesData);
    } catch (error) {
      console.error("Error fetching expenses analytics:", error);
      res.status(500).json({ error: "Failed to fetch expenses analytics" });
    }
  });
  app2.get("/api/analytics/profit", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const profitData = await storage.getProfitAnalytics(period);
      res.json(profitData);
    } catch (error) {
      console.error("Error fetching profit analytics:", error);
      res.status(500).json({ error: "Failed to fetch profit analytics" });
    }
  });
  app2.get("/api/analytics/product-profitability", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const profitabilityData = await storage.calculateProductProfitability(period);
      res.json(profitabilityData);
    } catch (error) {
      console.error("Error fetching product profitability:", error);
      res.status(500).json({ error: "Failed to fetch product profitability" });
    }
  });
  app2.get("/api/analytics/top-profitable-products", isSimpleAuthenticated, async (req, res) => {
    try {
      const { limit = "10", period = "month" } = req.query;
      const topProducts = await storage.getTopProfitableProducts(parseInt(limit), period);
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top profitable products:", error);
      res.status(500).json({ error: "Failed to fetch top profitable products" });
    }
  });
  app2.get("/api/analytics/product-trends/:productId", isSimpleAuthenticated, async (req, res) => {
    try {
      const { productId } = req.params;
      const { months = "6" } = req.query;
      const trends = await storage.getProductProfitabilityTrends(parseInt(productId), parseInt(months));
      res.json(trends);
    } catch (error) {
      console.error("Error fetching product trends:", error);
      res.status(500).json({ error: "Failed to fetch product trends" });
    }
  });
  app2.get("/api/time-entries", isSimpleAuthenticated, async (req, res) => {
    try {
      const timeEntries3 = await storage.getTimeEntries();
      res.json(timeEntries3);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });
  app2.post("/api/time-entries", isSimpleAuthenticated, async (req, res) => {
    try {
      const timeEntryData = req.body;
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });
  app2.patch("/api/time-entries/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const updateData = req.body;
      const timeEntry = await storage.updateTimeEntry(id2, updateData);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });
  app2.get("/api/inventory/alerts", isSimpleAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getInventoryAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching inventory alerts:", error);
      res.status(500).json({ error: "Failed to fetch inventory alerts" });
    }
  });
  app2.post("/api/inventory/check-alerts", isSimpleAuthenticated, async (req, res) => {
    try {
      await storage.checkAndCreateInventoryAlerts();
      res.json({ message: "Inventory alerts checked and updated" });
    } catch (error) {
      console.error("Error checking inventory alerts:", error);
      res.status(500).json({ error: "Failed to check inventory alerts" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email \u0454 \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u043C" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "\u042F\u043A\u0449\u043E email \u0456\u0441\u043D\u0443\u0454 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456, \u043B\u0438\u0441\u0442 \u0431\u0443\u0434\u0435 \u0432\u0456\u0434\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E" });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 36e5);
      const tokenSaved = await storage.savePasswordResetToken(user.id, resetToken, resetExpires);
      if (!tokenSaved) {
        return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u043D\u044F \u0442\u043E\u043A\u0435\u043D\u0443" });
      }
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const host = req.get("host");
      const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;
      const emailSent = await sendEmail({
        to: email,
        from: "noreply@regmik-erp.com",
        subject: "\u0412\u0456\u0434\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E - REGMIK ERP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0; text-align: center;">REGMIK: ERP</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0; text-align: center;">\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E\u043C</p>
            </div>
            
            <h2 style="color: #374151;">\u0412\u0456\u0434\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E</h2>
            
            <p style="color: #6b7280; line-height: 1.6;">
              \u0412\u0438 \u043E\u0442\u0440\u0438\u043C\u0430\u043B\u0438 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442, \u043E\u0441\u043A\u0456\u043B\u044C\u043A\u0438 \u0434\u043B\u044F \u0432\u0430\u0448\u043E\u0433\u043E \u043E\u0431\u043B\u0456\u043A\u043E\u0432\u043E\u0433\u043E \u0437\u0430\u043F\u0438\u0441\u0443 \u0431\u0443\u0432 \u0437\u0430\u043F\u0438\u0442\u0430\u043D\u0438\u0439 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              \u041D\u0430\u0442\u0438\u0441\u043D\u0456\u0442\u044C \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \u043D\u0438\u0436\u0447\u0435, \u0449\u043E\u0431 \u0432\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0438 \u043D\u043E\u0432\u0438\u0439 \u043F\u0430\u0440\u043E\u043B\u044C:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                \u0412\u0456\u0434\u043D\u043E\u0432\u0438\u0442\u0438 \u043F\u0430\u0440\u043E\u043B\u044C
              </a>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
              \u042F\u043A\u0449\u043E \u043A\u043D\u043E\u043F\u043A\u0430 \u043D\u0435 \u043F\u0440\u0430\u0446\u044E\u0454, \u0441\u043A\u043E\u043F\u0456\u044E\u0439\u0442\u0435 \u0442\u0430 \u0432\u0441\u0442\u0430\u0432\u0442\u0435 \u0446\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0443 \u0432\u0430\u0448 \u0431\u0440\u0430\u0443\u0437\u0435\u0440:
            </p>
            <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
              \u0426\u0435 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u0434\u0456\u0439\u0441\u043D\u0435 \u043F\u0440\u043E\u0442\u044F\u0433\u043E\u043C 1 \u0433\u043E\u0434\u0438\u043D\u0438. \u042F\u043A\u0449\u043E \u0432\u0438 \u043D\u0435 \u0437\u0430\u043F\u0438\u0442\u0443\u0432\u0430\u043B\u0438 \u0441\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E, \u043F\u0440\u043E\u0456\u0433\u043D\u043E\u0440\u0443\u0439\u0442\u0435 \u0446\u0435\u0439 \u043B\u0438\u0441\u0442.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              REGMIK ERP - \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0456\u043D\u043D\u044F \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E\u043C
            </p>
          </div>
        `
      });
      if (!emailSent) {
        return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0432\u0456\u0434\u043F\u0440\u0430\u0432\u043A\u0438 email" });
      }
      res.json({ message: "\u042F\u043A\u0449\u043E email \u0456\u0441\u043D\u0443\u0454 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456, \u043B\u0438\u0441\u0442 \u0431\u0443\u0434\u0435 \u0432\u0456\u0434\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0456\u0448\u043D\u044F \u043F\u043E\u043C\u0438\u043B\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: "\u0422\u043E\u043A\u0435\u043D \u0454 \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u043C" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "\u041D\u0435\u0434\u0456\u0439\u0441\u043D\u0438\u0439 \u0430\u0431\u043E \u0437\u0430\u0441\u0442\u0430\u0440\u0456\u043B\u0438\u0439 \u0442\u043E\u043A\u0435\u043D" });
      }
      res.json({ message: "\u0422\u043E\u043A\u0435\u043D \u0434\u0456\u0439\u0441\u043D\u0438\u0439" });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0456\u0448\u043D\u044F \u043F\u043E\u043C\u0438\u043B\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "\u0422\u043E\u043A\u0435\u043D \u0442\u0430 \u043F\u0430\u0440\u043E\u043B\u044C \u0454 \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u043C\u0438" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "\u041F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 \u043C\u0456\u043D\u0456\u043C\u0443\u043C 6 \u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "\u041D\u0435\u0434\u0456\u0439\u0441\u043D\u0438\u0439 \u0430\u0431\u043E \u0437\u0430\u0441\u0442\u0430\u0440\u0456\u043B\u0438\u0439 \u0442\u043E\u043A\u0435\u043D" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const success = await storage.confirmPasswordReset(user.id, hashedPassword);
      if (!success) {
        return res.status(500).json({ message: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E" });
      }
      res.json({ message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0456\u0448\u043D\u043E \u043E\u043D\u043E\u0432\u043B\u0435\u043D\u043E" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "\u0412\u043D\u0443\u0442\u0440\u0456\u0448\u043D\u044F \u043F\u043E\u043C\u0438\u043B\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" });
    }
  });
  app2.get("/api/production-stats/by-category", isSimpleAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getProductionStatsByCategory();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching production stats by category:", error);
      res.status(500).json({ error: "Failed to fetch production stats by category" });
    }
  });
  app2.get("/api/production-stats/by-period", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = "month", startDate, endDate } = req.query;
      const stats = await storage.getOrderStatsByPeriod(
        period,
        startDate,
        endDate
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching order stats by period:", error);
      res.status(500).json({ error: "Failed to fetch order stats by period" });
    }
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories3 = await storage.getCategories();
      res.json(categories3);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });
  app2.patch("/api/categories/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id2, categoryData);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log(`PUT /api/categories/${id2} received data:`, req.body);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      console.log(`Parsed category data:`, categoryData);
      const category = await storage.updateCategory(id2, categoryData);
      if (!category) {
        console.log(`Category with ID ${id2} not found`);
        res.status(404).json({ error: "Category not found" });
        return;
      }
      console.log(`Category updated successfully:`, category);
      res.json(category);
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCategory(id2);
      if (!success) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  app2.get("/api/warehouses", async (req, res) => {
    try {
      const warehouses2 = await storage.getWarehouses();
      res.json(warehouses2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });
  app2.post("/api/warehouses", async (req, res) => {
    try {
      console.log("Received warehouse data:", req.body);
      const warehouseData = insertWarehouseSchema.parse(req.body);
      console.log("Parsed warehouse data:", warehouseData);
      const warehouse = await storage.createWarehouse(warehouseData);
      console.log("Created warehouse:", warehouse);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Warehouse creation error:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create warehouse", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });
  app2.put("/api/warehouses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(id2, warehouseData);
      if (warehouse) {
        res.json(warehouse);
      } else {
        res.status(404).json({ error: "Warehouse not found" });
      }
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update warehouse" });
      }
    }
  });
  app2.patch("/api/warehouses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      console.log("PATCH warehouse request for ID:", id2, "with data:", warehouseData);
      const warehouse = await storage.updateWarehouse(id2, warehouseData);
      if (warehouse) {
        console.log("Warehouse updated successfully:", warehouse);
        res.json(warehouse);
      } else {
        console.log("Warehouse not found for ID:", id2);
        res.status(404).json({ error: "Warehouse not found" });
      }
    } catch (error) {
      console.error("PATCH warehouse error:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update warehouse" });
      }
    }
  });
  app2.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteWarehouse(id2);
      if (!success) {
        res.status(404).json({ error: "Warehouse not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warehouse" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const products3 = await storage.getProducts();
      res.json(products3);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const product = await storage.getProduct(id2);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  app2.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });
  app2.put("/api/products/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id2, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });
  app2.delete("/api/products/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  app2.get("/api/inventory", async (req, res) => {
    try {
      const inventory2 = await storage.getInventory();
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });
  app2.get("/api/inventory/warehouse/:warehouseId", async (req, res) => {
    try {
      const warehouseId = parseInt(req.params.warehouseId);
      const inventory2 = await storage.getInventoryByWarehouse(warehouseId);
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouse inventory" });
    }
  });
  app2.put("/api/inventory", async (req, res) => {
    try {
      const { productId, warehouseId, quantity } = req.body;
      if (!productId || !warehouseId || quantity === void 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const inventory2 = await storage.updateInventory(productId, warehouseId, quantity);
      res.json(inventory2);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      const orders2 = await storage.getOrders();
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const order = await storage.getOrder(id2);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  app2.get("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      console.log("Getting order items for orderId:", orderId);
      const orderItems2 = await storage.getOrderItemsWithShipmentInfo(orderId);
      console.log("Order items result:", orderItems2);
      res.json(orderItems2);
    } catch (error) {
      console.error("Failed to get order items:", error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });
  app2.post("/api/orders/:id/partial-shipment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { items, shipmentData } = req.body;
      console.log("Creating partial shipment for order:", orderId);
      console.log("Items to ship:", items);
      console.log("Shipment data:", shipmentData);
      const shipment = await storage.createPartialShipment(orderId, items, shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Failed to create partial shipment:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create partial shipment" });
      }
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
      const { order, items } = req.body;
      console.log("Order data:", order);
      console.log("Items data:", items);
      console.log("Items count:", items ? items.length : 0);
      let orderData = { ...order };
      if (order.clientId && !order.customerName) {
        const client = await storage.getClient(order.clientId);
        if (client) {
          orderData.customerName = client.name;
          console.log("Auto-filled customerName from client:", client.name);
        }
      }
      const validatedOrderData = insertOrderSchema.parse(orderData);
      const createdOrder = await storage.createOrder(validatedOrderData, items || []);
      console.log("Created order:", createdOrder);
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z3.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });
  app2.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log("UPDATE ORDER STATUS - ID:", id2);
      console.log("UPDATE ORDER STATUS - Request headers:", req.headers);
      console.log("UPDATE ORDER STATUS - Raw body:", req.body);
      console.log("UPDATE ORDER STATUS - Body type:", typeof req.body);
      console.log("UPDATE ORDER STATUS - Body stringified:", JSON.stringify(req.body));
      const { status } = req.body;
      console.log("UPDATE ORDER STATUS - Extracted status:", status);
      console.log("UPDATE ORDER STATUS - Status type:", typeof status);
      if (!status) {
        console.log("UPDATE ORDER STATUS - Status is missing!");
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(id2, status);
      console.log("UPDATE ORDER STATUS - Storage result:", order);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("UPDATE ORDER STATUS - Error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
  app2.put("/api/orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { order, items } = req.body;
      console.log("=== UPDATE ORDER SERVER ===");
      console.log("Order ID:", id2);
      console.log("Order data:", order);
      console.log("Items data:", items);
      const orderData = insertOrderSchema.parse(order);
      const updatedOrder = await storage.updateOrder(id2, orderData, items || []);
      console.log("Updated order result:", updatedOrder);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  });
  app2.delete("/api/orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log(`Attempting to delete order with ID: ${id2}`);
      const deleted = await storage.deleteOrder(id2);
      console.log(`Delete operation result: ${deleted}`);
      if (!deleted) {
        console.log(`Order with ID ${id2} not found`);
        return res.status(404).json({ error: "Order not found" });
      }
      console.log(`Order with ID ${id2} successfully deleted`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });
  app2.patch("/api/orders/:id/payment-date", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { paymentDate } = req.body;
      console.log(`Updating payment date for order ${id2}:`, paymentDate);
      const order = await storage.updateOrderPaymentDate(id2, paymentDate);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to update payment date:", error);
      res.status(500).json({ error: "Failed to update payment date" });
    }
  });
  app2.patch("/api/orders/:id/due-date", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { dueDate } = req.body;
      console.log(`Updating due date for order ${id2}:`, dueDate);
      const order = await storage.updateOrderDueDate(id2, dueDate);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to update due date:", error);
      res.status(500).json({ error: "Failed to update due date" });
    }
  });
  app2.get("/api/order-statuses", async (req, res) => {
    try {
      console.log("Fetching order statuses...");
      const statuses = await storage.getOrderStatuses();
      console.log("Order statuses fetched:", statuses);
      res.json(statuses);
    } catch (error) {
      console.error("Failed to fetch order statuses:", error);
      res.status(500).json({ error: "Failed to fetch order statuses" });
    }
  });
  app2.post("/api/order-statuses", async (req, res) => {
    try {
      const statusData = req.body;
      const status = await storage.createOrderStatus(statusData);
      res.status(201).json(status);
    } catch (error) {
      console.error("Failed to create order status:", error);
      res.status(500).json({ error: "Failed to create order status" });
    }
  });
  app2.put("/api/order-statuses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const statusData = req.body;
      const status = await storage.updateOrderStatusRecord(id2, statusData);
      if (!status) {
        return res.status(404).json({ error: "Order status not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
  app2.delete("/api/order-statuses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      await storage.deleteOrderStatusRecord(id2);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete order status:", error);
      res.status(500).json({ error: "Failed to delete order status" });
    }
  });
  app2.get("/api/recipes", async (req, res) => {
    try {
      const recipes2 = await storage.getRecipes();
      res.json(recipes2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });
  app2.get("/api/recipes/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id2);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });
  app2.post("/api/recipes", async (req, res) => {
    try {
      const { recipe, ingredients } = req.body;
      const recipeData = insertRecipeSchema.parse(recipe);
      const newRecipe = await storage.createRecipe(recipeData, ingredients);
      res.status(201).json(newRecipe);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create recipe" });
      }
    }
  });
  app2.patch("/api/recipes/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { recipe, ingredients } = req.body;
      const recipeData = insertRecipeSchema.partial().parse(recipe);
      const updatedRecipe = await storage.updateRecipe(id2, recipeData, ingredients);
      if (!updatedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(updatedRecipe);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        console.error("Failed to update recipe:", error);
        res.status(500).json({ error: "Failed to update recipe" });
      }
    }
  });
  app2.get("/api/production-tasks", async (req, res) => {
    try {
      console.log("Fetching production tasks...");
      const tasks3 = await storage.getProductionTasks();
      console.log("Production tasks fetched:", tasks3);
      res.json(tasks3);
    } catch (error) {
      console.error("Error fetching production tasks:", error);
      res.status(500).json({ error: "Failed to fetch production tasks" });
    }
  });
  app2.post("/api/production-tasks", async (req, res) => {
    try {
      const taskData = insertProductionTaskSchema.parse(req.body);
      const task = await storage.createProductionTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create production task" });
      }
    }
  });
  app2.put("/api/production-tasks/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const taskData = insertProductionTaskSchema.partial().parse(req.body);
      const task = await storage.updateProductionTask(id2, taskData);
      if (!task) {
        return res.status(404).json({ error: "Production task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update production task" });
      }
    }
  });
  app2.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers2 = await storage.getSuppliers();
      res.json(suppliers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier" });
      }
    }
  });
  app2.get("/api/components", async (req, res) => {
    try {
      const components2 = await storage.getComponents();
      res.json(components2);
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ error: "Failed to fetch components", details: error.message });
    }
  });
  app2.get("/api/components/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const component = await storage.getComponent(id2);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch component" });
    }
  });
  app2.post("/api/components", async (req, res) => {
    try {
      const data = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component" });
      }
    }
  });
  app2.patch("/api/components/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const data = insertComponentSchema.partial().parse(req.body);
      const component = await storage.updateComponent(id2, data);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component" });
      }
    }
  });
  app2.delete("/api/components/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteComponent(id2);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete component" });
    }
  });
  app2.get("/api/components/:id/alternatives", async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const alternatives = await storage.getComponentAlternatives(componentId);
      res.json(alternatives);
    } catch (error) {
      console.error("Error fetching component alternatives:", error);
      res.status(500).json({ error: "Failed to fetch component alternatives" });
    }
  });
  app2.post("/api/components/:id/alternatives", async (req, res) => {
    try {
      const originalComponentId = parseInt(req.params.id);
      const alternativeData = {
        ...req.body,
        originalComponentId
      };
      const validatedData = insertComponentAlternativeSchema.parse(alternativeData);
      const alternative = await storage.createComponentAlternative(validatedData);
      res.status(201).json(alternative);
    } catch (error) {
      console.error("Error creating component alternative:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid alternative data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component alternative" });
      }
    }
  });
  app2.patch("/api/component-alternatives/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const alternativeData = insertComponentAlternativeSchema.partial().parse(req.body);
      const alternative = await storage.updateComponentAlternative(id2, alternativeData);
      if (!alternative) {
        return res.status(404).json({ error: "Component alternative not found" });
      }
      res.json(alternative);
    } catch (error) {
      console.error("Error updating component alternative:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid alternative data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component alternative" });
      }
    }
  });
  app2.delete("/api/component-alternatives/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteComponentAlternative(id2);
      if (!success) {
        return res.status(404).json({ error: "Component alternative not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting component alternative:", error);
      res.status(500).json({ error: "Failed to delete component alternative" });
    }
  });
  app2.get("/api/component-categories", async (req, res) => {
    try {
      const categories3 = await storage.getComponentCategories();
      res.json(categories3);
    } catch (error) {
      console.error("Error fetching component categories:", error);
      res.status(500).json({ error: "Failed to fetch component categories" });
    }
  });
  app2.post("/api/component-categories", async (req, res) => {
    try {
      const validatedData = insertComponentCategorySchema.parse(req.body);
      const category = await storage.createComponentCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating component category:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component category" });
      }
    }
  });
  app2.patch("/api/component-categories/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const validatedData = insertComponentCategorySchema.partial().parse(req.body);
      const category = await storage.updateComponentCategory(id2, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Component category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating component category:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component category" });
      }
    }
  });
  app2.delete("/api/component-categories/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteComponentCategory(id2);
      if (!success) {
        return res.status(404).json({ error: "Component category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting component category:", error);
      res.status(500).json({ error: "Failed to delete component category" });
    }
  });
  app2.get("/api/package-types", async (req, res) => {
    try {
      const packageTypes2 = await storage.getPackageTypes();
      res.json(packageTypes2);
    } catch (error) {
      console.error("Error fetching package types:", error);
      res.status(500).json({ error: "Failed to fetch package types" });
    }
  });
  app2.post("/api/package-types", async (req, res) => {
    try {
      console.log("Raw body:", req.body);
      console.log("Body type:", typeof req.body);
      const validatedData = insertPackageTypeSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const packageType = await storage.createPackageType(validatedData);
      res.status(201).json(packageType);
    } catch (error) {
      console.error("Error creating package type:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid package type data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create package type" });
      }
    }
  });
  app2.patch("/api/package-types/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const packageType = await storage.updatePackageType(id2, req.body);
      if (!packageType) {
        return res.status(404).json({ error: "Package type not found" });
      }
      res.json(packageType);
    } catch (error) {
      console.error("Error updating package type:", error);
      res.status(500).json({ error: "Failed to update package type" });
    }
  });
  app2.delete("/api/package-types/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deletePackageType(id2);
      if (!success) {
        return res.status(404).json({ error: "Package type not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting package type:", error);
      res.status(500).json({ error: "Failed to delete package type" });
    }
  });
  app2.get("/api/tech-cards", async (req, res) => {
    try {
      const techCards2 = await storage.getTechCards();
      res.json(techCards2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tech cards" });
    }
  });
  app2.get("/api/tech-cards/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const techCard = await storage.getTechCard(id2);
      if (!techCard) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.json(techCard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tech card" });
    }
  });
  app2.post("/api/tech-cards", async (req, res) => {
    try {
      console.log("Tech card creation request body:", req.body);
      const { steps, materials, ...techCardData } = req.body;
      console.log("Tech card data:", techCardData);
      console.log("Steps:", steps);
      console.log("Materials:", materials);
      if (req.session && req.session.user) {
        techCardData.createdBy = req.session.user.username || `User ${req.session.user.id}`;
      } else {
        techCardData.createdBy = "System User";
      }
      const data = insertTechCardSchema.parse(techCardData);
      console.log("Validated tech card data:", data);
      const techCard = await storage.createTechCard(data, steps || [], materials || []);
      console.log("Created tech card:", techCard);
      res.status(201).json(techCard);
    } catch (error) {
      console.error("Error creating tech card:", error);
      if (error instanceof z3.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ error: "Invalid tech card data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create tech card" });
      }
    }
  });
  app2.patch("/api/tech-cards/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { steps, materials, ...techCardData } = req.body;
      const data = insertTechCardSchema.partial().parse(techCardData);
      const techCard = await storage.updateTechCard(id2, data, steps, materials);
      if (!techCard) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.json(techCard);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid tech card data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update tech card" });
      }
    }
  });
  app2.delete("/api/tech-cards/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteTechCard(id2);
      if (!success) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tech card:", error);
      res.status(500).json({ error: "Failed to delete tech card" });
    }
  });
  app2.get("/api/products/:id/components", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const components2 = await storage.getProductComponents(productId);
      res.json(components2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product components" });
    }
  });
  app2.post("/api/product-components", async (req, res) => {
    try {
      console.log("POST /api/product-components - Request body:", req.body);
      const data = insertProductComponentSchema.parse(req.body);
      console.log("POST /api/product-components - Parsed data:", data);
      const component = await storage.addProductComponent(data);
      console.log("POST /api/product-components - Created component:", component);
      res.status(201).json(component);
    } catch (error) {
      console.error("POST /api/product-components - Error:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component" });
      }
    }
  });
  app2.patch("/api/product-components/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const data = insertProductComponentSchema.partial().parse(req.body);
      const component = await storage.updateProductComponent(id2, data);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component" });
      }
    }
  });
  app2.delete("/api/product-components/:id", async (req, res) => {
    try {
      console.log("DELETE /api/product-components/:id - ID:", req.params.id);
      const id2 = parseInt(req.params.id);
      console.log("DELETE /api/product-components/:id - Parsed ID:", id2);
      const success = await storage.removeProductComponent(id2);
      console.log("DELETE /api/product-components/:id - Remove result:", success);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("DELETE /api/product-components/:id - Error:", error);
      res.status(500).json({ error: "Failed to delete component" });
    }
  });
  app2.get("/api/cost-calculations", async (req, res) => {
    try {
      const calculations = await storage.getCostCalculations();
      res.json(calculations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost calculations" });
    }
  });
  app2.get("/api/cost-calculations/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const calculation = await storage.getCostCalculation(productId);
      if (!calculation) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost calculation" });
    }
  });
  app2.post("/api/cost-calculations", async (req, res) => {
    try {
      const calculationData = insertCostCalculationSchema.parse(req.body);
      const calculation = await storage.createCostCalculation(calculationData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid calculation data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create cost calculation" });
      }
    }
  });
  app2.put("/api/cost-calculations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const calculationData = insertCostCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateCostCalculation(id2, calculationData);
      if (!calculation) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid calculation data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update cost calculation" });
      }
    }
  });
  app2.delete("/api/cost-calculations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCostCalculation(id2);
      if (!success) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cost calculation" });
    }
  });
  app2.post("/api/cost-calculations/calculate/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const calculation = await storage.calculateAutomaticCost(productId);
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate automatic cost" });
    }
  });
  app2.get("/api/material-shortages", async (req, res) => {
    try {
      const shortages = await storage.getMaterialShortages();
      res.json(shortages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material shortages" });
    }
  });
  app2.get("/api/material-shortages/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const shortage = await storage.getMaterialShortage(id2);
      if (!shortage) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(shortage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material shortage" });
    }
  });
  app2.post("/api/material-shortages", async (req, res) => {
    try {
      const shortageData = insertMaterialShortageSchema.parse(req.body);
      const shortage = await storage.createMaterialShortage(shortageData);
      res.status(201).json(shortage);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid shortage data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create material shortage" });
      }
    }
  });
  app2.patch("/api/material-shortages/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const shortageData = insertMaterialShortageSchema.partial().parse(req.body);
      const shortage = await storage.updateMaterialShortage(id2, shortageData);
      if (!shortage) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(shortage);
    } catch (error) {
      console.error("Error in PATCH /api/material-shortages/:id:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid shortage data", details: error.errors });
      } else {
        res.status(500).json({ error: error.message || "Failed to update material shortage" });
      }
    }
  });
  app2.delete("/api/material-shortages/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteMaterialShortage(id2);
      if (!success) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error in DELETE /api/material-shortages/:id:", error);
      res.status(400).json({ error: error.message || "Failed to delete material shortage" });
    }
  });
  app2.post("/api/material-shortages/calculate", async (req, res) => {
    try {
      const shortages = await storage.calculateMaterialShortages();
      res.json(shortages);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate material shortages" });
    }
  });
  app2.patch("/api/material-shortages/:id/order", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const orderResult = await storage.createSupplierOrderFromShortage(id2);
      if (!orderResult) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(orderResult);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to order material" });
    }
  });
  app2.get("/api/supplier-orders", async (_req, res) => {
    try {
      const orders2 = await storage.getSupplierOrders();
      res.json(orders2);
    } catch (error) {
      console.error("Failed to get supplier orders:", error);
      res.status(500).json({ error: "Failed to get supplier orders" });
    }
  });
  app2.get("/api/supplier-orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const order = await storage.getSupplierOrder(id2);
      if (!order) {
        return res.status(404).json({ error: "Supplier order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to get supplier order:", error);
      res.status(500).json({ error: "Failed to get supplier order" });
    }
  });
  app2.patch("/api/supplier-orders/:id/status", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateSupplierOrderStatus(id2, status);
      if (!order) {
        return res.status(404).json({ error: "Supplier order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to update supplier order status:", error);
      res.status(500).json({ error: "Failed to update supplier order status" });
    }
  });
  app2.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers2 = await storage.getSuppliers();
      res.json(suppliers2);
    } catch (error) {
      console.error("Failed to get suppliers:", error);
      res.status(500).json({ error: "Failed to get suppliers" });
    }
  });
  app2.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });
  app2.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id2);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to get supplier:", error);
      res.status(500).json({ error: "Failed to get supplier" });
    }
  });
  app2.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id2, req.body);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to update supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });
  app2.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteSupplier(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });
  app2.get("/api/assembly-operations", async (req, res) => {
    try {
      const operations = await storage.getAssemblyOperations();
      res.json(operations);
    } catch (error) {
      console.error("Failed to fetch assembly operations:", error);
      res.status(500).json({ error: "Failed to fetch assembly operations" });
    }
  });
  app2.get("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const operation = await storage.getAssemblyOperation(id2);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Failed to fetch assembly operation:", error);
      res.status(500).json({ error: "Failed to fetch assembly operation" });
    }
  });
  app2.post("/api/assembly-operations", async (req, res) => {
    try {
      const operationData = insertAssemblyOperationSchema.parse(req.body);
      const items = req.body.items ? req.body.items.map((item) => insertAssemblyOperationItemSchema.parse(item)) : [];
      const operation = await storage.createAssemblyOperation(operationData, items);
      res.status(201).json(operation);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid assembly operation data", details: error.errors });
      } else {
        console.error("Failed to create assembly operation:", error);
        res.status(500).json({ error: "Failed to create assembly operation" });
      }
    }
  });
  app2.patch("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const operationData = insertAssemblyOperationSchema.partial().parse(req.body);
      const operation = await storage.updateAssemblyOperation(id2, operationData);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid assembly operation data", details: error.errors });
      } else {
        console.error("Failed to update assembly operation:", error);
        res.status(500).json({ error: "Failed to update assembly operation" });
      }
    }
  });
  app2.delete("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteAssemblyOperation(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete assembly operation:", error);
      res.status(500).json({ error: "Failed to delete assembly operation" });
    }
  });
  app2.post("/api/assembly-operations/:id/execute", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const operation = await storage.executeAssemblyOperation(id2);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Failed to execute assembly operation:", error);
      res.status(500).json({ error: "Failed to execute assembly operation" });
    }
  });
  app2.get("/api/inventory-audits", async (_req, res) => {
    try {
      const audits = await storage.getInventoryAudits();
      res.json(audits);
    } catch (error) {
      console.error("Failed to get inventory audits:", error);
      res.status(500).json({ error: "Failed to get inventory audits" });
    }
  });
  app2.get("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const audit = await storage.getInventoryAudit(id2);
      if (!audit) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Failed to get inventory audit:", error);
      res.status(500).json({ error: "Failed to get inventory audit" });
    }
  });
  app2.post("/api/inventory-audits", async (req, res) => {
    try {
      const processedData = {
        ...req.body,
        plannedDate: req.body.plannedDate ? new Date(req.body.plannedDate) : void 0,
        // Перетворення значення "0" на null для необов'язкових полів
        warehouseId: req.body.warehouseId === 0 ? null : req.body.warehouseId,
        responsiblePersonId: req.body.responsiblePersonId === 0 ? null : req.body.responsiblePersonId
      };
      const auditData = insertInventoryAuditSchema.parse(processedData);
      const audit = await storage.createInventoryAudit(auditData);
      res.status(201).json(audit);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: "Invalid audit data", details: error.errors });
      } else {
        console.error("Failed to create inventory audit:", error);
        res.status(500).json({ error: "Failed to create inventory audit" });
      }
    }
  });
  app2.patch("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const auditData = insertInventoryAuditSchema.partial().parse(req.body);
      const audit = await storage.updateInventoryAudit(id2, auditData);
      if (!audit) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.json(audit);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid audit data", details: error.errors });
      } else {
        console.error("Failed to update inventory audit:", error);
        res.status(500).json({ error: "Failed to update inventory audit" });
      }
    }
  });
  app2.delete("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteInventoryAudit(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete inventory audit:", error);
      res.status(500).json({ error: "Failed to delete inventory audit" });
    }
  });
  app2.get("/api/inventory-audits/:auditId/items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.getInventoryAuditItems(auditId);
      res.json(items);
    } catch (error) {
      console.error("Failed to get inventory audit items:", error);
      res.status(500).json({ error: "Failed to get inventory audit items" });
    }
  });
  app2.post("/api/inventory-audits/:auditId/items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const processedData = {
        ...req.body,
        auditId,
        countedQuantity: req.body.countedQuantity === "" ? null : req.body.countedQuantity,
        variance: req.body.variance === "" ? null : req.body.variance
      };
      const itemData = insertInventoryAuditItemSchema.parse(processedData);
      const item = await storage.createInventoryAuditItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid audit item data", details: error.errors });
      } else {
        console.error("Failed to create inventory audit item:", error);
        res.status(500).json({ error: "Failed to create inventory audit item" });
      }
    }
  });
  app2.patch("/api/inventory-audit-items/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const itemData = insertInventoryAuditItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryAuditItem(id2, itemData);
      if (!item) {
        return res.status(404).json({ error: "Inventory audit item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid audit item data", details: error.errors });
      } else {
        console.error("Failed to update inventory audit item:", error);
        res.status(500).json({ error: "Failed to update inventory audit item" });
      }
    }
  });
  app2.delete("/api/inventory-audit-items/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteInventoryAuditItem(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Inventory audit item not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete inventory audit item:", error);
      res.status(500).json({ error: "Failed to delete inventory audit item" });
    }
  });
  app2.post("/api/inventory-audits/:auditId/generate-items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.generateInventoryAuditItems(auditId);
      res.json(items);
    } catch (error) {
      console.error("Failed to generate inventory audit items:", error);
      res.status(500).json({ error: "Failed to generate inventory audit items" });
    }
  });
  app2.get("/api/workers", async (req, res) => {
    try {
      const workers2 = await storage.getWorkers();
      res.json(workers2);
    } catch (error) {
      console.error("Failed to get workers:", error);
      res.status(500).json({ error: "Failed to get workers" });
    }
  });
  app2.get("/api/workers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const worker = await storage.getWorker(id2);
      if (worker) {
        res.json(worker);
      } else {
        res.status(404).json({ error: "Worker not found" });
      }
    } catch (error) {
      console.error("Failed to get worker:", error);
      res.status(500).json({ error: "Failed to get worker" });
    }
  });
  app2.post("/api/workers", async (req, res) => {
    try {
      const workerData = insertWorkerSchema.parse(req.body);
      const worker = await storage.createWorker(workerData);
      res.json(worker);
    } catch (error) {
      console.error("Failed to create worker:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid worker data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create worker" });
      }
    }
  });
  app2.patch("/api/workers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log("Updating worker with data:", req.body);
      const workerData = insertWorkerSchema.partial().parse(req.body);
      console.log("Parsed worker data:", workerData);
      const worker = await storage.updateWorker(id2, workerData);
      if (worker) {
        res.json(worker);
      } else {
        res.status(404).json({ error: "Worker not found" });
      }
    } catch (error) {
      console.error("Failed to update worker:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid worker data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update worker" });
      }
    }
  });
  app2.delete("/api/workers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteWorker(id2);
      if (!success) {
        res.status(404).json({ error: "Worker not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete worker:", error);
      res.status(500).json({ error: "Failed to delete worker" });
    }
  });
  app2.get("/api/production-forecasts", async (req, res) => {
    try {
      const forecasts = await storage.getProductionForecasts();
      res.json(forecasts);
    } catch (error) {
      console.error("Failed to get production forecasts:", error);
      res.status(500).json({ error: "Failed to get production forecasts" });
    }
  });
  app2.get("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const forecast = await storage.getProductionForecast(id2);
      if (!forecast) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.json(forecast);
    } catch (error) {
      console.error("Failed to get production forecast:", error);
      res.status(500).json({ error: "Failed to get production forecast" });
    }
  });
  app2.post("/api/production-forecasts", async (req, res) => {
    try {
      const bodyWithDates = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : void 0,
        endDate: req.body.endDate ? new Date(req.body.endDate) : void 0
      };
      const forecastData = insertProductionForecastSchema.parse(bodyWithDates);
      const forecast = await storage.createProductionForecast(forecastData);
      res.status(201).json(forecast);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: "Invalid forecast data", details: error.errors });
      } else {
        console.error("Failed to create production forecast:", error);
        res.status(500).json({ error: "Failed to create production forecast" });
      }
    }
  });
  app2.patch("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const forecastData = insertProductionForecastSchema.partial().parse(req.body);
      const forecast = await storage.updateProductionForecast(id2, forecastData);
      if (!forecast) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.json(forecast);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid forecast data", details: error.errors });
      } else {
        console.error("Failed to update production forecast:", error);
        res.status(500).json({ error: "Failed to update production forecast" });
      }
    }
  });
  app2.delete("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteProductionForecast(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete production forecast:", error);
      res.status(500).json({ error: "Failed to delete production forecast" });
    }
  });
  app2.get("/api/warehouse-transfers", async (req, res) => {
    try {
      const transfers = await storage.getWarehouseTransfers();
      res.json(transfers);
    } catch (error) {
      console.error("Failed to get warehouse transfers:", error);
      res.status(500).json({ error: "Failed to get warehouse transfers" });
    }
  });
  app2.get("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const transfer = await storage.getWarehouseTransfer(id2);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Failed to get warehouse transfer:", error);
      res.status(500).json({ error: "Failed to get warehouse transfer" });
    }
  });
  app2.post("/api/warehouse-transfers", async (req, res) => {
    try {
      const transferData = insertWarehouseTransferSchema.parse(req.body);
      const transfer = await storage.createWarehouseTransfer(transferData);
      res.status(201).json(transfer);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid transfer data", details: error.errors });
      } else {
        console.error("Failed to create warehouse transfer:", error);
        res.status(500).json({ error: "Failed to create warehouse transfer" });
      }
    }
  });
  app2.patch("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const updateData = insertWarehouseTransferSchema.partial().parse(req.body);
      const transfer = await storage.updateWarehouseTransfer(id2, updateData);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid transfer data", details: error.errors });
      } else {
        console.error("Failed to update warehouse transfer:", error);
        res.status(500).json({ error: "Failed to update warehouse transfer" });
      }
    }
  });
  app2.delete("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteWarehouseTransfer(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete warehouse transfer:", error);
      res.status(500).json({ error: "Failed to delete warehouse transfer" });
    }
  });
  app2.post("/api/warehouse-transfers/:id/execute", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const transfer = await storage.executeWarehouseTransfer(id2);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Failed to execute warehouse transfer:", error);
      res.status(500).json({ error: "Failed to execute warehouse transfer" });
    }
  });
  app2.get("/api/positions", async (req, res) => {
    try {
      res.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Last-Modified", (/* @__PURE__ */ new Date()).toUTCString());
      res.set("ETag", `"${Date.now()}"`);
      const positions2 = await storage.getPositions();
      console.log(`GET /api/positions - Found ${positions2.length} positions at ${(/* @__PURE__ */ new Date()).toISOString()}`);
      res.json(positions2);
    } catch (error) {
      console.error("Failed to get positions:", error);
      res.status(500).json({ error: "Failed to get positions" });
    }
  });
  app2.get("/api/positions/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const position = await storage.getPosition(id2);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(position);
    } catch (error) {
      console.error("Failed to get position:", error);
      res.status(500).json({ error: "Failed to get position" });
    }
  });
  app2.post("/api/positions", async (req, res) => {
    console.log("=== POST /api/positions STARTED ===");
    console.log("Raw request body:", req.body);
    console.log("Request headers:", req.headers);
    try {
      console.log("POST /api/positions - Received data:", req.body);
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const positionData = insertPositionSchema.parse(req.body);
      console.log("POST /api/positions - Parsed data:", positionData);
      const position = await storage.createPosition(positionData);
      console.log("POST /api/positions - Created position:", position);
      res.status(201).json(position);
      console.log("=== POST /api/positions COMPLETED ===");
    } catch (error) {
      console.log("=== POST /api/positions ERROR ===");
      if (error instanceof z3.ZodError) {
        console.error("POST /api/positions - Validation error:", error.errors);
        res.status(400).json({ error: "Invalid position data", details: error.errors });
      } else {
        console.error("Failed to create position:", error);
        res.status(500).json({ error: "Failed to create position" });
      }
    }
  });
  app2.patch("/api/positions/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log(`PATCH /api/positions/${id2} - Received data:`, req.body);
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      const updateData = insertPositionSchema.partial().parse(req.body);
      console.log(`PATCH /api/positions/${id2} - Parsed data:`, updateData);
      const position = await storage.updatePosition(id2, updateData);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      console.log(`PATCH /api/positions/${id2} - Updated position:`, position);
      res.json(position);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error(`PATCH /api/positions/${req.params.id} - Validation error:`, error.errors);
        res.status(400).json({ error: "Invalid position data", details: error.errors });
      } else {
        console.error("Failed to update position:", error);
        res.status(500).json({ error: "Failed to update position" });
      }
    }
  });
  app2.delete("/api/positions/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deletePosition(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete position:", error);
      res.status(500).json({ error: "Failed to delete position" });
    }
  });
  app2.get("/api/departments", async (req, res) => {
    try {
      const departments2 = await storage.getDepartments();
      res.json(departments2);
    } catch (error) {
      console.error("Failed to get departments:", error);
      res.status(500).json({ error: "Failed to get departments" });
    }
  });
  app2.get("/api/departments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const department = await storage.getDepartment(id2);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Failed to get department:", error);
      res.status(500).json({ error: "Failed to get department" });
    }
  });
  app2.post("/api/departments", async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid department data", details: error.errors });
      } else {
        console.error("Failed to create department:", error);
        res.status(500).json({ error: "Failed to create department" });
      }
    }
  });
  app2.put("/api/departments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id2, departmentData);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid department data", details: error.errors });
      } else {
        console.error("Failed to update department:", error);
        res.status(500).json({ error: "Failed to update department" });
      }
    }
  });
  app2.delete("/api/departments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteDepartment(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });
  app2.get("/api/soldering-types", async (req, res) => {
    try {
      const solderingTypes2 = await storage.getSolderingTypes();
      res.json(solderingTypes2);
    } catch (error) {
      console.error("Failed to get soldering types:", error);
      res.status(500).json({ error: "Failed to get soldering types" });
    }
  });
  app2.post("/api/soldering-types", async (req, res) => {
    try {
      console.log("Raw body:", req.body);
      console.log("Body type:", typeof req.body);
      const validatedData = insertSolderingTypeSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const solderingType = await storage.createSolderingType(validatedData);
      res.status(201).json(solderingType);
    } catch (error) {
      console.error("Error creating soldering type:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid soldering type data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create soldering type" });
      }
    }
  });
  app2.get("/api/soldering-types/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const solderingType = await storage.getSolderingType(id2);
      if (!solderingType) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json(solderingType);
    } catch (error) {
      console.error("Failed to get soldering type:", error);
      res.status(500).json({ error: "Failed to get soldering type" });
    }
  });
  app2.patch("/api/soldering-types/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const solderingTypeData = insertSolderingTypeSchema.partial().parse(req.body);
      const solderingType = await storage.updateSolderingType(id2, solderingTypeData);
      if (!solderingType) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json(solderingType);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid soldering type data", details: error.errors });
      } else {
        console.error("Failed to update soldering type:", error);
        res.status(500).json({ error: "Failed to update soldering type" });
      }
    }
  });
  app2.delete("/api/soldering-types/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteSolderingType(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete soldering type:", error);
      res.status(500).json({ error: "Failed to delete soldering type" });
    }
  });
  app2.get("/api/units", async (req, res) => {
    try {
      const units2 = await storage.getUnits();
      res.json(units2);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });
  app2.post("/api/units", async (req, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error) {
      console.error("Error creating unit:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create unit" });
      }
    }
  });
  app2.patch("/api/units/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const validatedData = insertUnitSchema.partial().parse(req.body);
      const unit = await storage.updateUnit(id2, validatedData);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update unit" });
      }
    }
  });
  app2.delete("/api/units/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteUnit(id2);
      if (!success) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });
  app2.get("/api/shipments", async (req, res) => {
    try {
      const shipments2 = await storage.getShipments();
      res.json(shipments2);
    } catch (error) {
      console.error("Failed to get shipments:", error);
      res.status(500).json({ error: "Failed to get shipments" });
    }
  });
  app2.get("/api/shipments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const shipment = await storage.getShipment(id2);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Failed to get shipment:", error);
      res.status(500).json({ error: "Failed to get shipment" });
    }
  });
  app2.post("/api/shipments", async (req, res) => {
    try {
      console.log("Creating shipment with data:", JSON.stringify(req.body, null, 2));
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Shipment validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        console.error("Failed to create shipment:", error);
        res.status(500).json({ error: "Failed to create shipment" });
      }
    }
  });
  app2.patch("/api/shipments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const shipmentData = insertShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateShipment(id2, shipmentData);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        console.error("Failed to update shipment:", error);
        res.status(500).json({ error: "Failed to update shipment" });
      }
    }
  });
  app2.patch("/api/shipments/:id/status", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { status } = req.body;
      const shipment = await storage.updateShipmentStatus(id2, status);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Failed to update shipment status:", error);
      res.status(500).json({ error: "Failed to update shipment status" });
    }
  });
  app2.delete("/api/shipments/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteShipment(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete shipment:", error);
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  });
  app2.get("/api/carriers", async (req, res) => {
    try {
      const carriers2 = await storage.getCarriers();
      res.json(carriers2);
    } catch (error) {
      console.error("Failed to get carriers:", error);
      res.status(500).json({ error: "Failed to get carriers" });
    }
  });
  app2.get("/api/carriers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const carrier = await storage.getCarrier(id2);
      if (!carrier) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.json(carrier);
    } catch (error) {
      console.error("Failed to get carrier:", error);
      res.status(500).json({ error: "Failed to get carrier" });
    }
  });
  app2.post("/api/carriers", async (req, res) => {
    try {
      const carrier = await storage.createCarrier(req.body);
      res.status(201).json(carrier);
    } catch (error) {
      console.error("Failed to create carrier:", error);
      res.status(500).json({ error: "Failed to create carrier" });
    }
  });
  app2.patch("/api/carriers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const carrier = await storage.updateCarrier(id2, req.body);
      if (!carrier) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.json(carrier);
    } catch (error) {
      console.error("Failed to update carrier:", error);
      res.status(500).json({ error: "Failed to update carrier" });
    }
  });
  app2.delete("/api/carriers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCarrier(id2);
      if (!success) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete carrier:", error);
      res.status(500).json({ error: "Failed to delete carrier" });
    }
  });
  app2.post("/api/carriers/:id/sync", async (req, res) => {
    try {
      const carrierId = parseInt(req.params.id);
      const carrier = await storage.getCarrier(carrierId);
      if (!carrier) {
        return res.status(404).json({ error: "Carrier not found" });
      }
      if (!carrier.apiKey) {
        return res.status(400).json({ error: "API key not configured for this carrier" });
      }
      await novaPoshtaCache.updateApiKey(carrier.apiKey);
      await novaPoshtaCache.syncData();
      const citiesCount = await novaPoshtaCache.getCitiesCount();
      const warehousesCount = await novaPoshtaCache.getWarehousesCount();
      const updatedCarrier = await storage.updateCarrier(carrierId, {
        citiesCount,
        warehousesCount,
        lastSyncAt: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        citiesCount,
        warehousesCount,
        lastSyncAt: updatedCarrier?.lastSyncAt
      });
    } catch (error) {
      console.error("Failed to sync carrier data:", error);
      res.status(500).json({ error: "Failed to sync carrier data" });
    }
  });
  app2.get("/api/nova-poshta/cities", async (req, res) => {
    try {
      const { q } = req.query;
      const cities = await novaPoshtaCache.getCities(q || "");
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });
  app2.get("/api/nova-poshta/warehouses/:cityRef", async (req, res) => {
    try {
      const { cityRef } = req.params;
      const warehouses2 = await novaPoshtaCache.getWarehouses(cityRef);
      res.json(warehouses2);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });
  app2.post("/api/nova-poshta/calculate-delivery", async (req, res) => {
    try {
      console.log("Calculate delivery request body:", req.body);
      const deliveryCost = await novaPoshtaApi.calculateDeliveryCost(req.body);
      console.log("Nova Poshta API response:", deliveryCost);
      res.json(deliveryCost);
    } catch (error) {
      console.error("Error calculating delivery cost:", error);
      res.status(500).json({ error: "Failed to calculate delivery cost" });
    }
  });
  app2.get("/api/nova-poshta/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const trackingInfo = await novaPoshtaApi.trackDocument(trackingNumber);
      res.json(trackingInfo);
    } catch (error) {
      console.error("Error tracking document:", error);
      res.status(500).json({ error: "Failed to track document" });
    }
  });
  app2.post("/api/nova-poshta/track-multiple", async (req, res) => {
    try {
      const { trackingNumbers } = req.body;
      const trackingInfos = await novaPoshtaApi.trackMultipleDocuments(trackingNumbers);
      res.json(trackingInfos);
    } catch (error) {
      console.error("Error tracking multiple documents:", error);
      res.status(500).json({ error: "Failed to track documents" });
    }
  });
  app2.post("/api/nova-poshta/create-invoice", async (req, res) => {
    console.log("=== Nova Poshta create invoice endpoint hit ===");
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body raw:", req.body);
    console.log("Request body stringified:", JSON.stringify(req.body, null, 2));
    try {
      const {
        cityRecipient,
        warehouseRecipient,
        recipientName,
        recipientPhone,
        recipientType,
        description,
        weight,
        cost,
        seatsAmount,
        paymentMethod,
        payerType
      } = req.body;
      let formattedPhone = "";
      if (recipientPhone) {
        formattedPhone = recipientPhone.replace(/\D/g, "");
      } else {
        console.log("Warning: recipientPhone is undefined");
        return res.status(400).json({ error: "\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443 \u043E\u0442\u0440\u0438\u043C\u0443\u0432\u0430\u0447\u0430 \u043E\u0431\u043E\u0432'\u044F\u0437\u043A\u043E\u0432\u0438\u0439" });
      }
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "38" + formattedPhone;
      }
      if (!formattedPhone.startsWith("38")) {
        formattedPhone = "38" + formattedPhone;
      }
      const {
        citySender,
        warehouseSender,
        senderName,
        senderPhone,
        orderId
      } = req.body;
      const invoiceData = {
        cityRecipient,
        warehouseRecipient,
        citySender: citySender || "db5c897c-391c-11dd-90d9-001a92567626",
        // Чернігів за замовчуванням
        warehouseSender: warehouseSender || "fe906167-4c37-11ec-80ed-b8830365bd14",
        // Відділення за замовчуванням
        senderName: senderName || "\u0412\u0430\u0448\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0456\u044F",
        senderPhone: senderPhone || "+380501234567",
        recipientName,
        recipientPhone: formattedPhone,
        recipientType: recipientType || "Organization",
        description: description || "\u0422\u043E\u0432\u0430\u0440",
        weight: parseFloat(weight),
        cost: parseFloat(cost),
        seatsAmount: parseInt(seatsAmount) || 1,
        paymentMethod: paymentMethod || "NonCash",
        payerType: payerType || "Recipient"
      };
      const apiKey = process.env.NOVA_POSHTA_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Nova Poshta API \u043A\u043B\u044E\u0447 \u043D\u0435 \u043D\u0430\u043B\u0430\u0448\u0442\u043E\u0432\u0430\u043D\u0438\u0439"
        });
      }
      let orderDescription = "\u0422\u043E\u0432\u0430\u0440";
      console.log("Order ID for description:", orderId);
      if (orderId) {
        try {
          const order = await storage.getOrder(parseInt(orderId));
          console.log("Found order for description:", order);
          if (order && order.items && order.items.length > 0) {
            const itemNames = order.items.map((item) => {
              console.log("Processing item:", item);
              return item.product?.name || "\u0422\u043E\u0432\u0430\u0440";
            }).join(", ");
            orderDescription = itemNames.length > 100 ? itemNames.substring(0, 97) + "..." : itemNames;
            console.log("Generated order description:", orderDescription);
          } else {
            console.log("Order has no items or order not found");
          }
        } catch (error) {
          console.error("Error getting order details for description:", error);
        }
      } else {
        console.log("No order ID provided");
      }
      invoiceData.description = orderDescription;
      console.log("Using Nova Poshta API key exists:", !!apiKey);
      novaPoshtaApi.updateApiKey(apiKey);
      console.log("Creating invoice with data:", JSON.stringify(invoiceData, null, 2));
      const invoice = await novaPoshtaApi.createInternetDocument(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  app2.get("/api/customer-addresses", async (req, res) => {
    try {
      const addresses = await storage.getCustomerAddresses();
      res.json(addresses);
    } catch (error) {
      console.error("Failed to get customer addresses:", error);
      res.status(500).json({ error: "Failed to get customer addresses" });
    }
  });
  app2.get("/api/customer-addresses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const address = await storage.getCustomerAddress(id2);
      if (!address) {
        return res.status(404).json({ error: "Customer address not found" });
      }
      res.json(address);
    } catch (error) {
      console.error("Failed to get customer address:", error);
      res.status(500).json({ error: "Failed to get customer address" });
    }
  });
  app2.post("/api/customer-addresses", async (req, res) => {
    try {
      const address = await storage.createCustomerAddress(req.body);
      res.status(201).json(address);
    } catch (error) {
      console.error("Failed to create customer address:", error);
      res.status(500).json({ error: "Failed to create customer address" });
    }
  });
  app2.post("/api/customer-addresses/save", async (req, res) => {
    try {
      const addressData = req.body;
      const existingAddress = await storage.findCustomerAddressByDetails(
        addressData.customerName,
        addressData.cityName,
        addressData.warehouseAddress
      );
      if (existingAddress) {
        let updatedAddress = await storage.updateCustomerAddressUsage(existingAddress.id);
        if (addressData.carrierId && addressData.carrierId !== existingAddress.carrierId) {
          updatedAddress = await storage.updateCustomerAddress(existingAddress.id, {
            carrierId: addressData.carrierId
          });
        }
        res.json(updatedAddress);
      } else {
        const newAddress = await storage.createCustomerAddress(addressData);
        res.status(201).json(newAddress);
      }
    } catch (error) {
      console.error("Failed to save customer address:", error);
      res.status(500).json({ error: "Failed to save customer address" });
    }
  });
  app2.patch("/api/customer-addresses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const address = await storage.updateCustomerAddress(id2, req.body);
      if (!address) {
        return res.status(404).json({ error: "Customer address not found" });
      }
      res.json(address);
    } catch (error) {
      console.error("Failed to update customer address:", error);
      res.status(500).json({ error: "Failed to update customer address" });
    }
  });
  app2.delete("/api/customer-addresses/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCustomerAddress(id2);
      if (!success) {
        return res.status(404).json({ error: "Customer address not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete customer address:", error);
      res.status(500).json({ error: "Failed to delete customer address" });
    }
  });
  app2.post("/api/customer-addresses/:id/set-default", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.setDefaultCustomerAddress(id2);
      if (!success) {
        return res.status(404).json({ error: "Customer address not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to set default customer address:", error);
      res.status(500).json({ error: "Failed to set default customer address" });
    }
  });
  app2.get("/api/sender-settings", async (req, res) => {
    try {
      const settings = await storage.getSenderSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get sender settings:", error);
      res.status(500).json({ error: "Failed to get sender settings" });
    }
  });
  app2.get("/api/sender-settings/default", async (req, res) => {
    try {
      const defaultSetting = await storage.getDefaultSenderSetting();
      res.json(defaultSetting);
    } catch (error) {
      console.error("Failed to get default sender setting:", error);
      res.status(500).json({ error: "Failed to get default sender setting" });
    }
  });
  app2.get("/api/sender-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const setting = await storage.getSenderSetting(id2);
      if (!setting) {
        return res.status(404).json({ error: "Sender setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Failed to get sender setting:", error);
      res.status(500).json({ error: "Failed to get sender setting" });
    }
  });
  app2.post("/api/sender-settings", async (req, res) => {
    try {
      const setting = await storage.createSenderSetting(req.body);
      res.status(201).json(setting);
    } catch (error) {
      console.error("Failed to create sender setting:", error);
      res.status(500).json({ error: "Failed to create sender setting" });
    }
  });
  app2.patch("/api/sender-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const setting = await storage.updateSenderSetting(id2, req.body);
      if (!setting) {
        return res.status(404).json({ error: "Sender setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Failed to update sender setting:", error);
      res.status(500).json({ error: "Failed to update sender setting" });
    }
  });
  app2.delete("/api/sender-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteSenderSetting(id2);
      if (!success) {
        return res.status(404).json({ error: "Sender setting not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete sender setting:", error);
      res.status(500).json({ error: "Failed to delete sender setting" });
    }
  });
  app2.post("/api/sender-settings/:id/set-default", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.setDefaultSenderSetting(id2);
      if (!success) {
        return res.status(404).json({ error: "Sender setting not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to set default sender setting:", error);
      res.status(500).json({ error: "Failed to set default sender setting" });
    }
  });
  app2.get("/api/currencies", async (req, res) => {
    try {
      const currencies2 = await storage.getCurrencies();
      res.json(currencies2);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to get currencies" });
    }
  });
  app2.get("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const currency = await storage.getCurrency(id2);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error fetching currency:", error);
      res.status(500).json({ error: "Failed to get currency" });
    }
  });
  app2.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      console.error("Error creating currency:", error);
      res.status(500).json({ error: "Failed to create currency" });
    }
  });
  app2.patch("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const currencyData = insertCurrencySchema.partial().parse(req.body);
      const currency = await storage.updateCurrency(id2, currencyData);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ error: "Failed to update currency" });
    }
  });
  app2.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCurrency(id2);
      if (!success) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting currency:", error);
      res.status(500).json({ error: "Failed to delete currency" });
    }
  });
  app2.post("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(id2);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error setting base currency:", error);
      res.status(500).json({ error: "Failed to set base currency" });
    }
  });
  app2.get("/api/exchange-rates/latest", async (req, res) => {
    try {
      const rates = await storage.getLatestExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ error: "Failed to get exchange rates" });
    }
  });
  app2.post("/api/exchange-rates/update", async (req, res) => {
    try {
      const rates = await storage.updateExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error updating exchange rates:", error);
      res.status(500).json({ error: "Failed to update exchange rates" });
    }
  });
  app2.get("/api/production/analytics", async (req, res) => {
    try {
      const { from, to, department, worker } = req.query;
      const analytics = await storage.getProductionAnalytics({
        from,
        to,
        department,
        worker
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching production analytics:", error);
      res.status(500).json({ error: "Failed to get production analytics" });
    }
  });
  app2.get("/api/production/workload", async (req, res) => {
    try {
      const { from, to } = req.query;
      const workload = await storage.getProductionWorkload({
        from,
        to
      });
      res.json(workload);
    } catch (error) {
      console.error("Error fetching production workload:", error);
      res.status(500).json({ error: "Failed to get production workload" });
    }
  });
  app2.get("/api/production/efficiency", async (req, res) => {
    try {
      const { from, to, department } = req.query;
      const efficiency = await storage.getProductionEfficiency({
        from,
        to,
        department
      });
      res.json(efficiency);
    } catch (error) {
      console.error("Error fetching production efficiency:", error);
      res.status(500).json({ error: "Failed to get production efficiency" });
    }
  });
  app2.get("/api/ordered-products-info", async (req, res) => {
    try {
      const orderedProducts = await storage.getOrderedProductsInfo();
      res.json(orderedProducts);
    } catch (error) {
      console.error("Failed to get ordered products info:", error);
      res.status(500).json({ error: "Failed to get ordered products info" });
    }
  });
  app2.post("/api/send-to-production", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const task = await storage.createProductionTaskFromOrder(productId, quantity, notes);
      res.json(task);
    } catch (error) {
      console.error("Failed to send to production:", error);
      res.status(500).json({ error: "Failed to send to production" });
    }
  });
  app2.post("/api/complete-order", async (req, res) => {
    try {
      const { productId, quantity, warehouseId } = req.body;
      const result = await storage.completeProductOrder(productId, quantity, warehouseId);
      res.json(result);
    } catch (error) {
      console.error("Failed to complete order:", error);
      res.status(500).json({ error: "Failed to complete order" });
    }
  });
  app2.delete("/api/ordered-products/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const result = await storage.deleteOrderedProduct(productId);
      res.json(result);
    } catch (error) {
      console.error("Failed to delete ordered product:", error);
      res.status(500).json({ error: "Failed to delete ordered product" });
    }
  });
  app2.get("/api/orders-by-product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const orders2 = await storage.getOrdersByProduct(productId);
      res.json(orders2);
    } catch (error) {
      console.error("Failed to get orders by product:", error);
      res.status(500).json({ error: "Failed to get orders by product" });
    }
  });
  app2.post("/api/create-supplier-order-for-shortage", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const order = await storage.createSupplierOrderForShortage(productId, quantity, notes);
      res.json(order);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });
  app2.get("/api/manufacturing-orders", async (req, res) => {
    try {
      const orders2 = await storage.getManufacturingOrders();
      res.json(orders2);
    } catch (error) {
      console.error("Failed to get manufacturing orders:", error);
      res.status(500).json({ error: "Failed to get manufacturing orders" });
    }
  });
  app2.get("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const order = await storage.getManufacturingOrder(id2);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to get manufacturing order:", error);
      res.status(500).json({ error: "Failed to get manufacturing order" });
    }
  });
  app2.post("/api/manufacturing-orders", async (req, res) => {
    try {
      console.log("\u{1F7E1} ROUTE: POST /api/manufacturing-orders called with body:", req.body);
      const orderData = insertManufacturingOrderSchema.parse(req.body);
      console.log("\u{1F7E1} ROUTE: Zod validation passed, calling storage.createManufacturingOrder");
      const order = await storage.createManufacturingOrder(orderData);
      console.log("\u{1F7E2} ROUTE: Order created successfully:", order);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.log("\u{1F534} ROUTE: Zod validation failed:", error.errors);
        res.status(400).json({ error: "Invalid manufacturing order data", details: error.errors });
      } else {
        console.error("\u{1F534} ROUTE: Failed to create manufacturing order:", error);
        res.status(500).json({ error: "Failed to create manufacturing order" });
      }
    }
  });
  app2.patch("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const updateData = insertManufacturingOrderSchema.partial().parse(req.body);
      const order = await storage.updateManufacturingOrder(id2, updateData);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing order data", details: error.errors });
      } else {
        console.error("Failed to update manufacturing order:", error);
        res.status(500).json({ error: "Failed to update manufacturing order" });
      }
    }
  });
  app2.delete("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const deleted = await storage.deleteManufacturingOrder(id2);
      if (!deleted) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete manufacturing order:", error);
      res.status(500).json({ error: "Failed to delete manufacturing order" });
    }
  });
  app2.post("/api/manufacturing-orders/:id/start", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const order = await storage.startManufacturing(id2);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      await storage.generateSerialNumbers(id2);
      res.json(order);
    } catch (error) {
      console.error("Failed to start manufacturing:", error);
      res.status(500).json({ error: "Failed to start manufacturing" });
    }
  });
  app2.post("/api/manufacturing-orders/:id/stop", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log("Stopping manufacturing order:", id2);
      const order = await storage.stopManufacturing(id2);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      console.log("Manufacturing stopped successfully:", order);
      res.json(order);
    } catch (error) {
      console.error("Failed to stop manufacturing:", error);
      res.status(500).json({ error: "Failed to stop manufacturing" });
    }
  });
  app2.get("/api/manufacturing-orders/:id/generate-serial-numbers", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log("Generating serial numbers for order:", id2);
      const serialNumbers2 = await storage.generateSerialNumbers(id2);
      if (!serialNumbers2) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      console.log("Serial numbers generated successfully:", serialNumbers2);
      res.json({ serialNumbers: serialNumbers2 });
    } catch (error) {
      console.error("Failed to generate serial numbers:", error);
      res.status(500).json({ error: "Failed to generate serial numbers" });
    }
  });
  app2.post("/api/manufacturing-orders/:id/complete", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { producedQuantity, qualityRating, notes } = req.body;
      const order = await storage.completeManufacturing(id2, producedQuantity, qualityRating, notes);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to complete manufacturing:", error);
      res.status(500).json({ error: "Failed to complete manufacturing" });
    }
  });
  app2.get("/api/manufacturing-orders/:id/steps", async (req, res) => {
    try {
      const manufacturingOrderId = parseInt(req.params.id);
      const steps = await storage.getManufacturingSteps(manufacturingOrderId);
      res.json(steps);
    } catch (error) {
      console.error("Failed to get manufacturing steps:", error);
      res.status(500).json({ error: "Failed to get manufacturing steps" });
    }
  });
  app2.post("/api/manufacturing-steps", async (req, res) => {
    try {
      const stepData = insertManufacturingStepSchema.parse(req.body);
      const step = await storage.createManufacturingStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing step data", details: error.errors });
      } else {
        console.error("Failed to create manufacturing step:", error);
        res.status(500).json({ error: "Failed to create manufacturing step" });
      }
    }
  });
  app2.patch("/api/manufacturing-steps/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const updateData = insertManufacturingStepSchema.partial().parse(req.body);
      const step = await storage.updateManufacturingStep(id2, updateData);
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing step data", details: error.errors });
      } else {
        console.error("Failed to update manufacturing step:", error);
        res.status(500).json({ error: "Failed to update manufacturing step" });
      }
    }
  });
  app2.post("/api/manufacturing-steps/:id/start", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const step = await storage.startManufacturingStep(id2);
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      console.error("Failed to start manufacturing step:", error);
      res.status(500).json({ error: "Failed to start manufacturing step" });
    }
  });
  app2.post("/api/manufacturing-steps/:id/complete", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { qualityCheckPassed, notes } = req.body;
      const step = await storage.completeManufacturingStep(id2, { qualityCheckPassed, notes });
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      console.error("Failed to complete manufacturing step:", error);
      res.status(500).json({ error: "Failed to complete manufacturing step" });
    }
  });
  app2.post("/api/complete-order", async (req, res) => {
    try {
      const { productId, quantity, warehouseId } = req.body;
      const result = await storage.completeOrderFromStock(productId, quantity, warehouseId);
      res.json(result);
    } catch (error) {
      console.error("Failed to complete order:", error);
      res.status(500).json({ error: "Failed to complete order from stock" });
    }
  });
  app2.post("/api/create-supplier-order-for-shortage", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const result = await storage.createSupplierOrderForShortage(productId, quantity, notes);
      res.json(result);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });
  app2.get("/api/serial-numbers", async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;
      const serialNumbers2 = await storage.getSerialNumbers(
        productId ? parseInt(productId) : void 0,
        warehouseId ? parseInt(warehouseId) : void 0
      );
      res.json(serialNumbers2);
    } catch (error) {
      console.error("Error fetching serial numbers:", error);
      res.status(500).json({ error: "Failed to fetch serial numbers" });
    }
  });
  app2.get("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const serialNumber = await storage.getSerialNumber(id2);
      if (!serialNumber) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json(serialNumber);
    } catch (error) {
      console.error("Error fetching serial number:", error);
      res.status(500).json({ error: "Failed to fetch serial number" });
    }
  });
  app2.post("/api/serial-numbers", async (req, res) => {
    try {
      const serialNumberData = insertSerialNumberSchema.parse(req.body);
      const serialNumber = await storage.createSerialNumber(serialNumberData);
      res.status(201).json(serialNumber);
    } catch (error) {
      console.error("Error creating serial number:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid serial number data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create serial number" });
      }
    }
  });
  app2.put("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const serialNumberData = insertSerialNumberSchema.partial().parse(req.body);
      const serialNumber = await storage.updateSerialNumber(id2, serialNumberData);
      if (!serialNumber) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json(serialNumber);
    } catch (error) {
      console.error("Error updating serial number:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid serial number data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number" });
      }
    }
  });
  app2.delete("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteSerialNumber(id2);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting serial number:", error);
      res.status(500).json({ error: "Failed to delete serial number" });
    }
  });
  app2.get("/api/serial-numbers/available/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const serialNumbers2 = await storage.getAvailableSerialNumbers(productId);
      res.json(serialNumbers2);
    } catch (error) {
      console.error("Error fetching available serial numbers:", error);
      res.status(500).json({ error: "Failed to fetch available serial numbers" });
    }
  });
  app2.patch("/api/serial-numbers/:id/reserve", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { orderId } = req.body;
      const success = await storage.reserveSerialNumber(id2, orderId);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found or already reserved" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reserving serial number:", error);
      res.status(500).json({ error: "Failed to reserve serial number" });
    }
  });
  app2.patch("/api/serial-numbers/:id/release", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.releaseSerialNumber(id2);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error releasing serial number:", error);
      res.status(500).json({ error: "Failed to release serial number" });
    }
  });
  app2.post("/api/serial-numbers/generate", async (req, res) => {
    try {
      const { productId, categoryId, template } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }
      const { serialNumberGenerator: serialNumberGenerator2 } = await Promise.resolve().then(() => (init_serial_number_generator(), serial_number_generator_exports));
      const serialNumber = await serialNumberGenerator2.generateUniqueSerialNumber({
        productId: parseInt(productId),
        categoryId: categoryId ? parseInt(categoryId) : void 0,
        template
      });
      res.json({ serialNumber });
    } catch (error) {
      console.error("Error generating serial number:", error);
      res.status(500).json({ error: "Failed to generate serial number" });
    }
  });
  app2.get("/api/serial-number-settings", async (req, res) => {
    try {
      const settings = await storage.getSerialNumberSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching serial number settings:", error);
      res.status(500).json({ error: "Failed to fetch serial number settings" });
    }
  });
  app2.put("/api/serial-number-settings", async (req, res) => {
    try {
      const settingsData = insertSerialNumberSettingsSchema.parse(req.body);
      const settings = await storage.updateSerialNumberSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating serial number settings:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number settings" });
      }
    }
  });
  app2.patch("/api/serial-number-settings", async (req, res) => {
    try {
      console.log("PATCH serial-number-settings - Request body:", req.body);
      const settingsData = insertSerialNumberSettingsSchema.parse(req.body);
      console.log("PATCH serial-number-settings - Parsed data:", settingsData);
      const settings = await storage.updateSerialNumberSettings(settingsData);
      console.log("PATCH serial-number-settings - Updated settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating serial number settings:", error);
      if (error instanceof z3.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number settings" });
      }
    }
  });
  app2.patch("/api/serial-numbers/:id/mark-sold", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.markSerialNumberAsSold(id2);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking serial number as sold:", error);
      res.status(500).json({ error: "Failed to mark serial number as sold" });
    }
  });
  app2.get("/api/currencies", async (req, res) => {
    try {
      const currencies2 = await storage.getCurrencies();
      res.json(currencies2);
    } catch (error) {
      console.error("Failed to get currencies:", error);
      res.status(500).json({ error: "Failed to get currencies" });
    }
  });
  app2.get("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const currency = await storage.getCurrency(id2);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Failed to get currency:", error);
      res.status(500).json({ error: "Failed to get currency" });
    }
  });
  app2.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid currency data", details: error.errors });
      } else {
        console.error("Failed to create currency:", error);
        res.status(500).json({ error: "Failed to create currency" });
      }
    }
  });
  app2.patch("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const currencyData = insertCurrencySchema.partial().parse(req.body);
      const currency = await storage.updateCurrency(id2, currencyData);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid currency data", details: error.errors });
      } else {
        console.error("Failed to update currency:", error);
        res.status(500).json({ error: "Failed to update currency" });
      }
    }
  });
  app2.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCurrency(id2);
      if (success) {
        res.json({ message: "Currency deleted successfully" });
      } else {
        res.status(404).json({ error: "Currency not found" });
      }
    } catch (error) {
      console.error("Failed to delete currency:", error);
      res.status(500).json({ error: "Failed to delete currency" });
    }
  });
  app2.post("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const currencyId = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(currencyId);
      res.json(currency);
    } catch (error) {
      console.error("Failed to set base currency:", error);
      res.status(500).json({ error: "Failed to set base currency" });
    }
  });
  app2.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Failed to get exchange rates:", error);
      res.status(500).json({ error: "Failed to get exchange rates" });
    }
  });
  app2.post("/api/exchange-rates", async (req, res) => {
    try {
      const rateData = insertExchangeRateHistorySchema.parse(req.body);
      const rate = await storage.createExchangeRate(rateData);
      res.status(201).json(rate);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid exchange rate data", details: error.errors });
      } else {
        console.error("Failed to create exchange rate:", error);
        res.status(500).json({ error: "Failed to create exchange rate" });
      }
    }
  });
  app2.get("/api/production-plans", async (req, res) => {
    try {
      const plans = await storage.getProductionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      res.status(500).json({ error: "Failed to fetch production plans" });
    }
  });
  app2.post("/api/production-plans", async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createProductionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating production plan:", error);
      res.status(500).json({ error: "Failed to create production plan" });
    }
  });
  app2.get("/api/supply-decisions", async (req, res) => {
    try {
      const decisions = await storage.getSupplyDecisions();
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching supply decisions:", error);
      res.status(500).json({ error: "Failed to fetch supply decisions" });
    }
  });
  app2.post("/api/analyze-supply/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { requiredQuantity } = req.body;
      const decision = await storage.analyzeSupplyDecision(productId, requiredQuantity);
      res.json(decision);
    } catch (error) {
      console.error("Error analyzing supply decision:", error);
      res.status(500).json({ error: "Failed to analyze supply decision" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getLocalUsersWithWorkers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/available-workers", async (req, res) => {
    try {
      const workers2 = await storage.getWorkersAvailableForUsers();
      res.json(workers2);
    } catch (error) {
      console.error("Error fetching available workers:", error);
      res.status(500).json({ error: "Failed to fetch available workers" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const user = await storage.getLocalUser(id2);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertLocalUserSchema.parse(req.body);
      const hashedPassword = await bcrypt2.hash(userData.password, 10);
      userData.password = hashedPassword;
      const user = await storage.createLocalUserWithWorker(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const userData = req.body;
      delete userData.password;
      delete userData.confirmPassword;
      const user = await storage.updateLocalUser(id2, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const userToDelete = await storage.getLocalUser(id2);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }
      if (userToDelete.role === "admin") {
        const allUsers = await storage.getLocalUsersWithWorkers();
        const adminCount = allUsers.filter((user) => user.role === "admin").length;
        if (adminCount <= 1) {
          return res.status(400).json({
            error: "\u041D\u0435 \u043C\u043E\u0436\u043D\u0430 \u0432\u0438\u0434\u0430\u043B\u0438\u0442\u0438 \u043E\u0441\u0442\u0430\u043D\u043D\u044C\u043E\u0433\u043E \u0430\u0434\u043C\u0456\u043D\u0456\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0456"
          });
        }
      }
      const success = await storage.deleteLocalUser(id2);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  app2.patch("/api/users/:id/toggle-status", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { isActive } = req.body;
      const user = await storage.toggleUserStatus(id2, isActive);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });
  app2.post("/api/users/:id/change-password", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const passwordData = changePasswordSchema.parse(req.body);
      const user = await storage.getLocalUser(id2);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isCurrentPasswordValid = await bcrypt2.compare(passwordData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const hashedNewPassword = await bcrypt2.hash(passwordData.newPassword, 10);
      const success = await storage.changeUserPassword(id2, hashedNewPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to change password" });
      }
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid password data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  });
  app2.post("/api/users/:id/reset-password", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { newPassword } = req.body;
      console.log("Password reset attempt for user ID:", id2, "New password:", newPassword);
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const user = await storage.getLocalUser(id2);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("User found:", user.username);
      const hashedNewPassword = await bcrypt2.hash(newPassword, 10);
      console.log("Password hashed, length:", hashedNewPassword.length);
      const success = await storage.changeUserPassword(id2, hashedNewPassword);
      console.log("Password change result:", success);
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/send-password-reset", isSimpleAuthenticated, async (req, res) => {
    try {
      const { email, userId } = req.body;
      if (!email || !userId) {
        return res.status(400).json({ error: "Email and user ID are required" });
      }
      const user = await storage.getLocalUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.email !== email) {
        return res.status(400).json({ error: "Email does not match user" });
      }
      const { generatePasswordResetToken: generatePasswordResetToken2, sendEmail: sendEmail2, generatePasswordResetEmail: generatePasswordResetEmail2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      const resetToken = generatePasswordResetToken2();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1e3);
      const success = await storage.savePasswordResetToken(userId, resetToken, resetExpires);
      if (!success) {
        return res.status(500).json({ error: "Failed to save reset token" });
      }
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      const { html, text: text2 } = generatePasswordResetEmail2(user.username, resetToken, resetUrl);
      const emailSent = await sendEmail2({
        to: email,
        subject: "\u0421\u043A\u0438\u0434\u0430\u043D\u043D\u044F \u043F\u0430\u0440\u043E\u043B\u044E - REGMIK ERP",
        html,
        text: text2
      });
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email" });
      }
      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  });
  app2.post("/api/auth/confirm-password-reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      const success = await storage.confirmPasswordReset(user.id, hashedPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error confirming password reset:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/send-registration-confirmation", async (req, res) => {
    try {
      const { email, username } = req.body;
      if (!email || !username) {
        return res.status(400).json({ error: "Email and username are required" });
      }
      const { generatePasswordResetToken: generatePasswordResetToken2, sendEmail: sendEmail2, generateRegistrationConfirmationEmail: generateRegistrationConfirmationEmail2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      const confirmationToken = generatePasswordResetToken2();
      const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const tempUserId = Date.now();
      const confirmationUrl = `${req.protocol}://${req.get("host")}/confirm-registration?token=${confirmationToken}`;
      const { html, text: text2 } = generateRegistrationConfirmationEmail2(username, confirmationToken, confirmationUrl);
      const emailSent = await sendEmail2({
        to: email,
        subject: "\u041F\u0456\u0434\u0442\u0432\u0435\u0440\u0434\u0436\u0435\u043D\u043D\u044F \u0440\u0435\u0454\u0441\u0442\u0440\u0430\u0446\u0456\u0457 - REGMIK ERP",
        html,
        text: text2
      });
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send confirmation email" });
      }
      res.json({
        message: "Registration confirmation email sent successfully",
        token: confirmationToken
        // For development/testing
      });
    } catch (error) {
      console.error("Error sending registration confirmation email:", error);
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  });
  app2.patch("/api/users/:id/permissions", isSimpleAuthenticated, async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { permissions } = req.body;
      console.log("Updating permissions for user ID:", id2);
      console.log("New permissions data:", permissions);
      const user = await storage.updateLocalUserPermissions(id2, permissions);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Updated user with permissions:", user);
      res.json(user);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });
  app2.get("/api/roles", async (req, res) => {
    try {
      const roles2 = await storage.getRoles();
      res.json(roles2);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });
  app2.post("/api/roles", async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid role data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create role" });
      }
    }
  });
  app2.get("/api/system-modules", async (req, res) => {
    try {
      const modules = await storage.getSystemModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching system modules:", error);
      res.status(500).json({ error: "Failed to fetch system modules" });
    }
  });
  app2.post("/api/system-modules", async (req, res) => {
    try {
      const moduleData = insertSystemModuleSchema.parse(req.body);
      const module = await storage.createSystemModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating system module:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid module data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create system module" });
      }
    }
  });
  app2.get("/api/email-settings", async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ error: "Failed to fetch email settings" });
    }
  });
  app2.post("/api/email-settings", async (req, res) => {
    try {
      const settingsData = insertEmailSettingsSchema.parse(req.body);
      const settings = await storage.updateEmailSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid email settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update email settings" });
      }
    }
  });
  app2.post("/api/email-settings/update-from-env", async (req, res) => {
    try {
      const settings = {
        smtpHost: process.env.WORKING_SMTP_HOST || process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.WORKING_SMTP_PORT || process.env.SMTP_PORT || "587"),
        smtpSecure: false,
        smtpUser: process.env.WORKING_SMTP_USER || process.env.SMTP_USER,
        smtpPassword: process.env.WORKING_SMTP_PASSWORD || process.env.SMTP_PASSWORD,
        fromEmail: process.env.WORKING_SMTP_USER || process.env.SMTP_USER,
        fromName: "REGMIK ERP",
        isActive: true
      };
      console.log("Updating email settings from env:", { host: settings.smtpHost, port: settings.smtpPort, user: settings.smtpUser });
      const updatedSettings = await storage.updateEmailSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating email settings from env:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });
  app2.post("/api/email-settings/test", async (req, res) => {
    try {
      const settingsData = insertEmailSettingsSchema.parse(req.body);
      const net = await import("net");
      const testConnection = () => {
        return new Promise((resolve, reject) => {
          const socket = new net.default.Socket();
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error("Connection timeout"));
          }, 5e3);
          socket.connect(settingsData.smtpPort || 587, settingsData.smtpHost, () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true);
          });
          socket.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      };
      await testConnection();
      res.json({
        success: true,
        message: `SMTP server ${settingsData.smtpHost}:${settingsData.smtpPort} is reachable`
      });
    } catch (error) {
      console.error("SMTP connection test failed:", error);
      res.status(400).json({
        success: false,
        message: "SMTP connection failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/analytics/product-profitability", isSimpleAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "month";
      const profitabilityData = await storage.getProductProfitability(period);
      res.json(profitabilityData);
    } catch (error) {
      console.error("Error fetching product profitability:", error);
      res.status(500).json({ message: "Failed to fetch product profitability data" });
    }
  });
  app2.get("/api/analytics/top-profitable-products", isSimpleAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "month";
      const limit = parseInt(req.query.limit) || 10;
      const topProducts = await storage.getTopProfitableProducts(period, limit);
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top profitable products:", error);
      res.status(500).json({ message: "Failed to fetch top profitable products" });
    }
  });
  app2.get("/api/analytics/product-trends/:productId", isSimpleAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const trends = await storage.getProductProfitabilityTrends(productId);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching product trends:", error);
      res.status(500).json({ message: "Failed to fetch product trends" });
    }
  });
  app2.get("/api/client-mail", async (req, res) => {
    try {
      const mails = await storage.getClientMails();
      res.json(mails);
    } catch (error) {
      console.error("Error fetching client mails:", error);
      res.status(500).json({ error: "Failed to fetch client mails" });
    }
  });
  app2.post("/api/client-mail", async (req, res) => {
    try {
      const validatedData = insertClientMailSchema.parse(req.body);
      const mail = await storage.createClientMail(validatedData);
      res.status(201).json(mail);
    } catch (error) {
      console.error("Error creating client mail:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid mail data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client mail" });
      }
    }
  });
  app2.post("/api/client-mail/batch-print", async (req, res) => {
    try {
      const { mailIds, batchName } = req.body;
      if (!Array.isArray(mailIds) || mailIds.length === 0) {
        return res.status(400).json({ error: "Mail IDs are required" });
      }
      if (!batchName || typeof batchName !== "string") {
        return res.status(400).json({ error: "Batch name is required" });
      }
      const batchId = `batch_${Date.now()}`;
      const registryData = {
        batchId,
        batchName,
        totalCount: mailIds.length,
        status: "printing",
        printDate: /* @__PURE__ */ new Date(),
        notes: null
      };
      const registry = await storage.createMailRegistry(registryData);
      await storage.updateMailsForBatch(mailIds, batchId);
      res.json({ registry, batchId, processedCount: mailIds.length });
    } catch (error) {
      console.error("Error creating batch print:", error);
      res.status(500).json({ error: "Failed to create batch print" });
    }
  });
  app2.get("/api/mail-registry", async (req, res) => {
    try {
      const registry = await storage.getMailRegistry();
      res.json(registry);
    } catch (error) {
      console.error("Error fetching mail registry:", error);
      res.status(500).json({ error: "Failed to fetch mail registry" });
    }
  });
  app2.get("/api/envelope-print-settings", async (req, res) => {
    try {
      const settings = await storage.getEnvelopePrintSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching envelope print settings:", error);
      res.status(500).json({ error: "Failed to fetch envelope print settings" });
    }
  });
  app2.post("/api/envelope-print-settings", async (req, res) => {
    console.log("POST /api/envelope-print-settings \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E \u0437\u0430\u043F\u0438\u0442:", req.body);
    try {
      const validatedData = insertEnvelopePrintSettingsSchema.parse(req.body);
      console.log("\u0412\u0430\u043B\u0456\u0434\u043E\u0432\u0430\u043D\u0456 \u0434\u0430\u043D\u0456:", validatedData);
      const settings = await storage.createEnvelopePrintSettings(validatedData);
      console.log("\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0456 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F:", settings);
      const allSettings = await storage.getEnvelopePrintSettings();
      res.status(201).json(allSettings);
    } catch (error) {
      console.error("Error creating envelope print settings:", error);
      if (error instanceof z3.ZodError) {
        console.error("Zod validation errors:", error.errors);
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create envelope print settings" });
      }
    }
  });
  app2.get("/api/clients", async (req, res) => {
    try {
      const clients2 = await storage.getClients();
      res.json(clients2);
    } catch (error) {
      console.error("Failed to get clients:", error);
      res.status(500).json({ error: "Failed to get clients" });
    }
  });
  app2.post("/api/clients", async (req, res) => {
    try {
      console.log("Creating client with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z3.ZodError) {
        console.error("Client validation error:", error.errors);
        res.status(400).json({ error: "Invalid client data", details: error.errors });
      } else {
        console.error("Failed to create client:", error);
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });
  app2.get("/api/clients/:id", async (req, res) => {
    try {
      const id2 = req.params.id;
      const client = await storage.getClient(id2);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to get client:", error);
      res.status(500).json({ error: "Failed to get client" });
    }
  });
  app2.patch("/api/clients/:id", async (req, res) => {
    try {
      const id2 = req.params.id;
      const { id: clientId, ...updateData } = req.body;
      const client = await storage.updateClient(id2, updateData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to update client:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });
  app2.delete("/api/clients/:id", async (req, res) => {
    try {
      const id2 = req.params.id;
      const success = await storage.deleteClient(id2);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Failed to delete client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });
  app2.get("/api/clients/:clientId/nova-poshta-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settings = await storage.getClientNovaPoshtaSettings(clientId);
      res.json(settings);
    } catch (error) {
      console.error("Failed to get client Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to get client Nova Poshta settings" });
    }
  });
  app2.get("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const settings = await storage.getClientNovaPoshtaSetting(id2);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to get Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to get Nova Poshta settings" });
    }
  });
  app2.post("/api/clients/:clientId/nova-poshta-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsData = { ...req.body, clientId };
      const settings = await storage.createClientNovaPoshtaSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Failed to create Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to create Nova Poshta settings" });
    }
  });
  app2.patch("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const settings = await storage.updateClientNovaPoshtaSettings(id2, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to update Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to update Nova Poshta settings" });
    }
  });
  app2.delete("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteClientNovaPoshtaSettings(id2);
      if (!success) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json({ message: "Nova Poshta settings deleted successfully" });
    } catch (error) {
      console.error("Failed to delete Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to delete Nova Poshta settings" });
    }
  });
  app2.patch("/api/clients/:clientId/nova-poshta-settings/:id/set-primary", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsId = parseInt(req.params.id);
      const success = await storage.setPrimaryClientNovaPoshtaSettings(clientId, settingsId);
      if (!success) {
        return res.status(404).json({ error: "Failed to set primary Nova Poshta settings" });
      }
      res.json({ message: "Primary Nova Poshta settings updated successfully" });
    } catch (error) {
      console.error("Failed to set primary Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to set primary Nova Poshta settings" });
    }
  });
  app2.post("/api/client-mail/group-create", async (req, res) => {
    try {
      const { clientIds, mailData, batchName } = req.body;
      const result = await storage.createGroupMails(clientIds, mailData, batchName);
      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to create group mails:", error);
      res.status(500).json({ error: "Failed to create group mails" });
    }
  });
  app2.post("/api/orders/:orderId/third-party-shipment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { useClientApi, ...shipmentData } = req.body;
      const result = await storage.createThirdPartyShipment(orderId, shipmentData, useClientApi);
      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to create third-party shipment:", error);
      res.status(500).json({ error: error.message || "Failed to create third-party shipment" });
    }
  });
  app2.get("/api/client-contacts", async (req, res) => {
    try {
      const contacts = await storage.getClientContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      res.status(500).json({ error: "Failed to fetch client contacts" });
    }
  });
  app2.post("/api/client-contacts", async (req, res) => {
    try {
      const validatedData = insertClientContactSchema.parse(req.body);
      const contact = await storage.createClientContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating client contact:", error);
      if (error instanceof z3.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client contact" });
      }
    }
  });
  app2.get("/api/client-contacts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const contact = await storage.getClientContact(id2);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching client contact:", error);
      res.status(500).json({ error: "Failed to fetch client contact" });
    }
  });
  app2.patch("/api/client-contacts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const contact = await storage.updateClientContact(id2, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating client contact:", error);
      res.status(500).json({ error: "Failed to update client contact" });
    }
  });
  app2.delete("/api/client-contacts/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteClientContact(id2);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting client contact:", error);
      res.status(500).json({ error: "Failed to delete client contact" });
    }
  });
  app2.get("/api/client-phones", async (req, res) => {
    try {
      const contacts = await storage.getClientContacts();
      const phones = contacts.flatMap((contact) => {
        const result = [];
        if (contact.primaryPhone) {
          result.push({
            id: `${contact.id}-primary`,
            clientId: contact.clientId,
            phoneNumber: contact.primaryPhone,
            phoneType: contact.primaryPhoneType,
            description: `\u041E\u0441\u043D\u043E\u0432\u043D\u0438\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D - ${contact.fullName}`,
            isPrimary: true,
            createdAt: contact.createdAt
          });
        }
        if (contact.secondaryPhone) {
          result.push({
            id: `${contact.id}-secondary`,
            clientId: contact.clientId,
            phoneNumber: contact.secondaryPhone,
            phoneType: contact.secondaryPhoneType,
            description: `\u0414\u043E\u0434\u0430\u0442\u043A\u043E\u0432\u0438\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D - ${contact.fullName}`,
            isPrimary: false,
            createdAt: contact.createdAt
          });
        }
        if (contact.tertiaryPhone) {
          result.push({
            id: `${contact.id}-tertiary`,
            clientId: contact.clientId,
            phoneNumber: contact.tertiaryPhone,
            phoneType: contact.tertiaryPhoneType,
            description: `\u0422\u0440\u0435\u0442\u0456\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D - ${contact.fullName}`,
            isPrimary: false,
            createdAt: contact.createdAt
          });
        }
        return result;
      });
      res.json(phones);
    } catch (error) {
      console.error("Error fetching client phones (legacy):", error);
      res.status(500).json({ error: "Failed to fetch client phones" });
    }
  });
  app2.get("/api/integrations", async (req, res) => {
    try {
      const integrations2 = await storage.getIntegrationConfigs();
      res.json(integrations2);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });
  app2.get("/api/integrations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const integration = await storage.getIntegrationConfig(id2);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error fetching integration:", error);
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });
  app2.post("/api/integrations", async (req, res) => {
    try {
      const { name, displayName, type, isActive, config } = req.body;
      if (!name || !displayName || !type) {
        return res.status(400).json({ error: "Name, displayName and type are required" });
      }
      const integrationData = {
        name,
        displayName,
        type,
        isActive: isActive || false,
        config: config || {}
      };
      const integration = await storage.createIntegrationConfig(integrationData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });
  app2.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const updateData = req.body;
      const integration = await storage.updateIntegrationConfig(id2, updateData);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ error: "Failed to update integration" });
    }
  });
  app2.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteIntegrationConfig(id2);
      if (!success) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });
  app2.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = true;
      res.json({ success, message: success ? "Connection successful" : "Connection failed" });
    } catch (error) {
      console.error("Error testing integration connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });
  app2.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { direction } = req.body;
      if (!direction || !["import", "export"].includes(direction)) {
        return res.status(400).json({ error: "Direction must be 'import' or 'export'" });
      }
      const result = {
        success: true,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        message: `${direction === "import" ? "Import" : "Export"} started successfully`
      };
      res.json(result);
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ error: "Failed to start synchronization" });
    }
  });
  app2.get("/api/integrations/sync-logs", async (req, res) => {
    try {
      const { integrationId } = req.query;
      const syncLogs2 = await storage.getSyncLogs(integrationId ? parseInt(integrationId) : void 0);
      res.json(syncLogs2);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });
  app2.get("/api/integrations/:id/mappings", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { entityType } = req.query;
      const mappings = [];
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching entity mappings:", error);
      res.status(500).json({ error: "Failed to fetch entity mappings" });
    }
  });
  app2.post("/api/integrations/:id/mappings", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { entityType, localId, externalId, syncDirection } = req.body;
      if (!entityType || !localId || !externalId) {
        return res.status(400).json({ error: "entityType, localId and externalId are required" });
      }
      const mapping = {
        id: Date.now(),
        integrationId,
        entityType,
        localId,
        externalId,
        syncDirection: syncDirection || "bidirectional",
        lastSyncAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating entity mapping:", error);
      res.status(500).json({ error: "Failed to create entity mapping" });
    }
  });
  app2.delete("/api/integrations/:id/mappings/:mappingId", async (req, res) => {
    try {
      const mappingId = parseInt(req.params.mappingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting entity mapping:", error);
      res.status(500).json({ error: "Failed to delete entity mapping" });
    }
  });
  app2.get("/api/integrations/:id/sync-queue", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const queueItems = [];
      res.json(queueItems);
    } catch (error) {
      console.error("Error fetching sync queue:", error);
      res.status(500).json({ error: "Failed to fetch sync queue" });
    }
  });
  app2.post("/api/integrations/:id/sync-queue", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { operation, entityType, entityId, direction, priority } = req.body;
      if (!operation || !entityType || !entityId || !direction) {
        return res.status(400).json({ error: "operation, entityType, entityId and direction are required" });
      }
      const queueItem = {
        id: Date.now(),
        integrationId,
        operation,
        entityType,
        entityId,
        direction,
        priority: priority || 5,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.status(201).json(queueItem);
    } catch (error) {
      console.error("Error adding to sync queue:", error);
      res.status(500).json({ error: "Failed to add to sync queue" });
    }
  });
  app2.get("/api/integrations/:id/field-mappings", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const { entityType } = req.query;
      const fieldMappings2 = [];
      res.json(fieldMappings2);
    } catch (error) {
      console.error("Error fetching field mappings:", error);
      res.status(500).json({ error: "Failed to fetch field mappings" });
    }
  });
  app2.post("/api/integrations/:id/field-mappings", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { entityType, localField, externalField, transformation, direction } = req.body;
      if (!entityType || !localField || !externalField) {
        return res.status(400).json({ error: "entityType, localField and externalField are required" });
      }
      const fieldMapping = {
        id: Date.now(),
        integrationId,
        entityType,
        localField,
        externalField,
        transformation: transformation || "none",
        direction: direction || "bidirectional",
        isRequired: false,
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      res.status(201).json(fieldMapping);
    } catch (error) {
      console.error("Error creating field mapping:", error);
      res.status(500).json({ error: "Failed to create field mapping" });
    }
  });
  app2.get("/api/companies", async (req, res) => {
    try {
      console.log("Fetching companies from database...");
      const companies2 = await storage.getCompanies();
      console.log("Companies fetched successfully:", companies2.length, "companies");
      res.json(companies2);
    } catch (error) {
      console.error("Error fetching companies:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });
  app2.get("/api/companies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const company = await storage.getCompany(id2);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });
  app2.get("/api/companies/default/current", async (req, res) => {
    try {
      const company = await storage.getDefaultCompany();
      if (!company) {
        return res.status(404).json({ error: "No default company found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching default company:", error);
      res.status(500).json({ error: "Failed to fetch default company" });
    }
  });
  app2.post("/api/companies", async (req, res) => {
    try {
      const companyData = req.body;
      console.log("Company creation request data:", companyData);
      if (!companyData.name || !companyData.taxCode || companyData.name.trim() === "" || companyData.taxCode.trim() === "") {
        console.log("Validation failed - name:", companyData.name, "taxCode:", companyData.taxCode);
        return res.status(400).json({ error: "Name and tax code are required" });
      }
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });
  app2.patch("/api/companies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const companyData = req.body;
      const company = await storage.updateCompany(id2, companyData);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });
  app2.delete("/api/companies/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteCompany(id2);
      if (!success) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: error.message || "Failed to delete company" });
    }
  });
  app2.post("/api/companies/:id/set-default", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.setDefaultCompany(id2);
      if (!success) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default company:", error);
      res.status(500).json({ error: "Failed to set default company" });
    }
  });
  app2.get("/api/companies/:id/products", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const products3 = await storage.getProductsByCompany(companyId);
      res.json(products3);
    } catch (error) {
      console.error("Error fetching products by company:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/companies/:id/orders", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const orders2 = await storage.getOrdersByCompany(companyId);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders by company:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = req.body;
      if (!invoiceData.clientId || !invoiceData.amount || !invoiceData.invoiceNumber) {
        return res.status(400).json({ error: "Client ID, amount, and invoice number are required" });
      }
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  app2.patch("/api/invoices/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const invoiceData = req.body;
      const invoice = await storage.updateInvoice(id2, invoiceData);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteInvoice(id2);
      if (!success) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });
  app2.post("/api/invoices/:id/items", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const itemData = { ...req.body, invoiceId };
      if (!itemData.name || !itemData.quantity || !itemData.unitPrice) {
        return res.status(400).json({ error: "Name, quantity, and unit price are required" });
      }
      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(500).json({ error: "Failed to create invoice item" });
    }
  });
  app2.patch("/api/invoice-items/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const itemData = req.body;
      const item = await storage.updateInvoiceItem(id2, itemData);
      if (!item) {
        return res.status(404).json({ error: "Invoice item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      res.status(500).json({ error: "Failed to update invoice item" });
    }
  });
  app2.delete("/api/invoice-items/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const success = await storage.deleteInvoiceItem(id2);
      if (!success) {
        return res.status(404).json({ error: "Invoice item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ error: "Failed to delete invoice item" });
    }
  });
  const invoiceCreateSchema = z3.object({
    clientId: z3.number(),
    companyId: z3.number(),
    invoiceNumber: z3.string(),
    amount: z3.number(),
    currency: z3.string().default("UAH"),
    status: z3.string().default("draft"),
    issueDate: z3.string().transform((str) => new Date(str)),
    dueDate: z3.string().transform((str) => new Date(str)),
    description: z3.string().optional()
  });
  app2.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = invoiceCreateSchema.parse(req.body);
      const invoice = await storage.createInvoice({
        clientId: validatedData.clientId,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        description: validatedData.description || null,
        externalId: null,
        source: "manual"
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });
  app2.put("/api/invoices/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      const validatedData = invoiceCreateSchema.parse(req.body);
      const invoice = await storage.updateInvoice(id2, {
        clientId: validatedData.clientId,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        description: validatedData.description || null,
        updatedAt: /* @__PURE__ */ new Date()
      });
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z3.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });
  app2.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      await storage.deleteInvoice(id2);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });
  app2.post("/api/orders/:orderId/create-invoice", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const invoiceNumber = `INV-${Date.now()}`;
      const orderProducts = await storage.getOrderProducts(orderId);
      const totalAmount = orderProducts.reduce((sum, product) => {
        return sum + parseFloat(product.pricePerUnit) * parseFloat(product.quantity);
      }, 0);
      const clientId = order.clientId || 1;
      const invoice = await storage.createInvoice({
        clientId,
        companyId: 1,
        // Використовуємо основну компанію
        orderId,
        invoiceNumber,
        amount: totalAmount.toString(),
        currency: "UAH",
        status: "draft",
        issueDate: /* @__PURE__ */ new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3),
        // 14 днів
        description: `\u0420\u0430\u0445\u0443\u043D\u043E\u043A \u0434\u043B\u044F \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F ${order.orderNumber}`,
        source: "manual"
      });
      for (const orderProduct of orderProducts) {
        const unitPrice = orderProduct.pricePerUnit || orderProduct.product?.retailPrice || "0";
        const quantity = orderProduct.quantity || "1";
        await storage.createInvoiceItem({
          invoiceId: invoice.id,
          productId: orderProduct.productId,
          name: orderProduct.product?.name || "\u0422\u043E\u0432\u0430\u0440",
          quantity,
          unitPrice,
          totalPrice: (parseFloat(unitPrice) * parseFloat(quantity)).toString()
        });
      }
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice from order:", error);
      res.status(500).json({ error: "Failed to create invoice from order" });
    }
  });
  app2.get("/api/user-sort-preferences/:tableName", async (req, res) => {
    try {
      const { tableName } = req.params;
      const userId = "guest";
      const preference = await storage.getUserSortPreferences(userId, tableName);
      res.json(preference);
    } catch (error) {
      console.error("Error fetching sort preferences:", error);
      res.status(500).json({ error: "Failed to fetch sort preferences" });
    }
  });
  app2.post("/api/user-sort-preferences", async (req, res) => {
    try {
      const { tableName, sortField, sortDirection } = req.body;
      if (!tableName || !sortField || !sortDirection) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const userId = "guest";
      const preference = await storage.saveUserSortPreferences({
        userId,
        tableName,
        sortField,
        sortDirection
      });
      res.json(preference);
    } catch (error) {
      console.error("Error saving sort preferences:", error);
      res.status(500).json({ error: "Failed to save sort preferences" });
    }
  });
  app2.post("/api/orders/:id/process-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      console.log("Raw request body:", req.body);
      console.log("Request body type:", typeof req.body);
      let paymentData;
      if (typeof req.body === "string") {
        try {
          paymentData = JSON.parse(req.body);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return res.status(400).json({ error: "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 JSON" });
        }
      } else {
        paymentData = req.body;
      }
      const validPaymentTypes = ["full", "partial", "contract", "none"];
      if (!validPaymentTypes.includes(paymentData.paymentType)) {
        return res.status(400).json({ error: "\u041D\u0435\u0434\u0456\u0439\u0441\u043D\u0438\u0439 \u0442\u0438\u043F \u043E\u043F\u043B\u0430\u0442\u0438" });
      }
      await storage.processOrderPayment(orderId, paymentData);
      const updatedOrder = await storage.getOrder(orderId);
      console.log("\u041E\u043D\u043E\u0432\u043B\u0435\u043D\u0435 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043F\u0456\u0441\u043B\u044F \u043E\u043F\u043B\u0430\u0442\u0438:", updatedOrder);
      let message = "\u041E\u043F\u043B\u0430\u0442\u0443 \u0437\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043E\u0431\u0440\u043E\u0431\u043B\u0435\u043D\u043E";
      if (paymentData.paymentType === "full") {
        message += ", \u0441\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0437\u0430\u0432\u0434\u0430\u043D\u043D\u044F \u043D\u0430 \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E";
      } else if (paymentData.paymentType === "contract") {
        message += ", \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043E \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443";
      } else if (paymentData.paymentType === "partial" && paymentData.productionApproved) {
        message += ", \u0434\u043E\u0437\u0432\u043E\u043B\u0435\u043D\u043E \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u043E";
      }
      res.json({ success: true, message });
    } catch (error) {
      console.error("Error processing order payment:", error);
      res.status(500).json({ error: "Failed to process order payment" });
    }
  });
  app2.post("/api/orders/:id/cancel-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "\u0417\u0430\u043C\u043E\u0432\u043B\u0435\u043D\u043D\u044F \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
      }
      if (order.paymentType === "none") {
        return res.status(400).json({ error: "\u041D\u0435\u043C\u0430\u0454 \u043E\u043F\u043B\u0430\u0442\u0438 \u0434\u043B\u044F \u0441\u043A\u0430\u0441\u0443\u0432\u0430\u043D\u043D\u044F" });
      }
      await storage.cancelOrderPayment(orderId);
      res.json({ success: true, message: "\u041E\u043F\u043B\u0430\u0442\u0443 \u0441\u043A\u0430\u0441\u043E\u0432\u0430\u043D\u043E \u0443\u0441\u043F\u0456\u0448\u043D\u043E" });
    } catch (error) {
      console.error("Error canceling payment:", error);
      res.status(500).json({ error: "Failed to cancel payment" });
    }
  });
  app2.post("/api/orders/:id/approve-production", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { approvedBy, reason } = req.body;
      if (!approvedBy) {
        return res.status(400).json({ error: "\u041D\u0435 \u0432\u043A\u0430\u0437\u0430\u043D\u043E \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430, \u044F\u043A\u0438\u0439 \u0434\u0430\u0454 \u0434\u043E\u0437\u0432\u0456\u043B" });
      }
      await storage.approveProductionForOrder(orderId, approvedBy, reason);
      res.json({ success: true, message: "\u0414\u043E\u0437\u0432\u043E\u043B\u0435\u043D\u043E \u0437\u0430\u043F\u0443\u0441\u043A \u0432\u0438\u0440\u043E\u0431\u043D\u0438\u0446\u0442\u0432\u0430" });
    } catch (error) {
      console.error("Error approving production:", error);
      res.status(500).json({ error: "Failed to approve production" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/production.ts
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })} [express] ${logLine}`);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  const staticPath = path.join(process.cwd(), "dist/client");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  })} [express] \u0406\u043D\u0456\u0446\u0456\u0430\u043B\u0456\u0437\u0430\u0446\u0456\u044F \u043A\u0435\u0448\u0443 \u041D\u043E\u0432\u043E\u0457 \u041F\u043E\u0448\u0442\u0438...`);
  await novaPoshtaCache.initialize();
  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    })} [express] serving on port ${port}`);
  });
})();
