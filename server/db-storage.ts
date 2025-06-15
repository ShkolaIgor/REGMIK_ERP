import { eq, sql, desc, and, gte, lte, isNull, ne, or, not, inArray, ilike } from "drizzle-orm";
import { db, pool } from "./db";
import { IStorage } from "./storage";
import {
  users, localUsers, roles, systemModules, permissions, userRoles, rolePermissions, userPermissions, userLoginHistory, categories, warehouses, units, products, inventory, orders, orderItems, orderStatuses,
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
  type UserPermission, type InsertUserPermission, userPermissions,
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

  async updateLocalUserPermissions(userId: number, permissionsData: Record<string, any>): Promise<LocalUser | undefined> {
    try {
      // Видаляємо старі дозволи користувача
      await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
      
      // Додаємо нові дозволи
      for (const [moduleName, access] of Object.entries(permissionsData)) {
        if (access === true || access === 'read' || access === 'write' || access === 'delete') {
          // Знаходимо всі дозволи для цього модуля
          const modulePermissions = await db
            .select()
            .from(permissions)
            .where(eq(permissions.resourceType, moduleName));

          for (const permission of modulePermissions) {
            let shouldGrant = false;
            
            if (access === true) {
              // Повний доступ - надаємо всі дозволи
              shouldGrant = true;
            } else if (access === permission.action) {
              // Конкретний тип доступу
              shouldGrant = true;
            }

            if (shouldGrant) {
              await db.insert(userPermissions).values({
                userId,
                permissionId: permission.id,
                granted: true,
                grantedAt: new Date()
              }).onConflictDoNothing();
            }
          }
        }
      }
      
      console.log(`Дозволи користувача ${userId} оновлено успішно`);
      
      // Повертаємо оновленого користувача
      return await this.getLocalUser(userId);
    } catch (error) {
      console.error('Помилка оновлення дозволів користувача:', error);
      throw error;
    }
  }

  async updateLocalUser(userId: number, userData: Partial<LocalUser>): Promise<LocalUser | undefined> {
    try {
      const [updatedUser] = await db
        .update(localUsers)
        .set({ 
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(localUsers.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Помилка оновлення локального користувача:', error);
      throw error;
    }
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ 
          lastLoginAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(localUsers.id, userId));
      
      console.log(`Час останнього входу для користувача ${userId} оновлено`);
    } catch (error) {
      console.error('Помилка оновлення часу останнього входу:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    try {
      await db
        .update(localUsers)
        .set({ 
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date() 
        })
        .where(eq(localUsers.id, userId));
      
      console.log(`Пароль для користувача ${userId} оновлено`);
    } catch (error) {
      console.error('Помилка оновлення пароля:', error);
      throw error;
    }
  }

  async changeUserPassword(userId: number, hashedPassword: string): Promise<boolean> {
    try {
      const result = await db
        .update(localUsers)
        .set({ 
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date() 
        })
        .where(eq(localUsers.id, userId))
        .returning();
      
      console.log(`Пароль для користувача ${userId} змінено успішно`);
      return result.length > 0;
    } catch (error) {
      console.error('Помилка зміни пароля:', error);
      return false;
    }
  }

  async getUserByResetToken(token: string): Promise<LocalUser | undefined> {
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
      
      return user;
    } catch (error) {
      console.error('Помилка пошуку користувача за токеном:', error);
      return undefined;
    }
  }

  async getLocalUserWithWorker(userId: number): Promise<any> {
    try {
      const [user] = await db
        .select({
          id: localUsers.id,
          username: localUsers.username,
          email: localUsers.email,
          firstName: localUsers.firstName,
          lastName: localUsers.lastName,
          profileImageUrl: localUsers.profileImageUrl,
          workerId: localUsers.workerId,
          role: localUsers.role,
          isActive: localUsers.isActive,
          worker: {
            id: workers.id,
            firstName: workers.firstName,
            lastName: workers.lastName,
            email: workers.email,
            photo: workers.photo
          }
        })
        .from(localUsers)
        .leftJoin(workers, eq(localUsers.workerId, workers.id))
        .where(eq(localUsers.id, userId));
      
      return user;
    } catch (error) {
      console.error('Помилка отримання користувача з робітником:', error);
      return undefined;
    }
  }

  async updateWorker(workerId: number, data: any): Promise<any> {
    try {
      const [worker] = await db
        .update(workers)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(workers.id, workerId))
        .returning();
      
      return worker;
    } catch (error) {
      console.error('Помилка оновлення робітника:', error);
      return undefined;
    }
  }

  // Клієнти
  async getClients(): Promise<any[]> {
    try {
      const result = await db.select().from(clients);
      return result;
    } catch (error) {
      console.error('Помилка отримання клієнтів:', error);
      return [];
    }
  }

  async getClient(id: number): Promise<any> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.id, id));
      return client;
    } catch (error) {
      console.error('Помилка отримання клієнта:', error);
      return undefined;
    }
  }

  async createClient(data: any): Promise<any> {
    try {
      const [client] = await db.insert(clients).values(data).returning();
      return client;
    } catch (error) {
      console.error('Помилка створення клієнта:', error);
      throw error;
    }
  }

  async updateClient(id: number, data: any): Promise<any> {
    try {
      const [client] = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning();
      return client;
    } catch (error) {
      console.error('Помилка оновлення клієнта:', error);
      throw error;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення клієнта:', error);
      return false;
    }
  }

  // Продукти
  async getProducts(): Promise<any[]> {
    try {
      const result = await db.select().from(products);
      return result;
    } catch (error) {
      console.error('Помилка отримання продуктів:', error);
      return [];
    }
  }

  async getProduct(id: number): Promise<any> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product;
    } catch (error) {
      console.error('Помилка отримання продукта:', error);
      return undefined;
    }
  }

  async createProduct(data: any): Promise<any> {
    try {
      const [product] = await db.insert(products).values(data).returning();
      return product;
    } catch (error) {
      console.error('Помилка створення продукта:', error);
      throw error;
    }
  }

  async updateProduct(id: number, data: any): Promise<any> {
    try {
      const [product] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      return product;
    } catch (error) {
      console.error('Помилка оновлення продукта:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення продукта:', error);
      return false;
    }
  }

  // Замовлення
  async getOrders(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(orders)
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .leftJoin(products, eq(orderItems.productId, products.id));
      
      // Групуємо замовлення з їх елементами
      const ordersMap = new Map();
      
      for (const row of result) {
        const order = row.orders;
        const item = row.order_items;
        const product = row.products;
        
        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, {
            ...order,
            items: []
          });
        }
        
        if (item) {
          ordersMap.get(order.id).items.push({
            ...item,
            product: product
          });
        }
      }
      
      return Array.from(ordersMap.values());
    } catch (error) {
      console.error('Помилка отримання замовлень:', error);
      return [];
    }
  }

  async getOrder(id: number): Promise<any> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, id));
      if (!order) return undefined;
      
      const items = await db
        .select()
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));
      
      return {
        ...order,
        items: items.map(row => ({
          ...row.order_items,
          product: row.products
        }))
      };
    } catch (error) {
      console.error('Помилка отримання замовлення:', error);
      return undefined;
    }
  }

  async createOrder(data: any): Promise<any> {
    try {
      const [order] = await db.insert(orders).values(data).returning();
      return order;
    } catch (error) {
      console.error('Помилка створення замовлення:', error);
      throw error;
    }
  }

  async updateOrder(id: number, data: any): Promise<any> {
    try {
      const [order] = await db
        .update(orders)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return order;
    } catch (error) {
      console.error('Помилка оновлення замовлення:', error);
      throw error;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      await db.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення замовлення:', error);
      return false;
    }
  }

  // Елементи замовлень
  async getOrderItemsWithShipmentInfo(orderId: number): Promise<any[]> {
    try {
      const items = await db
        .select()
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, orderId));
      
      return items.map(row => ({
        ...row.order_items,
        product: row.products
      }));
    } catch (error) {
      console.error('Помилка отримання елементів замовлення:', error);
      return [];
    }
  }

  async getOrderItemSerialNumbers(orderItemId: number): Promise<any[]> {
    try {
      return await db.select().from(orderItemSerialNumbers).where(eq(orderItemSerialNumbers.orderItemId, orderItemId));
    } catch (error) {
      console.error('Помилка отримання серійних номерів:', error);
      return [];
    }
  }

  // Перевізники
  async getCarriers(): Promise<any[]> {
    try {
      return await db.select().from(carriers);
    } catch (error) {
      console.error('Помилка отримання перевізників:', error);
      return [];
    }
  }

  async getCarrier(id: number): Promise<any> {
    try {
      const [carrier] = await db.select().from(carriers).where(eq(carriers.id, id));
      return carrier;
    } catch (error) {
      console.error('Помилка отримання перевізника:', error);
      return undefined;
    }
  }

  async createCarrier(data: any): Promise<any> {
    try {
      const [carrier] = await db.insert(carriers).values(data).returning();
      return carrier;
    } catch (error) {
      console.error('Помилка створення перевізника:', error);
      throw error;
    }
  }

  async updateCarrier(id: number, data: any): Promise<any> {
    try {
      const [carrier] = await db
        .update(carriers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(carriers.id, id))
        .returning();
      return carrier;
    } catch (error) {
      console.error('Помилка оновлення перевізника:', error);
      throw error;
    }
  }

  async deleteCarrier(id: number): Promise<boolean> {
    try {
      await db.delete(carriers).where(eq(carriers.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення перевізника:', error);
      return false;
    }
  }

  // Відвантаження
  async getShipments(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(shipments)
        .leftJoin(shipmentItems, eq(shipments.id, shipmentItems.shipmentId))
        .leftJoin(products, eq(shipmentItems.productId, products.id))
        .leftJoin(orders, eq(shipments.orderId, orders.id));
      
      // Групуємо відвантаження з їх елементами
      const shipmentsMap = new Map();
      
      for (const row of result) {
        const shipment = row.shipments;
        const item = row.shipment_items;
        const product = row.products;
        const order = row.orders;
        
        if (!shipmentsMap.has(shipment.id)) {
          shipmentsMap.set(shipment.id, {
            ...shipment,
            order: order,
            items: []
          });
        }
        
        if (item) {
          shipmentsMap.get(shipment.id).items.push({
            ...item,
            product: product
          });
        }
      }
      
      return Array.from(shipmentsMap.values());
    } catch (error) {
      console.error('Помилка отримання відвантажень:', error);
      return [];
    }
  }

  async getShipment(id: number): Promise<any> {
    try {
      const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
      if (!shipment) return undefined;
      
      const items = await db
        .select()
        .from(shipmentItems)
        .leftJoin(products, eq(shipmentItems.productId, products.id))
        .where(eq(shipmentItems.shipmentId, id));
      
      return {
        ...shipment,
        items: items.map(row => ({
          ...row.shipment_items,
          product: row.products
        }))
      };
    } catch (error) {
      console.error('Помилка отримання відвантаження:', error);
      return undefined;
    }
  }

  async createShipment(data: any): Promise<any> {
    try {
      const [shipment] = await db.insert(shipments).values(data).returning();
      return shipment;
    } catch (error) {
      console.error('Помилка створення відвантаження:', error);
      throw error;
    }
  }

  async updateShipment(id: number, data: any): Promise<any> {
    try {
      const [shipment] = await db
        .update(shipments)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(shipments.id, id))
        .returning();
      return shipment;
    } catch (error) {
      console.error('Помилка оновлення відвантаження:', error);
      throw error;
    }
  }

  async deleteShipment(id: number): Promise<boolean> {
    try {
      await db.delete(shipmentItems).where(eq(shipmentItems.shipmentId, id));
      await db.delete(shipments).where(eq(shipments.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення відвантаження:', error);
      return false;
    }
  }

  // Позиції
  async getPositions(): Promise<any[]> {
    try {
      return await db.select().from(positions);
    } catch (error) {
      console.error('Помилка отримання позицій:', error);
      return [];
    }
  }

  // Відділи
  async getDepartments(): Promise<any[]> {
    try {
      return await db.select().from(departments);
    } catch (error) {
      console.error('Помилка отримання відділів:', error);
      return [];
    }
  }

  // Техкарти
  async getTechCards(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(techCards)
        .leftJoin(products, eq(techCards.productId, products.id));
      
      return result.map(row => ({
        ...row.tech_cards,
        product: row.products
      }));
    } catch (error) {
      console.error('Помилка отримання техкарт:', error);
      return [];
    }
  }

  // Склади
  async getWarehouses(): Promise<any[]> {
    try {
      return await db.select().from(warehouses);
    } catch (error) {
      console.error('Помилка отримання складів:', error);
      return [];
    }
  }

  // Інвентар
  async getInventory(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id));
      
      return result.map(row => ({
        ...row.inventory,
        product: row.products,
        warehouse: row.warehouses
      }));
    } catch (error) {
      console.error('Помилка отримання інвентарю:', error);
      return [];
    }
  }

  // Постачальники
  async getSuppliers(): Promise<any[]> {
    try {
      return await db.select().from(suppliers);
    } catch (error) {
      console.error('Помилка отримання постачальників:', error);
      return [];
    }
  }

  // Замовлення постачальникам
  async getSupplierOrders(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(supplierOrders)
        .leftJoin(suppliers, eq(supplierOrders.supplierId, suppliers.id));
      
      return result.map(row => ({
        ...row.supplier_orders,
        supplier: row.suppliers
      }));
    } catch (error) {
      console.error('Помилка отримання замовлень постачальникам:', error);
      return [];
    }
  }

  // Виробничі завдання
  async getProductionTasks(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(productionTasks)
        .leftJoin(orders, eq(productionTasks.orderId, orders.id))
        .leftJoin(products, eq(productionTasks.productId, products.id));
      
      return result.map(row => ({
        ...row.production_tasks,
        order: row.orders,
        product: row.products
      }));
    } catch (error) {
      console.error('Помилка отримання виробничих завдань:', error);
      return [];
    }
  }

  // Нестачі матеріалів
  async getMaterialShortages(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(materialShortages)
        .leftJoin(products, eq(materialShortages.productId, products.id));
      
      return result.map(row => ({
        ...row.material_shortages,
        product: row.products
      }));
    } catch (error) {
      console.error('Помилка отримання нестач матеріалів:', error);
      return [];
    }
  }

  // Розрахунки собівартості
  async getCostCalculations(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(costCalculations)
        .leftJoin(products, eq(costCalculations.productId, products.id));
      
      return result.map(row => ({
        ...row.cost_calculations,
        product: row.products
      }));
    } catch (error) {
      console.error('Помилка отримання розрахунків собівартості:', error);
      return [];
    }
  }

  // Складальні операції
  async getAssemblyOperations(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(assemblyOperations)
        .leftJoin(orders, eq(assemblyOperations.orderId, orders.id));
      
      return result.map(row => ({
        ...row.assembly_operations,
        order: row.orders
      }));
    } catch (error) {
      console.error('Помилка отримання складальних операцій:', error);
      return [];
    }
  }

  // Статуси замовлень
  async getOrderStatuses(): Promise<any[]> {
    try {
      return await db.select().from(orderStatuses);
    } catch (error) {
      console.error('Помилка отримання статусів замовлень:', error);
      return [];
    }
  }

  // Налаштування сортування користувачів
  async getUserSortPreferences(userId: string, tableName: string): Promise<any> {
    try {
      const [preference] = await db
        .select()
        .from(userSortPreferences)
        .where(and(
          eq(userSortPreferences.userId, userId),
          eq(userSortPreferences.tableName, tableName)
        ));
      return preference;
    } catch (error) {
      console.error('Помилка отримання налаштувань сортування:', error);
      return null;
    }
  }

  async saveUserSortPreferences(userId: string, tableName: string, sortField: string, sortDirection: string): Promise<void> {
    try {
      await db
        .insert(userSortPreferences)
        .values({
          userId,
          tableName,
          sortField,
          sortDirection
        })
        .onConflictDoUpdate({
          target: [userSortPreferences.userId, userSortPreferences.tableName],
          set: {
            sortField,
            sortDirection,
            createdAt: new Date()
          }
        });
    } catch (error) {
      console.error('Помилка збереження налаштувань сортування:', error);
    }
  }

  // Компоненти та категорії
  async getComponents(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(components)
        .leftJoin(componentCategories, eq(components.categoryId, componentCategories.id));
      
      return result.map(row => ({
        ...row.components,
        category: row.component_categories
      }));
    } catch (error) {
      console.error('Помилка отримання компонентів:', error);
      return [];
    }
  }

  async getComponentCategories(): Promise<any[]> {
    try {
      return await db.select().from(componentCategories);
    } catch (error) {
      console.error('Помилка отримання категорій компонентів:', error);
      return [];
    }
  }

  // Типи корпусів
  async getPackageTypes(): Promise<any[]> {
    try {
      return await db.select().from(packageTypes);
    } catch (error) {
      console.error('Помилка отримання типів корпусів:', error);
      return [];
    }
  }

  // Типи пайки
  async getSolderingTypes(): Promise<any[]> {
    try {
      return await db.select().from(solderingTypes);
    } catch (error) {
      console.error('Помилка отримання типів пайки:', error);
      return [];
    }
  }

  // Компанії
  async getCompanies(): Promise<any[]> {
    try {
      return await db.select().from(companies);
    } catch (error) {
      console.error('Помилка отримання компаній:', error);
      return [];
    }
  }

  async getCompany(id: number): Promise<any> {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.id, id));
      return company;
    } catch (error) {
      console.error('Помилка отримання компанії:', error);
      return null;
    }
  }

  async createCompany(data: any): Promise<any> {
    try {
      const [company] = await db.insert(companies).values(data).returning();
      return company;
    } catch (error) {
      console.error('Помилка створення компанії:', error);
      throw error;
    }
  }

  async updateCompany(id: number, data: any): Promise<any> {
    try {
      const [company] = await db
        .update(companies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();
      return company;
    } catch (error) {
      console.error('Помилка оновлення компанії:', error);
      throw error;
    }
  }

  async deleteCompany(id: number): Promise<boolean> {
    try {
      await db.delete(companies).where(eq(companies.id, id));
      return true;
    } catch (error) {
      console.error('Помилка видалення компанії:', error);
      return false;
    }
  }

  // Nova Poshta синхронізація
  async syncNovaPoshtaCities(apiKey: string, cities: any[]): Promise<void> {
    try {
      await db.delete(novaPoshtaCities);
      if (cities.length > 0) {
        await db.insert(novaPoshtaCities).values(cities);
      }
    } catch (error) {
      console.error('Помилка синхронізації міст Нової Пошти:', error);
    }
  }

  async syncNovaPoshtaWarehouses(apiKey: string, warehouses: any[]): Promise<void> {
    try {
      await db.delete(novaPoshtaWarehouses);
      if (warehouses.length > 0) {
        await db.insert(novaPoshtaWarehouses).values(warehouses);
      }
    } catch (error) {
      console.error('Помилка синхронізації відділень Нової Пошти:', error);
    }
  }

  // Налаштування валют
  async getCurrencyUpdateSettings(): Promise<any> {
    try {
      const [settings] = await db.select().from(currencyUpdateSettings).limit(1);
      return settings || { 
        isEnabled: false, 
        updateTime: '09:00', 
        updateDays: [1,2,3,4,5] 
      };
    } catch (error) {
      console.error('Помилка отримання налаштувань валют:', error);
      return { 
        isEnabled: false, 
        updateTime: '09:00', 
        updateDays: [1,2,3,4,5] 
      };
    }
  }

  // Контакти клієнтів та зовнішні зв'язки
  async getClientContacts(): Promise<any[]> {
    try {
      return await db.select().from(clientContacts);
    } catch (error) {
      console.error('Помилка отримання контактів клієнтів:', error);
      return [];
    }
  }

  async getClientByExternalId(externalId: string): Promise<any> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.externalId, externalId));
      return client;
    } catch (error) {
      console.error('Помилка пошуку клієнта за зовнішнім ID:', error);
      return null;
    }
  }

  async getClientByTaxCode(taxCode: string): Promise<any> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.taxCode, taxCode));
      return client;
    } catch (error) {
      console.error('Помилка пошуку клієнта за податковим кодом:', error);
      return null;
    }
  }

  async updateClientSyncInfo(id: number, syncData: any): Promise<void> {
    try {
      await db
        .update(clients)
        .set({ 
          ...syncData, 
          lastSyncAt: new Date(),
          updatedAt: new Date() 
        })
        .where(eq(clients.id, id));
    } catch (error) {
      console.error('Помилка оновлення синхронізації клієнта:', error);
    }
  }

  async getClientContactByExternalId(externalId: string): Promise<any> {
    try {
      const [contact] = await db.select().from(clientContacts).where(eq(clientContacts.externalId, externalId));
      return contact;
    } catch (error) {
      console.error('Помилка пошуку контакту за зовнішнім ID:', error);
      return null;
    }
  }

  async updateClientContact(id: number, data: any): Promise<any> {
    try {
      const [contact] = await db
        .update(clientContacts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clientContacts.id, id))
        .returning();
      return contact;
    } catch (error) {
      console.error('Помилка оновлення контакту клієнта:', error);
      throw error;
    }
  }

  async createClientContact(data: any): Promise<any> {
    try {
      const [contact] = await db.insert(clientContacts).values(data).returning();
      return contact;
    } catch (error) {
      console.error('Помилка створення контакту клієнта:', error);
      throw error;
    }
  }

  async getCompanyByExternalId(externalId: string): Promise<any> {
    try {
      const [company] = await db.select().from(companies).where(eq(companies.externalId, externalId));
      return company;
    } catch (error) {
      console.error('Помилка пошуку компанії за зовнішнім ID:', error);
      return null;
    }
  }

  // Рахунки та фактури
  async getInvoices(): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id));
      
      return result.map(row => ({
        ...row.invoices,
        client: row.clients
      }));
    } catch (error) {
      console.error('Помилка отримання рахунків:', error);
      return [];
    }
  }

  async getInvoice(id: number): Promise<any> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      return invoice;
    } catch (error) {
      console.error('Помилка отримання рахунку:', error);
      return null;
    }
  }

  async getInvoiceByExternalId(externalId: string): Promise<any> {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.externalId, externalId));
      return invoice;
    } catch (error) {
      console.error('Помилка пошуку рахунку за зовнішнім ID:', error);
      return null;
    }
  }

  async createInvoice(data: any): Promise<any> {
    try {
      const [invoice] = await db.insert(invoices).values(data).returning();
      return invoice;
    } catch (error) {
      console.error('Помилка створення рахунку:', error);
      throw error;
    }
  }

  async updateInvoice(id: number, data: any): Promise<any> {
    try {
      const [invoice] = await db
        .update(invoices)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(invoices.id, id))
        .returning();
      return invoice;
    } catch (error) {
      console.error('Помилка оновлення рахунку:', error);
      throw error;
    }
  }

  async createInvoiceItem(data: any): Promise<any> {
    try {
      const [item] = await db.insert(invoiceItems).values(data).returning();
      return item;
    } catch (error) {
      console.error('Помилка створення позиції рахунку:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
