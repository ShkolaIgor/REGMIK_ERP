import { DatabaseStorage } from "./db-storage";
import { novaPoshtaCache } from "./nova-poshta-cache";
import * as cron from "node-cron";

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
    console.log("Ініціалізація автоматичного оновлення Nova Poshta...");
    
    // Отримуємо налаштування з перевізників Nova Poshta
    const novaPoshtaCarriers = await this.storage.getCarriers();
    const novaPoshtaCarrier = novaPoshtaCarriers.find(c => 
      c.name.toLowerCase().includes('nova') || 
      c.name.toLowerCase().includes('нова') ||
      (c.alternativeNames && c.alternativeNames.some((name: string) => 
        name.toLowerCase().includes('nova') || name.toLowerCase().includes('нова')
      ))
    );
    
    if (!novaPoshtaCarrier || !novaPoshtaCarrier.autoUpdateEnabled) {
      console.log("Автоматичне оновлення Nova Poshta вимкнено або перевізник не знайдений");
      return;
    }

    // Парсимо налаштування розкладу з перевіркою null
    const updateTime = novaPoshtaCarrier.updateTime || "06:00";
    const updateDaysStr = novaPoshtaCarrier.updateDays || "1,2,3,4,5";
    
    const [hours, minutes] = updateTime.split(':').map(Number);
    const updateDays = updateDaysStr.split(',').map(d => parseInt(d.trim()));
    const cronDays = updateDays.map(d => d === 7 ? 0 : d); // Конвертуємо неділю з 7 на 0

    // Створюємо cron pattern
    const cronPattern = `${minutes} ${hours} * * ${cronDays.join(',')}`;
    
    console.log(`Налаштовано автоматичне оновлення Nova Poshta: ${cronPattern}`);
    
    // Створюємо завдання
    const job = cron.schedule(cronPattern, async () => {
      console.log('Планове оновлення Nova Poshta...');
      try {
        const result = await this.updateData();
        console.log('Планове оновлення Nova Poshta завершено:', result.message);
      } catch (error) {
        console.error('Помилка планового оновлення Nova Poshta:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Kyiv"
    });

    console.log("Автоматичне оновлення Nova Poshta ініціалізовано");
  }

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