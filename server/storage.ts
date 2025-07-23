import {
  users, localUsers, roles, systemModules, userLoginHistory, categories, units, warehouses, products, inventory, orders, orderItems,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  components, productComponents, costCalculations, materialShortages, inventoryAudits, inventoryAuditItems, workers,
  packageTypes, solderingTypes, componentCategories, shipments, shipmentItems, carriers,
  customerAddresses, senderSettings, currencies, exchangeRateHistory, serialNumbers, emailSettings,
  bankPaymentNotifications, orderPayments,
  clients, clientContacts, clientMail, mailRegistry, envelopePrintSettings,
  integrationConfigs, syncLogs, entityMappings, syncQueue, fieldMappings, userSortPreferences,
  type User, type UpsertUser, type LocalUser, type InsertLocalUser, type Role, type InsertRole,
  type SystemModule, type InsertSystemModule, type UserLoginHistory, type InsertUserLoginHistory,
  type EmailSettings, type InsertEmailSettings,
  type BankPaymentNotification, type InsertBankPaymentNotification,
  type OrderPayment, type InsertOrderPayment,
  type UserSortPreference, type InsertUserSortPreference,
  type Category, type InsertCategory,
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
  type SerialNumber, type InsertSerialNumber,
  type Client, type InsertClient,
  type ClientContact, type InsertClientContact,
  type ClientNovaPoshtaSettings, type InsertClientNovaPoshtaSettings,
  type ClientNovaPoshtaApiSettings, type InsertClientNovaPoshtaApiSettings,

  type ClientMail, type InsertClientMail,
  type MailRegistry, type InsertMailRegistry,
  type EnvelopePrintSettings, type InsertEnvelopePrintSettings,
  type IntegrationConfig, type InsertIntegrationConfig,
  type SyncLog, type InsertSyncLog,
  type EntityMapping, type InsertEntityMapping,
  type SyncQueue, type InsertSyncQueue,
  type FieldMapping, type InsertFieldMapping,
  type SystemLog, type InsertSystemLog,
  departments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users (updated for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Local Users
  getLocalUsers(): Promise<LocalUser[]>;
  getLocalUser(id: number): Promise<LocalUser | undefined>;
  getLocalUserByUsername(username: string): Promise<LocalUser | undefined>;
  getUserByEmail(email: string): Promise<LocalUser | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  createLocalUser(user: InsertLocalUser): Promise<LocalUser>;
  updateLocalUser(id: number, user: Partial<InsertLocalUser>): Promise<LocalUser | undefined>;
  updateLocalUserPermissions(id: number, permissions: Record<string, boolean>): Promise<LocalUser | undefined>;
  deleteLocalUser(id: number): Promise<boolean>;
  toggleUserStatus(id: number, isActive: boolean): Promise<LocalUser | undefined>;
  changeUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  
  // Password reset functionality
  savePasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<LocalUser | null>;
  confirmPasswordReset(userId: number, hashedPassword: string): Promise<boolean>;

  // Roles
  getRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;

  // System Modules
  getSystemModules(): Promise<SystemModule[]>;
  createSystemModule(module: InsertSystemModule): Promise<SystemModule>;
  updateSystemModule(id: number, module: Partial<InsertSystemModule>): Promise<SystemModule | undefined>;
  deleteSystemModule(id: number): Promise<boolean>;

  // User Login History
  logUserLogin(login: InsertUserLoginHistory): Promise<UserLoginHistory>;

  // User Sort Preferences
  getUserSortPreferences(userId: string, tableName: string): Promise<UserSortPreference | null>;
  saveUserSortPreferences(preference: InsertUserSortPreference): Promise<UserSortPreference>;

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
  
  // Product Import
  importProductsFromXml(xmlBuffer: Buffer): Promise<{ jobId: string }>;
  getProductImportJobStatus(jobId: string): Promise<any>;

  // Inventory
  getInventory(): Promise<(Inventory & { product: Product; warehouse: Warehouse })[]>;
  getInventoryByWarehouse(warehouseId: number): Promise<(Inventory & { product: Product })[]>;
  getInventoryByProductAndWarehouse(productId: number, warehouseId: number): Promise<Inventory | undefined>;
  updateInventory(productId: number, warehouseId: number, quantity: number): Promise<Inventory | undefined>;

  // Orders
  getOrders(): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  getOrderByInvoiceNumber(invoiceNumber: string): Promise<Order | undefined>;
  findOrdersByPaymentInfo(paymentInfo: {
    invoiceNumber?: string;
    partialInvoiceNumber?: string;
    invoiceDate?: Date;
    correspondent?: string;
    amount?: number;
  }): Promise<Order[]>;
  getOrderProducts(orderId: number): Promise<any[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrder(id: number, order: InsertOrder, items: InsertOrderItem[]): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderStatusId(id: number, statusId: number): Promise<Order | undefined>;
  updateOrderPaymentDate(id: number, paymentDate: string | null): Promise<Order | undefined>;
  updateOrderDueDate(id: number, dueDate: string | null): Promise<Order | undefined>;
  updateOrderTrackingNumber(id: number, trackingNumber: string): Promise<boolean>;
  deleteOrder(id: number): Promise<boolean>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { product: Product })[] }) | undefined>;
  createRecipe(recipe: InsertRecipe, ingredients: InsertRecipeIngredient[]): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>, ingredients?: InsertRecipeIngredient[]): Promise<Recipe | undefined>;

  // Production Tasks
  getProductionTasks(): Promise<(ProductionTask & { recipe: Recipe })[]>;
  createProductionTask(task: InsertProductionTask): Promise<ProductionTask>;
  updateProductionTask(id: number, task: Partial<InsertProductionTask>): Promise<ProductionTask | undefined>;

  // Ordered Products Info
  getOrderedProductsInfo(): Promise<any[]>;
  createProductionTaskFromOrder(productId: number, quantity: number, notes?: string): Promise<ProductionTask>;
  
  // Ordered Products (paid but not shipped)
  getOrderedProducts(): Promise<any[]>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSuppliersPaginated(page: number, limit: number, search: string): Promise<{
    suppliers: Supplier[];
    total: number;
    totalPages: number;
  }>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Client Types
  getClientTypes(): Promise<any[]>;

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
  deleteTechCard(id: number): Promise<boolean>;

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
  }>;

  // Product profitability analytics
  getProductProfitability(period: string): Promise<Array<{
    productId: number;
    productName: string;
    productSku: string;
    unitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  }>>;

  getTopProfitableProducts(period: string, limit: number): Promise<Array<{
    productId: number;
    productName: string;
    productSku: string;
    unitsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMargin: number;
  }>>;

  getProductProfitabilityTrends(productId: number): Promise<Array<{
    monthName: string;
    profit: number;
    revenue: number;
    cost: number;
    profitMargin: number;
    unitsSold: number;
  }>>;

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
  getShipmentDetails(id: number): Promise<any>;
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
  findCustomerAddressByDetails(customerName: string, cityName: string, warehouseAddress: string): Promise<CustomerAddress | null>;
  updateCustomerAddressUsage(id: number): Promise<CustomerAddress>;

  // Sender Settings
  getSenderSettings(): Promise<SenderSettings[]>;
  getSenderSetting(id: number): Promise<SenderSettings | null>;
  createSenderSetting(setting: InsertSenderSettings): Promise<SenderSettings>;
  updateSenderSetting(id: number, setting: Partial<InsertSenderSettings>): Promise<SenderSettings | null>;
  deleteSenderSetting(id: number): Promise<boolean>;
  setDefaultSenderSetting(id: number): Promise<boolean>;
  getDefaultSenderSetting(): Promise<SenderSettings | null>;

  // Clients
  getClients(): Promise<Client[]>;
  getClientsPaginated(page: number, limit: number, search?: string): Promise<{
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  findOrCreateClient(data: {
    name?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    clientTypeId?: number;
    source?: string;
  }): Promise<Client>;
  getClientByExternalId(externalId: string): Promise<Client | undefined>;
  getClientByTaxCode(taxCode: string): Promise<Client | undefined>;

  // Client Contacts
  getClientContacts(): Promise<ClientContact[]>;
  getClientContactsPaginated?(page: number, limit: number, search?: string, clientId?: number): Promise<{
    contacts: ClientContact[];
    total: number;
    totalPages: number;
    currentPage: number;
  }>;
  getClientContactsByClientId?(clientId: number): Promise<ClientContact[]>;
  getClientContact(id: number): Promise<ClientContact | undefined>;
  createClientContact(contact: InsertClientContact): Promise<ClientContact>;
  upsertClientContact?(contact: InsertClientContact): Promise<ClientContact>;
  updateClientContact(id: number, contact: Partial<InsertClientContact>): Promise<ClientContact | undefined>;
  deleteClientContact(id: number): Promise<boolean>;

  // Client Mails
  getClientMails(): Promise<ClientMail[]>;
  createClientMail(mail: InsertClientMail): Promise<ClientMail>;

  // Mail Registry
  getMailRegistry(): Promise<MailRegistry[]>;
  createMailRegistry(registry: InsertMailRegistry): Promise<MailRegistry>;
  updateMailsForBatch(batchId: string, mailIds: number[]): Promise<void>;

  // Envelope Print Settings
  getEnvelopePrintSettings(): Promise<EnvelopePrintSettings[]>;
  createEnvelopePrintSettings(settings: InsertEnvelopePrintSettings): Promise<EnvelopePrintSettings>;



  // Companies and multi-company functionality
  getCompanies(): Promise<any[]>;
  getCompany(id: number): Promise<any>;
  getDefaultCompany(): Promise<any>;
  createCompany(company: any): Promise<any>;
  updateCompany(id: number, company: any): Promise<any>;
  deleteCompany(id: number): Promise<boolean>;
  getProductsByCompany(companyId: number): Promise<any[]>;
  getOrdersByCompany(companyId: number): Promise<any[]>;



  // Currencies
  getCurrencies(): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | null>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(id: number, currency: Partial<InsertCurrency>): Promise<Currency | null>;
  deleteCurrency(id: number): Promise<boolean>;
  setBaseCurrency(id: number): Promise<Currency | null>;
  getLatestExchangeRates(): Promise<ExchangeRateHistory[]>;
  updateExchangeRates(): Promise<ExchangeRateHistory[]>;
  getAllCurrencyRates(): Promise<any[]>;

  // Order Completion and Supplier Order Creation
  completeOrderFromStock(productId: number, quantity: string, warehouseId: number): Promise<{ success: boolean; message: string }>;
  createSupplierOrderForShortage(productId: number, quantity: string, notes?: string): Promise<{ success: boolean; message: string; orderId?: number }>;

  // Serial Numbers
  getSerialNumbers(productId?: number, warehouseId?: number): Promise<SerialNumber[]>;
  getSerialNumber(id: number): Promise<SerialNumber | null>;
  createSerialNumber(serialNumber: InsertSerialNumber): Promise<SerialNumber>;
  updateSerialNumber(id: number, serialNumber: Partial<InsertSerialNumber>): Promise<SerialNumber | null>;
  deleteSerialNumber(id: number): Promise<boolean>;
  getAvailableSerialNumbers(productId: number): Promise<SerialNumber[]>;
  reserveSerialNumber(id: number, orderId: number): Promise<boolean>;
  releaseSerialNumber(id: number): Promise<boolean>;
  markSerialNumberAsSold(id: number): Promise<boolean>;
  checkSerialNumberDuplicates(serialNumbers: string[]): Promise<string[]>;

  // Production Planning
  getProductionPlans(): Promise<any[]>;
  createProductionPlan(plan: any): Promise<any>;
  
  // Supply Decisions
  getSupplyDecisions(): Promise<any[]>;
  analyzeSupplyDecision(productId: number, requiredQuantity: number): Promise<any>;

  // Product Matching for 1C Orders
  linkOrderItemsToProducts(): Promise<{ success: number; skipped: number; errors: number }>;

  // Client Nova Poshta Settings
  getClientNovaPoshtaSettings(clientId: number): Promise<ClientNovaPoshtaSettings[]>;
  getClientNovaPoshtaSetting(id: number): Promise<ClientNovaPoshtaSettings | undefined>;
  createClientNovaPoshtaSettings(settings: InsertClientNovaPoshtaSettings): Promise<ClientNovaPoshtaSettings>;
  updateClientNovaPoshtaSettings(id: number, settings: Partial<InsertClientNovaPoshtaSettings>): Promise<ClientNovaPoshtaSettings | undefined>;
  deleteClientNovaPoshtaSettings(id: number): Promise<boolean>;
  setPrimaryClientNovaPoshtaSettings(clientId: number, settingsId: number): Promise<boolean>;

  // Client Nova Poshta API Settings
  getClientNovaPoshtaApiSettings(clientId: number): Promise<ClientNovaPoshtaApiSettings[]>;
  getClientNovaPoshtaApiSetting(id: number): Promise<ClientNovaPoshtaApiSettings | undefined>;
  createClientNovaPoshtaApiSettings(settings: InsertClientNovaPoshtaApiSettings): Promise<ClientNovaPoshtaApiSettings>;
  updateClientNovaPoshtaApiSettings(id: number, settings: Partial<InsertClientNovaPoshtaApiSettings>): Promise<ClientNovaPoshtaApiSettings | undefined>;
  deleteClientNovaPoshtaApiSettings(id: number): Promise<boolean>;
  setPrimaryClientNovaPoshtaApiSettings(clientId: number, settingsId: number): Promise<boolean>;

  // Email Settings
  getEmailSettings(): Promise<EmailSettings | null>;
  updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;

  // Bank Payment Notifications
  createBankPaymentNotification(notification: InsertBankPaymentNotification): Promise<BankPaymentNotification>;
  getBankPaymentNotifications(filters?: {
    processed?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<BankPaymentNotification[]>;
  updateBankPaymentNotification(id: number, updates: Partial<BankPaymentNotification>): Promise<BankPaymentNotification | undefined>;
  markBankNotificationAsProcessed(notificationId: number, processed?: boolean, processingError?: string): Promise<boolean>;
  getBankNotificationByMessageId(messageId: string): Promise<BankPaymentNotification | undefined>;

  // Order Payments
  createOrderPayment(payment: InsertOrderPayment): Promise<OrderPayment>;
  getOrderPayments(orderId?: number): Promise<OrderPayment[]>;
  updateOrderPaymentStatus(orderId: number, paymentAmount: number, paymentType?: string, bankNotificationId?: number, bankAccount?: string, correspondent?: string): Promise<{ order: Order; payment: OrderPayment }>;

  // Analytics
  getSalesAnalytics(period: string): Promise<any[]>;
  getExpensesAnalytics(period: string): Promise<any[]>;
  getProfitAnalytics(period: string): Promise<any[]>;

  // Time tracking
  getTimeEntries(): Promise<any[]>;
  createTimeEntry(timeEntry: any): Promise<any>;
  updateTimeEntry(id: number, timeEntry: any): Promise<any>;

  // Inventory alerts
  getInventoryAlerts(): Promise<any[]>;
  checkAndCreateInventoryAlerts(): Promise<void>;

  // Integration Management
  getIntegrationConfigs(): Promise<IntegrationConfig[]>;
  getIntegrationConfig(id: number): Promise<IntegrationConfig | undefined>;
  createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig>;
  updateIntegrationConfig(id: number, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined>;
  deleteIntegrationConfig(id: number): Promise<boolean>;
  
  // Sync Logs
  getSyncLogs(integrationId?: number): Promise<SyncLog[]>;
  createSyncLog(log: InsertSyncLog): Promise<number>;
  updateSyncLog(id: number, log: Partial<InsertSyncLog>): Promise<boolean>;
  
  // Entity Mappings
  getEntityMappings(integrationId: number, entityType?: string): Promise<EntityMapping[]>;
  getEntityMapping(integrationId: number, entityType: string, externalId: string): Promise<EntityMapping | undefined>;
  getEntityMappingByLocalId(integrationId: number, entityType: string, localId: string): Promise<EntityMapping | undefined>;
  createEntityMapping(mapping: InsertEntityMapping): Promise<EntityMapping>;
  updateEntityMapping(id: number, mapping: Partial<InsertEntityMapping>): Promise<EntityMapping | undefined>;
  deleteEntityMapping(id: number): Promise<boolean>;
  
  // Sync Queue
  getSyncQueueItems(integrationId?: number): Promise<SyncQueue[]>;
  getPendingSyncQueueItems(): Promise<SyncQueue[]>;
  createSyncQueueItem(item: InsertSyncQueue): Promise<SyncQueue>;
  updateSyncQueueItem(id: number, item: Partial<InsertSyncQueue>): Promise<boolean>;
  deleteSyncQueueItem(id: number): Promise<boolean>;
  
  // Field Mappings
  getFieldMappings(integrationId: number, entityType?: string): Promise<FieldMapping[]>;
  createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping>;
  updateFieldMapping(id: number, mapping: Partial<InsertFieldMapping>): Promise<FieldMapping | undefined>;
  deleteFieldMapping(id: number): Promise<boolean>;

  // 1C Integration - Component Import
  import1CInvoice(invoiceId: string): Promise<{ success: boolean; message: string; componentIds?: number[]; }>;
  import1CInvoiceFromData(invoiceData: any): Promise<{ success: boolean; message: string; componentIds?: number[]; }>;
  get1CInvoices(): Promise<any[]>;
  
  // 1C Integration - Order Import  
  import1COutgoingInvoice(invoiceId: string): Promise<{ success: boolean; message: string; orderId?: number; }>;
  get1COutgoingInvoices(): Promise<any[]>;
  
  // Універсальні методи для створення клієнтів та постачальників
  findOrCreateClient(data: {
    name?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    clientTypeId?: number;
    source?: string;
  }): Promise<any>;
  
  findOrCreateSupplier(data: {
    name?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    clientTypeId?: number;
    source?: string;
  }): Promise<any>;
  
  // System Logging
  createSystemLog(logData: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(params?: {
    page?: number;
    limit?: number;
    level?: string;
    category?: string;
    module?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: SystemLog[]; total: number }>;
  deleteOldLogs(olderThanDays?: number): Promise<number>;
  getLogStats(): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    recentErrors: SystemLog[];
  }>;

  // User Action Logging
  logUserAction(actionData: {
    userId: number;
    action: string;
    targetType: string;
    targetId: number;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any>;

  // Product Name Mapping - жорстке зіставлення для рахунків
  findProductByExactName(externalProductName: string): Promise<{ erpProductId: number; erpProductName: string } | null>;
  
  // Component Item Mapping - перевірка зіставлення позицій накладних
  checkItemMapping(itemName: string): Promise<{ isMapped: boolean; mappedComponentId?: number; mappedComponentName?: string }>;
  
  // Client Sync Methods
  createClientSyncHistory(syncData: any): Promise<any>;
  updateClientSyncHistory(id: number, syncData: any): Promise<any>;
  getClientSyncHistories(params?: any): Promise<{ histories: any[]; total: number }>;
  create1CClient(clientData: any): Promise<any>;
  update1CClient(external1cId: string, clientData: any): Promise<any>;
  delete1CClient(external1cId: string): Promise<any>;

  // Payments Methods
  getAllPayments(): Promise<any[]>;
  getPaymentStats(): Promise<any>;
  getPayment(id: number): Promise<any>;
  createPayment(paymentData: any): Promise<any>;
  updatePayment(id: number, updateData: any): Promise<any>;
  deletePayment(id: number): Promise<boolean>;
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
  private serialNumbers: Map<number, SerialNumber> = new Map();
  private integrationConfigs: Map<number, IntegrationConfig> = new Map();
  private syncLogs: Map<number, SyncLog> = new Map();
  private entityMappings: Map<number, EntityMapping> = new Map();
  private syncQueue: Map<number, SyncQueue> = new Map();
  private fieldMappings: Map<number, FieldMapping> = new Map();
  private emailSettings: Map<number, EmailSettings> = new Map();
  private clientNovaPoshtaApiSettings: Map<number, ClientNovaPoshtaApiSettings> = new Map();

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
  private currentSerialNumberId = 1;
  private currentIntegrationConfigId = 1;
  private currentSyncLogId = 1;
  private currentEntityMappingId = 1;
  private currentSyncQueueId = 1;
  private currentFieldMappingId = 1;
  private carriers: Map<number, Carrier> = new Map();
  private nextCarrierId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Production режим - дані завантажуються з API та бази даних
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

  async getOrderProducts(orderId: number): Promise<any[]> {
    const orderItemsList = this.orderItems.get(orderId) || [];
    const result: any[] = [];

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

  async updateOrderStatusId(id: number, statusId: number): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, statusId };
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

  async getSuppliersPaginated(page: number, limit: number, search: string): Promise<{
    suppliers: Supplier[];
    total: number;
    totalPages: number;
  }> {
    let allSuppliers = Array.from(this.suppliers.values());
    
    // Застосовуємо пошук якщо є
    if (search) {
      const searchLower = search.toLowerCase();
      allSuppliers = allSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.fullName?.toLowerCase().includes(searchLower) ||
        supplier.taxCode?.toLowerCase().includes(searchLower) ||
        supplier.contactPerson?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    // Сортуємо за датою створення (найновіші спочатку)
    allSuppliers.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    const total = allSuppliers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const suppliers = allSuppliers.slice(offset, offset + limit);
    
    return {
      suppliers,
      total,
      totalPages
    };
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.getNextId('suppliers');
    const supplier: Supplier = {
      id,
      ...insertSupplier,
      createdAt: insertSupplier.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;

    const updatedSupplier = { ...supplier, ...updates, updatedAt: new Date() };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    // Спочатку видаляємо всі пов'язані замовлення постачальника
    const supplierOrderIds = Array.from(this.supplierOrders.values())
      .filter(order => order.supplierId === id)
      .map(order => order.id);
    
    for (const orderId of supplierOrderIds) {
      this.supplierOrders.delete(orderId);
    }
    
    // Тепер можемо безпечно видалити постачальника
    return this.suppliers.delete(id);
  }

  // Client Types
  async getClientTypes(): Promise<any[]> {
    // Return basic client types for now
    return [
      { id: 1, name: "Юридична особа", description: "Компанії та організації" },
      { id: 2, name: "Фізична особа", description: "Приватні особи" },
      { id: 3, name: "Постачальник", description: "Постачальники товарів та послуг" }
    ];
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

  async deleteTechCard(id: number): Promise<boolean> {
    const techCard = this.techCards.get(id);
    if (!techCard) return false;

    this.techCards.delete(id);
    this.techCardSteps.delete(id);
    this.techCardMaterials.delete(id);
    
    return true;
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

  async getShipmentDetails(id: number): Promise<any> {
    const shipment = this.shipments.get(id);
    if (!shipment) return undefined;
    
    const order = this.orders.get(shipment.orderId);
    const carrier = this.carriers.get(shipment.carrierId);
    
    // Get shipment items with product details and serial numbers
    const shipmentItems = Array.from(this.shipmentItems.values())
      .filter(item => item.shipmentId === id)
      .map(item => {
        const product = this.products.get(item.productId);
        
        // Get serial numbers for this shipment item
        const itemSerialNumbers = Array.from(this.serialNumbers.values())
          .filter(serial => 
            serial.productId === item.productId && 
            serial.shipmentId === id &&
            serial.status === 'shipped'
          )
          .map(serial => serial.serialNumber);
        
        return {
          id: item.id,
          shipmentId: item.shipmentId,
          productId: item.productId,
          quantity: item.quantity,
          productName: product?.name || 'Unknown Product',
          productSku: product?.sku || 'N/A',
          unitPrice: item.unitPrice || '0',
          serialNumbers: itemSerialNumbers
        };
      });
    
    return {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
      weight: shipment.weight,
      shippingAddress: shipment.recipientWarehouseAddress || '',
      recipientName: shipment.recipientName,
      recipientPhone: shipment.recipientPhone,
      notes: shipment.notes,
      shippedAt: shipment.shippedAt,
      carrier: carrier ? { name: carrier.name } : null,
      order: order ? {
        orderNumber: order.orderNumber,
        customerName: order.customerName
      } : null,
      items: shipmentItems
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

  // Serial Numbers methods
  async getSerialNumbers(productId?: number, warehouseId?: number): Promise<SerialNumber[]> {
    const allSerialNumbers = Array.from(this.serialNumbers.values());
    
    return allSerialNumbers.filter(serialNumber => {
      if (productId && serialNumber.productId !== productId) return false;
      if (warehouseId && serialNumber.warehouseId !== warehouseId) return false;
      return true;
    });
  }

  async getSerialNumber(id: number): Promise<SerialNumber | null> {
    return this.serialNumbers.get(id) || null;
  }

  async createSerialNumber(data: InsertSerialNumber): Promise<SerialNumber> {
    const serialNumber: SerialNumber = {
      id: this.currentSerialNumberId++,
      ...data,
      createdAt: new Date(),
    };
    this.serialNumbers.set(serialNumber.id, serialNumber);
    return serialNumber;
  }

  async updateSerialNumber(id: number, data: Partial<InsertSerialNumber>): Promise<SerialNumber | null> {
    const serialNumber = this.serialNumbers.get(id);
    if (!serialNumber) return null;
    
    const updatedSerialNumber = {
      ...serialNumber,
      ...data,
    };
    this.serialNumbers.set(id, updatedSerialNumber);
    return updatedSerialNumber;
  }

  async deleteSerialNumber(id: number): Promise<boolean> {
    return this.serialNumbers.delete(id);
  }

  async getAvailableSerialNumbers(productId: number): Promise<SerialNumber[]> {
    const allSerialNumbers = Array.from(this.serialNumbers.values());
    return allSerialNumbers.filter(sn => 
      sn.productId === productId && sn.status === 'available'
    );
  }

  async reserveSerialNumber(id: number, orderId: number): Promise<boolean> {
    const serialNumber = this.serialNumbers.get(id);
    if (!serialNumber || serialNumber.status !== 'available') return false;
    
    serialNumber.status = 'reserved';
    serialNumber.orderId = orderId;
    this.serialNumbers.set(id, serialNumber);
    return true;
  }

  async releaseSerialNumber(id: number): Promise<boolean> {
    const serialNumber = this.serialNumbers.get(id);
    if (!serialNumber) return false;
    
    serialNumber.status = 'available';
    serialNumber.orderId = null;
    this.serialNumbers.set(id, serialNumber);
    return true;
  }

  async markSerialNumberAsSold(id: number): Promise<boolean> {
    const serialNumber = this.serialNumbers.get(id);
    if (!serialNumber) return false;
    
    serialNumber.status = 'sold';
    this.serialNumbers.set(id, serialNumber);
    return true;
  }

  async checkSerialNumberDuplicates(serialNumbersToCheck: string[]): Promise<string[]> {
    const allSerialNumbers = Array.from(this.serialNumbers.values());
    const duplicates: string[] = [];
    
    for (const serialNumberToCheck of serialNumbersToCheck) {
      const exists = allSerialNumbers.some(sn => sn.serialNumber === serialNumberToCheck);
      if (exists) {
        duplicates.push(serialNumberToCheck);
      }
    }
    
    return duplicates;
  }

  // Production Planning методи
  async getProductionPlans(): Promise<any[]> {
    // Повертаємо порожній масив для тестування
    return [];
  }

  async createProductionPlan(plan: any): Promise<any> {
    const newPlan = {
      id: Date.now(),
      ...plan,
      createdAt: new Date(),
      status: plan.status || 'planned'
    };
    return newPlan;
  }

  // Supply Decision методи
  async getSupplyDecisions(): Promise<any[]> {
    // Повертаємо порожній масив для тестування
    return [];
  }

  async analyzeSupplyDecision(productId: number, requiredQuantity: number): Promise<any> {
    // Простий аналіз для тестування
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Продукт з ID ${productId} не знайдено`);
    }

    // Перевіряємо запаси
    const stockLevel = Array.from(this.inventory.values())
      .filter(inv => inv.productId === productId)
      .reduce((total, inv) => total + inv.quantity, 0);

    let decision = {
      id: Date.now(),
      productId,
      requiredQuantity,
      stockLevel,
      decisionType: 'manufacture',
      manufactureQuantity: requiredQuantity,
      purchaseQuantity: 0,
      decisionReason: 'Стандартне рішення - виготовити',
      status: 'approved'
    };

    if (stockLevel >= requiredQuantity) {
      decision.decisionType = 'use_stock';
      decision.manufactureQuantity = 0;
      decision.decisionReason = 'Достатньо запасів на складі';
    } else if (stockLevel > 0) {
      const shortfall = requiredQuantity - stockLevel;
      decision.decisionType = 'partial_manufacture';
      decision.manufactureQuantity = shortfall;
      decision.decisionReason = `Використати ${stockLevel} зі складу, виготовити ${shortfall}`;
    }

    return decision;
  }

  // Integration Configs methods
  async getIntegrationConfigs(): Promise<IntegrationConfig[]> {
    return Array.from(this.integrationConfigs.values());
  }

  async getIntegrationConfig(id: number): Promise<IntegrationConfig | undefined> {
    return this.integrationConfigs.get(id);
  }

  async createIntegrationConfig(config: InsertIntegrationConfig): Promise<IntegrationConfig> {
    const newConfig: IntegrationConfig = {
      id: this.currentIntegrationConfigId++,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.integrationConfigs.set(newConfig.id, newConfig);
    return newConfig;
  }

  async updateIntegrationConfig(id: number, config: Partial<InsertIntegrationConfig>): Promise<IntegrationConfig | undefined> {
    const existing = this.integrationConfigs.get(id);
    if (!existing) return undefined;

    const updated: IntegrationConfig = {
      ...existing,
      ...config,
      updatedAt: new Date()
    };
    this.integrationConfigs.set(id, updated);
    return updated;
  }

  async deleteIntegrationConfig(id: number): Promise<boolean> {
    return this.integrationConfigs.delete(id);
  }

  // Sync Logs methods
  async getSyncLogs(integrationId?: number): Promise<SyncLog[]> {
    const logs = Array.from(this.syncLogs.values());
    if (integrationId) {
      return logs.filter(log => log.integrationId === integrationId);
    }
    return logs;
  }

  async createSyncLog(log: InsertSyncLog): Promise<SyncLog> {
    const newLog: SyncLog = {
      id: this.currentSyncLogId++,
      ...log,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.syncLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateSyncLog(id: number, log: Partial<InsertSyncLog>): Promise<boolean> {
    const existing = this.syncLogs.get(id);
    if (!existing) return false;

    const updated: SyncLog = {
      ...existing,
      ...log,
      updatedAt: new Date()
    };
    this.syncLogs.set(id, updated);
    return true;
  }

  // Entity Mappings methods
  async getEntityMappings(integrationId: number, entityType?: string): Promise<EntityMapping[]> {
    const mappings = Array.from(this.entityMappings.values());
    let filtered = mappings.filter(mapping => mapping.integrationId === integrationId);
    if (entityType) {
      filtered = filtered.filter(mapping => mapping.entityType === entityType);
    }
    return filtered;
  }

  async getEntityMapping(integrationId: number, entityType: string, localId: string): Promise<EntityMapping | undefined> {
    const mappings = Array.from(this.entityMappings.values());
    return mappings.find(mapping => 
      mapping.integrationId === integrationId && 
      mapping.entityType === entityType && 
      mapping.localId === localId
    );
  }

  async getEntityMappingByLocalId(integrationId: number, entityType: string, localId: string): Promise<EntityMapping | undefined> {
    return this.getEntityMapping(integrationId, entityType, localId);
  }

  async createEntityMapping(mapping: InsertEntityMapping): Promise<EntityMapping> {
    const newMapping: EntityMapping = {
      id: this.currentEntityMappingId++,
      ...mapping,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.entityMappings.set(newMapping.id, newMapping);
    return newMapping;
  }

  async updateEntityMapping(id: number, mapping: Partial<InsertEntityMapping>): Promise<EntityMapping | undefined> {
    const existing = this.entityMappings.get(id);
    if (!existing) return undefined;

    const updated: EntityMapping = {
      ...existing,
      ...mapping,
      updatedAt: new Date()
    };
    this.entityMappings.set(id, updated);
    return updated;
  }

  async deleteEntityMapping(id: number): Promise<boolean> {
    return this.entityMappings.delete(id);
  }

  // Sync Queue methods
  async getSyncQueueItems(integrationId?: number): Promise<SyncQueue[]> {
    const items = Array.from(this.syncQueue.values());
    if (integrationId) {
      return items.filter(item => item.integrationId === integrationId);
    }
    return items;
  }

  async getPendingSyncQueueItems(): Promise<SyncQueue[]> {
    const items = Array.from(this.syncQueue.values());
    return items.filter(item => item.status === 'pending');
  }

  async createSyncQueueItem(item: InsertSyncQueue): Promise<SyncQueue> {
    const newItem: SyncQueue = {
      id: this.currentSyncQueueId++,
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.syncQueue.set(newItem.id, newItem);
    return newItem;
  }

  async updateSyncQueueItem(id: number, item: Partial<InsertSyncQueue>): Promise<boolean> {
    const existing = this.syncQueue.get(id);
    if (!existing) return false;

    const updated: SyncQueue = {
      ...existing,
      ...item,
      updatedAt: new Date()
    };
    this.syncQueue.set(id, updated);
    return true;
  }

  async deleteSyncQueueItem(id: number): Promise<boolean> {
    return this.syncQueue.delete(id);
  }

  // Field Mappings methods
  async getFieldMappings(integrationId: number, entityType?: string): Promise<FieldMapping[]> {
    const mappings = Array.from(this.fieldMappings.values());
    let filtered = mappings.filter(mapping => mapping.integrationId === integrationId);
    if (entityType) {
      filtered = filtered.filter(mapping => mapping.entityType === entityType);
    }
    return filtered;
  }

  async createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping> {
    const newMapping: FieldMapping = {
      id: this.currentFieldMappingId++,
      ...mapping,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fieldMappings.set(newMapping.id, newMapping);
    return newMapping;
  }

  async updateFieldMapping(id: number, mapping: Partial<InsertFieldMapping>): Promise<FieldMapping | undefined> {
    const existing = this.fieldMappings.get(id);
    if (!existing) return undefined;

    const updated: FieldMapping = {
      ...existing,
      ...mapping,
      updatedAt: new Date()
    };
    this.fieldMappings.set(id, updated);
    return updated;
  }

  async deleteFieldMapping(id: number): Promise<boolean> {
    return this.fieldMappings.delete(id);
  }

  // Client Mail methods
  getClientMails(): Promise<ClientMail[]>;
  createClientMail(mailData: InsertClientMail): Promise<ClientMail>;
  updateMailsForBatch(mailIds: number[], batchId: string): Promise<void>;

  // Mail Registry methods
  getMailRegistry(): Promise<MailRegistry[]>;
  createMailRegistry(registryData: InsertMailRegistry): Promise<MailRegistry>;

  // Envelope Print Settings methods
  getEnvelopePrintSettings(): Promise<EnvelopePrintSettings[]>;
  createEnvelopePrintSettings(settingsData: InsertEnvelopePrintSettings): Promise<EnvelopePrintSettings>;

  // User Sort Preferences methods
  getUserSortPreferences(userId: string, tableName: string): Promise<UserSortPreference | null>;
  saveUserSortPreferences(preference: InsertUserSortPreference): Promise<UserSortPreference>;

  // Email Settings methods
  async getEmailSettings(): Promise<EmailSettings | null> {
    const settings = Array.from(this.emailSettings.values());
    return settings.length > 0 ? settings[0] : null;
  }

  async updateEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const existing = Array.from(this.emailSettings.values());
    const existingSettings = existing.length > 0 ? existing[0] : null;
    
    const updated: EmailSettings = {
      id: existingSettings?.id || 1,
      ...settings,
      updatedAt: new Date()
    };
    
    this.emailSettings.set(updated.id, updated);
    return updated;
  }

  // Client Nova Poshta API Settings Implementation
  async getClientNovaPoshtaApiSettings(clientId: number): Promise<ClientNovaPoshtaApiSettings[]> {
    return Array.from(this.clientNovaPoshtaApiSettings.values())
      .filter(settings => settings.clientId === clientId);
  }

  async getClientNovaPoshtaApiSetting(id: number): Promise<ClientNovaPoshtaApiSettings | undefined> {
    return this.clientNovaPoshtaApiSettings.get(id);
  }

  async createClientNovaPoshtaApiSettings(settings: InsertClientNovaPoshtaApiSettings): Promise<ClientNovaPoshtaApiSettings> {
    const id = this.getNextId();
    const newSettings: ClientNovaPoshtaApiSettings = {
      id,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clientNovaPoshtaApiSettings.set(id, newSettings);
    return newSettings;
  }

  async updateClientNovaPoshtaApiSettings(id: number, settings: Partial<InsertClientNovaPoshtaApiSettings>): Promise<ClientNovaPoshtaApiSettings | undefined> {
    const existing = this.clientNovaPoshtaApiSettings.get(id);
    if (!existing) return undefined;

    const updated: ClientNovaPoshtaApiSettings = {
      ...existing,
      ...settings,
      updatedAt: new Date()
    };
    this.clientNovaPoshtaApiSettings.set(id, updated);
    return updated;
  }

  async deleteClientNovaPoshtaApiSettings(id: number): Promise<boolean> {
    return this.clientNovaPoshtaApiSettings.delete(id);
  }

  async setPrimaryClientNovaPoshtaApiSettings(clientId: number, settingsId: number): Promise<boolean> {
    // Знімаємо прапорець isPrimary з усіх налаштувань клієнта
    const clientSettings = Array.from(this.clientNovaPoshtaApiSettings.values())
      .filter(settings => settings.clientId === clientId);
    
    for (const settings of clientSettings) {
      if (settings.isPrimary) {
        const updated = { ...settings, isPrimary: false, updatedAt: new Date() };
        this.clientNovaPoshtaApiSettings.set(settings.id, updated);
      }
    }

    // Встановлюємо нові основні налаштування
    const targetSettings = this.clientNovaPoshtaApiSettings.get(settingsId);
    if (!targetSettings || targetSettings.clientId !== clientId) return false;

    const updated = { ...targetSettings, isPrimary: true, updatedAt: new Date() };
    this.clientNovaPoshtaApiSettings.set(settingsId, updated);
    return true;
  }

  // Manufacturing automation methods
  processOrderPayment(orderId: number): Promise<void>;

  // Roles and permissions methods
  getRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(data: InsertRole): Promise<Role>;
  updateRole(id: number, data: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  
  getSystemModules(): Promise<SystemModule[]>;
  getSystemModule(id: number): Promise<SystemModule | undefined>;
  createSystemModule(data: InsertSystemModule): Promise<SystemModule>;
  updateSystemModule(id: number, data: Partial<InsertSystemModule>): Promise<SystemModule | undefined>;
  deleteSystemModule(id: number): Promise<boolean>;
  
  getPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  createPermission(data: InsertPermission): Promise<Permission>;
  updatePermission(id: number, data: Partial<InsertPermission>): Promise<Permission | undefined>;
  deletePermission(id: number): Promise<boolean>;
  
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  assignPermissionToRole(roleId: number, permissionId: number, granted?: boolean): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  assignPermissionToUser(userId: number, permissionId: number, granted?: boolean, grantor?: number, expiresAt?: Date): Promise<UserPermission>;
  removePermissionFromUser(userId: number, permissionId: number): Promise<boolean>;
  
  checkUserPermission(userId: number, moduleName: string, action: string): Promise<boolean>;
  getUserAccessibleModules(userId: number): Promise<SystemModule[]>;

  // 1C Integration - Component Import
  async import1CInvoice(invoiceId: string): Promise<{ success: boolean; message: string; receiptId?: number; }> {
    return { success: false, message: "MemStorage не підтримує 1C інтеграцію" };
  }

  async import1CInvoiceFromData(invoiceData: any): Promise<{ success: boolean; message: string; receiptId?: number; }> {
    return { success: false, message: "MemStorage не підтримує 1C інтеграцію" };
  }

  // Універсальні методи для створення клієнтів та постачальників
  async findOrCreateClient(data: {
    name?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    clientTypeId?: number;
    source?: string;
  }): Promise<any> {
    return { success: false, message: "MemStorage не підтримує автоматичне створення клієнтів" };
  }

  async findOrCreateSupplier(data: {
    name?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    clientTypeId?: number;
    source?: string;
  }): Promise<any> {
    return { success: false, message: "MemStorage не підтримує автоматичне створення постачальників" };
  }

  async get1CInvoices(): Promise<any[]> {
    return [];
  }

  // 1C Integration - Order Import
  async import1COutgoingInvoice(invoiceId: string): Promise<{ success: boolean; message: string; orderId?: number; }> {
    return { success: false, message: "MemStorage не підтримує 1C інтеграцію" };
  }

  async get1COutgoingInvoices(): Promise<any[]> {
    return [];
  }

  // System Logging
  async createSystemLog(logData: InsertSystemLog): Promise<SystemLog> {
    throw new Error("MemStorage не підтримує системне логування");
  }

  async getSystemLogs(params: any = {}): Promise<{ logs: SystemLog[]; total: number }> {
    return { logs: [], total: 0 };
  }

  async deleteOldLogs(olderThanDays: number = 90): Promise<number> {
    return 0;
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    infoCount: number;
    debugCount: number;
    recentErrors: SystemLog[];
  }> {
    return {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      recentErrors: []
    };
  }

  // Client Sync Methods
  async createClientSyncHistory(syncData: any): Promise<any> {
    throw new Error("MemStorage не підтримує синхронізацію клієнтів");
  }

  async updateClientSyncHistory(id: number, syncData: any): Promise<any> {
    throw new Error("MemStorage не підтримує синхронізацію клієнтів");
  }

  async getClientSyncHistories(params?: any): Promise<{ histories: any[]; total: number }> {
    return { histories: [], total: 0 };
  }

  async create1CClient(clientData: any): Promise<any> {
    throw new Error("MemStorage не підтримує синхронізацію клієнтів");
  }

  async update1CClient(external1cId: string, clientData: any): Promise<any> {
    throw new Error("MemStorage не підтримує синхронізацію клієнтів");
  }

  async delete1CClient(external1cId: string): Promise<any> {
    throw new Error("MemStorage не підтримує синхронізацію клієнтів");
  }

  async getOrderByInvoiceNumber(invoiceNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.invoiceNumber === invoiceNumber);
  }

  async findOrdersByPaymentInfo(paymentInfo: {
    invoiceNumber?: string;
    partialInvoiceNumber?: string;
    invoiceDate?: Date;
    correspondent?: string;
    amount?: number;
  }): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values());
    
    return allOrders.filter(order => {
      // Простий фільтр для MemStorage
      if (paymentInfo.invoiceNumber && order.invoiceNumber === paymentInfo.invoiceNumber) {
        return true;
      }
      if (paymentInfo.partialInvoiceNumber && order.invoiceNumber?.includes(paymentInfo.partialInvoiceNumber)) {
        return true;
      }
      return false;
    });
  }

  async getOrderedProducts(): Promise<any[]> {
    return [];
  }

  // Bank Payment Notifications methods for MemStorage
  async createBankPaymentNotification(notification: InsertBankPaymentNotification): Promise<BankPaymentNotification> {
    throw new Error("MemStorage не підтримує банківські повідомлення");
  }

  async getBankPaymentNotifications(filters?: {
    processed?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<BankPaymentNotification[]> {
    return [];
  }

  async updateBankPaymentNotification(id: number, updates: Partial<BankPaymentNotification>): Promise<BankPaymentNotification | undefined> {
    throw new Error("MemStorage не підтримує банківські повідомлення");
  }

  async markBankNotificationAsProcessed(notificationId: number, processed: boolean = true, processingError?: string): Promise<boolean> {
    console.log(`MemStorage: markBankNotificationAsProcessed(${notificationId}, ${processed})`);
    return true; // Always return success for testing
  }

  async getBankNotificationByMessageId(messageId: string): Promise<BankPaymentNotification | undefined> {
    console.log(`MemStorage: getBankNotificationByMessageId(${messageId})`);
    return undefined; // Always return undefined for testing
  }

  // Order Payments methods for MemStorage
  async createOrderPayment(payment: InsertOrderPayment): Promise<OrderPayment> {
    throw new Error("MemStorage не підтримує платежі замовлень");
  }

  async getOrderPayments(orderId?: number): Promise<OrderPayment[]> {
    return [];
  }

  async updateOrderPaymentStatus(orderId: number, paymentAmount: number, paymentType: string = "bank_transfer", bankNotificationId?: number, bankAccount?: string, correspondent?: string): Promise<{ order: Order; payment: OrderPayment }> {
    throw new Error("MemStorage не підтримує оновлення статусу платежів");
  }

  // Payments Methods
  async getAllPayments(): Promise<any[]> {
    return [];
  }

  async getPaymentStats(): Promise<any> {
    return {
      totalPayments: 0,
      totalAmount: 0,
      todayPayments: 0,
      todayAmount: 0,
      weekPayments: 0,
      weekAmount: 0
    };
  }

  async getPayment(id: number): Promise<any> {
    return null;
  }

  async createPayment(paymentData: any): Promise<any> {
    throw new Error("MemStorage не підтримує створення платежів");
  }

  async updatePayment(id: number, updateData: any): Promise<any> {
    throw new Error("MemStorage не підтримує оновлення платежів");
  }

  async deletePayment(id: number): Promise<boolean> {
    throw new Error("MemStorage не підтримує видалення платежів");
  }
}

import { DatabaseStorage } from "./db-storage";

// Використовуємо DatabaseStorage для всіх операцій
export const storage = new DatabaseStorage();
