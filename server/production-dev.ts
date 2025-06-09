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
              // Simple redirect to main interface
              setTimeout(() => {
                window.location.href = '/api/dashboard/stats';
              }, 2000);
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