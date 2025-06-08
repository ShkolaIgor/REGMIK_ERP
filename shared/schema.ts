import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 50 }).default("user"), // admin, manager, user, viewer
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions"), // JSON з дозволами доступу до модулів
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця компаній/фірм для мультифірмового режиму
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 500 }),
  taxCode: varchar("tax_code", { length: 20 }).notNull().unique(), // ЄДРПОУ
  vatNumber: varchar("vat_number", { length: 20 }), // ПДВ номер
  legalAddress: text("legal_address"),
  physicalAddress: text("physical_address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  bankName: varchar("bank_name", { length: 255 }),
  bankAccount: varchar("bank_account", { length: 50 }),
  bankCode: varchar("bank_code", { length: 20 }),
  logo: text("logo"), // URL або base64 логотипу
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Компанія за замовчуванням
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Локальні користувачі для простої автентифікації (альтернатива Replit Auth)
export const localUsers = pgTable("local_users", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").references(() => workers.id).unique(), // Зв'язок з робітниками
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique(), // Може відрізнятися від email робітника (для входу)
  password: varchar("password", { length: 255 }).notNull(), // хешований пароль
  roleId: integer("role_id").references(() => roles.id), // Зв'язок з таблицею ролей
  role: varchar("role", { length: 50 }).default("user"), // admin, manager, user, viewer (для сумісності)
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions"), // JSON з дозволами доступу до модулів
  systemModules: jsonb("system_modules").$type<number[]>().default([]), // Масив ID модулів
  lastLoginAt: timestamp("last_login_at"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ролі та дозволи
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  permissions: jsonb("permissions").notNull(), // JSON з дозволами
  isSystemRole: boolean("is_system_role").default(false), // системні ролі не можна видаляти
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Модулі системи для контролю доступу
export const systemModules = pgTable("system_modules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // назва іконки
  route: varchar("route", { length: 255 }), // маршрут в додатку
  parentModuleId: integer("parent_module_id"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Історія входів користувачів
export const userLoginHistory = pgTable("user_login_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"), // може бути як Replit user id, так і local user id
  userType: varchar("user_type", { length: 20 }).notNull(), // 'replit' або 'local'
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  loginTime: timestamp("login_time").defaultNow(),
  logoutTime: timestamp("logout_time"),
  sessionDuration: integer("session_duration"), // в секундах
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Налаштування серійних номерів
  serialNumberTemplate: text("serial_number_template"), // шаблон серійного номера, наприклад: "{prefix}-{year}-{counter:4}"
  serialNumberPrefix: text("serial_number_prefix"), // префікс для серійних номерів
  serialNumberStartNumber: integer("serial_number_start_number").default(1), // початковий номер
  useSerialNumbers: boolean("use_serial_numbers").default(false), // чи використовувати серійні номери для цієї категорії
  useGlobalNumbering: boolean("use_global_numbering").default(true), // використовувати глобальну нумерацію
  createdAt: timestamp("created_at").defaultNow(),
});

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // назва одиниці вимірювання
  shortName: text("short_name").notNull().unique(), // скорочена назва
  type: text("type").notNull(), // weight, volume, length, area, count, time
  baseUnit: text("base_unit"), // базова одиниця для конвертації
  conversionFactor: decimal("conversion_factor", { precision: 15, scale: 6 }).default("1"), // коефіцієнт конвертації
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  description: text("description"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  barcode: text("barcode"),
  categoryId: integer("category_id").references(() => categories.id),
  companyId: integer("company_id").references(() => companies.id), // Належність до компанії
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  photo: text("photo"),
  productType: text("product_type").notNull().default("product"), // product, component, material
  unit: text("unit").notNull().default("шт"), // одиниця виміру
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock").default(1000),
  hasSerialNumbers: boolean("has_serial_numbers").default(false), // чи використовує серійні номери
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock").default(1000),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  clientId: integer("client_id").references(() => clients.id), // зв'язок з клієнтом для використання його API ключів
  companyId: integer("company_id").references(() => companies.id), // Компанія, від імені якої здійснюється продаж
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  paymentDate: timestamp("payment_date"), // дата оплати
  dueDate: timestamp("due_date"), // термін виконання
  shippedDate: timestamp("shipped_date"), // дата відвантаження
  createdAt: timestamp("created_at").defaultNow(),
});

// Адреси клієнтів для швидкого вибору
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientPhone: varchar("recipient_phone", { length: 50 }),
  cityRef: varchar("city_ref", { length: 255 }).notNull(),
  cityName: varchar("city_name", { length: 255 }).notNull(),
  warehouseRef: varchar("warehouse_ref", { length: 255 }).notNull(),
  warehouseAddress: text("warehouse_address").notNull(),
  carrierId: integer("carrier_id").references(() => carriers.id), // збережений перевізник
  isDefault: boolean("is_default").default(false),
  lastUsed: timestamp("last_used").defaultNow(), // для сортування за останнім використанням
  usageCount: integer("usage_count").default(1), // кількість використань
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Налаштування відправника
export const senderSettings = pgTable("sender_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  cityRef: varchar("city_ref", { length: 255 }).notNull(),
  cityName: varchar("city_name", { length: 255 }).notNull(),
  warehouseRef: varchar("warehouse_ref", { length: 255 }).notNull(),
  warehouseAddress: text("warehouse_address").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця відвантажень
export const shipments = pgTable("shipments", {
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
  
  weight: decimal("weight", { precision: 8, scale: 3 }), // кг
  length: decimal("length", { precision: 8, scale: 2 }), // довжина в см
  width: decimal("width", { precision: 8, scale: 2 }), // ширина в см
  height: decimal("height", { precision: 8, scale: 2 }), // висота в см
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  declaredValue: decimal("declared_value", { precision: 10, scale: 2 }), // оголошена вартість
  status: text("status").notNull().default("preparing"), // preparing, shipped, in_transit, delivered
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  shippedAt: timestamp("shipped_at"),
});

// Елементи відвантаження
export const shipmentItems = pgTable("shipment_items", {
  id: serial("id").primaryKey(),
  shipmentId: integer("shipment_id").references(() => shipments.id).notNull(),
  orderItemId: integer("order_item_id").references(() => orderItems.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  serialNumbers: text("serial_numbers").array(), // серійні номери для відстеження
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  shippedQuantity: integer("shipped_quantity").notNull().default(0), // кількість вже відвантажена
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productId: integer("product_id").references(() => products.id),
  description: text("description"),
  instructions: text("instructions"),
  estimatedTime: integer("estimated_time"), // in minutes
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
});

export const productionTasks = pgTable("production_tasks", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default("planned"), // planned, in-progress, quality-check, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: text("assigned_to"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0), // 0-100
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});



export const techCards = pgTable("tech_cards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  productId: integer("product_id").references(() => products.id),
  baseTechCardId: integer("base_tech_card_id"), // для модифікацій виробів - foreign key додамо пізніше
  isBaseCard: boolean("is_base_card").default(true), // чи це базова карта
  modificationNote: text("modification_note"), // примітка про модифікацію
  estimatedTime: integer("estimated_time").notNull(), // в хвилинах
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  status: text("status").notNull().default("active"), // active, inactive
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }).default("0"),
  createdBy: text("created_by"), // інформація про користувача-творця
  createdAt: timestamp("created_at").defaultNow(),
});

