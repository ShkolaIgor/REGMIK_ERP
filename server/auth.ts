import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Простий user store для демо
const users = [
  {
    id: 1,
    username: "admin",
    email: "admin@regmik.com",
    password: "$2b$10$Il3JWM2fRyJ3OcSoBXFsV.L5VjGuOXwhr1A0rKhG9TiLsonHdGQyq", // "newpassword"
    firstName: "Адміністратор",
    lastName: "Системи",
    role: "admin"
  },
  {
    id: 2,
    username: "demo",
    email: "demo@regmik.com", 
    password: "$2b$10$rOvRoi24nIVWrEHwB8V1aOV5OaUMTOJ9fItF7YgkOE8UQvBTr6YZm", // "demo"
    firstName: "Демо",
    lastName: "Користувач",
    role: "user"
  },
  {
    id: 3,
    username: "ShkolaIhor",
    email: "ihor@shkola.com",
    password: "$2b$10$Il3JWM2fRyJ3OcSoBXFsV.L5VjGuOXwhr1A0rKhG9TiLsonHdGQyq", // "123456"
    firstName: "Ігор",
    lastName: "Школа",
    role: "user"
  }
];

// Тимчасове сховище для токенів скидання паролю
const resetTokens = new Map<string, { 
  userId: number; 
  token: string; 
  expires: Date;
  email: string;
}>();

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
  console.log("Login attempt:", { username, password });
  
  const user = users.find(u => u.username === username || u.email === username);
  console.log("User found:", user ? user.username : "Not found");
  
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log("Password valid:", isValid);
  
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

// Генерація токену скидання паролю
export function generateResetToken(email: string) {
  const user = users.find(u => u.email === email);
  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 хвилин

  resetTokens.set(token, {
    userId: user.id,
    token,
    expires,
    email
  });

  // Очищення старих токенів для цього користувача
  for (const [key, value] of resetTokens.entries()) {
    if (value.userId === user.id && key !== token) {
      resetTokens.delete(key);
    }
  }

  return { token, expires };
}

// Перевірка токену скидання паролю
export function verifyResetToken(token: string) {
  const resetData = resetTokens.get(token);
  if (!resetData) {
    return null;
  }

  if (new Date() > resetData.expires) {
    resetTokens.delete(token);
    return null;
  }

  return resetData;
}

// Скидання паролю
export async function resetPassword(token: string, newPassword: string) {
  const resetData = verifyResetToken(token);
  if (!resetData) {
    return false;
  }

  const user = users.find(u => u.id === resetData.userId);
  if (!user) {
    return false;
  }

  // Хешування нового паролю
  user.password = await bcrypt.hash(newPassword, 10);
  
  // Видалення використаного токену
  resetTokens.delete(token);

  return true;
}

// Пошук користувача за email
export function getUserByEmail(email: string) {
  const user = users.find(u => u.email === email);
  if (!user) return null;
  
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}