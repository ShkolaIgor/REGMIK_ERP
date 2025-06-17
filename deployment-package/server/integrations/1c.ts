import axios, { AxiosInstance } from 'axios';
import { IntegrationConfig, EntityMapping } from '@shared/schema';

export interface OneCConfig {
  baseUrl: string;
  username: string;
  password: string;
  database?: string;
  version?: string; // "8.3", "8.2", etc.
  publicationName?: string; // назва публікації веб-сервісу
}

export interface OneCCounterparty {
  Ref_Key?: string;
  Code?: string;
  Description?: string;
  FullDescr?: string;
  INN?: string; // ІПН/ЄДРПОУ
  KPP?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  IsFolder?: boolean;
  DeletionMark?: boolean;
  Predefined?: boolean;
}

export interface OneCNomenclature {
  Ref_Key?: string;
  Code?: string;
  Description?: string;
  Article?: string; // артикул
  BaseUnit?: string;
  Price?: number;
  IsFolder?: boolean;
  DeletionMark?: boolean;
  Predefined?: boolean;
}

export interface OneCDocument {
  Ref_Key?: string;
  Number?: string;
  Date?: string;
  Posted?: boolean;
  DeletionMark?: boolean;
  Counterparty?: string;
  Amount?: number;
  Currency?: string;
  Comment?: string;
}

export interface OneCOrder {
  Ref_Key?: string;
  Number?: string;
  Date?: string;
  Counterparty?: string;
  Amount?: number;
  Currency?: string;
  Status?: string;
  Comment?: string;
  OrderItems?: OneCOrderItem[];
}

export interface OneCOrderItem {
  Nomenclature?: string;
  Quantity?: number;
  Price?: number;
  Amount?: number;
  Unit?: string;
}

export class OneCService {
  private client: AxiosInstance;
  private config: OneCConfig;