export const techCardSteps = pgTable("tech_card_steps", {
  id: serial("id").primaryKey(),
  techCardId: integer("tech_card_id").references(() => techCards.id),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // в хвилинах
  equipment: text("equipment"),
  notes: text("notes"),
  // Поля для паралельного виконання
  departmentId: integer("department_id").references(() => departments.id), // Дільниця виконання
  positionId: integer("position_id").references(() => positions.id), // Посада робітника
  canRunParallel: boolean("can_run_parallel").default(false), // Чи може виконуватись паралельно
  prerequisiteSteps: text("prerequisite_steps"), // JSON масив номерів кроків-попередників
  executionOrder: integer("execution_order").default(1), // Порядок виконання в паралельній групі
});

export const techCardMaterials = pgTable("tech_card_materials", {
  id: serial("id").primaryKey(),
  techCardId: integer("tech_card_id").references(() => techCards.id),
  productId: integer("product_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
});



// Таблиця типів корпусів
export const packageTypes = pgTable("package_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  pinCount: integer("pin_count"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця типів пайки
export const solderingTypes = pgTable("soldering_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  temperature: varchar("temperature", { length: 50 }),
  method: varchar("method", { length: 100 }),
  equipment: text("equipment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця категорій компонентів
export const componentCategories = pgTable("component_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Колір для візуальної ідентифікації
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця компонентів для BOM
export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  sku: varchar("sku").notNull().unique(),
  description: text("description"),
  unit: varchar("unit").notNull().default("шт"),
  costPrice: varchar("cost_price").notNull().default("0"),
  supplier: varchar("supplier"),
  partNumber: varchar("part_number"),
  categoryId: integer("category_id").references(() => componentCategories.id),
  manufacturer: varchar("manufacturer"),
  uktzedCode: varchar("uktzed_code"),
  packageTypeId: integer("package_type_id").references(() => packageTypes.id),
  minStock: integer("min_stock"),
  maxStock: integer("max_stock"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Листування з клієнтами
export const clientMail = pgTable("client_mail", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mailType: varchar("mail_type", { length: 50 }).notNull().default("letter"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  envelopePrinted: boolean("envelope_printed").default(false),
  batchId: varchar("batch_id", { length: 100 }),
  senderName: varchar("sender_name", { length: 255 }),
  senderAddress: text("sender_address"),
  senderPhone: varchar("sender_phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Реєстр відправлених листів
export const mailRegistry = pgTable("mail_registry", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id", { length: 100 }).notNull(),
  batchName: varchar("batch_name", { length: 255 }).notNull(),
  mailCount: integer("mail_count").notNull().default(0),
  registryDate: timestamp("registry_date").notNull().defaultNow(),
  sentBy: varchar("sent_by", { length: 255 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("created"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Налаштування друку конвертів
export const envelopePrintSettings = pgTable("envelope_print_settings", {
  id: serial("id").primaryKey(),
  settingName: varchar("setting_name", { length: 255 }).notNull(),
  envelopeSize: varchar("envelope_size", { length: 50 }).notNull().default("dl"), // dl, c4, c5
  senderName: varchar("sender_name", { length: 255 }),
  senderAddress: text("sender_address"),
  senderPhone: varchar("sender_phone", { length: 50 }),
  advertisementText: text("advertisement_text"),
  advertisementImage: text("advertisement_image"), // base64 зображення
  adPositions: text("ad_positions").default('["bottom-left"]'), // JSON масив позицій
  imageRelativePosition: varchar("image_relative_position", { length: 50 }).default("below"), // above, below, left, right
  imageSize: varchar("image_size", { length: 50 }).default("small"), // small, medium, large
  fontSize: varchar("font_size", { length: 10 }).default("12"),
  senderRecipientFontSize: varchar("sender_recipient_font_size", { length: 10 }).default("14"), // fontSize * 1.2
  postalIndexFontSize: varchar("postal_index_font_size", { length: 10 }).default("18"), // fontSize * 1.5
  advertisementFontSize: varchar("advertisement_font_size", { length: 10 }).default("11"), // fontSize * 0.9
  centerImage: boolean("center_image").default(false),
  senderPosition: text("sender_position").default('{"x": 20, "y": 15}'), // JSON позиція відправника
  recipientPosition: text("recipient_position").default('{"x": 120, "y": 60}'), // JSON позиція отримувача
  adPositionCoords: text("ad_position_coords").default('{"bottom-left": {"x": 8, "y": 85}, "top-right": {"x": 160, "y": 8}}'), // JSON координати реклами
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця для композиції продуктів (BOM - Bill of Materials)
export const productComponents = pgTable("product_components", {
  id: serial("id").primaryKey(),
  parentProductId: integer("parent_product_id").references(() => products.id).notNull(),
  componentProductId: integer("component_product_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull().default("шт"),
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas (old user schema removed for Replit Auth)
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, orderNumber: true, totalAmount: true }).extend({
  customerName: z.string().optional(), // робимо опціональним, якщо є clientId
  clientId: z.string().optional(), // опціональний зв'язок з клієнтом
}).refine(data => data.customerName || data.clientId, {
  message: "Потрібно вказати або ім'я клієнта, або обрати клієнта зі списку"
});
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertProductionTaskSchema = createInsertSchema(productionTasks).omit({ id: true, createdAt: true });

export const insertTechCardSchema = createInsertSchema(techCards).omit({ id: true, createdAt: true });
export const insertTechCardStepSchema = createInsertSchema(techCardSteps).omit({ id: true });
export const insertTechCardMaterialSchema = createInsertSchema(techCardMaterials).omit({ id: true });
export const insertPackageTypeSchema = createInsertSchema(packageTypes).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSolderingTypeSchema = createInsertSchema(solderingTypes).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSenderSettingsSchema = createInsertSchema(senderSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertShipmentSchema = createInsertSchema(shipments).omit({ 
  id: true, 
  createdAt: true,
  shipmentNumber: true 
}).partial().extend({
  // Обов'язкове поле
  orderId: z.number().min(1, "Замовлення обов'язкове")
});

export const insertShipmentItemSchema = createInsertSchema(shipmentItems).omit({ 
  id: true 
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type SenderSettings = typeof senderSettings.$inferSelect;
export type InsertSenderSettings = z.infer<typeof insertSenderSettingsSchema>;

export const insertComponentCategorySchema = createInsertSchema(componentCategories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertComponentSchema = createInsertSchema(components).omit({ id: true, createdAt: true });
export const insertProductComponentSchema = createInsertSchema(productComponents).omit({ id: true, createdAt: true });

// Таблиця для відстеження дефіциту матеріалів
export const materialShortages = pgTable("material_shortages", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
  availableQuantity: decimal("available_quantity", { precision: 12, scale: 4 }).notNull().default("0"),
  shortageQuantity: decimal("shortage_quantity", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }).default("0"),
  supplierRecommendationId: integer("supplier_recommendation_id").references(() => suppliers.id),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, ordered, received
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const costCalculations = pgTable("cost_calculations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  materialCost: decimal("material_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull().default("20"), // percentage
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  notes: text("notes"),
});

// Таблиця постачальників
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  description: text("description"),
  paymentTerms: text("payment_terms"), // умови оплати
  deliveryTerms: text("delivery_terms"), // умови доставки
  rating: integer("rating").default(5), // рейтинг від 1 до 10
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця замовлень постачальникам
export const supplierOrders = pgTable("supplier_orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  orderNumber: text("order_number").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, confirmed, received
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  expectedDelivery: timestamp("expected_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця елементів замовлень постачальникам
export const supplierOrderItems = pgTable("supplier_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => supplierOrders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull().default("0"),
  materialShortageId: integer("material_shortage_id").references(() => materialShortages.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertMaterialShortageSchema = createInsertSchema(materialShortages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCostCalculationSchema = createInsertSchema(costCalculations).omit({ 
  id: true, 
  calculatedAt: true 
});

export const insertSupplierOrderSchema = createInsertSchema(supplierOrders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSupplierOrderItemSchema = createInsertSchema(supplierOrderItems).omit({ 
  id: true, 
  createdAt: true 
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Таблиця операцій збірки та розбірки товарів
export const assemblyOperations = pgTable("assembly_operations", {
  id: serial("id").primaryKey(),
  operationType: text("operation_type").notNull(), // assembly, disassembly
  productId: integer("product_id").references(() => products.id).notNull(), // готовий виріб
  warehouseId: integer("warehouse_id").references(() => warehouses.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, cancelled
  plannedDate: timestamp("planned_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  performedBy: text("performed_by"), // хто виконував операцію
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця компонентів для операцій збірки/розбірки
export const assemblyOperationItems = pgTable("assembly_operation_items", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => assemblyOperations.id).notNull(),
  componentId: integer("component_id").references(() => products.id).notNull(), // компонент
  requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 12, scale: 4 }).default("0"),
  unit: text("unit").notNull(),
  status: text("status").notNull().default("pending"), // pending, consumed, returned
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Налаштування поштового сервісу
export const emailSettings = pgTable("email_settings", {
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

// Таблиця клієнтів з налаштуваннями Нової Пошти
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(), // Автоматично генерований унікальний ID
  taxCode: varchar("tax_code", { length: 20 }).notNull().unique(), // ЄДРПОУ або ІПН
  name: varchar("name", { length: 255 }).notNull(), // Скорочена назва
  fullName: varchar("full_name", { length: 500 }),  // Повна назва
  type: varchar("type", { length: 50 }).notNull().default("individual"), // individual, organization
  
  // Адреси
  legalAddress: text("legal_address"), // Юридична адреса
  physicalAddress: text("physical_address"), // Фактична адреса для відвантаження
  addressesMatch: boolean("addresses_match").default(false), // Адреси співпадають
  
  // Фінансова інформація
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0.00"), // Знижка клієнта в %
  
  notes: text("notes"),
  
  // Налаштування Нової Пошти
  novaPoshtaApiKey: varchar("nova_poshta_api_key", { length: 255 }),
  novaPoshtaSenderRef: varchar("nova_poshta_sender_ref", { length: 255 }),
  novaPoshtaContactRef: varchar("nova_poshta_contact_ref", { length: 255 }),
  novaPoshtaAddressRef: varchar("nova_poshta_address_ref", { length: 255 }),
  enableThirdPartyShipping: boolean("enable_third_party_shipping").default(false),
  
  // Поля для синхронізації з зовнішніми системами
  externalId: varchar("external_id", { length: 100 }),
  source: varchar("source", { length: 20 }).default("manual"), // bitrix24, 1c, manual
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Контактні особи клієнтів (об'єднана таблиця)
export const clientContacts = pgTable("client_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  email: varchar("email", { length: 255 }),
  
  // Основний телефон
  primaryPhone: varchar("primary_phone", { length: 50 }),
  primaryPhoneType: varchar("primary_phone_type", { length: 50 }).default("mobile"), // mobile, office, home
  
  // Додатковий телефон
  secondaryPhone: varchar("secondary_phone", { length: 50 }),
  secondaryPhoneType: varchar("secondary_phone_type", { length: 50 }).default("office"), // mobile, office, home, fax
  
  // Третій телефон (для факсу або додаткового)
  tertiaryPhone: varchar("tertiary_phone", { length: 50 }),
  tertiaryPhoneType: varchar("tertiary_phone_type", { length: 50 }).default("fax"), // mobile, office, home, fax
  
  notes: text("notes"),
  isPrimary: boolean("is_primary").default(false), // основний контакт клієнта
  isActive: boolean("is_active").default(true),
  
  // Поля для синхронізації з зовнішніми системами
  externalId: varchar("external_id", { length: 100 }),
  source: varchar("source", { length: 20 }).default("manual"), // bitrix24, 1c, manual
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Налаштування Нової Пошти для клієнтів
export const clientNovaPoshtaSettings = pgTable("client_nova_poshta_settings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  // API налаштування
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  
  // Налаштування відправника
  senderRef: varchar("sender_ref", { length: 255 }), // Референс відправника в НП
  senderAddress: varchar("sender_address", { length: 255 }), // Адреса відправника
  senderCityRef: varchar("sender_city_ref", { length: 255 }), // Референс міста відправника
  senderPhone: varchar("sender_phone", { length: 50 }),
  senderContact: varchar("sender_contact", { length: 255 }),
  
  // Налаштування за замовчуванням
  defaultServiceType: varchar("default_service_type", { length: 100 }).default("WarehouseWarehouse"), // WarehouseWarehouse, WarehouseDoors, DoorsWarehouse, DoorsDoors
  defaultCargoType: varchar("default_cargo_type", { length: 100 }).default("Parcel"), // Parcel, Cargo
  defaultPaymentMethod: varchar("default_payment_method", { length: 100 }).default("Cash"), // Cash, NonCash
  defaultPayer: varchar("default_payer", { length: 100 }).default("Sender"), // Sender, Recipient, ThirdPerson
  
  // Додаткові налаштування
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isPrimary: boolean("is_primary").default(false), // основні налаштування для клієнта
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas
export const insertAssemblyOperationSchema = createInsertSchema(assemblyOperations).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertAssemblyOperationItemSchema = createInsertSchema(assemblyOperationItems).omit({ 
  id: true, 
  createdAt: true 
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertClientContactSchema = createInsertSchema(clientContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertClientNovaPoshtaSettingsSchema = createInsertSchema(clientNovaPoshtaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Inventory Audits
export const inventoryAudits = pgTable("inventory_audits", {
  id: serial("id").primaryKey(),
  auditNumber: varchar("audit_number", { length: 100 }).notNull().unique(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  status: varchar("status", { length: 50 }).notNull().default("planned"), // planned, in_progress, completed, cancelled
  auditType: varchar("audit_type", { length: 50 }).notNull(), // full, partial, cycle_count
  plannedDate: timestamp("planned_date"),
  startedDate: timestamp("started_date"),
  completedDate: timestamp("completed_date"),
  responsiblePersonId: integer("responsible_person_id").references(() => workers.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryAuditItems = pgTable("inventory_audit_items", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => inventoryAudits.id),
  productId: integer("product_id").notNull().references(() => products.id),
  systemQuantity: decimal("system_quantity", { precision: 10, scale: 2 }).notNull(),
  countedQuantity: decimal("counted_quantity", { precision: 10, scale: 2 }),
  variance: decimal("variance", { precision: 10, scale: 2 }),
  variancePercent: decimal("variance_percent", { precision: 5, scale: 2 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  reason: text("reason"), // reason for variance
  adjustmentMade: boolean("adjustment_made").default(false),
  notes: text("notes"),
  countedBy: varchar("counted_by", { length: 255 }),
  countedAt: timestamp("counted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryAuditSchema = createInsertSchema(inventoryAudits).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  auditNumber: true 
});

export const insertInventoryAuditItemSchema = createInsertSchema(inventoryAuditItems).omit({ 
  id: true, 
  createdAt: true
});

// Таблиця робітників
export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  positionId: integer("position_id").references(() => positions.id),
  departmentId: integer("department_id").references(() => departments.id),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  hireDate: timestamp("hire_date"),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  photo: text("photo"), // URL або base64 рядок фото
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  hourlyRate: z.union([z.string(), z.number()]).transform((val) => val?.toString()).optional().nullable(),
  hireDate: z.union([z.string(), z.date()]).transform((val) => val ? new Date(val) : null).optional().nullable()
});

// Таблиця прогнозування виробництва
export const productionForecasts = pgTable("production_forecasts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  forecastType: varchar("forecast_type", { length: 50 }).notNull(), // demand, capacity, material
  periodType: varchar("period_type", { length: 50 }).notNull(), // daily, weekly, monthly, quarterly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, active, completed, archived
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // точність прогнозу в відсотках
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // рівень довіри до прогнозу
  methodology: varchar("methodology", { length: 100 }), // linear_regression, moving_average, exponential_smoothing
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Деталі прогнозування по продуктах
export const productionForecastItems = pgTable("production_forecast_items", {
  id: serial("id").primaryKey(),
  forecastId: integer("forecast_id").notNull().references(() => productionForecasts.id),
  productId: integer("product_id").notNull().references(() => products.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  forecastedDemand: decimal("forecasted_demand", { precision: 12, scale: 4 }).notNull(),
  forecastedProduction: decimal("forecasted_production", { precision: 12, scale: 4 }).notNull(),
  currentStock: decimal("current_stock", { precision: 12, scale: 4 }).default("0"),
  requiredCapacity: decimal("required_capacity", { precision: 10, scale: 2 }), // година роботи
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Матеріальні потреби для прогнозу
export const forecastMaterialRequirements = pgTable("forecast_material_requirements", {
  id: serial("id").primaryKey(),
  forecastItemId: integer("forecast_item_id").notNull().references(() => productionForecastItems.id),
  materialId: integer("material_id").notNull().references(() => products.id),
  requiredQuantity: decimal("required_quantity", { precision: 12, scale: 4 }).notNull(),
  currentStock: decimal("current_stock", { precision: 12, scale: 4 }).default("0"),
  shortageQuantity: decimal("shortage_quantity", { precision: 12, scale: 4 }).default("0"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  leadTime: integer("lead_time").default(0), // час постачання в днях
  supplierId: integer("supplier_id").references(() => suppliers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductionForecastSchema = createInsertSchema(productionForecasts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
}).extend({
  startDate: z.date().optional(),
  endDate: z.date().optional()
});

export const insertProductionForecastItemSchema = createInsertSchema(productionForecastItems).omit({ 
  id: true, 
  createdAt: true 
});

export const insertForecastMaterialRequirementSchema = createInsertSchema(forecastMaterialRequirements).omit({ 
  id: true, 
  createdAt: true 
});

// Таблиця переміщень між складами
export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: serial("id").primaryKey(),
  transferNumber: varchar("transfer_number", { length: 100 }).notNull().unique(),
  fromWarehouseId: integer("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: integer("to_warehouse_id").notNull().references(() => warehouses.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in_transit, completed, cancelled
  requestedDate: timestamp("requested_date").notNull(),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  responsiblePersonId: integer("responsible_person_id").references(() => workers.id),
  transportMethod: varchar("transport_method", { length: 100 }), // truck, courier, internal
  notes: text("notes"),
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Позиції переміщень між складами
export const warehouseTransferItems = pgTable("warehouse_transfer_items", {
  id: serial("id").primaryKey(),
  transferId: integer("transfer_id").notNull().references(() => warehouseTransfers.id),
  productId: integer("product_id").notNull().references(() => products.id),
  requestedQuantity: decimal("requested_quantity", { precision: 12, scale: 4 }).notNull(),
  transferredQuantity: decimal("transferred_quantity", { precision: 12, scale: 4 }).default("0"),
  unit: varchar("unit", { length: 50 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).default("0"),
  condition: varchar("condition", { length: 50 }).default("good"), // good, damaged, expired
  batchNumber: varchar("batch_number", { length: 100 }),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWarehouseTransferSchema = createInsertSchema(warehouseTransfers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  transferNumber: true 
});

export const insertWarehouseTransferItemSchema = createInsertSchema(warehouseTransferItems).omit({ 
  id: true, 
  createdAt: true 
});

// Таблиця посад робітників
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  salaryRange: varchar("salary_range", { length: 50 }),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Таблиця відділів
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Таблиця виготовленої продукції
export const productionOutput = pgTable("production_output", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  workerId: integer("worker_id").references(() => workers.id),
  recipeId: integer("recipe_id").references(() => recipes.id),
  productionDate: timestamp("production_date").notNull().defaultNow(),
  batchNumber: varchar("batch_number", { length: 100 }),
  quality: varchar("quality", { length: 50 }).default("good"), // good, defective, excellent
  productionCost: decimal("production_cost", { precision: 12, scale: 2 }),
  laborHours: decimal("labor_hours", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductionOutputSchema = createInsertSchema(productionOutput).omit({ 
  id: true, 
  createdAt: true 
});

// Таблиця перевізників
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  description: text("description"),
  serviceType: varchar("service_type", { length: 100 }), // express, standard, freight
  rating: integer("rating").default(5), // 1-10
  isActive: boolean("is_active").default(true).notNull(),
  apiKey: varchar("api_key", { length: 500 }), // API ключ для інтеграції
  lastSyncAt: timestamp("last_sync_at"), // Дата останньої синхронізації
  citiesCount: integer("cities_count").default(0), // Кількість населених пунктів
  warehousesCount: integer("warehouses_count").default(0), // Кількість відділень
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({ 
  id: true, 
  updatedAt: true 
});

// User schema for auth (updated for Replit Auth)
export const insertUserSchemaAuth = createInsertSchema(users);
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type ProductionTask = typeof productionTasks.$inferSelect;
export type InsertProductionTask = z.infer<typeof insertProductionTaskSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;

export type PackageType = typeof packageTypes.$inferSelect;
export type InsertPackageType = z.infer<typeof insertPackageTypeSchema>;
export type SolderingType = typeof solderingTypes.$inferSelect;
export type InsertSolderingType = z.infer<typeof insertSolderingTypeSchema>;
export type ComponentCategory = typeof componentCategories.$inferSelect;
export type InsertComponentCategory = z.infer<typeof insertComponentCategorySchema>;
export type Component = typeof components.$inferSelect;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type ProductComponent = typeof productComponents.$inferSelect;
export type InsertProductComponent = z.infer<typeof insertProductComponentSchema>;
export type MaterialShortage = typeof materialShortages.$inferSelect;
export type InsertMaterialShortage = z.infer<typeof insertMaterialShortageSchema>;
export type CostCalculation = typeof costCalculations.$inferSelect;
export type InsertCostCalculation = z.infer<typeof insertCostCalculationSchema>;
export type SupplierOrder = typeof supplierOrders.$inferSelect;
export type InsertSupplierOrder = z.infer<typeof insertSupplierOrderSchema>;
export type SupplierOrderItem = typeof supplierOrderItems.$inferSelect;
export type InsertSupplierOrderItem = z.infer<typeof insertSupplierOrderItemSchema>;
export type AssemblyOperation = typeof assemblyOperations.$inferSelect;
export type InsertAssemblyOperation = z.infer<typeof insertAssemblyOperationSchema>;
export type AssemblyOperationItem = typeof assemblyOperationItems.$inferSelect;
export type InsertAssemblyOperationItem = z.infer<typeof insertAssemblyOperationItemSchema>;
export type InventoryAudit = typeof inventoryAudits.$inferSelect;
export type InsertInventoryAudit = z.infer<typeof insertInventoryAuditSchema>;
export type InventoryAuditItem = typeof inventoryAuditItems.$inferSelect;
export type InsertInventoryAuditItem = z.infer<typeof insertInventoryAuditItemSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type ProductionForecast = typeof productionForecasts.$inferSelect;
export type InsertProductionForecast = z.infer<typeof insertProductionForecastSchema>;
export type ProductionForecastItem = typeof productionForecastItems.$inferSelect;
export type InsertProductionForecastItem = z.infer<typeof insertProductionForecastItemSchema>;
export type ForecastMaterialRequirement = typeof forecastMaterialRequirements.$inferSelect;
export type InsertForecastMaterialRequirement = z.infer<typeof insertForecastMaterialRequirementSchema>;
export type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
export type InsertWarehouseTransfer = z.infer<typeof insertWarehouseTransferSchema>;
export type WarehouseTransferItem = typeof warehouseTransferItems.$inferSelect;
export type InsertWarehouseTransferItem = z.infer<typeof insertWarehouseTransferItemSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type ProductionOutput = typeof productionOutput.$inferSelect;
export type InsertProductionOutput = z.infer<typeof insertProductionOutputSchema>;

// Component Alternatives
export const componentAlternatives = pgTable("component_alternatives", {
  id: serial("id").primaryKey(),
  originalComponentId: integer("original_component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
  alternativeComponentId: integer("alternative_component_id").notNull().references(() => components.id, { onDelete: "cascade" }),
  compatibility: varchar("compatibility", { length: 50 }).default("повна"), // повна, часткова, обмежена
  notes: text("notes"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const componentAlternativesRelations = relations(componentAlternatives, ({ one }) => ({
  originalComponent: one(components, {
    fields: [componentAlternatives.originalComponentId],
    references: [components.id],
    relationName: "original_component"
  }),
  alternativeComponent: one(components, {
    fields: [componentAlternatives.alternativeComponentId],
    references: [components.id],
    relationName: "alternative_component"
  }),
}));

export const insertComponentAlternativeSchema = createInsertSchema(componentAlternatives).omit({
  id: true,
  createdAt: true,
});

// Relations for positions and departments
export const positionsRelations = relations(positions, ({ one }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  positions: many(positions),
}));

export type ComponentAlternative = typeof componentAlternatives.$inferSelect;
export type InsertComponentAlternative = z.infer<typeof insertComponentAlternativeSchema>;

// Carrier types
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

// Sales transactions
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  customerId: integer("customer_id"),
  customerName: varchar("customer_name", { length: 255 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("UAH"),
  saleDate: timestamp("sale_date").defaultNow(),
  status: varchar("status", { length: 50 }).default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
export const insertSaleSchema = createInsertSchema(sales);

// Sale items
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

// Product profitability analysis
export const productProfitability = pgTable("product_profitability", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 15, scale: 2 }).default("0"),
  totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0"), // percentage
  unitsSold: integer("units_sold").default(0),
  averageSellingPrice: decimal("average_selling_price", { precision: 10, scale: 2 }).default("0"),
  averageCostPrice: decimal("average_cost_price", { precision: 10, scale: 2 }).default("0"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export type ProductProfitability = typeof productProfitability.$inferSelect;
export type InsertProductProfitability = typeof productProfitability.$inferInsert;

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("UAH"),
  expenseDate: timestamp("expense_date").defaultNow(),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export const insertExpenseSchema = createInsertSchema(expenses);

// Time tracking
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  userName: varchar("user_name", { length: 255 }),
  taskId: integer("task_id").references(() => productionTasks.id),
  taskName: varchar("task_name", { length: 255 }),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
export const insertTimeEntrySchema = createInsertSchema(timeEntries);

// Inventory alerts
export const inventoryAlerts = pgTable("inventory_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  currentStock: integer("current_stock").notNull(),
  minStock: integer("min_stock").notNull(),
  alertType: varchar("alert_type", { length: 50 }).default("low_stock"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type InsertInventoryAlert = typeof inventoryAlerts.$inferInsert;

// Shipment types
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;

// Нова Пошта - Міста
export const novaPoshtaCities = pgTable("nova_poshta_cities", {
  id: serial("id").primaryKey(),
  ref: varchar("ref").notNull().unique(), // UUID від Нової Пошти
  name: varchar("name").notNull(),
  area: varchar("area").notNull(),
  region: varchar("region"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Нова Пошта - Відділення
export const novaPoshtaWarehouses = pgTable("nova_poshta_warehouses", {
  id: serial("id").primaryKey(),
  ref: varchar("ref").notNull().unique(), // UUID від Нової Пошти
  cityRef: varchar("city_ref").notNull().references(() => novaPoshtaCities.ref),
  description: text("description").notNull(),
  descriptionRu: text("description_ru"),
  shortAddress: varchar("short_address"),
  phone: varchar("phone"),
  schedule: text("schedule"),
  number: varchar("number"),
  placeMaxWeightAllowed: integer("place_max_weight_allowed"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertNovaPoshtaCitySchema = createInsertSchema(novaPoshtaCities).omit({ 
  id: true, 
  lastUpdated: true 
});

export const insertNovaPoshtaWarehouseSchema = createInsertSchema(novaPoshtaWarehouses).omit({ 
  id: true, 
  lastUpdated: true 
});

export type NovaPoshtaCity = typeof novaPoshtaCities.$inferSelect;
export type InsertNovaPoshtaCity = z.infer<typeof insertNovaPoshtaCitySchema>;
export type NovaPoshtaWarehouse = typeof novaPoshtaWarehouses.$inferSelect;
export type InsertNovaPoshtaWarehouse = z.infer<typeof insertNovaPoshtaWarehouseSchema>;

// Таблиця завдань на виготовлення товарів
export const manufacturingOrders = pgTable("manufacturing_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 100 }).notNull().unique(),
  productId: integer("product_id").notNull().references(() => products.id),
  recipeId: integer("recipe_id").references(() => recipes.id),
  plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 4 }).notNull(),
  producedQuantity: decimal("produced_quantity", { precision: 12, scale: 4 }).default("0"),
  unit: varchar("unit", { length: 50 }).notNull().default("шт"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in_progress, completed, cancelled, paused
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  assignedWorkerId: integer("assigned_worker_id").references(() => workers.id),
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  startDate: timestamp("start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedDuration: integer("estimated_duration"), // в хвилинах
  actualDuration: integer("actual_duration"), // в хвилинах
  materialCost: decimal("material_cost", { precision: 12, scale: 2 }).default("0"),
  laborCost: decimal("labor_cost", { precision: 12, scale: 2 }).default("0"),
  overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  qualityRating: varchar("quality_rating", { length: 20 }).default("good"), // excellent, good, acceptable, poor
  notes: text("notes"),
  batchNumber: varchar("batch_number", { length: 100 }),
  serialNumbers: text("serial_numbers").array(), // масив серійних номерів
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Матеріали, використані у виготовленні
export const manufacturingOrderMaterials = pgTable("manufacturing_order_materials", {
  id: serial("id").primaryKey(),
  manufacturingOrderId: integer("manufacturing_order_id").notNull().references(() => manufacturingOrders.id),
  productId: integer("product_id").references(() => products.id),
  componentId: integer("component_id").references(() => components.id),
  plannedQuantity: decimal("planned_quantity", { precision: 12, scale: 4 }).notNull(),
  actualQuantity: decimal("actual_quantity", { precision: 12, scale: 4 }).default("0"),
  unit: varchar("unit", { length: 50 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  wasteQuantity: decimal("waste_quantity", { precision: 12, scale: 4 }).default("0"), // відходи
  batchNumber: varchar("batch_number", { length: 100 }),
  consumedAt: timestamp("consumed_at").defaultNow(),
});

// Етапи виготовлення
export const manufacturingSteps = pgTable("manufacturing_steps", {
  id: serial("id").primaryKey(),
  manufacturingOrderId: integer("manufacturing_order_id").notNull().references(() => manufacturingOrders.id),
  stepNumber: integer("step_number").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, skipped
  estimatedDuration: integer("estimated_duration"), // в хвилинах
  actualDuration: integer("actual_duration"), // в хвилинах
  assignedWorkerId: integer("assigned_worker_id").references(() => workers.id),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  qualityCheckPassed: boolean("quality_check_passed").default(true),
  notes: text("notes"),
  equipment: varchar("equipment", { length: 255 }),
  temperature: varchar("temperature", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertManufacturingOrderSchema = createInsertSchema(manufacturingOrders).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  orderNumber: true 
});

export const insertManufacturingOrderMaterialSchema = createInsertSchema(manufacturingOrderMaterials).omit({ 
  id: true, 
  consumedAt: true 
});

export const insertManufacturingStepSchema = createInsertSchema(manufacturingSteps).omit({ 
  id: true, 
  createdAt: true 
});

export type ManufacturingOrder = typeof manufacturingOrders.$inferSelect;
export type InsertManufacturingOrder = z.infer<typeof insertManufacturingOrderSchema>;
export type ManufacturingOrderMaterial = typeof manufacturingOrderMaterials.$inferSelect;
export type InsertManufacturingOrderMaterial = z.infer<typeof insertManufacturingOrderMaterialSchema>;
export type ManufacturingStep = typeof manufacturingSteps.$inferSelect;
export type InsertManufacturingStep = z.infer<typeof insertManufacturingStepSchema>;

// Таблиця валют
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(), // USD, EUR, UAH, etc.
  name: varchar("name", { length: 100 }).notNull(), // US Dollar, Euro, Ukrainian Hryvnia
  symbol: varchar("symbol", { length: 10 }), // $, €, ₴
  decimalPlaces: integer("decimal_places").default(2), // Кількість знаків після коми
  isBase: boolean("is_base").default(false), // Базова валюта системи
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Історія курсів валют
export const exchangeRateHistory = pgTable("exchange_rate_history", {
  id: serial("id").primaryKey(),
  currencyId: integer("currency_id").notNull().references(() => currencies.id, { onDelete: "cascade" }),
  rate: decimal("rate", { precision: 15, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Курси валют для продуктів (можуть відрізнятися від загальних курсів)
export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  currencyId: integer("currency_id").notNull().references(() => currencies.id),
  costPrice: decimal("cost_price", { precision: 12, scale: 6 }).default("0"),
  retailPrice: decimal("retail_price", { precision: 12, scale: 6 }).default("0"),
  wholesalePrice: decimal("wholesale_price", { precision: 12, scale: 6 }).default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCurrencySchema = createInsertSchema(currencies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true
});

export const insertExchangeRateHistorySchema = createInsertSchema(exchangeRateHistory).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProductPriceSchema = createInsertSchema(productPrices).omit({ 
  id: true, 
  createdAt: true,
  lastUpdated: true 
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type ExchangeRateHistory = typeof exchangeRateHistory.$inferSelect;
export type InsertExchangeRateHistory = z.infer<typeof insertExchangeRateHistorySchema>;
export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;

// Глобальні налаштування серійних номерів
export const serialNumberSettings = pgTable("serial_number_settings", {
  id: serial("id").primaryKey(),
  useCrossNumbering: boolean("use_cross_numbering").default(false), // сквозна нумерація
  globalTemplate: text("global_template").default("{year}{month:2}{day:2}-{counter:6}"), // глобальний шаблон
  globalPrefix: text("global_prefix"), // глобальний префікс
  globalStartNumber: integer("global_start_number").default(1), // початковий номер для сквозної нумерації
  currentGlobalCounter: integer("current_global_counter").default(0), // поточний лічільник
  nextSerialNumber: integer("next_serial_number").default(1), // наступний серійний номер
  resetCounterPeriod: text("reset_counter_period").default("never"), // never, yearly, monthly, daily
  lastResetDate: timestamp("last_reset_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Serial Numbers table
export const serialNumbers = pgTable("serial_numbers", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  status: text("status").notNull().default("available"), // available, reserved, sold, defective
  warehouseId: integer("warehouse_id").references(() => warehouses.id),
  orderId: integer("order_id").references(() => orders.id),
  invoiceNumber: text("invoice_number"), // номер рахунку
  clientShortName: text("client_short_name"), // скорочена назва клієнта
  saleDate: timestamp("sale_date"), // дата продажі
  notes: text("notes"),
  manufacturedDate: timestamp("manufactured_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSerialNumberSettingsSchema = createInsertSchema(serialNumberSettings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export const insertSerialNumberSchema = createInsertSchema(serialNumbers).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type SerialNumberSettings = typeof serialNumberSettings.$inferSelect;
export type InsertSerialNumberSettings = z.infer<typeof insertSerialNumberSettingsSchema>;
export type SerialNumber = typeof serialNumbers.$inferSelect;
export type InsertSerialNumber = z.infer<typeof insertSerialNumberSchema>;

// Схеми валідації для листування
export const insertClientMailSchema = createInsertSchema(clientMail).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertMailRegistrySchema = createInsertSchema(mailRegistry).omit({ 
  id: true, 
  createdAt: true 
});

export const insertEnvelopePrintSettingsSchema = createInsertSchema(envelopePrintSettings).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  fontSize: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  senderRecipientFontSize: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  postalIndexFontSize: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  advertisementFontSize: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  imageSize: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  centerImage: z.boolean().optional().default(false),
  isDefault: z.boolean().optional().default(false),
  senderPosition: z.union([z.string(), z.object({ x: z.number(), y: z.number() })]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).optional(),
  recipientPosition: z.union([z.string(), z.object({ x: z.number(), y: z.number() })]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).optional(),
  adPositionCoords: z.union([z.string(), z.object({})]).transform(val => 
    typeof val === 'string' ? val : JSON.stringify(val)
  ).optional()
});

export type ClientMail = typeof clientMail.$inferSelect;
export type InsertClientMail = z.infer<typeof insertClientMailSchema>;
export type MailRegistry = typeof mailRegistry.$inferSelect;
export type InsertMailRegistry = z.infer<typeof insertMailRegistrySchema>;
export type EnvelopePrintSettings = typeof envelopePrintSettings.$inferSelect;
export type InsertEnvelopePrintSettings = z.infer<typeof insertEnvelopePrintSettingsSchema>;



// Схеми для валідації нових таблиць користувачів
export const insertLocalUserSchema = createInsertSchema(localUsers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  lastLoginAt: true,
  passwordResetToken: true,
  passwordResetExpires: true 
}).extend({
  password: z.string().min(6, "Пароль повинен містити мінімум 6 символів"),
  email: z.string().email("Невірний формат email"),
  confirmPassword: z.string().optional()
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

export const insertRoleSchema = createInsertSchema(roles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSystemModuleSchema = createInsertSchema(systemModules).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserLoginHistorySchema = createInsertSchema(userLoginHistory).omit({ 
  id: true, 
  loginTime: true,
  logoutTime: true,
  sessionDuration: true 
});

// Схема для зміни пароля
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Поточний пароль обов'язковий"),
  newPassword: z.string().min(6, "Новий пароль повинен містити мінімум 6 символів"),
  confirmPassword: z.string().min(1, "Підтвердження пароля обов'язкове"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

// Schema for admin password reset (without current password)
export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Новий пароль повинен містити мінімум 6 символів"),
  confirmPassword: z.string().min(1, "Підтвердження пароля обов'язкове"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

// Схема для входу в систему
export const loginSchema = z.object({
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

// Схема для скидання пароля
export const resetPasswordSchema = z.object({
  email: z.string().email("Невірний формат email"),
});

export const newPasswordSchema = z.object({
  token: z.string().min(1, "Токен обов'язковий"),
  password: z.string().min(6, "Пароль повинен містити мінімум 6 символів"),
  confirmPassword: z.string().min(1, "Підтвердження пароля обов'язкове"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

// Типи для всіх таблиць користувачів
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = z.infer<typeof insertLocalUserSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type SystemModule = typeof systemModules.$inferSelect;
export type InsertSystemModule = z.infer<typeof insertSystemModuleSchema>;

export type UserLoginHistory = typeof userLoginHistory.$inferSelect;
export type InsertUserLoginHistory = z.infer<typeof insertUserLoginHistorySchema>;

export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type AdminResetPassword = z.infer<typeof adminResetPasswordSchema>;
export type Login = z.infer<typeof loginSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type NewPassword = z.infer<typeof newPasswordSchema>;

// Tech card types
export type TechCard = typeof techCards.$inferSelect;
export type InsertTechCard = z.infer<typeof insertTechCardSchema>;
export type TechCardStep = typeof techCardSteps.$inferSelect;
export type InsertTechCardStep = z.infer<typeof insertTechCardStepSchema>;
export type TechCardMaterial = typeof techCardMaterials.$inferSelect;
export type InsertTechCardMaterial = z.infer<typeof insertTechCardMaterialSchema>;

// Client types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type ClientContact = typeof clientContacts.$inferSelect;
export type InsertClientContact = z.infer<typeof insertClientContactSchema>;

// Tasks table for general task management
export const tasks = pgTable("tasks", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type ClientNovaPoshtaSettings = typeof clientNovaPoshtaSettings.$inferSelect;
export type InsertClientNovaPoshtaSettings = z.infer<typeof insertClientNovaPoshtaSettingsSchema>;

// ================================
// ІНТЕГРАЦІЇ З ЗОВНІШНІМИ СИСТЕМАМИ
// ================================

// Таблиця конфігурацій інтеграцій
export const integrationConfigs = pgTable("integration_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "bitrix24", "1c_enterprise", "1c_accounting"
  displayName: varchar("display_name", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "crm", "accounting", "erp"
  isActive: boolean("is_active").default(false),
  config: jsonb("config").$type<{
    baseUrl?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    webhookUrl?: string;
    syncInterval?: number; // хвилини
    lastSyncAt?: string;
    syncMethods?: string[]; // ["clients", "orders", "products", "payments"]
    customFields?: Record<string, any>;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця логів синхронізації
export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
  operation: varchar("operation", { length: 100 }).notNull(), // "import_clients", "export_orders", "sync_products"
  status: varchar("status", { length: 50 }).notNull(), // "started", "completed", "failed", "partial"
  recordsProcessed: integer("records_processed").default(0),
  recordsSuccessful: integer("records_successful").default(0),
  recordsFailed: integer("records_failed").default(0),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  details: jsonb("details"), // детальна інформація про синхронізацію
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблиця мапінгу ID між системами
export const entityMappings = pgTable("entity_mappings", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "client", "order", "product", "contact"
  localId: varchar("local_id", { length: 100 }).notNull(), // ID в нашій системі
  externalId: varchar("external_id", { length: 100 }).notNull(), // ID в зовнішній системі
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  syncDirection: varchar("sync_direction", { length: 20 }).default("bidirectional"), // "import", "export", "bidirectional"
  metadata: jsonb("metadata"), // додаткова інформація про мапінг
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_entity_mappings_integration_entity").on(table.integrationId, table.entityType),
  index("idx_entity_mappings_local_id").on(table.localId),
  index("idx_entity_mappings_external_id").on(table.externalId),
]);

// Таблиця черги синхронізації
export const syncQueue = pgTable("sync_queue", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
  operation: varchar("operation", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  direction: varchar("direction", { length: 20 }).notNull(), // "import", "export"
  priority: integer("priority").default(5), // 1-10, де 1 - найвищий пріоритет
  status: varchar("status", { length: 50 }).default("pending"), // "pending", "processing", "completed", "failed"
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  payload: jsonb("payload"), // дані для синхронізації
  errorMessage: text("error_message"),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця налаштувань полів мапінгу
export const fieldMappings = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").references(() => integrationConfigs.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  localField: varchar("local_field", { length: 100 }).notNull(), // назва поля в нашій системі
  externalField: varchar("external_field", { length: 100 }).notNull(), // назва поля в зовнішній системі
  transformation: varchar("transformation", { length: 50 }), // "none", "date_format", "currency_conversion", "custom"
  transformationConfig: jsonb("transformation_config"), // конфігурація трансформації
  isRequired: boolean("is_required").default(false),
  direction: varchar("direction", { length: 20 }).default("bidirectional"), // "import", "export", "bidirectional"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Релації для інтеграцій
export const integrationConfigsRelations = relations(integrationConfigs, ({ many }) => ({
  syncLogs: many(syncLogs),
  entityMappings: many(entityMappings),
  syncQueue: many(syncQueue),
  fieldMappings: many(fieldMappings),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  integration: one(integrationConfigs, {
    fields: [syncLogs.integrationId],
    references: [integrationConfigs.id],
  }),
}));

export const entityMappingsRelations = relations(entityMappings, ({ one }) => ({
  integration: one(integrationConfigs, {
    fields: [entityMappings.integrationId],
    references: [integrationConfigs.id],
  }),
}));

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  integration: one(integrationConfigs, {
    fields: [syncQueue.integrationId],
    references: [integrationConfigs.id],
  }),
}));

export const fieldMappingsRelations = relations(fieldMappings, ({ one }) => ({
  integration: one(integrationConfigs, {
    fields: [fieldMappings.integrationId],
    references: [integrationConfigs.id],
  }),
}));

// Zod схеми для інтеграцій
export const insertIntegrationConfigSchema = createInsertSchema(integrationConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncLogSchema = createInsertSchema(syncLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEntityMappingSchema = createInsertSchema(entityMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyncQueueSchema = createInsertSchema(syncQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Типи для інтеграцій
export type IntegrationConfig = typeof integrationConfigs.$inferSelect;
export type InsertIntegrationConfig = z.infer<typeof insertIntegrationConfigSchema>;
export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>;
export type EntityMapping = typeof entityMappings.$inferSelect;
export type InsertEntityMapping = z.infer<typeof insertEntityMappingSchema>;
export type SyncQueue = typeof syncQueue.$inferSelect;
export type InsertSyncQueue = z.infer<typeof insertSyncQueueSchema>;
export type FieldMapping = typeof fieldMappings.$inferSelect;
export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;

// ================================
// РАХУНКИ ТА ПЛАТЕЖІ
// ================================

// Таблиця для рахунків
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  companyId: integer("company_id").references(() => companies.id), // яка компанія виставила рахунок
  orderId: integer("order_id").references(() => orders.id), // зв'язок з замовленням
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("UAH"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  description: text("description"),
  externalId: varchar("external_id", { length: 100 }),
  source: varchar("source", { length: 20 }).default("manual"), // bitrix24, 1c, manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблиця для позицій рахунків
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  productExternalId: varchar("product_external_id", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Схеми валідації для рахунків
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ 
  id: true, 
  createdAt: true 
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Типи для компаній
export const insertCompanySchema = createInsertSchema(companies).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;


