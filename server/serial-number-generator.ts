import { db } from "./db";
import { serialNumbers, products, categories, serialNumberSettings } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

interface SerialGenerationOptions {
  productId: number;
  categoryId?: number;
  template?: string;
  useGlobalCounter?: boolean;
}

export class SerialNumberGenerator {
  
  /**
   * Генерує серійний номер для продукту на основі налаштувань категорії
   */
  async generateSerialNumber(options: SerialGenerationOptions): Promise<string> {
    const { productId, categoryId, template, useGlobalCounter = false } = options;

    // Спочатку отримуємо категорію продукту
    let actualCategoryId = categoryId;
    if (!actualCategoryId) {
      const product = await db.select({ categoryId: products.categoryId })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (product.length > 0 && product[0].categoryId) {
        actualCategoryId = product[0].categoryId;
      }
    }

    // Отримуємо налаштування серійних номерів для категорії
    if (actualCategoryId) {
      const category = await db.select()
        .from(categories)
        .where(eq(categories.id, actualCategoryId))
        .limit(1);

      if (category.length > 0 && category[0].hasSerialNumbers) {
        const categorySettings = category[0];
        
        // Якщо є шаблон для категорії, використовуємо його
        if (categorySettings.serialNumberTemplate) {
          return await this.generateFromTemplate(
            categorySettings.serialNumberTemplate, 
            actualCategoryId,
            categorySettings.serialNumberPrefix
          );
        }
      }
    }

    // Якщо вказано шаблон, використовуємо його
    if (template) {
      return await this.generateFromTemplate(template, actualCategoryId || 0);
    }

    // Базова генерація: простий послідовний номер для категорії
    return await this.generateSequentialNumber(productId, actualCategoryId);
  }

  /**
   * Генерує серійний номер за шаблоном з префіксом
   */
  private async generateFromTemplate(template: string, categoryId: number, prefix?: string | null): Promise<string> {
    const now = new Date();
    let result = template;

    // Додаємо префікс якщо він є
    if (prefix) {
      result = `${prefix}-${result}`;
    }

    // Заміна змінних дати
    result = result.replace(/{YYYY}/g, now.getFullYear().toString());
    result = result.replace(/{YY}/g, now.getFullYear().toString().slice(-2));
    result = result.replace(/{MM}/g, (now.getMonth() + 1).toString().padStart(2, '0'));
    result = result.replace(/{DD}/g, now.getDate().toString().padStart(2, '0'));
    result = result.replace(/{HH}/g, now.getHours().toString().padStart(2, '0'));
    result = result.replace(/{mm}/g, now.getMinutes().toString().padStart(2, '0'));

    // Заміна лічільників
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
   * Отримує наступний лічільник на основі існуючих серійних номерів для категорії
   */
  private async getNextCounter(categoryId?: number): Promise<number> {
    try {
      if (categoryId) {
        // Підраховуємо кількість існуючих серійних номерів для категорії
        const existingSerials = await db.select()
          .from(serialNumbers)
          .where(eq(serialNumbers.categoryId, categoryId))
          .orderBy(desc(serialNumbers.id))
          .limit(1);

        return existingSerials.length + 1;
      } else {
        // Глобальний лічільник
        const existingSerials = await db.select()
          .from(serialNumbers)
          .orderBy(desc(serialNumbers.id))
          .limit(1);

        return existingSerials.length + 1;
      }
    } catch (error) {
      console.error('Error getting next counter:', error);
      return Date.now() % 10000; // Fallback
    }
  }

  /**
   * Генерує простий послідовний номер для категорії
   */
  private async generateSequentialNumber(productId: number, categoryId?: number): Promise<string> {
    try {
      let nextNumber = 1;
      
      if (categoryId) {
        // Знаходимо останній серійний номер для цієї категорії
        const lastSerial = await db.select()
          .from(serialNumbers)
          .where(eq(serialNumbers.categoryId, categoryId))
          .orderBy(desc(serialNumbers.id))
          .limit(1);

        if (lastSerial.length > 0) {
          const lastNumber = lastSerial[0].serialNumber;
          // Спробуємо витягти число з кінця серійного номера
          const match = lastNumber.match(/(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      } else {
        // Знаходимо останній серійний номер для цього продукту
        const lastSerial = await db.select()
          .from(serialNumbers)
          .where(eq(serialNumbers.productId, productId))
          .orderBy(desc(serialNumbers.id))
          .limit(1);

        if (lastSerial.length > 0) {
          const lastNumber = lastSerial[0].serialNumber;
          // Спробуємо витягти число з кінця серійного номера
          const match = lastNumber.match(/(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      }

      const today = new Date();
      const datePrefix = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      
      // Включаємо ID категорії в серійний номер якщо є
      const categoryPrefix = categoryId ? `C${categoryId}` : 'P';
      
      return `SN-${categoryPrefix}-${datePrefix}-${nextNumber.toString().padStart(4, '0')}`;
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

  /**
   * Створює серійний номер в базі даних
   */
  async createSerialNumber(
    productId: number, 
    serialNumber: string, 
    warehouseId?: number,
    categoryId?: number
  ): Promise<void> {
    try {
      // Якщо не передано categoryId, отримуємо його з продукту
      let actualCategoryId = categoryId;
      if (!actualCategoryId) {
        const product = await db.select({ categoryId: products.categoryId })
          .from(products)
          .where(eq(products.id, productId))
          .limit(1);
        
        if (product.length > 0 && product[0].categoryId) {
          actualCategoryId = product[0].categoryId;
        }
      }

      await db.insert(serialNumbers).values({
        productId,
        categoryId: actualCategoryId,
        serialNumber,
        warehouseId,
        status: 'available'
      });
    } catch (error) {
      console.error('Error creating serial number:', error);
      throw error;
    }
  }

  /**
   * Отримує серійні номери для категорії
   */
  async getSerialNumbersForCategory(categoryId: number): Promise<any[]> {
    try {
      return await db.select()
        .from(serialNumbers)
        .where(eq(serialNumbers.categoryId, categoryId));
    } catch (error) {
      console.error('Error getting serial numbers for category:', error);
      return [];
    }
  }

  /**
   * Перевіряє чи використовує категорія серійні номери
   */
  async categoryUsesSerialNumbers(categoryId: number): Promise<boolean> {
    try {
      const category = await db.select({ hasSerialNumbers: categories.hasSerialNumbers })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      return category.length > 0 && category[0].hasSerialNumbers === true;
    } catch (error) {
      console.error('Error checking if category uses serial numbers:', error);
      return false;
    }
  }
}

export const serialNumberGenerator = new SerialNumberGenerator();