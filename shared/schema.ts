import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
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

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
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
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertProductionTaskSchema = createInsertSchema(productionTasks).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertTechCardSchema = createInsertSchema(techCards).omit({ id: true, createdAt: true });
export const insertTechCardStepSchema = createInsertSchema(techCardSteps).omit({ id: true });
export const insertTechCardMaterialSchema = createInsertSchema(techCardMaterials).omit({ id: true });
export const insertProductComponentSchema = createInsertSchema(productComponents).omit({ id: true, createdAt: true });

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
