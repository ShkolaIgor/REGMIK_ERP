import nodemailer from "nodemailer";
import { storage } from "./db-storage";
import type { InsertBankPaymentNotification } from "@shared/schema";

/**
 * Сервіс для моніторингу банківських email-повідомлень та автоматичного відмічення платежів
 */
export class BankEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Ініціалізація моніторингу банківських email
   */
  async initializeMonitoring(): Promise<void> {
    try {
      const emailSettings = await storage.getEmailSettings();
      
      if (!emailSettings?.bankMonitoringEnabled || !emailSettings?.bankEmailUser) {
        console.log("🏦 Банківський email моніторинг вимкнено або не налаштовано");
        return;
      }

      // Створюємо SMTP з'єднання для читання email
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        secure: emailSettings.smtpSecure,
        auth: {
          user: emailSettings.bankEmailUser,
          pass: emailSettings.bankEmailPassword,
        },
      });

      // Запускаємо моніторинг кожні 5 хвилин
      if (!this.isMonitoring) {
        this.startMonitoring();
      }

      console.log("🏦 Банківський email моніторинг ініціалізовано");
    } catch (error) {
      console.error("❌ Помилка ініціалізації банківського моніторингу:", error);
    }
  }

  /**
   * Запуск моніторингу email з періодичною перевіркою
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Перевіряємо email кожні 5 хвилин
    this.monitoringInterval = setInterval(async () => {
      try {
        console.log("🏦 Запуск перевірки нових банківських email...");
        await this.checkNewEmails();
      } catch (error) {
        console.error("❌ Помилка під час перевірки банківських email:", error);
        // Логуємо в системні логи
        await storage.createSystemLog({
          level: 'error',
          category: 'bank-email',
          module: 'bank-monitoring',
          message: `Помилка перевірки банківських email: ${error instanceof Error ? error.message : String(error)}`,
          details: { 
            component: 'bank-email-service',
            error: error instanceof Error ? error.toString() : String(error) 
          },
          userId: null
        });
      }
    }, 5 * 60 * 1000); // 5 хвилин

    console.log("🏦 Запущено періодичний моніторинг банківських email (кожні 5 хвилин)");
  }

  /**
   * Зупинка моніторингу
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("🏦 Зупинено моніторинг банківських email");
  }

  /**
   * Перевірка нових email повідомлень від банку
   * (Тут буде IMAP логіка для читання email)
   */
  private async checkNewEmails(): Promise<void> {
    // TODO: Реалізувати IMAP з'єднання для читання email
    // Поки що це заглушка, оскільки IMAP потребує додаткових бібліотек
    console.log("🏦 Перевірка нових банківських email...");
  }

  /**
   * Обробка банківського повідомлення та аналіз тексту
   */
  async processBankEmail(emailContent: {
    messageId: string;
    subject: string;
    fromAddress: string;
    receivedAt: Date;
    textContent: string;
  }): Promise<{ success: boolean; message: string; notification?: any }> {
    try {
      const emailSettings = await storage.getEmailSettings();
      
      console.log("🏦 Перевірка банківської адреси:");
      console.log("  Email settings:", emailSettings);
      console.log("  Bank email address:", emailSettings?.bankEmailAddress);
      console.log("  From address:", emailContent.fromAddress);
      console.log("  Contains check:", emailContent.fromAddress.includes(emailSettings?.bankEmailAddress || ""));
      
      // Перевіряємо чи email від банку
      if (!emailSettings?.bankEmailAddress || !emailContent.fromAddress.includes(emailSettings.bankEmailAddress)) {
        return { success: false, message: "Email не від банківської адреси" };
      }

      // Аналізуємо текст email на предмет банківських операцій
      const paymentInfo = this.analyzeBankEmailContent(emailContent.textContent);
      
      if (!paymentInfo) {
        return { success: false, message: "Не вдалося розпізнати банківську операцію в email" };
      }

      // Створюємо запис про банківське повідомлення
      console.log("🏦 Зберігання операції:", paymentInfo.operationType);
      const notification: InsertBankPaymentNotification = {
        messageId: emailContent.messageId,
        subject: emailContent.subject,
        fromAddress: emailContent.fromAddress,
        receivedAt: emailContent.receivedAt,
        accountNumber: paymentInfo.accountNumber,
        currency: paymentInfo.currency,
        operationType: paymentInfo.operationType,
        amount: paymentInfo.amount.toString(),
        correspondent: paymentInfo.correspondent,
        paymentPurpose: paymentInfo.paymentPurpose,
        invoiceNumber: paymentInfo.invoiceNumber,
        invoiceDate: paymentInfo.invoiceDate,
        vatAmount: paymentInfo.vatAmount?.toString(),
        processed: false,
        rawEmailContent: emailContent.textContent,
      };

      const savedNotification = await storage.createBankPaymentNotification(notification);

      // Логуємо в системні логи про отримання банківського повідомлення
      await storage.createSystemLog({
        level: 'info',
        category: 'bank-email',
        module: 'bank-monitoring',
        message: `Отримано банківське повідомлення: ${paymentInfo.operationType} на суму ${paymentInfo.amount} UAH`,
        details: { 
          component: 'bank-email-service',
          operationType: paymentInfo.operationType,
          amount: paymentInfo.amount,
          correspondent: paymentInfo.correspondent,
          invoiceNumber: paymentInfo.invoiceNumber,
          accountNumber: paymentInfo.accountNumber
        },
        userId: null
      });

      // Якщо це зарахування коштів та знайдено номер рахунку - обробляємо платіж
      console.log("🏦 Перевірка умов для обробки платежу:");
      console.log("  operationType:", paymentInfo.operationType);
      console.log("  invoiceNumber:", paymentInfo.invoiceNumber);
      console.log("  Умова зараховано:", paymentInfo.operationType === "зараховано");
      console.log("  Умова номер рахунку:", !!paymentInfo.invoiceNumber);
      
      if (paymentInfo.operationType === "зараховано" && paymentInfo.invoiceNumber) {
        console.log("🏦 Розпочинаю обробку платежу...");
        
        // Логуємо спробу обробки платежу
        await storage.createSystemLog({
          level: 'info',
          category: 'bank-payment',
          module: 'payment-processing',
          message: `Спроба обробки платежу за рахунком ${paymentInfo.invoiceNumber}`,
          details: { 
            component: 'bank-email-service',
            invoiceNumber: paymentInfo.invoiceNumber,
            amount: paymentInfo.amount,
            correspondent: paymentInfo.correspondent
          },
          userId: null
        });
        
        const paymentResult = await this.processPayment(savedNotification.id, paymentInfo);
        
        if (paymentResult.success) {
          await storage.updateBankPaymentNotification(savedNotification.id, {
            processed: true,
            orderId: paymentResult.orderId,
          });
          
          // Логуємо успішну обробку платежу
          await storage.createSystemLog({
            level: 'info',
            category: 'bank-payment',
            module: 'payment-processing',
            message: `Платіж успішно оброблено: ${paymentInfo.invoiceNumber}`,
            details: { 
              component: 'bank-email-service',
              invoiceNumber: paymentInfo.invoiceNumber,
              orderId: paymentResult.orderId,
              amount: paymentInfo.amount
            },
            userId: null
          });
        } else {
          await storage.updateBankPaymentNotification(savedNotification.id, {
            processingError: paymentResult.message,
          });
          
          // Логуємо помилку обробки платежу
          await storage.createSystemLog({
            level: 'warn',
            category: 'bank-payment',
            module: 'payment-processing',
            message: `Помилка обробки платежу: ${paymentResult.message}`,
            details: { 
              component: 'bank-email-service',
              invoiceNumber: paymentInfo.invoiceNumber,
              error: paymentResult.message,
              amount: paymentInfo.amount
            },
            userId: null
          });
        }

        return {
          success: true,
          message: paymentResult.success ? 
            `Платіж оброблено успішно: ${paymentInfo.invoiceNumber} на суму ${paymentInfo.amount} UAH` :
            `Помилка обробки платежу: ${paymentResult.message}`,
          notification: savedNotification
        };
      }

      return {
        success: true,
        message: "Банківське повідомлення збережено, але не потребує обробки",
        notification: savedNotification
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Помилка обробки банківського email:", error);
      
      // Логуємо критичну помилку
      await storage.createSystemLog({
        level: 'error',
        category: 'bank-email',
        module: 'bank-monitoring',
        message: `Критична помилка обробки банківського email: ${errorMessage}`,
        details: { 
          component: 'bank-email-service',
          error: error instanceof Error ? error.toString() : String(error),
          emailFrom: emailContent.fromAddress,
          emailSubject: emailContent.subject
        },
        userId: null
      });
      
      return { success: false, message: `Помилка обробки: ${errorMessage}` };
    }
  }

  /**
   * Аналіз тексту банківського email для виявлення платіжної інформації
   */
  private analyzeBankEmailContent(emailText: string): {
    accountNumber: string;
    currency: string;
    operationType: string;
    amount: number;
    correspondent: string;
    paymentPurpose: string;
    invoiceNumber?: string;
    invoiceDate?: Date;
    vatAmount?: number;
  } | null {
    try {
      console.log("🏦 Аналіз тексту email:", emailText.substring(0, 200) + "...");
      
      // Шукаємо ключові фрази з прикладу користувача
      const accountMatch = emailText.match(/рух коштів по рахунку:\s*([A-Z0-9]+)/i);
      const currencyMatch = emailText.match(/валюта:\s*([A-Z]{3})/i);
      const operationMatch = emailText.match(/тип операції:\s*([^\n\r]+)/i);
      const amountMatch = emailText.match(/сумма:\s*([\d,\.]+)/i);
      const correspondentMatch = emailText.match(/корреспондент:\s*([^\n\r]+)/i);
      const purposeMatch = emailText.match(/призначення платежу:\s*([^\n\r]+)/i);
      
      console.log("🏦 Результати пошуку регекспів:");
      console.log("  accountMatch:", accountMatch?.[1]);
      console.log("  currencyMatch:", currencyMatch?.[1]);
      console.log("  operationMatch:", operationMatch?.[1]);
      console.log("  amountMatch:", amountMatch?.[1]);
      console.log("  correspondentMatch:", correspondentMatch?.[1]);
      console.log("  purposeMatch:", purposeMatch?.[1]);
      
      // Шукаємо номер рахунку в призначенні платежу (РМ00-XXXXXX або рах.№ XXXXX)
      const invoiceMatch = emailText.match(/(?:РМ00-(\d+)|рах\.?\s*№?\s*(\d+))/i);
      
      // Шукаємо дату рахунку
      const dateMatch = emailText.match(/від\s*(\d{2}\.\d{2}\.\d{4})/i);
      
      // Шукаємо ПДВ
      const vatMatch = emailText.match(/ПДВ.*?(\d+[,\.]\d+)/i);
      
      console.log("🏦 Додаткові регекси:");
      console.log("  invoiceMatch:", invoiceMatch);
      console.log("  dateMatch:", dateMatch);
      console.log("  vatMatch:", vatMatch);

      if (!accountMatch || !operationMatch || !amountMatch || !correspondentMatch) {
        console.log("🏦 Не вдалося розпізнати основні поля банківського повідомлення");
        return null;
      }

      // Конвертуємо суму - підтримуємо і крапки, і коми як десяткові розділювачі
      const amountStr = amountMatch[1].replace(',', '.'); // Українські коми → крапки
      const amount = parseFloat(amountStr);

      const vatAmount = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : undefined;

      let invoiceDate: Date | undefined;
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('.');
        invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Очищаємо operationType від зайвих символів і тексту
      const cleanOperationType = operationMatch[1].trim().split('\n')[0].trim();
      
      console.log("🏦 Очищена operationType:", cleanOperationType);
      console.log("🏦 Перевірка чи це 'зараховано':", cleanOperationType === "зараховано");
      console.log("🏦 Повертаю результат з operationType:", cleanOperationType);

      return {
        accountNumber: accountMatch[1],
        currency: currencyMatch?.[1] || "UAH",
        operationType: cleanOperationType,
        amount: amount,
        correspondent: correspondentMatch[1].trim(),
        paymentPurpose: purposeMatch?.[1]?.trim() || "",
        invoiceNumber: invoiceMatch ? `РМ00-${invoiceMatch[1] || invoiceMatch[2]}` : undefined,
        invoiceDate: invoiceDate,
        vatAmount: vatAmount,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Помилка аналізу банківського email:", errorMessage);
      return null;
    }
  }

  /**
   * Обробка платежу - знаходження замовлення та оновлення його статусу
   */
  private async processPayment(notificationId: number, paymentInfo: any): Promise<{ success: boolean; message: string; orderId?: number }> {
    try {
      let order = null;
      let searchDetails = "";

      // Спочатку пробуємо простий пошук за номером рахунку
      if (paymentInfo.invoiceNumber) {
        order = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
        searchDetails += `Пошук за номером: ${paymentInfo.invoiceNumber}`;
      }

      // Якщо не знайдено, використовуємо розширений пошук
      if (!order) {
        console.log("🔍 Розширений пошук замовлення за додатковими критеріями...");
        
        // Витягуємо частковий номер з призначення платежу
        let partialInvoiceNumber = null;
        if (paymentInfo.paymentPurpose) {
          const partialMatch = paymentInfo.paymentPurpose.match(/№\s*(\d+)/);
          if (partialMatch) {
            partialInvoiceNumber = partialMatch[1];
            console.log(`🔍 Знайдено частковий номер рахунку: ${partialInvoiceNumber}`);
          }
        }

        // Створюємо об'єкт для розширеного пошуку
        const searchCriteria: any = {};
        
        if (partialInvoiceNumber) {
          searchCriteria.partialInvoiceNumber = partialInvoiceNumber;
        }
        
        if (paymentInfo.invoiceDate) {
          searchCriteria.invoiceDate = paymentInfo.invoiceDate;
        }
        
        if (paymentInfo.correspondent) {
          searchCriteria.correspondent = paymentInfo.correspondent;
        }
        
        if (paymentInfo.amount) {
          searchCriteria.amount = paymentInfo.amount;
        }

        const foundOrders = await storage.findOrdersByPaymentInfo(searchCriteria);
        
        if (foundOrders.length > 0) {
          order = foundOrders[0]; // Беремо перше знайдене замовлення
          console.log(`🔍 Знайдено ${foundOrders.length} замовлень за розширеним пошуком`);
          searchDetails += `, розширений пошук: ${JSON.stringify(searchCriteria)}`;
        }
      }

      if (!order) {
        const errorMsg = `Замовлення не знайдено. ${searchDetails}`;
        console.log(`🏦❌ ${errorMsg}`);
        return { success: false, message: errorMsg };
      }

      // Оновлюємо статус оплати замовлення
      const result = await storage.updateOrderPaymentStatus(
        order.id, 
        paymentInfo.amount, 
        "bank_transfer",
        notificationId,
        paymentInfo.accountNumber,
        paymentInfo.correspondent
      );

      console.log(`🏦✅ Платіж оброблено: Замовлення #${order.id} (${order.invoiceNumber}) - ${paymentInfo.amount} UAH`);

      return {
        success: true,
        message: `Замовлення #${order.id} оновлено (${order.invoiceNumber})`,
        orderId: order.id
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Помилка обробки платежу:", errorMessage);
      return { success: false, message: `Помилка обробки платежу: ${errorMessage}` };
    }
  }

  /**
   * Ручна обробка банківського повідомлення (для тестування)
   */
  async manualProcessEmail(emailContent: string): Promise<{ success: boolean; message: string; notification?: any; details?: any }> {
    try {
      const emailSettings = await storage.getEmailSettings();
      
      // Для тестування використовуємо налаштовану банківську адресу або fallback
      const fromAddress = emailSettings?.bankEmailAddress || "noreply@ukrsib.com.ua";
      
      const mockEmail = {
        messageId: `manual-${Date.now()}`,
        subject: "Банківське повідомлення",
        fromAddress: fromAddress,
        receivedAt: new Date(),
        textContent: emailContent,
      };

      console.log("🔍 Тестування банківського email:", emailContent.substring(0, 100) + "...");
      
      const result = await this.processBankEmail(mockEmail);
      
      // Додаємо більше інформації для тестування
      if (result.success) {
        return {
          ...result,
          details: {
            emailLength: emailContent.length,
            fromAddress: fromAddress,
            processedAt: new Date().toISOString()
          }
        };
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Помилка ручної обробки email:", errorMessage);
      return { success: false, message: `Помилка: ${errorMessage}` };
    }
  }

  /**
   * Отримання статистики банківських повідомлень
   */
  async getBankEmailStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    lastWeek: number;
  }> {
    try {
      const allNotifications = await storage.getBankPaymentNotifications();
      const processed = allNotifications.filter(n => n.processed);
      const unprocessed = allNotifications.filter(n => !n.processed);
      
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recentNotifications = allNotifications.filter(n => 
        new Date(n.receivedAt) >= lastWeek
      );

      return {
        total: allNotifications.length,
        processed: processed.length,
        unprocessed: unprocessed.length,
        lastWeek: recentNotifications.length,
      };
    } catch (error) {
      console.error("❌ Помилка отримання статистики:", error);
      return { total: 0, processed: 0, unprocessed: 0, lastWeek: 0 };
    }
  }
}

// Singleton instance
export const bankEmailService = new BankEmailService();