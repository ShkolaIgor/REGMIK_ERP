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

    // Serve static files from client/dist if available
    const clientDistPath = path.join(__dirname, '../client/dist');
    try {
      app.use(express.static(clientDistPath));
    } catch (error) {
      console.log('Client dist not available, API-only mode');
    }

    // Register API routes
    await registerRoutes(app);

    // Fallback for client-side routing
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
      } else {
        try {
          res.sendFile(path.join(clientDistPath, 'index.html'));
        } catch {
          res.status(404).send('Client not built. Run npm run build first.');
        }
      }
    });

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