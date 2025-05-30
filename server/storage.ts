import {
  users, categories, units, warehouses, products, inventory, orders, orderItems,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  productComponents,
  type User, type InsertUser, type Category, type InsertCategory,
  type Unit, type InsertUnit,
  type Warehouse, type InsertWarehouse, type Product, type InsertProduct,
  type Inventory, type InsertInventory, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient,
  type ProductionTask, type InsertProductionTask,
  type Supplier, type InsertSupplier,
  type TechCard, type InsertTechCard,
  type TechCardStep, type InsertTechCardStep,
  type TechCardMaterial, type InsertTechCardMaterial,
  type ProductComponent, type InsertProductComponent
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Units
  getUnits(): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit | undefined>;
  deleteUnit(id: number): Promise<boolean>;

  // Warehouses
  getWarehouses(): Promise<Warehouse[]>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Inventory
  getInventory(): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]>;
  getInventoryByWarehouse(warehouseId: number): Promise<(Inventory & { product: Product })[]>;
  updateInventory(productId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { product: Product })[] }) | undefined>;
  createRecipe(recipe: InsertRecipe, ingredients: InsertRecipeIngredient[]): Promise<Recipe>;

  // Production Tasks
  getProductionTasks(): Promise<(ProductionTask & { recipe: Recipe })[]>;
  createProductionTask(task: InsertProductionTask): Promise<ProductionTask>;
  updateProductionTask(id: number, task: Partial<InsertProductionTask>): Promise<ProductionTask | undefined>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Tech Cards
  getTechCards(): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] })[]>;
  getTechCard(id: number): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] }) | undefined>;
  createTechCard(techCard: InsertTechCard, steps: InsertTechCardStep[], materials: InsertTechCardMaterial[]): Promise<TechCard>;
  updateTechCard(id: number, techCard: Partial<InsertTechCard>, steps?: InsertTechCardStep[], materials?: InsertTechCardMaterial[]): Promise<TechCard | undefined>;

  // Product Components (BOM)
  getProductComponents(productId: number): Promise<(ProductComponent & { component: Product })[]>;
  addProductComponent(component: InsertProductComponent): Promise<ProductComponent>;
  removeProductComponent(id: number): Promise<boolean>;
  updateProductComponent(id: number, component: Partial<InsertProductComponent>): Promise<ProductComponent | undefined>;

  // Analytics
  getDashboardStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    activeOrders: number;
    productionTasks: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private categories: Map<number, Category> = new Map();
  private units: Map<number, Unit> = new Map();
  private warehouses: Map<number, Warehouse> = new Map();
  private products: Map<number, Product> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem[]> = new Map();
  private recipes: Map<number, Recipe> = new Map();
  private recipeIngredients: Map<number, RecipeIngredient[]> = new Map();
  private productionTasks: Map<number, ProductionTask> = new Map();
  private suppliers: Map<number, Supplier> = new Map();
  private techCards: Map<number, TechCard> = new Map();
  private techCardSteps: Map<number, TechCardStep[]> = new Map();
  private techCardMaterials: Map<number, TechCardMaterial[]> = new Map();
  private productComponents: Map<number, ProductComponent[]> = new Map();

  private currentUserId = 1;
  private currentCategoryId = 1;
  private currentUnitId = 1;
  private currentWarehouseId = 1;
  private currentProductId = 1;
  private currentInventoryId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentRecipeId = 1;
  private currentRecipeIngredientId = 1;
  private currentProductionTaskId = 1;
  private currentSupplierId = 1;
  private currentTechCardId = 1;
  private currentTechCardStepId = 1;
  private currentTechCardMaterialId = 1;
  private currentProductComponentId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data for demonstration
    const defaultCategory: Category = { id: 1, name: "Електроніка", description: "Електронні компоненти" };
    this.categories.set(1, defaultCategory);
    this.currentCategoryId = 2;

    const defaultWarehouse: Warehouse = { id: 1, name: "Головний склад", location: "Київ", description: "Основний склад" };
    this.warehouses.set(1, defaultWarehouse);
    this.currentWarehouseId = 2;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory, 
      id,
      description: insertCategory.description ?? null
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) {
      return undefined;
    }
    const updatedCategory = { ...existingCategory, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.currentWarehouseId++;
    const warehouse: Warehouse = { 
      ...insertWarehouse, 
      id,
      description: insertWarehouse.description ?? null,
      location: insertWarehouse.location ?? null
    };
    this.warehouses.set(id, warehouse);
    return warehouse;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      description: insertProduct.description ?? null,
      barcode: insertProduct.barcode ?? null,
      categoryId: insertProduct.categoryId ?? null,
      photo: insertProduct.photo ?? null,
      createdAt: new Date() 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Inventory
  async getInventory(): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]> {
    const result: (Inventory & { product: Product; warehouse: Warehouse })[] = [];
    const inventoryValues = [...this.inventory.values()];
    
    for (const inventory of inventoryValues) {
      const product = this.products.get(inventory.productId);
      const warehouse = this.warehouses.get(inventory.warehouseId);
      
      if (product && warehouse) {
        result.push({ ...inventory, product, warehouse });
      }
    }
    
    return result;
  }

  async getInventoryByWarehouse(warehouseId: number): Promise<(Inventory & { product: Product })[]> {
    const result: (Inventory & { product: Product })[] = [];
    const inventoryValues = [...this.inventory.values()];
    
    for (const inventory of inventoryValues) {
      if (inventory.warehouseId === warehouseId) {
        const product = this.products.get(inventory.productId);
        if (product) {
          result.push({ ...inventory, product });
        }
      }
    }
    
    return result;
  }

  async updateInventory(productId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined> {
    const key = `${productId}-${warehouseId}`;
    let inventory = this.inventory.get(key);
    
    if (!inventory) {
      const id = this.currentInventoryId++;
      inventory = {
        id,
        productId,
        warehouseId,
        quantity,
        minStock: 10,
        maxStock: 1000,
        updatedAt: new Date()
      };
    } else {
      inventory = { ...inventory, quantity, updatedAt: new Date() };
    }
    
    this.inventory.set(key, inventory);
    return inventory;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const orderItemsList = this.orderItems.get(id) || [];
    const items: (OrderItem & { product: Product })[] = [];

    for (const item of orderItemsList) {
      const product = this.products.get(item.productId);
      if (product) {
        items.push({ ...item, product });
      }
    }

    return { ...order, items };
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: insertOrder.status ?? "pending",
      customerEmail: insertOrder.customerEmail ?? null,
      customerPhone: insertOrder.customerPhone ?? null,
      createdAt: new Date() 
    };
    
    this.orders.set(id, order);
    
    const orderItemsList: OrderItem[] = items.map(item => ({
      ...item,
      id: this.currentOrderItemId++,
      orderId: id
    }));
    
    this.orderItems.set(id, orderItemsList);
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { product: Product })[] }) | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;

    const ingredientsList = this.recipeIngredients.get(id) || [];
    const ingredients: (RecipeIngredient & { product: Product })[] = [];

    for (const ingredient of ingredientsList) {
      const product = this.products.get(ingredient.productId);
      if (product) {
        ingredients.push({ ...ingredient, product });
      }
    }

    return { ...recipe, ingredients };
  }

  async createRecipe(insertRecipe: InsertRecipe, ingredients: InsertRecipeIngredient[]): Promise<Recipe> {
    const id = this.currentRecipeId++;
    const recipe: Recipe = { 
      ...insertRecipe, 
      id,
      description: insertRecipe.description ?? null,
      productId: insertRecipe.productId ?? null,
      instructions: insertRecipe.instructions ?? null,
      estimatedTime: insertRecipe.estimatedTime ?? null,
      laborCost: insertRecipe.laborCost ?? null,
      createdAt: new Date() 
    };
    
    this.recipes.set(id, recipe);
    
    const ingredientsList: RecipeIngredient[] = ingredients.map(ingredient => ({
      ...ingredient,
      id: this.currentRecipeIngredientId++,
      recipeId: id
    }));
    
    this.recipeIngredients.set(id, ingredientsList);
    
    return recipe;
  }

  // Production Tasks
  async getProductionTasks(): Promise<(ProductionTask & { recipe: Recipe })[]> {
    const result: (ProductionTask & { recipe: Recipe })[] = [];
    const taskValues = [...this.productionTasks.values()];
    
    for (const task of taskValues) {
      const recipe = this.recipes.get(task.recipeId);
      if (recipe) {
        result.push({ ...task, recipe });
      }
    }
    
    return result;
  }

  async createProductionTask(insertTask: InsertProductionTask): Promise<ProductionTask> {
    const id = this.currentProductionTaskId++;
    const task: ProductionTask = { 
      ...insertTask, 
      id,
      status: insertTask.status ?? "planned",
      priority: insertTask.priority ?? "medium",
      assignedTo: insertTask.assignedTo ?? null,
      startDate: insertTask.startDate ?? null,
      endDate: insertTask.endDate ?? null,
      progress: insertTask.progress ?? null,
      notes: insertTask.notes ?? null,
      createdAt: new Date() 
    };
    
    this.productionTasks.set(id, task);
    return task;
  }

  async updateProductionTask(id: number, taskData: Partial<InsertProductionTask>): Promise<ProductionTask | undefined> {
    const task = this.productionTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    this.productionTasks.set(id, updatedTask);
    return updatedTask;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentSupplierId++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      contactPerson: insertSupplier.contactPerson ?? null,
      email: insertSupplier.email ?? null,
      phone: insertSupplier.phone ?? null,
      address: insertSupplier.address ?? null
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    activeOrders: number;
    productionTasks: number;
  }> {
    const totalProducts = this.products.size;
    const activeOrders = Array.from(this.orders.values()).filter(o => o.status === 'pending' || o.status === 'processing').length;
    const productionTasks = Array.from(this.productionTasks.values()).filter(t => t.status !== 'completed').length;
    
    let totalValue = 0;
    let lowStockCount = 0;
    const inventoryValues = [...this.inventory.values()];
    
    for (const inventory of inventoryValues) {
      const product = this.products.get(inventory.productId);
      if (product) {
        totalValue += inventory.quantity * parseFloat(product.costPrice);
        if (inventory.quantity <= (inventory.minStock || 0)) {
          lowStockCount++;
        }
      }
    }

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      activeOrders,
      productionTasks
    };
  }

  // Tech Cards
  async getTechCards(): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] })[]> {
    const result: (TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] })[] = [];
    const techCardValues = [...this.techCards.values()];
    
    for (const techCard of techCardValues) {
      const product = this.products.get(techCard.productId!);
      const steps = this.techCardSteps.get(techCard.id) || [];
      const materials = this.techCardMaterials.get(techCard.id) || [];
      const materialsWithProducts = materials.map(material => {
        const materialProduct = this.products.get(material.productId);
        return { ...material, product: materialProduct! };
      }).filter(m => m.product);
      
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

  async getTechCard(id: number): Promise<(TechCard & { product: Product; steps: TechCardStep[]; materials: (TechCardMaterial & { product: Product })[] }) | undefined> {
    const techCard = this.techCards.get(id);
    if (!techCard) return undefined;

    const product = this.products.get(techCard.productId!);
    if (!product) return undefined;

    const steps = this.techCardSteps.get(id) || [];
    const materials = this.techCardMaterials.get(id) || [];
    const materialsWithProducts = materials.map(material => {
      const materialProduct = this.products.get(material.productId);
      return { ...material, product: materialProduct! };
    }).filter(m => m.product);

    return { 
      ...techCard, 
      product, 
      steps, 
      materials: materialsWithProducts 
    };
  }

  async createTechCard(insertTechCard: InsertTechCard, steps: InsertTechCardStep[], materials: InsertTechCardMaterial[]): Promise<TechCard> {
    const id = this.currentTechCardId++;
    const techCard: TechCard = { 
      ...insertTechCard, 
      id,
      createdAt: new Date()
    };
    this.techCards.set(id, techCard);

    // Додати кроки
    const techCardSteps: TechCardStep[] = steps.map((step, index) => ({
      ...step,
      id: this.currentTechCardStepId++,
      techCardId: id,
      stepNumber: index + 1
    }));
    this.techCardSteps.set(id, techCardSteps);

    // Додати матеріали
    const techCardMaterials: TechCardMaterial[] = materials.map(material => ({
      ...material,
      id: this.currentTechCardMaterialId++,
      techCardId: id
    }));
    this.techCardMaterials.set(id, techCardMaterials);

    return techCard;
  }

  async updateTechCard(id: number, techCardData: Partial<InsertTechCard>, steps?: InsertTechCardStep[], materials?: InsertTechCardMaterial[]): Promise<TechCard | undefined> {
    const techCard = this.techCards.get(id);
    if (!techCard) return undefined;

    const updatedTechCard = { ...techCard, ...techCardData };
    this.techCards.set(id, updatedTechCard);

    // Оновити кроки, якщо надано
    if (steps) {
      const techCardSteps: TechCardStep[] = steps.map((step, index) => ({
        ...step,
        id: this.currentTechCardStepId++,
        techCardId: id,
        stepNumber: index + 1
      }));
      this.techCardSteps.set(id, techCardSteps);
    }

    // Оновити матеріали, якщо надано
    if (materials) {
      const techCardMaterials: TechCardMaterial[] = materials.map(material => ({
        ...material,
        id: this.currentTechCardMaterialId++,
        techCardId: id
      }));
      this.techCardMaterials.set(id, techCardMaterials);
    }

    return updatedTechCard;
  }

  // Product Components (BOM)
  async getProductComponents(productId: number): Promise<(ProductComponent & { component: Product })[]> {
    const components = this.productComponents.get(productId) || [];
    const result: (ProductComponent & { component: Product })[] = [];
    
    for (const component of components) {
      const componentProduct = this.products.get(component.componentProductId);
      if (componentProduct) {
        result.push({ ...component, component: componentProduct });
      }
    }
    
    return result;
  }

  async addProductComponent(insertComponent: InsertProductComponent): Promise<ProductComponent> {
    const id = this.currentProductComponentId++;
    const component: ProductComponent = {
      ...insertComponent,
      id,
      createdAt: new Date(),
      isOptional: insertComponent.isOptional ?? false,
      notes: insertComponent.notes ?? null
    };
    
    const existingComponents = this.productComponents.get(insertComponent.parentProductId) || [];
    existingComponents.push(component);
    this.productComponents.set(insertComponent.parentProductId, existingComponents);
    
    return component;
  }

  async removeProductComponent(id: number): Promise<boolean> {
    for (const [productId, components] of this.productComponents.entries()) {
      const index = components.findIndex(c => c.id === id);
      if (index !== -1) {
        components.splice(index, 1);
        if (components.length === 0) {
          this.productComponents.delete(productId);
        }
        return true;
      }
    }
    return false;
  }

  async updateProductComponent(id: number, componentData: Partial<InsertProductComponent>): Promise<ProductComponent | undefined> {
    for (const components of this.productComponents.values()) {
      const component = components.find(c => c.id === id);
      if (component) {
        Object.assign(component, componentData);
        return component;
      }
    }
    return undefined;
  }
}

import { dbStorage } from "./db-storage";

export const storage = dbStorage;
