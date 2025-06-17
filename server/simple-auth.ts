import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./db-storage";
import bcrypt from "bcryptjs";

// Simple session configuration
export function setupSimpleSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'regmik-erp-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));
}

// Simple authentication setup
export function setupSimpleAuth(app: Express) {
  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get("/api/auth/user", (req: Request, res: Response) => {
    const session = req.session as any;
    console.log("Auth check - Session exists:", !!req.session);
    console.log("Auth check - User in session:", !!session.userId);
    console.log("Auth check - Session ID:", req.sessionID);
    console.log("Auth check - Session data:", req.session);
    
    if (session.userId) {
      console.log("Auth check - User authenticated:", session.username);
      res.json({
        id: session.userId,
        username: session.username,
        email: session.email,
        role: session.role
      });
    } else {
      console.log("Auth check - User NOT authenticated");
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}

// Authentication middleware
export function isSimpleAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}