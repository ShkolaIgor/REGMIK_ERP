import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { registerSimpleIntegrationRoutes } from "./integrations-simple";
import { registerSyncApiRoutes } from "./sync-api";
import { setupSimpleSession, setupSimpleAuth, isSimpleAuthenticated } from "./simple-auth";
import { novaPoshtaApi } from "./nova-poshta-api";
import { novaPoshtaCache } from "./nova-poshta-cache";
import { pool, db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertProductSchema, insertOrderSchemaForm, insertRecipeSchema,
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
  insertEmailSettingsSchema, insertClientSchema, insertClientContactSchema, insertClientMailSchema, insertMailRegistrySchema, insertEnvelopePrintSettingsSchema,
  insertRepairSchema, insertRepairPartSchema, insertRepairStatusHistorySchema, insertRepairDocumentSchema,
  clientTypes, insertClientTypeSchema, insertOrderStatusSchema
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail } from "./email-service";
import multer from "multer";
import xml2js from "xml2js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth setup
  setupSimpleSession(app);
  setupSimpleAuth(app);

  // Multer configuration for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit для великих XML файлів
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
        cb(null, true);
      } else {
        cb(new Error('Only XML files are allowed'));
      }
    },
  });

  // Multer configuration for logo uploads
  const logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for images
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

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

  // Orders with pagination
  app.get("/api/orders", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 25;
      const search = req.query.search as string || '';
      const statusFilter = req.query.status as string || '';
      const paymentFilter = req.query.payment as string || '';
      const dateRangeFilter = req.query.dateRange as string || '';
      
      const result = await storage.getOrdersPaginated({
        page,
        limit,
        search,
        statusFilter,
        paymentFilter,
        dateRangeFilter
      });
      
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Fetching order with ID: ${id}`);
      const order = await storage.getOrder(id);
      if (!order) {
        console.log(`Order with ID ${id} not found`);
        return res.status(404).json({ error: "Order not found" });
      }
      console.log(`Order fetched successfully with clientName: ${order.clientName}`);
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
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
      
      // Конвертуємо paymentDate з рядка в Date якщо потрібно
      if (orderData.paymentDate && typeof orderData.paymentDate === 'string') {
        orderData.paymentDate = new Date(orderData.paymentDate);
      }
      
      const validatedOrderData = insertOrderSchemaForm.parse(orderData);
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
      
      const orderData = insertOrderSchemaForm.parse(order);
      
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

  // Orders XML Import with job tracking
  const orderImportJobs = new Map<string, {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: string[];
    details: Array<{
      orderNumber: string;
      status: 'imported' | 'updated' | 'skipped' | 'error';
      message: string;
    }>;
    totalRows: number;
  }>();

  // Order Items XML Import with job tracking  
  const orderItemImportJobs = new Map<string, {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: string[];
    details: Array<{
      orderNumber: string;
      productSku: string;
      status: 'imported' | 'updated' | 'skipped' | 'error';
      message: string;
    }>;
    logs: Array<{
      type: 'info' | 'warning' | 'error';
      message: string;
      details?: string;
    }>;
    totalRows: number;
  }>();

  // Start XML import for orders
  app.post("/api/orders/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file provided" 
        });
      }

      const jobId = generateJobId();
      
      orderImportJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        totalRows: 0
      });

      res.json({
        success: true,
        jobId,
        message: "Order import job started. Use the job ID to check progress."
      });

      processOrderXmlImportAsync(jobId, req.file.buffer, orderImportJobs);

    } catch (error) {
      console.error("Order XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start order XML import",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Order Items XML Import
  app.post("/api/order-items/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file provided" 
        });
      }

      const jobId = generateJobId();
      const orderId = req.body.orderId ? parseInt(req.body.orderId) : null;
      
      orderItemImportJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        logs: [],
        totalRows: 0
      });

      res.json({
        success: true,
        jobId,
        message: "Order items import job started. Use the job ID to check progress."
      });

      processOrderItemsXmlImportAsync(jobId, req.file.buffer, orderId, orderItemImportJobs);

    } catch (error) {
      console.error("Order items XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start order items XML import",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check order items import job status
  app.get("/api/order-items/import-xml/:jobId/status", (req, res) => {
    const { jobId } = req.params;
    const job = orderItemImportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job
    });
  });

  // Check order import job status
  app.get("/api/orders/import-xml/:jobId/status", (req, res) => {
    const { jobId } = req.params;
    const job = orderImportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job
    });
  });

  // Process Order XML Import Async Function
  async function processOrderXmlImportAsync(
    jobId: string, 
    xmlBuffer: Buffer, 
    jobsMap: Map<string, any>
  ) {
    const job = jobsMap.get(jobId);
    if (!job) return;

    try {
      const xmlContent = xmlBuffer.toString('utf-8');
      console.log(`Processing order XML import job ${jobId}...`);
      
      // Оновлюємо прогрес на початку
      job.progress = 10;
      
      // Викликаємо імпорт з callback для оновлення прогресу
      const result = await storage.importOrdersFromXmlWithProgress(xmlContent, (progress: number, processed: number, totalRows: number) => {
        job.progress = Math.min(95, 5 + (progress * 0.9)); // 5-95%
        job.processed = processed;
        job.totalRows = totalRows;
        console.log(`Job ${jobId} progress: ${job.progress}% (${processed}/${totalRows})`);
      });
      
      // Завершуємо імпорт - переконуємося що показуємо 100%
      job.status = 'completed';
      job.progress = 100;
      job.processed = result.success + result.errors.length;
      job.totalRows = result.success + result.errors.length;
      job.processed = result.success + result.errors.length;
      job.imported = result.success;
      job.skipped = 0;
      job.errors = result.errors.map((err: any) => err.error);
      job.details = [
        // Показуємо тільки помилки та попередження
        ...result.errors.map((err: any) => ({
          orderNumber: err.data?.orderNumber || `Рядок ${err.row}`,
          status: 'error' as const,
          message: err.error
        })),
        ...result.warnings.map((warn: any) => ({
          orderNumber: warn.data?.orderNumber || `Рядок ${warn.row}`,
          status: 'warning' as const,
          message: warn.warning
        }))
      ];
      job.totalRows = result.success + result.errors.length;
      
      console.log(`Order import job ${jobId} completed: ${result.success} imported, ${result.errors.length} errors`);
      
    } catch (error) {
      console.error(`Order import job ${jobId} failed:`, error);
      job.status = 'failed';
      job.errors = [error instanceof Error ? error.message : 'Unknown error'];
    }
  }

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

  // Suppliers - старий маршрут видалено, використовується новий з пагінацією

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string || '';
      
      console.log(`Getting suppliers: page=${page}, limit=${limit}, search="${search}"`);
      const result = await storage.getSuppliersPaginated(page, limit, search);
      console.log(`Suppliers result:`, { 
        type: typeof result, 
        isArray: Array.isArray(result),
        hasSuppliers: result && 'suppliers' in result,
        keys: result && typeof result === 'object' ? Object.keys(result) : 'not object'
      });
      res.json(result);
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
        return res.status(404).json({ error: "Постачальника не знайдено" });
      }
      res.json({ success: true, message: "Постачальника видалено успішно" });
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ error: "Помилка видалення постачальника" });
    }
  });

  // XML Import endpoint for suppliers
  const supplierImportJobs = new Map<string, {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: string[];
    details: Array<{
      name: string;
      status: 'imported' | 'updated' | 'skipped' | 'error';
      message?: string;
    }>;
    totalRows: number;
  }>();

  // Start XML import for suppliers
  app.post("/api/suppliers/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file provided" 
        });
      }

      const jobId = generateJobId();
      
      supplierImportJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        totalRows: 0
      });

      res.json({
        success: true,
        jobId,
        message: "Supplier import job started. Use the job ID to check progress."
      });

      processSupplierXmlImportAsync(jobId, req.file.buffer);

    } catch (error) {
      console.error("Supplier XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start supplier XML import",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check supplier import job status
  app.get("/api/suppliers/import-xml/:jobId/status", (req, res) => {
    const { jobId } = req.params;
    const job = supplierImportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job
    });
  });

  // XML Import endpoint for products
  const productImportJobs = new Map<string, {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: string[];
    details: Array<{
      name: string;
      status: 'imported' | 'updated' | 'skipped' | 'error';
      message?: string;
    }>;
    totalRows: number;
  }>();

  // Start XML import for products
  app.post("/api/products/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file provided" 
        });
      }

      const jobId = generateJobId();
      
      productImportJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        totalRows: 0
      });

      res.json({
        success: true,
        jobId,
        message: "Product import job started. Use the job ID to check progress."
      });

      processProductXmlImportAsync(jobId, req.file.buffer);

    } catch (error) {
      console.error("Product XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start product XML import",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check product import job status
  app.get("/api/products/import-xml/:jobId/status", (req, res) => {
    const { jobId } = req.params;
    const job = productImportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job
    });
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
      // Додаємо поле name для сумісності з формами
      const workersWithName = workers.map(worker => ({
        ...worker,
        name: `${worker.firstName} ${worker.lastName}`
      }));
      res.json(workersWithName);
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

  app.get("/api/shipments/:id/details", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shipmentDetails = await storage.getShipmentDetails(id);
      if (!shipmentDetails) {
        return res.status(404).json({ error: "Shipment not found" });
      }
      res.json(shipmentDetails);
    } catch (error) {
      console.error("Failed to get shipment details:", error);
      res.status(500).json({ error: "Failed to get shipment details" });
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

  // Nova Poshta Service Management
  app.get("/api/nova-poshta/status", async (req, res) => {
    try {
      const { novaPoshtaService } = await import("./nova-poshta-service");
      const stats = await novaPoshtaService.getCacheStats();
      const settings = await novaPoshtaService.getUpdateSettings();
      const needsUpdate = await novaPoshtaService.needsUpdate();
      
      res.json({
        stats,
        settings,
        needsUpdate
      });
    } catch (error) {
      console.error("Error getting Nova Poshta status:", error);
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  app.post("/api/nova-poshta/update", async (req, res) => {
    try {
      const { novaPoshtaService } = await import("./nova-poshta-service");
      const result = await novaPoshtaService.manualUpdate();
      res.json(result);
    } catch (error) {
      console.error("Error updating Nova Poshta data:", error);
      res.status(500).json({ error: "Failed to update data" });
    }
  });

  app.post("/api/nova-poshta/settings", async (req, res) => {
    try {
      const { novaPoshtaService } = await import("./nova-poshta-service");
      await novaPoshtaService.saveUpdateSettings(req.body);
      
      // Перезапускаємо автоматичне оновлення з новими налаштуваннями
      await novaPoshtaService.initializeAutoUpdate();
      
      res.json({ success: true, message: "Налаштування збережено" });
    } catch (error) {
      console.error("Error saving Nova Poshta settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // Client Types API routes
  app.get("/api/client-types", async (req, res) => {
    try {
      const clientTypesList = await db.select().from(clientTypes).where(eq(clientTypes.isActive, true));
      res.json(clientTypesList);
    } catch (error) {
      console.error("Error fetching client types:", error);
      res.status(500).json({ error: "Failed to fetch client types" });
    }
  });

  app.post("/api/client-types", async (req, res) => {
    try {
      const validatedData = insertClientTypeSchema.parse(req.body);
      const [clientType] = await db
        .insert(clientTypes)
        .values(validatedData)
        .returning();
      res.json(clientType);
    } catch (error) {
      console.error("Error creating client type:", error);
      res.status(500).json({ error: "Failed to create client type" });
    }
  });

  // Nova Poshta API integration routes (з кешуванням)
  app.get("/api/nova-poshta/cities", async (req, res) => {
    const { q } = req.query;
    let searchQuery = typeof q === 'string' ? q : "";
    
    // Правильне декодування UTF-8 для кирилічних символів
    try {
      searchQuery = decodeURIComponent(searchQuery);
    } catch (error) {
      // Якщо вже декодовано або некоректний формат
    }
    
    console.log(`Nova Poshta cities API called with query: "${searchQuery}"`);
    
    // Відключаємо всі види кешування
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString(),
      'ETag': `"${Date.now()}-${Math.random()}"`,
      'Vary': '*'
    });
    
    try {
      const cities = await novaPoshtaCache.getCities(searchQuery);
      console.log(`Returning ${cities.length} cities for search: "${searchQuery}"`);
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // Get city by Ref for editing
  app.get("/api/nova-poshta/city/:ref", async (req, res) => {
    const cityRef = req.params.ref;
    
    try {
      console.log(`Nova Poshta city by ref API called: "${cityRef}"`);
      const city = await storage.getCityByRef(cityRef);
      if (!city) {
        return res.status(404).json({ error: 'City not found' });
      }
      res.json(city);
    } catch (error) {
      console.error('Error getting city by ref:', error);
      res.status(500).json({ error: 'Failed to get city' });
    }
  });

  app.get("/api/nova-poshta/warehouses/:cityRef", async (req, res) => {
    try {
      const { cityRef } = req.params;
      const { q } = req.query;
      const searchQuery = typeof q === 'string' ? q : "";
      console.log(`Nova Poshta warehouses API called for city: "${cityRef}", query: "${searchQuery}"`);
      console.log(`[DEBUG] Request headers:`, req.headers.origin, req.headers['user-agent']);
      
      // Відключаємо всі види кешування
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}-${Math.random()}"`,
        'Vary': '*'
      });
      
      const warehouses = await novaPoshtaCache.getWarehouses(cityRef, searchQuery);
      console.log(`[DEBUG] Final result length: ${warehouses.length}`);
      console.log(`Returning ${warehouses.length} warehouses for city: "${cityRef}", search: "${searchQuery}"`);
      
      if (warehouses.length === 0) {
        console.log(`[DEBUG] No warehouses found - checking database directly`);
        const directCount = await pool.query(`
          SELECT COUNT(*) as count 
          FROM nova_poshta_warehouses 
          WHERE city_ref = $1 AND is_active = true
        `, [cityRef]);
        console.log(`[DEBUG] Direct DB count for city ${cityRef}: ${directCount.rows[0]?.count || 0}`);
      }
      
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      console.error("[DEBUG] Full error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch warehouses", details: error.message });
    }
  });

  // Nova Poshta diagnostics endpoint
  app.get("/api/nova-poshta/diagnostics", async (req, res) => {
    try {
      const { q } = req.query;
      const searchQuery = typeof q === 'string' ? q : "че";
      
      // Отримуємо статистику бази даних
      const totalCities = await storage.getNovaPoshtaCitiesCount();
      const totalWarehouses = await storage.getNovaPoshtaWarehousesCount();
      
      // Тестуємо пошук через API
      const searchResults = await storage.getNovaPoshtaCities(searchQuery);
      
      // Прямий SQL запит для перевірки
      const directSqlResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM nova_poshta_cities 
        WHERE (name ILIKE $1 OR area ILIKE $1)
      `, [`%${searchQuery}%`]);
      
      // Перевіряємо кодування
      const encodingResult = await pool.query(`
        SELECT 
          current_setting('server_encoding') as server_encoding,
          current_setting('client_encoding') as client_encoding
      `);
      
      res.json({
        totalCities,
        totalWarehouses,
        searchQuery,
        apiResults: searchResults.length,
        directSqlResults: directSqlResult.rows[0].count,
        encoding: encodingResult.rows[0],
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in Nova Poshta diagnostics:", error);
      res.status(500).json({ error: "Failed to run diagnostics" });
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
        orderId,
        shipmentId
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
      console.log('Invoice created successfully:', invoice);
      
      // Якщо є orderId, оновлюємо замовлення з трек-номером
      if (orderId && invoice.Number) {
        try {
          console.log('Updating order with tracking number:', invoice.Number);
          await storage.updateOrderTrackingNumber(parseInt(orderId), invoice.Number);
          console.log('Order updated with tracking number successfully');
        } catch (error) {
          console.error('Error updating order with tracking number:', error);
        }
      }
      
      // Якщо є shipmentId, оновлюємо відвантаження з трек-номером та статусом "відправлено"
      if (shipmentId && invoice.Number) {
        try {
          console.log('Updating shipment with tracking number and status:', invoice.Number);
          const currentDate = new Date();
          
          // Оновлюємо трек-номер
          await storage.updateShipment(parseInt(shipmentId), {
            trackingNumber: invoice.Number,
            status: 'shipped',
            shippedAt: currentDate
          });
          
          console.log('Shipment updated with tracking number and shipped status successfully');
        } catch (error) {
          console.error('Error updating shipment with tracking number and status:', error);
        }
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Detailed error creating invoice:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to create invoice",
        details: error.message 
      });
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
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid serial number ID" });
      }
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

  app.post("/api/serial-numbers/bulk-create", async (req, res) => {
    try {
      const { productId, count } = req.body;
      
      if (!productId || !count || count < 1 || count > 100) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const result = await storage.createBulkSerialNumbers(productId, count);
      res.json({ created: result.length, serialNumbers: result });
    } catch (error) {
      console.error("Error creating bulk serial numbers:", error);
      res.status(500).json({ error: "Failed to create serial numbers" });
    }
  });

  // API endpoints для прив'язки серійних номерів до позицій замовлень
  app.post("/api/order-items/:orderItemId/assign-serial-numbers", async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.orderItemId);
      const { serialNumberIds } = req.body;
      
      if (!Array.isArray(serialNumberIds) || serialNumberIds.length === 0) {
        return res.status(400).json({ error: "Serial number IDs are required" });
      }

      const result = await storage.assignSerialNumbersToOrderItem(orderItemId, serialNumberIds);
      res.json(result);
    } catch (error) {
      console.error("Error assigning serial numbers:", error);
      res.status(500).json({ error: "Failed to assign serial numbers" });
    }
  });

  app.get("/api/order-items/:orderItemId/serial-numbers", async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.orderItemId);
      const assignments = await storage.getOrderItemSerialNumbers(orderItemId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching order item serial numbers:", error);
      res.status(500).json({ error: "Failed to fetch serial numbers" });
    }
  });

  app.delete("/api/order-item-serial-numbers/:assignmentId", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const success = await storage.removeSerialNumberAssignment(assignmentId);
      
      if (!success) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing serial number assignment:", error);
      res.status(500).json({ error: "Failed to remove assignment" });
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

  // Order Statuses API
  app.get("/api/order-statuses", async (req, res) => {
    try {
      const statuses = await storage.getOrderStatuses();
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching order statuses:", error);
      res.status(500).json({ error: "Failed to fetch order statuses" });
    }
  });

  app.post("/api/order-statuses", async (req, res) => {
    try {
      const validatedData = insertOrderStatusSchema.parse(req.body);
      const status = await storage.createOrderStatus(validatedData);
      res.status(201).json(status);
    } catch (error) {
      console.error("Error creating order status:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid status data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order status" });
      }
    }
  });

  app.put("/api/order-statuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOrderStatusSchema.parse(req.body);
      const status = await storage.updateOrderStatus(id, validatedData);
      if (!status) {
        return res.status(404).json({ error: "Order status not found" });
      }
      res.json(status);
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid status data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  });

  app.delete("/api/order-statuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrderStatus(id);
      if (!success) {
        return res.status(404).json({ error: "Order status not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order status:", error);
      res.status(500).json({ error: "Failed to delete order status" });
    }
  });

  // Clients API
  app.get("/api/clients", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      
      const result = await storage.getClientsPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Failed to get clients:", error);
      res.status(500).json({ error: "Failed to get clients" });
    }
  });

  // Окремий endpoint для пошуку клієнтів (без пагінації)
  app.get("/api/clients/search", async (req, res) => {
    try {
      const search = req.query.q as string || '';
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!search.trim()) {
        // Якщо немає пошукового запиту, повертаємо перші записи
        const result = await storage.getClientsPaginated(1, limit);
        return res.json({ clients: result.clients });
      }

      // Пошук по всій базі з обмеженням кількості результатів
      const result = await storage.getClientsPaginated(1, limit, search);
      res.json({ clients: result.clients });
    } catch (error) {
      console.error("Failed to search clients:", error);
      res.status(500).json({ error: "Failed to search clients" });
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

  // XML Import endpoint for clients
  // Store import jobs in memory (in production, use Redis or database)
  const importJobs = new Map<string, {
    id: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: string[];
    details: Array<{
      name: string;
      status: 'imported' | 'updated' | 'skipped' | 'error';
      message?: string;
    }>;
    totalRows: number;
  }>();

  // Generate unique job ID
  function generateJobId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start XML import (returns job ID immediately)
  // XML import for client contacts
  app.post("/api/client-contacts/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file uploaded" 
        });
      }

      const jobId = generateJobId();
      
      // Initialize job status for client contacts
      importJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        totalRows: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        logs: [],
        failedIds: [],
        startTime: new Date().toISOString(),
        endTime: null
      });

      // Start async processing for client contacts
      processClientContactsXmlImportAsync(jobId, req.file.buffer);

      res.json({
        success: true,
        jobId: jobId,
        message: "Client contacts import started successfully"
      });
    } catch (error) {
      console.error("Client contacts XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to process XML file" 
      });
    }
  });

  app.post("/api/clients/import-xml", upload.single('xmlFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: "No XML file provided" 
        });
      }

      const jobId = generateJobId();
      
      // Initialize job with proper structure
      importJobs.set(jobId, {
        id: jobId,
        status: 'processing',
        progress: 0,
        processed: 0,
        imported: 0,
        skipped: 0,
        errors: [],
        details: [],
        logs: [],
        failedIds: [],
        totalRows: 0,
        startTime: new Date().toISOString()
      });

      // Return job ID immediately
      res.json({
        success: true,
        jobId,
        message: "Import job started. Use the job ID to check progress."
      });

      // Process import asynchronously
      processXmlImportAsync(jobId, req.file.buffer);

    } catch (error) {
      console.error("XML import error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to start XML import",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Check import job status
  app.get("/api/clients/import-xml/:jobId/status", (req, res) => {
    const { jobId } = req.params;
    const job = importJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job
    });
  });

  // Async import processing function
  async function processXmlImportAsync(jobId: string, fileBuffer: Buffer) {
    const job = importJobs.get(jobId);
    if (!job) return;

    try {
      const xmlContent = fileBuffer.toString('utf-8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true
      });
      
      const result = await parser.parseStringPromise(xmlContent);
      
      if (!result.DATAPACKET || !result.DATAPACKET.ROWDATA || !result.DATAPACKET.ROWDATA.ROW) {
        job.status = 'failed';
        job.errors.push("Invalid XML format. Expected DATAPACKET structure.");
        return;
      }

      const rows = Array.isArray(result.DATAPACKET.ROWDATA.ROW) 
        ? result.DATAPACKET.ROWDATA.ROW 
        : [result.DATAPACKET.ROWDATA.ROW];

      job.totalRows = rows.length;
      console.log(`Starting client import with ${rows.length} rows`);
      
      // Get all carriers for matching by name (once at start)
      const carriers = await storage.getCarriers();
      const existingClients = await storage.getClients();

      // Process in batches to avoid memory issues and allow progress updates
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        for (const row of batch) {
          try {
            await processClientRow(row, job, carriers, existingClients);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            job.details.push({
              name: row.PREDPR || 'Unknown',
              status: 'error',
              message: errorMessage
            });
            job.errors.push(`Row ${job.processed + 1} (${row.PREDPR}): ${errorMessage}`);
          }
          
          job.processed++;
          job.progress = Math.round((job.processed / job.totalRows) * 100);
        }

        // Small delay between batches to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      job.skipped = job.processed - job.imported - job.errors.length;
      job.status = 'completed';
      job.progress = 100;

      // Clean up job after 5 minutes
      setTimeout(() => {
        importJobs.delete(jobId);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Async XML import error:", error);
      job.status = 'failed';
      job.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Process individual client row
  async function processClientRow(row: any, job: any, carriers: any[], existingClients: any[]) {
    if (!row.PREDPR) {
      job.details.push({
        name: row.NAME || 'Unknown',
        status: 'error',
        message: 'Missing required PREDPR field',
        id_predpr: row.ID_PREDPR || 'N/A'
      });
      job.errors.push(`Row ${job.processed + 1}: Missing required PREDPR field (ID_PREDPR: ${row.ID_PREDPR || 'N/A'})`);
      job.failedIds.push(row.ID_PREDPR || 'N/A');
      return;
    }

    // Initialize variables
    let carrierId: number | null = null;
    let warehouseRef: string | null = null;
    let carrierNote = '';
    let warehouseNumber: string | null = null;
    
    // Find carrier by transport name and extract warehouse number
    if (row.NAME_TRANSPORT) {
      const transportName = row.NAME_TRANSPORT.toLowerCase();
      
      // Extract warehouse number from patterns like "Нова пошта №178"
      const warehouseMatch = row.NAME_TRANSPORT.match(/№(\d+)/);
      warehouseNumber = warehouseMatch ? warehouseMatch[1] : null;
      
      const foundCarrier = carriers.find(carrier => {
        const carrierName = carrier.name.toLowerCase();
        const altNames = carrier.alternativeNames || [];
        
        return carrierName.includes(transportName) || 
               transportName.includes(carrierName) ||
               altNames.some(alt => alt.toLowerCase().includes(transportName) || 
                                   transportName.includes(alt.toLowerCase()));
      });
      
      if (foundCarrier) {
        carrierId = foundCarrier.id;
      } else {
        carrierNote = `Перевізник: ${row.NAME_TRANSPORT}`;
      }
    }

    // Handle CITY field - find city_ref based on city name
    let cityRef = null;
    if (row.CITY) {
      try {
        const cityQuery = `
          SELECT ref FROM nova_poshta_cities 
          WHERE name ILIKE $1 
          LIMIT 1
        `;
        const cityResult = await pool.query(cityQuery, [row.CITY.trim()]);
        if (cityResult.rows.length > 0) {
          cityRef = cityResult.rows[0].ref as string;
        }
      } catch (error) {
        console.error('Error searching city:', error);
      }
    }

    // Search for warehouse in the found city
    if (carrierId && warehouseNumber && cityRef) {
      const foundCarrier = carriers.find(carrier => carrier.id === carrierId);
      
      if (foundCarrier && foundCarrier.name.toLowerCase().includes('пошта')) {
        try {
          const warehouseQuery = `
            SELECT ref FROM nova_poshta_warehouses 
            WHERE city_ref = $1 AND description LIKE $2 
            LIMIT 1
          `;
          const warehouseResult = await pool.query(warehouseQuery, [cityRef, `%№${warehouseNumber}:%`]);
          if (warehouseResult.rows.length > 0) {
            warehouseRef = warehouseResult.rows[0].ref as string;
          }
        } catch (error) {
          console.error('Error searching warehouse in city:', error);
        }
      }
    }

    // Handle EDRPOU field - validate length and convert incorrect to null
    let taxCode = null;
    if (row.EDRPOU && row.EDRPOU !== '0' && row.EDRPOU.trim() !== '') {
      const cleanCode = row.EDRPOU.trim().replace(/\D/g, '');
      if (cleanCode.length === 8 || cleanCode.length === 10) {
        taxCode = cleanCode;
      } else {
        // Log warning about incorrect EDRPOU format but continue import without tax code
        job.logs.push({
          type: 'warning',
          message: `Некоректний ЄДРПОУ для ${row.PREDPR}: "${row.EDRPOU}" (має бути 8 або 10 цифр)`,
          details: `Клієнт буде імпортований без ЄДРПОУ`
        });
      }
    }

    // Determine client type
    let clientTypeId = 1; // Default to Юридична особа
    if (taxCode) {
      if (taxCode.length === 8) {
        clientTypeId = 1; // Юридична особа
      } else if (taxCode.length === 10) {
        clientTypeId = 2; // Фізична особа
      }
    }

    // Parse DATE_CREATE once for all checks
    let createdAt = null;
    if (row.DATE_CREATE) {
      try {
        const dateStr = row.DATE_CREATE.trim();
        const dateParts = dateStr.split('.');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const year = parseInt(dateParts[2], 10);
          
          createdAt = new Date(year, month, day, 8, 0, 0);
          
          if (isNaN(createdAt.getTime())) {
            createdAt = null;
          }
        }
      } catch (error) {
        createdAt = null;
      }
    }

    // Check for existing clients
    let existingClient = null;
    
    // Check for duplicate external_id first
    if (row.ID_PREDPR) {
      existingClient = existingClients.find(client => 
        client.externalId === row.ID_PREDPR
      );
      
      if (existingClient) {
        job.details.push({
          name: row.PREDPR,
          status: 'skipped',
          message: `Клієнт з external_id ${row.ID_PREDPR} вже існує`
        });
        job.skipped++;
        return;
      }
    }
    
    if (taxCode) {
      existingClient = existingClients.find(client => 
        client.taxCode === taxCode
      );
      
      if (existingClient) {
        // Use parsed date or current date for comparison
        const newCreatedAt = createdAt || new Date();
        const existingCreatedAt = new Date(existingClient.createdAt);
        
        if (existingCreatedAt.getTime() === newCreatedAt.getTime()) {
          // Same creation time - skip
          job.details.push({
            name: row.PREDPR,
            status: 'skipped',
            message: `Клієнт з ЄДРПОУ/ІПН ${taxCode} вже існує з однаковою датою створення`
          });
          job.skipped++;
          return;
        } else if (existingCreatedAt < newCreatedAt) {
          // Existing client is older - remove taxCode, deactivate and add note, then continue with import
          try {
            const existingNotes = existingClient.notes || '';
            const taxCodeNote = `ЄДРПОУ: ${taxCode}`;
            const updatedNotes = existingNotes ? `${existingNotes}. ${taxCodeNote}` : taxCodeNote;
            
            await storage.updateClient(existingClient.id, { 
              taxCode: null,
              isActive: false,
              notes: updatedNotes
            });
            console.log(`Removed taxCode, deactivated older client and added note, taxCode ${taxCode}, id: ${existingClient.id}`);
            // Continue with import to create new client with this taxCode
          } catch (updateError) {
            console.error('Error updating existing client:', updateError);
            job.details.push({
              name: row.PREDPR,
              status: 'error',
              message: `Помилка при оновленні існуючого клієнта: ${updateError instanceof Error ? updateError.message : String(updateError)}`
            });
            job.errors.push(`Row ${job.processed + 1} (${row.PREDPR}): Error updating existing client`);
            return;
          }
        } else {
          // New client would be older - skip
          job.details.push({
            name: row.PREDPR,
            status: 'skipped',
            message: `Існує новіший клієнт з ЄДРПОУ/ІПН ${taxCode}`
          });
          job.skipped++;
          return;
        }
      }
    }

    // Build notes
    let notes = row.COMMENT || '';
    if (carrierNote) {
      notes = notes ? `${notes}. ${carrierNote}` : carrierNote;
    }



    const clientData = {
      taxCode: taxCode,
      name: row.PREDPR,
      fullName: row.NAME || row.PREDPR,
      clientTypeId: clientTypeId,
      physicalAddress: row.ADDRESS_PHYS || null,
      notes: notes || null,
      isActive: row.ACTUAL === 'T' || row.ACTUAL === 'true',
      source: 'xml_import',
      carrierId: carrierId,
      discount: row.SKIT ? parseFloat(row.SKIT.replace(',', '.')) : 0,
      externalId: row.ID_PREDPR || null,
      warehouseRef: warehouseRef,
      cityRef: cityRef,
      createdAt: createdAt,
    };

    try {
      await storage.createClient(clientData);
      
      // Determine the message based on whether an older client was deactivated
      let message = 'Imported';
      if (carrierId) {
        message = `Linked to carrier: ${carriers.find(c => c.id === carrierId)?.name}`;
      }
      
      // Check if we removed taxCode from existing client
      if (taxCode && existingClient && existingClient.taxCode === taxCode) {
        message += '. Старий клієнт деактивовано, ЄДРПОУ перенесено в коментарі';
      }
      
      job.details.push({
        name: row.PREDPR,
        status: 'imported',
        message: message
      });
      job.imported++;
    } catch (createError) {
      const createErrorMessage = createError instanceof Error ? createError.message : 'Unknown create error';
      if (createErrorMessage.includes('duplicate key value violates unique constraint') && taxCode) {
        job.details.push({
          name: row.PREDPR,
          status: 'skipped',
          message: 'Duplicate tax code - skipped'
        });
        job.skipped++;
      } else {
        job.details.push({
          name: row.PREDPR,
          status: 'error',
          message: createErrorMessage
        });
        job.errors.push(`Row ${job.processed + 1} (${row.PREDPR}): ${createErrorMessage}`);
      }
    }
  }

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

  // Client Nova Poshta API Settings Routes
  app.get("/api/clients/:clientId/nova-poshta-api-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settings = await storage.getClientNovaPoshtaApiSettings(clientId);
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to fetch Nova Poshta API settings" });
    }
  });

  app.get("/api/nova-poshta-api-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.getClientNovaPoshtaApiSetting(id);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta API settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to fetch Nova Poshta API settings" });
    }
  });

  app.post("/api/clients/:clientId/nova-poshta-api-settings", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsData = { ...req.body, clientId };
      const settings = await storage.createClientNovaPoshtaApiSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Failed to create Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to create Nova Poshta API settings" });
    }
  });

  app.patch("/api/nova-poshta-api-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = await storage.updateClientNovaPoshtaApiSettings(id, req.body);
      if (!settings) {
        return res.status(404).json({ error: "Nova Poshta API settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to update Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to update Nova Poshta API settings" });
    }
  });

  app.delete("/api/nova-poshta-api-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClientNovaPoshtaApiSettings(id);
      if (!success) {
        return res.status(404).json({ error: "Nova Poshta API settings not found" });
      }
      res.json({ message: "Nova Poshta API settings deleted successfully" });
    } catch (error) {
      console.error("Failed to delete Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to delete Nova Poshta API settings" });
    }
  });

  app.patch("/api/clients/:clientId/nova-poshta-api-settings/:id/set-primary", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const settingsId = parseInt(req.params.id);
      const success = await storage.setPrimaryClientNovaPoshtaApiSettings(clientId, settingsId);
      if (!success) {
        return res.status(404).json({ error: "Failed to set primary Nova Poshta API settings" });
      }
      res.json({ message: "Primary Nova Poshta API settings updated successfully" });
    } catch (error) {
      console.error("Failed to set primary Nova Poshta API settings:", error);
      res.status(500).json({ error: "Failed to set primary Nova Poshta API settings" });
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
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const search = req.query.search as string;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      if (page && limit && storage.getClientContactsPaginated) {
        // Paginated request
        const result = await storage.getClientContactsPaginated(page, limit, search, clientId);
        res.json(result);
      } else if (clientId) {
        // Filter contacts for specific client (for popup)
        console.log(`Filtering contacts for client ${clientId}`);
        const contacts = await storage.getClientContactsByClientId ? 
          await storage.getClientContactsByClientId(clientId) : 
          (await storage.getClientContacts()).filter(c => c.clientId === clientId);
        res.json(contacts);
      } else {
        // All contacts without pagination
        const contacts = await storage.getClientContacts();
        res.json(contacts);
      }
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      res.status(500).json({ message: "Failed to fetch client contacts" });
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

  // Get contacts by client ID for popup
  app.get("/api/client-contacts/by-client/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const contacts = await storage.getClientContactsByClientId ? 
        await storage.getClientContactsByClientId(clientId) : 
        (await storage.getClientContacts()).filter(c => c.clientId === clientId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching client contacts by clientId:", error);
      res.status(500).json({ message: "Failed to fetch client contacts" });
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

  // Company logo upload
  app.post("/api/companies/:id/logo", isSimpleAuthenticated, logoUpload.single('logo'), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ error: "No logo file provided" });
      }

      // Convert image to base64
      const base64Logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      // Update company with logo
      const updatedCompany = await storage.updateCompany(companyId, { logo: base64Logo });
      
      if (!updatedCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json({ 
        message: "Logo uploaded successfully", 
        logo: base64Logo,
        company: updatedCompany 
      });
    } catch (error) {
      console.error("Error uploading company logo:", error);
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // Remove company logo
  app.delete("/api/companies/:id/logo", isSimpleAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      
      const updatedCompany = await storage.updateCompany(companyId, { logo: null });
      
      if (!updatedCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json({ 
        message: "Logo removed successfully", 
        company: updatedCompany 
      });
    } catch (error) {
      console.error("Error removing company logo:", error);
      res.status(500).json({ error: "Failed to remove logo" });
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

  // ==================== REPAIRS API ====================
  
  // Отримати всі ремонти
  app.get("/api/repairs", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairs = await storage.getRepairs();
      res.json(repairs);
    } catch (error) {
      console.error("Error fetching repairs:", error);
      res.status(500).json({ error: "Failed to fetch repairs" });
    }
  });

  // Отримати ремонт за ID
  app.get("/api/repairs/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const repair = await storage.getRepair(parseInt(req.params.id));
      if (!repair) {
        return res.status(404).json({ error: "Repair not found" });
      }
      res.json(repair);
    } catch (error) {
      console.error("Error fetching repair:", error);
      res.status(500).json({ error: "Failed to fetch repair" });
    }
  });

  // Створити новий ремонт
  app.post("/api/repairs", isSimpleAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRepairSchema.parse(req.body);
      const repair = await storage.createRepair(validatedData);
      res.status(201).json(repair);
    } catch (error) {
      console.error("Error creating repair:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create repair" });
    }
  });

  // Оновити ремонт
  app.patch("/api/repairs/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairId = parseInt(req.params.id);
      const validatedData = insertRepairSchema.partial().parse(req.body);
      const repair = await storage.updateRepair(repairId, validatedData);
      res.json(repair);
    } catch (error) {
      console.error("Error updating repair:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update repair" });
    }
  });

  // Видалити ремонт
  app.delete("/api/repairs/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      await storage.deleteRepair(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting repair:", error);
      res.status(500).json({ error: "Failed to delete repair" });
    }
  });

  // Пошук ремонтів за серійним номером
  app.get("/api/repairs/search/:serialNumber", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairs = await storage.getRepairsBySerialNumber(req.params.serialNumber);
      res.json(repairs);
    } catch (error) {
      console.error("Error searching repairs:", error);
      res.status(500).json({ error: "Failed to search repairs" });
    }
  });

  // Отримати запчастини ремонту
  app.get("/api/repairs/:id/parts", isSimpleAuthenticated, async (req, res) => {
    try {
      const parts = await storage.getRepairParts(parseInt(req.params.id));
      res.json(parts);
    } catch (error) {
      console.error("Error fetching repair parts:", error);
      res.status(500).json({ error: "Failed to fetch repair parts" });
    }
  });

  // Додати запчастину до ремонту
  app.post("/api/repairs/:id/parts", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairId = parseInt(req.params.id);
      const validatedData = insertRepairPartSchema.parse({
        ...req.body,
        repairId
      });
      const part = await storage.addRepairPart(validatedData);
      res.status(201).json(part);
    } catch (error) {
      console.error("Error adding repair part:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add repair part" });
    }
  });

  // Видалити запчастину з ремонту
  app.delete("/api/repairs/:repairId/parts/:partId", isSimpleAuthenticated, async (req, res) => {
    try {
      await storage.deleteRepairPart(parseInt(req.params.partId));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting repair part:", error);
      res.status(500).json({ error: "Failed to delete repair part" });
    }
  });

  // Отримати історію статусів ремонту
  app.get("/api/repairs/:id/status-history", isSimpleAuthenticated, async (req, res) => {
    try {
      const history = await storage.getRepairStatusHistory(parseInt(req.params.id));
      res.json(history);
    } catch (error) {
      console.error("Error fetching repair status history:", error);
      res.status(500).json({ error: "Failed to fetch repair status history" });
    }
  });

  // Змінити статус ремонту
  app.post("/api/repairs/:id/status", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairId = parseInt(req.params.id);
      const { newStatus, comment } = req.body;
      
      if (!newStatus) {
        return res.status(400).json({ error: "New status is required" });
      }

      const statusHistory = await storage.changeRepairStatus(repairId, newStatus, comment, req.user?.id);
      res.status(201).json(statusHistory);
    } catch (error) {
      console.error("Error changing repair status:", error);
      res.status(500).json({ error: "Failed to change repair status" });
    }
  });

  // Отримати документи ремонту
  app.get("/api/repairs/:id/documents", isSimpleAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getRepairDocuments(parseInt(req.params.id));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching repair documents:", error);
      res.status(500).json({ error: "Failed to fetch repair documents" });
    }
  });

  // Додати документ до ремонту
  app.post("/api/repairs/:id/documents", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairId = parseInt(req.params.id);
      const validatedData = insertRepairDocumentSchema.parse({
        ...req.body,
        repairId,
        uploadedBy: req.user?.id
      });
      const document = await storage.addRepairDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error adding repair document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to add repair document" });
    }
  });

  // Пошук серійних номерів для створення ремонту
  app.get("/api/serial-numbers/for-repair", isSimpleAuthenticated, async (req, res) => {
    try {
      const { search } = req.query;
      console.log("Serial numbers search request:", { search });
      
      const serialNumbers = await storage.getSerialNumbersForRepair(search as string);
      console.log("Found serial numbers:", serialNumbers.length);
      
      res.json(serialNumbers);
    } catch (error) {
      console.error("Error fetching serial numbers for repair:", error);
      res.status(500).json({ error: "Failed to fetch serial numbers" });
    }
  });

  // Додати запчастини до ремонту зі списанням зі складу
  app.post("/api/repairs/:id/parts", isSimpleAuthenticated, async (req, res) => {
    try {
      const repairId = parseInt(req.params.id);
      if (isNaN(repairId)) {
        return res.status(400).json({ error: "Invalid repair ID" });
      }

      const { inventoryId, quantity, description } = req.body;
      
      // Перевіряємо наявність товару на складі
      const inventory = await storage.getInventory();
      const item = inventory.find(i => i.id === inventoryId);
      
      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      if (item.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient quantity in stock" });
      }

      // Додаємо запчастину до ремонту
      const repairPart = await storage.createRepairPart({
        repairId,
        inventoryId,
        quantity,
        description: description || item.product?.name || "Запчастина",
        cost: (item.product?.price || 0) * quantity
      });

      // Списуємо зі складу
      await storage.updateInventory(inventoryId, item.quantity - quantity);

      res.status(201).json(repairPart);
    } catch (error) {
      console.error("Error adding repair part:", error);
      res.status(500).json({ error: "Failed to add repair part" });
    }
  });

  // Видалити запчастину з ремонту та повернути на склад
  app.delete("/api/repair-parts/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const partId = parseInt(req.params.id);
      if (isNaN(partId)) {
        return res.status(400).json({ error: "Invalid part ID" });
      }

      await storage.deleteRepairPart(partId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting repair part:", error);
      res.status(500).json({ error: "Failed to delete repair part" });
    }
  });

  // ================================
  // API ДЛЯ ПРИВ'ЯЗКИ СЕРІЙНИХ НОМЕРІВ ДО ЗАМОВЛЕНЬ
  // ================================

  // Прив'язати серійні номери до позиції замовлення
  app.post("/api/order-items/:id/serial-numbers", isSimpleAuthenticated, async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.id);
      const { serialNumberIds, notes } = req.body;

      if (!Array.isArray(serialNumberIds) || serialNumberIds.length === 0) {
        return res.status(400).json({ error: "Необхідно вказати серійні номери" });
      }

      await storage.assignSerialNumbersToOrderItem(orderItemId, serialNumberIds, req.session?.user?.id);
      res.status(201).json({ message: "Серійні номери успішно прив'язані" });
    } catch (error) {
      console.error("Error assigning serial numbers:", error);
      res.status(500).json({ error: "Помилка прив'язки серійних номерів" });
    }
  });

  // Отримати серійні номери позиції замовлення
  app.get("/api/order-items/:id/serial-numbers", isSimpleAuthenticated, async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.id);
      const serialNumbers = await storage.getOrderItemSerialNumbers(orderItemId);
      res.json(serialNumbers);
    } catch (error) {
      console.error("Error fetching order item serial numbers:", error);
      res.status(500).json({ error: "Помилка отримання серійних номерів" });
    }
  });

  // Видалити прив'язку серійного номера
  app.delete("/api/order-item-serial-numbers/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      await storage.removeSerialNumberFromOrderItem(assignmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing serial number assignment:", error);
      res.status(500).json({ error: "Помилка видалення прив'язки" });
    }
  });

  // Отримати доступні серійні номери для продукту
  app.get("/api/products/:id/available-serial-numbers", isSimpleAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const serialNumbers = await storage.getAvailableSerialNumbersForProduct(productId);
      res.json(serialNumbers);
    } catch (error) {
      console.error("Error fetching available serial numbers:", error);
      res.status(500).json({ error: "Помилка отримання доступних серійних номерів" });
    }
  });

  // Завершити замовлення з прив'язаними серійними номерами
  app.post("/api/orders/:id/complete-with-serials", isSimpleAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      await storage.completeOrderWithSerialNumbers(orderId);
      res.json({ message: "Замовлення успішно завершено" });
    } catch (error) {
      console.error("Error completing order with serial numbers:", error);
      res.status(500).json({ error: "Помилка завершення замовлення" });
    }
  });

  // Створити та прив'язати серійні номери до позиції замовлення
  app.post("/api/order-items/:id/create-and-assign-serials", isSimpleAuthenticated, async (req, res) => {
    try {
      const orderItemId = parseInt(req.params.id);
      const { productId, serialNumbers } = req.body;

      if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
        return res.status(400).json({ error: "Серійні номери не надані" });
      }

      if (!productId) {
        return res.status(400).json({ error: "ID продукту не надано" });
      }

      const userId = (req.session as any).user?.id || 1;
      const result = await storage.createAndAssignSerialNumbers(orderItemId, productId, serialNumbers, userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error creating and assigning serial numbers:", error);
      res.status(500).json({ error: "Помилка створення серійних номерів" });
    }
  });

  // Перевірити дублікати серійних номерів
  app.post("/api/serial-numbers/check-duplicates", isSimpleAuthenticated, async (req, res) => {
    try {
      const { serialNumbers } = req.body;

      if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
        return res.json({ duplicates: [] });
      }

      const duplicates = await storage.checkSerialNumberDuplicates(serialNumbers);
      res.json({ duplicates });
    } catch (error) {
      console.error("Error checking duplicates:", error);
      res.status(500).json({ error: "Помилка перевірки дублікатів" });
    }
  });

  // Редагувати серійний номер
  app.put("/api/serial-numbers/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const serialId = parseInt(req.params.id);
      const { serialNumber } = req.body;

      if (!serialNumber || !serialNumber.trim()) {
        return res.status(400).json({ error: "Серійний номер не може бути пустим" });
      }

      await storage.updateSerialNumber(serialId, { serialNumber: serialNumber.trim() });
      
      res.json({ success: true, message: "Серійний номер оновлено" });
    } catch (error) {
      console.error("Error updating serial number:", error);
      res.status(500).json({ error: "Помилка оновлення серійного номера" });
    }
  });

  // ========================================
  // Roles and Permissions API Routes
  // ========================================

  // Get all roles
  app.get("/api/roles", isSimpleAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Помилка отримання ролей" });
    }
  });

  // Get role by ID
  app.get("/api/roles/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ error: "Роль не знайдена" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Помилка отримання ролі" });
    }
  });

  // Create new role
  app.post("/api/roles", isSimpleAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Помилка створення ролі" });
    }
  });

  // Update role
  app.put("/api/roles/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const validatedData = insertRoleSchema.partial().parse(req.body);
      const role = await storage.updateRole(roleId, validatedData);
      
      if (!role) {
        return res.status(404).json({ error: "Роль не знайдена" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Помилка оновлення ролі" });
    }
  });

  // Delete role
  app.delete("/api/roles/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const success = await storage.deleteRole(roleId);
      
      if (!success) {
        return res.status(404).json({ error: "Роль не знайдена" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Помилка видалення ролі" });
    }
  });

  // Get all system modules
  app.get("/api/system-modules", isSimpleAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getSystemModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching system modules:", error);
      res.status(500).json({ error: "Помилка отримання модулів системи" });
    }
  });

  // Get system module by ID
  app.get("/api/system-modules/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getSystemModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ error: "Модуль не знайдено" });
      }
      
      res.json(module);
    } catch (error) {
      console.error("Error fetching system module:", error);
      res.status(500).json({ error: "Помилка отримання модуля системи" });
    }
  });

  // Create new system module
  app.post("/api/system-modules", isSimpleAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSystemModuleSchema.parse(req.body);
      const module = await storage.createSystemModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating system module:", error);
      res.status(500).json({ error: "Помилка створення модуля системи" });
    }
  });

  // Update system module
  app.put("/api/system-modules/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const validatedData = insertSystemModuleSchema.partial().parse(req.body);
      const module = await storage.updateSystemModule(moduleId, validatedData);
      
      if (!module) {
        return res.status(404).json({ error: "Модуль не знайдено" });
      }
      
      res.json(module);
    } catch (error) {
      console.error("Error updating system module:", error);
      res.status(500).json({ error: "Помилка оновлення модуля системи" });
    }
  });

  // Delete system module
  app.delete("/api/system-modules/:id", isSimpleAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const success = await storage.deleteSystemModule(moduleId);
      
      if (!success) {
        return res.status(404).json({ error: "Модуль не знайдено" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting system module:", error);
      res.status(500).json({ error: "Помилка видалення модуля системи" });
    }
  });

  // Get all permissions
  app.get("/api/permissions", isSimpleAuthenticated, async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Помилка отримання дозволів" });
    }
  });

  // Get role permissions
  app.get("/api/roles/:id/permissions", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const permissions = await storage.getRolePermissions(roleId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Помилка отримання дозволів ролі" });
    }
  });

  // Assign permission to role
  app.post("/api/roles/:roleId/permissions/:permissionId", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      console.log("Request body:", req.body);
      console.log("Request body type:", typeof req.body);
      
      let granted = true;
      if (req.body && typeof req.body === 'object') {
        granted = req.body.granted !== undefined ? Boolean(req.body.granted) : true;
      }
      
      console.log("Parsed granted value:", granted);
      
      const rolePermission = await storage.assignPermissionToRole(roleId, permissionId, granted);
      res.status(201).json(rolePermission);
    } catch (error) {
      console.error("Error assigning permission to role:", error);
      res.status(500).json({ error: "Помилка призначення дозволу ролі" });
    }
  });

  // Remove permission from role
  app.delete("/api/roles/:roleId/permissions/:permissionId", isSimpleAuthenticated, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const permissionId = parseInt(req.params.permissionId);
      
      const success = await storage.removePermissionFromRole(roleId, permissionId);
      
      if (!success) {
        return res.status(404).json({ error: "Дозвіл не знайдено" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing permission from role:", error);
      res.status(500).json({ error: "Помилка видалення дозволу ролі" });
    }
  });

  // Get user permissions
  app.get("/api/users/:id/permissions", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Помилка отримання дозволів користувача" });
    }
  });

  // Assign permission to user
  app.post("/api/users/:userId/permissions/:permissionId", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissionId = parseInt(req.params.permissionId);
      const { granted = true, grantor, expiresAt } = req.body;
      
      const userPermission = await storage.assignPermissionToUser(
        userId, 
        permissionId, 
        granted, 
        grantor, 
        expiresAt ? new Date(expiresAt) : undefined
      );
      res.status(201).json(userPermission);
    } catch (error) {
      console.error("Error assigning permission to user:", error);
      res.status(500).json({ error: "Помилка призначення дозволу користувачу" });
    }
  });

  // Remove permission from user
  app.delete("/api/users/:userId/permissions/:permissionId", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const permissionId = parseInt(req.params.permissionId);
      
      const success = await storage.removePermissionFromUser(userId, permissionId);
      
      if (!success) {
        return res.status(404).json({ error: "Дозвіл не знайдено" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing permission from user:", error);
      res.status(500).json({ error: "Помилка видалення дозволу користувача" });
    }
  });

  // Check user permission
  app.get("/api/users/:id/check-permission", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { module, action } = req.query;
      
      if (!module || !action) {
        return res.status(400).json({ error: "Параметри module та action обов'язкові" });
      }
      
      const hasPermission = await storage.checkUserPermission(userId, module as string, action as string);
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({ error: "Помилка перевірки дозволу користувача" });
    }
  });

  // Get user accessible modules
  app.get("/api/users/:id/accessible-modules", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const modules = await storage.getUserAccessibleModules(userId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching user accessible modules:", error);
      res.status(500).json({ error: "Помилка отримання доступних модулів користувача" });
    }
  });

  // Process supplier XML import asynchronously
  async function processSupplierXmlImportAsync(jobId: string, fileBuffer: Buffer) {
    const job = supplierImportJobs.get(jobId);
    if (!job) return;

    try {
      const xmlData = fileBuffer.toString('utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);

      if (!result?.DATAPACKET?.ROWDATA?.ROW) {
        job.status = 'failed';
        job.errors.push('Invalid XML format: No ROW data found');
        return;
      }

      const rows = Array.isArray(result.DATAPACKET.ROWDATA.ROW) 
        ? result.DATAPACKET.ROWDATA.ROW 
        : [result.DATAPACKET.ROWDATA.ROW];

      job.totalRows = rows.length;

      // Get existing suppliers and client types for validation
      const existingSuppliers = await storage.getSuppliers();

      const defaultClientType = { id: 1, name: 'Постачальник' };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        job.processed = i + 1;
        job.progress = Math.round((job.processed / job.totalRows) * 100);

        try {
          await processSupplierRow(row, job, existingSuppliers, defaultClientType.id);
        } catch (rowError) {
          console.error(`Error processing supplier row ${i + 1}:`, rowError);
          job.errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : String(rowError)}`);
          job.details.push({
            name: row.PREDPR || `Row ${i + 1}`,
            status: 'error',
            message: rowError instanceof Error ? rowError.message : String(rowError)
          });
        }
      }

      job.status = 'completed';
      console.log(`Supplier import completed: ${job.imported} imported, ${job.skipped} skipped, ${job.errors.length} errors`);

    } catch (error) {
      console.error('Error in processSupplierXmlImportAsync:', error);
      job.status = 'failed';
      job.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Process individual supplier row
  async function processSupplierRow(row: any, job: any, existingSuppliers: any[], clientTypeId: number) {
    // XML атрибути зберігаються в row.$ об'єкті
    const attrs = row.$ || row;
    

    
    if (!attrs.PREDPR?.trim()) {
      job.details.push({
        name: attrs.NAME || attrs.ID_PREDPR || 'Невідомий запис',
        status: 'skipped',
        message: 'Відсутня коротка назва постачальника (поле PREDPR)'
      });
      job.skipped++;
      return;
    }

    // Parse creation date
    let createdAt = null;
    if (attrs.DATE_CREATE) {
      try {
        const dateParts = attrs.DATE_CREATE.split('.');
        if (dateParts.length === 3) {
          createdAt = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        }
      } catch (dateError) {
        console.log(`Invalid date format for supplier ${attrs.PREDPR}: ${attrs.DATE_CREATE}`);
      }
    }

    // Check for existing supplier by external_id
    if (attrs.ID_PREDPR) {
      const existingByExternalId = existingSuppliers.find(supplier => 
        supplier.externalId === parseInt(attrs.ID_PREDPR)
      );
      
      if (existingByExternalId) {
        job.details.push({
          name: attrs.PREDPR,
          status: 'skipped',
          message: `Постачальник з external_id ${attrs.ID_PREDPR} вже існує`
        });
        job.skipped++;
        return;
      }
    }

    // Check for existing supplier by name
    const existingByName = existingSuppliers.find(supplier => 
      supplier.name && supplier.name.toLowerCase().trim() === attrs.PREDPR.toLowerCase().trim()
    );

    if (existingByName) {
      job.details.push({
        name: attrs.PREDPR,
        status: 'skipped',
        message: `Постачальник з назвою "${attrs.PREDPR}" вже існує`
      });
      job.skipped++;
      return;
    }

    // Parse EDRPOU/taxCode
    let taxCode = null;
    if (attrs.EDRPOU && attrs.EDRPOU.trim() !== '') {
      const cleanCode = attrs.EDRPOU.trim().replace(/\D/g, '');
      if (cleanCode.length === 8 || cleanCode.length === 10) {
        taxCode = cleanCode;
      }
    }

    const supplierData = {
      name: attrs.PREDPR,
      fullName: attrs.NAME || null,
      taxCode: taxCode,
      clientTypeId: clientTypeId,
      contactPerson: null,
      email: null,
      phone: null,
      address: attrs.ADDRESS_PHYS || null,
      description: attrs.COMMENT || null,
      paymentTerms: null,
      deliveryTerms: null,
      rating: 5,
      externalId: attrs.ID_PREDPR ? parseInt(attrs.ID_PREDPR) : null,
      isActive: attrs.ACTUAL === 'T' || attrs.ACTUAL === 'true',
      createdAt: createdAt,
    };



    try {
      const supplier = await storage.createSupplier(supplierData);
      job.details.push({
        name: attrs.PREDPR,
        status: 'imported',
        message: `Постачальник успішно імпортований з ID ${supplier.id}`
      });
      job.imported++;
      console.log(`Successfully imported supplier: ${attrs.PREDPR} with ID ${supplier.id}`);
    } catch (createError) {
      console.error(`Failed to create supplier ${attrs.PREDPR}:`, createError);
      job.details.push({
        name: attrs.PREDPR,
        status: 'error',
        message: `Помилка створення постачальника: ${createError instanceof Error ? createError.message : String(createError)}`
      });
      job.errors.push(`Failed to create supplier ${attrs.PREDPR}: ${createError instanceof Error ? createError.message : String(createError)}`);
    }
  }

  // Product XML import processing function
  async function processProductXmlImportAsync(jobId: string, fileBuffer: Buffer) {
    const job = productImportJobs.get(jobId);
    if (!job) return;

    try {
      const xmlData = fileBuffer.toString('utf8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true // Об'єднує атрибути з вмістом елементу
      });
      const result = await parser.parseStringPromise(xmlData);
      


      if (!result?.DATAPACKET?.ROWDATA?.ROW) {
        job.status = 'failed';
        job.errors.push('Invalid XML format: No ROW data found');
        return;
      }

      const rows = Array.isArray(result.DATAPACKET.ROWDATA.ROW) 
        ? result.DATAPACKET.ROWDATA.ROW 
        : [result.DATAPACKET.ROWDATA.ROW];

      job.totalRows = rows.length;

      // Get existing products for validation
      const existingProducts = await storage.getProducts();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        job.processed = i + 1;
        job.progress = Math.round((job.processed / job.totalRows) * 100);

        try {
          await processProductRow(row, job, existingProducts);
        } catch (rowError) {
          console.error(`Error processing product row ${i + 1}:`, rowError);
          job.errors.push(`Row ${i + 1}: ${rowError instanceof Error ? rowError.message : String(rowError)}`);
          job.details.push({
            name: row.NAME_ARTICLE || `Row ${i + 1}`,
            status: 'error',
            message: rowError instanceof Error ? rowError.message : String(rowError)
          });
        }
      }

      job.status = 'completed';
      console.log(`Product import completed: ${job.imported} imported, ${job.skipped} skipped, ${job.errors.length} errors`);

    } catch (error) {
      console.error('Error in processProductXmlImportAsync:', error);
      job.status = 'failed';
      job.errors.push(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function processClientContactsXmlImportAsync(jobId: string, fileBuffer: Buffer) {
    console.log(`Starting client contacts import with jobId: ${jobId}`);
    const job = importJobs.get(jobId);
    if (!job) {
      console.log(`Job ${jobId} not found`);
      return;
    }

    try {
      console.log('Starting client contacts XML import processing...');
      const xmlContent = fileBuffer.toString('utf-8');
      console.log(`XML content length: ${xmlContent.length} characters`);
      
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true
      });
      
      console.log('Parsing XML content...');
      const result = await parser.parseStringPromise(xmlContent);
      console.log('XML parsed successfully');
      
      if (!result.DATAPACKET || !result.DATAPACKET.ROWDATA || !result.DATAPACKET.ROWDATA.ROW) {
        job.status = 'failed';
        job.errors.push("Invalid XML format. Expected DATAPACKET structure.");
        return;
      }

      const rows = Array.isArray(result.DATAPACKET.ROWDATA.ROW) 
        ? result.DATAPACKET.ROWDATA.ROW 
        : [result.DATAPACKET.ROWDATA.ROW];

      job.totalRows = rows.length;
      
      // Get existing clients for matching by external_id
      console.log('Loading existing clients...');
      const existingClients = await storage.getClients();
      console.log(`Loaded ${existingClients.length} existing clients`);
      
      console.log('Loading existing contacts...');
      const existingContacts = await storage.getClientContacts();
      console.log(`Loaded ${existingContacts.length} existing contacts`);

      // Process in batches to avoid memory issues and allow progress updates
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        for (const row of batch) {
          try {
            console.log(`Processing contact row ${job.processed + 1}: ${row.FIO}`);
            await processClientContactRow(row, job, existingClients, existingContacts);
          } catch (error) {
            console.error(`Error processing contact row ${job.processed + 1}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            job.details.push({
              name: row.FIO || 'Unknown',
              status: 'error',
              message: errorMessage
            });
            job.errors.push(`Row ${job.processed + 1} (${row.FIO}): ${errorMessage}`);
          }
          
          job.processed++;
          job.progress = Math.round((job.processed / job.totalRows) * 100);
          console.log(`Progress: ${job.progress}% (${job.processed}/${job.totalRows})`);
        }

        // Small delay between batches to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      job.skipped = job.processed - job.imported - (job.errors?.length || 0);
      job.status = 'completed';
      job.progress = 100;
      job.endTime = new Date().toISOString();
      
      console.log(`Client contacts import completed: ${job.imported} imported, ${job.skipped} skipped, ${job.errors?.length || 0} errors`);
      
      // Add completion log
      job.logs.push({
        type: 'info',
        message: `Імпорт контактів завершено успішно`,
        details: `Імпортовано: ${job.imported}, Пропущено: ${job.skipped}, Помилок: ${job.errors?.length || 0}`
      });

      // Clean up job after 5 minutes
      setTimeout(() => {
        importJobs.delete(jobId);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Async client contacts XML import error:", error);
      job.status = 'failed';
      if (!job.errors) job.errors = [];
      job.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Process Order Items XML Import Async Function
  async function processOrderItemsXmlImportAsync(
    jobId: string, 
    xmlBuffer: Buffer, 
    orderId: number | null,
    jobsMap: Map<string, any>
  ) {
    const job = jobsMap.get(jobId);
    if (!job) return;

    try {
      const xmlContent = xmlBuffer.toString('utf-8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true
      });
      
      const result = await parser.parseStringPromise(xmlContent);
      
      if (!result.DATAPACKET || !result.DATAPACKET.ROWDATA || !result.DATAPACKET.ROWDATA.ROW) {
        job.status = 'failed';
        job.errors.push("Invalid XML format. Expected DATAPACKET structure.");
        job.logs.push({
          type: 'error',
          message: 'Невірний формат XML файлу',
          details: 'Очікується структура DATAPACKET/ROWDATA/ROW'
        });
        return;
      }

      const rows = Array.isArray(result.DATAPACKET.ROWDATA.ROW) 
        ? result.DATAPACKET.ROWDATA.ROW 
        : [result.DATAPACKET.ROWDATA.ROW];

      job.totalRows = rows.length;
      console.log(`Starting order items import with ${rows.length} rows`);
      
      // Get all products and orders for matching
      const products = await storage.getProducts();
      const orders = await storage.getOrders();
      
      // Process in batches
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        
        for (const row of batch) {
          try {
            await processOrderItemRow(row, job, products, orders, orderId);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            job.details.push({
              orderNumber: row.NAME_ZAKAZ || 'Unknown',
              productSku: row.INDEX_LISTARTICLE || 'Unknown',
              status: 'error',
              message: errorMessage
            });
            job.errors.push(`Row ${job.processed + 1}: ${errorMessage}`);
          }
          
          job.processed++;
          job.progress = Math.round((job.processed / job.totalRows) * 100);
          
          if (job.processed % 10 === 0 || job.processed === job.totalRows) {
            console.log(`Order items import progress: ${job.progress}% (${job.processed}/${job.totalRows})`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10));
      }

      job.skipped = job.processed - job.imported - job.errors.length;
      job.status = 'completed';
      job.progress = 100;
      
      console.log(`Order items import completed: ${job.imported} imported, ${job.skipped} skipped, ${job.errors.length} errors`);
      
      job.logs.push({
        type: 'info',
        message: `Імпорт позицій завершено успішно`,
        details: `Імпортовано: ${job.imported}, Пропущено: ${job.skipped}, Помилок: ${job.errors.length}`
      });

      setTimeout(() => {
        orderItemImportJobs.delete(jobId);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Async order items XML import error:", error);
      const job = jobsMap.get(jobId);
      if (job) {
        job.status = 'failed';
        job.progress = 0;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        job.errors.push(errorMessage);
        job.logs.push({
          type: 'error',
          message: 'Критична помилка імпорту позицій',
          details: errorMessage
        });
      }
    }
  }

  async function processOrderItemRow(row: any, job: any, products: any[], orders: any[], targetOrderId: number | null) {
    console.log(`\n=== Processing row ${job.processed + 1} ===`);
    console.log(`NAME_ZAKAZ: "${row.NAME_ZAKAZ}", INDEX_LISTARTICLE: "${row.INDEX_LISTARTICLE}"`);

    // Validate required fields
    if (!row.INDEX_LISTARTICLE) {
      console.log('❌ Missing INDEX_LISTARTICLE field');
      job.details.push({
        orderNumber: String(row.NAME_ZAKAZ || 'Unknown'),
        productSku: 'Missing',
        status: 'error',
        message: 'Missing required INDEX_LISTARTICLE field'
      });
      job.errors.push(`Row ${job.processed + 1}: Missing INDEX_LISTARTICLE`);
      return;
    }

    if (!row.NAME_ZAKAZ && !targetOrderId) {
      job.details.push({
        orderNumber: 'Missing',
        productSku: row.INDEX_LISTARTICLE,
        status: 'error',
        message: 'Missing required NAME_ZAKAZ field and no target order specified'
      });
      job.errors.push(`Row ${job.processed + 1}: Missing NAME_ZAKAZ`);
      return;
    }

    // Find product by SKU only
    const product = products.find(p => p.sku === row.INDEX_LISTARTICLE);
    if (!product) {
      console.log(`❌ Product not found for SKU: ${row.INDEX_LISTARTICLE}`);
      job.details.push({
        orderNumber: String(row.NAME_ZAKAZ || targetOrderId || 'Unknown'),
        productSku: row.INDEX_LISTARTICLE,
        status: 'error',
        message: `Product with SKU ${row.INDEX_LISTARTICLE} not found`
      });
      job.errors.push(`Row ${job.processed + 1}: Product SKU ${row.INDEX_LISTARTICLE} not found`);
      return;
    }
    console.log(`✅ Product found: SKU="${product.sku}"`);;

    // Find order by order number, ID, or use target order
    let order = null;
    if (targetOrderId) {
      order = orders.find(o => o.id === targetOrderId);
      console.log(`Looking for targetOrderId ${targetOrderId}: ${order ? '✅ FOUND' : '❌ NOT FOUND'}`);
    } else {
      // Try to find by order number first
      const searchOrderNumber = String(row.NAME_ZAKAZ);
      order = orders.find(o => o.orderNumber === searchOrderNumber);
      console.log(`Looking for order number "${searchOrderNumber}": ${order ? '✅ FOUND' : '❌ NOT FOUND'}`);
      
      // If not found and NAME_ZAKAZ is numeric, try to find by ID
      if (!order && !isNaN(parseInt(row.NAME_ZAKAZ))) {
        const searchId = parseInt(row.NAME_ZAKAZ);
        order = orders.find(o => o.id === searchId);
        console.log(`Looking for order ID ${searchId}: ${order ? '✅ FOUND' : '❌ NOT FOUND'}`);
      }
    }

    if (!order) {
      const errorMsg = targetOrderId 
        ? `Order with ID ${targetOrderId} not found`
        : `Order with number "${row.NAME_ZAKAZ}" not found`;
      console.log(`❌ ${errorMsg}`);
      job.details.push({
        orderNumber: String(row.NAME_ZAKAZ || targetOrderId || 'Unknown'),
        productSku: row.INDEX_LISTARTICLE,
        status: 'error',
        message: errorMsg
      });
      job.errors.push(`Row ${job.processed + 1}: Order not found`);
      return;
    }

    console.log(`✅ Order found: ID=${order.id}, number="${order.orderNumber}"`);

    // Parse numeric values
    const parseDecimal = (value: string | number): string => {
      if (!value) return "0";
      const str = value.toString().replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? "0" : num.toFixed(2);
    };

    const quantity = parseDecimal(row.COUNT_DET || "0");
    const unitPrice = parseDecimal(row.CENA || "0");
    const costPrice = row.PRICE_NET ? parseDecimal(row.PRICE_NET) : null;
    const totalPrice = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);

    try {
      const orderItemData = {
        orderId: order.id,
        productId: product.id,
        quantity: parseInt(quantity),
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        costPrice: costPrice,
        serialNumbers: row.SERIAL_NUMBER || null,
        notes: row.COMMENT || null,
      };

      const createdOrderItem = await storage.createOrderItem(orderItemData);

      // Імпорт серійних номерів в окрему таблицю з підтримкою діапазонів
      if (row.SERIAL_NUMBER && row.SERIAL_NUMBER.trim()) {
        const serialNumbersText = row.SERIAL_NUMBER.trim();
        const expandedSerialNumbers = parseSerialNumbers(serialNumbersText);
        
        console.log(`Original serial numbers: ${serialNumbersText}, Expanded: ${expandedSerialNumbers.join(', ')}`);
        
        for (const serialNumber of expandedSerialNumbers) {
          try {
            // Завжди створюємо новий серійний номер під час імпорту для кожної позиції замовлення
            // Це дозволяє одному серійному номеру бути в декількох позиціях
            const serialNumberRecord = await storage.createSerialNumber({
              productId: product.id,
              serialNumber: serialNumber,
              status: 'sold',
              orderId: order.id,
              invoiceNumber: order.orderNumber,
              saleDate: new Date()
            });
            
            // Прив'язуємо до позиції замовлення
            await storage.createOrderItemSerialNumber({
              orderItemId: createdOrderItem.id,
              serialNumberId: serialNumberRecord.id
            });
            
            console.log(`Created serial number ${serialNumber} for order item ${createdOrderItem.id}`);
            
          } catch (serialError) {
            console.error(`Failed to create serial number ${serialNumber}:`, serialError);
            job.logs.push({
              type: 'warning',
              message: `Не вдалося створити серійний номер: ${serialNumber}`,
              details: serialError instanceof Error ? serialError.message : 'Unknown error'
            });
          }
        }
      }
      
      job.imported++;
      job.details.push({
        orderNumber: order.orderNumber,
        productSku: product.sku,
        status: 'imported',
        message: `Imported: Qty ${quantity}, Price ${unitPrice}`
      });

    } catch (error) {
      job.details.push({
        orderNumber: order.orderNumber,
        productSku: product.sku,
        status: 'error',
        message: `Failed to create order item: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      job.errors.push(`Row ${job.processed + 1}: Database error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Функція для розбору серійних номерів з підтримкою діапазонів
  function parseSerialNumbers(input: string): string[] {
    const result: string[] = [];
    const parts = input.split(',').map(part => part.trim()).filter(part => part);
    
    for (const part of parts) {
      // Перевіряємо, чи є це діапазон (наприклад "00059-00060")
      const rangeMatch = part.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const startStr = rangeMatch[1];
        const endStr = rangeMatch[2];
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        
        // Генеруємо всі номери в діапазоні, зберігаючи оригінальний формат
        for (let i = start; i <= end; i++) {
          // Зберігаємо ведучі нулі з початкового номера
          const paddedNumber = i.toString().padStart(startStr.length, '0');
          result.push(paddedNumber);
        }
      } else {
        // Звичайний серійний номер - зберігаємо як є
        result.push(part);
      }
    }
    
    return result;
  }

  async function processClientContactRow(row: any, job: any, existingClients: any[], existingContacts: any[]) {
    console.log(`Processing contact: ${row.FIO}, ID_TELEPHON: ${row.ID_TELEPHON}, INDEX_PREDPR: ${row.INDEX_PREDPR}`);
    
    if (!row.ID_TELEPHON) {
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'error',
        message: 'Missing required ID_TELEPHON field'
      });
      job.errors.push(`Row ${job.processed + 1}: Missing required ID_TELEPHON field`);
      return;
    }

    if (!row.INDEX_PREDPR) {
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'error',
        message: 'Missing required INDEX_PREDPR field'
      });
      job.errors.push(`Row ${job.processed + 1}: Missing required INDEX_PREDPR field`);
      return;
    }

    // Find client by external_id matching INDEX_PREDPR
    console.log(`Looking for client with external_id: ${row.INDEX_PREDPR}`);
    const client = existingClients.find(c => c.externalId === row.INDEX_PREDPR);
    if (!client) {
      console.log(`Client with external_id ${row.INDEX_PREDPR} not found`);
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'skipped',
        message: `Client with external_id ${row.INDEX_PREDPR} not found`
      });
      job.skipped++;
      return;
    }
    console.log(`Found client: ${client.name} (ID: ${client.id})`);

    // Check for existing contact with same external_id
    const existingContact = existingContacts.find(c => c.externalId === row.ID_TELEPHON);
    if (existingContact) {
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'skipped',
        message: `Contact with external_id ${row.ID_TELEPHON} already exists`
      });
      job.skipped++;
      return;
    }

    // Clean and validate phone numbers
    const cleanPhone = (phone: string) => {
      if (!phone || phone.trim() === '') return null;
      const cleaned = phone.trim().replace(/\s+/g, '');
      // Skip obviously invalid phone entries
      if (cleaned.length < 7 || cleaned.includes('@')) return null;
      return cleaned;
    };

    // Clean and validate email
    const cleanEmail = (email: string) => {
      if (!email || email.trim() === '') return null;
      const cleaned = email.trim();
      // Basic email validation
      if (!cleaned.includes('@') || cleaned.length < 5) return null;
      return cleaned;
    };

    // Clean name - skip if it looks like a phone number
    const cleanName = (name: string) => {
      if (!name || name.trim() === '') return '';
      const cleaned = name.trim();
      // Skip if name looks like a phone number
      if (/^[\d\s\(\)\-\+]+$/.test(cleaned)) return '';
      return cleaned;
    };

    // Determine if this is the first contact for this client (for is_primary)
    const clientContactsCount = existingContacts.filter(c => c.clientId === client.id).length;
    const isPrimary = clientContactsCount === 0;

    // Skip contact if no useful information
    const hasUsefulInfo = cleanName(row.FIO) || 
                         cleanPhone(row.MOBIL) || 
                         cleanPhone(row.TEL_WORK) || 
                         cleanPhone(row.FAX) || 
                         cleanEmail(row.EMAIL) ||
                         (row.DOLGNOST && row.DOLGNOST.trim());

    if (!hasUsefulInfo) {
      console.log(`Skipping contact with no useful information: ID_TELEPHON=${row.ID_TELEPHON}`);
      job.details.push({
        name: row.FIO || `Contact ${row.ID_TELEPHON}`,
        status: 'skipped',
        message: 'No useful contact information provided'
      });
      return; // Don't increment skipped here, will be calculated at the end
    }

    const contactData = {
      clientId: client.id,
      externalId: row.ID_TELEPHON,
      fullName: cleanName(row.FIO) || `Contact ${row.ID_TELEPHON}`,
      position: row.DOLGNOST && row.DOLGNOST.trim() ? row.DOLGNOST.trim() : null,
      primaryPhone: cleanPhone(row.MOBIL),
      secondaryPhone: cleanPhone(row.TEL_WORK),
      tertiaryPhone: cleanPhone(row.FAX),
      email: cleanEmail(row.EMAIL),
      isActive: row.ACTUAL === 'T' || row.ACTUAL === '' || row.ACTUAL === null || row.ACTUAL === undefined, // ACTUAL="" is TRUE
      isPrimary: isPrimary,
      source: 'Elecomp'
    };

    try {
      console.log(`Creating contact for client ${client.name}:`, contactData);
      await storage.createClientContact(contactData);
      console.log(`Contact created successfully`);
      
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'imported',
        message: `Imported contact for client: ${client.name}`
      });
      job.imported++;
      
      // Add to existing contacts for next iterations
      existingContacts.push({
        ...contactData,
        id: Date.now(), // Temporary ID for counting purposes
      });
    } catch (createError) {
      console.error(`Error creating contact:`, createError);
      const createErrorMessage = createError instanceof Error ? createError.message : 'Unknown create error';
      job.details.push({
        name: row.FIO || 'Unknown',
        status: 'error',
        message: createErrorMessage
      });
      job.errors.push(`Row ${job.processed + 1} (${row.FIO}): ${createErrorMessage}`);
    }
  }

  async function processProductRow(row: any, job: any, existingProducts: any[]) {
    const attrs = row;
    

    
    // Валідація обов'язкових полів
    let sku = attrs.ID_LISTARTICLE;
    if (!sku || sku.trim() === '') {
      // Генеруємо SKU на основі назви товару, якщо ID_LISTARTICLE відсутній
      if (attrs.NAME_ARTICLE) {
        sku = attrs.NAME_ARTICLE
          .replace(/[^a-zA-Z0-9а-яА-ЯІіЇїЄє]/g, '_') // Замінюємо спецсимволи на _
          .replace(/_+/g, '_') // Заміняємо множинні _ на одинарні
          .replace(/^_|_$/g, '') // Видаляємо _ на початку та в кінці
          .toUpperCase()
          .substring(0, 20); // Обмежуємо довжину
        
        // Додаємо унікальний суфікс для запобігання дублікатів
        const timestamp = Date.now().toString().slice(-6);
        sku = `${sku}_${timestamp}`;
      } else {
        job.details.push({
          name: 'Unknown',
          status: 'skipped',
          message: 'Відсутні ID_LISTARTICLE та NAME_ARTICLE'
        });
        job.skipped++;
        return;
      }
    }

    if (!attrs.NAME_ARTICLE) {
      job.details.push({
        name: attrs.ID_LISTARTICLE || 'Unknown',
        status: 'skipped',
        message: 'Відсутня назва товару (NAME_ARTICLE)'
      });
      job.skipped++;
      return;
    }

    // Перевірка чи товар вже існує за SKU
    const existingProduct = existingProducts.find(p => p.sku === sku);

    try {
      // Підготовка даних товару
      // Обробка ціни - замінюємо кому на крапку для PostgreSQL
      const processPrice = (price: any): string => {
        if (!price) return '0';
        return price.toString().replace(',', '.');
      };

      // Обробка поля ACTUAL -> is_active
      let isActive = true; // За замовчуванням активний
      if (attrs.ACTUAL !== undefined && attrs.ACTUAL !== null) {
        // ACTUAL може бути булевим, числом (0/1) або рядком
        if (typeof attrs.ACTUAL === 'boolean') {
          isActive = attrs.ACTUAL;
        } else if (typeof attrs.ACTUAL === 'number') {
          isActive = attrs.ACTUAL === 1;
        } else if (typeof attrs.ACTUAL === 'string') {
          const actualStr = attrs.ACTUAL.trim();
          // Специфічні правила: T = true, F = false, пустий рядок = true
          if (actualStr === '' || actualStr.toUpperCase() === 'T') {
            isActive = true;
          } else if (actualStr.toUpperCase() === 'F') {
            isActive = false;
          } else {
            // Додаткові варіанти для сумісності
            const lowerStr = actualStr.toLowerCase();
            isActive = lowerStr === 'true' || lowerStr === '1' || lowerStr === 'так' || lowerStr === 'yes';
          }
        }
      }

      const productData = {
        name: attrs.NAME_ARTICLE,
        sku: sku, // Використовуємо згенерований або оригінальний SKU
        description: attrs.NAME_FUNCTION || '',
        categoryId: attrs.TYPE_IZDEL ? parseInt(attrs.TYPE_IZDEL) : null,
        costPrice: processPrice(attrs.CENA),
        retailPrice: processPrice(attrs.CENA),
        productType: 'product' as const,
        unit: 'шт',
        isActive: isActive
      };

      let product;
      let actionStatus = 'imported';
      let actionMessage = '';

      if (existingProduct) {
        // Оновлюємо існуючий товар
        product = await storage.updateProduct(existingProduct.id, productData);
        actionStatus = 'updated';
        actionMessage = `Товар успішно оновлений з ID ${existingProduct.id}`;
        console.log(`Successfully updated product: ${attrs.NAME_ARTICLE} with ID ${existingProduct.id}`);
      } else {
        // Створюємо новий товар
        product = await storage.createProduct(productData);
        const wasSkuGenerated = !attrs.ID_LISTARTICLE || attrs.ID_LISTARTICLE.trim() === '';
        actionMessage = `Товар успішно імпортований з ID ${product.id}${wasSkuGenerated ? ` (SKU згенерований: ${sku})` : ``}`;
        console.log(`Successfully imported product: ${attrs.NAME_ARTICLE} with ID ${product.id}`);
      }
      
      job.details.push({
        name: attrs.NAME_ARTICLE,
        status: actionStatus,
        message: actionMessage
      });
      job.imported++;
    } catch (createError) {
      console.error(`Failed to process product ${attrs.NAME_ARTICLE}:`, createError);
      job.details.push({
        name: attrs.NAME_ARTICLE,
        status: 'error',
        message: `Помилка обробки товару: ${createError instanceof Error ? createError.message : String(createError)}`
      });
      job.errors.push(`Failed to process product ${attrs.NAME_ARTICLE}: ${createError instanceof Error ? createError.message : String(createError)}`);
    }
  }

  // Column widths API
  app.get("/api/column-widths/:tableName", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id?.toString() || "guest";
      const tableName = req.params.tableName;
      
      const widths = await storage.getColumnWidths(userId, tableName);
      res.json(widths);
    } catch (error) {
      console.error("Failed to get column widths:", error);
      res.status(500).json({ error: "Failed to get column widths" });
    }
  });

  app.post("/api/column-widths", isSimpleAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id?.toString() || "guest";
      const data = { ...req.body, userId };
      
      const width = await storage.upsertColumnWidth(data);
      res.json(width);
    } catch (error) {
      console.error("Failed to save column width:", error);
      res.status(500).json({ error: "Failed to save column width" });
    }
  });

  // Import statistics for wizard
  app.get("/api/import-stats/:type", async (req, res) => {
    try {
      const { type } = req.params;
      let stats = {};

      switch (type) {
        case 'orders':
          const clientCount = await storage.getClientCount();
          stats = {
            clients: clientCount,
            carriers: await storage.getCarrierCount()
          };
          break;
        case 'order-items':
          const orderCount = await storage.getOrderCount();
          const productCount = await storage.getProductCount();
          stats = {
            orders: orderCount,
            products: productCount
          };
          break;
        case 'clients':
          stats = {
            existing_clients: await storage.getClientCount()
          };
          break;
        case 'client-contacts':
          stats = {
            clients: await storage.getClientCount(),
            existing_contacts: await storage.getContactCount()
          };
          break;
        default:
          stats = {};
      }

      res.json(stats);
    } catch (error) {
      console.error("Error fetching import stats:", error);
      res.status(500).json({ error: "Failed to fetch import stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
