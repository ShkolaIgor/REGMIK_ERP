import { db } from "./db";
import { serialNumbers, products, categories, serialNumberSettings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface SerialGenerationOptions {
  productId: number;
  categoryId?: number;
  template?: string;
  useGlobalCounter?: boolean;
}

// Налаштування шаблонів для різних категорій (можна винести в конфіг)
const CATEGORY_TEMPLATES = {
  1: "ELE-{YYYY}-{####}", // Електроніка
  2: "MEC-{YYYY}-{####}", // Механіка
  3: "CHE-{YYYY}-{####}", // Хімія
  // Додавайте інші категорії за потребою
};

export class SerialNumberGenerator {
  
  /**
   * Генерує серійний номер для продукту
   */
  async generateSerialNumber(options: SerialGenerationOptions): Promise<string> {
    const { productId, categoryId, template, useGlobalCounter = false } = options;

    // Якщо вказано шаблон, використовуємо його
    if (template) {
      return await this.generateFromTemplate(template, categoryId || 0);
    }

    // Якщо є категорія, перевіряємо чи є для неї шаблон
    if (categoryId && CATEGORY_TEMPLATES[categoryId as keyof typeof CATEGORY_TEMPLATES]) {
      return await this.generateFromTemplate(
        CATEGORY_TEMPLATES[categoryId as keyof typeof CATEGORY_TEMPLATES], 
        categoryId
      );
    }

    // Базова генерація: простий послідовний номер
    return await this.generateSequentialNumber(productId);
  }

  /**
   * Генерує серійний номер за шаблоном
   */
  private async generateFromTemplate(template: string, categoryId: number): Promise<string> {
    const now = new Date();
    let result = template;

    // Заміна змінних дати
    result = result.replace(/{YYYY}/g, now.getFullYear().toString());
    result = result.replace(/{YY}/g, now.getFullYear().toString().slice(-2));
    result = result.replace(/{MM}/g, (now.getMonth() + 1).toString().padStart(2, '0'));
    result = result.replace(/{DD}/g, now.getDate().toString().padStart(2, '0'));
    result = result.replace(/{HH}/g, now.getHours().toString().padStart(2, '0'));
    result = result.replace(/{mm}/g, now.getMinutes().toString().padStart(2, '0'));

    // Заміна лічильників
    const counterPattern = /{#+}/g;
    const matches = result.match(counterPattern);
    
    if (matches) {
      for (const match of matches) {
        const digits = match.length - 2; // Віднімаємо { та }
        const counter = await this.getNextCounter(categoryId);
        
        const paddedCounter = counter.toString().padStart(digits, '0');
        result = result.replace(match, paddedCounter);
      }
    }

    return result;
  }

  /**
   * Отримує наступний лічильник на основі існуючих серійних номерів
   */
  private async getNextCounter(categoryId?: number): Promise<number> {
    try {
      // Підраховуємо кількість існуючих серійних номерів
      const existingSerials = await db.select()
        .from(serialNumbers)
        .orderBy(desc(serialNumbers.id))
        .limit(1);

      return existingSerials.length + 1;
    } catch (error) {
      console.error('Error getting next counter:', error);
      return Date.now() % 10000; // Fallback
    }
  }

  /**
   * Генерує простий послідовний номер
   */
  private async generateSequentialNumber(productId: number): Promise<string> {
    try {
      // Знаходимо останній серійний номер для цього продукту
      const lastSerial = await db.select()
        .from(serialNumbers)
        .where(eq(serialNumbers.productId, productId))
        .orderBy(desc(serialNumbers.id))
        .limit(1);

      let nextNumber = 1;
      
      if (lastSerial.length > 0) {
        const lastNumber = lastSerial[0].serialNumber;
        // Спробуємо витягти число з кінця серійного номера
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const today = new Date();
      const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      
      return `SN-${datePrefix}-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating sequential number:', error);
      // Fallback
      const timestamp = Date.now();
      return `SN-${timestamp}`;
    }
  }

  /**
   * Перевіряє унікальність серійного номера
   */
  async isSerialNumberUnique(serialNumber: string): Promise<boolean> {
    try {
      const existing = await db.select()
        .from(serialNumbers)
        .where(eq(serialNumbers.serialNumber, serialNumber))
        .limit(1);

      return existing.length === 0;
    } catch (error) {
      console.error('Error checking serial number uniqueness:', error);
      return false;
    }
  }

  /**
   * Генерує унікальний серійний номер (з повторними спробами)
   */
  async generateUniqueSerialNumber(options: SerialGenerationOptions): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const serialNumber = await this.generateSerialNumber(options);
      
      if (await this.isSerialNumberUnique(serialNumber)) {
        return serialNumber;
      }
      
      attempts++;
      
      // Якщо номер не унікальний, додаємо суфікс
      if (attempts === maxAttempts) {
        const timestamp = Date.now().toString().slice(-4);
        return `${serialNumber}-${timestamp}`;
      }
    }

    // Fallback
    const timestamp = Date.now();
    return `SN-${timestamp}`;
  }
}

export const serialNumberGenerator = new SerialNumberGenerator();