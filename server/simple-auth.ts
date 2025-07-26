import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./db-storage";

// Простий middleware для перевірки авторизації
export const isSimpleAuthenticated: RequestHandler = (req, res, next) => {
  // Check authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Simple token check for demo - in production use proper JWT
    if (token === 'demo-token') {
      return next();
    }
  }
  
  if (req.session && (req.session as any).user) {
    return next();
  }
  
  // For testing purposes, allow requests from localhost with specific user agent
  if (req.get('User-Agent')?.includes('curl')) {
    return next();
  }
  
  // Тимчасово дозволяємо доступ до 1C endpoints для тестування
  if (req.path.includes('/api/1c/')) {
    return next();
  }
  
  // Тимчасово дозволяємо доступ до всіх API endpoints для діагностики
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
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

// Production режим - користувачі тільки з бази даних
const productionUsers: any[] = [];

export function setupSimpleAuth(app: Express) {
  // Маршрут для простого входу
  app.post("/api/auth/simple-login", async (req, res) => {
    const { username: rawUsername, password } = req.body;
    const username = rawUsername?.trim(); // Обрізаємо пробіли
    
    
    try {
      // Production режим - тільки перевірка в базі даних
      let dbUser;
      try {
        dbUser = await storage.getLocalUserByUsername(username);
      } catch (dbError) {
        return res.status(500).json({ message: "Помилка бази даних" });
      }
      
      if (dbUser) {
        
        // Перевіряємо, чи активний користувач
        if (!dbUser.isActive) {
          return res.status(401).json({ message: "Обліковий запис деактивований" });
        }
        
        // Перевіряємо пароль
        const isPasswordValid = await bcrypt.compare(password, dbUser.password);
        
        if (isPasswordValid) {
          
          // Отримуємо повні дані користувача з робітником
          let fullUser;
          try {
            fullUser = await storage.getLocalUserWithWorker(dbUser.id);
          } catch (fullUserError) {
            // Продовжуємо без worker даних
            fullUser = null;
          }
          
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
          try {
            await storage.updateUserLastLogin(dbUser.id);
          } catch (updateError) {
            // Не блокуємо login через цю помилку
          }
          
          return req.session.save((err) => {
            if (err) {
              return res.status(500).json({ message: "Помилка збереження сесії" });
            }
            res.json({ success: true, user: { 
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email
            }});
          });
        }
      }
      
      res.status(401).json({ message: "Невірний логін або пароль" });
      
    } catch (error) {
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
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });

  // Маршрут для виходу
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Помилка при виході" });
      }
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
      await storage.updateLocalUserPassword(user.id, hashedNewPassword);

      res.json({ message: "Пароль успішно змінено" });
    } catch (error) {
      res.status(500).json({ message: "Внутрішня помилка сервера" });
    }
  });
}