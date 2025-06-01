import {
  users, categories, units, warehouses, products, inventory, orders, orderItems,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  components, productComponents, costCalculations, materialShortages, inventoryAudits, inventoryAuditItems, workers,
  packageTypes, solderingTypes, componentCategories, shipments, shipmentItems, carriers,
  customerAddresses, senderSettings, currencies, exchangeRateHistory,
  type User, type UpsertUser, type Category, type InsertCategory,
  type Unit, type InsertUnit,
  type Warehouse, type InsertWarehouse, type Product, type InsertProduct,
  type Inventory, type InsertInventory, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Recipe, type InsertRecipe,
  type RecipeIngredient, type InsertRecipeIngredient,
  type ProductionTask, type InsertProductionTask,
  type Supplier, type InsertSupplier,
  type TechCard, type InsertTechCard,
  type TechCardStep, type InsertTechCardStep,
  type Carrier, type InsertCarrier,
  type TechCardMaterial, type InsertTechCardMaterial,
  type Component, type InsertComponent,
  type ComponentCategory, type InsertComponentCategory,
  type ProductComponent, type InsertProductComponent,
  type CostCalculation, type InsertCostCalculation,
  type MaterialShortage, type InsertMaterialShortage,
  type SupplierOrder, type InsertSupplierOrder,
  type SupplierOrderItem, type InsertSupplierOrderItem,
  type InventoryAudit, type InsertInventoryAudit,
  type InventoryAuditItem, type InsertInventoryAuditItem,
  type Worker, type InsertWorker,
  type AssemblyOperation, type InsertAssemblyOperation,
  type AssemblyOperationItem, type InsertAssemblyOperationItem,
  type ProductionForecast, type InsertProductionForecast,
  type Position, type InsertPosition,
  type Department, type InsertDepartment,
  type PackageType, type InsertPackageType,
  type SolderingType, type InsertSolderingType,
  type ComponentAlternative, type InsertComponentAlternative,
  type Shipment, type InsertShipment,
  type CustomerAddress, type InsertCustomerAddress,
  type SenderSettings, type InsertSenderSettings,
  type Currency, type InsertCurrency, type ExchangeRateHistory,
  departments
} from "@shared/schema";

