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
      this.transporter = nodemailer.createTransporter({
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
        await this.checkNewEmails();
      } catch (error) {
        console.error("❌ Помилка під час перевірки банківських email:", error);
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

      // Якщо це зарахування коштів та знайдено номер рахунку - обробляємо платіж
      if (paymentInfo.operationType === "зараховано" && paymentInfo.invoiceNumber) {
        const paymentResult = await this.processPayment(savedNotification.id, paymentInfo);
        
        if (paymentResult.success) {
          await storage.updateBankPaymentNotification(savedNotification.id, {
            processed: true,
            orderId: paymentResult.orderId,
          });
        } else {
          await storage.updateBankPaymentNotification(savedNotification.id, {
            processingError: paymentResult.message,
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
      console.error("❌ Помилка обробки банківського email:", error);
      return { success: false, message: `Помилка обробки: ${error.message}` };
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
      // Шукаємо ключові фрази з прикладу користувача
      const accountMatch = emailText.match(/рух коштів по рахунку:\s*([A-Z0-9]+)/i);
      const currencyMatch = emailText.match(/валюта:\s*([A-Z]{3})/i);
      const operationMatch = emailText.match(/тип операції:\s*([^,]+)/i);
      const amountMatch = emailText.match(/сумма:\s*([\d,\.]+)/i);
      const correspondentMatch = emailText.match(/корреспондент:\s*([^,]+)/i);
      const purposeMatch = emailText.match(/призначення платежу:\s*([^\.]+)/i);
      
      // Шукаємо номер рахунку в призначенні платежу (РМ00-XXXXXX)
      const invoiceMatch = emailText.match(/РМ00-(\d+)/i);
      
      // Шукаємо дату рахунку
      const dateMatch = emailText.match(/від\s*(\d{2}\.\d{2}\.\d{4})/i);
      
      // Шукаємо ПДВ
      const vatMatch = emailText.match(/ПДВ.*?(\d+[,\.]\d+)/i);

      if (!accountMatch || !operationMatch || !amountMatch || !correspondentMatch) {
        console.log("🏦 Не вдалося розпізнати основні поля банківського повідомлення");
        return null;
      }

      // Конвертуємо суму з українського формату (коми як десяткові розділювачі)
      const amountStr = amountMatch[1].replace(',', '.');
      const amount = parseFloat(amountStr);

      const vatAmount = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : undefined;

      let invoiceDate: Date | undefined;
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('.');
        invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      return {
        accountNumber: accountMatch[1],
        currency: currencyMatch?.[1] || "UAH",
        operationType: operationMatch[1].trim(),
        amount: amount,
        correspondent: correspondentMatch[1].trim(),
        paymentPurpose: purposeMatch?.[1]?.trim() || "",
        invoiceNumber: invoiceMatch ? `РМ00-${invoiceMatch[1]}` : undefined,
        invoiceDate: invoiceDate,
        vatAmount: vatAmount,
      };

    } catch (error) {
      console.error("❌ Помилка аналізу банківського email:", error);
      return null;
    }
  }

  /**
   * Обробка платежу - знаходження замовлення та оновлення його статусу
   */
  private async processPayment(notificationId: number, paymentInfo: any): Promise<{ success: boolean; message: string; orderId?: number }> {
    try {
      if (!paymentInfo.invoiceNumber) {
        return { success: false, message: "Номер рахунку не знайдено в повідомленні" };
      }

      // Шукаємо замовлення за номером рахунку
      const order = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
      
      if (!order) {
        return { success: false, message: `Замовлення з номером рахунку ${paymentInfo.invoiceNumber} не знайдено` };
      }

      // Оновлюємо статус оплати замовлення
      const result = await storage.updateOrderPaymentStatus(
        order.id, 
        paymentInfo.amount, 
        "bank_transfer"
      );

      console.log(`🏦✅ Платіж оброблено: Замовлення #${order.id} (${paymentInfo.invoiceNumber}) - ${paymentInfo.amount} UAH`);

      return {
        success: true,
        message: `Замовлення #${order.id} оновлено`,
        orderId: order.id
      };

    } catch (error) {
      console.error("❌ Помилка обробки платежу:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Ручна обробка банківського повідомлення (для тестування)
   */
  async manualProcessEmail(emailContent: string): Promise<{ success: boolean; message: string; details?: any }> {
    const mockEmail = {
      messageId: `manual-${Date.now()}`,
      subject: "Банківське повідомлення",
      fromAddress: "noreply@ukrsib.com.ua",
      receivedAt: new Date(),
      textContent: emailContent,
    };

    return await this.processBankEmail(mockEmail);
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