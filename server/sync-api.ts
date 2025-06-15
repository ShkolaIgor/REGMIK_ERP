// API для синхронізації з зовнішніми системами
import type { Express } from "express";
import { storage } from "./storage";
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

const syncInvoiceSchema = z.object({
  externalId: z.string(),
  clientExternalId: z.string(),
  companyId: z.number().optional(),
  invoiceNumber: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("UAH"),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issueDate: z.string().transform((val) => new Date(val)),
  dueDate: z.string().transform((val) => new Date(val)),
  paidDate: z.string().optional().transform((val) => val ? new Date(val) : null),
  description: z.string().optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const syncInvoiceItemSchema = z.object({
  externalId: z.string(),
  invoiceExternalId: z.string(),
  productExternalId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  description: z.string().optional()
});

const syncCompanySchema = z.object({
  externalId: z.string(),
  name: z.string().min(1),
  fullName: z.string().optional(),
  taxCode: z.string().min(1),
  vatNumber: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankCode: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  source: z.enum(['bitrix24', '1c', 'manual']).default('manual')
});

const batchSyncSchema = z.object({
  clients: z.array(syncClientSchema).optional(),
  contacts: z.array(syncContactSchema).optional(),
  invoices: z.array(syncInvoiceSchema).optional(),
  invoiceItems: z.array(syncInvoiceItemSchema).optional(),
  companies: z.array(syncCompanySchema).optional(),
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

  // Синхронізація компаній
  app.post("/api/sync/companies", async (req, res) => {
    try {
      const validatedData = syncCompanySchema.parse(req.body);
      
      // Перевіряємо чи існує компанія з таким externalId
      const existingCompany = await storage.getCompanyByExternalId?.(validatedData.externalId);
      
      let company;
      let action;

      if (existingCompany) {
        // Оновлюємо існуючу компанію
        company = await storage.updateCompany(existingCompany.id, {
          name: validatedData.name,
          fullName: validatedData.fullName,
          taxCode: validatedData.taxCode,
          vatNumber: validatedData.vatNumber,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website,
          bankName: validatedData.bankName,
          bankAccount: validatedData.bankAccount,
          bankCode: validatedData.bankCode,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
        action = 'updated';
      } else {
        // Створюємо нову компанію
        company = await storage.createCompany({
          name: validatedData.name,
          fullName: validatedData.fullName,
          taxCode: validatedData.taxCode,
          vatNumber: validatedData.vatNumber,
          legalAddress: validatedData.legalAddress,
          physicalAddress: validatedData.physicalAddress,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website,
          bankName: validatedData.bankName,
          bankAccount: validatedData.bankAccount,
          bankCode: validatedData.bankCode,
          isDefault: validatedData.isDefault,
          isActive: validatedData.isActive,
          notes: validatedData.notes
        });
        action = 'created';
      }

      res.json({
        success: true,
        company,
        action,
        externalId: validatedData.externalId
      });

    } catch (error) {
      console.error("Error syncing company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to sync company" });
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
          error: `Client not found with external ID: ${validatedData.clientExternalId}` 
        });
      }

      // Перевіряємо чи існує рахунок з таким externalId
      const existingInvoice = await storage.getInvoiceByExternalId?.(validatedData.externalId);
      
      let invoice;
      let action;

      const invoiceData = {
        clientId: client.id,
        companyId: validatedData.companyId,
        invoiceNumber: validatedData.invoiceNumber,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: validatedData.status,
        issueDate: validatedData.issueDate,
        dueDate: validatedData.dueDate,
        paidDate: validatedData.paidDate,
        description: validatedData.description,
        externalId: validatedData.externalId,
        source: validatedData.source
      };

      if (existingInvoice) {
        // Оновлюємо існуючий рахунок
        invoice = await storage.updateInvoice(existingInvoice.id, invoiceData);
        action = 'updated';
      } else {
        // Створюємо новий рахунок
        invoice = await storage.createInvoice(invoiceData);
        action = 'created';
      }

      res.json({
        success: true,
        invoice,
        action,
        clientId: client.id,
        externalId: validatedData.externalId
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

  // Синхронізація позицій рахунків
  app.post("/api/sync/invoice-items", async (req, res) => {
    try {
      const invoiceItemSchema = z.object({
        invoiceId: z.number(),
        productId: z.number().optional(),
        productExternalId: z.string().optional(),
        name: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        description: z.string().optional()
      });

      const validatedData = invoiceItemSchema.parse(req.body);

      // Перевіряємо існування рахунку
      const invoice = await storage.getInvoice(validatedData.invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Якщо вказано productExternalId, знаходимо продукт
      let productId = validatedData.productId;
      if (validatedData.productExternalId && !productId) {
        const products = await storage.getProducts();
        const product = products.find(p => p.sku === validatedData.productExternalId);
        if (product) {
          productId = product.id;
        }
      }

      const invoiceItem = await storage.createInvoiceItem({
        invoiceId: validatedData.invoiceId,
        productId: productId || null,
        productExternalId: validatedData.productExternalId || null,
        name: validatedData.name,
        quantity: validatedData.quantity.toString(),
        unitPrice: validatedData.unitPrice.toString(),
        totalPrice: validatedData.totalPrice.toString(),
        description: validatedData.description || null
      });

      res.json({
        success: true,
        invoiceItem,
        action: "created"
      });

    } catch (error) {
      console.error("Error syncing invoice item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to sync invoice item" });
    }
  });

  // Тестова масова синхронізація рахунків
  app.post("/api/sync/bulk-invoices", async (req, res) => {
    try {
      const startTime = new Date();
      let invoicesProcessed = 0;
      let itemsProcessed = 0;
      let errors: string[] = [];

      // Симуляція даних з Bitrix24
      const invoicesData = [
        {
          externalId: "bitrix_invoice_003",
          clientExternalId: "bitrix_client_001",
          companyId: 1,
          invoiceNumber: "INV-2025-003",
          amount: 12000,
          currency: "UAH",
          status: "pending",
          issueDate: "2025-06-08T00:00:00Z",
          dueDate: "2025-06-22T00:00:00Z",
          description: "Рахунок за аналітичні модулі",
          source: "bitrix24",
          items: [
            {
              name: "Модуль аналітики продажів",
              quantity: 1,
              unitPrice: 6000,
              totalPrice: 6000,
              description: "Розробка та впровадження модуля аналітики продажів"
            },
            {
              name: "Модуль звітності",
              quantity: 1,
              unitPrice: 6000,
              totalPrice: 6000,
              description: "Створення системи звітності та дашбордів"
            }
          ]
        },
        {
          externalId: "bitrix_invoice_004",
          clientExternalId: "bitrix_client_001",
          companyId: 1,
          invoiceNumber: "INV-2025-004",
          amount: 7500,
          currency: "UAH",
          status: "sent",
          issueDate: "2025-06-08T00:00:00Z",
          dueDate: "2025-06-25T00:00:00Z",
          description: "Рахунок за підтримку системи",
          source: "bitrix24",
          items: [
            {
              name: "Технічна підтримка (3 місяці)",
              quantity: 1,
              unitPrice: 7500,
              totalPrice: 7500,
              description: "Технічна підтримка ERP системи протягом 3 місяців"
            }
          ]
        }
      ];

      // Обробка кожного рахунку
      for (const invoiceData of invoicesData) {
        try {
          // Перевіряємо існування клієнта
          const clients = await storage.getClients();
          const client = clients.find(c => c.externalId === invoiceData.clientExternalId);
          
          if (!client) {
            errors.push(`Client not found: ${invoiceData.clientExternalId}`);
            continue;
          }

          // Створюємо або оновлюємо рахунок
          const existingInvoice = await storage.getInvoiceByExternalId(invoiceData.externalId);
          let invoice;

          if (existingInvoice) {
            invoice = await storage.updateInvoice(existingInvoice.id, {
              clientId: client.id,
              companyId: invoiceData.companyId,
              invoiceNumber: invoiceData.invoiceNumber,
              amount: invoiceData.amount.toString(),
              currency: invoiceData.currency,
              status: invoiceData.status,
              issueDate: new Date(invoiceData.issueDate),
              dueDate: new Date(invoiceData.dueDate),
              description: invoiceData.description,
              source: invoiceData.source,
              updatedAt: new Date()
            });
          } else {
            invoice = await storage.createInvoice({
              clientId: client.id,
              companyId: invoiceData.companyId,
              invoiceNumber: invoiceData.invoiceNumber,
              amount: invoiceData.amount.toString(),
              currency: invoiceData.currency,
              status: invoiceData.status,
              issueDate: new Date(invoiceData.issueDate),
              dueDate: new Date(invoiceData.dueDate),
              description: invoiceData.description,
              externalId: invoiceData.externalId,
              source: invoiceData.source
            });
          }

          invoicesProcessed++;

          // Створюємо позиції рахунку
          for (const itemData of invoiceData.items) {
            try {
              await storage.createInvoiceItem({
                invoiceId: invoice.id,
                productId: null,
                productExternalId: null,
                name: itemData.name,
                quantity: itemData.quantity.toString(),
                unitPrice: itemData.unitPrice.toString(),
                totalPrice: itemData.totalPrice.toString(),
                description: itemData.description
              });
              itemsProcessed++;
            } catch (itemError) {
              errors.push(`Failed to create item for invoice ${invoice.invoiceNumber}: ${itemError}`);
            }
          }

        } catch (invoiceError) {
          errors.push(`Failed to process invoice ${invoiceData.externalId}: ${invoiceError}`);
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      res.json({
        success: true,
        summary: {
          invoicesProcessed,
          itemsProcessed,
          errorsCount: errors.length,
          duration: `${duration}ms`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        },
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("Bulk sync error:", error);
      res.status(500).json({ error: "Failed to perform bulk sync" });
    }
  });

  // Отримання статистики синхронізації
  app.get("/api/sync/stats", async (req, res) => {
    try {
      const { source } = req.query;
      
      // Підраховуємо кількість об'єктів з зовнішніми ID
      const clientsQuery = storage.getClients();
      const contactsQuery = storage.getClientContacts();
      const companiesQuery = storage.getCompanies();
      const invoicesQuery = storage.getInvoices();
      
      const [clients, contacts, companies, invoices] = await Promise.all([
        clientsQuery, 
        contactsQuery, 
        companiesQuery, 
        invoicesQuery
      ]);
      
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
        },
        companies: {
          total: companies.length,
          synced: companies.filter(c => c.source && c.source !== 'manual').length,
          bySource: {} as Record<string, number>
        },
        invoices: {
          total: invoices.length,
          withExternalId: invoices.filter(i => i.externalId).length,
          bySource: {} as Record<string, number>
        }
      };

      // Підраховуємо по джерелах
      if (source) {
        stats.clients.bySource[source as string] = clients.filter(c => c.source === source).length;
        stats.contacts.bySource[source as string] = contacts.filter(c => c.source === source).length;
        stats.companies.bySource[source as string] = companies.filter(c => c.source === source).length;
        stats.invoices.bySource[source as string] = invoices.filter(i => i.source === source).length;
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting sync stats:", error);
      res.status(500).json({ error: "Failed to get sync stats" });
    }
  });
}