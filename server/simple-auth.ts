import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Простий middleware для перевірки авторизації
export const isSimpleAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user) {
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
  app.post("/api/auth/simple-login", (req, res) => {
    console.log("Login attempt:", req.body);
    const { username, password } = req.body;
    
    const user = demoUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
      console.log("User found, creating session");
      // Створюємо сесію
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      };
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Помилка збереження сесії" });
        }
        console.log("Session saved successfully");
        res.json({ success: true, user: user });
      });
    } else {
      console.log("Invalid credentials");
      res.status(401).json({ message: "Невірний логін або пароль" });
    }
  });

  // Маршрут для отримання поточного користувача
  app.get("/api/auth/user", isSimpleAuthenticated, (req, res) => {
    const user = (req.session as any).user;
    res.json(user);
  });

  // Маршрут для виходу
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Помилка при виході" });
      }
      res.json({ success: true });
    });
  });
}