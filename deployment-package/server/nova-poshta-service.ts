import { DatabaseStorage } from "./db-storage";
import { novaPoshtaCache } from "./nova-poshta-cache";

interface NovaPoshtaUpdateSettings {
  autoUpdateEnabled: boolean;
  updateTime: string; // HH:MM format
  updateDays: number[]; // 0-6 (неділя-субота)
  lastUpdate?: Date;
}

class NovaPoshtaService {
  private storage: DatabaseStorage;
  private updateTimeoutId?: NodeJS.Timeout;

  constructor() {
    this.storage = new DatabaseStorage();
  }

  async updateData(): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      console.log("Запуск оновлення даних Nova Poshta...");
      
      await novaPoshtaCache.forceUpdate();
      const stats = await novaPoshtaCache.getCacheInfo();
      
      // Зберігаємо час останнього оновлення
      await this.saveLastUpdateTime();
      
      const message = `Оновлено дані Nova Poshta: ${stats.cities} міст, ${stats.warehouses} відділень`;
      console.log(message);
      
      return { 
        success: true, 
        message,
        stats
      };
      
    } catch (error) {
      const message = `Помилка оновлення даних Nova Poshta: ${error}`;
      console.error(message);
      return { 
        success: false, 
        message
      };
    }
  }

  async getUpdateSettings(): Promise<NovaPoshtaUpdateSettings> {
    // Поки що використовуємо налаштування за замовчуванням
    // В майбутньому можна додати окрему таблицю для налаштувань Nova Poshta
    return {
      autoUpdateEnabled: true,
      updateTime: "06:00", // Оновлення рано вранці
      updateDays: [1, 2, 3, 4, 5], // Понеділок-п'ятниця
      lastUpdate: await this.getLastUpdateTime()
    };
  }

  async saveUpdateSettings(settings: Partial<NovaPoshtaUpdateSettings>): Promise<void> {
    // TODO: Реалізувати збереження налаштувань в базу даних
    console.log("Nova Poshta update settings saved:", settings);
  }

  private async getLastUpdateTime(): Promise<Date | undefined> {
    // TODO: Отримувати з бази даних
    return undefined;
  }

  private async saveLastUpdateTime(): Promise<void> {
    // TODO: Зберігати в базу даних
    console.log("Nova Poshta last update time saved:", new Date());
  }

  async initializeAutoUpdate(): Promise<void> {
    const settings = await this.getUpdateSettings();
    
    if (!settings.autoUpdateEnabled) {
      console.log("Автоматичне оновлення Nova Poshta вимкнено");
      return;
    }

    const updateTime = settings.updateTime || "06:00";
    const [hours, minutes] = updateTime.split(':').map(Number);
    const updateDays = settings.updateDays || [1, 2, 3, 4, 5];
    
    console.log(`Налаштовано автоматичне оновлення Nova Poshta: ${updateTime} у дні ${updateDays.join(', ')}`);
    
    // Функція для запуску оновлення
    const runUpdate = async () => {
      console.log("Запуск автоматичного оновлення Nova Poshta");
      await this.updateData();
    };

    // Розрахунок часу до наступного оновлення
    const scheduleNextUpdate = () => {
      const now = new Date();
      let nextUpdate = new Date();
      
      // Знаходимо наступний день для оновлення
      let daysToAdd = 0;
      let currentDay = now.getDay();
      
      // Встановлюємо час оновлення на сьогодні
      nextUpdate.setHours(hours, minutes, 0, 0);
      
      // Якщо час уже минув сьогодні або сьогодні не день оновлення
      if (nextUpdate <= now || !updateDays.includes(currentDay)) {
        // Шукаємо наступний день оновлення
        for (let i = 1; i <= 7; i++) {
          const dayToCheck = (currentDay + i) % 7;
          if (updateDays.includes(dayToCheck)) {
            daysToAdd = i;
            break;
          }
        }
        nextUpdate.setDate(nextUpdate.getDate() + daysToAdd);
        nextUpdate.setHours(hours, minutes, 0, 0);
      }
      
      const timeUntilUpdate = nextUpdate.getTime() - now.getTime();
      
      // Очищаємо попередній таймер
      if (this.updateTimeoutId) {
        clearTimeout(this.updateTimeoutId);
      }
      
      this.updateTimeoutId = setTimeout(async () => {
        await runUpdate();
        scheduleNextUpdate(); // Планування наступного оновлення
      }, timeUntilUpdate);
      
      console.log(`Наступне оновлення Nova Poshta: ${nextUpdate.toLocaleString('uk-UA')}`);
    };

    scheduleNextUpdate();
  }

  // Ручне оновлення
  async manualUpdate(): Promise<{ success: boolean; message: string; stats?: any }> {
    return await this.updateData();
  }

  // Отримання статистики кешу
  async getCacheStats(): Promise<any> {
    return await novaPoshtaCache.getCacheInfo();
  }

  // Перевірка чи потрібно оновлення
  async needsUpdate(): Promise<boolean> {
    const settings = await this.getUpdateSettings();
    if (!settings.lastUpdate) return true;
    
    const now = new Date();
    const lastUpdate = new Date(settings.lastUpdate);
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Оновлюємо якщо минуло більше 24 годин
    return hoursSinceUpdate > 24;
  }
}

export const novaPoshtaService = new NovaPoshtaService();