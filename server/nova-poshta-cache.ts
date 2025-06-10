interface CachedCity {
  ref: string;
  name: string;
  area: string;
  region?: string;
  lastUpdated: Date;
}

interface CachedWarehouse {
  ref: string;
  cityRef: string;
  description: string;
  descriptionRu?: string;
  shortAddress?: string;
  phone?: string;
  schedule?: string;
  number?: string;
  placeMaxWeightAllowed?: number;
  lastUpdated: Date;
}

class NovaPoshtaCache {
  private cities: Map<string, CachedCity> = new Map();
  private warehouses: Map<string, CachedWarehouse> = new Map();
  private warehousesByCity: Map<string, CachedWarehouse[]> = new Map();
  private lastCitiesUpdate: Date | null = null;
  private lastWarehousesUpdate: Date | null = null;
  
  // Час життя кешу (24 години)
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000;

  async getCities(query?: string): Promise<CachedCity[]> {
    // Перевіряємо чи потрібно оновити кеш
    if (this.shouldUpdateCities()) {
      await this.updateCities();
    }

    const allCities = Array.from(this.cities.values());
    
    if (!query || query.length < 2) {
      return allCities.slice(0, 50); // Обмежуємо кількість для продуктивності
    }

    const lowerQuery = query.toLowerCase();
    const filteredCities = allCities.filter(city => 
      city.name.toLowerCase().includes(lowerQuery) ||
      city.area.toLowerCase().includes(lowerQuery)
    );

    // Сортуємо результати: точні співпадіння спочатку, потім за алфавітом
    const sortedCities = filteredCities.sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      
      // Точне співпадіння з початком назви має найвищий пріоритет
      const aStartsWith = aNameLower.startsWith(lowerQuery);
      const bStartsWith = bNameLower.startsWith(lowerQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Серед тих, що починаються з запиту, сортуємо за довжиною (коротші зверху)
      if (aStartsWith && bStartsWith) {
        return a.name.length - b.name.length;
      }
      
      // Інші сортуємо за алфавітом
      return a.name.localeCompare(b.name, 'uk');
    });

    return sortedCities.slice(0, 500);
  }

  async getWarehouses(cityRef: string): Promise<CachedWarehouse[]> {
    if (this.shouldUpdateWarehouses()) {
      await this.updateWarehouses();
    }

    return this.warehousesByCity.get(cityRef) || [];
  }

  private shouldUpdateCities(): boolean {
    if (!this.lastCitiesUpdate) return true;
    return Date.now() - this.lastCitiesUpdate.getTime() > this.CACHE_TTL;
  }

  private shouldUpdateWarehouses(): boolean {
    if (!this.lastWarehousesUpdate) return true;
    return Date.now() - this.lastWarehousesUpdate.getTime() > this.CACHE_TTL;
  }

  private async updateCities(): Promise<void> {
    try {
      console.log('Оновлення кешу міст Нової Пошти...');
      
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: process.env.NOVA_POSHTA_API_KEY,
          modelName: 'Address',
          calledMethod: 'getCities',
          methodProperties: {}
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        this.cities.clear();
        
        for (const city of data.data) {
          const cachedCity: CachedCity = {
            ref: city.Ref,
            name: city.Description,
            area: city.AreaDescription,
            region: city.RegionDescription,
            lastUpdated: new Date()
          };
          
          this.cities.set(city.Ref, cachedCity);
        }
        
        this.lastCitiesUpdate = new Date();
        console.log(`Кеш міст оновлено: ${this.cities.size} міст`);
      }
    } catch (error) {
      console.error('Помилка оновлення кешу міст:', error);
    }
  }

  private async updateWarehouses(): Promise<void> {
    try {
      console.log('Оновлення кешу відділень Нової Пошти...');
      
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: process.env.NOVA_POSHTA_API_KEY,
          modelName: 'Address',
          calledMethod: 'getWarehouses',
          methodProperties: {}
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        this.warehouses.clear();
        this.warehousesByCity.clear();
        
        for (const warehouse of data.data) {
          const cachedWarehouse: CachedWarehouse = {
            ref: warehouse.Ref,
            cityRef: warehouse.CityRef,
            description: warehouse.Description,
            descriptionRu: warehouse.DescriptionRu,
            shortAddress: warehouse.ShortAddress,
            phone: warehouse.Phone,
            schedule: warehouse.Schedule,
            number: warehouse.Number,
            placeMaxWeightAllowed: warehouse.PlaceMaxWeightAllowed,
            lastUpdated: new Date()
          };
          
          this.warehouses.set(warehouse.Ref, cachedWarehouse);
          
          // Групуємо за містами
          if (!this.warehousesByCity.has(warehouse.CityRef)) {
            this.warehousesByCity.set(warehouse.CityRef, []);
          }
          this.warehousesByCity.get(warehouse.CityRef)!.push(cachedWarehouse);
        }
        
        this.lastWarehousesUpdate = new Date();
        console.log(`Кеш відділень оновлено: ${this.warehouses.size} відділень`);
      }
    } catch (error) {
      console.error('Помилка оновлення кешу відділень:', error);
    }
  }

  // Примусове оновлення кешу
  async forceUpdate(): Promise<void> {
    await Promise.all([
      this.updateCities(),
      this.updateWarehouses()
    ]);
  }

  // Отримання статистики кешу
  getCacheStats() {
    return {
      citiesCount: this.cities.size,
      warehousesCount: this.warehouses.size,
      lastCitiesUpdate: this.lastCitiesUpdate,
      lastWarehousesUpdate: this.lastWarehousesUpdate,
      citiesCacheValid: !this.shouldUpdateCities(),
      warehousesCacheValid: !this.shouldUpdateWarehouses()
    };
  }

  async updateApiKey(apiKey: string) {
    // Оновлюємо API ключ у nova-poshta-api
    const { novaPoshtaApi } = await import('./nova-poshta-api');
    novaPoshtaApi.updateApiKey(apiKey);
  }

  async syncData() {
    // Форсуємо оновлення всіх даних
    await this.updateCities();
    await this.updateWarehouses();
  }

  getCitiesCount(): number {
    return this.cities.size;
  }

  getWarehousesCount(): number {
    return this.warehouses.size;
  }

  async initialize(): Promise<void> {
    try {
      console.log("Оновлення кешу міст Нової Пошти...");
      await this.updateCities();
      console.log(`Кеш міст оновлено: ${this.getCitiesCount()} міст`);
      
      console.log("Оновлення кешу відділень Нової Пошти...");
      await this.updateWarehouses();
      console.log(`Кеш відділень оновлено: ${this.getWarehousesCount()} відділень`);
      
      console.log(`Кеш Нової Пошти готовий: ${this.getCitiesCount()} міст, ${this.getWarehousesCount()} відділень`);
    } catch (error) {
      console.error("Помилка ініціалізації кешу Нової Пошти:", error);
      // Не перериваємо роботу сервера через помилки API Нової Пошти
    }
  }
}

export const novaPoshtaCache = new NovaPoshtaCache();