export interface IStorage {
  // Users (updated for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  updateWarehouse(id: number, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;

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
  updateOrder(id: number, order: InsertOrder, items: InsertOrderItem[]): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { product: Product })[] }) | undefined>;
  createRecipe(recipe: InsertRecipe, ingredients: InsertRecipeIngredient[]): Promise<Recipe>;

  // Production Tasks
  getProductionTasks(): Promise<(ProductionTask & { recipe: Recipe })[]>;
  createProductionTask(task: InsertProductionTask): Promise<ProductionTask>;
  updateProductionTask(id: number, task: Partial<InsertProductionTask>): Promise<ProductionTask | undefined>;

  // Ordered Products Info
  getOrderedProductsInfo(): Promise<any[]>;
  createProductionTaskFromOrder(productId: number, quantity: number, notes?: string): Promise<ProductionTask>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Components
  getComponents(): Promise<Component[]>;
  getComponent(id: number): Promise<Component | undefined>;
  createComponent(insertComponent: InsertComponent): Promise<Component>;
  updateComponent(id: number, componentData: Partial<InsertComponent>): Promise<Component | undefined>;
  deleteComponent(id: number): Promise<boolean>;

  // Package Types
  getPackageTypes(): Promise<PackageType[]>;
  getPackageType(id: number): Promise<PackageType | undefined>;
  createPackageType(packageType: InsertPackageType): Promise<PackageType>;
  updatePackageType(id: number, packageType: Partial<InsertPackageType>): Promise<PackageType | undefined>;
  deletePackageType(id: number): Promise<boolean>;

  // Soldering Types
  getSolderingTypes(): Promise<SolderingType[]>;
  getSolderingType(id: number): Promise<SolderingType | undefined>;
  createSolderingType(solderingType: InsertSolderingType): Promise<SolderingType>;
  updateSolderingType(id: number, solderingType: Partial<InsertSolderingType>): Promise<SolderingType | undefined>;
  deleteSolderingType(id: number): Promise<boolean>;

  // Component Categories
  getComponentCategories(): Promise<ComponentCategory[]>;
  getComponentCategory(id: number): Promise<ComponentCategory | undefined>;
  createComponentCategory(category: InsertComponentCategory): Promise<ComponentCategory>;
  updateComponentCategory(id: number, category: Partial<InsertComponentCategory>): Promise<ComponentCategory | undefined>;
  deleteComponentCategory(id: number): Promise<boolean>;

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

  // Cost Calculations
  getCostCalculations(): Promise<(CostCalculation & { product: Product })[]>;
  getCostCalculation(productId: number): Promise<(CostCalculation & { product: Product }) | undefined>;
  createCostCalculation(calculation: InsertCostCalculation): Promise<CostCalculation>;
  updateCostCalculation(id: number, calculation: Partial<InsertCostCalculation>): Promise<CostCalculation | undefined>;
  deleteCostCalculation(id: number): Promise<boolean>;
  calculateAutomaticCost(productId: number): Promise<CostCalculation>;

  // Material Shortages
  getMaterialShortages(): Promise<(MaterialShortage & { product: Product; warehouse?: Warehouse })[]>;
  getMaterialShortage(id: number): Promise<(MaterialShortage & { product: Product; warehouse?: Warehouse }) | undefined>;
  createMaterialShortage(shortage: InsertMaterialShortage): Promise<MaterialShortage>;
  updateMaterialShortage(id: number, shortage: Partial<InsertMaterialShortage>): Promise<MaterialShortage | undefined>;
  deleteMaterialShortage(id: number): Promise<boolean>;
  calculateMaterialShortages(): Promise<MaterialShortage[]>;
  createSupplierOrderFromShortage(shortageId: number): Promise<{ order: SupplierOrder; item: SupplierOrderItem } | undefined>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Supplier Orders
  getSupplierOrders(): Promise<(SupplierOrder & { supplier: Supplier; items: (SupplierOrderItem & { product: Product })[] })[]>;
  getSupplierOrder(id: number): Promise<(SupplierOrder & { supplier: Supplier; items: (SupplierOrderItem & { product: Product })[] }) | undefined>;
  updateSupplierOrderStatus(id: number, status: string): Promise<SupplierOrder | undefined>;

  // Assembly Operations
  getAssemblyOperations(): Promise<(AssemblyOperation & { product: Product; warehouse: Warehouse; items: (AssemblyOperationItem & { component: Product })[] })[]>;
  getAssemblyOperation(id: number): Promise<(AssemblyOperation & { product: Product; warehouse: Warehouse; items: (AssemblyOperationItem & { component: Product })[] }) | undefined>;
  createAssemblyOperation(operation: InsertAssemblyOperation, items: InsertAssemblyOperationItem[]): Promise<AssemblyOperation>;
  updateAssemblyOperation(id: number, operation: Partial<InsertAssemblyOperation>): Promise<AssemblyOperation | undefined>;
  deleteAssemblyOperation(id: number): Promise<boolean>;
  executeAssemblyOperation(id: number): Promise<AssemblyOperation | undefined>;

  // Inventory Audits
  getInventoryAudits(): Promise<(InventoryAudit & { warehouse?: Warehouse })[]>;
  getInventoryAudit(id: number): Promise<(InventoryAudit & { warehouse?: Warehouse }) | undefined>;
  createInventoryAudit(audit: InsertInventoryAudit): Promise<InventoryAudit>;
  updateInventoryAudit(id: number, audit: Partial<InsertInventoryAudit>): Promise<InventoryAudit | undefined>;
  deleteInventoryAudit(id: number): Promise<boolean>;
  
  getInventoryAuditItems(auditId: number): Promise<(InventoryAuditItem & { product: Product })[]>;
  createInventoryAuditItem(item: InsertInventoryAuditItem): Promise<InventoryAuditItem>;
  updateInventoryAuditItem(id: number, item: Partial<InsertInventoryAuditItem>): Promise<InventoryAuditItem | undefined>;
  deleteInventoryAuditItem(id: number): Promise<boolean>;
  generateInventoryAuditItems(auditId: number): Promise<InventoryAuditItem[]>;

  // Workers
  getWorkers(): Promise<Worker[]>;
  getWorker(id: number): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: number, worker: Partial<InsertWorker>): Promise<Worker | undefined>;
  deleteWorker(id: number): Promise<boolean>;

  // Production Forecasts
  getProductionForecasts(): Promise<ProductionForecast[]>;
  getProductionForecast(id: number): Promise<ProductionForecast | undefined>;
  createProductionForecast(forecast: InsertProductionForecast): Promise<ProductionForecast>;
  updateProductionForecast(id: number, forecast: Partial<InsertProductionForecast>): Promise<ProductionForecast | undefined>;
  deleteProductionForecast(id: number): Promise<boolean>;

  // Positions
  getPositions(): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;

  // Component Alternatives
  getComponentAlternatives(componentId: number): Promise<(ComponentAlternative & { alternativeComponent: Component })[]>;
  createComponentAlternative(alternative: InsertComponentAlternative): Promise<ComponentAlternative>;
  deleteComponentAlternative(id: number): Promise<boolean>;
  updateComponentAlternative(id: number, alternative: Partial<InsertComponentAlternative>): Promise<ComponentAlternative | undefined>;

  // Analytics
  getDashboardStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockCount: number;
    activeOrders: number;
    productionTasks: number;
    materialShortages: number;
    criticalShortages: number;
  }>;

  // Production statistics
  getProductionStatsByCategory(period?: string, startDate?: string, endDate?: string): Promise<Array<{
    categoryId: number;
    categoryName: string;
    totalProduced: number;
    totalValue: number;
    productsCount: number;
    averageQuality: string;
  }>>;

  // Order statistics by period
  getOrderStatsByPeriod(period: string, startDate?: string, endDate?: string): Promise<Array<{
    date: string;
    ordered: number;
    paid: number;
    produced: number;
    shipped: number;
    orderedValue: number;
    paidValue: number;
    producedValue: number;
    shippedValue: number;
  }>>;

  // Shipments
  getShipments(): Promise<any[]>;
  getShipment(id: number): Promise<any>;
  createShipment(shipment: any): Promise<any>;
  updateShipment(id: number, shipment: any): Promise<any>;
  updateShipmentStatus(id: number, status: string): Promise<any>;
  deleteShipment(id: number): Promise<boolean>;

  // Carriers
  getCarriers(): Promise<Carrier[]>;
  getCarrier(id: number): Promise<Carrier | null>;
  createCarrier(data: InsertCarrier): Promise<Carrier>;
  updateCarrier(id: number, data: Partial<InsertCarrier>): Promise<Carrier | null>;
  deleteCarrier(id: number): Promise<boolean>;

  // Customer Addresses
  getCustomerAddresses(): Promise<CustomerAddress[]>;
  getCustomerAddress(id: number): Promise<CustomerAddress | null>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: number, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress | null>;
  deleteCustomerAddress(id: number): Promise<boolean>;
  setDefaultCustomerAddress(id: number): Promise<boolean>;

  // Sender Settings
  getSenderSettings(): Promise<SenderSettings[]>;
  getSenderSetting(id: number): Promise<SenderSettings | null>;
  createSenderSetting(setting: InsertSenderSettings): Promise<SenderSettings>;
  updateSenderSetting(id: number, setting: Partial<InsertSenderSettings>): Promise<SenderSettings | null>;
  deleteSenderSetting(id: number): Promise<boolean>;
  setDefaultSenderSetting(id: number): Promise<boolean>;
  getDefaultSenderSetting(): Promise<SenderSettings | null>;

  // Currencies
  getCurrencies(): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | null>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(id: number, currency: Partial<InsertCurrency>): Promise<Currency | null>;
  deleteCurrency(id: number): Promise<boolean>;
  setBaseCurrency(id: number): Promise<Currency | null>;
  getLatestExchangeRates(): Promise<ExchangeRateHistory[]>;
  updateExchangeRates(): Promise<ExchangeRateHistory[]>;

  // Order Completion and Supplier Order Creation
  completeOrderFromStock(productId: number, quantity: string, warehouseId: number): Promise<{ success: boolean; message: string }>;
  createSupplierOrderForShortage(productId: number, quantity: string, notes?: string): Promise<{ success: boolean; message: string; orderId?: number }>;
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
  private components: Map<number, Component> = new Map();
  private productComponents: Map<number, ProductComponent[]> = new Map();
  private shipments: Map<number, any> = new Map();

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
  private currentComponentId = 1;
  private currentProductComponentId = 1;
  private currentShipmentId = 1;
  private carriers: Map<number, Carrier> = new Map();
  private nextCarrierId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample data for demonstration
    const defaultCategory: Category = { id: 1, name: "Електроніка", description: "Електронні компоненти" };
    this.categories.set(1, defaultCategory);
    this.currentCategoryId = 2;

    // Initialize default units
    const defaultUnits: Unit[] = [
      { id: 1, name: "Штуки", shortName: "шт", type: "count", baseUnit: null, conversionFactor: "1", description: "Штучні одиниці", createdAt: new Date() },
      { id: 2, name: "Кілограми", shortName: "кг", type: "weight", baseUnit: null, conversionFactor: "1", description: "Одиниці ваги", createdAt: new Date() },
      { id: 3, name: "Літри", shortName: "л", type: "volume", baseUnit: null, conversionFactor: "1", description: "Одиниці об'єму", createdAt: new Date() },
      { id: 4, name: "Метри", shortName: "м", type: "length", baseUnit: null, conversionFactor: "1", description: "Одиниці довжини", createdAt: new Date() },
      { id: 5, name: "Квадратні метри", shortName: "м²", type: "area", baseUnit: null, conversionFactor: "1", description: "Одиниці площі", createdAt: new Date() }
    ];
    
    defaultUnits.forEach(unit => this.units.set(unit.id, unit));
    this.currentUnitId = 6;

    const defaultWarehouse: Warehouse = { id: 1, name: "Головний склад", location: "Київ", description: "Основний склад" };
    this.warehouses.set(1, defaultWarehouse);
    this.currentWarehouseId = 2;

    // Initialize default carriers
    const defaultCarriers: Carrier[] = [
      {
        id: 1,
        name: "Нова Пошта",
        contactPerson: "Менеджер з корпоративних клієнтів",
        email: "corporate@novaposhta.ua",
        phone: "+380 800 500 609",
        address: "Київ, вул. Космічна, 6",
        description: "Провідна служба доставки України",
        serviceType: "express",
        rating: 4.8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "УкрПошта",
        contactPerson: "Відділ корпоративного обслуговування",
        email: "corporate@ukrposhta.ua",
        phone: "+380 800 301 545",
        address: "Київ, Майдан Незалежності, 22",
        description: "Національний оператор поштового зв'язку",
        serviceType: "standard",
        rating: 4.2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: "Meest Express",
        contactPerson: "Корпоративні продажі",
        email: "corporate@meest.com",
        phone: "+380 800 502 206",
        address: "Львів, вул. Під Дубом, 7л",
        description: "Міжнародна служба експрес-доставки",
        serviceType: "international",
        rating: 4.5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    defaultCarriers.forEach(carrier => this.carriers.set(carrier.id, carrier));
    this.nextCarrierId = 4;
  }

  // Users (updated for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.id === id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = Array.from(this.users.values()).find(user => user.id === userData.id);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id!, updatedUser);
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      this.users.set(userData.id!, newUser);
      return newUser;
    }
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

  // Units
  async getUnits(): Promise<Unit[]> {
    return Array.from(this.units.values());
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.currentUnitId++;
    const unit: Unit = { 
      ...insertUnit, 
      id,
      createdAt: new Date()
    };
    this.units.set(id, unit);
    return unit;
  }

  async updateUnit(id: number, unitData: Partial<InsertUnit>): Promise<Unit | undefined> {
    const existingUnit = this.units.get(id);
    if (!existingUnit) {
      return undefined;
    }
    const updatedUnit = { ...existingUnit, ...unitData };
    this.units.set(id, updatedUnit);
    return updatedUnit;
  }

  async deleteUnit(id: number): Promise<boolean> {
    return this.units.delete(id);
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

  async updateWarehouse(id: number, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const existingWarehouse = this.warehouses.get(id);
    if (!existingWarehouse) {
      return undefined;
    }
    const updatedWarehouse = { ...existingWarehouse, ...warehouseData };
    this.warehouses.set(id, updatedWarehouse);
    return updatedWarehouse;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    return this.warehouses.delete(id);
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

  async deleteOrder(id: number): Promise<boolean> {
    const order = this.orders.get(id);
    if (!order) return false;

    this.orders.delete(id);
    this.orderItems.delete(id);
    return true;
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

  // Components
  async getComponents(): Promise<Component[]> {
    return [...this.components.values()];
  }

  async getComponent(id: number): Promise<Component | undefined> {
    return this.components.get(id);
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const id = this.currentComponentId++;
    const component: Component = {
      ...insertComponent,
      id,
      createdAt: new Date()
    };
    this.components.set(id, component);
    return component;
  }

  async updateComponent(id: number, componentData: Partial<InsertComponent>): Promise<Component | undefined> {
    const component = this.components.get(id);
    if (!component) return undefined;

    const updatedComponent = { ...component, ...componentData };
    this.components.set(id, updatedComponent);
    return updatedComponent;
  }

  async deleteComponent(id: number): Promise<boolean> {
    return this.components.delete(id);
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

  // Shipments methods
  async getShipments(): Promise<any[]> {
    const shipmentsArray = Array.from(this.shipments.values());
    return shipmentsArray.map(shipment => {
      const order = this.orders.get(shipment.orderId);
      return {
        ...shipment,
        order
      };
    });
  }

  async getShipment(id: number): Promise<any> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    const order = this.orders.get(shipment.orderId);
    return {
      ...shipment,
      order
    };
  }

  async createShipment(shipmentData: any): Promise<any> {
    const id = this.currentShipmentId++;
    const shipment = {
      ...shipmentData,
      id,
      shipmentNumber: `SH-${String(id).padStart(6, '0')}`,
      status: 'preparing',
      createdAt: new Date(),
      shippedAt: null,
      actualDelivery: null
    };
    
    this.shipments.set(id, shipment);
    return shipment;
  }

  async updateShipment(id: number, shipmentData: any): Promise<any> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    Object.assign(shipment, shipmentData);
    this.shipments.set(id, shipment);
    return shipment;
  }

  async updateShipmentStatus(id: number, status: string): Promise<any> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    shipment.status = status;
    if (status === 'shipped' && !shipment.shippedAt) {
      shipment.shippedAt = new Date();
    }
    if (status === 'delivered' && !shipment.actualDelivery) {
      shipment.actualDelivery = new Date();
    }
    
    this.shipments.set(id, shipment);
    return shipment;
  }

  async deleteShipment(id: number): Promise<boolean> {
    return this.shipments.delete(id);
  }

  // Carriers methods
  async getCarriers(): Promise<Carrier[]> {
    return Array.from(this.carriers.values());
  }

  async getCarrier(id: number): Promise<Carrier | null> {
    return this.carriers.get(id) || null;
  }

  async createCarrier(data: InsertCarrier): Promise<Carrier> {
    const carrier: Carrier = {
      id: this.nextCarrierId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.carriers.set(carrier.id, carrier);
    return carrier;
  }

  async updateCarrier(id: number, data: Partial<InsertCarrier>): Promise<Carrier | null> {
    const carrier = this.carriers.get(id);
    if (!carrier) return null;
    
    const updatedCarrier = {
      ...carrier,
      ...data,
      updatedAt: new Date(),
    };
    this.carriers.set(id, updatedCarrier);
    return updatedCarrier;
  }

  async deleteCarrier(id: number): Promise<boolean> {
    return this.carriers.delete(id);
  }
}

// Тимчасово використовуємо MemStorage для тестування
export const storage = new MemStorage();
