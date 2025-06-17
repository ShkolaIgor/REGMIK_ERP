import { storage } from "./db-storage";
import type { InsertCurrencyRate } from "@shared/schema";

// Інтерфейс для відповіді НБУ
interface NBUCurrencyResponse {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
}

export class CurrencyService {
  private readonly nbuBaseUrl = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange";

  // Отримання курсу валюти з НБУ на певну дату
  async fetchCurrencyRateFromNBU(currencyCode: string, date?: Date): Promise<NBUCurrencyResponse | null> {
    try {
      let url = `${this.nbuBaseUrl}?valcode=${currencyCode}&json`;
      
      if (date) {
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        url += `&date=${dateStr}`;
      }

      console.log(`Запит курсу ${currencyCode} з НБУ:`, url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Помилка запиту до НБУ: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`НБУ не повернуло дані для валюти ${currencyCode}`);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error(`Помилка отримання курсу ${currencyCode}:`, error);
      return null;
    }
  }

  // Отримання курсів всіх включених валют
  async fetchAllEnabledCurrencyRates(date?: Date): Promise<InsertCurrencyRate[]> {
    const settings = await storage.getCurrencyUpdateSettings();
    const enabledCurrencies = settings?.enabledCurrencies || ["USD", "EUR"];
    
    const rates: InsertCurrencyRate[] = [];
    
    for (const currencyCode of enabledCurrencies) {
      const nbuData = await this.fetchCurrencyRateFromNBU(currencyCode, date);
      
      if (nbuData) {
        rates.push({
          currencyCode: nbuData.cc,
          rate: nbuData.rate.toString(),
          exchangeDate: new Date(nbuData.exchangedate.split('.').reverse().join('-')),
          txt: nbuData.txt,
          cc: nbuData.cc,
          r030: nbuData.r030,
        });
      }
    }
    
    return rates;
  }

  // Оновлення курсів на поточну дату
  async updateCurrentRates(): Promise<{ success: boolean; message: string; updatedCount: number }> {
    try {
      console.log("Починаємо оновлення курсів валют...");
      
      const rates = await this.fetchAllEnabledCurrencyRates();
      
      if (rates.length === 0) {
        const message = "Не вдалося отримати курси валют з НБУ";
        await storage.updateCurrencyUpdateStatus("error", message);
        return { success: false, message, updatedCount: 0 };
      }

      const savedRates = await storage.saveCurrencyRates(rates);
      
      await storage.updateCurrencyUpdateStatus("success");
      
      const message = `Успішно оновлено курси для ${savedRates.length} валют`;
      console.log(message);
      
      return { success: true, message, updatedCount: savedRates.length };
      
    } catch (error) {
      const message = `Помилка оновлення курсів: ${error}`;
      console.error(message);
      await storage.updateCurrencyUpdateStatus("error", message);
      return { success: false, message, updatedCount: 0 };
    }
  }

  // Оновлення курсів за період
  async updateRatesForPeriod(startDate: Date, endDate: Date): Promise<{ 
    success: boolean; 
    message: string; 
    updatedDates: string[];
    totalUpdated: number;
  }> {
    try {
      console.log(`Починаємо оновлення курсів за період ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
      
      const updatedDates: string[] = [];
      let totalUpdated = 0;
      
      // Проходимо по кожному дню в періоді
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Пропускаємо вихідні (НБУ не публікує курси)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // не неділя і не субота
          const rates = await this.fetchAllEnabledCurrencyRates(currentDate);
          
          if (rates.length > 0) {
            await storage.saveCurrencyRates(rates);
            updatedDates.push(currentDate.toISOString().split('T')[0]);
            totalUpdated += rates.length;
            
            // Пауза між запитами щоб не навантажувати API
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Переходимо до наступного дня
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const message = `Оновлено курси за ${updatedDates.length} днів, всього ${totalUpdated} записів`;
      console.log(message);
      
      return { 
        success: true, 
        message, 
        updatedDates,
        totalUpdated 
      };
      
    } catch (error) {
      const message = `Помилка оновлення курсів за період: ${error}`;
      console.error(message);
      return { 
        success: false, 
        message, 
        updatedDates: [],
        totalUpdated: 0 
      };
    }
  }

  // Ініціалізація автоматичного оновлення
  async initializeAutoUpdate(): Promise<void> {
    const settings = await storage.getCurrencyUpdateSettings();
    
    if (!settings?.autoUpdateEnabled) {
      console.log("Автоматичне оновлення курсів вимкнено");
      return;
    }

    const updateTime = settings.updateTime || "09:00";
    const [hours, minutes] = updateTime.split(':').map(Number);
    
    console.log(`Налаштовано автоматичне оновлення курсів щодня о ${updateTime}`);
    
    // Функція для запуску оновлення
    const runUpdate = async () => {
      console.log("Запуск автоматичного оновлення курсів");
      await this.updateCurrentRates();
    };

    // Розрахунок часу до наступного оновлення
    const scheduleNextUpdate = () => {
      const now = new Date();
      const updateDateTime = new Date();
      updateDateTime.setHours(hours, minutes, 0, 0);
      
      // Якщо час уже минув сьогодні, планується на завтра
      if (updateDateTime <= now) {
        updateDateTime.setDate(updateDateTime.getDate() + 1);
      }
      
      const timeUntilUpdate = updateDateTime.getTime() - now.getTime();
      
      setTimeout(async () => {
        await runUpdate();
        scheduleNextUpdate(); // Планування наступного оновлення
      }, timeUntilUpdate);
      
      console.log(`Наступне оновлення курсів: ${updateDateTime.toLocaleString('uk-UA')}`);
    };

    scheduleNextUpdate();
  }

  // Отримання курсу конкретної валюти на дату
  async getCurrencyRate(currencyCode: string, date?: Date): Promise<number | null> {
    const searchDate = date || new Date();
    
    // Спочатку шукаємо в базі
    const rates = await storage.getCurrencyRatesByDate(searchDate);
    const rate = rates.find(r => r.currencyCode === currencyCode);
    
    if (rate) {
      return parseFloat(rate.rate);
    }
    
    // Якщо немає в базі, спробуємо отримати з НБУ
    const nbuData = await this.fetchCurrencyRateFromNBU(currencyCode, searchDate);
    if (nbuData) {
      // Зберігаємо в базу для майбутнього використання
      await storage.saveCurrencyRates([{
        currencyCode: nbuData.cc,
        rate: nbuData.rate.toString(),
        exchangeDate: new Date(nbuData.exchangedate.split('.').reverse().join('-')),
        txt: nbuData.txt,
        cc: nbuData.cc,
        r030: nbuData.r030,
      }]);
      
      return nbuData.rate;
    }
    
    return null;
  }
}

export const currencyService = new CurrencyService();