import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, insertOrderSchema, insertRecipeSchema,
  insertProductionTaskSchema, insertCategorySchema, insertUnitSchema, insertWarehouseSchema,
  insertSupplierSchema, insertInventorySchema, insertTechCardSchema,
  insertProductComponentSchema, insertCostCalculationSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
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

  const httpServer = createServer(app);
  return httpServer;
}
