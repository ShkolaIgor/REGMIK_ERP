import type { Express } from "express";
import { createServer, type Server } from "http";
import { dbStorage as storage } from "./db-storage";
import { setupSimpleSession, setupSimpleAuth, isSimpleAuthenticated } from "./simple-auth";
import { novaPoshtaApi } from "./nova-poshta-api";
import { novaPoshtaCache } from "./nova-poshta-cache";
import { 
  insertProductSchema, insertOrderSchema, insertRecipeSchema,
  insertProductionTaskSchema, insertCategorySchema, insertUnitSchema, insertWarehouseSchema,
  insertSupplierSchema, insertInventorySchema, insertTechCardSchema,
  insertComponentSchema, insertProductComponentSchema, insertCostCalculationSchema, insertMaterialShortageSchema,
  insertAssemblyOperationSchema, insertAssemblyOperationItemSchema,
  insertInventoryAuditSchema, insertInventoryAuditItemSchema,
  insertWorkerSchema, insertProductionForecastSchema,
  insertWarehouseTransferSchema, insertPositionSchema, insertDepartmentSchema,
  insertPackageTypeSchema, insertSolderingTypeSchema, insertComponentAlternativeSchema, insertComponentCategorySchema,
  insertShipmentSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple auth setup
  setupSimpleSession(app);
  setupSimpleAuth(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
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

  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      const orderData = insertOrderSchema.parse(order);
      const createdOrder = await storage.createOrder(orderData, items);
      res.status(201).json(createdOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
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
      const { steps, materials, ...techCardData } = req.body;
      const data = insertTechCardSchema.parse(techCardData);
      const techCard = await storage.createTechCard(data, steps || [], materials || []);
      res.status(201).json(techCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const data = insertProductComponentSchema.parse(req.body);
      const component = await storage.addProductComponent(data);
      res.status(201).json(component);
    } catch (error) {
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
      const id = parseInt(req.params.id);
      const success = await storage.removeProductComponent(id);
      if (!success) {
        return res.status(404).json({ error: "Component not found" });
      }
      res.status(204).send();
    } catch (error) {
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

  app.put("/api/material-shortages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shortageData = insertMaterialShortageSchema.partial().parse(req.body);
      const shortage = await storage.updateMaterialShortage(id, shortageData);
      if (!shortage) {
        return res.status(404).json({ error: "Material shortage not found" });
      }
      res.json(shortage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid shortage data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update material shortage" });
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
      const positions = await storage.getPositions();
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
    try {
      const positionData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(positionData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const updateData = insertPositionSchema.partial().parse(req.body);
      const position = await storage.updatePosition(id, updateData);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }
      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  const httpServer = createServer(app);
  return httpServer;
}
