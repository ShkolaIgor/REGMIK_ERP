#!/usr/bin/env node

// Production launcher with embedded React-like interface
// Provides full ERP dashboard without build dependencies

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = 'production';

async function startProductionUIServer() {
  try {
    const { registerRoutes } = await import('./routes.js');
    
    const app = express();
    const PORT = process.env.PORT || 5000;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const server = await registerRoutes(app);

    // Serve main ERP interface
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
            <title>REGMIK ERP - Система управління виробництвом</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
              .header { background: #2563eb; color: white; padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
              .header p { opacity: 0.9; font-size: 0.875rem; }
              .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
              .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
              .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .stat-card h3 { color: #374151; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
              .stat-card .value { font-size: 2rem; font-weight: bold; color: #1f2937; }
              .modules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
              .module-card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; transition: transform 0.2s; }
              .module-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
              .module-header { padding: 1rem; border-bottom: 1px solid #e5e7eb; }
              .module-header h3 { color: #1f2937; font-size: 1.125rem; margin-bottom: 0.25rem; }
              .module-header p { color: #6b7280; font-size: 0.875rem; }
              .module-actions { padding: 1rem; }
              .btn { display: inline-block; padding: 0.5rem 1rem; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 0.875rem; transition: background 0.2s; }
              .btn:hover { background: #1d4ed8; }
              .btn-secondary { background: #6b7280; }
              .btn-secondary:hover { background: #4b5563; }
              .loading { text-align: center; padding: 2rem; }
              .spinner { border: 3px solid #f3f4f6; border-top: 3px solid #2563eb; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .footer { text-align: center; padding: 2rem; color: #6b7280; font-size: 0.875rem; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>REGMIK ERP</h1>
              <p>Система управління виробництвом та інвентаризацією</p>
            </div>
            
            <div class="container">
              <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Завантаження даних системи...</p>
              </div>
              
              <div id="dashboard" style="display: none;">
                <div class="stats-grid">
                  <div class="stat-card">
                    <h3>Загальна кількість продуктів</h3>
                    <div class="value" id="totalProducts">-</div>
                  </div>
                  <div class="stat-card">
                    <h3>Активні замовлення</h3>
                    <div class="value" id="activeOrders">-</div>
                  </div>
                  <div class="stat-card">
                    <h3>Завдання виробництва</h3>
                    <div class="value" id="productionTasks">-</div>
                  </div>
                  <div class="stat-card">
                    <h3>Низький запас</h3>
                    <div class="value" id="lowStockCount">-</div>
                  </div>
                </div>
                
                <div class="modules-grid">
                  <div class="module-card">
                    <div class="module-header">
                      <h3>📦 Управління продукцією</h3>
                      <p>Товари, складські залишки, категорії</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/products" class="btn">Переглянути продукти</a>
                    </div>
                  </div>
                  
                  <div class="module-card">
                    <div class="module-header">
                      <h3>📋 Замовлення клієнтів</h3>
                      <p>Обробка замовлень, статуси, відвантаження</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/orders" class="btn">Переглянути замовлення</a>
                    </div>
                  </div>
                  
                  <div class="module-card">
                    <div class="module-header">
                      <h3>👥 База клієнтів</h3>
                      <p>Контактна інформація, історія співпраці</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/clients" class="btn">Переглянути клієнтів</a>
                    </div>
                  </div>
                  
                  <div class="module-card">
                    <div class="module-header">
                      <h3>🏭 Виробництво</h3>
                      <p>Технологічні карти, завдання виробництва</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/tech-cards" class="btn">Технологічні карти</a>
                      <a href="/api/production-tasks" class="btn btn-secondary">Завдання</a>
                    </div>
                  </div>
                  
                  <div class="module-card">
                    <div class="module-header">
                      <h3>🚚 Нова Пошта</h3>
                      <p>Інтеграція з сервісом доставки</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/nova-poshta/cities" class="btn">Міста</a>
                      <a href="/api/nova-poshta/warehouses" class="btn btn-secondary">Відділення</a>
                    </div>
                  </div>
                  
                  <div class="module-card">
                    <div class="module-header">
                      <h3>📊 Звіти та аналітика</h3>
                      <p>Фінансові звіти, аналіз продажів</p>
                    </div>
                    <div class="module-actions">
                      <a href="/api/dashboard/stats" class="btn">Статистика</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>REGMIK ERP v1.0.0 | Порт: ${PORT} | База даних: PostgreSQL (Neon) | Локалізація: Українська</p>
            </div>
            
            <script>
              // Load dashboard statistics
              fetch('/api/dashboard/stats')
                .then(response => response.json())
                .then(data => {
                  document.getElementById('totalProducts').textContent = data.totalProducts || '0';
                  document.getElementById('activeOrders').textContent = data.activeOrders || '0';
                  document.getElementById('productionTasks').textContent = data.productionTasks || '0';
                  document.getElementById('lowStockCount').textContent = data.lowStockCount || '0';
                  
                  // Hide loading, show dashboard
                  document.getElementById('loading').style.display = 'none';
                  document.getElementById('dashboard').style.display = 'block';
                })
                .catch(error => {
                  console.error('Error loading dashboard:', error);
                  document.getElementById('loading').innerHTML = '<p>Помилка завантаження даних. Перевірте з\\'єднання з сервером.</p>';
                });
            </script>
          </body>
          </html>
        `);
      }
    });

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`REGMIK ERP Production UI Server running on port ${PORT}`);
      console.log(`Database: ${process.env.PGDATABASE || 'neondb'}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Access: http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start production UI server:', error);
    process.exit(1);
  }
}

startProductionUIServer();