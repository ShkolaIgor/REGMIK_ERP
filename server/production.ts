#!/usr/bin/env node

// Production launcher for REGMIK ERP without Vite dependencies
// Direct import of server components

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

async function startProductionServer() {
  try {
    // Import server modules directly
    const { registerRoutes } = await import('./routes.js');
    
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Register API routes first
    await registerRoutes(app);

    // Serve static files from client/dist if available
    const clientDistPath = path.join(__dirname, '../client/dist');
    const fs = await import('fs');
    
    if (fs.existsSync(clientDistPath) && fs.existsSync(path.join(clientDistPath, 'index.html'))) {
      app.use(express.static(clientDistPath));
      
      // Fallback for client-side routing
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          res.status(404).json({ error: 'API endpoint not found' });
        } else {
          res.sendFile(path.join(clientDistPath, 'index.html'));
        }
      });
    } else {
      console.log('Client dist not available, serving API-only with basic frontend');
      
      // Serve a basic HTML page with links to API endpoints
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          res.status(404).json({ error: 'API endpoint not found' });
        } else {
          res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>REGMIK ERP - API Server</title>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { color: #2563eb; }
                .api-link { display: block; margin: 10px 0; color: #059669; }
              </style>
            </head>
            <body>
              <h1 class="header">🚀 REGMIK ERP Production Server</h1>
              <p>Сервер працює в API режимі. Frontend файли не знайдені.</p>
              
              <h3>Доступні API ендпоінти:</h3>
              <a href="/api/dashboard/stats" class="api-link">📊 Dashboard Statistics</a>
              <a href="/api/products" class="api-link">📦 Products</a>
              <a href="/api/orders" class="api-link">📋 Orders</a>
              <a href="/api/clients" class="api-link">👥 Clients</a>
              <a href="/api/nova-poshta/cities" class="api-link">🏙️ Nova Poshta Cities</a>
              
              <p><strong>Статус:</strong> Production server активний</p>
              <p><strong>База даних:</strong> Підключена</p>
              <p><strong>Порт:</strong> ${process.env.PORT || 3000}</p>
              
              <hr>
              <p><em>Для повного frontend досвіду запустіть: npm run build</em></p>
            </body>
            </html>
          `);
        }
      });
    }

    const server = createServer(app);
    
    server.listen(Number(PORT), () => {
      console.log(`REGMIK ERP Production Server running on port ${PORT}`);
      console.log(`Database: ${process.env.PGDATABASE || 'Not configured'}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

  } catch (error) {
    console.error('Failed to start production server:', error);
    process.exit(1);
  }
}

startProductionServer();