import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

// Простий middleware для перевірки авторизації
export const isSimpleAuthenticated: RequestHandler = (req, res, next) => {
  console.log("Auth check - Session exists:", !!req.session);
  console.log("Auth check - User in session:", !!(req.session as any)?.user);
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - Session data:", req.session);
  
  if (req.session && (req.session as any).user) {
    console.log("Auth check - User authenticated:", (req.session as any).user.username);
    return next();
  }
  console.log("Auth check - User NOT authenticated");
  return res.status(401).json({ message: "Unauthorized" });
};

// Налаштування сесій
export function setupSimpleSession(app: Express) {
  app.set('trust proxy', 1);
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 тиждень
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // false для development
      maxAge: sessionTtl,
    },
    name: 'sessionId'
  }));
}

// Демо користувачі
const demoUsers = [
  {
    id: "demo-user-1",
    username: "demo",
    password: "demo123",
    email: "demo@example.com",
    firstName: "Демо",
    lastName: "Користувач",
    profileImageUrl: null
  },
  {
    id: "admin-user-1", 
    username: "admin",
    password: "admin123",
    email: "admin@regmik.com",
    firstName: "Адміністратор",
    lastName: "Системи",
    profileImageUrl: null
  }
];

export function setupSimpleAuth(app: Express) {
  // Маршрут для простого входу
  app.post("/api/auth/simple-login", async (req, res) => {
    console.log("Login attempt:", req.body);
    console.log("Session ID before login:", req.sessionID);
    const { username: rawUsername, password } = req.body;
    const username = rawUsername?.trim(); // Обрізаємо пробіли
    
    console.log("Trimmed username:", username);
    
    try {
      // Спочатку перевіряємо демо користувачів
      const demoUser = demoUsers.find(u => u.username === username && u.password === password);
      
      if (demoUser) {
        console.log("Demo user found:", demoUser.username);
        // Створюємо сесію для демо користувача
        (req.session as any).user = {
          id: demoUser.id,
          username: demoUser.username,
          email: demoUser.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          profileImageUrl: demoUser.profileImageUrl
        };
        
        return req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Помилка збереження сесії" });
          }
          console.log("Session saved successfully for demo user, ID:", req.sessionID);
          res.json({ success: true, user: demoUser });
        });
      }
      
      // Якщо не знайшли серед демо користувачів, перевіряємо базу даних
      console.log("Checking database for user:", username);
      const dbUser = await storage.getLocalUserByUsername(username);
      
      if (dbUser) {
        console.log("Database user found:", dbUser.username);
        console.log("User active status:", dbUser.isActive);
        
        // Перевіряємо, чи активний користувач
        if (!dbUser.isActive) {
          console.log("User is inactive");
          return res.status(401).json({ message: "Обліковий запис деактивований" });
        }
        
        // Перевіряємо пароль
        const isPasswordValid = await bcrypt.compare(password, dbUser.password);
        console.log("Password validation result:", isPasswordValid);
        
        if (isPasswordValid) {
          console.log("Database user authenticated successfully");
          
          // Створюємо сесію для користувача з бази даних
          (req.session as any).user = {
            id: dbUser.id.toString(),
            username: dbUser.username,
            email: dbUser.email,
            firstName: dbUser.username, // Використовуємо username як firstName
            lastName: "",
            profileImageUrl: null
          };
          
          // Оновлюємо час останнього входу
          await storage.updateUserLastLogin(dbUser.id);
          
          return req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return res.status(500).json({ message: "Помилка збереження сесії" });
            }
            console.log("Session saved successfully for database user, ID:", req.sessionID);
            res.json({ success: true, user: { 
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email
            }});
          });
        }
      }
      
      console.log("Invalid credentials - no user found or password incorrect");
      res.status(401).json({ message: "Невірний логін або пароль" });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Помилка серверу під час входу" });
    }
  });

  // Маршрут для отримання поточного користувача
  app.get("/api/auth/user", isSimpleAuthenticated, (req, res) => {
    const user = (req.session as any).user;
    res.json(user);
  });

  // Маршрут для виходу
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Помилка при виході" });
      }
      console.log("User logged out successfully");
      res.redirect("/");
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Помилка при виході" });
      }
      res.json({ success: true });
    });
  });
}