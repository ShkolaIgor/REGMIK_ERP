// API для синхронізації з зовнішніми системами
import type { Express } from "express";
import { dbStorage as storage } from "./db-storage";
import { z } from "zod";

// Схеми валідації для вхідних даних синхронізації
const syncClientSchema = z.object({
  externalId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  rating: z.number().min(1).max(5).optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  // Мета-дані синхронізації
  lastSyncAt: z.string().datetime().optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const syncContactSchema = z.object({
  externalId: z.string(),
  clientExternalId: z.string(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const syncInvoiceSchema = z.object({
  externalId: z.string(),
  clientExternalId: z.string(),
  invoiceNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('UAH'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  description: z.string().optional(),
  items: z.array(z.object({
    productExternalId: z.string().optional(),
    name: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
    description: z.string().optional()
  })).optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const batchSyncSchema = z.object({
  clients: z.array(syncClientSchema).optional(),
  contacts: z.array(syncContactSchema).optional(),
  invoices: z.array(syncInvoiceSchema).optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual'),
  syncId: z.string().optional() // Унікальний ідентифікатор сесії синхронізації
});

export function registerSyncApiRoutes(app: Express) {
  // Синхронізація клієнтів
  app.post("/api/sync/clients", async (req, res) => {
    try {
      const validatedData = syncClientSchema.parse(req.body);
      
      // Перевіряємо чи існує клієнт з таким externalId
      const existingClient = await storage.getClientByExternalId(validatedData.externalId);
      
      let client;
      if (existingClient) {
        // Оновлюємо існуючого клієнта
        client = await storage.updateClient(existingClient.id, {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          contactPerson: validatedData.contactPerson,
          address: validatedData.address,
          description: validatedData.description,
          isActive: validatedData.isActive,
          rating: validatedData.rating,
          paymentTerms: validatedData.paymentTerms,
          deliveryTerms: validatedData.deliveryTerms,
          lastSyncAt: new Date()
        });
      } else {
        // Створюємо нового клієнта
        client = await storage.createClient({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          contactPerson: validatedData.contactPerson,
          address: validatedData.address,
          description: validatedData.description,
          isActive: validatedData.isActive,
          rating: validatedData.rating,
          paymentTerms: validatedData.paymentTerms,
          deliveryTerms: validatedData.deliveryTerms,
          externalId: validatedData.externalId,
          source: validatedData.source
        });
      }

      res.json({
        success: true,
        client,
        action: existingClient ? 'updated' : 'created'
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
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive
        });
      } else {
        // Створюємо новий контакт
        contact = await storage.createClientContact({
          clientId: client.id,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          position: validatedData.position,
          isPrimary: validatedData.isPrimary,
          isActive: validatedData.isActive,
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

  // Синхронізація рахунків
  app.post("/api/sync/invoices", async (req, res) => {
    try {
      const validatedData = syncInvoiceSchema.parse(req.body);
      
      // Знаходимо клієнта за externalId
      const client = await storage.getClientByExternalId(validatedData.clientExternalId);
      if (!client) {
        return res.status(404).json({ 
          error: "Client not found", 
          clientExternalId: validatedData.clientExternalId 
        });
      }

      // Перевіряємо чи існує рахунок з таким externalId
      const existingInvoice = await storage.getInvoiceByExternalId(validatedData.externalId);
      
      let invoice;
      if (existingInvoice) {
        // Оновлюємо існуючий рахунок
        invoice = await storage.updateInvoice(existingInvoice.id, {
          invoiceNumber: validatedData.invoiceNumber,
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: validatedData.status,
          issueDate: new Date(validatedData.issueDate),
          dueDate: new Date(validatedData.dueDate),
          description: validatedData.description
        });
      } else {
        // Створюємо новий рахунок
        invoice = await storage.createInvoice({
          clientId: client.id,
          invoiceNumber: validatedData.invoiceNumber,
          amount: validatedData.amount,
          currency: validatedData.currency,
          status: validatedData.status,
          issueDate: new Date(validatedData.issueDate),
          dueDate: new Date(validatedData.dueDate),
          description: validatedData.description,
          externalId: validatedData.externalId,
          source: validatedData.source
        });

        // Додаємо позиції рахунку, якщо вони є
        if (validatedData.items && validatedData.items.length > 0) {
          for (const item of validatedData.items) {
            await storage.createInvoiceItem({
              invoiceId: invoice.id,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              description: item.description,
              productExternalId: item.productExternalId
            });
          }
        }
      }

      res.json({
        success: true,
        invoice,
        action: existingInvoice ? 'updated' : 'created',
        clientId: client.id
      });

    } catch (error) {
      console.error("Error syncing invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to sync invoice" });
    }
  });

  // Масова синхронізація
  app.post("/api/sync/batch", async (req, res) => {
    try {
      const validatedData = batchSyncSchema.parse(req.body);
      const results = {
        clients: [],
        contacts: [],
        invoices: [],
        errors: []
      };

      const syncId = validatedData.syncId || `sync_${Date.now()}`;

      // Синхронізуємо клієнтів
      if (validatedData.clients) {
        for (const clientData of validatedData.clients) {
          try {
            const existingClient = await storage.getClientByExternalId(clientData.externalId);
            let client;
            
            if (existingClient) {
              client = await storage.updateClient(existingClient.id, {
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone,
                contactPerson: clientData.contactPerson,
                address: clientData.address,
                description: clientData.description,
                isActive: clientData.isActive,
                rating: clientData.rating,
                paymentTerms: clientData.paymentTerms,
                deliveryTerms: clientData.deliveryTerms,
                lastSyncAt: new Date()
              });
            } else {
              client = await storage.createClient({
                ...clientData,
                externalId: clientData.externalId,
                source: validatedData.source
              });
            }

            results.clients.push({
              externalId: clientData.externalId,
              id: client.id,
              action: existingClient ? 'updated' : 'created'
            });
          } catch (error) {
            results.errors.push({
              type: 'client',
              externalId: clientData.externalId,
              error: error.message
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
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive
              });
            } else {
              contact = await storage.createClientContact({
                clientId: client.id,
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                position: contactData.position,
                isPrimary: contactData.isPrimary,
                isActive: contactData.isActive,
                externalId: contactData.externalId,
                source: validatedData.source
              });
            }

            results.contacts.push({
              externalId: contactData.externalId,
              id: contact.id,
              clientId: client.id,
              action: existingContact ? 'updated' : 'created'
            });
          } catch (error) {
            results.errors.push({
              type: 'contact',
              externalId: contactData.externalId,
              error: error.message
            });
          }
        }
      }

      // Синхронізуємо рахунки
      if (validatedData.invoices) {
        for (const invoiceData of validatedData.invoices) {
          try {
            const client = await storage.getClientByExternalId(invoiceData.clientExternalId);
            if (!client) {
              results.errors.push({
                type: 'invoice',
                externalId: invoiceData.externalId,
                error: `Client not found: ${invoiceData.clientExternalId}`
              });
              continue;
            }

            const existingInvoice = await storage.getInvoiceByExternalId(invoiceData.externalId);
            let invoice;

            if (existingInvoice) {
              invoice = await storage.updateInvoice(existingInvoice.id, {
                invoiceNumber: invoiceData.invoiceNumber,
                amount: invoiceData.amount,
                currency: invoiceData.currency,
                status: invoiceData.status,
                issueDate: new Date(invoiceData.issueDate),
                dueDate: new Date(invoiceData.dueDate),
                description: invoiceData.description
              });
            } else {
              invoice = await storage.createInvoice({
                clientId: client.id,
                invoiceNumber: invoiceData.invoiceNumber,
                amount: invoiceData.amount,
                currency: invoiceData.currency,
                status: invoiceData.status,
                issueDate: new Date(invoiceData.issueDate),
                dueDate: new Date(invoiceData.dueDate),
                description: invoiceData.description,
                externalId: invoiceData.externalId,
                source: validatedData.source
              });
            }

            results.invoices.push({
              externalId: invoiceData.externalId,
              id: invoice.id,
              clientId: client.id,
              action: existingInvoice ? 'updated' : 'created'
            });
          } catch (error) {
            results.errors.push({
              type: 'invoice',
              externalId: invoiceData.externalId,
              error: error.message
            });
          }
        }
      }

      // Логуємо результати синхронізації
      const syncLogId = await storage.createSyncLog({
        source: validatedData.source,
        syncId,
        startTime: new Date(),
        endTime: new Date(),
        status: results.errors.length > 0 ? 'partial_success' : 'success',
        clientsProcessed: results.clients.length,
        contactsProcessed: results.contacts.length,
        invoicesProcessed: results.invoices.length,
        errorsCount: results.errors.length,
        details: JSON.stringify(results)
      });

      res.json({
        success: true,
        syncId,
        syncLogId,
        summary: {
          clients: results.clients.length,
          contacts: results.contacts.length,
          invoices: results.invoices.length,
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

  // Отримання статусу синхронізації
  app.get("/api/sync/status/:syncId", async (req, res) => {
    try {
      const { syncId } = req.params;
      const syncLog = await storage.getSyncLogBySyncId(syncId);
      
      if (!syncLog) {
        return res.status(404).json({ error: "Sync session not found" });
      }

      res.json({
        syncId,
        status: syncLog.status,
        startTime: syncLog.startTime,
        endTime: syncLog.endTime,
        summary: {
          clients: syncLog.clientsProcessed,
          contacts: syncLog.contactsProcessed,
          invoices: syncLog.invoicesProcessed,
          errors: syncLog.errorsCount
        },
        details: syncLog.details ? JSON.parse(syncLog.details) : null
      });

    } catch (error) {
      console.error("Error getting sync status:", error);
      res.status(500).json({ error: "Failed to get sync status" });
    }
  });

  // Отримання історії синхронізацій
  app.get("/api/sync/history", async (req, res) => {
    try {
      const { source, limit = 50 } = req.query;
      const history = await storage.getSyncHistory(source as string, parseInt(limit as string));
      res.json(history);
    } catch (error) {
      console.error("Error getting sync history:", error);
      res.status(500).json({ error: "Failed to get sync history" });
    }
  });
}