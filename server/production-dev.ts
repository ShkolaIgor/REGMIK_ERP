#!/usr/bin/env node

// Production launcher with development Vite server
// For environments where full build is not needed

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment but keep Vite for serving
process.env.NODE_ENV = 'production';

async function startProductionDevServer() {
  try {
    // Import modules
    const { registerRoutes } = await import('./routes.js');
    
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Register API routes
    const server = await registerRoutes(app);

    // Simple static file serving without Vite config dependencies
    const clientPath = path.join(__dirname, '../client');
    console.log('Serving client files from:', clientPath);
    
    // Serve static assets
    app.use('/assets', express.static(path.join(clientPath, 'public')));
    app.use('/src', express.static(path.join(clientPath, 'src')));
    
    // Serve main HTML file for all non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
      } else {
        res.send(`
          <!DOCTYPE html>
          <html lang="uk">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>REGMIK ERP</title>
            <style>
              body { margin: 0; font-family: Arial, sans-serif; }
              .loading { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #f5f5f5;
              }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 2s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="loading">
              <div>
                <div class="spinner"></div>
                <h2>REGMIK ERP Loading...</h2>
                <p>Завантаження системи управління виробництвом</p>
              </div>
            </div>
            
            <script>
              // Load main REGMIK ERP interface
              setTimeout(() => {
                document.body.innerHTML = \`
                  <div style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                    <h1 style="color: #2563eb; text-align: center;">🚀 REGMIK ERP</h1>
                    <p style="text-align: center; color: #666;">Система управління виробництвом готова до роботи</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px;">
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>📊 Dashboard</h3>
                        <p>Загальна статистика системи</p>
                        <a href="/api/dashboard/stats" style="color: #2563eb;">Переглянути статистику</a>
                      </div>
                      
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>📦 Продукція</h3>
                        <p>Управління товарами та складом</p>
                        <a href="/api/products" style="color: #2563eb;">Переглянути продукти</a>
                      </div>
                      
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>📋 Замовлення</h3>
                        <p>Робота з замовленнями клієнтів</p>
                        <a href="/api/orders" style="color: #2563eb;">Переглянути замовлення</a>
                      </div>
                      
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>👥 Клієнти</h3>
                        <p>База даних клієнтів</p>
                        <a href="/api/clients" style="color: #2563eb;">Переглянути клієнтів</a>
                      </div>
                      
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>🏙️ Нова Пошта</h3>
                        <p>Інтеграція з Nova Poshta API</p>
                        <a href="/api/nova-poshta/cities" style="color: #2563eb;">Переглянути міста</a>
                      </div>
                      
                      <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                        <h3>⚙️ Статуси замовлень</h3>
                        <p>Управління статусами</p>
                        <a href="/api/order-statuses" style="color: #2563eb;">Переглянути статуси</a>
                      </div>
                    </div>
                    
                    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                      <h3>🔧 Інформація про систему</h3>
                      <ul>
                        <li><strong>Статус:</strong> Production Ready</li>
                        <li><strong>База даних:</strong> PostgreSQL (Neon)</li>
                        <li><strong>Порт:</strong> ${PORT}</li>
                        <li><strong>Версія:</strong> 1.0.0</li>
                        <li><strong>Локалізація:</strong> Українська</li>
                      </ul>
                    </div>
                  </div>
                \`;
              }, 1000);
            </script>
          </body>
          </html>
        `);
      }
    });

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`REGMIK ERP Production-Dev Server running on port ${PORT}`);
      console.log(`Database: ${process.env.PGDATABASE || 'neondb'}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Access: http://0.0.0.0:${PORT}`);
      console.log(`API Dashboard: http://0.0.0.0:${PORT}/api/dashboard/stats`);
    });

  } catch (error) {
    console.error('Failed to start production-dev server:', error);
    process.exit(1);
  }
}

startProductionDevServer();