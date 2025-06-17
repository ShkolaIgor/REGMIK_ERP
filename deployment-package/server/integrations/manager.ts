import { 
  IntegrationConfig, 
  EntityMapping, 
  SyncLog, 
  SyncQueue,
  FieldMapping,
  InsertSyncLog,
  InsertEntityMapping,
  InsertSyncQueue
} from '@shared/schema';
import { Bitrix24Service, Bitrix24Config } from './bitrix24';
import { OneCService, OneCConfig } from './1c';
import { storage } from '../storage';

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: string[];
  details?: any;
}

export class IntegrationManager {
  private bitrix24Services: Map<number, Bitrix24Service> = new Map();
  private oneCServices: Map<number, OneCService> = new Map();

  // ===============================
  // ІНІЦІАЛІЗАЦІЯ СЕРВІСІВ
  // ===============================

  async initializeService(integration: IntegrationConfig): Promise<void> {
    try {
      if (integration.name === 'bitrix24') {
        const config: Bitrix24Config = {
          baseUrl: integration.config.baseUrl!,
          clientId: integration.config.clientId!,
          clientSecret: integration.config.clientSecret!,
          accessToken: integration.config.apiKey,
          webhookUrl: integration.config.webhookUrl,
        };
        this.bitrix24Services.set(integration.id, new Bitrix24Service(config));
      } else if (integration.name.startsWith('1c_')) {
        const config: OneCConfig = {
          baseUrl: integration.config.baseUrl!,
          username: integration.config.clientId!,
          password: integration.config.clientSecret!,
          database: integration.config.customFields?.database,
          version: integration.config.customFields?.version || '8.3',
          publicationName: integration.config.customFields?.publicationName || 'erp',
        };
        this.oneCServices.set(integration.id, new OneCService(config));
      }
    } catch (error: any) {
      throw new Error(`Помилка ініціалізації сервісу ${integration.name}: ${error.message}`);
    }
  }

  // ===============================
  // СИНХРОНІЗАЦІЯ КЛІЄНТІВ
  // ===============================

