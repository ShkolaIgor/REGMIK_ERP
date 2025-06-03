import { db } from "./db";
import { categories, serialNumbers } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface SerialGenerationOptions {
  productId: number;
  categoryId?: number;
  template?: string;
  useGlobalCounter?: boolean;
}

export class SerialNumberGenerator {
  
  /**
   * Генерує серійний номер для продукту
   */
  async generateSerialNumber(options: SerialGenerationOptions): Promise<string> {
    const { productId, categoryId, template, useGlobalCounter = false } = options;

    // Якщо вказано шаблон, використовуємо його
    if (template) {
      return await this.generateFromTemplate(template, categoryId, useGlobalCounter);
    }

    // Якщо є категорія, перевіряємо її налаштування
    if (categoryId) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, categoryId)
      });

      if (category?.autoGenerateSerials && category.serialTemplate) {
        return await this.generateFromTemplate(
          category.serialTemplate, 
          categoryId, 
          category.useGlobalCounter || false
        );
      }
    }

    // Базова генерація: простий послідовний номер
    return await this.generateSequentialNumber(productId);
  }

  /**
   * Генерує серійний номер за шаблоном
   */
  private async generateFromTemplate(
    template: string, 
    categoryId?: number, 
    useGlobalCounter: boolean = false
  ): Promise<string> {
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
        const counter = useGlobalCounter 
          ? await this.getGlobalCounter()
          : await this.getCategoryCounter(categoryId);
        
        const paddedCounter = counter.toString().padStart(digits, '0');
        result = result.replace(match, paddedCounter);
      }
    }

    return result;
  }

  /**
   * Отримує глобальний лічильник
   */
  private async getGlobalCounter(): Promise<number> {
    try {
      const [counter] = await db.select()
        .from(globalSerialCounters)
        .where(eq(globalSerialCounters.counterType, 'global'))
        .limit(1);

      if (!counter) {
        // Створюємо новий глобальний лічильник
        const [newCounter] = await db.insert(globalSerialCounters)
          .values({
            counterType: 'global',
            currentValue: 1,
          })
          .returning();
        return newCounter.currentValue;
      }

      // Інкрементуємо лічильник
      const newValue = counter.currentValue + 1;
      await db.update(globalSerialCounters)
        .set({ 
          currentValue: newValue,
          updatedAt: new Date()
        })
        .where(eq(globalSerialCounters.id, counter.id));

      return newValue;
    } catch (error) {
      console.error('Error getting global counter:', error);
      // Fallback - використовуємо timestamp
      return Date.now() % 100000;
    }
  }

  /**
   * Отримує лічильник категорії
   */
  private async getCategoryCounter(categoryId?: number): Promise<number> {
    if (!categoryId) {
      return await this.getGlobalCounter();
    }

    try {
      const [category] = await db.select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category) {
        return await this.getGlobalCounter();
      }

      // Інкрементуємо лічильник категорії
      const newValue = (category.serialCounter || 0) + 1;
      await db.update(categories)
        .set({ serialCounter: newValue })
        .where(eq(categories.id, categoryId));

      return newValue;
    } catch (error) {
      console.error('Error getting category counter:', error);
      return await this.getGlobalCounter();
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