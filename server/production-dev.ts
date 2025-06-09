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
    const { setupVite } = await import('./vite.js');
    
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Register API routes
    const server = await registerRoutes(app);

    // Setup Vite for development serving but with production data
    await setupVite(app, server);

    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`REGMIK ERP Production-Dev Server running on port ${PORT}`);
      console.log(`Database: ${process.env.PGDATABASE || 'Not configured'}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Access: http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start production-dev server:', error);
    process.exit(1);
  }
}

startProductionDevServer();