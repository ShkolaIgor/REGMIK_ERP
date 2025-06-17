import axios, { AxiosInstance } from 'axios';
import { IntegrationConfig, EntityMapping } from '@shared/schema';

export interface Bitrix24Config {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
}

export interface Bitrix24Contact {
  ID?: string;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  COMPANY_ID?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFY_BY_ID?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
}

export interface Bitrix24Company {
  ID?: string;
  TITLE?: string;
  COMPANY_TYPE?: string;
  INDUSTRY?: string;
  EMAIL?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  PHONE?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  WEB?: Array<{ VALUE: string; VALUE_TYPE: string }>;
  ADDRESS?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFY_BY_ID?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
}

export interface Bitrix24Deal {
  ID?: string;
  TITLE?: string;
  TYPE_ID?: string;
  STAGE_ID?: string;
  PROBABILITY?: number;
  CURRENCY_ID?: string;
  OPPORTUNITY?: number;
  COMPANY_ID?: string;
  CONTACT_ID?: string;
  ASSIGNED_BY_ID?: string;
  CREATED_BY_ID?: string;
  MODIFY_BY_ID?: string;
  DATE_CREATE?: string;
  DATE_MODIFY?: string;
  CLOSEDATE?: string;
}

export class Bitrix24Service {
  private client: AxiosInstance;
  private config: Bitrix24Config;

  constructor(config: Bitrix24Config) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Додавання токену авторизації до всіх запитів
    this.client.interceptors.request.use((config) => {
      if (this.config.accessToken) {
        config.params = {
          ...config.params,
          auth: this.config.accessToken,
        };
      }
      return config;
    });

    // Обробка помилок авторизації
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          try {
            await this.refreshAccessToken();
            return this.client.request(error.config);
          } catch (refreshError) {
            throw new Error('Помилка оновлення токену авторизації Бітрікс24');
          }
        }
        throw error;
      }
    );
  }

  async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth/token/`, {
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
      });

      this.config.accessToken = response.data.access_token;
      this.config.refreshToken = response.data.refresh_token;
    } catch (error) {
      throw new Error('Не вдалося оновити токен доступу');
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З КОНТАКТАМИ
  // ===============================

  async getContacts(start = 0, filter: Record<string, any> = {}): Promise<Bitrix24Contact[]> {
    try {
      const response = await this.client.get('/rest/crm.contact.list', {
        params: {
          start,
          filter,
          select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_ID', 'DATE_CREATE', 'DATE_MODIFY'],
        },
      });
      return response.data.result || [];
    } catch (error: any) {
      throw new Error(`Помилка отримання контактів з Бітрікс24: ${error.message}`);
    }
  }

  async createContact(contact: Partial<Bitrix24Contact>): Promise<string> {
    try {
      const response = await this.client.post('/rest/crm.contact.add', {
        fields: contact,
      });
      return response.data.result.toString();
    } catch (error: any) {
      throw new Error(`Помилка створення контакту в Бітрікс24: ${error.message}`);
    }
  }

  async updateContact(id: string, contact: Partial<Bitrix24Contact>): Promise<boolean> {
    try {
      const response = await this.client.post('/rest/crm.contact.update', {
        id,
        fields: contact,
      });
      return response.data.result === true;
    } catch (error: any) {
      throw new Error(`Помилка оновлення контакту в Бітрікс24: ${error.message}`);
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З КОМПАНІЯМИ
  // ===============================

  async getCompanies(start = 0, filter: Record<string, any> = {}): Promise<Bitrix24Company[]> {
    try {
      const response = await this.client.get('/rest/crm.company.list', {
        params: {
          start,
          filter,
          select: ['ID', 'TITLE', 'COMPANY_TYPE', 'EMAIL', 'PHONE', 'ADDRESS', 'DATE_CREATE', 'DATE_MODIFY'],
        },
      });
      return response.data.result || [];
    } catch (error: any) {
      throw new Error(`Помилка отримання компаній з Бітрікс24: ${error.message}`);
    }
  }

  async createCompany(company: Partial<Bitrix24Company>): Promise<string> {
    try {
      const response = await this.client.post('/rest/crm.company.add', {
        fields: company,
      });
      return response.data.result.toString();
    } catch (error: any) {
      throw new Error(`Помилка створення компанії в Бітрікс24: ${error.message}`);
    }
  }

  async updateCompany(id: string, company: Partial<Bitrix24Company>): Promise<boolean> {
    try {
      const response = await this.client.post('/rest/crm.company.update', {
        id,
        fields: company,
      });
      return response.data.result === true;
    } catch (error: any) {
      throw new Error(`Помилка оновлення компанії в Бітрікс24: ${error.message}`);
    }
  }

  // ===============================
  // МЕТОДИ ДЛЯ РОБОТИ З УГОДАМИ
  // ===============================

  async getDeals(start = 0, filter: Record<string, any> = {}): Promise<Bitrix24Deal[]> {
    try {
      const response = await this.client.get('/rest/crm.deal.list', {
        params: {
          start,
          filter,
          select: ['ID', 'TITLE', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'COMPANY_ID', 'CONTACT_ID', 'DATE_CREATE', 'DATE_MODIFY'],
        },
      });
      return response.data.result || [];
    } catch (error: any) {
      throw new Error(`Помилка отримання угод з Бітрікс24: ${error.message}`);
    }
  }

  async createDeal(deal: Partial<Bitrix24Deal>): Promise<string> {
    try {
      const response = await this.client.post('/rest/crm.deal.add', {
        fields: deal,
      });
      return response.data.result.toString();
    } catch (error: any) {
      throw new Error(`Помилка створення угоди в Бітрікс24: ${error.message}`);
    }
  }

  async updateDeal(id: string, deal: Partial<Bitrix24Deal>): Promise<boolean> {
    try {
      const response = await this.client.post('/rest/crm.deal.update', {
        id,
        fields: deal,
      });
      return response.data.result === true;
    } catch (error: any) {
      throw new Error(`Помилка оновлення угоди в Бітрікс24: ${error.message}`);
    }
  }

  // ===============================
  // ДОПОМІЖНІ МЕТОДИ
  // ===============================

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/rest/app.info');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  formatPhoneNumbers(phones: string[]): Array<{ VALUE: string; VALUE_TYPE: string }> {
    return phones.map((phone, index) => ({
      VALUE: phone,
      VALUE_TYPE: index === 0 ? 'WORK' : 'MOBILE',
    }));
  }

  formatEmails(emails: string[]): Array<{ VALUE: string; VALUE_TYPE: string }> {
    return emails.map((email) => ({
      VALUE: email,
      VALUE_TYPE: 'WORK',
    }));
  }

  extractPhoneNumbers(phones: Array<{ VALUE: string; VALUE_TYPE: string }>): string[] {
    return phones ? phones.map(phone => phone.VALUE) : [];
  }

  extractEmails(emails: Array<{ VALUE: string; VALUE_TYPE: string }>): string[] {
    return emails ? emails.map(email => email.VALUE) : [];
  }
}