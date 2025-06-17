import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-minimal";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Налаштування UTF-8 тільки для API роутів та HTML
app.use((req, res, next) => {
  // Перекодування query параметрів для правильної обробки UTF-8
  if (req.method === 'GET' && req.path.startsWith('/api')) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        try {
          // Спроба декодувати двічі закодований UTF-8
          const decoded = decodeURIComponent(value);
          if (decoded !== value) {
            req.query[key] = decoded;
          }
        } catch (e) {
          // Якщо декодування не вдалося, залишаємо оригінальне значення
        }
      }
    }
  }
  
  next();
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  
  if (err.message && err.message.includes('Only XML files are allowed')) {
    return res.status(400).json({ error: 'Дозволені тільки XML файли' });
  }
  
  res.status(500).json({
    error: process.env.NODE_ENV === "development" 
      ? err.message 
      : "Internal server error"
  });
});

(async () => {
  const server = await registerRoutes(app);

  // ВАЖЛИВО: Використовуємо setupVite в кінці для правильної роботи
  await setupVite(app, server);

  const port = 5000;

  server.listen(port, "0.0.0.0", () => {
    log(`Сервер запущено на порту ${port}`);
    log("Основні функції доступні:");
    log("- Клієнти: /api/clients");
    log("- Постачальники: /api/suppliers");
    log("- Замовлення: /api/orders");
    log("- XML Імпорт: /api/import/clients/xml, /api/import/suppliers/xml");
  });
})();