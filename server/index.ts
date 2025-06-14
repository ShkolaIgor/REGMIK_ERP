import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { novaPoshtaCache } from "./nova-poshta-cache";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Налаштування UTF-8 для всього додатку
app.use((req, res, next) => {
  // Встановлюємо правильне кодування для запитів
  if (req.method === 'GET') {
    // Перекодування query параметрів для правильної обробки UTF-8
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        try {
          // Спробуємо декодувати якщо потрібно
          const decoded = Buffer.from(value, 'latin1').toString('utf8');
          if (decoded !== value && /[а-яё]/i.test(decoded)) {
            req.query[key] = decoded;
          }
        } catch (e) {
          // Залишаємо оригінальне значення якщо декодування не вдалося
        }
      }
    }
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Налаштування для правильної обробки UTF-8 тільки для API роутів
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Ініціалізація кешу Нової Пошти при старті сервера
    try {
      log("Ініціалізація кешу Нової Пошти...");
      await novaPoshtaCache.forceUpdate();
      const info = await novaPoshtaCache.getCacheInfo();
      log(`Кеш Нової Пошти готовий: ${info.cities} міст, ${info.warehouses} відділень`);
    } catch (error) {
      log("Помилка ініціалізації кешу Нової Пошти:", error);
    }

    // Ініціалізація автоматичного оновлення курсів валют
    try {
      const { currencyService } = await import("./currency-service");
      await currencyService.initializeAutoUpdate();
      log("Автоматичне оновлення курсів валют ініціалізовано");
    } catch (error) {
      log("Помилка ініціалізації автоматичного оновлення курсів:", error);
    }

    // Ініціалізація автоматичного оновлення Nova Poshta
    try {
      const { novaPoshtaService } = await import("./nova-poshta-service");
      await novaPoshtaService.initializeAutoUpdate();
      log("Автоматичне оновлення Nova Poshta ініціалізовано");
    } catch (error) {
      log("Помилка ініціалізації автоматичного оновлення Nova Poshta:", error);
    }
  });
})();
