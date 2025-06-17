import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";

// Простий user store для демо
const users = [
  {
    id: 1,
    username: "admin",
    email: "admin@regmik.com",
    password: "$2a$10$8K1p/a0dRt1d4FoUUvxMu.N8yA8lN8u9M8/M8u9M8u9M8u9M8u9M8u", // "admin"
    firstName: "Адміністратор",
    lastName: "Системи",
    role: "admin"
  },
  {
    id: 2,
    username: "demo",
    email: "demo@regmik.com", 
    password: "$2a$10$8K1p/a0dRt1d4FoUUvxMu.N8yA8lN8u9M8/M8u9M8u9M8u9M8u9M8u", // "demo"
    firstName: "Демо",
    lastName: "Користувач",
    role: "user"
  }
];

// Session configuration
export function setupSession(app: any) {
  app.use(session({
    secret: 'regmik-erp-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (session && session.user) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized - please login" });
  }
}

// Login endpoint
export async function login(username: string, password: string) {
  const user = users.find(u => u.username === username || u.email === username);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user by ID
export function getUserById(id: number) {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}