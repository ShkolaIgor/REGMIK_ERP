import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Roles management
  app.get("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.get("/api/system-modules", isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getSystemModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching system modules:", error);
      res.status(500).json({ error: "Failed to fetch system modules" });
    }
  });

  app.get("/api/permissions", isAuthenticated, async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // User roles
  app.get("/api/users/:userId/roles", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  // Temporary login bypass for system recovery
  app.post("/api/auth/temp-login", async (req, res) => {
    try {
      // Create a temporary user session for emergency access
      const tempUser = {
        id: "temp-admin",
        email: "admin@temp.local",
        firstName: "Temp",
        lastName: "Admin",
        profileImageUrl: null
      };
      
      // Store user in database if not exists
      await storage.upsertUser(tempUser);
      
      // Set session manually
      (req as any).session.user = tempUser;
      
      res.json({ success: true, user: tempUser });
    } catch (error) {
      console.error("Temp login error:", error);
      res.status(500).json({ error: "Failed to create temp session" });
    }
  });

  // Check auth status
  app.get("/api/auth/status", (req, res) => {
    const user = (req as any).session?.user;
    if (user) {
      res.json({ authenticated: true, user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Basic endpoint for testing
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}