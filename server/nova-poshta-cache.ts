import { storage } from './db-storage.js';
import { novaPoshtaApi } from './nova-poshta-api.js';

class NovaPoshtaCache {
  private lastUpdate: Date | null = null;
  
  // Час життя кешу (24 години)
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  async getCities(query?: string): Promise<any[]> {
    console.log(`Пошук міст: "${query}"`);
    
    // Отримуємо міста з бази даних без постійного оновлення кешу
    const cities = await storage.getNovaPoshtaCities(query, 50);
    
    console.log(`Знайдено міст: ${cities.length}`);
    return cities;
  }

  async getWarehouses(cityRef?: string, query?: string): Promise<any[]> {
    // Отримуємо відділення з бази даних без постійного оновлення кешу
    return await storage.getNovaPoshtaWarehouses(cityRef, query, 100);
  }

  async getCitiesCount(): Promise<number> {
    return await storage.getNovaPoshtaCitiesCount();
  }

  async getWarehousesCount(): Promise<number> {
    return await storage.getNovaPoshtaWarehousesCount();
  }

  async getCacheInfo(): Promise<{ cities: number; warehouses: number; lastUpdate: Date | null }> {
    const [citiesCount, warehousesCount] = await Promise.all([
      this.getCitiesCount(),
      this.getWarehousesCount()
    ]);

    return {
      cities: citiesCount,
      warehouses: warehousesCount,
      lastUpdate: this.lastUpdate
    };
  }

  getCacheStats() {
    return {
      citiesCount: 0, // Тепер працюємо тільки з БД
      warehousesCount: 0, // Тепер працюємо тільки з БД
      lastUpdate: this.lastUpdate,
      cacheValid: true // Завжди валідний, бо працюємо з БД
    };
  }

  async clearCache(): Promise<void> {
    // Очищення даних здійснюється в базі даних при оновленні
    this.lastUpdate = null;
    console.log('Кеш Нової Пошти очищено');
  }

  async forceUpdate(): Promise<void> {
    await this.updateData();
  }

  async updateApiKey(apiKey: string): Promise<void> {
    // Оновлюємо API ключ у nova-poshta-api
    novaPoshtaApi.updateApiKey(apiKey);
  }

  async syncData(): Promise<void> {
    // Форсуємо оновлення всіх даних
    await this.updateData();
  }

  private async shouldUpdate(): Promise<boolean> {
    // Перевіряємо чи є дані в базі
    const isEmpty = await storage.isNovaPoshtaDataEmpty();
    if (isEmpty) {
      return true;
    }

    // Перевіряємо час життя кешу
    if (!this.lastUpdate) {
      return true;
    }

    const now = new Date().getTime();
    const lastUpdateTime = this.lastUpdate.getTime();
    return (now - lastUpdateTime) > this.CACHE_TTL;
  }

  private async updateData(): Promise<void> {
    console.log('Оновлення даних Нової Пошти з API...');
    
    try {
      // Завантажуємо дані з API
      console.log('Оновлення міст Нової Пошти...');
      const cities = await novaPoshtaApi.getCities();
      
      console.log('Оновлення відділень Нової Пошти...');
      const warehouses = await novaPoshtaApi.getWarehouses();

      // Синхронізуємо з базою даних - спочатку міста, потім відділення
      await storage.syncNovaPoshtaCities(cities);
      await storage.syncNovaPoshtaWarehouses(warehouses);

      this.lastUpdate = new Date();
      
      const citiesCount = await this.getCitiesCount();
      const warehousesCount = await this.getWarehousesCount();
      
      console.log(`Дані Нової Пошти оновлено: ${citiesCount} міст, ${warehousesCount} відділень`);
    } catch (error) {
      console.error('Помилка оновлення даних Нової Пошти:', error);
      throw error;
    }
  }
}

export const novaPoshtaCache = new NovaPoshtaCache();