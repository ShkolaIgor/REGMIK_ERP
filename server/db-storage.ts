import { eq, sql, desc, and, gte, lte, isNull, ne, or, not, inArray, ilike } from "drizzle-orm";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import {
  users, localUsers, roles, systemModules, permissions, userRoles, rolePermissions, userLoginHistory, categories, warehouses, units, products, inventory, orders, orderItems, orderStatuses,
  recipes, recipeIngredients, productionTasks, suppliers, techCards, techCardSteps, techCardMaterials,
  components, productComponents, costCalculations, materialShortages, supplierOrders, supplierOrderItems,
  assemblyOperations, assemblyOperationItems, workers, inventoryAudits, inventoryAuditItems,
  productionForecasts, warehouseTransfers, warehouseTransferItems, positions, departments, packageTypes, solderingTypes,
  componentCategories, componentAlternatives, carriers, shipments, shipmentItems, customerAddresses, senderSettings,
  manufacturingOrders, manufacturingOrderMaterials, manufacturingSteps, currencies, currencyRates, currencyUpdateSettings, serialNumbers, serialNumberSettings, emailSettings,
  sales, saleItems, expenses, timeEntries, inventoryAlerts, tasks, clients, clientContacts, clientNovaPoshtaSettings, clientNovaPoshtaApiSettings,
  clientMail, mailRegistry, envelopePrintSettings, companies, syncLogs, userSortPreferences,
  repairs, repairParts, repairStatusHistory, repairDocuments, orderItemSerialNumbers, novaPoshtaCities, novaPoshtaWarehouses,
  type User, type UpsertUser, type LocalUser, type InsertLocalUser, type Role, type InsertRole,
  type SystemModule, type InsertSystemModule, type Permission, type InsertPermission,
  type UserRole, type InsertUserRole, type RolePermission, type InsertRolePermission,
  type UserLoginHistory, type InsertUserLoginHistory,
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
  type Currency, type InsertCurrency,
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
  type ClientNovaPoshtaApiSettings, type InsertClientNovaPoshtaApiSettings,
  type UserSortPreference, type InsertUserSortPreference,
  type Repair, type InsertRepair,
  type RepairPart, type InsertRepairPart,
  type RepairStatusHistory, type InsertRepairStatusHistory,
  type RepairDocument, type InsertRepairDocument,

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

    // Додаємо системні модулі
    const modulesList = [
      { name: "dashboard", displayName: "Панель управління", description: "Головна панель управління системою", icon: "LayoutDashboard", route: "/" },
      { name: "sales", displayName: "Продажі", description: "Модуль управління продажами", icon: "ShoppingCart", route: "/orders" },
      { name: "inventory", displayName: "Склад", description: "Управління складськими запасами", icon: "Package", route: "/inventory" },
      { name: "production", displayName: "Виробництво", description: "Планування та контроль виробництва", icon: "Factory", route: "/production" },
      { name: "clients", displayName: "Клієнти", description: "Управління клієнтською базою", icon: "Users", route: "/clients" },
      { name: "reports", displayName: "Звіти", description: "Звітність та аналітика", icon: "BarChart", route: "/reports" },
      { name: "administration", displayName: "Адміністрування", description: "Системне адміністрування", icon: "Settings", route: "/users" },
      { name: "shipments", displayName: "Відвантаження", description: "Управління відвантаженнями", icon: "Truck", route: "/shipments" },
      { name: "repairs", displayName: "Ремонти", description: "Управління ремонтами", icon: "Wrench", route: "/repairs" },
      { name: "serial_numbers", displayName: "Серійні номери", description: "Управління серійними номерами", icon: "QrCode", route: "/serial-numbers" }
    ];

    const insertedModules = await db.insert(systemModules).values(
      modulesList.map((module, index) => ({
        ...module,
        isActive: true,
        sortOrder: index + 1
      }))
    ).returning();

    // Додаємо базові дозволи для кожного модуля
    const permissionsList = [];
    
    for (const module of insertedModules) {
      const basePermissions = [
        { action: "view", displayName: "Перегляд", description: `Переглядати дані модуля ${module.displayName}` },
        { action: "create", displayName: "Створення", description: `Створювати записи в модулі ${module.displayName}` },
        { action: "edit", displayName: "Редагування", description: `Редагувати записи в модулі ${module.displayName}` },
        { action: "delete", displayName: "Видалення", description: `Видаляти записи в модулі ${module.displayName}` }
      ];

      for (const perm of basePermissions) {
        permissionsList.push({
          name: `${module.name}_${perm.action}`,
          displayName: `${module.displayName}: ${perm.displayName}`,
          description: perm.description,
          moduleId: module.id,
          action: perm.action,
          resourceType: module.name,
          isSystemPermission: true
        });
      }
    }

    // Додаємо спеціальні дозволи для адміністрування
    const adminModule = insertedModules.find(m => m.name === "administration");
    if (adminModule) {
      permissionsList.push(
        {
          name: "admin_user_management",
          displayName: "Адміністрування: Управління користувачами",
          description: "Повне управління користувачами системи",
          moduleId: adminModule.id,
          action: "manage",
          resourceType: "users",
          isSystemPermission: true
        },
        {
          name: "admin_roles_management",
          displayName: "Адміністрування: Управління ролями",
          description: "Управління ролями та дозволами",
          moduleId: adminModule.id,
          action: "manage",
          resourceType: "roles",
          isSystemPermission: true
        },
        {
          name: "admin_system_settings",
          displayName: "Адміністрування: Налаштування системи",
          description: "Управління налаштуваннями системи",
          moduleId: adminModule.id,
          action: "manage",
          resourceType: "settings",
          isSystemPermission: true
        }
      );
    }

    await db.insert(permissions).values(permissionsList);

    // Створюємо базові ролі
    const rolesList = [
      {
        name: "super_admin",
        displayName: "Супер адміністратор",
        description: "Повний доступ до всіх функцій системи",
        permissions: {},
        isSystemRole: true
      },
      {
        name: "admin",
        displayName: "Адміністратор",
        description: "Адміністративний доступ до основних функцій",
        permissions: {},
        isSystemRole: true
      },
      {
        name: "manager",
        displayName: "Менеджер",
        description: "Доступ до управління продажами та клієнтами",
        permissions: {},
        isSystemRole: false
      },
      {
        name: "operator",
        displayName: "Оператор",
        description: "Базовий доступ до операційних функцій",
        permissions: {},
        isSystemRole: false
      }
    ];

    const insertedRoles = await db.insert(roles).values(rolesList).returning();

    // Призначаємо всі дозволи для супер адміністратора
    const superAdminRole = insertedRoles.find(r => r.name === "super_admin");
    const adminRole = insertedRoles.find(r => r.name === "admin");
    const allPermissions = await db.select().from(permissions);
    
    if (superAdminRole && allPermissions.length > 0) {
      const superAdminPermissions = allPermissions.map(perm => ({
        roleId: superAdminRole.id,
        permissionId: perm.id,
        granted: true
      }));
      
      await db.insert(rolePermissions).values(superAdminPermissions);
    }

    // Призначаємо всі дозволи для звичайного адміністратора
    if (adminRole && allPermissions.length > 0) {
      const adminPermissions = allPermissions.map(perm => ({
        roleId: adminRole.id,
        permissionId: perm.id,
        granted: true
      }));
      
      await db.insert(rolePermissions).values(adminPermissions);
    }

    // Створюємо демо адміністратора
    const adminUser = await db.insert(localUsers).values({
      username: "admin",
      email: "admin@example.com",
      password: "$2a$10$N9qo8uLOickgx2ZMRZoMye.R8Xd8e9hY/./F9LvSTqjsZNECGQP2m", // пароль: admin123
      firstName: "Адмін",
      lastName: "Системи",
      isActive: true,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Призначаємо роль адміністратора користувачу
    if (adminUser.length > 0 && adminRole) {
      await db.insert(userRoles).values({
        userId: adminUser[0].id,
        roleId: adminRole.id
      });
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users).orderBy(users.createdAt);
      return result;
    } catch (error) {
      console.error('Помилка отримання користувачів:', error);
      return [];
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
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
      return user;
    } catch (error) {
      console.error('Помилка створення/оновлення користувача:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Помилка отримання користувача:', error);
      return undefined;
    }
  }


  // Додамо методи для ролей та дозволів
  async getRoles(): Promise<Role[]> {
    try {
      const result = await db.select().from(roles).orderBy(roles.displayName);
      return result;
    } catch (error) {
      console.error('Помилка отримання ролей:', error);
      return [];
    }
  }

  async getRole(id: number): Promise<Role | undefined> {
    try {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      return role;
    } catch (error) {
      console.error('Помилка отримання ролі:', error);
      return undefined;
    }
  }

  async createRole(data: InsertRole): Promise<Role> {
    try {
      const [role] = await db.insert(roles).values(data).returning();
      return role;
    } catch (error) {
      console.error('Помилка створення ролі:', error);
      throw error;
    }
  }

  async updateRole(id: number, data: Partial<InsertRole>): Promise<Role | undefined> {
    try {
      const [role] = await db
        .update(roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();
      return role;
    } catch (error) {
      console.error('Помилка оновлення ролі:', error);
      return undefined;
    }
  }

  async deleteRole(id: number): Promise<boolean> {
    try {
      await db.delete(roles).where(eq(roles.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення ролі:', error);
      return false;
    }
  }

  async getSystemModules(): Promise<SystemModule[]> {
    try {
      const result = await db.select().from(systemModules).orderBy(systemModules.sortOrder);
      return result;
    } catch (error) {
      console.error('Помилка отримання системних модулів:', error);
      return [];
    }
  }

  async getSystemModule(id: number): Promise<SystemModule | undefined> {
    try {
      const [module] = await db.select().from(systemModules).where(eq(systemModules.id, id));
      return module;
    } catch (error) {
      console.error('Помилка отримання системного модуля:', error);
      return undefined;
    }
  }

  async createSystemModule(data: InsertSystemModule): Promise<SystemModule> {
    try {
      const [module] = await db.insert(systemModules).values(data).returning();
      return module;
    } catch (error) {
      console.error('Помилка створення системного модуля:', error);
      throw error;
    }
  }

  async updateSystemModule(id: number, data: Partial<InsertSystemModule>): Promise<SystemModule | undefined> {
    try {
      const [module] = await db
        .update(systemModules)
        .set(data)
        .where(eq(systemModules.id, id))
        .returning();
      return module;
    } catch (error) {
      console.error('Помилка оновлення системного модуля:', error);
      return undefined;
    }
  }

  async deleteSystemModule(id: number): Promise<boolean> {
    try {
      await db.delete(systemModules).where(eq(systemModules.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення системного модуля:', error);
      return false;
    }
  }

  async getPermissions(): Promise<Permission[]> {
    try {
      const result = await db.select().from(permissions).orderBy(permissions.displayName);
      return result;
    } catch (error) {
      console.error('Помилка отримання дозволів:', error);
      return [];
    }
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    try {
      const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
      return permission;
    } catch (error) {
      console.error('Помилка отримання дозволу:', error);
      return undefined;
    }
  }

  async createPermission(data: InsertPermission): Promise<Permission> {
    try {
      const [permission] = await db.insert(permissions).values(data).returning();
      return permission;
    } catch (error) {
      console.error('Помилка створення дозволу:', error);
      throw error;
    }
  }

  async updatePermission(id: number, data: Partial<InsertPermission>): Promise<Permission | undefined> {
    try {
      const [permission] = await db
        .update(permissions)
        .set(data)
        .where(eq(permissions.id, id))
        .returning();
      return permission;
    } catch (error) {
      console.error('Помилка оновлення дозволу:', error);
      return undefined;
    }
  }

  async deletePermission(id: number): Promise<boolean> {
    try {
      await db.delete(permissions).where(eq(permissions.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення дозволу:', error);
      return false;
    }
  }

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    try {
      const result = await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      return result;
    } catch (error) {
      console.error('Помилка отримання дозволів ролі:', error);
      return [];
    }
  }

  async assignPermissionToRole(roleId: number, permissionId: number, granted: boolean = true): Promise<RolePermission> {
    try {
      const [rolePermission] = await db
        .insert(rolePermissions)
        .values({ roleId, permissionId, granted })
        .onConflictDoUpdate({
          target: [rolePermissions.roleId, rolePermissions.permissionId],
          set: { granted }
        })
        .returning();
      return rolePermission;
    } catch (error) {
      console.error('Помилка призначення дозволу ролі:', error);
      throw error;
    }
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    try {
      await db
        .delete(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        ));
      return true;
    } catch (error) {
      console.error('Помилка видалення дозволу від ролі:', error);
      return false;
    }
  }

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    try {
      const result = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
      return result;
    } catch (error) {
      console.error('Помилка отримання дозволів користувача:', error);
      return [];
    }
  }

  async assignPermissionToUser(userId: number, permissionId: number, granted: boolean = true, grantor?: number, expiresAt?: Date): Promise<UserPermission> {
    try {
      const [userPermission] = await db
        .insert(userPermissions)
        .values({ userId, permissionId, granted, grantor, expiresAt })
        .onConflictDoUpdate({
          target: [userPermissions.userId, userPermissions.permissionId],
          set: { granted, grantor, expiresAt }
        })
        .returning();
      return userPermission;
    } catch (error) {
      console.error('Помилка призначення дозволу користувачу:', error);
      throw error;
    }
  }

  async checkUserPermission(userId: number, moduleName: string, action: string): Promise<boolean> {
    try {
      // Перевіряємо дозволи через ролі користувача
      const userRoles = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));

      if (userRoles.length === 0) {
        return false;
      }

      const roleIds = userRoles.map(ur => ur.roleId);
      
      // Перевіряємо дозволи через ролі
      const rolePermissions = await db
        .select()
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .innerJoin(systemModules, eq(permissions.moduleId, systemModules.id))
        .where(
          and(
            inArray(rolePermissions.roleId, roleIds),
            eq(systemModules.name, moduleName),
            eq(permissions.action, action),
            eq(rolePermissions.granted, true)
          )
        );

      return rolePermissions.length > 0;
    } catch (error) {
      console.error('Помилка перевірки дозволу користувача:', error);
      return false;
    }
  }

  // Додаємо відсутні методи для користувачів та працівників
  async getLocalUsersWithWorkers(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(localUsers)
        .leftJoin(workers, eq(localUsers.workerId, workers.id))
        .orderBy(localUsers.username);
      
      return result.map(row => ({
        ...row.local_users,
        worker: row.workers
      }));
    } catch (error) {
      console.error('Помилка отримання локальних користувачів з працівниками:', error);
      return [];
    }
  }

  async getWorkersAvailableForUsers(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(workers)
        .leftJoin(localUsers, eq(workers.id, localUsers.workerId))
        .where(isNull(localUsers.workerId))
        .orderBy(workers.firstName, workers.lastName);
      
      return result.map(row => row.workers);
    } catch (error) {
      console.error('Помилка отримання доступних працівників:', error);
      return [];
    }
  }

  // Додаємо методи для зв'язку користувачів з ролями
  async assignRoleToUser(userId: number, roleId: number): Promise<UserRole> {
    try {
      const [userRole] = await db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing()
        .returning();
      return userRole;
    } catch (error) {
      console.error('Помилка призначення ролі користувачу:', error);
      throw error;
    }
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    try {
      await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        ));
      return true;
    } catch (error) {
      console.error('Помилка видалення ролі від користувача:', error);
      return false;
    }
  }

  async getUserRoles(userId: number): Promise<Role[]> {
    try {
      const result = await db
        .select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
      
      return result.map(row => row.roles);
    } catch (error) {
      console.error('Помилка отримання ролей користувача:', error);
      return [];
    }
  }

  // Додаємо методи для роботи з локальними користувачами
  async getLocalUserByUsername(username: string): Promise<LocalUser | undefined> {
    try {
      const [user] = await db.select().from(localUsers).where(eq(localUsers.username, username));
      return user;
    } catch (error) {
      console.error('Помилка отримання користувача за username:', error);
      return undefined;
    }
  }

  async getLocalUserByEmail(email: string): Promise<LocalUser | undefined> {
    try {
      const [user] = await db.select().from(localUsers).where(eq(localUsers.email, email));
      return user;
    } catch (error) {
      console.error('Помилка отримання користувача за email:', error);
      return undefined;
    }
  }

  async updateLastLoginTime(userId: number): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(localUsers.id, userId));
    } catch (error) {
      console.error('Помилка оновлення часу входу:', error);
    }
  }

  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ 
          passwordResetToken: token, 
          passwordResetExpires: expires 
        })
        .where(eq(localUsers.id, userId));
    } catch (error) {
      console.error('Помилка збереження токену скидання пароля:', error);
    }
  }

  async getLocalUser(id: number): Promise<LocalUser | undefined> {
    try {
      const [user] = await db.select().from(localUsers).where(eq(localUsers.id, id));
      return user;
    } catch (error) {
      console.error('Помилка отримання локального користувача:', error);
      return undefined;
    }
  }

  async changeUserPassword(userId: number, newPassword: string): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ 
          password: newPassword,
          updatedAt: new Date()
        })
        .where(eq(localUsers.id, userId));
    } catch (error) {
      console.error('Помилка зміни пароля користувача:', error);
      throw error;
    }
  }

  async savePasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ 
          passwordResetToken: token,
          passwordResetExpires: expires,
          updatedAt: new Date()
        })
        .where(eq(localUsers.email, email));
    } catch (error) {
      console.error('Помилка збереження токену скидання пароля:', error);
      throw error;
    }
  }

  async getEmailSettings(): Promise<any> {
    try {
      // Повертаємо базові налаштування email
      return {
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@regmik.com',
        fromName: process.env.FROM_NAME || 'RegMik ERP System',
        isEnabled: !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
      };
    } catch (error) {
      console.error('Помилка отримання налаштувань email:', error);
      return {
        isEnabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: ''
      };
    }
  }

  async updateEmailSettings(settings: any): Promise<void> {
    try {
      // Налаштування email зберігаються в змінних середовища
      // У реальному застосунку можна створити окрему таблицю для налаштувань
      console.log('Email налаштування оновлено:', settings);
    } catch (error) {
      console.error('Помилка оновлення налаштувань email:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
