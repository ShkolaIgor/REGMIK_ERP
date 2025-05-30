import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
import {
  users, categories, warehouses, units, products, inventory, orders, orderItems,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  productComponents, costCalculations, materialShortages, supplierOrders, supplierOrderItems,
  type User, type InsertUser, type Category, type InsertCategory,
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
  type ProductComponent, type InsertProductComponent,
  type CostCalculation, type InsertCostCalculation,
  type MaterialShortage, type InsertMaterialShortage,
  type SupplierOrder, type InsertSupplierOrder,
  type SupplierOrderItem, type InsertSupplierOrderItem
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
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

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
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
    return result[0];
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
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
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

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderResult = await db.insert(orders).values(insertOrder).returning();
    const order = orderResult[0];

    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(item => ({ ...item, orderId: order.id }))
      );
    }

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
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

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }

  // Tech Cards
  async getTechCards(): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] })[]> {
    const techCardsResult = await db.select({
      id: techCards.id,
      name: techCards.name,
      description: techCards.description,
      productId: techCards.productId,
      estimatedTime: techCards.estimatedTime,
      difficulty: techCards.difficulty,
      status: techCards.status,
      materialCost: techCards.materialCost,
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
      estimatedTime: techCards.estimatedTime,
      difficulty: techCards.difficulty,
      status: techCards.status,
      materialCost: techCards.materialCost,
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
      product: techCard.product,
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

    // Підрахунок дефіциту матеріалів
    const [materialShortagesResult] = await db.select({ count: sql<number>`count(*)` }).from(materialShortages)
      .where(eq(materialShortages.status, 'pending'));

    const [criticalShortagesResult] = await db.select({ count: sql<number>`count(*)` }).from(materialShortages)
      .where(eq(materialShortages.priority, 'critical'));

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
      productionTasks: productionTasksResult.count,
      materialShortages: materialShortagesResult.count,
      criticalShortages: criticalShortagesResult.count
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
  async getMaterialShortages(): Promise<(MaterialShortage & { product: Product; warehouse?: Warehouse })[]> {
    const result = await db.select({
      shortage: materialShortages,
      product: products,
      warehouse: warehouses
    })
    .from(materialShortages)
    .leftJoin(products, eq(materialShortages.productId, products.id))
    .leftJoin(warehouses, eq(materialShortages.warehouseId, warehouses.id))
    .orderBy(materialShortages.priority, materialShortages.createdAt);

    return result.map(row => ({
      ...row.shortage,
      product: row.product!,
      warehouse: row.warehouse || undefined
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
    const result = await db.update(materialShortages)
      .set({ ...shortageData, updatedAt: new Date() })
      .where(eq(materialShortages.id, id))
      .returning();
    
    return result[0];
  }

  async deleteMaterialShortage(id: number): Promise<boolean> {
    const result = await db.delete(materialShortages)
      .where(eq(materialShortages.id, id));
    
    return result.rowCount > 0;
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
            supplierRecommendation: null,
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

      // Отримуємо постачальника з рекомендації або використовуємо загальний
      const supplierName = shortage.supplierRecommendation || "Основний постачальник";

      // Створюємо замовлення постачальнику
      const orderData: InsertSupplierOrder = {
        supplierName,
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

  async getSupplierOrders(): Promise<(SupplierOrder & { items: (SupplierOrderItem & { product: Product })[] })[]> {
    try {
      const orders = await db.select().from(supplierOrders).orderBy(sql`${supplierOrders.createdAt} DESC`);
      
      const ordersWithItems = [];
      for (const order of orders) {
        const items = await db.select({
          item: supplierOrderItems,
          product: products,
        }).from(supplierOrderItems)
          .leftJoin(products, eq(supplierOrderItems.productId, products.id))
          .where(eq(supplierOrderItems.orderId, order.id));

        const filteredItems = items.filter(item => item.product) as { item: SupplierOrderItem; product: Product }[];
        
        ordersWithItems.push({
          ...order,
          items: filteredItems.map(({ item, product }) => ({ ...item, product }))
        });
      }

      return ordersWithItems;
    } catch (error) {
      console.error('Error getting supplier orders:', error);
      throw error;
    }
  }

  async getSupplierOrder(id: number): Promise<(SupplierOrder & { items: (SupplierOrderItem & { product: Product })[] }) | undefined> {
    try {
      const orders = await db.select().from(supplierOrders).where(eq(supplierOrders.id, id));
      if (orders.length === 0) return undefined;

      const order = orders[0];
      const items = await db.select({
        item: supplierOrderItems,
        product: products,
      }).from(supplierOrderItems)
        .leftJoin(products, eq(supplierOrderItems.productId, products.id))
        .where(eq(supplierOrderItems.orderId, id));

      const filteredItems = items.filter(item => item.product) as { item: SupplierOrderItem; product: Product }[];

      return {
        ...order,
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
}

export const dbStorage = new DatabaseStorage();