  async syncClients(integrationId: number, direction: 'import' | 'export' = 'import'): Promise<SyncResult> {
    const integration = await storage.getIntegrationConfig(integrationId);
    if (!integration) {
      throw new Error('Інтеграція не знайдена');
    }

    const syncLog: InsertSyncLog = {
      integrationId,
      operation: `sync_clients_${direction}`,
      status: 'started',
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      startedAt: new Date(),
    };

    const logId = await storage.createSyncLog(syncLog);
    
    try {
      let result: SyncResult;

      if (integration.name === 'bitrix24') {
        result = await this.syncBitrix24Clients(integrationId, direction);
      } else if (integration.name.startsWith('1c_')) {
        result = await this.sync1CClients(integrationId, direction);
      } else {
        throw new Error(`Непідтримуваний тип інтеграції: ${integration.name}`);
      }

      // Оновлення лога синхронізації
      await storage.updateSyncLog(logId, {
        status: result.success ? 'completed' : 'failed',
        recordsProcessed: result.recordsProcessed,
        recordsSuccessful: result.recordsSuccessful,
        recordsFailed: result.recordsFailed,
        completedAt: new Date(),
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : undefined,
        details: result.details,
      });

      return result;
    } catch (error: any) {
      await storage.updateSyncLog(logId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private async syncBitrix24Clients(integrationId: number, direction: 'import' | 'export'): Promise<SyncResult> {
    const service = this.bitrix24Services.get(integrationId);
    if (!service) {
      throw new Error('Сервіс Бітрікс24 не ініціалізовано');
    }

    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
    };

    if (direction === 'import') {
      try {
        // Отримання компаній з Бітрікс24
        const companies = await service.getCompanies();
        result.recordsProcessed = companies.length;

        for (const company of companies) {
          try {
            // Перевірка чи вже існує мапінг
            const existingMapping = await storage.getEntityMapping(integrationId, 'client', company.ID!);
            
            if (existingMapping) {
              // Оновлення існуючого клієнта
              const clientData = this.mapBitrix24CompanyToClient(company);
              await storage.updateClient(parseInt(existingMapping.localId), clientData);
            } else {
              // Створення нового клієнта
              const clientData = this.mapBitrix24CompanyToClient(company);
              const newClient = await storage.createClient(clientData);
              
              // Створення мапінгу
              const mapping: InsertEntityMapping = {
                integrationId,
                entityType: 'client',
                localId: newClient.id.toString(),
                externalId: company.ID!,
                syncDirection: 'import',
              };
              await storage.createEntityMapping(mapping);
            }
            
            result.recordsSuccessful++;
          } catch (error: any) {
            result.recordsFailed++;
            result.errors.push(`Помилка обробки компанії ${company.ID}: ${error.message}`);
          }
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(`Помилка отримання компаній з Бітрікс24: ${error.message}`);
      }
    } else {
      // Експорт клієнтів до Бітрікс24
      try {
        const clients = await storage.getAllClients();
        result.recordsProcessed = clients.length;

        for (const client of clients) {
          try {
            const existingMapping = await storage.getEntityMappingByLocalId(integrationId, 'client', client.id.toString());
            const companyData = this.mapClientToBitrix24Company(client);
            
            if (existingMapping) {
              // Оновлення існуючої компанії
              await service.updateCompany(existingMapping.externalId, companyData);
            } else {
              // Створення нової компанії
              const externalId = await service.createCompany(companyData);
              
              // Створення мапінгу
              const mapping: InsertEntityMapping = {
                integrationId,
                entityType: 'client',
                localId: client.id.toString(),
                externalId,
                syncDirection: 'export',
              };
              await storage.createEntityMapping(mapping);
            }
            
            result.recordsSuccessful++;
          } catch (error: any) {
            result.recordsFailed++;
            result.errors.push(`Помилка обробки клієнта ${client.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(`Помилка експорту клієнтів до Бітрікс24: ${error.message}`);
      }
    }

    return result;
  }

  private async sync1CClients(integrationId: number, direction: 'import' | 'export'): Promise<SyncResult> {
    const service = this.oneCServices.get(integrationId);
    if (!service) {
      throw new Error('Сервіс 1С не ініціалізовано');
    }

    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
    };

    if (direction === 'import') {
      try {
        // Отримання контрагентів з 1С
        const counterparties = await service.getCounterparties();
        result.recordsProcessed = counterparties.length;

        for (const counterparty of counterparties) {
          try {
            const existingMapping = await storage.getEntityMapping(integrationId, 'client', counterparty.Ref_Key!);
            
            if (existingMapping) {
              // Оновлення існуючого клієнта
              const clientData = this.map1CCounterpartyToClient(counterparty);
              await storage.updateClient(parseInt(existingMapping.localId), clientData);
            } else {
              // Створення нового клієнта
              const clientData = this.map1CCounterpartyToClient(counterparty);
              const newClient = await storage.createClient(clientData);
              
              // Створення мапінгу
              const mapping: InsertEntityMapping = {
                integrationId,
                entityType: 'client',
                localId: newClient.id.toString(),
                externalId: counterparty.Ref_Key!,
                syncDirection: 'import',
              };
              await storage.createEntityMapping(mapping);
            }
            
            result.recordsSuccessful++;
          } catch (error: any) {
            result.recordsFailed++;
            result.errors.push(`Помилка обробки контрагента ${counterparty.Ref_Key}: ${error.message}`);
          }
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(`Помилка отримання контрагентів з 1С: ${error.message}`);
      }
    }

    return result;
  }

  // ===============================
  // МАПІНГ ДАНИХ
  // ===============================

  private mapBitrix24CompanyToClient(company: any): any {
    const emails = company.EMAIL ? company.EMAIL.map((e: any) => e.VALUE).join(', ') : '';
    const phones = company.PHONE ? company.PHONE.map((p: any) => p.VALUE).join(', ') : '';

    return {
      name: company.TITLE || '',
      taxCode: company.UF_CRM_COMPANY_TAX_CODE || '',
      email: emails,
      phone: phones,
      address: company.ADDRESS || '',
      contactPerson: '',
      isActive: true,
    };
  }

  private mapClientToBitrix24Company(client: any): any {
    return {
      TITLE: client.name,
      EMAIL: client.email ? [{ VALUE: client.email, VALUE_TYPE: 'WORK' }] : [],
      PHONE: client.phone ? [{ VALUE: client.phone, VALUE_TYPE: 'WORK' }] : [],
      ADDRESS: client.address || '',
      UF_CRM_COMPANY_TAX_CODE: client.taxCode || '',
    };
  }

  private map1CCounterpartyToClient(counterparty: any): any {
    return {
      name: counterparty.Description || counterparty.FullDescr || '',
      taxCode: counterparty.INN || '',
      email: counterparty.Email || '',
      phone: counterparty.Phone || '',
      address: counterparty.Address || '',
      contactPerson: '',
      isActive: !counterparty.DeletionMark,
    };
  }

  private mapClientTo1CCounterparty(client: any): any {
    return {
      Description: client.name,
      FullDescr: client.name,
      INN: client.taxCode || '',
      Email: client.email || '',
      Phone: client.phone || '',
      Address: client.address || '',
    };
  }

  // ===============================
  // ТЕСТУВАННЯ З'ЄДНАННЯ
  // ===============================

  async testConnection(integration: IntegrationConfig): Promise<boolean> {
    try {
      await this.initializeService(integration);

      if (integration.name === 'bitrix24') {
        const service = this.bitrix24Services.get(integration.id);
        return service ? await service.testConnection() : false;
      } else if (integration.name.startsWith('1c_')) {
        const service = this.oneCServices.get(integration.id);
        return service ? await service.testConnection() : false;
      }

      return false;
    } catch (error: any) {
      console.error(`Помилка тестування з'єднання для ${integration.name}:`, error);
      return false;
    }
  }

  // ===============================
  // ЧЕРГА СИНХРОНІЗАЦІЇ
  // ===============================

  async addToSyncQueue(queueItem: InsertSyncQueue): Promise<void> {
    await storage.createSyncQueueItem(queueItem);
  }

  async processSyncQueue(): Promise<void> {
    const pendingItems = await storage.getPendingSyncQueueItems();
    
    for (const item of pendingItems) {
      try {
        await storage.updateSyncQueueItem(item.id, { status: 'processing', processedAt: new Date() });
        
        // Обробка елемента черги залежно від операції
        if (item.operation === 'sync_clients') {
          await this.syncClients(item.integrationId, item.direction as 'import' | 'export');
        }
        
        await storage.updateSyncQueueItem(item.id, { status: 'completed' });
      } catch (error: any) {
        const attempts = item.attempts + 1;
        if (attempts >= item.maxAttempts) {
          await storage.updateSyncQueueItem(item.id, { 
            status: 'failed', 
            attempts,
            errorMessage: error.message 
          });
        } else {
          await storage.updateSyncQueueItem(item.id, { 
            status: 'pending', 
            attempts,
            errorMessage: error.message,
            scheduledAt: new Date(Date.now() + 5 * 60 * 1000) // Повтор через 5 хвилин
          });
        }
      }
    }
  }
}

export const integrationManager = new IntegrationManager();