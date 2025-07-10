// Простий API для тестування інтеграцій
import type { Express } from "express";

interface SimpleIntegration {
  id: number;
  name: string;
  displayName: string;
  type: string;
  isActive: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Тимчасове збереження в пам'яті
const integrations: Map<number, SimpleIntegration> = new Map();
let currentId = 1;

export function registerSimpleIntegrationRoutes(app: Express) {
  // Отримання всіх інтеграцій
  app.get("/api/integrations", async (req, res) => {
    try {
      const allIntegrations = Array.from(integrations.values());
      res.json(allIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // Створення нової інтеграції
  app.post("/api/integrations", async (req, res) => {
    try {
      const { name, displayName, type, isActive, config } = req.body;
      
      if (!name || !displayName || !type) {
        return res.status(400).json({ error: "Name, displayName and type are required" });
      }

      const integration: SimpleIntegration = {
        id: currentId++,
        name,
        displayName,
        type,
        isActive: isActive || false,
        config: config || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      integrations.set(integration.id, integration);
      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  // Отримання логів синхронізації (заглушка)
  app.get("/api/integrations/sync-logs", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // ВІДКЛЮЧЕНО: Конфліктує з основним test endpoint у routes.ts
  // app.post("/api/integrations/:id/test", async (req, res) => {
  //   try {
  //     const id = parseInt(req.params.id);
  //     const integration = integrations.get(id);
  //     
  //     if (!integration) {
  //       return res.status(404).json({ error: "Integration not found" });
  //     }

  //     // Заглушка для тестування
  //     res.json({ 
  //       success: true, 
  //       message: "Connection test successful",
  //       timestamp: new Date().toISOString()
  //     });
  //   } catch (error) {
  //     console.error("Error testing integration:", error);
  //     res.status(500).json({ error: "Failed to test integration" });
  //   }
  // });

  // Запуск синхронізації
  app.post("/api/integrations/:id/sync", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const integration = integrations.get(id);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      // Заглушка для синхронізації
      res.json({ 
        success: true, 
        message: "Synchronization started",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error starting synchronization:", error);
      res.status(500).json({ error: "Failed to start synchronization" });
    }
  });
}