  constructor(config: OneCConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 60000, // 1С може працювати повільно
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
      },
    });

    // Обробка помилок
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Помилка авторизації в 1С. Перевірте логін та пароль.');
        }
        if (error.response?.status === 404) {
          throw new Error('Веб-сервіс 1С не знайдено. Перевірте URL та налаштування публікації.');
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Неможливо підключитися до сервера 1С. Перевірте доступність сервера.');
        }
        throw error;
      }
    );
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З КОНТРАГЕНТАМИ
  // ===============================

  async getCounterparties(filter: Record<string, any> = {}): Promise<OneCCounterparty[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Counterparties`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $filter: this.buildODataFilter(filter),
          $select: 'Ref_Key,Code,Description,FullDescr,INN,Phone,Email,Address,DeletionMark',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання контрагентів з 1С: ${error.message}`);
    }
  }

  async createCounterparty(counterparty: Partial<OneCCounterparty>): Promise<string> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Counterparties`;
      const response = await this.client.post(url, counterparty, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return response.data.Ref_Key;
    } catch (error) {
      throw new Error(`Помилка створення контрагента в 1С: ${error.message}`);
    }
  }

  async updateCounterparty(refKey: string, counterparty: Partial<OneCCounterparty>): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Counterparties(guid'${refKey}')`;
      await this.client.patch(url, counterparty, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return true;
    } catch (error) {
      throw new Error(`Помилка оновлення контрагента в 1С: ${error.message}`);
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З НОМЕНКЛАТУРОЮ
  // ===============================

  async getNomenclature(filter: Record<string, any> = {}): Promise<OneCNomenclature[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Nomenclature`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $filter: this.buildODataFilter(filter),
          $select: 'Ref_Key,Code,Description,Article,BaseUnit,DeletionMark',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання номенклатури з 1С: ${error.message}`);
    }
  }

  async createNomenclature(nomenclature: Partial<OneCNomenclature>): Promise<string> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Nomenclature`;
      const response = await this.client.post(url, nomenclature, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return response.data.Ref_Key;
    } catch (error) {
      throw new Error(`Помилка створення номенклатури в 1С: ${error.message}`);
    }
  }

  async updateNomenclature(refKey: string, nomenclature: Partial<OneCNomenclature>): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Nomenclature(guid'${refKey}')`;
      await this.client.patch(url, nomenclature, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return true;
    } catch (error) {
      throw new Error(`Помилка оновлення номенклатури в 1С: ${error.message}`);
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З ЗАМОВЛЕННЯМИ
  // ===============================

  async getOrders(filter: Record<string, any> = {}): Promise<OneCOrder[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_CustomerOrder`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $filter: this.buildODataFilter(filter),
          $select: 'Ref_Key,Number,Date,Counterparty,Amount,Currency,Status,Comment',
          $expand: 'OrderItems',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання замовлень з 1С: ${error.message}`);
    }
  }

  async createOrder(order: Partial<OneCOrder>): Promise<string> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_CustomerOrder`;
      const response = await this.client.post(url, order, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return response.data.Ref_Key;
    } catch (error) {
      throw new Error(`Помилка створення замовлення в 1С: ${error.message}`);
    }
  }

  async updateOrder(refKey: string, order: Partial<OneCOrder>): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_CustomerOrder(guid'${refKey}')`;
      await this.client.patch(url, order, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
      return true;
    } catch (error) {
      throw new Error(`Помилка оновлення замовлення в 1С: ${error.message}`);
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З ДОКУМЕНТАМИ
  // ===============================

  async getDocuments(documentType: string, filter: Record<string, any> = {}): Promise<OneCDocument[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_${documentType}`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $filter: this.buildODataFilter(filter),
          $select: 'Ref_Key,Number,Date,Posted,DeletionMark,Counterparty,Amount,Currency,Comment',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання документів ${documentType} з 1С: ${error.message}`);
    }
  }

  async postDocument(documentType: string, refKey: string): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_${documentType}(guid'${refKey}')/Post`;
      await this.client.post(url);
      return true;
    } catch (error) {
      throw new Error(`Помилка проведення документу в 1С: ${error.message}`);
    }
  }

  async unpostDocument(documentType: string, refKey: string): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Document_${documentType}(guid'${refKey}')/Unpost`;
      await this.client.post(url);
      return true;
    } catch (error) {
      throw new Error(`Помилка скасування проведення документу в 1С: ${error.message}`);
    }
  }

  // ===============================
  // ДОПОМІЖНІ МЕТОДИ
  // ===============================

  async testConnection(): Promise<boolean> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/$metadata`;
      const response = await this.client.get(url);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private buildODataFilter(filter: Record<string, any>): string {
    const conditions: string[] = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          conditions.push(`${key} eq '${value}'`);
        } else if (typeof value === 'number') {
          conditions.push(`${key} eq ${value}`);
        } else if (typeof value === 'boolean') {
          conditions.push(`${key} eq ${value}`);
        } else if (value instanceof Date) {
          conditions.push(`${key} eq datetime'${value.toISOString()}'`);
        }
      }
    }
    
    return conditions.join(' and ');
  }

  formatDateForOneC(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  parseDateFromOneC(dateString: string): Date {
    return new Date(dateString);
  }

  // Методи для роботи з валютами
  async getCurrencies(): Promise<any[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_Currencies`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $select: 'Ref_Key,Code,Description,FullDescr',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання валют з 1С: ${error.message}`);
    }
  }

  // Методи для роботи з одиницями виміру
  async getUnitsOfMeasure(): Promise<any[]> {
    try {
      const url = `/ws/${this.config.publicationName || 'erp'}/Catalog_UnitsOfMeasure`;
      const response = await this.client.get(url, {
        params: {
          $format: 'json',
          $select: 'Ref_Key,Code,Description,FullDescr',
        },
      });
      return response.data.value || [];
    } catch (error) {
      throw new Error(`Помилка отримання одиниць виміру з 1С: ${error.message}`);
    }
  }
}