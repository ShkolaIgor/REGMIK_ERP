import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { novaPoshtaCache } from "./nova-poshta-cache";

const app = express();

// Налаштування UTF8 підтримки для Express
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '10mb'
}));

// Встановлення правильних заголовків для UTF8 та MIME типів
app.use((req, res, next) => {
  res.charset = 'utf-8';
  
  // Встановлення правильних MIME типів для статичних файлів
  const ext = path.extname(req.path).toLowerCase();
  
  if (ext === '.css') {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
  } else if (ext === '.js' || ext === '.mjs') {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  } else if (ext === '.json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  } else if (ext === '.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  } else if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.ico') {
    res.setHeader('Content-Type', 'image/x-icon');
  } else if (ext === '.woff' || ext === '.woff2') {
    res.setHeader('Content-Type', 'font/woff2');
  } else if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  
  next();
});

// Production logging middleware
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

      console.log(`${new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit", 
        second: "2-digit",
        hour12: true,
      })} [express] ${logLine}`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Serve static files in production with correct MIME types
  const staticPath = path.join(process.cwd(), 'dist/client');
  app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.css') {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (ext === '.js' || ext === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (ext === '.json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (ext === '.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (ext === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      } else if (ext === '.png') {
        res.setHeader('Content-Type', 'image/png');
      } else if (ext === '.jpg' || ext === '.jpeg') {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (ext === '.ico') {
        res.setHeader('Content-Type', 'image/x-icon');
      } else if (ext === '.woff' || ext === '.woff2') {
        res.setHeader('Content-Type', 'font/woff2');
      }
      
      // Кешування для статичних файлів
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Initialize Nova Poshta cache
  console.log(`${new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit", 
    hour12: true,
  })} [express] Ініціалізація кешу Нової Пошти...`);
  
  await novaPoshtaCache.initialize();

  const port = parseInt(process.env.PORT ?? "5000", 10);

  server.listen(port, "0.0.0.0", () => {
    console.log(`${new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })} [express] serving on port ${port}`);
  });
})();