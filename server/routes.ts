import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { registerSimpleIntegrationRoutes } from "./integrations-simple";
import { registerSyncApiRoutes } from "./sync-api";
import { setupSimpleSession, setupSimpleAuth, isSimpleAuthenticated } from "./simple-auth";
import { novaPoshtaApi } from "./nova-poshta-api";
import { novaPoshtaCache } from "./nova-poshta-cache";
import { 
  insertProductSchema, insertOrderSchema, insertRecipeSchema,
  insertProductionTaskSchema, insertCategorySchema, insertUnitSchema, insertWarehouseSchema,
  insertSupplierSchema, insertInventorySchema, insertTechCardSchema, insertTechCardStepSchema, insertTechCardMaterialSchema,
  insertComponentSchema, insertProductComponentSchema, insertCostCalculationSchema, insertMaterialShortageSchema,
  insertAssemblyOperationSchema, insertAssemblyOperationItemSchema,
  insertInventoryAuditSchema, insertInventoryAuditItemSchema,
  insertWorkerSchema, insertProductionForecastSchema,
  insertWarehouseTransferSchema, insertPositionSchema, insertDepartmentSchema,
  insertPackageTypeSchema, insertSolderingTypeSchema, insertComponentAlternativeSchema, insertComponentCategorySchema,
  insertShipmentSchema, insertManufacturingOrderSchema, insertManufacturingOrderMaterialSchema, insertManufacturingStepSchema,
  insertCurrencySchema, insertSerialNumberSchema, insertSerialNumberSettingsSchema,
  insertLocalUserSchema, insertRoleSchema, insertSystemModuleSchema, changePasswordSchema,
  insertEmailSettingsSchema, insertClientSchema, insertClientContactSchema, insertClientMailSchema, insertMailRegistrySchema, insertEnvelopePrintSettingsSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail } from "./email-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth setup
  setupSimpleSession(app);
  setupSimpleAuth(app);

  // Register simple integration routes
  registerSimpleIntegrationRoutes(app);
  
  // Register sync API routes
  registerSyncApiRoutes(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics API
  app.get("/api/analytics/sales", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const salesData = await storage.getSalesAnalytics(period as string);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ error: "Failed to fetch sales analytics" });
    }
  });

  app.get("/api/analytics/expenses", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const expensesData = await storage.getExpensesAnalytics(period as string);
      res.json(expensesData);
    } catch (error) {
      console.error("Error fetching expenses analytics:", error);
      res.status(500).json({ error: "Failed to fetch expenses analytics" });
    }
  });

  app.get("/api/analytics/profit", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const profitData = await storage.getProfitAnalytics(period as string);
      res.json(profitData);
    } catch (error) {
      console.error("Error fetching profit analytics:", error);
      res.status(500).json({ error: "Failed to fetch profit analytics" });
    }
  });

  // Product profitability analysis
  app.get("/api/analytics/product-profitability", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const profitabilityData = await storage.calculateProductProfitability(period as string);
      res.json(profitabilityData);
    } catch (error) {
      console.error("Error fetching product profitability:", error);
      res.status(500).json({ error: "Failed to fetch product profitability" });
    }
  });

  app.get("/api/analytics/top-profitable-products", isSimpleAuthenticated, async (req, res) => {
    try {
      const { limit = '10', period = 'month' } = req.query;
      const topProducts = await storage.getTopProfitableProducts(parseInt(limit as string), period as string);
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top profitable products:", error);
      res.status(500).json({ error: "Failed to fetch top profitable products" });
    }
  });

  app.get("/api/analytics/product-trends/:productId", isSimpleAuthenticated, async (req, res) => {
    try {
      const { productId } = req.params;
      const { months = '6' } = req.query;
      const trends = await storage.getProductProfitabilityTrends(parseInt(productId), parseInt(months as string));
      res.json(trends);
    } catch (error) {
      console.error("Error fetching product trends:", error);
      res.status(500).json({ error: "Failed to fetch product trends" });
    }
  });

  // Time tracking API
  app.get("/api/time-entries", isSimpleAuthenticated, async (req, res) => {
    try {
      const timeEntries = await storage.getTimeEntries();
      res.json(timeEntries);
    } catch (error) {
      console.error("Error fetching time entries:", error);
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", isSimpleAuthenticated, async (req, res) => {
    try {
      const timeEntryData = req.body;
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      res.status(201).json(timeEntry);
    } catch (error) {
      console.error("Error creating time entry:", error);
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  app.patch("/api/time-entries/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const timeEntry = await storage.updateTimeEntry(id, updateData);
      res.json(timeEntry);
    } catch (error) {
      console.error("Error updating time entry:", error);
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  // Inventory alerts API
  app.get("/api/inventory/alerts", isSimpleAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getInventoryAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching inventory alerts:", error);
      res.status(500).json({ error: "Failed to fetch inventory alerts" });
    }
  });

  app.post("/api/inventory/check-alerts", isSimpleAuthenticated, async (req, res) => {
    try {
      await storage.checkAndCreateInventoryAlerts();
      res.json({ message: "Inventory alerts checked and updated" });
    } catch (error) {
      console.error("Error checking inventory alerts:", error);
      res.status(500).json({ error: "Failed to check inventory alerts" });
    }
  });

  // Password reset functionality
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email є обов'язковим" });
      }

      // Знайти користувача за email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Не показуємо, що користувач не існує з міркувань безпеки
        return res.json({ message: "Якщо email існує в системі, лист буде відправлено" });
      }

      // Генерувати токен скидання паролю
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 година

      // Зберегти токен в базі даних
      const tokenSaved = await storage.savePasswordResetToken(user.id, resetToken, resetExpires);
      
      if (!tokenSaved) {
        return res.status(500).json({ message: "Помилка збереження токену" });
      }

      // Отримати базову URL з заголовків
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || req.get('x-forwarded-host');
      
      // Виправляємо формування URL - видаляємо зайві слеші
      let baseUrl = `${protocol}://${host}`;
      if (baseUrl.includes('\\')) {
        baseUrl = baseUrl.replace(/\\/g, '');
      }
      
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      console.log("Protocol:", protocol);
      console.log("Host:", host);
      console.log("Base URL:", baseUrl);
      console.log("Generated reset URL:", resetUrl);

      // Відправити email через налаштований сервіс
      console.log("Attempting to send email to:", email);
      
      // Перевірити налаштування email
      const emailSettings = await storage.getEmailSettings();
      console.log("Email settings loaded:", emailSettings ? "Yes" : "No");
      
      if (!emailSettings || !emailSettings.smtpHost) {
        console.log("Email service not configured or inactive");
        return res.status(500).json({ message: "Помилка відправки email - сервіс не налаштований" });
      }
      
      // Використовуємо nodemailer напряму з налаштуваннями
      const nodemailer = await import('nodemailer');
      const transportConfig = {
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort || 587,
        secure: emailSettings.smtpSecure || false,
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPassword,
        },
      };
      const transporter = nodemailer.createTransport(transportConfig as any);

      try {
        const emailResult = await transporter.sendMail({
          from: emailSettings.fromEmail || "noreply@regmik-erp.com",
          to: email,
          subject: "Відновлення паролю - REGMIK ERP",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0; text-align: center;">REGMIK: ERP</h1>
                <p style="color: #6b7280; margin: 5px 0 0 0; text-align: center;">Система управління виробництвом</p>
              </div>
              
              <h2 style="color: #374151;">Відновлення паролю</h2>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Ви отримали цей лист, оскільки для вашого облікового запису був запитаний скидання паролю.
              </p>
              
              <p style="color: #6b7280; line-height: 1.6;">
                Натисніть на кнопку нижче, щоб встановити новий пароль:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Відновити пароль
                </a>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
                Якщо кнопка не працює, скопіюйте та вставте це посилання у ваш браузер:
              </p>
              <p style="color: #2563eb; word-break: break-all; font-size: 14px;">
                ${resetUrl}
              </p>
              
              <p style="color: #6b7280; line-height: 1.6; font-size: 14px;">
                Це посилання дійсне протягом 1 години. Якщо ви не запитували скидання паролю, проігноруйте цей лист.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                REGMIK ERP - Система управління виробництвом
              </p>
            </div>
          `
        });
        
        console.log("Email sent successfully:", emailResult.messageId);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ message: "Помилка відправки email - перевірте налаштування SMTP" });
      }

      res.json({ message: "Якщо email існує в системі, лист буде відправлено" });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // Validate reset token
  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Токен є обов'язковим" });
      }

      const user = await storage.getUserByResetToken(token as string);
      
      if (!user) {
        return res.status(400).json({ message: "Недійсний або застарілий токен" });
      }

      res.json({ message: "Токен дійсний" });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Токен та пароль є обов'язковими" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Пароль повинен містити мінімум 6 символів" });
      }

      console.log("Looking for user with reset token:", token);
      const user = await storage.getUserByResetToken(token);
      console.log("User found by reset token:", user ? `ID ${user.id}` : "None");
      
      if (!user) {
        return res.status(400).json({ message: "Недійсний або застарілий токен" });
      }

      // Хешувати новий пароль
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed, updating for user ID:", user.id);

      // Оновити пароль та очистити токен скидання
      const success = await storage.confirmPasswordReset(user.id, hashedPassword);
      console.log("Password reset result:", success);
      
      if (!success) {
        return res.status(500).json({ message: "Помилка оновлення паролю" });
      }

      res.json({ message: "Пароль успішно оновлено" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // Оновлення профілю користувача
  app.patch("/api/auth/profile", isSimpleAuthenticated, async (req, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: "Користувач не авторизований" });
      }

      const { firstName, lastName, email, profileImageUrl } = req.body;
      const userId = parseInt(sessionUser.id);
      
      // Отримуємо повні дані користувача
      const fullUser = await storage.getLocalUserWithWorker(userId);
      
      // Оновлюємо дані користувача
      await storage.updateLocalUser(userId, {
        firstName,
        lastName,
        email,
        profileImageUrl,
        updatedAt: new Date()
      });

      // Якщо користувач пов'язаний з робітником, оновлюємо дані робітника
      if (fullUser?.workerId) {
        await storage.updateWorker(fullUser.workerId, {
          firstName,
          lastName,
          email,
          photo: profileImageUrl
        });
      }

      // Оновлюємо дані в сесії
      if (req.session) {
        (req.session as any).user = {
          ...(req.session as any).user,
          firstName,
          lastName,
          email,
          profileImageUrl
        };
      }

      res.json({ message: "Профіль успішно оновлено" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Помилка при оновленні профілю" });
    }
  });

  // Production statistics by category
  app.get("/api/production-stats/by-category", isSimpleAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getProductionStatsByCategory();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching production stats by category:", error);
      res.status(500).json({ error: "Failed to fetch production stats by category" });
    }
  });

  // Order statistics by period
  app.get("/api/production-stats/by-period", isSimpleAuthenticated, async (req, res) => {
    try {
      const { period = 'month', startDate, endDate } = req.query;
      const stats = await storage.getOrderStatsByPeriod(
        period as string, 
        startDate as string, 
        endDate as string
      );
      res.json(stats);
    } catch (error) {
      console.error("Error fetching order stats by period:", error);
      res.status(500).json({ error: "Failed to fetch order stats by period" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`PUT /api/categories/${id} received data:`, req.body);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      console.log(`Parsed category data:`, categoryData);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        console.log(`Category with ID ${id} not found`);
        res.status(404).json({ error: "Category not found" });
        return;
      }
      console.log(`Category updated successfully:`, category);
      res.json(category);
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (!success) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Warehouses
  app.get("/api/warehouses", async (req, res) => {
    try {
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.post("/api/warehouses", async (req, res) => {
    try {
      console.log("Received warehouse data:", req.body);
      const warehouseData = insertWarehouseSchema.parse(req.body);
      console.log("Parsed warehouse data:", warehouseData);
      const warehouse = await storage.createWarehouse(warehouseData);
      console.log("Created warehouse:", warehouse);
      res.status(201).json(warehouse);
    } catch (error) {
      console.error("Warehouse creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create warehouse", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.put("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      const warehouse = await storage.updateWarehouse(id, warehouseData);
      if (warehouse) {
        res.json(warehouse);
      } else {
        res.status(404).json({ error: "Warehouse not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update warehouse" });
      }
    }
  });

  app.patch("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const warehouseData = insertWarehouseSchema.partial().parse(req.body);
      console.log("PATCH warehouse request for ID:", id, "with data:", warehouseData);
      const warehouse = await storage.updateWarehouse(id, warehouseData);
      if (warehouse) {
        console.log("Warehouse updated successfully:", warehouse);
        res.json(warehouse);
      } else {
        console.log("Warehouse not found for ID:", id);
        res.status(404).json({ error: "Warehouse not found" });
      }
    } catch (error) {
      console.error("PATCH warehouse error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid warehouse data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update warehouse" });
      }
    }
  });

  app.delete("/api/warehouses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWarehouse(id);
      if (!success) {
        res.status(404).json({ error: "Warehouse not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete warehouse" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid product data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Inventory
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/warehouse/:warehouseId", async (req, res) => {
    try {
      const warehouseId = parseInt(req.params.warehouseId);
      const inventory = await storage.getInventoryByWarehouse(warehouseId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch warehouse inventory" });
    }
  });

  app.put("/api/inventory", async (req, res) => {
    try {
      const { productId, warehouseId, quantity } = req.body;
      if (!productId || !warehouseId || quantity === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const inventory = await storage.updateInventory(productId, warehouseId, quantity);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Get order items with shipment information for partial shipment
  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      console.log("Getting order items for orderId:", orderId);
      const orderItems = await storage.getOrderItemsWithShipmentInfo(orderId);
      console.log("Order items result:", orderItems);
      res.json(orderItems);
    } catch (error) {
      console.error("Failed to get order items:", error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  // Create partial shipment
  app.post("/api/orders/:id/partial-shipment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { items, shipmentData } = req.body;
      
      console.log("Creating partial shipment for order:", orderId);
      console.log("Items to ship:", items);
      console.log("Shipment data:", shipmentData);
      
      const shipment = await storage.createPartialShipment(orderId, items, shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      console.error("Failed to create partial shipment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create partial shipment" });
      }
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("Creating order with data:", JSON.stringify(req.body, null, 2));
      const { order, items } = req.body;
      console.log("Order data:", order);
      console.log("Items data:", items);
      console.log("Items count:", items ? items.length : 0);
      
      // Якщо є clientId, отримуємо дані клієнта та автоматично заповнюємо customerName
      let orderData = { ...order };
      if (order.clientId && !order.customerName) {
        const client = await storage.getClient(order.clientId);
        if (client) {
          orderData.customerName = client.name;
          console.log("Auto-filled customerName from client:", client.name);
        }
      }
      
      const validatedOrderData = insertOrderSchema.parse(orderData);
      const createdOrder = await storage.createOrder(validatedOrderData, items || []);
      console.log("Created order:", createdOrder);
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("UPDATE ORDER STATUS - ID:", id);
      console.log("UPDATE ORDER STATUS - Request headers:", req.headers);
      console.log("UPDATE ORDER STATUS - Raw body:", req.body);
      console.log("UPDATE ORDER STATUS - Body type:", typeof req.body);
      console.log("UPDATE ORDER STATUS - Body stringified:", JSON.stringify(req.body));
      
      const { status } = req.body;
      console.log("UPDATE ORDER STATUS - Extracted status:", status);
      console.log("UPDATE ORDER STATUS - Status type:", typeof status);
      
      if (!status) {
        console.log("UPDATE ORDER STATUS - Status is missing!");
        return res.status(400).json({ error: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      console.log("UPDATE ORDER STATUS - Storage result:", order);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("UPDATE ORDER STATUS - Error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { order, items } = req.body;
      
      console.log("=== UPDATE ORDER SERVER ===");
      console.log("Order ID:", id);
      console.log("Order data:", order);
      console.log("Items data:", items);
      
      const orderData = insertOrderSchema.parse(order);
      
      // Передаємо дані без перетворення дат - це зробить db-storage.ts
      const updatedOrder = await storage.updateOrder(id, orderData, items || []);
      
      console.log("Updated order result:", updatedOrder);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order" });
      }
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete order with ID: ${id}`);
      
      const deleted = await storage.deleteOrder(id);
      console.log(`Delete operation result: ${deleted}`);
      
      if (!deleted) {
        console.log(`Order with ID ${id} not found`);
        return res.status(404).json({ error: "Order not found" });
      }
      
      console.log(`Order with ID ${id} successfully deleted`);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete order:", error);
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Update payment date for order
  app.patch("/api/orders/:id/payment-date", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentDate } = req.body;
      
      console.log(`Updating payment date for order ${id}:`, paymentDate);
      
      const order = await storage.updateOrderPaymentDate(id, paymentDate);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Failed to update payment date:", error);
      res.status(500).json({ error: "Failed to update payment date" });
    }
  });

  // Update due date for order
  app.patch("/api/orders/:id/due-date", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { dueDate } = req.body;
      
      console.log(`Updating due date for order ${id}:`, dueDate);
      
      const order = await storage.updateOrderDueDate(id, dueDate);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Failed to update due date:", error);
      res.status(500).json({ error: "Failed to update due date" });
    }
  });

  // Order Status API
  app.get("/api/order-statuses", async (req, res) => {
    try {
      console.log("Fetching order statuses...");
      const statuses = await storage.getOrderStatuses();
      console.log("Order statuses fetched:", statuses);
      res.json(statuses);
    } catch (error) {
      console.error("Failed to fetch order statuses:", error);
      res.status(500).json({ error: "Failed to fetch order statuses" });
    }
  });

  app.post("/api/order-statuses", async (req, res) => {
    try {
      const statusData = req.body;
      const status = await storage.createOrderStatus(statusData);
      res.status(201).json(status);
    } catch (error) {
      console.error("Failed to create order status:", error);
      res.status(500).json({ error: "Failed to create order status" });
    }
  });

  app.put("/api/order-statuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusData = req.body;
      const status = await storage.updateOrderStatusRecord(id, statusData);
      if (!status) {
        return res.status(404).json({ error: "Order status not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("Failed to update order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.delete("/api/order-statuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrderStatusRecord(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete order status:", error);
      res.status(500).json({ error: "Failed to delete order status" });
    }
  });

  // Recipes
  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const { recipe, ingredients } = req.body;
      const recipeData = insertRecipeSchema.parse(recipe);
      const newRecipe = await storage.createRecipe(recipeData, ingredients);
      res.status(201).json(newRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create recipe" });
      }
    }
  });

  app.patch("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { recipe, ingredients } = req.body;
      const recipeData = insertRecipeSchema.partial().parse(recipe);
      const updatedRecipe = await storage.updateRecipe(id, recipeData, ingredients);
      if (!updatedRecipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      res.json(updatedRecipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid recipe data", details: error.errors });
      } else {
        console.error("Failed to update recipe:", error);
        res.status(500).json({ error: "Failed to update recipe" });
      }
    }
  });

  // Production Tasks
  app.get("/api/production-tasks", async (req, res) => {
    try {
      console.log("Fetching production tasks...");
      const tasks = await storage.getProductionTasks();
      console.log("Production tasks fetched:", tasks);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching production tasks:", error);
      res.status(500).json({ error: "Failed to fetch production tasks" });
    }
  });

  app.post("/api/production-tasks", async (req, res) => {
    try {
      const taskData = insertProductionTaskSchema.parse(req.body);
      const task = await storage.createProductionTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create production task" });
      }
    }
  });

  app.put("/api/production-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskData = insertProductionTaskSchema.partial().parse(req.body);
      const task = await storage.updateProductionTask(id, taskData);
      if (!task) {
        return res.status(404).json({ error: "Production task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update production task" });
      }
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create supplier" });
      }
    }
  });

  // Components routes
  app.get("/api/components", async (req, res) => {
    try {
      const components = await storage.getComponents();
      res.json(components);
    } catch (error) {
      console.error("Error fetching components:", error);
      res.status(500).json({ error: "Failed to fetch components", details: error.message });
    }
  });

  app.get("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getComponent(id);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch component" });
    }
  });

  app.post("/api/components", async (req, res) => {
    try {
      const data = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component" });
      }
    }
  });

  app.patch("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertComponentSchema.partial().parse(req.body);
      const component = await storage.updateComponent(id, data);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component" });
      }
    }
  });

  app.delete("/api/components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComponent(id);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete component" });
    }
  });

  // Component Alternatives routes
  app.get("/api/components/:id/alternatives", async (req, res) => {
    try {
      const componentId = parseInt(req.params.id);
      const alternatives = await storage.getComponentAlternatives(componentId);
      res.json(alternatives);
    } catch (error) {
      console.error("Error fetching component alternatives:", error);
      res.status(500).json({ error: "Failed to fetch component alternatives" });
    }
  });

  app.post("/api/components/:id/alternatives", async (req, res) => {
    try {
      const originalComponentId = parseInt(req.params.id);
      const alternativeData = {
        ...req.body,
        originalComponentId
      };
      const validatedData = insertComponentAlternativeSchema.parse(alternativeData);
      const alternative = await storage.createComponentAlternative(validatedData);
      res.status(201).json(alternative);
    } catch (error) {
      console.error("Error creating component alternative:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alternative data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component alternative" });
      }
    }
  });

  app.patch("/api/component-alternatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alternativeData = insertComponentAlternativeSchema.partial().parse(req.body);
      const alternative = await storage.updateComponentAlternative(id, alternativeData);
      if (!alternative) {
        return res.status(404).json({ error: "Component alternative not found" });
      }
      res.json(alternative);
    } catch (error) {
      console.error("Error updating component alternative:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alternative data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component alternative" });
      }
    }
  });

  app.delete("/api/component-alternatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComponentAlternative(id);
      if (!success) {
        return res.status(404).json({ error: "Component alternative not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting component alternative:", error);
      res.status(500).json({ error: "Failed to delete component alternative" });
    }
  });

  // Component Categories routes
  app.get("/api/component-categories", async (req, res) => {
    try {
      const categories = await storage.getComponentCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching component categories:", error);
      res.status(500).json({ error: "Failed to fetch component categories" });
    }
  });

  app.post("/api/component-categories", async (req, res) => {
    try {
      const validatedData = insertComponentCategorySchema.parse(req.body);
      const category = await storage.createComponentCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating component category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component category" });
      }
    }
  });

  app.patch("/api/component-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertComponentCategorySchema.partial().parse(req.body);
      const category = await storage.updateComponentCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Component category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating component category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid category data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component category" });
      }
    }
  });

  app.delete("/api/component-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComponentCategory(id);
      if (!success) {
        return res.status(404).json({ error: "Component category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting component category:", error);
      res.status(500).json({ error: "Failed to delete component category" });
    }
  });

  // Package Types routes
  app.get("/api/package-types", async (req, res) => {
    try {
      const packageTypes = await storage.getPackageTypes();
      res.json(packageTypes);
    } catch (error) {
      console.error("Error fetching package types:", error);
      res.status(500).json({ error: "Failed to fetch package types" });
    }
  });

  app.post("/api/package-types", async (req, res) => {
    try {
      console.log("Raw body:", req.body);
      console.log("Body type:", typeof req.body);
      
      const validatedData = insertPackageTypeSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      const packageType = await storage.createPackageType(validatedData);
      res.status(201).json(packageType);
    } catch (error) {
      console.error("Error creating package type:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid package type data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create package type" });
      }
    }
  });

  app.patch("/api/package-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const packageType = await storage.updatePackageType(id, req.body);
      if (!packageType) {
        return res.status(404).json({ error: "Package type not found" });
      }
      res.json(packageType);
    } catch (error) {
      console.error("Error updating package type:", error);
      res.status(500).json({ error: "Failed to update package type" });
    }
  });

  app.delete("/api/package-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePackageType(id);
      if (!success) {
        return res.status(404).json({ error: "Package type not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting package type:", error);
      res.status(500).json({ error: "Failed to delete package type" });
    }
  });

  // Tech Cards routes
  app.get("/api/tech-cards", async (req, res) => {
    try {
      const techCards = await storage.getTechCards();
      res.json(techCards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tech cards" });
    }
  });

  app.get("/api/tech-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const techCard = await storage.getTechCard(id);
      if (!techCard) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.json(techCard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tech card" });
    }
  });

  app.post("/api/tech-cards", async (req, res) => {
    try {
      console.log("Tech card creation request body:", req.body);
      const { steps, materials, ...techCardData } = req.body;
      console.log("Tech card data:", techCardData);
      console.log("Steps:", steps);
      console.log("Materials:", materials);
      
      // Додати інформацію про користувача-творця
      if (req.session && req.session.user) {
        techCardData.createdBy = req.session.user.username || `User ${req.session.user.id}`;
      } else {
        techCardData.createdBy = "System User";
      }
      
      const data = insertTechCardSchema.parse(techCardData);
      console.log("Validated tech card data:", data);
      
      const techCard = await storage.createTechCard(data, steps || [], materials || []);
      console.log("Created tech card:", techCard);
      
      res.status(201).json(techCard);
    } catch (error) {
      console.error("Error creating tech card:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ error: "Invalid tech card data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create tech card" });
      }
    }
  });

  app.patch("/api/tech-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { steps, materials, ...techCardData } = req.body;
      const data = insertTechCardSchema.partial().parse(techCardData);
      const techCard = await storage.updateTechCard(id, data, steps, materials);
      if (!techCard) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.json(techCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid tech card data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update tech card" });
      }
    }
  });

  app.delete("/api/tech-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTechCard(id);
      if (!success) {
        return res.status(404).json({ error: "Tech card not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tech card:", error);
      res.status(500).json({ error: "Failed to delete tech card" });
    }
  });

  // Product Components (BOM) routes
  app.get("/api/products/:id/components", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const components = await storage.getProductComponents(productId);
      res.json(components);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product components" });
    }
  });

  app.post("/api/product-components", async (req, res) => {
    try {
      console.log("POST /api/product-components - Request body:", req.body);
      const data = insertProductComponentSchema.parse(req.body);
      console.log("POST /api/product-components - Parsed data:", data);
      const component = await storage.addProductComponent(data);
      console.log("POST /api/product-components - Created component:", component);
      res.status(201).json(component);
    } catch (error) {
      console.error("POST /api/product-components - Error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create component" });
      }
    }
  });

  app.patch("/api/product-components/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertProductComponentSchema.partial().parse(req.body);
      const component = await storage.updateProductComponent(id, data);
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid component data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update component" });
      }
    }
  });

  app.delete("/api/product-components/:id", async (req, res) => {
    try {
      console.log("DELETE /api/product-components/:id - ID:", req.params.id);
      const id = parseInt(req.params.id);
      console.log("DELETE /api/product-components/:id - Parsed ID:", id);
      const success = await storage.removeProductComponent(id);
      console.log("DELETE /api/product-components/:id - Remove result:", success);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("DELETE /api/product-components/:id - Error:", error);
      res.status(500).json({ error: "Failed to delete component" });
    }
  });

  // Cost Calculations
  app.get("/api/cost-calculations", async (req, res) => {
    try {
      const calculations = await storage.getCostCalculations();
      res.json(calculations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost calculations" });
    }
  });

  app.get("/api/cost-calculations/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const calculation = await storage.getCostCalculation(productId);
      if (!calculation) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cost calculation" });
    }
  });

  app.post("/api/cost-calculations", async (req, res) => {
    try {
      const calculationData = insertCostCalculationSchema.parse(req.body);
      const calculation = await storage.createCostCalculation(calculationData);
      res.status(201).json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid calculation data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create cost calculation" });
      }
    }
  });

  app.put("/api/cost-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculationData = insertCostCalculationSchema.partial().parse(req.body);
      const calculation = await storage.updateCostCalculation(id, calculationData);
      if (!calculation) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid calculation data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update cost calculation" });
      }
    }
  });

  app.delete("/api/cost-calculations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCostCalculation(id);
      if (!success) {
        return res.status(404).json({ error: "Cost calculation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cost calculation" });
    }
  });

  app.post("/api/cost-calculations/calculate/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const calculation = await storage.calculateAutomaticCost(productId);
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate automatic cost" });
    }
  });

  // Material Shortages
  app.get("/api/material-shortages", async (req, res) => {
    try {
      const shortages = await storage.getMaterialShortages();
      res.json(shortages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material shortages" });
    }
  });

  app.get("/api/material-shortages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shortage = await storage.getMaterialShortage(id);
      if (!shortage) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(shortage);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material shortage" });
    }
  });

  app.post("/api/material-shortages", async (req, res) => {
    try {
      const shortageData = insertMaterialShortageSchema.parse(req.body);
      const shortage = await storage.createMaterialShortage(shortageData);
      res.status(201).json(shortage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shortage data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create material shortage" });
      }
    }
  });



  app.patch("/api/material-shortages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shortageData = insertMaterialShortageSchema.partial().parse(req.body);
      const shortage = await storage.updateMaterialShortage(id, shortageData);
      if (!shortage) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(shortage);
    } catch (error: any) {
      console.error('Error in PATCH /api/material-shortages/:id:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shortage data", details: error.errors });
      } else {
        res.status(500).json({ error: error.message || "Failed to update material shortage" });
      }
    }
  });

  app.delete("/api/material-shortages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMaterialShortage(id);
      if (!success) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error in DELETE /api/material-shortages/:id:', error);
      res.status(400).json({ error: error.message || "Failed to delete material shortage" });
    }
  });

  app.post("/api/material-shortages/calculate", async (req, res) => {
    try {
      const shortages = await storage.calculateMaterialShortages();
      res.json(shortages);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate material shortages" });
    }
  });

  app.patch("/api/material-shortages/:id/order", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderResult = await storage.createSupplierOrderFromShortage(id);
      if (!orderResult) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(orderResult);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to order material" });
    }
  });

  // Supplier Orders endpoints
  app.get("/api/supplier-orders", async (_req, res) => {
    try {
      const orders = await storage.getSupplierOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to get supplier orders:", error);
      res.status(500).json({ error: "Failed to get supplier orders" });
    }
  });

  app.get("/api/supplier-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getSupplierOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Supplier order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to get supplier order:", error);
      res.status(500).json({ error: "Failed to get supplier order" });
    }
  });

  app.patch("/api/supplier-orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateSupplierOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Supplier order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to update supplier order status:", error);
      res.status(500).json({ error: "Failed to update supplier order status" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to get suppliers:", error);
      res.status(500).json({ error: "Failed to get suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to get supplier:", error);
      res.status(500).json({ error: "Failed to get supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.updateSupplier(id, req.body);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to update supplier:", error);
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSupplier(id);
      if (!deleted) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Assembly Operations
  app.get("/api/assembly-operations", async (req, res) => {
    try {
      const operations = await storage.getAssemblyOperations();
      res.json(operations);
    } catch (error) {
      console.error("Failed to fetch assembly operations:", error);
      res.status(500).json({ error: "Failed to fetch assembly operations" });
    }
  });

  app.get("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.getAssemblyOperation(id);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Failed to fetch assembly operation:", error);
      res.status(500).json({ error: "Failed to fetch assembly operation" });
    }
  });

  app.post("/api/assembly-operations", async (req, res) => {
    try {
      const operationData = insertAssemblyOperationSchema.parse(req.body);
      const items = req.body.items ? req.body.items.map((item: any) => insertAssemblyOperationItemSchema.parse(item)) : [];
      const operation = await storage.createAssemblyOperation(operationData, items);
      res.status(201).json(operation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid assembly operation data", details: error.errors });
      } else {
        console.error("Failed to create assembly operation:", error);
        res.status(500).json({ error: "Failed to create assembly operation" });
      }
    }
  });

  app.patch("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operationData = insertAssemblyOperationSchema.partial().parse(req.body);
      const operation = await storage.updateAssemblyOperation(id, operationData);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid assembly operation data", details: error.errors });
      } else {
        console.error("Failed to update assembly operation:", error);
        res.status(500).json({ error: "Failed to update assembly operation" });
      }
    }
  });

  app.delete("/api/assembly-operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAssemblyOperation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete assembly operation:", error);
      res.status(500).json({ error: "Failed to delete assembly operation" });
    }
  });

  app.post("/api/assembly-operations/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const operation = await storage.executeAssemblyOperation(id);
      if (!operation) {
        return res.status(404).json({ error: "Assembly operation not found" });
      }
      res.json(operation);
    } catch (error) {
      console.error("Failed to execute assembly operation:", error);
      res.status(500).json({ error: "Failed to execute assembly operation" });
    }
  });

  // Inventory Audits API
  app.get("/api/inventory-audits", async (_req, res) => {
    try {
      const audits = await storage.getInventoryAudits();
      res.json(audits);
    } catch (error) {
      console.error("Failed to get inventory audits:", error);
      res.status(500).json({ error: "Failed to get inventory audits" });
    }
  });

  app.get("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const audit = await storage.getInventoryAudit(id);
      if (!audit) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Failed to get inventory audit:", error);
      res.status(500).json({ error: "Failed to get inventory audit" });
    }
  });

  app.post("/api/inventory-audits", async (req, res) => {
    try {
      // Перетворення рядків дат на об'єкти Date
      const processedData = {
        ...req.body,
        plannedDate: req.body.plannedDate ? new Date(req.body.plannedDate) : undefined,
        // Перетворення значення "0" на null для необов'язкових полів
        warehouseId: req.body.warehouseId === 0 ? null : req.body.warehouseId,
        responsiblePersonId: req.body.responsiblePersonId === 0 ? null : req.body.responsiblePersonId,
      };
      
      const auditData = insertInventoryAuditSchema.parse(processedData);
      const audit = await storage.createInventoryAudit(auditData);
      res.status(201).json(audit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: "Invalid audit data", details: error.errors });
      } else {
        console.error("Failed to create inventory audit:", error);
        res.status(500).json({ error: "Failed to create inventory audit" });
      }
    }
  });

  app.patch("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const auditData = insertInventoryAuditSchema.partial().parse(req.body);
      const audit = await storage.updateInventoryAudit(id, auditData);
      if (!audit) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.json(audit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid audit data", details: error.errors });
      } else {
        console.error("Failed to update inventory audit:", error);
        res.status(500).json({ error: "Failed to update inventory audit" });
      }
    }
  });

  app.delete("/api/inventory-audits/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInventoryAudit(id);
      if (!deleted) {
        return res.status(404).json({ error: "Inventory audit not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete inventory audit:", error);
      res.status(500).json({ error: "Failed to delete inventory audit" });
    }
  });

  // Inventory Audit Items API
  app.get("/api/inventory-audits/:auditId/items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.getInventoryAuditItems(auditId);
      res.json(items);
    } catch (error) {
      console.error("Failed to get inventory audit items:", error);
      res.status(500).json({ error: "Failed to get inventory audit items" });
    }
  });

  app.post("/api/inventory-audits/:auditId/items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      
      // Обробка порожніх рядків для числових полів
      const processedData = {
        ...req.body,
        auditId,
        countedQuantity: req.body.countedQuantity === "" ? null : req.body.countedQuantity,
        variance: req.body.variance === "" ? null : req.body.variance,
      };
      
      const itemData = insertInventoryAuditItemSchema.parse(processedData);
      const item = await storage.createInventoryAuditItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid audit item data", details: error.errors });
      } else {
        console.error("Failed to create inventory audit item:", error);
        res.status(500).json({ error: "Failed to create inventory audit item" });
      }
    }
  });

  app.patch("/api/inventory-audit-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = insertInventoryAuditItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryAuditItem(id, itemData);
      if (!item) {
        return res.status(404).json({ error: "Inventory audit item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid audit item data", details: error.errors });
      } else {
        console.error("Failed to update inventory audit item:", error);
        res.status(500).json({ error: "Failed to update inventory audit item" });
      }
    }
  });

  app.delete("/api/inventory-audit-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInventoryAuditItem(id);
      if (!deleted) {
        return res.status(404).json({ error: "Inventory audit item not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete inventory audit item:", error);
      res.status(500).json({ error: "Failed to delete inventory audit item" });
    }
  });

  app.post("/api/inventory-audits/:auditId/generate-items", async (req, res) => {
    try {
      const auditId = parseInt(req.params.auditId);
      const items = await storage.generateInventoryAuditItems(auditId);
      res.json(items);
    } catch (error) {
      console.error("Failed to generate inventory audit items:", error);
      res.status(500).json({ error: "Failed to generate inventory audit items" });
    }
  });

  // Workers
  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Failed to get workers:", error);
      res.status(500).json({ error: "Failed to get workers" });
    }
  });

  app.get("/api/workers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const worker = await storage.getWorker(id);
      if (worker) {
        res.json(worker);
      } else {
        res.status(404).json({ error: "Worker not found" });
      }
    } catch (error) {
      console.error("Failed to get worker:", error);
      res.status(500).json({ error: "Failed to get worker" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const workerData = insertWorkerSchema.parse(req.body);
      const worker = await storage.createWorker(workerData);
      res.json(worker);
    } catch (error) {
      console.error("Failed to create worker:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid worker data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create worker" });
      }
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating worker with data:", req.body);
      const workerData = insertWorkerSchema.partial().parse(req.body);
      console.log("Parsed worker data:", workerData);
      const worker = await storage.updateWorker(id, workerData);
      if (worker) {
        res.json(worker);
      } else {
        res.status(404).json({ error: "Worker not found" });
      }
    } catch (error) {
      console.error("Failed to update worker:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid worker data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update worker" });
      }
    }
  });

  app.delete("/api/workers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorker(id);
      if (!success) {
        res.status(404).json({ error: "Worker not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete worker:", error);
      res.status(500).json({ error: "Failed to delete worker" });
    }
  });

  // Production Forecasts API
  app.get("/api/production-forecasts", async (req, res) => {
    try {
      const forecasts = await storage.getProductionForecasts();
      res.json(forecasts);
    } catch (error) {
      console.error("Failed to get production forecasts:", error);
      res.status(500).json({ error: "Failed to get production forecasts" });
    }
  });

  app.get("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const forecast = await storage.getProductionForecast(id);
      if (!forecast) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.json(forecast);
    } catch (error) {
      console.error("Failed to get production forecast:", error);
      res.status(500).json({ error: "Failed to get production forecast" });
    }
  });

  app.post("/api/production-forecasts", async (req, res) => {
    try {
      // Convert date strings to Date objects
      const bodyWithDates = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      
      const forecastData = insertProductionForecastSchema.parse(bodyWithDates);
      const forecast = await storage.createProductionForecast(forecastData);
      res.status(201).json(forecast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        res.status(400).json({ error: "Invalid forecast data", details: error.errors });
      } else {
        console.error("Failed to create production forecast:", error);
        res.status(500).json({ error: "Failed to create production forecast" });
      }
    }
  });

  app.patch("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const forecastData = insertProductionForecastSchema.partial().parse(req.body);
      const forecast = await storage.updateProductionForecast(id, forecastData);
      if (!forecast) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.json(forecast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid forecast data", details: error.errors });
      } else {
        console.error("Failed to update production forecast:", error);
        res.status(500).json({ error: "Failed to update production forecast" });
      }
    }
  });

  app.delete("/api/production-forecasts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProductionForecast(id);
      if (!deleted) {
        return res.status(404).json({ error: "Production forecast not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete production forecast:", error);
      res.status(500).json({ error: "Failed to delete production forecast" });
    }
  });

  // Warehouse Transfers API
  app.get("/api/warehouse-transfers", async (req, res) => {
    try {
      const transfers = await storage.getWarehouseTransfers();
      res.json(transfers);
    } catch (error) {
      console.error("Failed to get warehouse transfers:", error);
      res.status(500).json({ error: "Failed to get warehouse transfers" });
    }
  });

  app.get("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transfer = await storage.getWarehouseTransfer(id);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Failed to get warehouse transfer:", error);
      res.status(500).json({ error: "Failed to get warehouse transfer" });
    }
  });

  app.post("/api/warehouse-transfers", async (req, res) => {
    try {
      const transferData = insertWarehouseTransferSchema.parse(req.body);
      const transfer = await storage.createWarehouseTransfer(transferData);
      res.status(201).json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transfer data", details: error.errors });
      } else {
        console.error("Failed to create warehouse transfer:", error);
        res.status(500).json({ error: "Failed to create warehouse transfer" });
      }
    }
  });

  app.patch("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertWarehouseTransferSchema.partial().parse(req.body);
      const transfer = await storage.updateWarehouseTransfer(id, updateData);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transfer data", details: error.errors });
      } else {
        console.error("Failed to update warehouse transfer:", error);
        res.status(500).json({ error: "Failed to update warehouse transfer" });
      }
    }
  });

  app.delete("/api/warehouse-transfers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteWarehouseTransfer(id);
      if (!deleted) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete warehouse transfer:", error);
      res.status(500).json({ error: "Failed to delete warehouse transfer" });
    }
  });

  app.post("/api/warehouse-transfers/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transfer = await storage.executeWarehouseTransfer(id);
      if (!transfer) {
        return res.status(404).json({ error: "Warehouse transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Failed to execute warehouse transfer:", error);
      res.status(500).json({ error: "Failed to execute warehouse transfer" });
    }
  });

  // Positions API
  app.get("/api/positions", async (req, res) => {
    try {
      // Агресивні заголовки для запобігання кешуванню
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Last-Modified', new Date().toUTCString());
      res.set('ETag', `"${Date.now()}"`);
      
      const positions = await storage.getPositions();
      console.log(`GET /api/positions - Found ${positions.length} positions at ${new Date().toISOString()}`);
      res.json(positions);
    } catch (error) {
      console.error("Failed to get positions:", error);
      res.status(500).json({ error: "Failed to get positions" });
    }
  });

  app.get("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.getPosition(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(position);
    } catch (error) {
      console.error("Failed to get position:", error);
      res.status(500).json({ error: "Failed to get position" });
    }
  });

  app.post("/api/positions", async (req, res) => {
    console.log("=== POST /api/positions STARTED ===");
    console.log("Raw request body:", req.body);
    console.log("Request headers:", req.headers);
    
    try {
      console.log("POST /api/positions - Received data:", req.body);
      
      // Запобігаємо кешуванню
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const positionData = insertPositionSchema.parse(req.body);
      console.log("POST /api/positions - Parsed data:", positionData);
      
      const position = await storage.createPosition(positionData);
      console.log("POST /api/positions - Created position:", position);
      
      res.status(201).json(position);
      console.log("=== POST /api/positions COMPLETED ===");
    } catch (error) {
      console.log("=== POST /api/positions ERROR ===");
      if (error instanceof z.ZodError) {
        console.error("POST /api/positions - Validation error:", error.errors);
        res.status(400).json({ error: "Invalid position data", details: error.errors });
      } else {
        console.error("Failed to create position:", error);
        res.status(500).json({ error: "Failed to create position" });
      }
    }
  });

  app.patch("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`PATCH /api/positions/${id} - Received data:`, req.body);
      
      // Запобігаємо кешуванню
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const updateData = insertPositionSchema.partial().parse(req.body);
      console.log(`PATCH /api/positions/${id} - Parsed data:`, updateData);
      
      const position = await storage.updatePosition(id, updateData);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      
      console.log(`PATCH /api/positions/${id} - Updated position:`, position);
      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`PATCH /api/positions/${req.params.id} - Validation error:`, error.errors);
        res.status(400).json({ error: "Invalid position data", details: error.errors });
      } else {
        console.error("Failed to update position:", error);
        res.status(500).json({ error: "Failed to update position" });
      }
    }
  });

  app.delete("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePosition(id);
      if (!deleted) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete position:", error);
      res.status(500).json({ error: "Failed to delete position" });
    }
  });

  // Departments
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error("Failed to get departments:", error);
      res.status(500).json({ error: "Failed to get departments" });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      console.error("Failed to get department:", error);
      res.status(500).json({ error: "Failed to get department" });
    }
  });

  app.post("/api/departments", async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid department data", details: error.errors });
      } else {
        console.error("Failed to create department:", error);
        res.status(500).json({ error: "Failed to create department" });
      }
    }
  });

  app.put("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const departmentData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, departmentData);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid department data", details: error.errors });
      } else {
        console.error("Failed to update department:", error);
        res.status(500).json({ error: "Failed to update department" });
      }
    }
  });

  app.delete("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDepartment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete department:", error);
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Soldering Types API
  app.get("/api/soldering-types", async (req, res) => {
    try {
      const solderingTypes = await storage.getSolderingTypes();
      res.json(solderingTypes);
    } catch (error) {
      console.error("Failed to get soldering types:", error);
      res.status(500).json({ error: "Failed to get soldering types" });
    }
  });

  app.post("/api/soldering-types", async (req, res) => {
    try {
      console.log("Raw body:", req.body);
      console.log("Body type:", typeof req.body);
      
      const validatedData = insertSolderingTypeSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      const solderingType = await storage.createSolderingType(validatedData);
      res.status(201).json(solderingType);
    } catch (error) {
      console.error("Error creating soldering type:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid soldering type data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create soldering type" });
      }
    }
  });

  app.get("/api/soldering-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const solderingType = await storage.getSolderingType(id);
      if (!solderingType) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json(solderingType);
    } catch (error) {
      console.error("Failed to get soldering type:", error);
      res.status(500).json({ error: "Failed to get soldering type" });
    }
  });

  app.patch("/api/soldering-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const solderingTypeData = insertSolderingTypeSchema.partial().parse(req.body);
      const solderingType = await storage.updateSolderingType(id, solderingTypeData);
      if (!solderingType) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json(solderingType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid soldering type data", details: error.errors });
      } else {
        console.error("Failed to update soldering type:", error);
        res.status(500).json({ error: "Failed to update soldering type" });
      }
    }
  });

  app.delete("/api/soldering-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSolderingType(id);
      if (!deleted) {
        return res.status(404).json({ error: "Soldering type not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete soldering type:", error);
      res.status(500).json({ error: "Failed to delete soldering type" });
    }
  });

  // Units routes
  app.get("/api/units", async (req, res) => {
    try {
      const units = await storage.getUnits();
      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ error: "Failed to fetch units" });
    }
  });

  app.post("/api/units", async (req, res) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error) {
      console.error("Error creating unit:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create unit" });
      }
    }
  });

  app.patch("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertUnitSchema.partial().parse(req.body);
      const unit = await storage.updateUnit(id, validatedData);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid unit data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update unit" });
      }
    }
  });

  app.delete("/api/units/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUnit(id);
      if (!success) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });

  // Shipments API
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      console.error("Failed to get shipments:", error);
      res.status(500).json({ error: "Failed to get shipments" });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shipment = await storage.getShipment(id);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Failed to get shipment:", error);
      res.status(500).json({ error: "Failed to get shipment" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      console.log("Creating shipment with data:", JSON.stringify(req.body, null, 2));
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Shipment validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        console.error("Failed to create shipment:", error);
        res.status(500).json({ error: "Failed to create shipment" });
      }
    }
  });

  app.patch("/api/shipments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shipmentData = insertShipmentSchema.partial().parse(req.body);
      const shipment = await storage.updateShipment(id, shipmentData);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      } else {
        console.error("Failed to update shipment:", error);
        res.status(500).json({ error: "Failed to update shipment" });
      }
    }
  });

  app.patch("/api/shipments/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const shipment = await storage.updateShipmentStatus(id, status);
      if (!shipment) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipment);
    } catch (error) {
      console.error("Failed to update shipment status:", error);
      res.status(500).json({ error: "Failed to update shipment status" });
    }
  });

  app.delete("/api/shipments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShipment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete shipment:", error);
      res.status(500).json({ error: "Failed to delete shipment" });
    }
  });

  // Carriers routes
  app.get('/api/carriers', async (req, res) => {
    try {
      const carriers = await storage.getCarriers();
      res.json(carriers);
    } catch (error) {
      console.error('Failed to get carriers:', error);
      res.status(500).json({ error: 'Failed to get carriers' });
    }
  });

  app.get('/api/carriers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const carrier = await storage.getCarrier(id);
      if (!carrier) {
        return res.status(404).json({ error: 'Carrier not found' });
      }
      res.json(carrier);
    } catch (error) {
      console.error('Failed to get carrier:', error);
      res.status(500).json({ error: 'Failed to get carrier' });
    }
  });

  app.post('/api/carriers', async (req, res) => {
    try {
      const carrier = await storage.createCarrier(req.body);
      res.status(201).json(carrier);
    } catch (error) {
      console.error('Failed to create carrier:', error);
      res.status(500).json({ error: 'Failed to create carrier' });
    }
  });

  app.patch('/api/carriers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const carrier = await storage.updateCarrier(id, req.body);
      if (!carrier) {
        return res.status(404).json({ error: 'Carrier not found' });
      }
      res.json(carrier);
    } catch (error) {
      console.error('Failed to update carrier:', error);
      res.status(500).json({ error: 'Failed to update carrier' });
    }
  });

  app.delete('/api/carriers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCarrier(id);
      if (!success) {
        return res.status(404).json({ error: 'Carrier not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete carrier:', error);
      res.status(500).json({ error: 'Failed to delete carrier' });
    }
  });

  // Sync carrier data with Nova Poshta API
  app.post('/api/carriers/:id/sync', async (req, res) => {
    try {
      const carrierId = parseInt(req.params.id);
      
      // Get carrier with API key
      const carrier = await storage.getCarrier(carrierId);
      if (!carrier) {
        return res.status(404).json({ error: 'Carrier not found' });
      }

      if (!carrier.apiKey) {
        return res.status(400).json({ error: 'API key not configured for this carrier' });
      }

      // Update cache with new API key and sync data
      await novaPoshtaCache.updateApiKey(carrier.apiKey);
      await novaPoshtaCache.syncData();
      
      // Get updated counts
      const citiesCount = await novaPoshtaCache.getCitiesCount();
      const warehousesCount = await novaPoshtaCache.getWarehousesCount();
      
      // Update carrier with sync statistics
      const updatedCarrier = await storage.updateCarrier(carrierId, {
        citiesCount,
        warehousesCount, 
        lastSyncAt: new Date()
      });

      res.json({ 
        success: true,
        citiesCount,
        warehousesCount,
        lastSyncAt: updatedCarrier?.lastSyncAt
      });
    } catch (error) {
      console.error('Failed to sync carrier data:', error);
      res.status(500).json({ error: 'Failed to sync carrier data' });
    }
  });

  // Nova Poshta API integration routes (з кешуванням)
  app.get("/api/nova-poshta/cities", async (req, res) => {
    try {
      const { q } = req.query;
      const cities = await novaPoshtaCache.getCities(q as string || "");
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.get("/api/nova-poshta/warehouses/:cityRef", async (req, res) => {
    try {
      const { cityRef } = req.params;
      const warehouses = await novaPoshtaCache.getWarehouses(cityRef);
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ error: "Failed to fetch warehouses" });
    }
  });

  app.post("/api/nova-poshta/calculate-delivery", async (req, res) => {
    try {
      console.log("Calculate delivery request body:", req.body);
      const deliveryCost = await novaPoshtaApi.calculateDeliveryCost(req.body);
      console.log("Nova Poshta API response:", deliveryCost);
      res.json(deliveryCost);
    } catch (error) {
      console.error("Error calculating delivery cost:", error);
      res.status(500).json({ error: "Failed to calculate delivery cost" });
    }
  });

  app.get("/api/nova-poshta/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const trackingInfo = await novaPoshtaApi.trackDocument(trackingNumber);
      res.json(trackingInfo);
    } catch (error) {
      console.error("Error tracking document:", error);
      res.status(500).json({ error: "Failed to track document" });
    }
  });

  app.post("/api/nova-poshta/track-multiple", async (req, res) => {
    try {
      const { trackingNumbers } = req.body;
      const trackingInfos = await novaPoshtaApi.trackMultipleDocuments(trackingNumbers);
      res.json(trackingInfos);
    } catch (error) {
      console.error("Error tracking multiple documents:", error);
      res.status(500).json({ error: "Failed to track documents" });
    }
  });

  app.post("/api/nova-poshta/create-invoice", async (req, res) => {
    console.log('=== Nova Poshta create invoice endpoint hit ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body raw:', req.body);
    console.log('Request body stringified:', JSON.stringify(req.body, null, 2));
    
    try {

      const {
        cityRecipient,
        warehouseRecipient,
        recipientName,
        recipientPhone,
        recipientType,
        description,
        weight,
        cost,
        seatsAmount,
        paymentMethod,
        payerType
      } = req.body;

      // Форматуємо номер телефону для Nova Poshta API (має бути у форматі +380XXXXXXXXX)
      let formattedPhone = '';
      if (recipientPhone) {
        formattedPhone = recipientPhone.replace(/\D/g, ''); // Видаляємо всі нецифрові символи
      } else {
        console.log('Warning: recipientPhone is undefined');
        return res.status(400).json({ error: "Номер телефону отримувача обов'язковий" });
      }
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '38' + formattedPhone; // Замінюємо 0 на 38
      }
      if (!formattedPhone.startsWith('38')) {
        formattedPhone = '38' + formattedPhone; // Додаємо 38 якщо відсутній
      }

      const {
        citySender,
        warehouseSender,
        senderName,
        senderPhone,
        orderId
      } = req.body;

      const invoiceData = {
        cityRecipient,
        warehouseRecipient,
        citySender: citySender || 'db5c897c-391c-11dd-90d9-001a92567626', // Чернігів за замовчуванням
        warehouseSender: warehouseSender || 'fe906167-4c37-11ec-80ed-b8830365bd14', // Відділення за замовчуванням
        senderName: senderName || 'Ваша компанія',
        senderPhone: senderPhone || '+380501234567',
        recipientName,
        recipientPhone: formattedPhone,
        recipientType: recipientType || 'Organization',
        description: description || 'Товар',
        weight: parseFloat(weight),
        cost: parseFloat(cost),
        seatsAmount: parseInt(seatsAmount) || 1,
        paymentMethod: paymentMethod || 'NonCash',
        payerType: payerType || 'Recipient'
      };

      // Використовуємо API ключ з environment variables
      const apiKey = process.env.NOVA_POSHTA_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "Nova Poshta API ключ не налаштований" 
        });
      }

      // Отримуємо деталі замовлення для опису відправлення
      let orderDescription = 'Товар';
      console.log('Order ID for description:', orderId);
      
      if (orderId) {
        try {
          const order = await storage.getOrder(parseInt(orderId));
          console.log('Found order for description:', order);
          
          if (order && order.items && order.items.length > 0) {
            const itemNames = order.items.map(item => {
              console.log('Processing item:', item);
              return item.product?.name || 'Товар';
            }).join(', ');
            orderDescription = itemNames.length > 100 ? itemNames.substring(0, 97) + '...' : itemNames;
            console.log('Generated order description:', orderDescription);
          } else {
            console.log('Order has no items or order not found');
          }
        } catch (error) {
          console.error('Error getting order details for description:', error);
        }
      } else {
        console.log('No order ID provided');
      }

      // Використовуємо опис з позицій замовлення
      invoiceData.description = orderDescription;

      // Оновлюємо API ключ в Nova Poshta API
      console.log('Using Nova Poshta API key exists:', !!apiKey);
      novaPoshtaApi.updateApiKey(apiKey);

      console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2));
      const invoice = await novaPoshtaApi.createInternetDocument(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Customer Addresses routes
  app.get('/api/customer-addresses', async (req, res) => {
    try {
      const addresses = await storage.getCustomerAddresses();
      res.json(addresses);
    } catch (error) {
      console.error('Failed to get customer addresses:', error);
      res.status(500).json({ error: 'Failed to get customer addresses' });
    }
  });

  app.get('/api/customer-addresses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.getCustomerAddress(id);
      if (!address) {
        return res.status(404).json({ error: 'Customer address not found' });
      }
      res.json(address);
    } catch (error) {
      console.error('Failed to get customer address:', error);
      res.status(500).json({ error: 'Failed to get customer address' });
    }
  });

  app.post('/api/customer-addresses', async (req, res) => {
    try {
      const address = await storage.createCustomerAddress(req.body);
      res.status(201).json(address);
    } catch (error) {
      console.error('Failed to create customer address:', error);
      res.status(500).json({ error: 'Failed to create customer address' });
    }
  });

  app.post('/api/customer-addresses/save', async (req, res) => {
    try {
      const addressData = req.body;
      
      // Перевіряємо чи існує подібна адреса
      const existingAddress = await storage.findCustomerAddressByDetails(
        addressData.customerName,
        addressData.cityName,
        addressData.warehouseAddress
      );

      if (existingAddress) {
        // Оновлюємо існуючу адресу (збільшуємо лічильник використань і оновлюємо дату)
        // Також оновлюємо carrier_id якщо він переданий
        let updatedAddress = await storage.updateCustomerAddressUsage(existingAddress.id);
        if (addressData.carrierId && addressData.carrierId !== existingAddress.carrierId) {
          updatedAddress = await storage.updateCustomerAddress(existingAddress.id, {
            carrierId: addressData.carrierId
          });
        }
        res.json(updatedAddress);
      } else {
        // Створюємо нову адресу з carrier_id
        const newAddress = await storage.createCustomerAddress(addressData);
        res.status(201).json(newAddress);
      }
    } catch (error) {
      console.error('Failed to save customer address:', error);
      res.status(500).json({ error: 'Failed to save customer address' });
    }
  });

  app.patch('/api/customer-addresses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.updateCustomerAddress(id, req.body);
      if (!address) {
        return res.status(404).json({ error: 'Customer address not found' });
      }
      res.json(address);
    } catch (error) {
      console.error('Failed to update customer address:', error);
      res.status(500).json({ error: 'Failed to update customer address' });
    }
  });

  app.delete('/api/customer-addresses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCustomerAddress(id);
      if (!success) {
        return res.status(404).json({ error: 'Customer address not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete customer address:', error);
      res.status(500).json({ error: 'Failed to delete customer address' });
    }
  });

  app.post('/api/customer-addresses/:id/set-default', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.setDefaultCustomerAddress(id);
      if (!success) {
        return res.status(404).json({ error: 'Customer address not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to set default customer address:', error);
      res.status(500).json({ error: 'Failed to set default customer address' });
    }
  });

  // Sender Settings routes
  app.get('/api/sender-settings', async (req, res) => {
    try {
      const settings = await storage.getSenderSettings();
      res.json(settings);
    } catch (error) {
      console.error('Failed to get sender settings:', error);
      res.status(500).json({ error: 'Failed to get sender settings' });
    }
  });

  app.get('/api/sender-settings/default', async (req, res) => {
    try {
      const defaultSetting = await storage.getDefaultSenderSetting();
      res.json(defaultSetting);
    } catch (error) {
      console.error('Failed to get default sender setting:', error);
      res.status(500).json({ error: 'Failed to get default sender setting' });
    }
  });

  app.get('/api/sender-settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await storage.getSenderSetting(id);
      if (!setting) {
        return res.status(404).json({ error: 'Sender setting not found' });
      }
      res.json(setting);
    } catch (error) {
      console.error('Failed to get sender setting:', error);
      res.status(500).json({ error: 'Failed to get sender setting' });
    }
  });

  app.post('/api/sender-settings', async (req, res) => {
    try {
      const setting = await storage.createSenderSetting(req.body);
      res.status(201).json(setting);
    } catch (error) {
      console.error('Failed to create sender setting:', error);
      res.status(500).json({ error: 'Failed to create sender setting' });
    }
  });

  app.patch('/api/sender-settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await storage.updateSenderSetting(id, req.body);
      if (!setting) {
        return res.status(404).json({ error: 'Sender setting not found' });
      }
      res.json(setting);
    } catch (error) {
      console.error('Failed to update sender setting:', error);
      res.status(500).json({ error: 'Failed to update sender setting' });
    }
  });

  app.delete('/api/sender-settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSenderSetting(id);
      if (!success) {
        return res.status(404).json({ error: 'Sender setting not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete sender setting:', error);
      res.status(500).json({ error: 'Failed to delete sender setting' });
    }
  });

  app.post('/api/sender-settings/:id/set-default', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.setDefaultSenderSetting(id);
      if (!success) {
        return res.status(404).json({ error: 'Sender setting not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to set default sender setting:', error);
      res.status(500).json({ error: 'Failed to set default sender setting' });
    }
  });

  // Currency routes
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getCurrencies();
      res.json(currencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ error: "Failed to get currencies" });
    }
  });

  app.get("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currency = await storage.getCurrency(id);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error fetching currency:", error);
      res.status(500).json({ error: "Failed to get currency" });
    }
  });

  app.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      console.error("Error creating currency:", error);
      res.status(500).json({ error: "Failed to create currency" });
    }
  });

  app.patch("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyData = insertCurrencySchema.partial().parse(req.body);
      const currency = await storage.updateCurrency(id, currencyData);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ error: "Failed to update currency" });
    }
  });

  app.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurrency(id);
      if (!success) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting currency:", error);
      res.status(500).json({ error: "Failed to delete currency" });
    }
  });

  app.post("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(id);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Error setting base currency:", error);
      res.status(500).json({ error: "Failed to set base currency" });
    }
  });



  // Видалено exchange-rates API - використовуємо currency-rates замість них

  // Production analytics routes
  app.get("/api/production/analytics", async (req, res) => {
    try {
      const { from, to, department, worker } = req.query;
      const analytics = await storage.getProductionAnalytics({
        from: from as string,
        to: to as string,
        department: department as string,
        worker: worker as string,
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching production analytics:", error);
      res.status(500).json({ error: "Failed to get production analytics" });
    }
  });

  app.get("/api/production/workload", async (req, res) => {
    try {
      const { from, to } = req.query;
      const workload = await storage.getProductionWorkload({
        from: from as string,
        to: to as string,
      });
      res.json(workload);
    } catch (error) {
      console.error("Error fetching production workload:", error);
      res.status(500).json({ error: "Failed to get production workload" });
    }
  });

  app.get("/api/production/efficiency", async (req, res) => {
    try {
      const { from, to, department } = req.query;
      const efficiency = await storage.getProductionEfficiency({
        from: from as string,
        to: to as string,
        department: department as string,
      });
      res.json(efficiency);
    } catch (error) {
      console.error("Error fetching production efficiency:", error);
      res.status(500).json({ error: "Failed to get production efficiency" });
    }
  });

  // Ordered Products Info API
  app.get("/api/ordered-products-info", async (req, res) => {
    try {
      const orderedProducts = await storage.getOrderedProductsInfo();
      res.json(orderedProducts);
    } catch (error) {
      console.error("Failed to get ordered products info:", error);
      res.status(500).json({ error: "Failed to get ordered products info" });
    }
  });

  app.post("/api/send-to-production", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const task = await storage.createProductionTaskFromOrder(productId, quantity, notes);
      res.json(task);
    } catch (error) {
      console.error("Failed to send to production:", error);
      res.status(500).json({ error: "Failed to send to production" });
    }
  });

  app.post("/api/complete-order", async (req, res) => {
    try {
      const { productId, quantity, warehouseId } = req.body;
      const result = await storage.completeProductOrder(productId, quantity, warehouseId);
      res.json(result);
    } catch (error) {
      console.error("Failed to complete order:", error);
      res.status(500).json({ error: "Failed to complete order" });
    }
  });

  app.delete("/api/ordered-products/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const result = await storage.deleteOrderedProduct(productId);
      res.json(result);
    } catch (error) {
      console.error("Failed to delete ordered product:", error);
      res.status(500).json({ error: "Failed to delete ordered product" });
    }
  });

  app.get("/api/orders-by-product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const orders = await storage.getOrdersByProduct(productId);
      res.json(orders);
    } catch (error) {
      console.error("Failed to get orders by product:", error);
      res.status(500).json({ error: "Failed to get orders by product" });
    }
  });

  app.post("/api/create-supplier-order-for-shortage", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const order = await storage.createSupplierOrderForShortage(productId, quantity, notes);
      res.json(order);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });

  app.get("/api/manufacturing-orders", async (req, res) => {
    try {
      const orders = await storage.getManufacturingOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to get manufacturing orders:", error);
      res.status(500).json({ error: "Failed to get manufacturing orders" });
    }
  });

  app.get("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getManufacturingOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to get manufacturing order:", error);
      res.status(500).json({ error: "Failed to get manufacturing order" });
    }
  });

  app.post("/api/manufacturing-orders", async (req, res) => {
    try {
      console.log("🟡 ROUTE: POST /api/manufacturing-orders called with body:", req.body);
      
      const orderData = insertManufacturingOrderSchema.parse(req.body);
      console.log("🟡 ROUTE: Zod validation passed, calling storage.createManufacturingOrder");
      
      const order = await storage.createManufacturingOrder(orderData);
      console.log("🟢 ROUTE: Order created successfully:", order);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("🔴 ROUTE: Zod validation failed:", error.errors);
        res.status(400).json({ error: "Invalid manufacturing order data", details: error.errors });
      } else {
        console.error("🔴 ROUTE: Failed to create manufacturing order:", error);
        res.status(500).json({ error: "Failed to create manufacturing order" });
      }
    }
  });

  app.patch("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertManufacturingOrderSchema.partial().parse(req.body);
      const order = await storage.updateManufacturingOrder(id, updateData);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing order data", details: error.errors });
      } else {
        console.error("Failed to update manufacturing order:", error);
        res.status(500).json({ error: "Failed to update manufacturing order" });
      }
    }
  });

  app.delete("/api/manufacturing-orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteManufacturingOrder(id);
      if (!deleted) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete manufacturing order:", error);
      res.status(500).json({ error: "Failed to delete manufacturing order" });
    }
  });

  // Запуск виробництва
  app.post("/api/manufacturing-orders/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.startManufacturing(id);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      
      // Автоматично генеруємо серійні номери при запуску виробництва
      await storage.generateSerialNumbers(id);
      
      res.json(order);
    } catch (error) {
      console.error("Failed to start manufacturing:", error);
      res.status(500).json({ error: "Failed to start manufacturing" });
    }
  });

  // Зупинка виробництва
  app.post("/api/manufacturing-orders/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Stopping manufacturing order:", id);
      const order = await storage.stopManufacturing(id);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      console.log("Manufacturing stopped successfully:", order);
      res.json(order);
    } catch (error) {
      console.error("Failed to stop manufacturing:", error);
      res.status(500).json({ error: "Failed to stop manufacturing" });
    }
  });

  // Генерація серійних номерів
  app.get("/api/manufacturing-orders/:id/generate-serial-numbers", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Generating serial numbers for order:", id);
      const serialNumbers = await storage.generateSerialNumbers(id);
      if (!serialNumbers) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      console.log("Serial numbers generated successfully:", serialNumbers);
      res.json({ serialNumbers });
    } catch (error) {
      console.error("Failed to generate serial numbers:", error);
      res.status(500).json({ error: "Failed to generate serial numbers" });
    }
  });

  // Завершення виробництва
  app.post("/api/manufacturing-orders/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { producedQuantity, qualityRating, notes } = req.body;
      const order = await storage.completeManufacturing(id, producedQuantity, qualityRating, notes);
      if (!order) {
        return res.status(404).json({ error: "Manufacturing order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to complete manufacturing:", error);
      res.status(500).json({ error: "Failed to complete manufacturing" });
    }
  });

  // Manufacturing Steps API
  app.get("/api/manufacturing-orders/:id/steps", async (req, res) => {
    try {
      const manufacturingOrderId = parseInt(req.params.id);
      const steps = await storage.getManufacturingSteps(manufacturingOrderId);
      res.json(steps);
    } catch (error) {
      console.error("Failed to get manufacturing steps:", error);
      res.status(500).json({ error: "Failed to get manufacturing steps" });
    }
  });

  app.post("/api/manufacturing-steps", async (req, res) => {
    try {
      const stepData = insertManufacturingStepSchema.parse(req.body);
      const step = await storage.createManufacturingStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing step data", details: error.errors });
      } else {
        console.error("Failed to create manufacturing step:", error);
        res.status(500).json({ error: "Failed to create manufacturing step" });
      }
    }
  });

  app.patch("/api/manufacturing-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertManufacturingStepSchema.partial().parse(req.body);
      const step = await storage.updateManufacturingStep(id, updateData);
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid manufacturing step data", details: error.errors });
      } else {
        console.error("Failed to update manufacturing step:", error);
        res.status(500).json({ error: "Failed to update manufacturing step" });
      }
    }
  });

  // Запуск конкретного кроку виробництва
  app.post("/api/manufacturing-steps/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = await storage.startManufacturingStep(id);
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      console.error("Failed to start manufacturing step:", error);
      res.status(500).json({ error: "Failed to start manufacturing step" });
    }
  });

  // Завершення конкретного кроку виробництва
  app.post("/api/manufacturing-steps/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { qualityCheckPassed, notes } = req.body;
      const step = await storage.completeManufacturingStep(id, { qualityCheckPassed, notes });
      if (!step) {
        return res.status(404).json({ error: "Manufacturing step not found" });
      }
      res.json(step);
    } catch (error) {
      console.error("Failed to complete manufacturing step:", error);
      res.status(500).json({ error: "Failed to complete manufacturing step" });
    }
  });

  // Order completion and supplier order creation endpoints
  app.post("/api/complete-order", async (req, res) => {
    try {
      const { productId, quantity, warehouseId } = req.body;
      const result = await storage.completeOrderFromStock(productId, quantity, warehouseId);
      res.json(result);
    } catch (error) {
      console.error("Failed to complete order:", error);
      res.status(500).json({ error: "Failed to complete order from stock" });
    }
  });

  app.post("/api/create-supplier-order-for-shortage", async (req, res) => {
    try {
      const { productId, quantity, notes } = req.body;
      const result = await storage.createSupplierOrderForShortage(productId, quantity, notes);
      res.json(result);
    } catch (error) {
      console.error("Failed to create supplier order:", error);
      res.status(500).json({ error: "Failed to create supplier order" });
    }
  });

  // Serial Numbers API routes
  app.get("/api/serial-numbers", async (req, res) => {
    try {
      const { productId, warehouseId } = req.query;
      const serialNumbers = await storage.getSerialNumbers(
        productId ? parseInt(productId as string) : undefined,
        warehouseId ? parseInt(warehouseId as string) : undefined
      );
      res.json(serialNumbers);
    } catch (error) {
      console.error("Error fetching serial numbers:", error);
      res.status(500).json({ error: "Failed to fetch serial numbers" });
    }
  });

  app.get("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serialNumber = await storage.getSerialNumber(id);
      if (!serialNumber) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json(serialNumber);
    } catch (error) {
      console.error("Error fetching serial number:", error);
      res.status(500).json({ error: "Failed to fetch serial number" });
    }
  });

  app.post("/api/serial-numbers", async (req, res) => {
    try {
      const serialNumberData = insertSerialNumberSchema.parse(req.body);
      const serialNumber = await storage.createSerialNumber(serialNumberData);
      res.status(201).json(serialNumber);
    } catch (error) {
      console.error("Error creating serial number:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid serial number data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create serial number" });
      }
    }
  });

  app.put("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serialNumberData = insertSerialNumberSchema.partial().parse(req.body);
      const serialNumber = await storage.updateSerialNumber(id, serialNumberData);
      if (!serialNumber) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json(serialNumber);
    } catch (error) {
      console.error("Error updating serial number:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid serial number data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number" });
      }
    }
  });

  app.delete("/api/serial-numbers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSerialNumber(id);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting serial number:", error);
      res.status(500).json({ error: "Failed to delete serial number" });
    }
  });

  app.get("/api/serial-numbers/available/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const serialNumbers = await storage.getAvailableSerialNumbers(productId);
      res.json(serialNumbers);
    } catch (error) {
      console.error("Error fetching available serial numbers:", error);
      res.status(500).json({ error: "Failed to fetch available serial numbers" });
    }
  });

  app.patch("/api/serial-numbers/:id/reserve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { orderId } = req.body;
      const success = await storage.reserveSerialNumber(id, orderId);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found or already reserved" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reserving serial number:", error);
      res.status(500).json({ error: "Failed to reserve serial number" });
    }
  });

  app.patch("/api/serial-numbers/:id/release", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.releaseSerialNumber(id);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error releasing serial number:", error);
      res.status(500).json({ error: "Failed to release serial number" });
    }
  });

  // Auto-generate serial number
  app.post("/api/serial-numbers/generate", async (req, res) => {
    try {
      const { productId, categoryId, template } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      // Динамічний імпорт для уникнення проблем з компіляцією
      const { serialNumberGenerator } = await import("./serial-number-generator");
      
      const serialNumber = await serialNumberGenerator.generateUniqueSerialNumber({
        productId: parseInt(productId),
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        template
      });

      res.json({ serialNumber });
    } catch (error) {
      console.error("Error generating serial number:", error);
      res.status(500).json({ error: "Failed to generate serial number" });
    }
  });

  // Serial number settings API
  app.get("/api/serial-number-settings", async (req, res) => {
    try {
      const settings = await storage.getSerialNumberSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching serial number settings:", error);
      res.status(500).json({ error: "Failed to fetch serial number settings" });
    }
  });

  app.put("/api/serial-number-settings", async (req, res) => {
    try {
      const settingsData = insertSerialNumberSettingsSchema.parse(req.body);
      const settings = await storage.updateSerialNumberSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating serial number settings:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number settings" });
      }
    }
  });

  app.patch("/api/serial-number-settings", async (req, res) => {
    try {
      console.log("PATCH serial-number-settings - Request body:", req.body);
      const settingsData = insertSerialNumberSettingsSchema.parse(req.body);
      console.log("PATCH serial-number-settings - Parsed data:", settingsData);
      const settings = await storage.updateSerialNumberSettings(settingsData);
      console.log("PATCH serial-number-settings - Updated settings:", settings);
      res.json(settings);
    } catch (error) {
      console.error("Error updating serial number settings:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update serial number settings" });
      }
    }
  });

  app.patch("/api/serial-numbers/:id/mark-sold", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markSerialNumberAsSold(id);
      if (!success) {
        return res.status(404).json({ error: "Serial number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking serial number as sold:", error);
      res.status(500).json({ error: "Failed to mark serial number as sold" });
    }
  });

  // Currency API
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = await storage.getCurrencies();
      res.json(currencies);
    } catch (error) {
      console.error("Failed to get currencies:", error);
      res.status(500).json({ error: "Failed to get currencies" });
    }
  });

  app.get("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currency = await storage.getCurrency(id);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      console.error("Failed to get currency:", error);
      res.status(500).json({ error: "Failed to get currency" });
    }
  });

  app.post("/api/currencies", async (req, res) => {
    try {
      const currencyData = insertCurrencySchema.parse(req.body);
      const currency = await storage.createCurrency(currencyData);
      res.status(201).json(currency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid currency data", details: error.errors });
      } else {
        console.error("Failed to create currency:", error);
        res.status(500).json({ error: "Failed to create currency" });
      }
    }
  });

  app.patch("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currencyData = insertCurrencySchema.partial().parse(req.body);
      const currency = await storage.updateCurrency(id, currencyData);
      if (!currency) {
        return res.status(404).json({ error: "Currency not found" });
      }
      res.json(currency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid currency data", details: error.errors });
      } else {
        console.error("Failed to update currency:", error);
        res.status(500).json({ error: "Failed to update currency" });
      }
    }
  });

  app.delete("/api/currencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCurrency(id);
      if (success) {
        res.json({ message: "Currency deleted successfully" });
      } else {
        res.status(404).json({ error: "Currency not found" });
      }
    } catch (error) {
      console.error("Failed to delete currency:", error);
      res.status(500).json({ error: "Failed to delete currency" });
    }
  });

  app.post("/api/currencies/:id/set-base", async (req, res) => {
    try {
      const currencyId = parseInt(req.params.id);
      const currency = await storage.setBaseCurrency(currencyId);
      res.json(currency);
    } catch (error) {
      console.error("Failed to set base currency:", error);
      res.status(500).json({ error: "Failed to set base currency" });
    }
  });

  // Exchange Rates API
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await storage.getExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Failed to get exchange rates:", error);
      res.status(500).json({ error: "Failed to get exchange rates" });
    }
  });

  app.post("/api/exchange-rates", async (req, res) => {
    try {
      const rateData = insertExchangeRateHistorySchema.parse(req.body);
      const rate = await storage.createExchangeRate(rateData);
      res.status(201).json(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid exchange rate data", details: error.errors });
      } else {
        console.error("Failed to create exchange rate:", error);
        res.status(500).json({ error: "Failed to create exchange rate" });
      }
    }
  });

  // Production Planning API routes
  app.get("/api/production-plans", async (req, res) => {
    try {
      const plans = await storage.getProductionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching production plans:", error);
      res.status(500).json({ error: "Failed to fetch production plans" });
    }
  });

  app.post("/api/production-plans", async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createProductionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating production plan:", error);
      res.status(500).json({ error: "Failed to create production plan" });
    }
  });

  // Supply Decision API routes
  app.get("/api/supply-decisions", async (req, res) => {
    try {
      const decisions = await storage.getSupplyDecisions();
      res.json(decisions);
    } catch (error) {
      console.error("Error fetching supply decisions:", error);
      res.status(500).json({ error: "Failed to fetch supply decisions" });
    }
  });

  app.post("/api/analyze-supply/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const { requiredQuantity } = req.body;
      const decision = await storage.analyzeSupplyDecision(productId, requiredQuantity);
      res.json(decision);
    } catch (error) {
      console.error("Error analyzing supply decision:", error);
      res.status(500).json({ error: "Failed to analyze supply decision" });
    }
  });

  // Local Users API with Worker Integration
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getLocalUsersWithWorkers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get workers available for user creation (not yet assigned to a user)
  app.get("/api/users/available-workers", async (req, res) => {
    try {
      const workers = await storage.getWorkersAvailableForUsers();
      res.json(workers);
    } catch (error) {
      console.error("Error fetching available workers:", error);
      res.status(500).json({ error: "Failed to fetch available workers" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getLocalUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertLocalUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;
      
      const user = await storage.createLocalUserWithWorker(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // Remove password fields from update data
      delete userData.password;
      delete userData.confirmPassword;
      
      const user = await storage.updateLocalUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Перевіряємо чи це останній адміністратор
      const userToDelete = await storage.getLocalUser(id);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (userToDelete.role === 'admin') {
        const allUsers = await storage.getLocalUsersWithWorkers();
        const adminCount = allUsers.filter(user => user.role === 'admin').length;
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            error: "Не можна видалити останнього адміністратора в системі" 
          });
        }
      }
      
      const success = await storage.deleteLocalUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.patch("/api/users/:id/toggle-status", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const user = await storage.toggleUserStatus(id, isActive);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  app.post("/api/users/:id/change-password", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const passwordData = changePasswordSchema.parse(req.body);
      
      // Get current user to verify current password
      const user = await storage.getLocalUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);
      
      const success = await storage.changeUserPassword(id, hashedNewPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to change password" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid password data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  });

  // Admin reset password (without current password)
  app.post("/api/users/:id/reset-password", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      console.log("Password reset attempt for user ID:", id, "New password:", newPassword);
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Get user to verify they exist
      const user = await storage.getLocalUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("User found:", user.username);
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      console.log("Password hashed, length:", hashedNewPassword.length);
      
      const success = await storage.changeUserPassword(id, hashedNewPassword);
      console.log("Password change result:", success);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Email password reset routes
  app.post("/api/auth/send-password-reset", isSimpleAuthenticated, async (req, res) => {
    try {
      const { email, userId } = req.body;
      
      if (!email || !userId) {
        return res.status(400).json({ error: "Email and user ID are required" });
      }
      
      // Get user to verify they exist
      const user = await storage.getLocalUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.email !== email) {
        return res.status(400).json({ error: "Email does not match user" });
      }
      
      // Generate reset token and expiration
      const { generatePasswordResetToken, sendEmail, generatePasswordResetEmail } = await import("./email-service");
      const resetToken = generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Save reset token to database
      const success = await storage.savePasswordResetToken(userId, resetToken, resetExpires);
      if (!success) {
        return res.status(500).json({ error: "Failed to save reset token" });
      }
      
      // Generate reset URL
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const host = req.get('host') || req.get('x-forwarded-host');
      
      // Виправляємо формування URL - видаляємо зайві слеші
      let baseUrl = `${protocol}://${host}`;
      if (baseUrl.includes('\\')) {
        baseUrl = baseUrl.replace(/\\/g, '');
      }
      
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Generate email content
      const { html, text } = generatePasswordResetEmail(user.username, resetToken, resetUrl);
      
      // Send email
      const emailSent = await sendEmail({
        to: email,
        subject: "Скидання паролю - REGMIK ERP",
        html,
        text
      });
      
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send email" });
      }
      
      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  });

  app.post("/api/auth/confirm-password-reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Verify reset token and get user
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      const success = await storage.confirmPasswordReset(user.id, hashedPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error confirming password reset:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Registration confirmation routes
  app.post("/api/auth/send-registration-confirmation", async (req, res) => {
    try {
      const { email, username } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ error: "Email and username are required" });
      }
      
      // Generate confirmation token
      const { generatePasswordResetToken, sendEmail, generateRegistrationConfirmationEmail } = await import("./email-service");
      const confirmationToken = generatePasswordResetToken();
      const confirmationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Save confirmation token (using same mechanism as password reset)
      const tempUserId = Date.now(); // Temporary ID for unconfirmed users
      
      // Generate confirmation URL
      const confirmationUrl = `${req.protocol}://${req.get('host')}/confirm-registration?token=${confirmationToken}`;
      
      // Generate email content
      const { html, text } = generateRegistrationConfirmationEmail(username, confirmationToken, confirmationUrl);
      
      // Send email
      const emailSent = await sendEmail({
        to: email,
        subject: "Підтвердження реєстрації - REGMIK ERP",
        html,
        text
      });
      
      if (!emailSent) {
        return res.status(500).json({ error: "Failed to send confirmation email" });
      }
      
      res.json({ 
        message: "Registration confirmation email sent successfully",
        token: confirmationToken // For development/testing
      });
    } catch (error) {
      console.error("Error sending registration confirmation email:", error);
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  });

  // Update user permissions
  app.patch("/api/users/:id/permissions", isSimpleAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { permissions } = req.body;
      
      console.log("Updating permissions for user ID:", id);
      console.log("New permissions data:", permissions);
      
      const user = await storage.updateLocalUserPermissions(id, permissions);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("Updated user with permissions:", user);
      res.json(user);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });

  // Roles API
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const roleData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid role data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create role" });
      }
    }
  });

  // System Modules API
  app.get("/api/system-modules", async (req, res) => {
    try {
      const modules = await storage.getSystemModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching system modules:", error);
      res.status(500).json({ error: "Failed to fetch system modules" });
    }
  });

  app.post("/api/system-modules", async (req, res) => {
    try {
      const moduleData = insertSystemModuleSchema.parse(req.body);
      const module = await storage.createSystemModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating system module:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid module data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create system module" });
      }
    }
  });

  // Email Settings API
  app.get("/api/email-settings", async (req, res) => {
    try {
      const settings = await storage.getEmailSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ error: "Failed to fetch email settings" });
    }
  });

  app.post("/api/email-settings", async (req, res) => {
    try {
      const settingsData = insertEmailSettingsSchema.parse(req.body);
      const settings = await storage.updateEmailSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid email settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update email settings" });
      }
    }
  });

  // Update email settings from environment variables
  app.post("/api/email-settings/update-from-env", async (req, res) => {
    try {
      const settings = {
        smtpHost: process.env.WORKING_SMTP_HOST || process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.WORKING_SMTP_PORT || process.env.SMTP_PORT || '587'),
        smtpSecure: false,
        smtpUser: process.env.WORKING_SMTP_USER || process.env.SMTP_USER,
        smtpPassword: process.env.WORKING_SMTP_PASSWORD || process.env.SMTP_PASSWORD,
        fromEmail: process.env.WORKING_SMTP_USER || process.env.SMTP_USER,
        fromName: "REGMIK ERP",
        isActive: true
      };

      console.log('Updating email settings from env:', { host: settings.smtpHost, port: settings.smtpPort, user: settings.smtpUser });
      const updatedSettings = await storage.updateEmailSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating email settings from env:", error);
      res.status(500).json({ error: "Failed to update email settings" });
    }
  });

  app.post("/api/email-settings/test", async (req, res) => {
    try {
      const settingsData = insertEmailSettingsSchema.parse(req.body);
      
      // Перевірка обов'язкових полів
      if (!settingsData.smtpHost || !settingsData.smtpUser || !settingsData.smtpPassword) {
        return res.status(400).json({
          success: false,
          message: "Заповніть усі обов'язкові поля: SMTP хост, користувач та пароль"
        });
      }

      // Реальне тестування SMTP з автентифікацією
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: settingsData.smtpHost,
        port: settingsData.smtpPort || 587,
        secure: settingsData.smtpSecure || false,
        auth: {
          user: settingsData.smtpUser,
          pass: settingsData.smtpPassword,
        },
        connectionTimeout: 10000, // 10 секунд
        greetingTimeout: 5000,   // 5 секунд
        socketTimeout: 10000,    // 10 секунд
      });

      // Перевірка підключення та автентифікації
      await transporter.verify();
      
      // Закриття з'єднання
      transporter.close();
      
      res.json({ 
        success: true, 
        message: `Успішне підключення до SMTP сервера ${settingsData.smtpHost}:${settingsData.smtpPort}. Автентифікація пройшла успішно.` 
      });
    } catch (error: any) {
      console.error("SMTP connection test failed:", error);
      
      let errorMessage = "Помилка підключення до SMTP сервера";
      
      if (error.code === 'ENOTFOUND') {
        errorMessage = "SMTP сервер не знайдено. Перевірте адресу хоста.";
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = "З'єднання відхилено. Перевірте хост та порт.";
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = "Тайм-аут підключення. Перевірте налаштування мережі.";
      } else if (error.responseCode === 535) {
        errorMessage = "Помилка автентифікації. Перевірте логін та пароль.";
      } else if (error.responseCode === 534) {
        errorMessage = "Потрібна двофакторна автентифікація або App Password.";
      } else if (error.message && error.message.includes('Invalid login')) {
        errorMessage = "Невірний логін або пароль.";
      }
      
      res.status(400).json({ 
        success: false, 
        message: errorMessage,
        details: error.message || "Невідома помилка"
      });
    }
  });

  // Product profitability analysis endpoints
  app.get('/api/analytics/product-profitability', isSimpleAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || 'month';
      const profitabilityData = await storage.getProductProfitability(period);
      res.json(profitabilityData);
    } catch (error) {
      console.error('Error fetching product profitability:', error);
      res.status(500).json({ message: 'Failed to fetch product profitability data' });
    }
  });

  app.get('/api/analytics/top-profitable-products', isSimpleAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || 'month';
      const limit = parseInt(req.query.limit as string) || 10;
      const topProducts = await storage.getTopProfitableProducts(period, limit);
      res.json(topProducts);
    } catch (error) {
      console.error('Error fetching top profitable products:', error);
      res.status(500).json({ message: 'Failed to fetch top profitable products' });
    }
  });

  app.get('/api/analytics/product-trends/:productId', isSimpleAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const trends = await storage.getProductProfitabilityTrends(productId);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching product trends:', error);
      res.status(500).json({ message: 'Failed to fetch product trends' });
    }
  });

  // Client Mail API
  app.get("/api/client-mail", async (req, res) => {
    try {
      const mails = await storage.getClientMails();
      res.json(mails);
    } catch (error) {
      console.error("Error fetching client mails:", error);
      res.status(500).json({ error: "Failed to fetch client mails" });
    }
  });

  app.post("/api/client-mail", async (req, res) => {
    try {
      const validatedData = insertClientMailSchema.parse(req.body);
      const mail = await storage.createClientMail(validatedData);
      res.status(201).json(mail);
    } catch (error) {
      console.error("Error creating client mail:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid mail data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client mail" });
      }
    }
  });

  app.post("/api/client-mail/batch-print", async (req, res) => {
    try {
      const { mailIds, batchName } = req.body;
      
      if (!Array.isArray(mailIds) || mailIds.length === 0) {
        return res.status(400).json({ error: "Mail IDs are required" });
      }
      
      if (!batchName || typeof batchName !== 'string') {
        return res.status(400).json({ error: "Batch name is required" });
      }

      const batchId = `batch_${Date.now()}`;
      
      // Створюємо запис у реєстрі
      const registryData = {
        batchId,
        batchName,
        totalCount: mailIds.length,
        status: "printing" as const,
        printDate: new Date(),
        notes: null,
      };
      
      const registry = await storage.createMailRegistry(registryData);
      
      // Оновлюємо статус листів
      await storage.updateMailsForBatch(mailIds, batchId);
      
      res.json({ registry, batchId, processedCount: mailIds.length });
    } catch (error) {
      console.error("Error creating batch print:", error);
      res.status(500).json({ error: "Failed to create batch print" });
    }
  });

  app.get("/api/mail-registry", async (req, res) => {
    try {
      const registry = await storage.getMailRegistry();
      res.json(registry);
    } catch (error) {
      console.error("Error fetching mail registry:", error);
      res.status(500).json({ error: "Failed to fetch mail registry" });
    }
  });

  app.get("/api/envelope-print-settings", async (req, res) => {
    try {
      const settings = await storage.getEnvelopePrintSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching envelope print settings:", error);
      res.status(500).json({ error: "Failed to fetch envelope print settings" });
    }
  });

  app.post("/api/envelope-print-settings", async (req, res) => {
    console.log("POST /api/envelope-print-settings отримано запит:", req.body);
    try {
      const validatedData = insertEnvelopePrintSettingsSchema.parse(req.body);
      console.log("Валідовані дані:", validatedData);
      const settings = await storage.createEnvelopePrintSettings(validatedData);
      console.log("Збережені налаштування:", settings);
      
      // Повертаємо всі налаштування для оновлення кешу
      const allSettings = await storage.getEnvelopePrintSettings();
      res.status(201).json(allSettings);
    } catch (error) {
      console.error("Error creating envelope print settings:", error);
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        res.status(400).json({ error: "Invalid settings data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create envelope print settings" });
      }
    }
  });

  // Clients API
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Failed to get clients:", error);
      res.status(500).json({ error: "Failed to get clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      console.log("Creating client with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Client validation error:", error.errors);
        res.status(400).json({ error: "Invalid client data", details: error.errors });
      } else {
        console.error("Failed to create client:", error);
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to get client:", error);
      res.status(500).json({ error: "Failed to get client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      // Виключаємо ID з даних оновлення, щоб не порушувати foreign key constraints
      const { id: clientId, ...updateData } = req.body;
      const client = await storage.updateClient(id, updateData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to update client:", error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Failed to delete client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Client Nova Poshta Settings API
  app.get("/api/clients/:clientId/nova-poshta-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settings = await storage.getClientNovaPoshtaSettings(clientId);
      res.json(settings);
    } catch (error) {
      console.error("Failed to get client Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to get client Nova Poshta settings" });
    }
  });

  app.get("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.getClientNovaPoshtaSetting(id);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to get Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to get Nova Poshta settings" });
    }
  });

  app.post("/api/clients/:clientId/nova-poshta-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsData = { ...req.body, clientId };
      const settings = await storage.createClientNovaPoshtaSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Failed to create Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to create Nova Poshta settings" });
    }
  });

  app.patch("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.updateClientNovaPoshtaSettings(id, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to update Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to update Nova Poshta settings" });
    }
  });

  app.delete("/api/nova-poshta-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClientNovaPoshtaSettings(id);
      if (!success) {
        return res.status(404).json({ error: "Nova Poshta settings not found" });
      }
      res.json({ message: "Nova Poshta settings deleted successfully" });
    } catch (error) {
      console.error("Failed to delete Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to delete Nova Poshta settings" });
    }
  });

  app.patch("/api/clients/:clientId/nova-poshta-settings/:id/set-primary", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsId = parseInt(req.params.id);
      const success = await storage.setPrimaryClientNovaPoshtaSettings(clientId, settingsId);
      if (!success) {
        return res.status(404).json({ error: "Failed to set primary Nova Poshta settings" });
      }
      res.json({ message: "Primary Nova Poshta settings updated successfully" });
    } catch (error) {
      console.error("Failed to set primary Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to set primary Nova Poshta settings" });
    }
  });

  // Group mail creation API
  app.post("/api/client-mail/group-create", async (req, res) => {
    try {
      const { clientIds, mailData, batchName } = req.body;
      const result = await storage.createGroupMails(clientIds, mailData, batchName);
      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to create group mails:", error);
      res.status(500).json({ error: "Failed to create group mails" });
    }
  });

  // Third-party shipments API
  app.post("/api/orders/:orderId/third-party-shipment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { useClientApi, ...shipmentData } = req.body;
      
      const result = await storage.createThirdPartyShipment(orderId, shipmentData, useClientApi);
      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to create third-party shipment:", error);
      res.status(500).json({ error: error.message || "Failed to create third-party shipment" });
    }
  });

  // Client Contacts API (Combined table)
  app.get("/api/client-contacts", async (req, res) => {
    try {
      const contacts = await storage.getClientContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      res.status(500).json({ error: "Failed to fetch client contacts" });
    }
  });

  app.post("/api/client-contacts", async (req, res) => {
    try {
      const validatedData = insertClientContactSchema.parse(req.body);
      const contact = await storage.createClientContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating client contact:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid contact data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client contact" });
      }
    }
  });

  app.get("/api/client-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getClientContact(id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching client contact:", error);
      res.status(500).json({ error: "Failed to fetch client contact" });
    }
  });

  app.patch("/api/client-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.updateClientContact(id, req.body);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating client contact:", error);
      res.status(500).json({ error: "Failed to update client contact" });
    }
  });

  app.delete("/api/client-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClientContact(id);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting client contact:", error);
      res.status(500).json({ error: "Failed to delete client contact" });
    }
  });

  // Legacy client phones API (deprecated - redirects to contacts)
  app.get("/api/client-phones", async (req, res) => {
    try {
      // Перенаправляємо на об'єднану таблицю контактів
      const contacts = await storage.getClientContacts();
      // Трансформуємо дані для сумісності зі старим API
      const phones = contacts.flatMap((contact: any) => {
        const result = [];
        if (contact.primaryPhone) {
          result.push({
            id: `${contact.id}-primary`,
            clientId: contact.clientId,
            phoneNumber: contact.primaryPhone,
            phoneType: contact.primaryPhoneType,
            description: `Основний телефон - ${contact.fullName}`,
            isPrimary: true,
            createdAt: contact.createdAt
          });
        }
        if (contact.secondaryPhone) {
          result.push({
            id: `${contact.id}-secondary`,
            clientId: contact.clientId,
            phoneNumber: contact.secondaryPhone,
            phoneType: contact.secondaryPhoneType,
            description: `Додатковий телефон - ${contact.fullName}`,
            isPrimary: false,
            createdAt: contact.createdAt
          });
        }
        if (contact.tertiaryPhone) {
          result.push({
            id: `${contact.id}-tertiary`,
            clientId: contact.clientId,
            phoneNumber: contact.tertiaryPhone,
            phoneType: contact.tertiaryPhoneType,
            description: `Третій телефон - ${contact.fullName}`,
            isPrimary: false,
            createdAt: contact.createdAt
          });
        }
        return result;
      });
      res.json(phones);
    } catch (error) {
      console.error("Error fetching client phones (legacy):", error);
      res.status(500).json({ error: "Failed to fetch client phones" });
    }
  });

  // ===============================
  // ІНТЕГРАЦІЇ БІТРІКС24 ТА 1С API
  // ===============================

  // Получение всех конфигураций интеграций
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getIntegrationConfigs();
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // Получение конкретной конфигурации интеграции
  app.get("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = await storage.getIntegrationConfig(id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.json(integration);
    } catch (error) {
      console.error("Error fetching integration:", error);
      res.status(500).json({ error: "Failed to fetch integration" });
    }
  });

  // Создание новой конфигурации интеграции
  app.post("/api/integrations", async (req, res) => {
    try {
      const { name, displayName, type, isActive, config } = req.body;
      
      if (!name || !displayName || !type) {
        return res.status(400).json({ error: "Name, displayName and type are required" });
      }

      const integrationData = {
        name,
        displayName,
        type,
        isActive: isActive || false,
        config: config || {}
      };

      const integration = await storage.createIntegrationConfig(integrationData);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  // Обновление конфигурации интеграции
  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const integration = await storage.updateIntegrationConfig(id, updateData);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ error: "Failed to update integration" });
    }
  });

  // Удаление конфигурации интеграции
  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteIntegrationConfig(id);
      if (!success) {
        return res.status(404).json({ error: "Integration not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });

  // Тестирование подключения к интеграции
  app.post("/api/integrations/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Здесь будет логика тестирования подключения
      const success = true; // Заглушка
      
      res.json({ success, message: success ? "Connection successful" : "Connection failed" });
    } catch (error) {
      console.error("Error testing integration connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  // Запуск синхронизации данных
  app.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { direction } = req.body; // 'import' или 'export'
      
      if (!direction || !['import', 'export'].includes(direction)) {
        return res.status(400).json({ error: "Direction must be 'import' or 'export'" });
      }

      // Здесь будет логика синхронизации
      const result = {
        success: true,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        message: `${direction === 'import' ? 'Import' : 'Export'} started successfully`
      };

      res.json(result);
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ error: "Failed to start synchronization" });
    }
  });

  // Получение логов синхронизации
  app.get("/api/integrations/sync-logs", async (req, res) => {
    try {
      const { integrationId } = req.query;
      const syncLogs = await storage.getSyncLogs(integrationId ? parseInt(integrationId as string) : undefined);
      res.json(syncLogs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // Получение мапінгів сутностей
  app.get("/api/integrations/:id/mappings", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { entityType } = req.query;
      
      const mappings = []; // Заглушка
      
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching entity mappings:", error);
      res.status(500).json({ error: "Failed to fetch entity mappings" });
    }
  });

  // Создание мапінгу сутностей
  app.post("/api/integrations/:id/mappings", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { entityType, localId, externalId, syncDirection } = req.body;
      
      if (!entityType || !localId || !externalId) {
        return res.status(400).json({ error: "entityType, localId and externalId are required" });
      }

      const mapping = {
        id: Date.now(),
        integrationId,
        entityType,
        localId,
        externalId,
        syncDirection: syncDirection || 'bidirectional',
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.status(201).json(mapping);
    } catch (error) {
      console.error("Error creating entity mapping:", error);
      res.status(500).json({ error: "Failed to create entity mapping" });
    }
  });

  // Удаление мапінгу
  app.delete("/api/integrations/:id/mappings/:mappingId", async (req, res) => {
    try {
      const mappingId = parseInt(req.params.mappingId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting entity mapping:", error);
      res.status(500).json({ error: "Failed to delete entity mapping" });
    }
  });

  // Получение очереди синхронизации
  app.get("/api/integrations/:id/sync-queue", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const queueItems = []; // Заглушка
      
      res.json(queueItems);
    } catch (error) {
      console.error("Error fetching sync queue:", error);
      res.status(500).json({ error: "Failed to fetch sync queue" });
    }
  });

  // Добавление елемента в очередь синхронизации
  app.post("/api/integrations/:id/sync-queue", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { operation, entityType, entityId, direction, priority } = req.body;
      
      if (!operation || !entityType || !entityId || !direction) {
        return res.status(400).json({ error: "operation, entityType, entityId and direction are required" });
      }

      const queueItem = {
        id: Date.now(),
        integrationId,
        operation,
        entityType,
        entityId,
        direction,
        priority: priority || 5,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.status(201).json(queueItem);
    } catch (error) {
      console.error("Error adding to sync queue:", error);
      res.status(500).json({ error: "Failed to add to sync queue" });
    }
  });

  // Получение настроек мапінгу полей
  app.get("/api/integrations/:id/field-mappings", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { entityType } = req.query;
      
      const fieldMappings = []; // Заглушка
      
      res.json(fieldMappings);
    } catch (error) {
      console.error("Error fetching field mappings:", error);
      res.status(500).json({ error: "Failed to fetch field mappings" });
    }
  });

  // Создание настроек мапінгу полей
  app.post("/api/integrations/:id/field-mappings", async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const { entityType, localField, externalField, transformation, direction } = req.body;
      
      if (!entityType || !localField || !externalField) {
        return res.status(400).json({ error: "entityType, localField and externalField are required" });
      }

      const fieldMapping = {
        id: Date.now(),
        integrationId,
        entityType,
        localField,
        externalField,
        transformation: transformation || 'none',
        direction: direction || 'bidirectional',
        isRequired: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.status(201).json(fieldMapping);
    } catch (error) {
      console.error("Error creating field mapping:", error);
      res.status(500).json({ error: "Failed to create field mapping" });
    }
  });

  // Companies endpoints for multi-company sales functionality
  app.get("/api/companies", async (req, res) => {
    try {
      console.log("Fetching companies from database...");
      const companies = await storage.getCompanies();
      console.log("Companies fetched successfully:", companies.length, "companies");
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.get("/api/companies/default/current", async (req, res) => {
    try {
      const company = await storage.getDefaultCompany();
      
      if (!company) {
        return res.status(404).json({ error: "No default company found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error fetching default company:", error);
      res.status(500).json({ error: "Failed to fetch default company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = req.body;
      console.log("Company creation request data:", companyData);
      
      if (!companyData.name || !companyData.taxCode || 
          companyData.name.trim() === "" || companyData.taxCode.trim() === "") {
        console.log("Validation failed - name:", companyData.name, "taxCode:", companyData.taxCode);
        return res.status(400).json({ error: "Name and tax code are required" });
      }

      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const companyData = req.body;
      
      const company = await storage.updateCompany(id, companyData);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompany(id);
      
      if (!success) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: error.message || "Failed to delete company" });
    }
  });

  // Set company as default
  app.post("/api/companies/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.setDefaultCompany(id);
      
      if (!success) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default company:", error);
      res.status(500).json({ error: "Failed to set default company" });
    }
  });

  // Get products by company
  app.get("/api/companies/:id/products", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const products = await storage.getProductsByCompany(companyId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by company:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get orders by company
  app.get("/api/companies/:id/orders", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const orders = await storage.getOrdersByCompany(companyId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders by company:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });



  // Get all invoices

  // Get invoice by ID

  // Create new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = req.body;
      
      if (!invoiceData.clientId || !invoiceData.amount || !invoiceData.invoiceNumber) {
        return res.status(400).json({ error: "Client ID, amount, and invoice number are required" });
      }

      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Update invoice
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoiceData = req.body;
      
      const invoice = await storage.updateInvoice(id, invoiceData);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvoice(id);
      
      if (!success) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Get invoice items

  // Create invoice item
  app.post("/api/invoices/:id/items", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const itemData = { ...req.body, invoiceId };
      
      if (!itemData.name || !itemData.quantity || !itemData.unitPrice) {
        return res.status(400).json({ error: "Name, quantity, and unit price are required" });
      }

      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      res.status(500).json({ error: "Failed to create invoice item" });
    }
  });

  // Update invoice item
  app.patch("/api/invoice-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      
      const item = await storage.updateInvoiceItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ error: "Invoice item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      res.status(500).json({ error: "Failed to update invoice item" });
    }
  });

  // Delete invoice item
  app.delete("/api/invoice-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInvoiceItem(id);
      
      if (!success) {
        return res.status(404).json({ error: "Invoice item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      res.status(500).json({ error: "Failed to delete invoice item" });
    }
  });

  // Get invoices by company

  // Invoice routes
  const invoiceCreateSchema = z.object({
    clientId: z.number(),
    companyId: z.number(),
    invoiceNumber: z.string(),
    amount: z.number(),
    currency: z.string().default("UAH"),
    status: z.string().default("draft"),
    issueDate: z.string().transform(str => new Date(str)),
    dueDate: z.string().transform(str => new Date(str)),
    description: z.string().optional(),
  });

  // Отримання всіх рахунків з клієнтами та компаніями

  // Отримання рахунку за ID з деталями

  // Створення нового рахунку
  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = invoiceCreateSchema.parse(req.body);
      
      const invoice = await storage.createInvoice({
        clientId: validatedData.clientId,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        description: validatedData.description || null,
        externalId: null,
        source: "manual"
      });
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Оновлення рахунку
  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = invoiceCreateSchema.parse(req.body);
      
      const invoice = await storage.updateInvoice(id, {
        clientId: validatedData.clientId,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        description: validatedData.description || null,
        updatedAt: new Date()
      });
      
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Видалення рахунку
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoice(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Створення рахунку на основі замовлення
  app.post("/api/orders/:orderId/create-invoice", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Отримуємо замовлення з деталями
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Генеруємо номер рахунку
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Розраховуємо суму замовлення
      const orderProducts = await storage.getOrderProducts(orderId);
      const totalAmount = orderProducts.reduce((sum, product) => {
        return sum + (parseFloat(product.pricePerUnit) * parseFloat(product.quantity));
      }, 0);

      // Створюємо рахунок - використовуємо clientId з замовлення або перший доступний клієнт
      const clientId = order.clientId || 1; // Якщо clientId відсутній, використовуємо клієнт з ID 1
      
      const invoice = await storage.createInvoice({
        clientId: clientId,
        companyId: 1, // Використовуємо основну компанію
        orderId: orderId,
        invoiceNumber: invoiceNumber,
        amount: totalAmount.toString(),
        currency: "UAH",
        status: "draft",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 днів
        description: `Рахунок для замовлення ${order.orderNumber}`,
        source: "manual"
      });

      // Створюємо позиції рахунку на основі продуктів замовлення
      for (const orderProduct of orderProducts) {
        // Використовуємо ціну з замовлення або роздрібну ціну продукту
        const unitPrice = orderProduct.pricePerUnit || orderProduct.product?.retailPrice || "0";
        const quantity = orderProduct.quantity || "1";
        
        await storage.createInvoiceItem({
          invoiceId: invoice.id,
          productId: orderProduct.productId,
          name: orderProduct.product?.name || "Товар",
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: (parseFloat(unitPrice) * parseFloat(quantity)).toString()
        });
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice from order:", error);
      res.status(500).json({ error: "Failed to create invoice from order" });
    }
  });

  // Sort Preferences Routes
  app.get("/api/user-sort-preferences/:tableName", async (req, res) => {
    try {
      const { tableName } = req.params;
      // Тимчасово використовуємо фіксований userId поки не підключений Replit Auth
      const userId = "guest";
      
      const preference = await storage.getUserSortPreferences(userId, tableName);
      res.json(preference);
    } catch (error) {
      console.error("Error fetching sort preferences:", error);
      res.status(500).json({ error: "Failed to fetch sort preferences" });
    }
  });

  app.post("/api/user-sort-preferences", async (req, res) => {
    try {
      const { tableName, sortField, sortDirection } = req.body;
      
      if (!tableName || !sortField || !sortDirection) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Тимчасово використовуємо фіксований userId поки не підключений Replit Auth
      const userId = "guest";

      const preference = await storage.saveUserSortPreferences({
        userId,
        tableName,
        sortField,
        sortDirection
      });

      res.json(preference);
    } catch (error) {
      console.error("Error saving sort preferences:", error);
      res.status(500).json({ error: "Failed to save sort preferences" });
    }
  });

  // Обробка оплати замовлення та автоматичне створення виробничих завдань
  app.post("/api/orders/:id/process-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      console.log("Raw request body:", req.body);
      console.log("Request body type:", typeof req.body);
      
      let paymentData;
      if (typeof req.body === 'string') {
        try {
          paymentData = JSON.parse(req.body);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return res.status(400).json({ error: "Неправильний формат JSON" });
        }
      } else {
        paymentData = req.body;
      }
      
      // Валідація вхідних даних
      const validPaymentTypes = ['full', 'partial', 'contract', 'none'];
      if (!validPaymentTypes.includes(paymentData.paymentType)) {
        return res.status(400).json({ error: "Недійсний тип оплати" });
      }

      await storage.processOrderPayment(orderId, paymentData);
      
      // Отримуємо оновлене замовлення для перевірки
      const updatedOrder = await storage.getOrder(orderId);
      console.log("Оновлене замовлення після оплати:", updatedOrder);
      
      let message = "Оплату замовлення оброблено";
      if (paymentData.paymentType === 'full') {
        message += ", створено завдання на виробництво";
      } else if (paymentData.paymentType === 'contract') {
        message += ", запущено виробництво по договору";
      } else if (paymentData.paymentType === 'partial' && paymentData.productionApproved) {
        message += ", дозволено виробництво";
      }
      
      res.json({ success: true, message });
    } catch (error) {
      console.error("Error processing order payment:", error);
      res.status(500).json({ error: "Failed to process order payment" });
    }
  });

  // Скасування оплати замовлення
  app.post("/api/orders/:id/cancel-payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Отримуємо поточне замовлення
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Замовлення не знайдено" });
      }

      // Перевіряємо, чи є оплата для скасування
      if (order.paymentType === 'none') {
        return res.status(400).json({ error: "Немає оплати для скасування" });
      }

      // Скасовуємо оплату
      await storage.cancelOrderPayment(orderId);
      
      res.json({ success: true, message: "Оплату скасовано успішно" });
    } catch (error) {
      console.error("Error canceling payment:", error);
      res.status(500).json({ error: "Failed to cancel payment" });
    }
  });

  // Окремий endpoint для дозволу виробництва
  app.post("/api/orders/:id/approve-production", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { approvedBy, reason } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ error: "Не вказано користувача, який дає дозвіл" });
      }

      await storage.approveProductionForOrder(orderId, approvedBy, reason);
      res.json({ success: true, message: "Дозволено запуск виробництва" });
    } catch (error) {
      console.error("Error approving production:", error);
      res.status(500).json({ error: "Failed to approve production" });
    }
  });

  // Currency Rates API
  const { currencyService } = await import("./currency-service");

  // Отримання останніх курсів валют
  app.get("/api/currency-rates", isSimpleAuthenticated, async (req, res) => {
    try {
      const rates = await storage.getAllCurrencyRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching currency rates:", error);
      res.status(500).json({ error: "Failed to fetch currency rates" });
    }
  });

  // Отримання курсів на конкретну дату
  app.get("/api/currency-rates/:date", isSimpleAuthenticated, async (req, res) => {
    try {
      const date = new Date(req.params.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const rates = await storage.getCurrencyRatesByDate(date);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching currency rates by date:", error);
      res.status(500).json({ error: "Failed to fetch currency rates" });
    }
  });

  // Ручне оновлення курсів на поточну дату
  app.post("/api/currency-rates/update", isSimpleAuthenticated, async (req, res) => {
    try {
      const result = await currencyService.updateCurrentRates();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          updatedCount: result.updatedCount
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error("Error updating currency rates:", error);
      res.status(500).json({ error: "Failed to update currency rates" });
    }
  });

  // Ручне оновлення курсів за період
  app.post("/api/currency-rates/update-period", isSimpleAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      if (start > end) {
        return res.status(400).json({ error: "Start date must be before end date" });
      }
      
      // Обмежуємо період до 1 року
      const maxDays = 365;
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > maxDays) {
        return res.status(400).json({ error: `Period cannot exceed ${maxDays} days` });
      }
      
      const result = await currencyService.updateRatesForPeriod(start, end);
      
      res.json({
        success: result.success,
        message: result.message,
        updatedDates: result.updatedDates,
        totalUpdated: result.totalUpdated
      });
      
    } catch (error) {
      console.error("Error updating currency rates for period:", error);
      res.status(500).json({ error: "Failed to update currency rates for period" });
    }
  });

  // Налаштування автоматичного оновлення
  app.get("/api/currency-settings", isSimpleAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getCurrencyUpdateSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching currency settings:", error);
      res.status(500).json({ error: "Failed to fetch currency settings" });
    }
  });

  app.post("/api/currency-settings", isSimpleAuthenticated, async (req, res) => {
    try {
      const settingsData = req.body;
      const settings = await storage.saveCurrencyUpdateSettings(settingsData);
      
      // Якщо автооновлення увімкнено, перезапускаємо планувальник
      if (settingsData.autoUpdateEnabled) {
        currencyService.initializeAutoUpdate();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error saving currency settings:", error);
      res.status(500).json({ error: "Failed to save currency settings" });
    }
  });

  app.put("/api/currency-settings", isSimpleAuthenticated, async (req, res) => {
    try {
      const settingsData = req.body;
      const settings = await storage.saveCurrencyUpdateSettings(settingsData);
      
      // Якщо автооновлення увімкнено, перезапускаємо планувальник
      if (settingsData.autoUpdateEnabled) {
        currencyService.initializeAutoUpdate();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error saving currency settings:", error);
      res.status(500).json({ error: "Failed to save currency settings" });
    }
  });



  // Отримання конкретного курсу валюти
  app.get("/api/currency-rate/:code", isSimpleAuthenticated, async (req, res) => {
    try {
      const { code } = req.params;
      const { date } = req.query;
      
      const searchDate = date ? new Date(date as string) : new Date();
      
      if (date && isNaN(searchDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      
      const rate = await currencyService.getCurrencyRate(code.toUpperCase(), searchDate);
      
      if (rate === null) {
        return res.status(404).json({ error: `Currency rate for ${code} not found` });
      }
      
      res.json({
        currencyCode: code.toUpperCase(),
        rate: rate,
        date: searchDate.toISOString().split('T')[0]
      });
      
    } catch (error) {
      console.error("Error fetching currency rate:", error);
      res.status(500).json({ error: "Failed to fetch currency rate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
