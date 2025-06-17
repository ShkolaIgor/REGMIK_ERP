import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { pool, db } from "./db";
import { eq } from "drizzle-orm";
import { 
  insertClientSchema, 
  insertSupplierSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertShipmentSchema
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import xml2js from "xml2js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { insertLocalUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple authentication routes
  app.post("/api/auth/simple-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Get user from database
      const user = await storage.getLocalUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      if (!sessionUser) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  // Multer configuration for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
        cb(null, true);
      } else {
        cb(new Error('Only XML files are allowed'));
      }
    },
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Clients API
  app.get("/api/clients", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string || "";
      
      const result = await storage.getClientsPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ error: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const data = insertClientSchema.parse(req.body);
      const client = await storage.createClient(data);
      res.json(client);
    } catch (error: any) {
      console.error("Error creating client:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, data);
      res.json(client);
    } catch (error: any) {
      console.error("Error updating client:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      if (error.message && error.message.includes("related orders")) {
        return res.status(400).json({ 
          error: "Не можна видалити клієнта, який має пов'язані замовлення" 
        });
      }
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string || "";
      
      const result = await storage.getSuppliersPaginated(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ error: "Failed to fetch suppliers" });
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
      console.error("Error fetching supplier:", error);
      res.status(500).json({ error: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      res.json(supplier);
    } catch (error: any) {
      console.error("Error creating supplier:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, data);
      res.json(supplier);
    } catch (error: any) {
      console.error("Error updating supplier:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      if (error.message && error.message.includes("related orders")) {
        return res.status(400).json({ 
          error: "Не можна видалити постачальника, який має пов'язані замовлення" 
        });
      }
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const data = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(data, req.body.items || []);
      res.json(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // XML Import API  
  app.post("/api/import/clients/xml", upload.single('xmlFile'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No XML file provided' });
    }

    try {
      const xmlContent = req.file.buffer.toString('utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlContent);
      
      const rows = result?.root?.row || [];
      const processedRows = Array.isArray(rows) ? rows : [rows];
      
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const row of processedRows) {
        try {
          const clientData = {
            taxCode: row.EDRPOU || '',
            name: row.PREDPR || '',
            fullName: row.NAME || '',
            address: row.ADDRESS_PHYS || '',
            comment: row.COMMENT || '',
            isActive: row.ACTUAL === '1',
            externalId: row.ID_PREDPR ? parseInt(row.ID_PREDPR) : null,
            clientTypeId: 1 // Default client type
          };

          // Skip empty records
          if (!clientData.name && !clientData.taxCode) {
            continue;
          }

          const existingClient = await storage.getClientByTaxCode(clientData.taxCode);
          if (existingClient) {
            await storage.updateClient(existingClient.id, clientData);
            updated++;
          } else {
            await storage.createClient(clientData);
            created++;
          }
        } catch (error) {
          console.error('Error processing client row:', error);
          errors++;
        }
      }

      res.json({ 
        success: true, 
        message: `Імпорт завершено: створено ${created}, оновлено ${updated}, помилок ${errors}` 
      });
    } catch (error) {
      console.error('XML import error:', error);
      res.status(500).json({ error: 'Failed to import XML file' });
    }
  });

  app.post("/api/import/suppliers/xml", upload.single('xmlFile'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No XML file provided' });
    }

    try {
      const xmlContent = req.file.buffer.toString('utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlContent);
      
      const rows = result?.root?.row || [];
      const processedRows = Array.isArray(rows) ? rows : [rows];
      
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const row of processedRows) {
        try {
          const supplierData = {
            taxCode: row.EDRPOU || '',
            name: row.PREDPR || '',
            fullName: row.NAME || '',
            address: row.ADDRESS_PHYS || '',
            comment: row.COMMENT || '',
            isActive: row.ACTUAL === '1',
            externalId: row.ID_PREDPR ? parseInt(row.ID_PREDPR) : null,
            clientTypeId: 1 // Default client type for suppliers
          };

          // Skip empty records
          if (!supplierData.name && !supplierData.taxCode) {
            continue;
          }

          // For suppliers, check by name since getSupplierByTaxCode doesn't exist
          const existingSuppliers = await storage.getSuppliers();
          const existingSupplier = existingSuppliers.find(s => s.taxCode === supplierData.taxCode);
          if (existingSupplier) {
            await storage.updateSupplier(existingSupplier.id, supplierData);
            updated++;
          } else {
            await storage.createSupplier(supplierData);
            created++;
          }
        } catch (error) {
          console.error('Error processing supplier row:', error);
          errors++;
        }
      }

      res.json({ 
        success: true, 
        message: `Імпорт завершено: створено ${created}, оновлено ${updated}, помилок ${errors}` 
      });
    } catch (error) {
      console.error('XML import error:', error);
      res.status(500).json({ error: 'Failed to import XML file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}