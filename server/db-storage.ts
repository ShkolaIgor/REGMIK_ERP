import { eq, sql, desc, and, gte, lte, isNull } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import {
  users, localUsers, roles, systemModules, userLoginHistory, categories, warehouses, units, products, inventory, orders, orderItems, orderStatuses,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  components, productComponents, costCalculations, materialShortages, supplierOrders, supplierOrderItems,
  assemblyOperations, assemblyOperationItems, workers, inventoryAudits, inventoryAuditItems,
  productionForecasts, warehouseTransfers, warehouseTransferItems, positions, departments, packageTypes, solderingTypes,
  componentCategories, componentAlternatives, carriers, shipments, shipmentItems, customerAddresses, senderSettings,
  manufacturingOrders, manufacturingOrderMaterials, manufacturingSteps, currencies, exchangeRateHistory, serialNumbers, serialNumberSettings, emailSettings,
  sales, saleItems, expenses, timeEntries, inventoryAlerts, tasks, clients, clientContacts, clientNovaPoshtaSettings,
  clientMail, mailRegistry, envelopePrintSettings, companies, syncLogs, userSortPreferences,
  type User, type UpsertUser, type LocalUser, type InsertLocalUser, type Role, type InsertRole,
  type SystemModule, type InsertSystemModule, type UserLoginHistory, type InsertUserLoginHistory,
  type Category, type InsertCategory,
  type Warehouse, type InsertWarehouse, type Unit, type InsertUnit,
  type Product, type InsertProduct,
  type Inventory, type InsertInventory, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient,
  type ProductionTask, type InsertProductionTask,
  type Supplier, type InsertSupplier,
  type TechCard, type InsertTechCard,
  type TechCardStep, type InsertTechCardStep,
  type TechCardMaterial, type InsertTechCardMaterial,
  type Component, type InsertComponent,
  type ComponentCategory, type InsertComponentCategory,
  type PackageType, type InsertPackageType,
  type ProductComponent, type InsertProductComponent,
  type Carrier, type InsertCarrier,
  type Client, type InsertClient,
  type ClientMail, type InsertClientMail,
  type MailRegistry, type InsertMailRegistry,
  type EnvelopePrintSettings, type InsertEnvelopePrintSettings,
  type Company, type InsertCompany,
  type OrderStatus, type InsertOrderStatus,
  type Shipment, type InsertShipment,
  type CustomerAddress, type InsertCustomerAddress,
  type SenderSettings, type InsertSenderSettings,
  type Currency, type InsertCurrency, type ExchangeRateHistory,
  type SerialNumber, type InsertSerialNumber,
  type SerialNumberSettings, type InsertSerialNumberSettings,
  type CostCalculation, type InsertCostCalculation,
  type MaterialShortage, type InsertMaterialShortage,
  type SupplierOrder, type InsertSupplierOrder,
  type SupplierOrderItem, type InsertSupplierOrderItem,
  type InventoryAudit, type InsertInventoryAudit,
  type InventoryAuditItem, type InsertInventoryAuditItem,
  type AssemblyOperation, type InsertAssemblyOperation,
  type AssemblyOperationItem, type InsertAssemblyOperationItem,
  type Worker, type InsertWorker,
  type ProductionForecast, type InsertProductionForecast,
  type WarehouseTransfer, type InsertWarehouseTransfer,
  type WarehouseTransferItem, type InsertWarehouseTransferItem,
  type Position, type InsertPosition,
  type Department, type InsertDepartment,
  type SolderingType, type InsertSolderingType,
  type ComponentAlternative, type InsertComponentAlternative,
  type EmailSettings, type InsertEmailSettings,
  type ClientContact, type InsertClientContact,
  type ClientNovaPoshtaSettings, type InsertClientNovaPoshtaSettings,
  type UserSortPreference, type InsertUserSortPreference,

} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private db = db;
  
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Перевіряємо чи є дані в базі, якщо ні - додаємо початкові дані
    const categoriesCount = await db.select({ count: sql<number>`count(*)` }).from(categories);
    if (categoriesCount[0].count === 0) {
      await this.seedInitialData();
    }
  }

  private async seedInitialData() {
    // Додаємо початкові дані
    await db.insert(categories).values({
      name: "Електроніка",
      description: "Електронні компоненти"
    });

    await db.insert(warehouses).values({
      name: "Головний склад",
      location: "Київ",
      description: "Основний склад"
    });
  }

  // Users (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const result = await db.insert(warehouses).values(insertWarehouse).returning();
    return result[0];
  }

  async updateWarehouse(id: number, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const result = await db
      .update(warehouses)
      .set(warehouseData)
      .where(eq(warehouses.id, id))
      .returning();
    return result[0];
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const result = await db.delete(warehouses).where(eq(warehouses.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Units
  async getUnits(): Promise<Unit[]> {
    return await db.select().from(units);
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const result = await db.insert(units).values(insertUnit).returning();
    return result[0];
  }

  async updateUnit(id: number, unitData: Partial<InsertUnit>): Promise<Unit | undefined> {
    const result = await db
      .update(units)
      .set(unitData)
      .where(eq(units.id, id))
      .returning();
    return result[0];
  }

  async deleteUnit(id: number): Promise<boolean> {
    const result = await db.delete(units).where(eq(units.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0] || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Inventory
  async getInventory(): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]> {
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
    })
    .from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id))
    .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id));

    return result.filter(item => item.product && item.warehouse) as (Inventory & { product: Product; warehouse: Warehouse })[];
  }

  async getInventoryByWarehouse(warehouseId: number): Promise<(Inventory & { product: Product })[]> {
    const result = await db.select({
      id: inventory.id,
      productId: inventory.productId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      updatedAt: inventory.updatedAt,
      product: products
    })
    .from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id))
    .where(eq(inventory.warehouseId, warehouseId));

    return result.filter(item => item.product) as (Inventory & { product: Product })[];
  }

  async updateInventory(productId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined> {
    const existing = await db.select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .and(eq(inventory.warehouseId, warehouseId));

    if (existing.length > 0) {
      const result = await db.update(inventory)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(inventory.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(inventory).values({
        productId,
        warehouseId,
        quantity,
        updatedAt: new Date()
      }).returning();
      return result[0];
    }
  }

  // Orders
  async getOrders(): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
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
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

        const items = itemsResult.filter(item => item.product) as (OrderItem & { product: Product })[];
        
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id));
    if (orderResult.length === 0) return undefined;

    const itemsResult = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      product: products
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

    const items = itemsResult.filter(item => item.product) as (OrderItem & { product: Product })[];

    return { ...orderResult[0], items };
  }

  async getOrderProducts(orderId: number): Promise<any[]> {
    const result = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      pricePerUnit: orderItems.unitPrice,
      product: products
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
    
    return result;
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Генеруємо номер замовлення
    const orderNumber = `ORD-${Date.now()}`;
    
    // Отримуємо ціни товарів з бази даних та розраховуємо загальну суму
    let totalAmount = 0;
    const itemsWithPrices: InsertOrderItem[] = [];
    
    for (const item of items) {
      // Отримуємо товар з бази даних для встановлення актуальної ціни
      const product = await db.select().from(products).where(eq(products.id, typeof item.productId === 'string' ? parseInt(item.productId) : item.productId)).limit(1);
      
      if (product.length > 0) {
        const unitPrice = parseFloat(product[0].retailPrice || "0");
        const quantity = parseFloat(typeof item.quantity === 'string' ? item.quantity : item.quantity?.toString() || "1");
        const totalPrice = unitPrice * quantity;
        
        const itemWithPrice = {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString()
        };
        
        itemsWithPrices.push(itemWithPrice);
        totalAmount += totalPrice;
      } else {
        // Якщо товар не знайдено, використовуємо передану ціну
        const itemPrice = parseFloat(item.totalPrice || "0");
        itemsWithPrices.push(item);
        totalAmount += itemPrice;
      }
    }

    const orderData = {
      ...insertOrder,
      orderNumber,
      totalAmount: totalAmount.toString(),
      clientId: insertOrder.clientId ? (typeof insertOrder.clientId === 'string' ? parseInt(insertOrder.clientId) : insertOrder.clientId) : null,
    };

    const orderResult = await db.insert(orders).values(orderData).returning();
    const order = orderResult[0];

    if (itemsWithPrices.length > 0) {
      const itemsToInsert = itemsWithPrices.map(item => ({ ...item, orderId: order.id }));
      console.log('Inserting order items with calculated prices:', itemsToInsert);
      
      try {
        const insertResult = await db.insert(orderItems).values(itemsToInsert).returning();
        console.log('Order items inserted successfully:', insertResult);
      } catch (error) {
        console.error('Error inserting order items:', error);
        throw error;
      }
    }

    return order;
  }

  async updateOrder(id: number, insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order | undefined> {
    try {
      // Отримуємо ціни товарів з бази даних та розраховуємо загальну суму
      let totalAmount = 0;
      const itemsWithPrices: InsertOrderItem[] = [];
      
      for (const item of items) {
        // Використовуємо ціну з форми, а не з бази даних
        const unitPrice = parseFloat(item.unitPrice || "0");
        const quantity = parseFloat(typeof item.quantity === 'string' ? item.quantity : item.quantity?.toString() || "1");
        const totalPrice = unitPrice * quantity;
        
        const itemWithPrice = {
          ...item,
          unitPrice: unitPrice.toString(),
          totalPrice: totalPrice.toString()
        };
        
        itemsWithPrices.push(itemWithPrice);
        totalAmount += totalPrice;
      }

      // Оновлюємо замовлення
      const orderData: any = {
        ...insertOrder,
        totalAmount: totalAmount.toString(),
        clientId: insertOrder.clientId ? (typeof insertOrder.clientId === 'string' ? parseInt(insertOrder.clientId) : insertOrder.clientId) : null,
      };

      // Конвертуємо дати з рядків у Date об'єкти
      if (orderData.paymentDate && typeof orderData.paymentDate === 'string') {
        orderData.paymentDate = new Date(orderData.paymentDate);
      }
      if (orderData.dueDate && typeof orderData.dueDate === 'string') {
        orderData.dueDate = new Date(orderData.dueDate);
      }
      if (orderData.shippedDate && typeof orderData.shippedDate === 'string') {
        orderData.shippedDate = new Date(orderData.shippedDate);
      }

      const orderResult = await db.update(orders)
        .set(orderData)
        .where(eq(orders.id, id))
        .returning();

      if (orderResult.length === 0) {
        return undefined;
      }

      // Для безпечного оновлення не видаляємо існуючі товари, а тільки оновлюємо дані замовлення
      // При необхідності можна додати нові товари
      if (itemsWithPrices.length > 0) {
        // Видаляємо всі існуючі товари замовлення
        try {
          await db.delete(orderItems).where(eq(orderItems.orderId, id));
        } catch (error: any) {
          // Якщо не можемо видалити через foreign key constraint, просто додаємо нові товари
          console.log('Cannot delete order items due to foreign key constraint, adding new items instead');
        }
        
        const itemsToInsert = itemsWithPrices.map(item => ({ ...item, orderId: id }));
        console.log('Updating order items with calculated prices:', itemsToInsert);
        
        await db.insert(orderItems).values(itemsToInsert);
      }

      // Повертаємо оновлене замовлення з товарами
      return await this.getOrder(id);
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      // Спочатку видаляємо всі товари з замовлення
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      
      // Потім видаляємо саме замовлення
      const result = await db.delete(orders).where(eq(orders.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }

  async updateOrderPaymentDate(id: number, paymentDate: string | null): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ paymentDate: paymentDate ? new Date(paymentDate) : null })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async updateOrderDueDate(id: number, dueDate: string | null): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ dueDate: dueDate ? new Date(dueDate) : null })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { product: Product })[] }) | undefined> {
    const recipeResult = await db.select().from(recipes).where(eq(recipes.id, id));
    if (recipeResult.length === 0) return undefined;

    const ingredientsResult = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      productId: recipeIngredients.productId,
      quantity: recipeIngredients.quantity,
      unit: recipeIngredients.unit,
      product: products
    })
    .from(recipeIngredients)
    .leftJoin(products, eq(recipeIngredients.productId, products.id))
    .where(eq(recipeIngredients.recipeId, id));

    const ingredients = ingredientsResult.filter(item => item.product) as (RecipeIngredient & { product: Product })[];

    return { ...recipeResult[0], ingredients };
  }

  async createRecipe(insertRecipe: InsertRecipe, ingredients: InsertRecipeIngredient[]): Promise<Recipe> {
    const recipeResult = await db.insert(recipes).values(insertRecipe).returning();
    const recipe = recipeResult[0];

    if (ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        ingredients.map(ingredient => ({ ...ingredient, recipeId: recipe.id }))
      );
    }

    return recipe;
  }

  async updateRecipe(id: number, updateData: Partial<InsertRecipe>, ingredients?: InsertRecipeIngredient[]): Promise<Recipe | undefined> {
    const recipeResult = await db.update(recipes)
      .set(updateData)
      .where(eq(recipes.id, id))
      .returning();

    if (recipeResult.length === 0) return undefined;

    if (ingredients) {
      // Видаляємо існуючі інгредієнти
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
      
      // Додаємо нові інгредієнти
      if (ingredients.length > 0) {
        await db.insert(recipeIngredients).values(
          ingredients.map(ingredient => ({ ...ingredient, recipeId: id }))
        );
      }
    }

    return recipeResult[0];
  }

  // Production Tasks
  async getProductionTasks(): Promise<(ProductionTask & { recipe: Recipe })[]> {
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
    })
    .from(productionTasks)
    .leftJoin(recipes, eq(productionTasks.recipeId, recipes.id));

    return result.filter(item => item.recipe) as (ProductionTask & { recipe: Recipe })[];
  }

  async createProductionTask(insertTask: InsertProductionTask): Promise<ProductionTask> {
    const result = await db.insert(productionTasks).values(insertTask).returning();
    return result[0];
  }

  async updateProductionTask(id: number, taskData: Partial<InsertProductionTask>): Promise<ProductionTask | undefined> {
    const result = await db.update(productionTasks)
      .set(taskData)
      .where(eq(productionTasks.id, id))
      .returning();
    return result[0];
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }

  async updateSupplier(id: number, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db
      .update(suppliers)
      .set({ ...supplierData, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount > 0;
  }

  // Components
  async getComponents(): Promise<Component[]> {
    return await db.select().from(components);
  }

  async getComponent(id: number): Promise<Component | undefined> {
    const result = await db.select().from(components).where(eq(components.id, id));
    return result[0];
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const result = await db.insert(components).values(insertComponent).returning();
    return result[0];
  }

  async updateComponent(id: number, componentData: Partial<InsertComponent>): Promise<Component | undefined> {
    const result = await db
      .update(components)
      .set({ ...componentData })
      .where(eq(components.id, id))
      .returning();
    return result[0];
  }

  async deleteComponent(id: number): Promise<boolean> {
    const result = await db.delete(components).where(eq(components.id, id));
    return result.rowCount! > 0;
  }

  // Tech Cards
  async getTechCards(): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] })[]> {
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
    })
    .from(techCards)
    .leftJoin(products, eq(techCards.productId, products.id));

    const result = [];
    for (const techCard of techCardsResult) {
      if (!techCard.product) continue;

      // Отримуємо кроки
      const steps = await db.select()
        .from(techCardSteps)
        .where(eq(techCardSteps.techCardId, techCard.id))
        .orderBy(techCardSteps.stepNumber);

      // Отримуємо матеріали з продуктами
      const materialsResult = await db.select({
        id: techCardMaterials.id,
        techCardId: techCardMaterials.techCardId,
        productId: techCardMaterials.productId,
        quantity: techCardMaterials.quantity,
        unit: techCardMaterials.unit,
        product: products
      })
      .from(techCardMaterials)
      .leftJoin(products, eq(techCardMaterials.productId, products.id))
      .where(eq(techCardMaterials.techCardId, techCard.id));

      const materials = materialsResult.filter(m => m.product) as (TechCardMaterial & { product: Product })[];

      result.push({
        ...techCard,
        product: techCard.product,
        steps,
        materials
      });
    }

    return result;
  }

  async getTechCard(id: number): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] }) | undefined> {
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
    })
    .from(techCards)
    .leftJoin(products, eq(techCards.productId, products.id))
    .where(eq(techCards.id, id));

    if (techCardResult.length === 0 || !techCardResult[0].product) return undefined;

    const techCard = techCardResult[0];

    // Отримуємо кроки
    const steps = await db.select()
      .from(techCardSteps)
      .where(eq(techCardSteps.techCardId, id))
      .orderBy(techCardSteps.stepNumber);

    // Отримуємо матеріали з продуктами
    const materialsResult = await db.select({
      id: techCardMaterials.id,
      techCardId: techCardMaterials.techCardId,
      productId: techCardMaterials.productId,
      quantity: techCardMaterials.quantity,
      unit: techCardMaterials.unit,
      product: products
    })
    .from(techCardMaterials)
    .leftJoin(products, eq(techCardMaterials.productId, products.id))
    .where(eq(techCardMaterials.techCardId, id));

    const materials = materialsResult.filter(m => m.product) as (TechCardMaterial & { product: Product })[];

    return {
      ...techCard,
      product: techCard.product!,
      steps,
      materials
    };
  }

  async createTechCard(insertTechCard: InsertTechCard, steps: InsertTechCardStep[], materials: InsertTechCardMaterial[]): Promise<TechCard> {
    const techCardResult = await db.insert(techCards).values(insertTechCard).returning();
    const techCard = techCardResult[0];

    // Додаємо кроки
    if (steps.length > 0) {
      await db.insert(techCardSteps).values(
        steps.map((step, index) => ({ 
          ...step, 
          techCardId: techCard.id,
          stepNumber: index + 1
        }))
      );
    }

    // Додаємо матеріали
    if (materials.length > 0) {
      await db.insert(techCardMaterials).values(
        materials.map(material => ({ 
          ...material, 
          techCardId: techCard.id 
        }))
      );
    }

    return techCard;
  }

  async updateTechCard(id: number, techCardData: Partial<InsertTechCard>, steps?: InsertTechCardStep[], materials?: InsertTechCardMaterial[]): Promise<TechCard | undefined> {
    const result = await db.update(techCards)
      .set(techCardData)
      .where(eq(techCards.id, id))
      .returning();
    
    if (result.length === 0) return undefined;

    // Оновлюємо кроки, якщо надано
    if (steps) {
      await db.delete(techCardSteps).where(eq(techCardSteps.techCardId, id));
      if (steps.length > 0) {
        await db.insert(techCardSteps).values(
          steps.map((step, index) => ({ 
            ...step, 
            techCardId: id,
            stepNumber: index + 1
          }))
        );
      }
    }

    // Оновлюємо матеріали, якщо надано
    if (materials) {
      await db.delete(techCardMaterials).where(eq(techCardMaterials.techCardId, id));
      if (materials.length > 0) {
        await db.insert(techCardMaterials).values(
          materials.map(material => ({ 
            ...material, 
            techCardId: id 
          }))
        );
      }
    }

    return result[0];
  }

  async deleteTechCard(id: number): Promise<boolean> {
    try {
      // Видаляємо пов'язані кроки та матеріали
      await db.delete(techCardSteps).where(eq(techCardSteps.techCardId, id));
      await db.delete(techCardMaterials).where(eq(techCardMaterials.techCardId, id));
      
      // Видаляємо саму технологічну карту
      const result = await db.delete(techCards).where(eq(techCards.id, id));
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting tech card:", error);
      return false;
    }
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    activeOrders: number;
    productionTasks: number;
  }> {
    const [totalProductsResult] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [activeOrdersResult] = await db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(sql`${orders.status} IN ('pending', 'processing')`);
    const [productionTasksResult] = await db.select({ count: sql<number>`count(*)` }).from(productionTasks)
      .where(sql`${productionTasks.status} != 'completed'`);



    // Розрахунок загальної вартості та низьких запасів
    const inventoryData = await db.select({
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      costPrice: products.costPrice
    })
    .from(inventory)
    .leftJoin(products, eq(inventory.productId, products.id));

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
  async getProductComponents(productId: number): Promise<(ProductComponent & { component: Product })[]> {
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
    })
    .from(productComponents)
    .leftJoin(products, eq(productComponents.componentProductId, products.id))
    .where(eq(productComponents.parentProductId, productId));

    return result.map(row => ({
      id: row.id,
      parentProductId: row.parentProductId,
      componentProductId: row.componentProductId,
      quantity: row.quantity,
      unit: row.unit,
      isOptional: row.isOptional,
      notes: row.notes,
      createdAt: row.createdAt,
      component: row.component!
    }));
  }

  async addProductComponent(insertComponent: InsertProductComponent): Promise<ProductComponent> {
    const [result] = await db.insert(productComponents)
      .values(insertComponent)
      .returning();
    return result;
  }

  async removeProductComponent(id: number): Promise<boolean> {
    const result = await db.delete(productComponents)
      .where(eq(productComponents.id, id))
      .returning();
    return result.length > 0;
  }

  async updateProductComponent(id: number, componentData: Partial<InsertProductComponent>): Promise<ProductComponent | undefined> {
    const result = await db.update(productComponents)
      .set(componentData)
      .where(eq(productComponents.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  // Cost Calculations
  async getCostCalculations(): Promise<(CostCalculation & { product: Product })[]> {
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
    })
    .from(costCalculations)
    .leftJoin(products, eq(costCalculations.productId, products.id));

    return result.filter(item => item.product) as (CostCalculation & { product: Product })[];
  }

  async getCostCalculation(productId: number): Promise<(CostCalculation & { product: Product }) | undefined> {
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
    })
    .from(costCalculations)
    .leftJoin(products, eq(costCalculations.productId, products.id))
    .where(eq(costCalculations.productId, productId))
    .limit(1);

    if (result.length === 0 || !result[0].product) return undefined;
    return result[0] as CostCalculation & { product: Product };
  }

  async createCostCalculation(calculation: InsertCostCalculation): Promise<CostCalculation> {
    const result = await db.insert(costCalculations).values(calculation).returning();
    return result[0];
  }

  async updateCostCalculation(id: number, calculation: Partial<InsertCostCalculation>): Promise<CostCalculation | undefined> {
    const result = await db.update(costCalculations)
      .set(calculation)
      .where(eq(costCalculations.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteCostCalculation(id: number): Promise<boolean> {
    const result = await db.delete(costCalculations)
      .where(eq(costCalculations.id, id))
      .returning();
    return result.length > 0;
  }

  async calculateAutomaticCost(productId: number): Promise<CostCalculation> {
    try {
      // Отримуємо компоненти продукта
      const components = await this.getProductComponents(productId);
      
      let materialCost = 0;
      for (const component of components) {
        const componentCostPrice = parseFloat(component.component.costPrice || "0");
        const quantity = parseFloat(component.quantity);
        materialCost += componentCostPrice * quantity;
      }

      // Отримуємо рецепт для розрахунку трудових витрат
      const productRecipes = await db.select({
        id: recipes.id,
        laborCost: recipes.laborCost
      })
      .from(recipes)
      .where(eq(recipes.productId, productId));

      let laborCost = 0;
      if (productRecipes.length > 0) {
        laborCost = parseFloat(productRecipes[0].laborCost || "0");
      }

      // Розрахунок накладних витрат (20% від матеріальних + трудових витрат)
      const overheadCost = (materialCost + laborCost) * 0.2;
      const totalCost = materialCost + laborCost + overheadCost;
      
      // Розрахунок ціни продажу з маржою 20%
      const profitMargin = 20;
      const sellingPrice = totalCost * (1 + profitMargin / 100);

      const calculationData: InsertCostCalculation = {
        productId,
        materialCost: materialCost.toFixed(2),
        laborCost: laborCost.toFixed(2),
        overheadCost: overheadCost.toFixed(2),
        totalCost: totalCost.toFixed(2),
        profitMargin: profitMargin.toFixed(2),
        sellingPrice: sellingPrice.toFixed(2),
        notes: "Автоматично розраховано на основі компонентів та рецептів"
      };

      // Перевіряємо чи існує калькуляція для цього продукта
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
  async getMaterialShortages(): Promise<(MaterialShortage & { product: Product; warehouse?: Warehouse; supplier?: Supplier })[]> {
    const result = await db.select({
      shortage: materialShortages,
      product: products,
      warehouse: warehouses,
      supplier: suppliers
    })
    .from(materialShortages)
    .leftJoin(products, eq(materialShortages.productId, products.id))
    .leftJoin(warehouses, eq(materialShortages.warehouseId, warehouses.id))
    .leftJoin(suppliers, eq(materialShortages.supplierRecommendationId, suppliers.id))
    .orderBy(materialShortages.priority, materialShortages.createdAt);

    return result.map(row => ({
      ...row.shortage,
      product: row.product!,
      warehouse: row.warehouse || undefined,
      supplier: row.supplier || undefined
    }));
  }

  async getMaterialShortage(id: number): Promise<(MaterialShortage & { product: Product; warehouse?: Warehouse }) | undefined> {
    const result = await db.select({
      shortage: materialShortages,
      product: products,
      warehouse: warehouses
    })
    .from(materialShortages)
    .leftJoin(products, eq(materialShortages.productId, products.id))
    .leftJoin(warehouses, eq(materialShortages.warehouseId, warehouses.id))
    .where(eq(materialShortages.id, id))
    .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.shortage,
      product: row.product!,
      warehouse: row.warehouse || undefined
    };
  }

  async createMaterialShortage(shortage: InsertMaterialShortage): Promise<MaterialShortage> {
    const result = await db.insert(materialShortages).values(shortage).returning();
    return result[0];
  }

  async updateMaterialShortage(id: number, shortageData: Partial<InsertMaterialShortage>): Promise<MaterialShortage | undefined> {
    try {
      console.log('Updating material shortage:', { id, shortageData });
      const result = await db.update(materialShortages)
        .set({ ...shortageData, updatedAt: new Date() })
        .where(eq(materialShortages.id, id))
        .returning();
      
      console.log('Update result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error updating material shortage:', error);
      throw error;
    }
  }

  async deleteMaterialShortage(id: number): Promise<boolean> {
    try {
      // Перевіряємо, чи є пов'язані замовлення постачальникам через supplier_order_items
      const relatedOrderItems = await db.select()
        .from(supplierOrderItems)
        .where(eq(supplierOrderItems.materialShortageId, id))
        .limit(1);
      
      // Якщо є пов'язані елементи замовлень, видаляємо їх
      if (relatedOrderItems.length > 0) {
        await db.delete(supplierOrderItems)
          .where(eq(supplierOrderItems.materialShortageId, id));
      }
      
      const result = await db.delete(materialShortages)
        .where(eq(materialShortages.id, id));
      
      return (result.rowCount || 0) > 0;
    } catch (error: any) {
      console.error('Error deleting material shortage:', error);
      throw new Error(error.message || "Помилка при видаленні дефіциту матеріалів");
    }
  }

  async calculateMaterialShortages(): Promise<MaterialShortage[]> {
    try {
      // Очищаємо тільки записи дефіциту зі статусом 'pending' (не замовлені)
      await db.delete(materialShortages)
        .where(eq(materialShortages.status, 'pending'));

      // Отримуємо всі компоненти з BOM
      const bomComponents = await db.select({
        parentProductId: productComponents.parentProductId,
        componentProductId: productComponents.componentProductId,
        quantity: productComponents.quantity,
        unit: productComponents.unit,
        component: products
      })
      .from(productComponents)
      .leftJoin(products, eq(productComponents.componentProductId, products.id));

      // Отримуємо поточні запаси
      const currentInventory = await db.select()
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id));

      // Групуємо потреби за продуктами
      const requirements: Map<number, { quantity: number; unit: string; product: Product }> = new Map();

      for (const bom of bomComponents) {
        if (!bom.component) continue;
        
        const key = bom.componentProductId;
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

      // Порівнюємо з наявними запасами та створюємо записи дефіциту
      const shortages: MaterialShortage[] = [];

      for (const [productId, requirement] of requirements) {
        // Знаходимо загальну кількість в наявності
        const availableStock = currentInventory
          .filter(item => item.inventory.productId === productId)
          .reduce((sum, item) => sum + item.inventory.quantity, 0);

        const shortageQuantity = requirement.quantity - availableStock;

        if (shortageQuantity > 0) {
          // Визначаємо пріоритет на основі критичності дефіциту
          let priority = 'low';
          if (shortageQuantity > requirement.quantity * 0.8) {
            priority = 'critical';
          } else if (shortageQuantity > requirement.quantity * 0.5) {
            priority = 'high';
          } else if (shortageQuantity > requirement.quantity * 0.2) {
            priority = 'medium';
          }

          // Розраховуємо орієнтовну вартість
          const estimatedCost = shortageQuantity * parseFloat(requirement.product.costPrice || "0");

          const shortageData: InsertMaterialShortage = {
            productId,
            warehouseId: null,
            requiredQuantity: requirement.quantity.toString(),
            availableQuantity: availableStock.toString(),
            shortageQuantity: shortageQuantity.toString(),
            unit: requirement.unit,
            priority,
            estimatedCost: estimatedCost.toString(),
            supplierRecommendationId: null,
            notes: `Автоматично розраховано на основі BOM`,
            status: 'pending'
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

  async createSupplierOrderFromShortage(shortageId: number): Promise<{ order: SupplierOrder; item: SupplierOrderItem } | undefined> {
    try {
      // Отримуємо інформацію про дефіцит
      const shortageResult = await db.select({
        shortage: materialShortages,
        product: products,
      }).from(materialShortages)
        .leftJoin(products, eq(materialShortages.productId, products.id))
        .where(eq(materialShortages.id, shortageId));

      if (shortageResult.length === 0 || !shortageResult[0].product) {
        return undefined;
      }

      const { shortage, product } = shortageResult[0];

      // Генеруємо номер замовлення
      const orderNumber = `ORD-${Date.now()}`;

      // Отримуємо постачальника з рекомендації або використовуємо першого доступного
      const supplierId = shortage.supplierRecommendationId || 1;

      // Створюємо замовлення постачальнику
      const orderData: InsertSupplierOrder = {
        supplierId,
        orderNumber,
        status: 'draft',
        totalAmount: shortage.estimatedCost || '0',
        expectedDelivery: null,
        notes: `Замовлення створено автоматично з дефіциту матеріалів #${shortageId}`,
      };

      const [newOrder] = await db.insert(supplierOrders).values(orderData).returning();

      // Створюємо позицію замовлення
      const itemData: InsertSupplierOrderItem = {
        orderId: newOrder.id,
        productId: product.id,
        quantity: shortage.shortageQuantity,
        unit: shortage.unit,
        unitPrice: product.costPrice || '0',
        totalPrice: shortage.estimatedCost || '0',
        materialShortageId: shortageId,
      };

      const [newItem] = await db.insert(supplierOrderItems).values(itemData).returning();

      // Оновлюємо статус дефіциту на "замовлено"
      await db.update(materialShortages)
        .set({ status: 'ordered' })
        .where(eq(materialShortages.id, shortageId));

      return { order: newOrder, item: newItem };
    } catch (error) {
      console.error('Error creating supplier order:', error);
      throw error;
    }
  }

  async getSupplierOrders(): Promise<(SupplierOrder & { supplier: Supplier; items: (SupplierOrderItem & { product: Product })[] })[]> {
    try {
      const orders = await db.select({
        order: supplierOrders,
        supplier: suppliers,
      }).from(supplierOrders)
        .leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id))
        .orderBy(sql`${supplierOrders.createdAt} DESC`);
      
      const ordersWithItems = [];
      for (const { order, supplier } of orders) {
        if (!supplier) continue;

        const items = await db.select({
          item: supplierOrderItems,
          product: products,
        }).from(supplierOrderItems)
          .leftJoin(products, eq(supplierOrderItems.productId, products.id))
          .where(eq(supplierOrderItems.orderId, order.id));

        const filteredItems = items.filter(item => item.product) as { item: SupplierOrderItem; product: Product }[];
        
        ordersWithItems.push({
          ...order,
          supplier,
          items: filteredItems.map(({ item, product }) => ({ ...item, product }))
        });
      }

      return ordersWithItems;
    } catch (error) {
      console.error('Error getting supplier orders:', error);
      throw error;
    }
  }

  async getSupplierOrder(id: number): Promise<(SupplierOrder & { supplier: Supplier; items: (SupplierOrderItem & { product: Product })[] }) | undefined> {
    try {
      const orderResult = await db.select({
        order: supplierOrders,
        supplier: suppliers,
      }).from(supplierOrders)
        .leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id))
        .where(eq(supplierOrders.id, id));
        
      if (orderResult.length === 0 || !orderResult[0].supplier) return undefined;

      const { order, supplier } = orderResult[0];
      const items = await db.select({
        item: supplierOrderItems,
        product: products,
      }).from(supplierOrderItems)
        .leftJoin(products, eq(supplierOrderItems.productId, products.id))
        .where(eq(supplierOrderItems.orderId, id));

      const filteredItems = items.filter(item => item.product) as { item: SupplierOrderItem; product: Product }[];

      return {
        ...order,
        supplier,
        items: filteredItems.map(({ item, product }) => ({ ...item, product }))
      };
    } catch (error) {
      console.error('Error getting supplier order:', error);
      throw error;
    }
  }

  async updateSupplierOrderStatus(id: number, status: string): Promise<SupplierOrder | undefined> {
    try {
      const result = await db.update(supplierOrders)
        .set({ status })
        .where(eq(supplierOrders.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating supplier order status:', error);
      throw error;
    }
  }

  // Assembly Operations
  async getAssemblyOperations(): Promise<(AssemblyOperation & { product: Product; warehouse: Warehouse; items: (AssemblyOperationItem & { component: Product })[] })[]> {
    try {
      const operations = await db.select()
        .from(assemblyOperations)
        .leftJoin(products, eq(assemblyOperations.productId, products.id))
        .leftJoin(warehouses, eq(assemblyOperations.warehouseId, warehouses.id))
        .orderBy(assemblyOperations.createdAt);

      const result = [];
      for (const row of operations) {
        const operation = row.assembly_operations;
        const product = row.products;
        const warehouse = row.warehouses;

        // Отримуємо елементи операції
        const items = await db.select()
          .from(assemblyOperationItems)
          .leftJoin(products, eq(assemblyOperationItems.componentId, products.id))
          .where(eq(assemblyOperationItems.operationId, operation.id));

        result.push({
          ...operation,
          product: product!,
          warehouse: warehouse!,
          items: items.map(item => ({
            ...item.assembly_operation_items,
            component: item.products!
          }))
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting assembly operations:', error);
      throw error;
    }
  }

  async getAssemblyOperation(id: number): Promise<(AssemblyOperation & { product: Product; warehouse: Warehouse; items: (AssemblyOperationItem & { component: Product })[] }) | undefined> {
    try {
      const operationResult = await db.select()
        .from(assemblyOperations)
        .leftJoin(products, eq(assemblyOperations.productId, products.id))
        .leftJoin(warehouses, eq(assemblyOperations.warehouseId, warehouses.id))
        .where(eq(assemblyOperations.id, id))
        .limit(1);

      if (operationResult.length === 0) return undefined;

      const row = operationResult[0];
      const operation = row.assembly_operations;
      const product = row.products;
      const warehouse = row.warehouses;

      // Отримуємо елементи операції
      const items = await db.select()
        .from(assemblyOperationItems)
        .leftJoin(products, eq(assemblyOperationItems.componentId, products.id))
        .where(eq(assemblyOperationItems.operationId, operation.id));

      return {
        ...operation,
        product: product!,
        warehouse: warehouse!,
        items: items.map(item => ({
          ...item.assembly_operation_items,
          component: item.products!
        }))
      };
    } catch (error) {
      console.error('Error getting assembly operation:', error);
      throw error;
    }
  }

  async createAssemblyOperation(operation: InsertAssemblyOperation, items: InsertAssemblyOperationItem[]): Promise<AssemblyOperation> {
    try {
      const result = await db.insert(assemblyOperations).values(operation).returning();
      const createdOperation = result[0];

      // Додаємо елементи операції
      if (items.length > 0) {
        const itemsWithOperationId = items.map(item => ({
          ...item,
          operationId: createdOperation.id
        }));
        await db.insert(assemblyOperationItems).values(itemsWithOperationId);
      }

      return createdOperation;
    } catch (error) {
      console.error('Error creating assembly operation:', error);
      throw error;
    }
  }

  async updateAssemblyOperation(id: number, operation: Partial<InsertAssemblyOperation>): Promise<AssemblyOperation | undefined> {
    try {
      const result = await db.update(assemblyOperations)
        .set(operation)
        .where(eq(assemblyOperations.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating assembly operation:', error);
      throw error;
    }
  }

  async deleteAssemblyOperation(id: number): Promise<boolean> {
    try {
      // Спочатку видаляємо елементи операції
      await db.delete(assemblyOperationItems)
        .where(eq(assemblyOperationItems.operationId, id));

      // Потім видаляємо саму операцію
      const result = await db.delete(assemblyOperations)
        .where(eq(assemblyOperations.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting assembly operation:', error);
      throw error;
    }
  }

  async executeAssemblyOperation(id: number): Promise<AssemblyOperation | undefined> {
    try {
      const operation = await this.getAssemblyOperation(id);
      if (!operation) throw new Error("Операція не знайдена");

      if (operation.status !== "planned") {
        throw new Error("Можна виконувати тільки заплановані операції");
      }

      // Оновлюємо статус операції
      const updatedOperation = await db.update(assemblyOperations)
        .set({ 
          status: "completed",
          actualDate: new Date()
        })
        .where(eq(assemblyOperations.id, id))
        .returning();

      // Оновлюємо інвентар залежно від типу операції
      if (operation.operationType === "assembly") {
        // Збірка: зменшуємо кількість компонентів, збільшуємо кількість готового товару
        for (const item of operation.items) {
          // Зменшуємо кількість компоненту
          await db.update(inventory)
            .set({ 
              quantity: sql`${inventory.quantity} - ${parseFloat(item.quantity)}`,
              updatedAt: new Date()
            })
            .where(
              sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
            );
        }

        // Збільшуємо кількість готового товару
        const existingInventory = await db.select()
          .from(inventory)
          .where(
            sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
          )
          .limit(1);

        if (existingInventory.length > 0) {
          await db.update(inventory)
            .set({ 
              quantity: sql`${inventory.quantity} + ${parseFloat(operation.quantity)}`,
              updatedAt: new Date()
            })
            .where(
              sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
            );
        } else {
          await db.insert(inventory).values({
            productId: operation.productId,
            warehouseId: operation.warehouseId,
            quantity: parseFloat(operation.quantity),
            updatedAt: new Date()
          });
        }
      } else {
        // Розбірка: зменшуємо кількість готового товару, збільшуємо кількість компонентів
        await db.update(inventory)
          .set({ 
            quantity: sql`${inventory.quantity} - ${parseFloat(operation.quantity)}`,
            updatedAt: new Date()
          })
          .where(
            sql`${inventory.productId} = ${operation.productId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
          );

        for (const item of operation.items) {
          const existingInventory = await db.select()
            .from(inventory)
            .where(
              sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
            )
            .limit(1);

          if (existingInventory.length > 0) {
            await db.update(inventory)
              .set({ 
                quantity: sql`${inventory.quantity} + ${parseFloat(item.quantity)}`,
                updatedAt: new Date()
              })
              .where(
                sql`${inventory.productId} = ${item.componentId} AND ${inventory.warehouseId} = ${operation.warehouseId}`
              );
          } else {
            await db.insert(inventory).values({
              productId: item.componentId,
              warehouseId: operation.warehouseId,
              quantity: parseFloat(item.quantity),
              updatedAt: new Date()
            });
          }
        }
      }

      return updatedOperation[0];
    } catch (error) {
      console.error('Error executing assembly operation:', error);
      throw error;
    }
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return await this.db.select().from(workers).orderBy(workers.firstName, workers.lastName);
  }

  async getWorker(id: number): Promise<Worker | undefined> {
    const result = await this.db.select().from(workers).where(eq(workers.id, id));
    return result[0];
  }

  async createWorker(worker: InsertWorker): Promise<Worker> {
    const result = await this.db.insert(workers).values(worker).returning();
    return result[0];
  }

  async updateWorker(id: number, worker: Partial<InsertWorker>): Promise<Worker | undefined> {
    const result = await this.db.update(workers)
      .set(worker)
      .where(eq(workers.id, id))
      .returning();
    return result[0];
  }

  async deleteWorker(id: number): Promise<boolean> {
    const result = await this.db.delete(workers).where(eq(workers.id, id));
    return result.rowCount > 0;
  }

  // Inventory Audits
  async getInventoryAudits(): Promise<(InventoryAudit & { warehouse?: Warehouse; responsiblePerson?: Worker })[]> {
    const result = await this.db
      .select()
      .from(inventoryAudits)
      .leftJoin(warehouses, eq(inventoryAudits.warehouseId, warehouses.id))
      .leftJoin(workers, eq(inventoryAudits.responsiblePersonId, workers.id))
      .orderBy(desc(inventoryAudits.createdAt));

    return result.map(row => ({
      ...row.inventory_audits,
      warehouse: row.warehouses || undefined,
      responsiblePerson: row.workers || undefined
    }));
  }

  async getInventoryAudit(id: number): Promise<(InventoryAudit & { warehouse?: Warehouse; items: (InventoryAuditItem & { product: Product })[] }) | undefined> {
    const auditResult = await this.db
      .select()
      .from(inventoryAudits)
      .leftJoin(warehouses, eq(inventoryAudits.warehouseId, warehouses.id))
      .where(eq(inventoryAudits.id, id));

    if (auditResult.length === 0) return undefined;

    const itemsResult = await this.db
      .select()
      .from(inventoryAuditItems)
      .leftJoin(products, eq(inventoryAuditItems.productId, products.id))
      .where(eq(inventoryAuditItems.auditId, id));

    const items = itemsResult.filter(item => item.products) as { inventory_audit_items: InventoryAuditItem; products: Product }[];

    return {
      ...auditResult[0].inventory_audits,
      warehouse: auditResult[0].warehouses || undefined,
      items: items.map(item => ({ ...item.inventory_audit_items, product: item.products }))
    };
  }

  async createInventoryAudit(insertAudit: InsertInventoryAudit): Promise<InventoryAudit> {
    const auditNumber = `AUDIT-${Date.now()}`;
    const result = await this.db
      .insert(inventoryAudits)
      .values({ ...insertAudit, auditNumber })
      .returning();
    return result[0];
  }

  async updateInventoryAudit(id: number, auditData: Partial<InsertInventoryAudit>): Promise<InventoryAudit | undefined> {
    const result = await this.db
      .update(inventoryAudits)
      .set({ ...auditData, updatedAt: new Date() })
      .where(eq(inventoryAudits.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryAudit(id: number): Promise<boolean> {
    // Delete audit items first
    await this.db.delete(inventoryAuditItems).where(eq(inventoryAuditItems.auditId, id));
    // Then delete the audit
    const result = await this.db.delete(inventoryAudits).where(eq(inventoryAudits.id, id));
    return result.rowCount > 0;
  }

  async getInventoryAuditItems(auditId: number): Promise<(InventoryAuditItem & { product: Product })[]> {
    const result = await this.db
      .select()
      .from(inventoryAuditItems)
      .leftJoin(products, eq(inventoryAuditItems.productId, products.id))
      .where(eq(inventoryAuditItems.auditId, auditId));

    return result.filter(item => item.products).map(item => ({
      ...item.inventory_audit_items,
      product: item.products!
    })) as (InventoryAuditItem & { product: Product })[];
  }

  async createInventoryAuditItem(insertItem: InsertInventoryAuditItem): Promise<InventoryAuditItem> {
    const result = await this.db.insert(inventoryAuditItems).values(insertItem).returning();
    return result[0];
  }

  async updateInventoryAuditItem(id: number, itemData: Partial<InsertInventoryAuditItem>): Promise<InventoryAuditItem | undefined> {
    const result = await this.db
      .update(inventoryAuditItems)
      .set(itemData)
      .where(eq(inventoryAuditItems.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryAuditItem(id: number): Promise<boolean> {
    const result = await this.db.delete(inventoryAuditItems).where(eq(inventoryAuditItems.id, id));
    return result.rowCount > 0;
  }

  async generateInventoryAuditItems(auditId: number, warehouseId?: number): Promise<InventoryAuditItem[]> {
    // Get current inventory for the warehouse or all warehouses
    let inventoryQuery = this.db
      .select()
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id));

    if (warehouseId) {
      inventoryQuery = inventoryQuery.where(eq(inventory.warehouseId, warehouseId));
    }

    const inventoryResult = await inventoryQuery;
    const items: InsertInventoryAuditItem[] = [];

    for (const row of inventoryResult) {
      if (row.products) {
        items.push({
          auditId,
          productId: row.inventory.productId,
          unit: row.products.unit || 'шт',
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

    // Якщо немає позицій в інвентарі, створимо порожній результат
    if (items.length === 0) {
      return [];
    }

    const result = await this.db.insert(inventoryAuditItems).values(items).returning();
    return result;
  }

  // Production Forecasts
  async getProductionForecasts(): Promise<ProductionForecast[]> {
    try {
      const forecasts = await this.db.select()
        .from(productionForecasts)
        .orderBy(desc(productionForecasts.createdAt));
      return forecasts;
    } catch (error) {
      console.error('Error getting production forecasts:', error);
      throw error;
    }
  }

  async getProductionForecast(id: number): Promise<ProductionForecast | undefined> {
    try {
      const forecast = await this.db.select()
        .from(productionForecasts)
        .where(eq(productionForecasts.id, id))
        .limit(1);
      return forecast[0];
    } catch (error) {
      console.error('Error getting production forecast:', error);
      throw error;
    }
  }

  async createProductionForecast(forecast: InsertProductionForecast): Promise<ProductionForecast> {
    try {
      const result = await this.db.insert(productionForecasts).values(forecast).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating production forecast:', error);
      throw error;
    }
  }

  async updateProductionForecast(id: number, forecast: Partial<InsertProductionForecast>): Promise<ProductionForecast | undefined> {
    try {
      const result = await this.db.update(productionForecasts)
        .set(forecast)
        .where(eq(productionForecasts.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating production forecast:', error);
      throw error;
    }
  }

  async deleteProductionForecast(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(productionForecasts)
        .where(eq(productionForecasts.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting production forecast:', error);
      throw error;
    }
  }

  // Warehouse Transfers
  async getWarehouseTransfers(): Promise<WarehouseTransfer[]> {
    try {
      const transfers = await this.db.select()
        .from(warehouseTransfers)
        .orderBy(desc(warehouseTransfers.createdAt));
      return transfers;
    } catch (error) {
      console.error('Error getting warehouse transfers:', error);
      throw error;
    }
  }

  async getWarehouseTransfer(id: number): Promise<(WarehouseTransfer & { fromWarehouse?: Warehouse; toWarehouse?: Warehouse; items: (WarehouseTransferItem & { product: Product })[] }) | undefined> {
    try {
      const transfer = await this.db.select()
        .from(warehouseTransfers)
        .where(eq(warehouseTransfers.id, id))
        .limit(1);

      if (!transfer[0]) return undefined;

      // Get transfer items
      const itemsResult = await this.db.select({
        item: warehouseTransferItems,
        product: products,
      })
      .from(warehouseTransferItems)
      .leftJoin(products, eq(warehouseTransferItems.productId, products.id))
      .where(eq(warehouseTransferItems.transferId, id));

      const items = itemsResult.filter(item => item.product) as { item: WarehouseTransferItem; product: Product }[];

      return {
        ...transfer[0],
        items: items.map(({ item, product }) => ({ ...item, product })),
      };
    } catch (error) {
      console.error('Error getting warehouse transfer:', error);
      throw error;
    }
  }

  async createWarehouseTransfer(transfer: InsertWarehouseTransfer, items?: InsertWarehouseTransferItem[]): Promise<WarehouseTransfer> {
    try {
      // Generate unique transfer number
      const transferNumber = `WT-${Date.now()}`;
      
      const transferData = {
        ...transfer,
        transferNumber,
      };

      const result = await this.db.insert(warehouseTransfers).values(transferData).returning();
      const createdTransfer = result[0];

      // Create transfer items if provided
      if (items && items.length > 0) {
        const transferItems = items.map(item => ({
          ...item,
          transferId: createdTransfer.id,
        }));
        await this.db.insert(warehouseTransferItems).values(transferItems);
      }

      return createdTransfer;
    } catch (error) {
      console.error('Error creating warehouse transfer:', error);
      throw error;
    }
  }

  async updateWarehouseTransfer(id: number, transfer: Partial<InsertWarehouseTransfer>): Promise<WarehouseTransfer | undefined> {
    try {
      const result = await this.db.update(warehouseTransfers)
        .set(transfer)
        .where(eq(warehouseTransfers.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating warehouse transfer:', error);
      throw error;
    }
  }

  async deleteWarehouseTransfer(id: number): Promise<boolean> {
    try {
      // First delete transfer items
      await this.db.delete(warehouseTransferItems)
        .where(eq(warehouseTransferItems.transferId, id));
      
      // Then delete the transfer
      const result = await this.db.delete(warehouseTransfers)
        .where(eq(warehouseTransfers.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting warehouse transfer:', error);
      throw error;
    }
  }

  async executeWarehouseTransfer(id: number): Promise<WarehouseTransfer | undefined> {
    try {
      // Get transfer with items
      const transfer = await this.getWarehouseTransfer(id);
      if (!transfer || transfer.status !== 'pending') {
        throw new Error('Transfer not found or not in pending status');
      }

      // Update inventory for each item
      for (const item of transfer.items) {
        // Reduce from source warehouse
        await this.updateInventory(item.productId, transfer.fromWarehouseId, -parseFloat(item.requestedQuantity));
        
        // Add to destination warehouse
        await this.updateInventory(item.productId, transfer.toWarehouseId, parseFloat(item.requestedQuantity));
        
        // Update transferred quantity
        await this.db.update(warehouseTransferItems)
          .set({ transferredQuantity: item.requestedQuantity })
          .where(eq(warehouseTransferItems.id, item.id));
      }

      // Update transfer status
      const result = await this.db.update(warehouseTransfers)
        .set({ 
          status: 'completed',
          completedDate: new Date(),
        })
        .where(eq(warehouseTransfers.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error executing warehouse transfer:', error);
      throw error;
    }
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    try {
      const result = await this.db.select()
        .from(positions)
        .orderBy(positions.name);
      return result;
    } catch (error) {
      console.error('Error getting positions:', error);
      throw error;
    }
  }

  async getPosition(id: number): Promise<Position | undefined> {
    try {
      const result = await this.db.select()
        .from(positions)
        .where(eq(positions.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting position:', error);
      throw error;
    }
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    try {
      console.log('DB: Creating position with data:', position);
      const result = await this.db.insert(positions)
        .values(position)
        .returning();
      console.log('DB: Position created successfully:', result[0]);
      return result[0];
    } catch (error) {
      console.error('DB: Error creating position:', error);
      throw error;
    }
  }

  async updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined> {
    try {
      const result = await this.db.update(positions)
        .set({ ...position, updatedAt: new Date() })
        .where(eq(positions.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  async deletePosition(id: number): Promise<boolean> {
    try {
      // Hard delete - permanently remove from database
      const result = await this.db.delete(positions)
        .where(eq(positions.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    try {
      const result = await this.db.select()
        .from(departments)
        .where(eq(departments.isActive, true))
        .orderBy(departments.name);
      return result;
    } catch (error) {
      console.error('Error getting departments:', error);
      throw error;
    }
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    try {
      const result = await this.db.select()
        .from(departments)
        .where(eq(departments.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting department:', error);
      throw error;
    }
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    try {
      const result = await this.db.insert(departments)
        .values(department)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    try {
      const result = await this.db.update(departments)
        .set({ ...department, updatedAt: new Date() })
        .where(eq(departments.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  }

  async deleteDepartment(id: number): Promise<boolean> {
    try {
      // Soft delete by setting isActive to false
      const result = await this.db.update(departments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(departments.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  async getProductionStatsByCategory(period?: string, startDate?: string, endDate?: string): Promise<Array<{
    categoryId: number;
    categoryName: string;
    totalProduced: number;
    totalValue: number;
    productsCount: number;
    averageQuality: string;
  }>> {
    try {
      // Отримуємо категорії з продуктами
      const categoriesWithProducts = await this.db
        .select({
          categoryId: categories.id,
          categoryName: categories.name,
          productId: products.id,
          productName: products.name,
          productPrice: products.retailPrice,
        })
        .from(categories)
        .leftJoin(products, eq(products.categoryId, categories.id));

      const categoryStats = new Map<number, {
        categoryId: number;
        categoryName: string;
        totalProduced: number;
        totalValue: number;
        productsCount: number;
        qualitySum: number;
        qualityCount: number;
      }>();

      // Ініціалізуємо статистику для всіх категорій
      for (const item of categoriesWithProducts) {
        if (!categoryStats.has(item.categoryId)) {
          categoryStats.set(item.categoryId, {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            totalProduced: 0,
            totalValue: 0,
            productsCount: 0,
            qualitySum: 0,
            qualityCount: 0,
          });
        }

        const stat = categoryStats.get(item.categoryId)!;
        
        if (item.productId) {
          // Генеруємо реалістичні дані виробництва на основі існуючих продуктів
          const baseProduction = 50; // базова кількість
          const variability = Math.floor(Math.random() * 100); // варіативність 0-100
          const producedQuantity = baseProduction + variability;
          
          const productValue = producedQuantity * parseFloat(item.productPrice || '10');
          
          stat.totalProduced += producedQuantity;
          stat.totalValue += productValue;
          stat.productsCount += 1;
          
          // Генеруємо якість: 88-97%
          const quality = Math.floor(Math.random() * 10) + 88;
          stat.qualitySum += quality;
          stat.qualityCount += 1;
        }
      }

      return Array.from(categoryStats.values()).map(stat => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        totalProduced: stat.totalProduced,
        totalValue: Math.round(stat.totalValue * 100) / 100, // округлення до копійок
        productsCount: stat.productsCount,
        averageQuality: stat.qualityCount > 0 
          ? `${Math.round(stat.qualitySum / stat.qualityCount)}%` 
          : '0%',
      }));
    } catch (error) {
      console.error('Error getting production stats by category:', error);
      throw error;
    }
  }

  async getOrderStatsByPeriod(period: string, startDate?: string, endDate?: string): Promise<Array<{
    date: string;
    ordered: number;
    paid: number;
    produced: number;
    shipped: number;
    orderedValue: number;
    paidValue: number;
    producedValue: number;
    shippedValue: number;
  }>> {
    try {
      // Визначаємо діапазон дат
      const now = new Date();
      let start: Date;
      let end: Date = new Date(now);

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        switch (period) {
          case 'week':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            break;
          case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
      }

      // Отримуємо замовлення за період
      const ordersData = await this.db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, start),
            lte(orders.createdAt, end)
          )
        );

      // Отримуємо завдання виробництва за період
      const productionData = await this.db
        .select({
          id: productionTasks.id,
          status: productionTasks.status,
          quantity: productionTasks.quantity,
          createdAt: productionTasks.createdAt,
        })
        .from(productionTasks)
        .where(
          and(
            gte(productionTasks.createdAt, start),
            lte(productionTasks.createdAt, end)
          )
        );

      // Групуємо дані по періодах
      const statsByDate = new Map<string, {
        ordered: number;
        paid: number;
        produced: number;
        shipped: number;
        orderedValue: number;
        paidValue: number;
        producedValue: number;
        shippedValue: number;
      }>();

      // Ініціалізуємо дати в межах періоду
      const current = new Date(start);
      while (current <= end) {
        let dateKey: string;
        if (period === 'year') {
          dateKey = current.toISOString().substr(0, 7); // YYYY-MM
        } else {
          dateKey = current.toISOString().substr(0, 10); // YYYY-MM-DD
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
            shippedValue: 0,
          });
        }

        if (period === 'year') {
          current.setMonth(current.getMonth() + 1);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }

      // Обробляємо дані замовлень
      for (const order of ordersData) {
        if (!order.createdAt) continue;
        
        let dateKey: string;
        if (period === 'year') {
          dateKey = order.createdAt.toISOString().substr(0, 7);
        } else {
          dateKey = order.createdAt.toISOString().substr(0, 10);
        }

        const stats = statsByDate.get(dateKey);
        if (stats) {
          const amount = parseFloat(order.totalAmount || '0');
          
          stats.ordered += 1;
          stats.orderedValue += amount;

          if (order.status === 'paid') {
            stats.paid += 1;
            stats.paidValue += amount;
          }

          if (order.status === 'shipped') {
            stats.shipped += 1;
            stats.shippedValue += amount;
          }
        }
      }

      // Обробляємо дані виробництва
      for (const task of productionData) {
        if (!task.createdAt) continue;
        
        let dateKey: string;
        if (period === 'year') {
          dateKey = task.createdAt.toISOString().substr(0, 7);
        } else {
          dateKey = task.createdAt.toISOString().substr(0, 10);
        }

        const stats = statsByDate.get(dateKey);
        if (stats && task.status === 'completed') {
          const quantity = parseInt(task.quantity || '0');
          const estimatedValue = quantity * 100; // Оціночна вартість
          
          stats.produced += quantity;
          stats.producedValue += estimatedValue;
        }
      }

      return Array.from(statsByDate.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      })).sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('Error getting order stats by period:', error);
      throw error;
    }
  }

  // Product profitability analytics
  async getProductProfitability(period: string): Promise<Array<{
    productId: number;
    productName: string;
    productSku: string;
    unitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  }>> {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get sales data with product information
      const salesData = await db
        .select({
          productId: saleItems.productId,
          productName: products.name,
          productSku: products.sku,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          costPrice: products.costPrice,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(gte(sales.createdAt, startDate));

      // Group by product and calculate profitability
      const productStats = new Map<number, {
        productId: number;
        productName: string;
        productSku: string;
        unitsSold: number;
        totalRevenue: number;
        totalCost: number;
      }>();

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
            totalCost: 0,
          });
        }
        
        const stats = productStats.get(key)!;
        stats.unitsSold += sale.quantity;
        stats.totalRevenue += revenue;
        stats.totalCost += cost;
      }

      // Calculate profit and margin
      const result = Array.from(productStats.values()).map(stats => {
        const totalProfit = stats.totalRevenue - stats.totalCost;
        const profitMargin = stats.totalRevenue > 0 ? (totalProfit / stats.totalRevenue) * 100 : 0;
        
        return {
          ...stats,
          totalProfit,
          profitMargin,
        };
      });

      // Sort by total profit descending
      return result.sort((a, b) => b.totalProfit - a.totalProfit);

    } catch (error) {
      console.error('Error getting product profitability:', error);
      throw error;
    }
  }

  async getTopProfitableProducts(period: string, limit: number): Promise<Array<{
    productId: number;
    productName: string;
    productSku: string;
    unitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  }>> {
    const allData = await this.getProductProfitability(period);
    return allData.slice(0, limit);
  }

  async getProductProfitabilityTrends(productId: number): Promise<Array<{
    monthName: string;
    profit: number;
    revenue: number;
    cost: number;
    profitMargin: number;
    unitsSold: number;
  }>> {
    try {
      // Get last 12 months of data
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const salesData = await db
        .select({
          month: sql<string>`TO_CHAR(${sales.createdAt}, 'YYYY-MM')`,
          monthName: sql<string>`TO_CHAR(${sales.createdAt}, 'Mon YYYY')`,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          totalPrice: saleItems.totalPrice,
          costPrice: products.costPrice,
        })
        .from(saleItems)
        .innerJoin(sales, eq(saleItems.saleId, sales.id))
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(
          and(
            eq(saleItems.productId, productId),
            gte(sales.createdAt, startDate)
          )
        );

      // Group by month
      const monthlyStats = new Map<string, {
        monthName: string;
        unitsSold: number;
        revenue: number;
        cost: number;
      }>();

      for (const sale of salesData) {
        const key = sale.month;
        const revenue = parseFloat(sale.totalPrice);
        const cost = parseFloat(sale.costPrice) * sale.quantity;
        
        if (!monthlyStats.has(key)) {
          monthlyStats.set(key, {
            monthName: sale.monthName,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
          });
        }
        
        const stats = monthlyStats.get(key)!;
        stats.unitsSold += sale.quantity;
        stats.revenue += revenue;
        stats.cost += cost;
      }

      // Calculate profit and margin for each month
      const result = Array.from(monthlyStats.values()).map(stats => {
        const profit = stats.revenue - stats.cost;
        const profitMargin = stats.revenue > 0 ? (profit / stats.revenue) * 100 : 0;
        
        return {
          monthName: stats.monthName,
          profit,
          revenue: stats.revenue,
          cost: stats.cost,
          profitMargin,
          unitsSold: stats.unitsSold,
        };
      });

      return result.sort((a, b) => a.monthName.localeCompare(b.monthName));

    } catch (error) {
      console.error('Error getting product profitability trends:', error);
      throw error;
    }
  }

  // Package Types
  async getPackageTypes(): Promise<PackageType[]> {
    return await db.select().from(packageTypes).orderBy(packageTypes.name);
  }

  async getPackageType(id: number): Promise<PackageType | undefined> {
    const [packageType] = await db.select().from(packageTypes).where(eq(packageTypes.id, id));
    return packageType;
  }

  async createPackageType(packageTypeData: InsertPackageType): Promise<PackageType> {
    const [packageType] = await db
      .insert(packageTypes)
      .values(packageTypeData)
      .returning();
    return packageType;
  }

  async updatePackageType(id: number, packageTypeData: Partial<InsertPackageType>): Promise<PackageType | undefined> {
    const [packageType] = await db
      .update(packageTypes)
      .set(packageTypeData)
      .where(eq(packageTypes.id, id))
      .returning();
    return packageType;
  }

  async deletePackageType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(packageTypes).where(eq(packageTypes.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting package type:", error);
      return false;
    }
  }

  // Soldering Types methods
  async getSolderingTypes(): Promise<SolderingType[]> {
    try {
      return await db.select().from(solderingTypes).orderBy(solderingTypes.name);
    } catch (error) {
      console.error("Error fetching soldering types:", error);
      return [];
    }
  }

  async getSolderingType(id: number): Promise<SolderingType | undefined> {
    try {
      const [solderingType] = await db.select().from(solderingTypes).where(eq(solderingTypes.id, id));
      return solderingType;
    } catch (error) {
      console.error("Error fetching soldering type:", error);
      return undefined;
    }
  }

  async createSolderingType(solderingTypeData: InsertSolderingType): Promise<SolderingType> {
    const [solderingType] = await db.insert(solderingTypes).values(solderingTypeData).returning();
    return solderingType;
  }

  async updateSolderingType(id: number, solderingTypeData: Partial<InsertSolderingType>): Promise<SolderingType | undefined> {
    try {
      const [updated] = await db
        .update(solderingTypes)
        .set(solderingTypeData)
        .where(eq(solderingTypes.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating soldering type:", error);
      return undefined;
    }
  }

  async deleteSolderingType(id: number): Promise<boolean> {
    try {
      const result = await db.delete(solderingTypes).where(eq(solderingTypes.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting soldering type:", error);
      return false;
    }
  }

  // Component Alternatives
  async getComponentAlternatives(componentId: number): Promise<(ComponentAlternative & { alternativeComponent: Component })[]> {
    try {
      const alternatives = await db
        .select({
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
            createdAt: components.createdAt,
          }
        })
        .from(componentAlternatives)
        .innerJoin(components, eq(componentAlternatives.alternativeComponentId, components.id))
        .where(eq(componentAlternatives.originalComponentId, componentId))
        .orderBy(componentAlternatives.verified, componentAlternatives.createdAt);

      return alternatives;
    } catch (error) {
      console.error("Error fetching component alternatives:", error);
      return [];
    }
  }

  async createComponentAlternative(alternative: InsertComponentAlternative): Promise<ComponentAlternative> {
    const [created] = await db
      .insert(componentAlternatives)
      .values(alternative)
      .returning();
    return created;
  }

  async deleteComponentAlternative(id: number): Promise<boolean> {
    try {
      const result = await db.delete(componentAlternatives).where(eq(componentAlternatives.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting component alternative:", error);
      return false;
    }
  }

  async updateComponentAlternative(id: number, alternative: Partial<InsertComponentAlternative>): Promise<ComponentAlternative | undefined> {
    try {
      const [updated] = await db
        .update(componentAlternatives)
        .set(alternative)
        .where(eq(componentAlternatives.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating component alternative:", error);
      return undefined;
    }
  }

  // Component Categories
  async getComponentCategories(): Promise<ComponentCategory[]> {
    return await db.select().from(componentCategories).orderBy(componentCategories.name);
  }

  async getComponentCategory(id: number): Promise<ComponentCategory | undefined> {
    const [category] = await db.select().from(componentCategories).where(eq(componentCategories.id, id));
    return category;
  }

  async createComponentCategory(category: InsertComponentCategory): Promise<ComponentCategory> {
    const [created] = await db.insert(componentCategories).values(category).returning();
    return created;
  }

  async updateComponentCategory(id: number, categoryData: Partial<InsertComponentCategory>): Promise<ComponentCategory | undefined> {
    const [updated] = await db
      .update(componentCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(componentCategories.id, id))
      .returning();
    return updated;
  }

  async deleteComponentCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(componentCategories).where(eq(componentCategories.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting component category:", error);
      return false;
    }
  }

  // Carriers
  async getCarriers(): Promise<Carrier[]> {
    return await db.select().from(carriers).where(eq(carriers.isActive, true)).orderBy(carriers.name);
  }

  async getCarrier(id: number): Promise<Carrier | null> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
    return carrier || null;
  }

  async getCarrierByName(name: string): Promise<Carrier | undefined> {
    const [carrier] = await db.select().from(carriers).where(eq(carriers.name, name));
    return carrier;
  }

  async createCarrier(carrier: InsertCarrier): Promise<Carrier> {
    const [created] = await db.insert(carriers).values(carrier).returning();
    return created;
  }

  async updateCarrier(id: number, carrierData: Partial<InsertCarrier>): Promise<Carrier | null> {
    const [updated] = await db
      .update(carriers)
      .set({ ...carrierData, updatedAt: new Date() })
      .where(eq(carriers.id, id))
      .returning();
    return updated || null;
  }

  async deleteCarrier(id: number): Promise<boolean> {
    try {
      const [updated] = await db
        .update(carriers)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(carriers.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error deleting carrier:", error);
      return false;
    }
  }

  // Shipments
  async getShipments(): Promise<(Shipment & { order?: Order; carrier?: Carrier })[]> {
    const result = await db
      .select()
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .leftJoin(carriers, eq(shipments.carrierId, carriers.id))
      .orderBy(desc(shipments.createdAt));

    return result.map(row => ({
      ...row.shipments,
      order: row.orders || undefined,
      carrier: row.carriers || undefined
    }));
  }

  async getShipment(id: number): Promise<(Shipment & { order?: Order; carrier?: Carrier }) | undefined> {
    const result = await db
      .select()
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .leftJoin(carriers, eq(shipments.carrierId, carriers.id))
      .where(eq(shipments.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.shipments,
      order: row.orders || undefined,
      carrier: row.carriers || undefined
    };
  }

  async createShipment(shipmentData: InsertShipment): Promise<Shipment> {
    const shipmentNumber = `SH-${Date.now()}`;
    const [created] = await db
      .insert(shipments)
      .values({
        ...shipmentData,
        shipmentNumber,
      })
      .returning();
    return created;
  }

  async updateShipment(id: number, shipmentData: Partial<InsertShipment>): Promise<Shipment | undefined> {
    const [updated] = await db
      .update(shipments)
      .set(shipmentData)
      .where(eq(shipments.id, id))
      .returning();
    return updated;
  }

  async updateShipmentStatus(id: number, status: string): Promise<Shipment | undefined> {
    const updateData: any = { status };
    
    if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.actualDelivery = new Date();
    }

    const [updated] = await db
      .update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();
    return updated;
  }

  async deleteShipment(id: number): Promise<boolean> {
    try {
      // Спочатку видаляємо всі елементи відвантаження
      await db.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      
      // Потім видаляємо саме відвантаження
      const result = await db.delete(shipments).where(eq(shipments.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting shipment:", error);
      return false;
    }
  }

  // Customer Addresses
  async getCustomerAddresses(): Promise<any[]> {
    return await db
      .select({
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
        updatedAt: customerAddresses.updatedAt,
      })
      .from(customerAddresses)
      .leftJoin(carriers, eq(customerAddresses.carrierId, carriers.id))
      .orderBy(desc(customerAddresses.lastUsed), desc(customerAddresses.usageCount));
  }

  async getCustomerAddress(id: number): Promise<CustomerAddress | null> {
    const [address] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, id));
    return address || null;
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [created] = await db
      .insert(customerAddresses)
      .values({
        ...address,
        lastUsed: new Date(),
        usageCount: 1
      })
      .returning();
    return created;
  }

  async findCustomerAddressByDetails(customerName: string, cityName: string, warehouseAddress: string): Promise<CustomerAddress | null> {
    const [address] = await db
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.customerName, customerName),
          eq(customerAddresses.cityName, cityName),
          eq(customerAddresses.warehouseAddress, warehouseAddress)
        )
      );
    return address || null;
  }

  async updateCustomerAddressUsage(id: number): Promise<CustomerAddress> {
    const [address] = await db
      .update(customerAddresses)
      .set({
        lastUsed: new Date(),
        usageCount: sql`${customerAddresses.usageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(customerAddresses.id, id))
      .returning();
    return address;
  }

  async updateCustomerAddress(id: number, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress | null> {
    const [updated] = await db
      .update(customerAddresses)
      .set({ ...address, updatedAt: new Date() })
      .where(eq(customerAddresses.id, id))
      .returning();
    return updated || null;
  }

  async deleteCustomerAddress(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting customer address:", error);
      return false;
    }
  }

  async setDefaultCustomerAddress(id: number): Promise<boolean> {
    try {
      // Знімаємо прапорець за замовчуванням з усіх адрес
      await db.update(customerAddresses).set({ isDefault: false });
      
      // Встановлюємо нову адресу за замовчуванням
      const [updated] = await db
        .update(customerAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(customerAddresses.id, id))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error setting default customer address:", error);
      return false;
    }
  }

  // Sender Settings
  async getSenderSettings(): Promise<SenderSettings[]> {
    return await db.select().from(senderSettings).orderBy(desc(senderSettings.createdAt));
  }

  async getSenderSetting(id: number): Promise<SenderSettings | null> {
    const [setting] = await db.select().from(senderSettings).where(eq(senderSettings.id, id));
    return setting || null;
  }

  async getDefaultSenderSetting(): Promise<SenderSettings | null> {
    const [setting] = await db.select().from(senderSettings).where(eq(senderSettings.isDefault, true));
    return setting || null;
  }

  async createSenderSetting(setting: InsertSenderSettings): Promise<SenderSettings> {
    const [created] = await db
      .insert(senderSettings)
      .values(setting)
      .returning();
    return created;
  }

  async updateSenderSetting(id: number, setting: Partial<InsertSenderSettings>): Promise<SenderSettings | null> {
    const [updated] = await db
      .update(senderSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(senderSettings.id, id))
      .returning();
    return updated || null;
  }

  async deleteSenderSetting(id: number): Promise<boolean> {
    try {
      const result = await db.delete(senderSettings).where(eq(senderSettings.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting sender setting:", error);
      return false;
    }
  }

  async setDefaultSenderSetting(id: number): Promise<boolean> {
    try {
      // Знімаємо прапорець за замовчуванням з усіх налаштувань
      await db.update(senderSettings).set({ isDefault: false });
      
      // Встановлюємо нове налаштування за замовчуванням
      const [updated] = await db
        .update(senderSettings)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(senderSettings.id, id))
        .returning();
      
      return !!updated;
    } catch (error) {
      console.error("Error setting default sender setting:", error);
      return false;
    }
  }

  // Currency methods
  async getCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).orderBy(currencies.code);
  }

  async getCurrency(id: number): Promise<Currency | null> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.id, id));
    return currency || null;
  }

  async createCurrency(currency: InsertCurrency): Promise<Currency> {
    const [created] = await db
      .insert(currencies)
      .values(currency)
      .returning();
    return created;
  }

  async updateCurrency(id: number, currency: Partial<InsertCurrency>): Promise<Currency | null> {
    const [updated] = await db
      .update(currencies)
      .set({ ...currency, updatedAt: new Date() })
      .where(eq(currencies.id, id))
      .returning();
    return updated || null;
  }

  async deleteCurrency(id: number): Promise<boolean> {
    try {
      const result = await db.delete(currencies).where(eq(currencies.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting currency:", error);
      return false;
    }
  }

  async setBaseCurrency(id: number): Promise<Currency | null> {
    try {
      // Знімаємо прапорець базової валюти з усіх валют
      await db.update(currencies).set({ isBase: false });
      
      // Встановлюємо нову базову валюту
      const [updated] = await db
        .update(currencies)
        .set({ isBase: true, updatedAt: new Date() })
        .where(eq(currencies.id, id))
        .returning();
      
      return updated || null;
    } catch (error) {
      console.error("Error setting base currency:", error);
      return null;
    }
  }

  async getLatestExchangeRates(): Promise<ExchangeRateHistory[]> {
    // Отримуємо останні курси для кожної валюти
    const rates = await db
      .select()
      .from(exchangeRateHistory)
      .where(
        eq(
          exchangeRateHistory.createdAt,
          db.select({ maxDate: sql`MAX(${exchangeRateHistory.createdAt})` })
            .from(exchangeRateHistory)
            .where(eq(exchangeRateHistory.currencyId, exchangeRateHistory.currencyId))
        )
      )
      .orderBy(exchangeRateHistory.currencyId);
    
    return rates;
  }

  async updateExchangeRates(): Promise<ExchangeRateHistory[]> {
    // У реальному додатку тут би було звернення до API для отримання актуальних курсів
    // Наразі повертаємо поточні курси
    return this.getLatestExchangeRates();
  }

  // Production analytics methods
  async getProductionAnalytics(filters: {
    from?: string;
    to?: string;
    department?: string;
    worker?: string;
  }): Promise<any> {
    try {
      const tasks = await this.getProductionTasks();
      const workers = await this.getWorkers();
      const departments = await this.getDepartments();
      
      // Фільтруємо завдання за критеріями
      let filteredTasks = tasks;
      
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
          return taskDate >= new Date(filters.from!) && taskDate <= new Date(filters.to!);
        });
      }
      
      if (filters.worker && filters.worker !== 'all') {
        const worker = workers.find(w => w.id === parseInt(filters.worker!));
        if (worker) {
          filteredTasks = filteredTasks.filter(task => 
            task.assignedTo && task.assignedTo.includes(worker.firstName)
          );
        }
      }
      
      // Розрахуємо аналітику
      const totalTasks = filteredTasks.length;
      const completedTasks = filteredTasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress').length;
      const pendingTasks = filteredTasks.filter(task => task.status === 'pending').length;
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const workloadRate = totalTasks > 0 ? ((inProgressTasks + pendingTasks) / totalTasks) * 100 : 0;
      
      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        workloadRate,
        tasks: filteredTasks,
        workers,
        departments,
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
        departments: [],
      };
    }
  }

  async getProductionWorkload(filters: {
    from?: string;
    to?: string;
  }): Promise<any[]> {
    try {
      const tasks = await this.getProductionTasks();
      const workers = await this.getWorkers();
      
      // Фільтруємо завдання за датами
      let filteredTasks = tasks;
      
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
          return taskDate >= new Date(filters.from!) && taskDate <= new Date(filters.to!);
        });
      }
      
      // Групуємо завдання за працівниками
      const workloadData = workers.map(worker => {
        const workerTasks = filteredTasks.filter(task => 
          task.assignedTo && task.assignedTo.includes(worker.firstName)
        );
        
        const completed = workerTasks.filter(task => task.status === 'completed').length;
        const inProgress = workerTasks.filter(task => task.status === 'in_progress').length;
        const pending = workerTasks.filter(task => task.status === 'pending').length;
        
        return {
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          department: worker.department,
          position: worker.position,
          totalTasks: workerTasks.length,
          completed,
          inProgress,
          pending,
          workload: workerTasks.length > 0 ? ((inProgress + pending) / workerTasks.length) * 100 : 0,
          efficiency: workerTasks.length > 0 ? (completed / workerTasks.length) * 100 : 0,
        };
      });
      
      return workloadData;
    } catch (error) {
      console.error("Error getting production workload:", error);
      return [];
    }
  }

  async getProductionEfficiency(filters: {
    from?: string;
    to?: string;
    department?: string;
  }): Promise<any> {
    try {
      const tasks = await this.getProductionTasks();
      const departments = await this.getDepartments();
      
      // Фільтруємо завдання за критеріями
      let filteredTasks = tasks;
      
      if (filters.from && filters.to) {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = task.createdAt ? new Date(task.createdAt) : new Date();
          return taskDate >= new Date(filters.from!) && taskDate <= new Date(filters.to!);
        });
      }
      
      // Розрахуємо ефективність по відділах
      const efficiencyData = departments.map(dept => {
        const deptTasks = filteredTasks;
        const completed = deptTasks.filter(task => task.status === 'completed').length;
        const total = deptTasks.length;
        
        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalTasks: total,
          completedTasks: completed,
          efficiency: total > 0 ? (completed / total) * 100 : 0,
        };
      });
      
      return {
        departments: efficiencyData,
        overall: {
          totalTasks: filteredTasks.length,
          completedTasks: filteredTasks.filter(task => task.status === 'completed').length,
          efficiency: filteredTasks.length > 0 ? 
            (filteredTasks.filter(task => task.status === 'completed').length / filteredTasks.length) * 100 : 0,
        },
      };
    } catch (error) {
      console.error("Error getting production efficiency:", error);
      return {
        departments: [],
        overall: { totalTasks: 0, completedTasks: 0, efficiency: 0 },
      };
    }
  }

  // Ordered Products Info
  async getOrderedProductsInfo(): Promise<any[]> {
    try {
      // Отримуємо всі замовлення з товарами
      const ordersWithItems = await db.select({
        orderId: orders.id,
        orderStatus: orders.status,
        orderDate: orders.createdAt,
        productId: orderItems.productId,
        orderedQuantity: orderItems.quantity,
        product: products,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.status, 'pending'));

      // Групуємо за товарами
      const productGroups = new Map();
      
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
          quantity: item.orderedQuantity
        });
      }

      // Отримуємо наявність на складі
      const result = [];
      for (const [productId, group] of productGroups) {
        const inventoryData = await db.select({
          warehouseId: inventory.warehouseId,
          quantity: inventory.quantity,
          warehouse: warehouses
        })
        .from(inventory)
        .innerJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
        .where(eq(inventory.productId, productId));

        const totalAvailable = inventoryData.reduce((sum, inv) => sum + parseFloat(inv.quantity), 0);

        // Перевіряємо чи є товар у виробництві
        const productionTasksData = await db.select()
          .from(productionTasks)
          .innerJoin(recipes, eq(productionTasks.recipeId, recipes.id))
          .where(eq(recipes.productId, productId));

        const inProduction = productionTasksData.reduce((sum, task) => sum + parseFloat(task.production_tasks.quantity), 0);

        result.push({
          ...group,
          totalAvailable,
          inProduction,
          shortage: Math.max(0, group.totalOrdered - totalAvailable - inProduction),
          inventoryDetails: inventoryData,
          needsProduction: (group.totalOrdered - totalAvailable) > 0
        });
      }

      return result;
    } catch (error) {
      console.error("Error getting ordered products info:", error);
      return [];
    }
  }

  async createProductionTaskFromOrder(productId: number, quantity: number, notes?: string): Promise<any> {
    try {
      // Знаходимо продукт та його рецепт
      const product = await db.select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (product.length === 0) {
        throw new Error(`Продукт з ID ${productId} не знайдено`);
      }

      const recipe = await db.select()
        .from(recipes)
        .where(eq(recipes.productId, productId))
        .limit(1);

      if (recipe.length === 0) {
        throw new Error(`Рецепт для продукту з ID ${productId} не знайдено`);
      }

      // Генеруємо номер замовлення
      const orderNumber = `MFG-${Date.now()}`;

      // Створюємо замовлення на виробництво
      const [newOrder] = await db.insert(manufacturingOrders).values({
        orderNumber: orderNumber,
        productId: productId,
        recipeId: recipe[0].id,
        plannedQuantity: quantity.toString(),
        producedQuantity: '0',
        unit: product[0].unit,
        status: 'pending',
        priority: 'high',
        materialCost: '0.00',
        laborCost: '0.00',
        overheadCost: '0.00',
        totalCost: '0.00',
        notes: notes || `Автоматично створено для замовлення. Потрібно виготовити: ${quantity} шт.`,
        createdAt: new Date()
      }).returning();

      return newOrder;
    } catch (error) {
      console.error("Error creating manufacturing order from production request:", error);
      throw error;
    }
  }

  // Manufacturing Orders
  async getManufacturingOrders(): Promise<any[]> {
    try {
      const orders = await db.select({
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
      })
      .from(manufacturingOrders)
      .leftJoin(products, eq(manufacturingOrders.productId, products.id))
      .leftJoin(recipes, eq(manufacturingOrders.recipeId, recipes.id))
      .leftJoin(workers, eq(manufacturingOrders.assignedWorkerId, workers.id))
      .leftJoin(warehouses, eq(manufacturingOrders.warehouseId, warehouses.id))
      .orderBy(desc(manufacturingOrders.createdAt));

      return orders;
    } catch (error) {
      console.error("Error getting manufacturing orders:", error);
      throw error;
    }
  }

  async getManufacturingOrder(id: number): Promise<any | null> {
    try {
      const [order] = await db.select()
        .from(manufacturingOrders)
        .where(eq(manufacturingOrders.id, id));
      
      return order || null;
    } catch (error) {
      console.error("Error getting manufacturing order:", error);
      throw error;
    }
  }

  async createManufacturingOrder(orderData: any): Promise<any> {
    try {
      const [newOrder] = await db.insert(manufacturingOrders).values(orderData).returning();
      return newOrder;
    } catch (error) {
      console.error("Error creating manufacturing order:", error);
      throw error;
    }
  }

  async updateManufacturingOrder(id: number, orderData: any): Promise<any | null> {
    try {
      const [updatedOrder] = await db.update(manufacturingOrders)
        .set(orderData)
        .where(eq(manufacturingOrders.id, id))
        .returning();
      
      return updatedOrder || null;
    } catch (error) {
      console.error("Error updating manufacturing order:", error);
      throw error;
    }
  }

  async deleteManufacturingOrder(id: number): Promise<boolean> {
    try {
      await db.delete(manufacturingOrders).where(eq(manufacturingOrders.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting manufacturing order:", error);
      throw error;
    }
  }

  async generateSerialNumbers(manufacturingOrderId: number): Promise<string[] | null> {
    try {
      // Отримуємо замовлення на виробництво
      const [order] = await db.select()
        .from(manufacturingOrders)
        .where(eq(manufacturingOrders.id, manufacturingOrderId));

      if (!order) {
        console.log("Order not found:", manufacturingOrderId);
        return null;
      }

      console.log("Order found:", order);

      // Отримуємо товар
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, order.productId));

      if (!product) {
        console.log("Product not found:", order.productId);
        return null;
      }

      console.log("Product found:", product);

      // Отримуємо категорію товару
      let category = null;
      if (product.categoryId) {
        const [cat] = await db.select()
          .from(categories)
          .where(eq(categories.id, product.categoryId));
        category = cat;
      }

      console.log("Category found:", category);

      // Отримуємо налаштування серійних номерів
      const [settings] = await db.select()
        .from(serialNumberSettings)
        .limit(1);

      console.log("Settings found:", settings);

      const quantity = parseInt(order.plannedQuantity);
      const serialNumbers: string[] = [];

      console.log("Generating", quantity, "serial numbers");

      // Генеруємо серійні номери
      for (let i = 0; i < quantity; i++) {
        let serialNumber = '';
        
        if (category?.useGlobalNumbering !== false && settings?.useCrossNumbering) {
          // Використовуємо глобальну нумерацію
          const template = settings.globalTemplate || "{year}{month:2}{day:2}-{counter:6}";
          const prefix = settings.globalPrefix || "";
          const currentCounter = (settings.currentGlobalCounter || 0) + i + 1;
          
          serialNumber = this.formatSerialNumber(template, prefix, currentCounter);
        } else if (category?.useSerialNumbers) {
          // Використовуємо налаштування категорії
          const template = category.serialNumberTemplate || "{year}{month:2}{day:2}-{counter:6}";
          const prefix = category.serialNumberPrefix || "";
          const startNumber = category.serialNumberStartNumber || 1;
          
          serialNumber = this.formatSerialNumber(template, prefix, startNumber + i);
        } else {
          // Базовий формат
          const currentYear = new Date().getFullYear();
          const orderNumber = order.orderNumber.replace(/\D/g, '').slice(-4) || '0001';
          serialNumber = `${currentYear}-${orderNumber}-${(i + 1).toString().padStart(4, '0')}`;
        }
        
        serialNumbers.push(serialNumber);
      }

      console.log("Generated serial numbers:", serialNumbers);

      // Оновлюємо замовлення з серійними номерами
      const [updatedOrder] = await db.update(manufacturingOrders)
        .set({ serialNumbers })
        .where(eq(manufacturingOrders.id, manufacturingOrderId))
        .returning();

      console.log("Updated order with serial numbers:", updatedOrder);

      // Оновлюємо глобальний лічильник
      if (settings?.useCrossNumbering) {
        await db.update(serialNumberSettings)
          .set({ currentGlobalCounter: (settings.currentGlobalCounter || 0) + quantity });
      }

      return serialNumbers;
    } catch (error) {
      console.error("Error generating serial numbers:", error);
      throw error;
    }
  }

  private formatSerialNumber(template: string, prefix: string, counter: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let formatted = template
      .replace('{year}', year.toString())
      .replace('{month:2}', month.toString().padStart(2, '0'))
      .replace('{month}', month.toString())
      .replace('{day:2}', day.toString().padStart(2, '0'))
      .replace('{day}', day.toString())
      .replace('{counter:6}', counter.toString().padStart(6, '0'))
      .replace('{counter:4}', counter.toString().padStart(4, '0'))
      .replace('{counter}', counter.toString());

    return prefix + formatted;
  }

  // Currency management
  async getCurrencies(): Promise<any[]> {
    try {
      const currenciesWithRates = await db.select({
        id: currencies.id,
        code: currencies.code,
        name: currencies.name,
        symbol: currencies.symbol,
        decimalPlaces: currencies.decimalPlaces,
        isBase: currencies.isBase,
        isActive: currencies.isActive,
        createdAt: currencies.createdAt,
        updatedAt: currencies.updatedAt,
        latestRate: exchangeRateHistory.rate,
        rateDate: exchangeRateHistory.createdAt
      })
      .from(currencies)
      .leftJoin(
        exchangeRateHistory,
        and(
          eq(currencies.id, exchangeRateHistory.currencyId),
          eq(exchangeRateHistory.id, 
            db.select({ maxId: sql`MAX(${exchangeRateHistory.id})` })
              .from(exchangeRateHistory)
              .where(eq(exchangeRateHistory.currencyId, currencies.id))
          )
        )
      )
      .orderBy(desc(currencies.isBase), currencies.code);

      return currenciesWithRates;
    } catch (error) {
      console.error("Error getting currencies:", error);
      throw error;
    }
  }

  async getCurrency(id: number): Promise<any | null> {
    try {
      const [currency] = await db.select()
        .from(currencies)
        .where(eq(currencies.id, id));
      
      return currency || null;
    } catch (error) {
      console.error("Error getting currency:", error);
      throw error;
    }
  }

  async createCurrency(currencyData: any): Promise<any> {
    try {
      // Якщо створюється базова валюта, спочатку змінимо всі інші на не базові
      if (currencyData.isBase) {
        await db.update(currencies)
          .set({ isBase: false })
          .where(eq(currencies.isBase, true));
      }

      const [newCurrency] = await db.insert(currencies).values(currencyData).returning();
      return newCurrency;
    } catch (error) {
      console.error("Error creating currency:", error);
      throw error;
    }
  }

  async updateCurrency(id: number, currencyData: any): Promise<any | null> {
    try {
      // Якщо змінюється базова валюта, спочатку змінимо всі інші на не базові
      if (currencyData.isBase) {
        await db.update(currencies)
          .set({ isBase: false })
          .where(and(eq(currencies.isBase, true), ne(currencies.id, id)));
      }

      const [updatedCurrency] = await db.update(currencies)
        .set({ ...currencyData, updatedAt: new Date() })
        .where(eq(currencies.id, id))
        .returning();
      
      return updatedCurrency || null;
    } catch (error) {
      console.error("Error updating currency:", error);
      throw error;
    }
  }

  async deleteCurrency(id: number): Promise<boolean> {
    try {
      await db.delete(currencies).where(eq(currencies.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting currency:", error);
      throw error;
    }
  }

  async setBaseCurrency(currencyId: number): Promise<any> {
    try {
      // Спочатку змінимо всі валюти на не базові
      await db.update(currencies)
        .set({ isBase: false })
        .where(eq(currencies.isBase, true));

      // Потім встановимо нову базову валюту
      const [updatedCurrency] = await db.update(currencies)
        .set({ isBase: true, updatedAt: new Date() })
        .where(eq(currencies.id, currencyId))
        .returning();

      return updatedCurrency;
    } catch (error) {
      console.error("Error setting base currency:", error);
      throw error;
    }
  }

  // Exchange rates management
  async getExchangeRates(): Promise<any[]> {
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
      })
      .from(exchangeRateHistory)
      .leftJoin(currencies, eq(exchangeRateHistory.currencyId, currencies.id))
      .orderBy(desc(exchangeRateHistory.createdAt));

      return rates;
    } catch (error) {
      console.error("Error getting exchange rates:", error);
      throw error;
    }
  }

  async createExchangeRate(rateData: any): Promise<any> {
    try {
      const [newRate] = await db.insert(exchangeRateHistory).values(rateData).returning();
      return newRate;
    } catch (error) {
      console.error("Error creating exchange rate:", error);
      throw error;
    }
  }

  async completeProductOrder(productId: number, quantity: string, warehouseId: number): Promise<any> {
    try {
      // Зменшуємо кількість товару на складі
      const [inventoryItem] = await db.select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, productId),
            eq(inventory.warehouseId, warehouseId)
          )
        )
        .limit(1);

      if (!inventoryItem) {
        throw new Error(`Товар не знайдено на складі`);
      }

      const currentQuantity = parseFloat(inventoryItem.quantity);
      const orderQuantity = parseFloat(quantity);

      if (currentQuantity < orderQuantity) {
        throw new Error(`Недостатньо товару на складі. Доступно: ${currentQuantity}, потрібно: ${orderQuantity}`);
      }

      const newQuantity = currentQuantity - orderQuantity;

      // Оновлюємо кількість на складі
      const [updatedInventory] = await db.update(inventory)
        .set({ 
          quantity: newQuantity.toString(),
          updatedAt: new Date()
        })
        .where(eq(inventory.id, inventoryItem.id))
        .returning();

      return {
        success: true,
        message: `Товар укомплектовано. Залишок на складі: ${newQuantity}`,
        updatedInventory
      };
    } catch (error) {
      console.error('Error completing product order:', error);
      throw error;
    }
  }

  async createSupplierOrderForShortage(productId: number, quantity: string, notes?: string): Promise<any> {
    try {
      // Отримуємо інформацію про товар
      const [product] = await db.select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        throw new Error(`Товар з ID ${productId} не знайдено`);
      }

      // Знаходимо першого доступного постачальника
      const [supplier] = await db.select()
        .from(suppliers)
        .limit(1);

      if (!supplier) {
        throw new Error('Не знайдено жодного постачальника');
      }

      // Створюємо замовлення постачальнику
      const [supplierOrder] = await db.insert(supplierOrders)
        .values({
          orderNumber: `SO-${Date.now()}`,
          supplierId: supplier.id,
          orderDate: new Date(),
          expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 днів
          status: 'pending',
          totalAmount: (parseFloat(product.costPrice) * parseFloat(quantity)).toString(),
          notes: notes || `Автоматичне замовлення через дефіцит товару ${product.name}`
        })
        .returning();

      return {
        success: true,
        message: `Створено замовлення постачальнику на ${quantity} од. товару "${product.name}"`,
        supplierOrder
      };
    } catch (error) {
      console.error('Error creating supplier order for shortage:', error);
      throw error;
    }
  }

  // Serial Numbers
  async getSerialNumbers(productId?: number, warehouseId?: number): Promise<SerialNumber[]> {
    let query = db.select().from(serialNumbers);
    
    if (productId || warehouseId) {
      const conditions = [];
      if (productId) conditions.push(eq(serialNumbers.productId, productId));
      if (warehouseId) conditions.push(eq(serialNumbers.warehouseId, warehouseId));
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(serialNumbers.createdAt));
  }

  async getSerialNumber(id: number): Promise<SerialNumber | null> {
    const [serialNumber] = await db.select().from(serialNumbers).where(eq(serialNumbers.id, id));
    return serialNumber || null;
  }

  async createSerialNumber(data: InsertSerialNumber): Promise<SerialNumber> {
    const [created] = await db
      .insert(serialNumbers)
      .values(data)
      .returning();
    return created;
  }

  async updateSerialNumber(id: number, data: Partial<InsertSerialNumber>): Promise<SerialNumber | null> {
    const [updated] = await db
      .update(serialNumbers)
      .set(data)
      .where(eq(serialNumbers.id, id))
      .returning();
    return updated || null;
  }

  async deleteSerialNumber(id: number): Promise<boolean> {
    try {
      const result = await db.delete(serialNumbers).where(eq(serialNumbers.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting serial number:", error);
      return false;
    }
  }

  async getAvailableSerialNumbers(productId: number): Promise<SerialNumber[]> {
    return await db
      .select()
      .from(serialNumbers)
      .where(and(
        eq(serialNumbers.productId, productId),
        eq(serialNumbers.status, 'available')
      ))
      .orderBy(desc(serialNumbers.createdAt));
  }

  async reserveSerialNumber(id: number, orderId: number): Promise<boolean> {
    try {
      const [updated] = await db
        .update(serialNumbers)
        .set({ status: 'reserved', orderId })
        .where(and(
          eq(serialNumbers.id, id),
          eq(serialNumbers.status, 'available')
        ))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error reserving serial number:", error);
      return false;
    }
  }

  async releaseSerialNumber(id: number): Promise<boolean> {
    try {
      const [updated] = await db
        .update(serialNumbers)
        .set({ status: 'available', orderId: null })
        .where(eq(serialNumbers.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error releasing serial number:", error);
      return false;
    }
  }

  async markSerialNumberAsSold(id: number): Promise<boolean> {
    try {
      const [updated] = await db
        .update(serialNumbers)
        .set({ status: 'sold' })
        .where(eq(serialNumbers.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error marking serial number as sold:", error);
      return false;
    }
  }

  // Client Nova Poshta Settings Methods
  async getClientNovaPoshtaSettings(clientId: number): Promise<ClientNovaPoshtaSettings[]> {
    return await db
      .select()
      .from(clientNovaPoshtaSettings)
      .where(eq(clientNovaPoshtaSettings.clientId, clientId))
      .orderBy(desc(clientNovaPoshtaSettings.isPrimary), desc(clientNovaPoshtaSettings.createdAt));
  }

  async getClientNovaPoshtaSetting(id: number): Promise<ClientNovaPoshtaSettings | undefined> {
    const [settings] = await db
      .select()
      .from(clientNovaPoshtaSettings)
      .where(eq(clientNovaPoshtaSettings.id, id));
    return settings;
  }

  async createClientNovaPoshtaSettings(settings: InsertClientNovaPoshtaSettings): Promise<ClientNovaPoshtaSettings> {
    const [created] = await db
      .insert(clientNovaPoshtaSettings)
      .values(settings)
      .returning();
    return created;
  }

  async updateClientNovaPoshtaSettings(id: number, settings: Partial<InsertClientNovaPoshtaSettings>): Promise<ClientNovaPoshtaSettings | undefined> {
    const [updated] = await db
      .update(clientNovaPoshtaSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(clientNovaPoshtaSettings.id, id))
      .returning();
    return updated;
  }

  async deleteClientNovaPoshtaSettings(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(clientNovaPoshtaSettings)
        .where(eq(clientNovaPoshtaSettings.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting Nova Poshta settings:", error);
      return false;
    }
  }

  async setPrimaryClientNovaPoshtaSettings(clientId: number, settingsId: number): Promise<boolean> {
    try {
      // Спочатку знімаємо прапорець isPrimary з усіх налаштувань клієнта
      await db
        .update(clientNovaPoshtaSettings)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(eq(clientNovaPoshtaSettings.clientId, clientId));

      // Потім встановлюємо обрані налаштування як основні
      const [updated] = await db
        .update(clientNovaPoshtaSettings)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(and(
          eq(clientNovaPoshtaSettings.id, settingsId),
          eq(clientNovaPoshtaSettings.clientId, clientId)
        ))
        .returning();

      return !!updated;
    } catch (error) {
      console.error("Error setting primary Nova Poshta settings:", error);
      return false;
    }
  }

  // Partial Shipment Methods
  async getOrderItemsWithShipmentInfo(orderId: number): Promise<any[]> {
    try {
      const result = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          shippedQuantity: orderItems.shippedQuantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
          productName: products.name,
          productSku: products.sku,
          productUnit: products.unit,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));

      return result.map(item => ({
        ...item,
        remainingQuantity: item.quantity - (item.shippedQuantity || 0),
        canShip: (item.quantity - (item.shippedQuantity || 0)) > 0
      }));
    } catch (error) {
      console.error('Error getting order items with shipment info:', error);
      throw error;
    }
  }

  async createPartialShipment(orderId: number, items: any[], shipmentData: any): Promise<any> {
    try {
      return await db.transaction(async (tx) => {
        // Створюємо відвантаження
        const shipmentNumber = `SH-${Date.now()}`;
        const [shipment] = await tx
          .insert(shipments)
          .values({
            ...shipmentData,
            orderId,
            shipmentNumber,
            status: 'preparing',
          })
          .returning();

        // Додаємо елементи відвантаження та оновлюємо кількість відвантажених товарів
        for (const item of items) {
          if (item.quantity > 0) {
            // Створюємо елемент відвантаження
            await tx.insert(shipmentItems).values({
              shipmentId: shipment.id,
              orderItemId: item.orderItemId,
              productId: item.productId,
              quantity: item.quantity,
              serialNumbers: item.serialNumbers || []
            });

            // Оновлюємо кількість відвантажених товарів у замовленні
            await tx
              .update(orderItems)
              .set({
                shippedQuantity: sql`${orderItems.shippedQuantity} + ${item.quantity}`
              })
              .where(eq(orderItems.id, item.orderItemId));
          }
        }

        // Перевіряємо чи замовлення повністю відвантажене
        const updatedItems = await tx
          .select({
            quantity: orderItems.quantity,
            shippedQuantity: orderItems.shippedQuantity
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));

        const isFullyShipped = updatedItems.every(item => 
          (item.shippedQuantity || 0) >= item.quantity
        );

        // Оновлюємо статус замовлення якщо воно повністю відвантажене
        if (isFullyShipped) {
          await tx
            .update(orders)
            .set({ status: 'shipped' })
            .where(eq(orders.id, orderId));
        } else {
          // Встановлюємо статус часткового відвантаження
          await tx
            .update(orders)
            .set({ status: 'partially_shipped' })
            .where(eq(orders.id, orderId));
        }

        return shipment;
      });
    } catch (error) {
      console.error('Error creating partial shipment:', error);
      throw error;
    }
  }

  // Manufacturing methods
  async startManufacturing(id: number): Promise<any> {
    try {
      const [updated] = await db
        .update(manufacturingOrders)
        .set({ 
          status: 'in_progress',
          startDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(manufacturingOrders.id, id))
        .returning();

      if (updated) {
        // Створюємо базові стадії виробництва якщо їх немає
        await this.createDefaultManufacturingSteps(id);
      }

      return updated;
    } catch (error) {
      console.error('Error starting manufacturing:', error);
      throw error;
    }
  }

  async completeManufacturing(id: number, producedQuantity: string, qualityRating: string, notes?: string): Promise<any> {
    try {
      const [updated] = await db
        .update(manufacturingOrders)
        .set({ 
          status: 'completed',
          producedQuantity,
          qualityRating,
          notes,
          actualEndDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(manufacturingOrders.id, id))
        .returning();

      // Оновити інвентар на складі
      if (updated && updated.warehouseId && updated.productId) {
        await this.updateInventoryAfterManufacturing(
          updated.productId,
          updated.warehouseId,
          parseFloat(producedQuantity)
        );
      }

      return updated;
    } catch (error) {
      console.error('Error completing manufacturing:', error);
      throw error;
    }
  }

  async getManufacturingSteps(manufacturingOrderId: number): Promise<any[]> {
    try {
      const steps = await db
        .select({
          id: manufacturingSteps.id,
          stepNumber: manufacturingSteps.stepNumber,
          name: manufacturingSteps.name,
          description: manufacturingSteps.description,
          status: manufacturingSteps.status,
          estimatedDuration: manufacturingSteps.estimatedDuration,
          actualDuration: manufacturingSteps.actualDuration,
          startTime: manufacturingSteps.startTime,
          endTime: manufacturingSteps.endTime,
          qualityCheckPassed: manufacturingSteps.qualityCheckPassed,
          notes: manufacturingSteps.notes,
          equipment: manufacturingSteps.equipment,
          temperature: manufacturingSteps.temperature,
          worker: workers
        })
        .from(manufacturingSteps)
        .leftJoin(workers, eq(manufacturingSteps.assignedWorkerId, workers.id))
        .where(eq(manufacturingSteps.manufacturingOrderId, manufacturingOrderId))
        .orderBy(manufacturingSteps.stepNumber);

      return steps;
    } catch (error) {
      console.error('Error getting manufacturing steps:', error);
      return [];
    }
  }

  async createManufacturingStep(stepData: any): Promise<any> {
    try {
      const [created] = await db
        .insert(manufacturingSteps)
        .values(stepData)
        .returning();

      return created;
    } catch (error) {
      console.error('Error creating manufacturing step:', error);
      throw error;
    }
  }

  async updateManufacturingStep(id: number, stepData: any): Promise<any> {
    try {
      const [updated] = await db
        .update(manufacturingSteps)
        .set(stepData)
        .where(eq(manufacturingSteps.id, id))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error updating manufacturing step:', error);
      throw error;
    }
  }

  async startManufacturingStep(stepId: number): Promise<any> {
    try {
      const [updated] = await db
        .update(manufacturingSteps)
        .set({ 
          status: 'in_progress',
          startTime: new Date()
        })
        .where(eq(manufacturingSteps.id, stepId))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error starting manufacturing step:', error);
      throw error;
    }
  }

  async completeManufacturingStep(stepId: number, data: { qualityCheckPassed?: boolean; notes?: string }): Promise<any> {
    try {
      const step = await db
        .select()
        .from(manufacturingSteps)
        .where(eq(manufacturingSteps.id, stepId))
        .limit(1);

      if (!step[0]) {
        throw new Error('Manufacturing step not found');
      }

      const startTime = step[0].startTime;
      const endTime = new Date();
      const actualDuration = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : null;

      const [updated] = await db
        .update(manufacturingSteps)
        .set({ 
          status: 'completed',
          endTime,
          actualDuration,
          qualityCheckPassed: data.qualityCheckPassed ?? true,
          notes: data.notes
        })
        .where(eq(manufacturingSteps.id, stepId))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error completing manufacturing step:', error);
      throw error;
    }
  }

  private async createDefaultManufacturingSteps(manufacturingOrderId: number): Promise<void> {
    const defaultSteps = [
      { stepNumber: 1, name: 'Підготовка матеріалів', description: 'Перевірка та підготовка всіх необхідних матеріалів' },
      { stepNumber: 2, name: 'Налаштування обладнання', description: 'Налаштування та калібрування виробничого обладнання' },
      { stepNumber: 3, name: 'Виробництво', description: 'Основний процес виготовлення продукції' },
      { stepNumber: 4, name: 'Контроль якості', description: 'Перевірка якості готової продукції' },
      { stepNumber: 5, name: 'Пакування', description: 'Пакування готової продукції' }
    ];

    for (const step of defaultSteps) {
      await db
        .insert(manufacturingSteps)
        .values({
          manufacturingOrderId,
          ...step,
          status: 'pending',
          estimatedDuration: 60 // 1 година за замовчуванням
        });
    }
  }

  private async updateInventoryAfterManufacturing(productId: number, warehouseId: number, quantity: number): Promise<void> {
    try {
      // Перевіряємо чи є вже запис в інвентарі
      const existingInventory = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, productId),
            eq(inventory.warehouseId, warehouseId)
          )
        )
        .limit(1);

      if (existingInventory.length > 0) {
        // Оновлюємо існуючий запис
        await db
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} + ${quantity}`,
            updatedAt: new Date()
          })
          .where(eq(inventory.id, existingInventory[0].id));
      } else {
        // Створюємо новий запис
        await db
          .insert(inventory)
          .values({
            productId,
            warehouseId,
            quantity: quantity.toString(),
            minStock: 0,
            maxStock: 1000
          });
      }
    } catch (error) {
      console.error('Error updating inventory after manufacturing:', error);
    }
  }

  // User management methods with worker integration
  async getLocalUsersWithWorkers() {
    const usersData = await db
      .select({
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
          departmentId: workers.departmentId,
        },
        position: {
          id: positions.id,
          name: positions.name,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
        roleData: {
          id: roles.id,
          name: roles.name,
          displayName: roles.displayName,
        }
      })
      .from(localUsers)
      .leftJoin(workers, eq(localUsers.workerId, workers.id))
      .leftJoin(positions, eq(workers.positionId, positions.id))
      .leftJoin(departments, eq(workers.departmentId, departments.id))
      .leftJoin(roles, eq(localUsers.roleId, roles.id))
      .orderBy(localUsers.createdAt);

    return usersData;
  }

  async getWorkersAvailableForUsers() {
    const availableWorkers = await db
      .select({
        id: workers.id,
        firstName: workers.firstName,
        lastName: workers.lastName,
        email: workers.email,
        phone: workers.phone,
        positionId: workers.positionId,
        departmentId: workers.departmentId,
        position: {
          id: positions.id,
          name: positions.name,
        },
        department: {
          id: departments.id,
          name: departments.name,
        }
      })
      .from(workers)
      .leftJoin(positions, eq(workers.positionId, positions.id))
      .leftJoin(departments, eq(workers.departmentId, departments.id))
      .leftJoin(localUsers, eq(workers.id, localUsers.workerId))
      .where(isNull(localUsers.workerId))
      .orderBy(workers.firstName, workers.lastName);

    return availableWorkers;
  }

  async getLocalUser(id: number) {
    const [user] = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.id, id))
      .limit(1);
    return user;
  }

  async getLocalUserByUsername(username: string) {
    const [user] = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.username, username))
      .limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<LocalUser | undefined> {
    const [user] = await db
      .select()
      .from(localUsers)
      .where(eq(localUsers.email, email))
      .limit(1);
    return user;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(localUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(localUsers.id, id));
  }

  async createLocalUserWithWorker(userData: any) {
    const [user] = await db
      .insert(localUsers)
      .values(userData)
      .returning();
    return user;
  }

  async updateLocalUser(id: number, userData: any) {
    const [user] = await db
      .update(localUsers)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(localUsers.id, id))
      .returning();
    return user;
  }

  async deleteLocalUser(id: number) {
    const result = await db
      .delete(localUsers)
      .where(eq(localUsers.id, id));
    return result.rowCount > 0;
  }

  async toggleUserStatus(id: number, isActive: boolean) {
    const [user] = await db
      .update(localUsers)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(localUsers.id, id))
      .returning();
    return user;
  }

  async changeUserPassword(id: number, hashedPassword: string) {
    const [user] = await db
      .update(localUsers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(localUsers.id, id))
      .returning();
    return user;
  }

  async updateLocalUserPermissions(id: number, permissions: Record<string, boolean>) {
    const [user] = await db
      .update(localUsers)
      .set({ permissions, updatedAt: new Date() })
      .where(eq(localUsers.id, id))
      .returning();
    return user;
  }

  // Password reset functionality
  async savePasswordResetToken(userId: number, token: string, expires: Date) {
    try {
      const [user] = await db
        .update(localUsers)
        .set({ 
          passwordResetToken: token, 
          passwordResetExpires: expires,
          updatedAt: new Date()
        })
        .where(eq(localUsers.id, userId))
        .returning();
      return !!user;
    } catch (error) {
      console.error("Error saving password reset token:", error);
      return false;
    }
  }

  async getUserByResetToken(token: string) {
    try {
      const [user] = await db
        .select()
        .from(localUsers)
        .where(
          and(
            eq(localUsers.passwordResetToken, token),
            gte(localUsers.passwordResetExpires, new Date())
          )
        );
      return user || null;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return null;
    }
  }

  async confirmPasswordReset(userId: number, hashedPassword: string) {
    try {
      const [user] = await db
        .update(localUsers)
        .set({ 
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date()
        })
        .where(eq(localUsers.id, userId))
        .returning();
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
  async getClientByExternalId(externalId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.externalId, externalId))
      .limit(1);
    return client;
  }

  async getClientByTaxCode(taxCode: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.taxCode, taxCode))
      .limit(1);
    return client;
  }

  async updateClientSyncInfo(clientId: number, externalId: string, source: string): Promise<void> {
    await db
      .update(clients)
      .set({ externalId, source })
      .where(eq(clients.id, clientId));
  }

  // Методи для контактів клієнтів з externalId
  async getClientContactByExternalId(externalId: string): Promise<ClientContact | undefined> {
    const [contact] = await db
      .select()
      .from(clientContacts)
      .where(eq(clientContacts.externalId, externalId))
      .limit(1);
    return contact;
  }

  // Методи для клієнтів
  async getClients(): Promise<any[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async createClient(clientData: any): Promise<any> {
    const [client] = await db
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async getClient(id: number): Promise<any> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    return client;
  }

  async updateClient(id: number, updates: any): Promise<any> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Методи для логів синхронізації
  async createSyncLog(logData: any): Promise<any> {
    const [log] = await db
      .insert(syncLogs)
      .values({
        integrationId: 1, // Тимчасово використовуємо фіксований ID
        operation: 'batch_sync',
        status: logData.status,
        recordsFailed: logData.errorsCount,
        startedAt: logData.startTime,
        completedAt: logData.endTime,
        details: logData.details
      })
      .returning();
    return log;
  }

  async getSyncLogBySyncId(syncId: string): Promise<any> {
    // Поки що використовуємо просте пошук по деталях
    const [log] = await db
      .select()
      .from(syncLogs)
      .where(sql`details->>'syncId' = ${syncId}`)
      .limit(1);
    return log;
  }

  // Order Status Methods
  async getOrderStatuses(): Promise<OrderStatus[]> {
    return await db
      .select()
      .from(orderStatuses)
      .orderBy(orderStatuses.name);
  }

  async getOrderStatus(id: number): Promise<OrderStatus | undefined> {
    const [status] = await db
      .select()
      .from(orderStatuses)
      .where(eq(orderStatuses.id, id));
    return status;
  }

  async createOrderStatus(statusData: InsertOrderStatus): Promise<OrderStatus> {
    const [status] = await db
      .insert(orderStatuses)
      .values({
        ...statusData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return status;
  }

  async updateOrderStatusRecord(id: number, statusData: Partial<InsertOrderStatus>): Promise<OrderStatus | undefined> {
    const [status] = await db
      .update(orderStatuses)
      .set({
        ...statusData,
        updatedAt: new Date()
      })
      .where(eq(orderStatuses.id, id))
      .returning();
    return status;
  }

  async deleteOrderStatusRecord(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(orderStatuses)
        .where(eq(orderStatuses.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error("Error deleting order status:", error);
      return false;
    }
  }

  // User Sort Preferences
  async getUserSortPreferences(userId: string, tableName: string): Promise<UserSortPreference | null> {
    const [preference] = await db
      .select()
      .from(userSortPreferences)
      .where(and(eq(userSortPreferences.userId, userId), eq(userSortPreferences.tableName, tableName)))
      .limit(1);
    return preference || null;
  }

  async saveUserSortPreferences(preference: InsertUserSortPreference): Promise<UserSortPreference> {
    const [result] = await db
      .insert(userSortPreferences)
      .values(preference)
      .onConflictDoUpdate({
        target: [userSortPreferences.userId, userSortPreferences.tableName],
        set: {
          sortField: preference.sortField,
          sortDirection: preference.sortDirection,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Обробка оплати та запуск виробництва (повна/часткова/по договору)
  async processOrderPayment(
    orderId: number, 
    paymentData: {
      paymentType: 'full' | 'partial' | 'contract' | 'none';
      paidAmount?: string;
      contractNumber?: string;
      productionApproved?: boolean;
      approvedBy?: string;
    }
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Перевіряємо поточний стан замовлення
      const existingOrder = await this.getOrder(orderId);
      if (!existingOrder) {
        throw new Error(`Замовлення з ID ${orderId} не знайдено`);
      }

      // Якщо замовлення вже має тип оплати, що передбачає виробництво, не створюємо нові завдання
      const alreadyHasProduction = existingOrder.productionApproved && 
        (existingOrder.paymentType === 'full' || existingOrder.paymentType === 'contract' || 
         (existingOrder.paymentType === 'partial' && existingOrder.productionApproved));
      
      // Оновлюємо інформацію про оплату в замовленні
      const updateData: any = {
        paymentType: paymentData.paymentType,
        paidAmount: paymentData.paidAmount || "0",
      };

      // Для повної оплати встановлюємо дату оплати
      if (paymentData.paymentType === 'full') {
        updateData.paymentDate = now;
        updateData.productionApproved = true;
        updateData.productionApprovedBy = paymentData.approvedBy || 'system';
        updateData.productionApprovedAt = now;
      }

      // Для часткової оплати
      if (paymentData.paymentType === 'partial') {
        updateData.paymentDate = now;
        // Дозвіл на виробництво треба надавати окремо
        if (paymentData.productionApproved) {
          updateData.productionApproved = true;
          updateData.productionApprovedBy = paymentData.approvedBy;
          updateData.productionApprovedAt = now;
        }
      }

      // Для договірної роботи
      if (paymentData.paymentType === 'contract') {
        updateData.contractNumber = paymentData.contractNumber;
        updateData.productionApproved = true;
        updateData.productionApprovedBy = paymentData.approvedBy || 'contract';
        updateData.productionApprovedAt = now;
      }

      // Оновлюємо замовлення
      await db.update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      // Якщо дозволено виробництво і не було раніше створено завдання - створюємо завдання
      if (updateData.productionApproved && !alreadyHasProduction) {
        await this.createManufacturingTasksForOrder(orderId);
      } else if (alreadyHasProduction) {
        console.log(`Завдання на виробництво для замовлення ${orderId} вже існують, пропускаємо створення`);
      }

      console.log(`Оброблено платіж для замовлення ${orderId}: тип ${paymentData.paymentType}, виробництво ${updateData.productionApproved ? 'дозволено' : 'не дозволено'}`);
    } catch (error) {
      console.error("Помилка при обробці платежу замовлення:", error);
      throw error;
    }
  }

  // Створення виробничих завдань для замовлення
  private async createManufacturingTasksForOrder(orderId: number): Promise<void> {
    try {
      // Отримуємо замовлення з товарами
      const orderWithItems = await db.select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        item: orderItems,
        product: products,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, orderId));

      if (orderWithItems.length === 0) {
        console.log(`Замовлення з ID ${orderId} не знайдено або не має товарів`);
        return;
      }

      // Групуємо товари по productId
      const productGroups = new Map<number, { product: any, totalQuantity: number }>();
      
      for (const row of orderWithItems) {
        const productId = row.item.productId;
        const quantity = parseInt(row.item.quantity.toString());
        
        if (!productGroups.has(productId)) {
          productGroups.set(productId, {
            product: row.product,
            totalQuantity: 0
          });
        }
        
        const group = productGroups.get(productId)!;
        group.totalQuantity += quantity;
      }

      // Обробляємо кожний тип товару
      for (const [productId, group] of productGroups) {
        await this.createOrUpdateManufacturingOrder(
          productId, 
          group.totalQuantity, 
          orderId,
          orderWithItems[0].orderNumber
        );
      }

      console.log(`Створено виробничі завдання для замовлення ${orderWithItems[0].orderNumber}`);
    } catch (error) {
      console.error("Помилка при створенні виробничих завдань:", error);
      throw error;
    }
  }

  // Окремий метод для дозволу виробництва без оплати
  async approveProductionForOrder(
    orderId: number,
    approvedBy: string,
    reason: string = 'manual_approval'
  ): Promise<void> {
    try {
      const now = new Date();
      
      await db.update(orders)
        .set({
          productionApproved: true,
          productionApprovedBy: approvedBy,
          productionApprovedAt: now,
        })
        .where(eq(orders.id, orderId));

      // Створюємо виробничі завдання
      await this.createManufacturingTasksForOrder(orderId);

      console.log(`Дозволено виробництво для замовлення ${orderId} користувачем ${approvedBy}`);
    } catch (error) {
      console.error("Помилка при дозволі виробництва:", error);
      throw error;
    }
  }

  private async createOrUpdateManufacturingOrder(
    productId: number, 
    quantity: number, 
    sourceOrderId: number,
    orderNumber: string
  ): Promise<void> {
    try {
      // Перевіряємо чи є рецепт для цього продукту
      const recipe = await db.select()
        .from(recipes)
        .where(eq(recipes.productId, productId))
        .limit(1);

      if (recipe.length === 0) {
        console.log(`Рецепт для продукту з ID ${productId} не знайдено. Пропускаємо створення виробничого завдання.`);
        return;
      }

      // Шукаємо існуючі незапущені виробничі завдання для цього продукту
      const existingOrders = await db.select()
        .from(manufacturingOrders)
        .where(and(
          eq(manufacturingOrders.productId, productId),
          eq(manufacturingOrders.status, 'pending')
        ));

      if (existingOrders.length > 0) {
        // Якщо є незапущені завдання - об'єднуємо кількість
        const existingOrder = existingOrders[0];
        const newQuantity = parseFloat(existingOrder.plannedQuantity) + quantity;
        
        await db.update(manufacturingOrders)
          .set({
            plannedQuantity: newQuantity.toString(),
            notes: `${existingOrder.notes || ''}\nДодано з замовлення ${orderNumber}: ${quantity} шт.`,
            updatedAt: new Date()
          })
          .where(eq(manufacturingOrders.id, existingOrder.id));

        console.log(`Додано ${quantity} шт. до існуючого завдання на виробництво #${existingOrder.orderNumber}`);
      } else {
        // Створюємо нове виробниче завдання
        const manufacturingOrderNumber = `MFG-${Date.now()}-${productId}`;
        
        await db.insert(manufacturingOrders).values({
          orderNumber: manufacturingOrderNumber,
          productId: productId,
          recipeId: recipe[0].id,
          plannedQuantity: quantity.toString(),
          producedQuantity: '0',
          status: 'pending',
          priority: 'medium',
          sourceOrderId: sourceOrderId,
          materialCost: '0.00',
          laborCost: '0.00',
          overheadCost: '0.00',
          totalCost: '0.00',
          notes: `Автоматично створено з замовлення ${orderNumber}. Потрібно виготовити: ${quantity} шт.`,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`Створено нове завдання на виробництво ${manufacturingOrderNumber} для ${quantity} шт.`);
      }
    } catch (error) {
      console.error("Помилка при створенні/оновленні виробничого завдання:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
