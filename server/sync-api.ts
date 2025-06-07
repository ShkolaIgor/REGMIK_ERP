// API для синхронізації з зовнішніми системами
import type { Express } from "express";
import { dbStorage as storage } from "./db-storage";
import { z } from "zod";

// Схеми валідації для вхідних даних синхронізації
const syncClientSchema = z.object({
  externalId: z.string(),
  name: z.string().min(1),
  taxCode: z.string().default(""),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  type: z.string().optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const syncContactSchema = z.object({
  externalId: z.string(),
  clientExternalId: z.string(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  primaryPhone: z.string().optional(),
  position: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const batchSyncSchema = z.object({
  clients: z.array(syncClientSchema).optional(),
  contacts: z.array(syncContactSchema).optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual'),
  syncId: z.string().optional()
});

export function registerSyncApiRoutes(app: Express) {
  // Синхронізація клієнтів
  app.post("/api/sync/clients", async (req, res) => {
    try {
      const validatedData = syncClientSchema.parse(req.body);
      
      // Перевіряємо чи існує клієнт з таким externalId
      const existingClient = await storage.getClientByExternalId(validatedData.externalId);
      
      let client;
      let action;
      
      if (existingClient) {
        // Оновлюємо існуючого клієнта
        client = await storage.updateClient(existingClient.id.toString(), {
          name: validatedData.name,
          taxCode: validatedData.taxCode,
          fullName: validatedData.fullName,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          notes: validatedData.notes,
          isActive: validatedData.isActive,
          type: validatedData.type
        });
        action = 'updated';
      } else {
        // Перевіряємо чи існує клієнт з таким taxCode
        const existingByTaxCode = await storage.getClientByTaxCode(validatedData.taxCode);
        
        if (existingByTaxCode) {
          // Оновлюємо існуючого клієнта та додаємо externalId
          client = await storage.updateClient(existingByTaxCode.id.toString(), {
            name: validatedData.name,
            taxCode: validatedData.taxCode,
            fullName: validatedData.fullName,
            legalAddress: validatedData.legalAddress,
            physicalAddress: validatedData.physicalAddress,
            notes: validatedData.notes,
            isActive: validatedData.isActive,
            type: validatedData.type
          });
          
          // Додаємо externalId та source до існуючого клієнта
          await storage.updateClientSyncInfo(existingByTaxCode.id, validatedData.externalId, validatedData.source);
          action = 'linked';
        } else {
          // Створюємо нового клієнта
          client = await storage.createClient({
            name: validatedData.name,
            taxCode: validatedData.taxCode,
            fullName: validatedData.fullName,
            legalAddress: validatedData.legalAddress,
            physicalAddress: validatedData.physicalAddress,
            notes: validatedData.notes,
            isActive: validatedData.isActive,
            type: validatedData.type
          });
          
          // Додаємо externalId та source до нового клієнта
          await storage.updateClientSyncInfo(client.id, validatedData.externalId, validatedData.source);
          action = 'created';
        }
      }

      res.json({
        success: true,
        client,
        action
      });

    } catch (error) {
      console.error("Error syncing client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to sync client" });
    }
  });

  // Синхронізація контактів
  app.post("/api/sync/contacts", async (req, res) => {
    try {
      const validatedData = syncContactSchema.parse(req.body);
      
      // Знаходимо клієнта за externalId
      const client = await storage.getClientByExternalId(validatedData.clientExternalId);
      if (!client) {
        return res.status(404).json({ 
          error: "Client not found", 
          clientExternalId: validatedData.clientExternalId 
        });
      }

      // Перевіряємо чи існує контакт з таким externalId
      const existingContact = await storage.getClientContactByExternalId(validatedData.externalId);
      
      let contact;
      if (existingContact) {
        // Оновлюємо існуючий контакт
        contact = await storage.updateClientContact(existingContact.id, {
          fullName: validatedData.fullName,
          email: validatedData.email,
          primaryPhone: validatedData.primaryPhone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
      } else {
        // Створюємо новий контакт
        contact = await storage.createClientContact({
          clientId: client.id,
          fullName: validatedData.fullName,
          email: validatedData.email,
          primaryPhone: validatedData.primaryPhone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive,
          notes: validatedData.notes,
          externalId: validatedData.externalId,
          source: validatedData.source
        });
      }

      res.json({
        success: true,
        contact,
        action: existingContact ? 'updated' : 'created',
        clientId: client.id
      });

    } catch (error) {
      console.error("Error syncing contact:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to sync contact" });
    }
  });

  // Масова синхронізація
  app.post("/api/sync/batch", async (req, res) => {
    try {
      const validatedData = batchSyncSchema.parse(req.body);
      const results = {
        clients: [] as any[],
        contacts: [] as any[],
        errors: [] as any[]
      };

      const syncId = validatedData.syncId || `sync_${Date.now()}`;

      // Синхронізуємо клієнтів
      if (validatedData.clients) {
        for (const clientData of validatedData.clients) {
          try {
            const existingClient = await storage.getClientByExternalId(clientData.externalId);
            let client;
            
            if (existingClient) {
              client = await storage.updateClient(existingClient.id.toString(), {
                name: clientData.name,
                taxCode: clientData.taxCode,
                fullName: clientData.fullName,
                legalAddress: clientData.legalAddress,
                physicalAddress: clientData.physicalAddress,
                notes: clientData.notes,
                isActive: clientData.isActive,
                type: clientData.type
              });
            } else {
              client = await storage.createClient({
                name: clientData.name,
                taxCode: clientData.taxCode,
                fullName: clientData.fullName,
                legalAddress: clientData.legalAddress,
                physicalAddress: clientData.physicalAddress,
                notes: clientData.notes,
                isActive: clientData.isActive,
                type: clientData.type,
                externalId: clientData.externalId,
                source: validatedData.source
              });
            }

            if (client) {
              results.clients.push({
                externalId: clientData.externalId,
                id: client.id,
                action: existingClient ? 'updated' : 'created'
              });
            }
          } catch (error) {
            results.errors.push({
              type: 'client',
              externalId: clientData.externalId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Синхронізуємо контакти
      if (validatedData.contacts) {
        for (const contactData of validatedData.contacts) {
          try {
            const client = await storage.getClientByExternalId(contactData.clientExternalId);
            if (!client) {
              results.errors.push({
                type: 'contact',
                externalId: contactData.externalId,
                error: `Client not found: ${contactData.clientExternalId}`
              });
              continue;
            }

            const existingContact = await storage.getClientContactByExternalId(contactData.externalId);
            let contact;

            if (existingContact) {
              contact = await storage.updateClientContact(existingContact.id, {
                fullName: contactData.fullName,
                email: contactData.email,
                primaryPhone: contactData.primaryPhone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive,
                notes: contactData.notes
              });
            } else {
              contact = await storage.createClientContact({
                clientId: client.id,
                fullName: contactData.fullName,
                email: contactData.email,
                primaryPhone: contactData.primaryPhone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive,
                notes: contactData.notes,
                externalId: contactData.externalId,
                source: validatedData.source
              });
            }

            if (contact) {
              results.contacts.push({
                externalId: contactData.externalId,
                id: contact.id,
                clientId: client.id,
                action: existingContact ? 'updated' : 'created'
              });
            }
          } catch (error) {
            results.errors.push({
              type: 'contact',
              externalId: contactData.externalId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      res.json({
        success: true,
        syncId,
        summary: {
          clients: results.clients.length,
          contacts: results.contacts.length,
          errors: results.errors.length
        },
        results
      });

    } catch (error) {
      console.error("Error in batch sync:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to perform batch sync" });
    }
  });

  // Отримання статистики синхронізації
  app.get("/api/sync/stats", async (req, res) => {
    try {
      const { source } = req.query;
      
      // Підраховуємо кількість об'єктів з зовнішніми ID
      const clientsQuery = storage.getClients();
      const contactsQuery = storage.getClientContacts();
      
      const [clients, contacts] = await Promise.all([clientsQuery, contactsQuery]);
      
      let stats = {
        clients: {
          total: clients.length,
          withExternalId: clients.filter(c => c.externalId).length,
          bySource: {} as Record<string, number>
        },
        contacts: {
          total: contacts.length,
          withExternalId: contacts.filter(c => c.externalId).length,
          bySource: {} as Record<string, number>
        }
      };

      // Підраховуємо по джерелах
      if (source) {
        stats.clients.bySource[source as string] = clients.filter(c => c.source === source).length;
        stats.contacts.bySource[source as string] = contacts.filter(c => c.source === source).length;
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting sync stats:", error);
      res.status(500).json({ error: "Failed to get sync stats" });
    }
  });
}