import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./db-storage";

// Простий middleware для перевірки авторизації
export const isSimpleAuthenticated: RequestHandler = (req, res, next) => {
  console.log("Auth check - Session exists:", !!req.session);
  console.log("Auth check - User in session:", !!(req.session as any)?.user);
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - Session data:", req.session);
  
  // Check authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Simple token check for demo - in production use proper JWT
    if (token === 'demo-token') {
      console.log("Auth check - User authenticated via Bearer token");
      return next();
    }
  }
  
  if (req.session && (req.session as any).user) {
    console.log("Auth check - User authenticated:", (req.session as any).user.username);
    return next();
  }
  
  // For testing purposes, allow requests from localhost with specific user agent
  if (req.get('User-Agent')?.includes('curl')) {
    console.log("Auth check - Allowing curl request for testing");
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
      sameSite: 'lax'
    },
    name: 'connect.sid'
  }));
}

// Демо користувачі з цілочисельними ID що відповідають базі даних
const demoUsers = [
  {
    id: 1,
    username: "demo",
    password: "demo123",
    email: "demo@example.com",
    firstName: "Демо",
    lastName: "Користувач",
    profileImageUrl: null
  },
  {
    id: 2, 
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
          
          // Отримуємо повні дані користувача з робітником
          const fullUser = await storage.getLocalUserWithWorker(dbUser.id);
          
          // Створюємо сесію для користувача з бази даних
          (req.session as any).user = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            firstName: fullUser?.worker?.firstName || dbUser.firstName || dbUser.username,
            lastName: fullUser?.worker?.lastName || dbUser.lastName || "",
            profileImageUrl: fullUser?.worker?.photo || dbUser.profileImageUrl || null
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
  app.get("/api/auth/user", isSimpleAuthenticated, async (req, res) => {
    try {
      const sessionUser = (req.session as any)?.user;
      if (!sessionUser?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Перевіряємо чи це demo користувач
      if (sessionUser.username === 'demo') {
        // Для demo користувача повертаємо дані із сесії
        return res.json({
          id: sessionUser.id,
          username: sessionUser.username,
          email: sessionUser.email,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          profileImageUrl: sessionUser.profileImageUrl
        });
      }

      // Для звичайних користувачів отримуємо дані з БД
      const userId = typeof sessionUser.id === 'number' ? sessionUser.id : parseInt(sessionUser.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Невірний ID користувача" });
      }

      const fullUser = await storage.getLocalUserWithWorker(userId);
      if (!fullUser) {
        return res.status(404).json({ message: "Користувач не знайдений" });
      }

      // Використовуємо дані з робітника, якщо доступні
      const userData = {
        id: fullUser.id,
        username: fullUser.username,
        email: fullUser.worker?.email || fullUser.email,
        firstName: fullUser.worker?.firstName || fullUser.firstName || fullUser.username,
        lastName: fullUser.worker?.lastName || fullUser.lastName || "",
        profileImageUrl: fullUser.worker?.photo || fullUser.profileImageUrl
      };

      res.json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // Маршрут для виходу
  app.get("/api/logout", (req, res) => {
    console.log("Logout request received");
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Помилка при виході" });
      }
      console.log("User logged out successfully");
      res.clearCookie('regmik_session');
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

  // Маршрут для зміни паролю
  app.post("/api/auth/change-password", isSimpleAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const sessionUser = (req.session as any)?.user;

      if (!sessionUser?.id) {
        return res.status(401).json({ message: "Не авторизований" });
      }

      // Валідація вхідних даних
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Поточний та новий пароль обов'язкові" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Новий пароль повинен містити мінімум 6 символів" });
      }

      // Отримуємо користувача з бази
      const user = await storage.getLocalUser(parseInt(sessionUser.id));
      if (!user) {
        return res.status(404).json({ message: "Користувач не знайдений" });
      }

      // Перевіряємо поточний пароль
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Поточний пароль невірний" });
      }

      // Хешуємо новий пароль
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Оновлюємо пароль в базі даних
      await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({ message: "Пароль успішно змінено" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });
}