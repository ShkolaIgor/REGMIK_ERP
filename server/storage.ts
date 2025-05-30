import {
  users, categories, warehouses, products, inventory, orders, orderItems,
  recipes, recipeIngredients, productionTasks, suppliers,
  type User, type InsertUser, type Category, type InsertCategory,
  type Warehouse, type InsertWarehouse, type Product, type InsertProduct,
  type Inventory, type InsertInventory, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient,
  type ProductionTask, type InsertProductionTask,
  type Supplier, type InsertSupplier
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

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
  private warehouses: Map<number, Warehouse> = new Map();
  private products: Map<number, Product> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem[]> = new Map();
  private recipes: Map<number, Recipe> = new Map();
  private recipeIngredients: Map<number, RecipeIngredient[]> = new Map();
  private productionTasks: Map<number, ProductionTask> = new Map();
  private suppliers: Map<number, Supplier> = new Map();

  private currentUserId = 1;
  private currentCategoryId = 1;
  private currentWarehouseId = 1;
  private currentProductId = 1;
  private currentInventoryId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentRecipeId = 1;
  private currentRecipeIngredientId = 1;
  private currentProductionTaskId = 1;
  private currentSupplierId = 1;

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
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }

  async createWarehouse(insertWarehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.currentWarehouseId++;
    const warehouse: Warehouse = { ...insertWarehouse, id };
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
    
    for (const inventory of this.inventory.values()) {
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
    
    for (const inventory of this.inventory.values()) {
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
    
    for (const task of this.productionTasks.values()) {
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
    const supplier: Supplier = { ...insertSupplier, id };
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
    
    for (const inventory of this.inventory.values()) {
      const product = this.products.get(inventory.productId);
      if (product) {
        totalValue += inventory.quantity * parseFloat(product.costPrice);
        if (inventory.quantity <= inventory.minStock) {
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
}

export const storage = new MemStorage();
