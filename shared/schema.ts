import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
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
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  retailPrice: decimal("retail_price", { precision: 10, scale: 2 }).notNull(),
  photo: text("photo"),
  productType: text("product_type").notNull().default("product"), // product, component, material
  unit: text("unit").notNull().default("шт"), // одиниця виміру
  minStock: integer("min_stock").default(0),
  maxStock: integer("max_stock").default(1000),
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
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
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
  estimatedTime: integer("estimated_time").notNull(), // в хвилинах
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  status: text("status").notNull().default("active"), // active, inactive
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }).default("0"),
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
});

export const techCardMaterials = pgTable("tech_card_materials", {
  id: serial("id").primaryKey(),
  techCardId: integer("tech_card_id").references(() => techCards.id),
  productId: integer("product_id").references(() => products.id),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
});

// Таблиця для композиції продуктів (BOM - Bill of Materials)
export const productComponents = pgTable("product_components", {
  id: serial("id").primaryKey(),
  parentProductId: integer("parent_product_id").references(() => products.id).notNull(),
  componentProductId: integer("component_product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull().default("шт"),
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, updatedAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, orderNumber: true, totalAmount: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertProductionTaskSchema = createInsertSchema(productionTasks).omit({ id: true, createdAt: true });

export const insertTechCardSchema = createInsertSchema(techCards).omit({ id: true, createdAt: true });
export const insertTechCardStepSchema = createInsertSchema(techCardSteps).omit({ id: true });
export const insertTechCardMaterialSchema = createInsertSchema(techCardMaterials).omit({ id: true });
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
  position: varchar("position", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  hireDate: timestamp("hire_date"),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
export type TechCard = typeof techCards.$inferSelect;
export type InsertTechCard = z.infer<typeof insertTechCardSchema>;
export type TechCardStep = typeof techCardSteps.$inferSelect;
export type InsertTechCardStep = z.infer<typeof insertTechCardStepSchema>;
export type TechCardMaterial = typeof techCardMaterials.$inferSelect;
export type InsertTechCardMaterial = z.infer<typeof insertTechCardMaterialSchema>;
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
