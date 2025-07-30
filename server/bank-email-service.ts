import nodemailer from "nodemailer";
import Imap from "imap";
import { storage } from "./db-storage";
import type { InsertBankPaymentNotification } from "@shared/schema";
/**
 * Сервіс для моніторингу банківських email-повідомлень та автоматичного відмічення платежів
 */
export class BankEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private notFoundInvoicesCache = new Map<string, number>(); // номер рахунку -> timestamp останньої перевірки
  constructor() {
    // Не викликаємо initializeMonitoring() тут, щоб уникнути проблем з БД
    // Буде викликано з index.ts після ініціалізації сервера
  }
  /**
   * Очищення старих записів з кешу неіснуючих рахунків (старших за 24 години)
   */
  private cleanupNotFoundCache(): void {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    let cleanedCount = 0;
    for (const [invoiceNumber, timestamp] of this.notFoundInvoicesCache.entries()) {
      if ((now - timestamp) > TWENTY_FOUR_HOURS) {
        this.notFoundInvoicesCache.delete(invoiceNumber);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
    }
  }
  /**
   * Безпечна ініціалізація моніторингу банківських email
   */
  async initializeEmailMonitoring(): Promise<void> {
    try {
      // Спочатку перевіряємо налаштування в базі даних
      let emailSettings;
      try {
        emailSettings = await storage.getEmailSettings();
      } catch (dbError) {
        emailSettings = null;
      }
      // Якщо в БД є налаштування і моніторинг увімкнено - використовуємо їх
      if (emailSettings?.bankMonitoringEnabled && emailSettings?.bankEmailUser && emailSettings?.bankEmailHost) {
        if (!this.isMonitoring) {
          this.startMonitoring();
        }
        return;
      }
      // Fallback на змінні оточення якщо в БД немає налаштувань
      const bankEmailHost = process.env.BANK_EMAIL_HOST;
      const bankEmailUser = process.env.BANK_EMAIL_USER;
      const bankEmailPassword = process.env.BANK_EMAIL_PASSWORD;
      if (!bankEmailHost || !bankEmailUser || !bankEmailPassword) {
        return;
      }
      // Запускаємо моніторинг зі змінними оточення
      if (!this.isMonitoring) {
        this.startMonitoring();
      }
    } catch (error) {
      console.error("❌ Помилка ініціалізації банківського моніторингу:", error);
    }
  }
  /**
   * Застаріла ініціалізація моніторингу банківських email (через БД)
   */
  async initializeMonitoring(): Promise<void> {
    try {
      const emailSettings = await storage.getEmailSettings();
      if (!emailSettings?.bankMonitoringEnabled || !emailSettings?.bankEmailUser) {
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
    // Перевіряємо нові email кожні 5 хвилин (тільки непрочитані повідомлення)
    this.monitoringInterval = setInterval(async () => {
      try {
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
  }
  /**
   * Публічний метод для ручної перевірки нових email повідомлень
   */
  async checkForNewEmails(): Promise<void> {
    try {
      await this.checkNewEmails();
    } catch (error) {
      console.error("❌ Помилка ручної перевірки email:", error);
      throw error;
    }
  }
  /**
   * Тестування підключення до банківської пошти
   */
  async testBankEmailConnection(host: string, user: string, password: string, port: number = 993): Promise<{success: boolean, message: string, error?: string}> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: user,
        password: password,
        host: host,
        port: port,
        tls: port === 993, // TLS для порту 993 (SSL), plain для 143
        tlsOptions: {
          rejectUnauthorized: false
        },
        connTimeout: 10000, // 10 секунд таймаут
        authTimeout: 15000, // 15 секунд для автентифікації
      });
      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          try {
            imap.end();
          } catch (e) {
            // Ігноруємо помилки при закритті
          }
        }
      };
      // Таймаут для всієї операції
      const timeout = setTimeout(() => {
        if (!resolved) {
          cleanup();
          resolve({
            success: false,
            message: "Таймаут підключення до IMAP сервера",
            error: "Connection timeout after 20 seconds"
          });
        }
      }, 20000);
      imap.once('ready', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({
            success: true,
            message: "Підключення до банківської пошти успішне"
          });
        }
      });
      imap.once('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          resolve({
            success: false,
            message: "Помилка підключення до банківської пошти",
            error: err.message || err.toString()
          });
        }
      });
      try {
        imap.connect();
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({
            success: false,
            message: "Помилка ініціалізації IMAP підключення",
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    });
  }
  /**
   * Перевірка нових email повідомлень від банку через IMAP
   */
  private async checkNewEmails(): Promise<void> {
    try {
      const emailSettings = await storage.getEmailSettings();
      // Використовуємо дані з БД пріоритетно, fallback на environment variables
      const bankEmailUser = emailSettings?.bankEmailUser || process.env.BANK_EMAIL_USER;
      const bankEmailPassword = emailSettings?.bankEmailPassword || process.env.BANK_EMAIL_PASSWORD;
      const bankEmailHost = emailSettings?.bankEmailHost || process.env.BANK_EMAIL_HOST || 'mail.regmik.ua';
      const bankEmailPort = emailSettings?.bankEmailPort || parseInt(process.env.BANK_EMAIL_PORT || '587');
      if (!bankEmailUser || !bankEmailPassword) {
        return;
      }
      if (emailSettings && !emailSettings.bankMonitoringEnabled) {
        return;
      }
      // Налаштування IMAP з'єднання
      // Конфігурація IMAP залежно від порту
      const imapConfig: any = {
        user: bankEmailUser,
        password: bankEmailPassword,
        host: bankEmailHost,
        port: bankEmailPort,
        authTimeout: 15000, // Збільшено таймаут для повільних з'єднань
        connTimeout: 20000, // Збільшено таймаут підключення
        tlsOptions: {
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        }
      };
      // Перевіряємо налаштування SSL з бази даних
      const bankSslEnabled = emailSettings?.bankSslEnabled ?? (bankEmailPort === 993);
      // Налаштування SSL/TLS
      imapConfig.tls = bankSslEnabled;
      // Автоматичні рекомендації за портом
      if (bankEmailPort === 993 && !bankSslEnabled) {
        // Порт 993 зазвичай з SSL
      } else if (bankEmailPort === 143 && bankSslEnabled) {
        // Порт 143 зазвичай без SSL  
      } else if (bankEmailPort === 587) {
        // Порт 587 зазвичай для SMTP
      }
      const imap = new Imap(imapConfig);
      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err: any, box: any) => {
            if (err) {
              console.error("❌ Помилка відкриття INBOX:", err);
              imap.end();
              reject(err);
              return;
            }
            // Шукаємо тільки НОВІ (непрочитані) email від банку
            const bankFromAddress = emailSettings?.bankEmailAddress || 'online@ukrsibbank.com';
            imap.search([
              ['FROM', bankFromAddress],
              'UNSEEN'  // Додано фільтр тільки для нових листів
            ], (err: any, results: any) => {
              if (err) {
                console.error("❌ Помилка пошуку email:", err);
                imap.end();
                reject(err);
                return;
              }
              if (!results || results.length === 0) {
                imap.end();
                resolve();
                return;
              }
              // Обробляємо кожен email - отримуємо headers та зміст
              const fetch = imap.fetch(results, { 
                bodies: ['HEADER', 'TEXT'], // Отримуємо повні заголовки та текст
                struct: true,
                markSeen: false  // НЕ помічаємо автоматично - будемо позначати вручну після обробки
              });
              let processedCount = 0;
              fetch.on('message', (msg: any, seqno: any) => {
                let emailContent = '';
                let emailSubject = '';
                let realMessageId = '';
                let emailDate: Date | null = null; // Спочатку null, щоб ідентифікувати що дата не знайдена
                let headerProcessed = false;
                let textProcessed = false;
                // Отримуємо заголовки та зміст
                msg.on('body', (stream: any, info: any) => {
                  let buffer = '';
                  stream.on('data', (chunk: any) => {
                    buffer += chunk.toString('utf8');
                  });
                  stream.once('end', () => {
                    if (info.which === 'HEADER') {
                      // Витягуємо справжній Message-ID з headers
                      const messageIdMatch = buffer.match(/Message-ID:\s*<([^>]+)>/i);
                      if (messageIdMatch && messageIdMatch[1] && messageIdMatch[1].trim().length > 5) {
                        realMessageId = messageIdMatch[1].trim();
                      } else {
                        // Спробуємо альтернативні regex для Message-ID без кутових дужок
                        const altRegex = buffer.match(/Message-ID:\s*([^\r\n\s]+)/i);
                        if (altRegex && altRegex[1] && altRegex[1].trim().length > 5) {
                          realMessageId = altRegex[1].trim();
                        }
                      }
                      // Витягуємо дату з email заголовків - шукаємо саме "Date:" з великої літери
                      const dateMatch = buffer.match(/^Date:\s+(.+?)$/m);
                      if (dateMatch) {
                        try {
                          const rawDate = dateMatch[1].trim();
                          emailDate = new Date(rawDate);
                          // Перевіряємо чи дата валідна
                          if (isNaN(emailDate.getTime())) {
                            emailDate = new Date();
                          } else {
                          }
                        } catch (e) {
                          emailDate = new Date();
                        }
                      } else {
                        emailDate = new Date();
                      }
                      headerProcessed = true;
                      checkAndProcessEmail(); // Перевіряємо чи готові всі частини
                    } else if (info.which === 'TEXT') {
                      emailContent = buffer;
                      textProcessed = true;
                      checkAndProcessEmail(); // Перевіряємо чи готові всі частини
                    }
                  });
                });
                // Отримуємо атрибути повідомлення (subject тощо)
                msg.once('attributes', (attrs: any) => {
                  if (attrs.envelope && attrs.envelope.subject) {
                    emailSubject = attrs.envelope.subject;
                  }
                  if (attrs.envelope && attrs.envelope.messageId) {
                    // Якщо не вдалося витягти з headers, використовуємо з envelope
                    if (!realMessageId) {
                      realMessageId = attrs.envelope.messageId;
                    }
                  }
                });
                // Функція для перевірки завершення обробки і запуску фінальної обробки
                const checkAndProcessEmail = async () => {
                  if (!headerProcessed || !textProcessed) {
                    return; // Чекаємо поки всі частини будуть оброблені
                  }
                  try {
                    // Використовуємо fallback якщо не вдалося отримати Message-ID
                    const messageId = realMessageId || `imap-${seqno}-${Date.now()}`;
                    // Встановлюємо fallback дату якщо не знайдено валідну
                    const finalEmailDate = emailDate || new Date();
                    // ПОКРАЩЕНА ПЕРЕВІРКА ДУБЛІКАТІВ - за subject + correspondent + amount
                    const actualSubject = emailSubject || 'Банківське повідомлення';
                    // Спочатку витягуємо інформацію з email для перевірки дублікатів
                    let decodedContent = emailContent;
                    try {
                      if (/^[A-Za-z0-9+/]+=*$/.test(emailContent.replace(/\s/g, ''))) {
                        decodedContent = Buffer.from(emailContent, 'base64').toString('utf8');
                      }
                    } catch (error) {
                      decodedContent = emailContent;
                    }
                    // Швидко витягуємо основні дані для перевірки дублікатів
                    const quickPaymentInfo = this.analyzeBankEmailContent(decodedContent);
                    // ПЕРЕВІРКА ДУБЛІКАТІВ ЗА КОМБІНАЦІЄЮ ПОЛІВ (НАДІЙНІШЕ ЗА MESSAGE-ID)
                    if (quickPaymentInfo && quickPaymentInfo.correspondent && quickPaymentInfo.amount) {
                      const isDuplicate = await storage.checkPaymentDuplicate({
                        subject: actualSubject,
                        correspondent: quickPaymentInfo.correspondent,
                        amount: quickPaymentInfo.amount.toString()
                      });
                      if (isDuplicate) {
                        processedCount++;
                        if (processedCount === results.length) {
                          imap.end();
                          resolve();
                        }
                        return;
                      }
                    } else {
                      // Fallback на MessageId якщо немає даних для складної перевірки
                      const existingNotification = await storage.getBankNotificationByMessageId(messageId);
                      if (existingNotification) {
                        processedCount++;
                        if (processedCount === results.length) {
                          imap.end();
                          resolve();
                        }
                        return;
                      }
                    }
                    // Створюємо об'єкт email зі справжнім messageId та ПРАВИЛЬНОЮ ДАТОЮ
                    const emailData = {
                      messageId: messageId,
                      subject: actualSubject,
                      fromAddress: emailSettings.bankEmailAddress || 'noreply@ukrsib.com.ua',
                      receivedAt: finalEmailDate, // Дата отримання email ERP системою
                      emailDate: emailDate || undefined, // Дата з Email заголовка (Date:) - фактична дата банківського повідомлення
                      textContent: decodedContent
                    };
                    const result = await this.processBankEmail(emailData);
                    if (result.success) {
                      // Успішно оброблено - позначаємо як прочитаний
                      try {
                        imap.addFlags(seqno, ['\\Seen'], (err: any) => {
                          if (err) {
                            console.error(`❌ Помилка позначення email ${seqno} як прочитаний:`, err);
                          }
                        });
                      } catch (markErr) {
                        console.error(`❌ Помилка позначення email як прочитаний:`, markErr);
                      }
                    } else {
                      console.error(`❌ Помилка обробки платежу: ${result.message}`);
                    }
                    processedCount++;
                    if (processedCount === results.length) {
                      imap.end();
                      resolve();
                    }
                  } catch (error) {
                    console.error(`❌ Помилка обробки email ${seqno}:`, error);
                    processedCount++;
                    if (processedCount === results.length) {
                      imap.end();
                      resolve();
                    }
                  }
                };
              });
              fetch.once('error', (err: any) => {
                console.error("❌ Помилка отримання email:", err);
                imap.end();
                reject(err);
              });
            });
          });
        });
        imap.once('error', (err: any) => {
          console.error("❌ Помилка IMAP з'єднання:", err);
          // Детальна інформація про помилку автентифікації
          if (err.textCode === 'AUTHENTICATIONFAILED' || err.message?.includes('Authentication failed')) {
            // Інформація про неправильні налаштування автентифікації
          }
          reject(err);
        });
        imap.connect();
      });
    } catch (error) {
      console.error("❌ Помилка перевірки банківських email:", error);
      await storage.createSystemLog({
        level: 'error',
        category: 'bank-email',
        module: 'imap-monitoring',
        message: `Помилка IMAP перевірки: ${error instanceof Error ? error.message : String(error)}`,
        details: { 
          component: 'bank-email-service',
          function: 'checkNewEmails',
          error: error instanceof Error ? error.toString() : String(error) 
        },
        userId: null
      });
    }
  }
  /**
   * Обробка банківського повідомлення та аналіз тексту
   */
  async processBankEmail(emailContent: {
    messageId: string;
    subject: string;
    fromAddress: string;
    receivedAt: Date;
    emailDate?: Date; // Дата з Email заголовка (Date:)
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
      // КРИТИЧНИЙ FIX: Перевіряємо валідність дати перед збереженням в БД
      let validInvoiceDate: Date | undefined;
      if (paymentInfo.invoiceDate && !isNaN(paymentInfo.invoiceDate.getTime())) {
        validInvoiceDate = paymentInfo.invoiceDate;
      } else {
        validInvoiceDate = undefined;
      }
      // Перевіряємо чи receivedAt валідна дата
      let validReceivedAt = emailContent.receivedAt;
      if (isNaN(emailContent.receivedAt.getTime())) {
        validReceivedAt = new Date();
      }
      // Якщо це зарахування коштів та знайдено номер рахунку - обробляємо платіж  
      if (paymentInfo.operationType === "зараховано" && paymentInfo.invoiceNumber) {
        // Очищуємо кеш неіснуючих рахунків при кожній перевірці для актуальності
        this.notFoundInvoicesCache.clear();
        // Шукаємо існуючі записи з такою ж комбінацією полів
        const existingNotifications = await storage.query(`
          SELECT * FROM bank_payment_notifications 
          WHERE subject = $1 AND correspondent = $2 AND amount::text = $3
        `, [emailContent.subject, paymentInfo.correspondent, paymentInfo.amount.toString()]);
        if (existingNotifications.length > 0) {
          return { 
            success: false, 
            message: "Email дублікат вже оброблено раніше",
            notification: existingNotifications[0] 
          };
        }
        // ЗАВЖДИ створюємо bank_payment_notification (навіть якщо замовлення не знайдено)
        const notification: InsertBankPaymentNotification = {
          messageId: emailContent.messageId,
          subject: emailContent.subject,
          fromAddress: emailContent.fromAddress,
          receivedAt: validReceivedAt,
          accountNumber: paymentInfo.accountNumber,
          currency: paymentInfo.currency,
          operationType: paymentInfo.operationType,
          amount: paymentInfo.amount.toString(),
          correspondent: paymentInfo.correspondent,
          paymentPurpose: paymentInfo.paymentPurpose,
          invoiceNumber: paymentInfo.invoiceNumber,
          invoiceDate: validInvoiceDate,
          vatAmount: paymentInfo.vatAmount?.toString(),
          processed: false, // Спочатку позначаємо як необроблений
          orderId: null, // Спочатку без замовлення
          rawEmailContent: emailContent.textContent,
        };
        const savedNotification = await storage.createBankPaymentNotification(notification);
        // ПІСЛЯ створення notification спробуємо знайти замовлення  
        // ВИПРАВЛЕНО: Передаємо весь emailContent для правильної дати платежу
        const paymentResult = await this.processPayment(savedNotification.id, paymentInfo, emailContent);
        if (paymentResult.success) {
          // Оновлюємо notification як оброблений з orderId
          await storage.query(`
            UPDATE bank_payment_notifications 
            SET processed = true, order_id = $1 
            WHERE id = $2
          `, [paymentResult.orderId, savedNotification.id]);
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
          // Залишаємо notification як необроблений (processed = false)
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
              amount: paymentInfo.amount,
              notificationId: savedNotification.id
            },
            userId: null
          });
        }
        return {
          success: paymentResult.success,
          message: paymentResult.success ? 
            `Платіж оброблено успішно: ${paymentInfo.invoiceNumber} на суму ${paymentInfo.amount} UAH` :
            `Замовлення не знайдено для рахунку ${paymentInfo.invoiceNumber}, email буде перевірено пізніше`
        };
      }
      // НОВА ЛОГІКА: Створюємо записи для ВСІХ банківських email незалежно від номеру рахунку
      // Перевіряємо чи цей email вже оброблений за новою системою дублікатів
      const isDuplicate = await storage.checkPaymentDuplicate({
        subject: emailContent.subject,
        correspondent: paymentInfo.correspondent,
        amount: paymentInfo.amount.toString()
      });
      if (isDuplicate) {
        return { 
          success: false, 
          message: "Email вже оброблений (дублікат за subject+correspondent+amount)" 
        };
      }
      // Створюємо запис про банківське повідомлення для ВСІХ email
      const notification: InsertBankPaymentNotification = {
        messageId: emailContent.messageId,
        subject: emailContent.subject,
        fromAddress: emailContent.fromAddress,
        receivedAt: validReceivedAt,
        accountNumber: paymentInfo.accountNumber,  
        currency: paymentInfo.currency,
        operationType: paymentInfo.operationType,
        amount: paymentInfo.amount.toString(),
        correspondent: paymentInfo.correspondent,
        paymentPurpose: paymentInfo.paymentPurpose,
        invoiceNumber: paymentInfo.invoiceNumber || null,
        invoiceDate: validInvoiceDate || null,
        vatAmount: paymentInfo.vatAmount?.toString() || null,
        processed: false, // Всі записи починають як необроблені
        orderId: null,
        rawEmailContent: emailContent.textContent,
      };
      const savedNotification = await storage.createBankPaymentNotification(notification);
      return {
        success: true,
        message: `Банківське повідомлення збережено: ${paymentInfo.operationType} на суму ${paymentInfo.amount} ${paymentInfo.currency}`,
        notification: savedNotification
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
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
   * ВИПРАВЛЕНИЙ парсинг українських назв місяців у дати
   */
  private parseUkrainianDate(dateString: string): Date | null {
    try {
      const ukrainianMonths: { [key: string]: number } = {
        'січня': 1, 'січні': 1, 'січень': 1,
        'лютого': 2, 'лютому': 2, 'лютий': 2,
        'березня': 3, 'березні': 3, 'березень': 3,
        'квітня': 4, 'квітні': 4, 'квітень': 4,
        'травня': 5, 'травні': 5, 'травень': 5,
        'червня': 6, 'червні': 6, 'червень': 6,
        'липня': 7, 'липні': 7, 'липень': 7,
        'серпня': 8, 'серпні': 8, 'серпень': 8,
        'вересня': 9, 'вересні': 9, 'вересень': 9,
        'жовтня': 10, 'жовтні': 10, 'жовтень': 10,
        'листопада': 11, 'листопаді': 11, 'листопад': 11,
        'грудня': 12, 'грудні': 12, 'грудень': 12
      };
      // Формат: "22 липня 2025 р."
      const ukrainianMatch = dateString.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
      if (ukrainianMatch) {
        const [, day, month, year] = ukrainianMatch;
        const monthNum = ukrainianMonths[month.toLowerCase()];
        if (monthNum) {
          const date = new Date(parseInt(year), monthNum - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      // Покращений regex для числового формату: "22.07.25р." або "22.07.2025" або "22.07.2025р."
      const numericMatch = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})(?:р\.?)?/i);
      if (numericMatch) {
        const [, day, month, yearPart] = numericMatch;
        let year = parseInt(yearPart);
        if (yearPart.length === 2) {
          year = 2000 + year; // 25 → 2025
        }
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Додатковий формат: "від ДД.ММ.РРРР" або просто "ДД.ММ.РРРР"
      const additionalMatch = dateString.match(/(?:від\s+)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i);
      if (additionalMatch) {
        const [, day, month, year] = additionalMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return null;
    } catch (error) {

      return null;
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
    paymentTime?: string;
  } | null {
    try {
      // Витягуємо час оплати з email (формат: "18:10" - може бути після <br>)
      const timeMatch = emailText.match(/(?:^|<br>\s*)(\d{1,2}:\d{2})/);
      const paymentTime = timeMatch ? timeMatch[1] : undefined;
      // УНІВЕРСАЛЬНІ регекси на основі реального формату Укрсіббанку (українська/російська)
      const accountMatch = emailText.match(/рух коштів по рахунку:\s*([A-Z0-9]+)/i);
      const currencyMatch = emailText.match(/валюта(?:\s+операції|\s+операции)?:\s*([A-Z]{3})/i) || emailText.match(/(\d+[,\.]\d+)\s*(UAH|USD|EUR)/i);
      // УНІВЕРСАЛЬНИЙ формат: "Тип операції:" або "Тип операции:"
      const operationMatch = emailText.match(/тип операці[їиі]:\s*([^\n\r,]+)/i);
      // УНІВЕРСАЛЬНИЙ формат: "сумма:" або "Сумма операции:"
      const amountMatch = emailText.match(/(?:сумм?а(?:\s+операці[їиі])?|сумма):\s*([\d,\.]+)/i);
      // УНІВЕРСАЛЬНИЙ формат: "кореспондент:" або "Кореспондент:" - витягуємо назву компанії
      let correspondentMatch = emailText.match(/кореспондент:\s*([^,<]+)/i);
      if (!correspondentMatch) {
        correspondentMatch = emailText.match(/кореспондент:\s*(.+?)(?:,\s*<br>)/i);
      }
      // УНІВЕРСАЛЬНИЙ формат: "призначення платежу:" або "Призначення платежу:"
      const purposeMatch = emailText.match(/призначення платежу:\s*(.+)/i);
      // Резервний пошук кореспондента
      if (!correspondentMatch) {
        const searchVariants = [
          'корреспондент:',
          'кореспондент:',
          'корреспондент: ',
          'кореспондент: ',
          ' корреспондент:',
          ' кореспондент:'
        ];
        let correspondentIndex = -1;
        let keywordLength = 0;
        for (const variant of searchVariants) {
          correspondentIndex = emailText.indexOf(variant);
          if (correspondentIndex !== -1) {
            keywordLength = variant.length;
            break;
          }
        }
        if (correspondentIndex !== -1) {
          const startPos = correspondentIndex + keywordLength;
          let endPos = emailText.indexOf(',', startPos);
          const brPos = emailText.indexOf('<br>', startPos);
          if (endPos === -1 || (brPos !== -1 && brPos < endPos)) {
            endPos = brPos;
          }
          if (endPos > startPos) {
            const correspondentText = emailText.substring(startPos, endPos).trim();
            correspondentMatch = [null, correspondentText];
          }
        }
      }
      // Пошук номерів рахунків
      let invoiceMatch = null;
      let invoiceNumber = "";
      let isFullInvoiceNumber = false;
      let partialInvoiceNumber = null;
      if (purposeMatch?.[1]) {
        const purposeText = purposeMatch[1];
        // Спочатку шукаємо повний формат РМ00-XXXXXX
        const fullInvoiceMatch = purposeText.match(/РМ00[-\s]*(\d{5,6})/i);
        if (fullInvoiceMatch) {
          const rawNumber = fullInvoiceMatch[1];
          invoiceNumber = `РМ00-${rawNumber.padStart(6, '0')}`;
          invoiceMatch = fullInvoiceMatch;
          isFullInvoiceNumber = true;
        } else {
          // Шукаємо частковий номер
          let purposeInvoiceMatch = purposeText.match(/рах\.?\s*№?\s*(\d+)/i);
          // Підтримка англійського формату "No XXXXX"
          if (!purposeInvoiceMatch) {
            purposeInvoiceMatch = purposeText.match(/\bNo\s+(\d+)/i);
          }
          // Підтримка "№ XXXXX"
          if (!purposeInvoiceMatch) {
            purposeInvoiceMatch = purposeText.match(/№\s*(\d+)/i);
          }
          if (purposeInvoiceMatch) {
            partialInvoiceNumber = purposeInvoiceMatch[1];
            invoiceNumber = partialInvoiceNumber;
            invoiceMatch = purposeInvoiceMatch;
            isFullInvoiceNumber = false;
          }
        }
      }
      if (!invoiceMatch) {
        invoiceNumber = "";
        partialInvoiceNumber = null;
        isFullInvoiceNumber = false;
      }
      // Шукаємо дату рахунку (підтримка українських та числових форматів)
      // Формати: "від 22 липня 2025 р.", "від 18.07.2025", "від 18.07.25р."
      let dateMatch = emailText.match(/від\s*(\d{1,2}\s+[а-яё]+\s+\d{4}\s*р?\.?)/i);
      if (!dateMatch) {
        dateMatch = emailText.match(/від\s*(\d{2}\.\d{2}\.(?:\d{4}|\d{2}р?))/i);
      }
      // Шукаємо ПДВ
      const vatMatch = emailText.match(/ПДВ.*?(\d+[,\.]\d+)/i);
      // Видалено дублікат пошуку - основний алгоритм вже перевіряє purposeMatch
      // FINAL FIX: Якщо correspondentMatch не спрацював, витягуємо з додаткових регексів
      if (!correspondentMatch && invoiceMatch?.input) {
        const fullText = invoiceMatch.input;
        const correspondentMatch2 = fullText.match(/корреспондент:\s*([^<,]+)/i);
        if (correspondentMatch2) {
          correspondentMatch = correspondentMatch2;
        }
      }
      // Витягуємо суму з amountMatch або currencyMatch
      let amount: number;
      if (amountMatch) {
        const amountStr = amountMatch[1].replace(',', '.'); // Українські коми → крапки
        amount = parseFloat(amountStr);
      } else if (currencyMatch) {
        // Якщо amountMatch не знайдено, спробуємо витягти з currencyMatch
        const amountStr = currencyMatch[1].replace(',', '.'); // Українські коми → крапки
        amount = parseFloat(amountStr);
      } else {
        return null;
      }
      // Для карткових операцій accountMatch може бути відсутнім
      if (!operationMatch || isNaN(amount) || !correspondentMatch) {
        return null;
      }
      const vatAmount = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : undefined;
      let invoiceDate: Date | undefined;
      if (dateMatch) {
        const datePart = dateMatch[1];
        // НОВИЙ ПІДХІД: Спочатку перевіряємо український формат
        invoiceDate = this.parseUkrainianDate(datePart);
        // Якщо український формат не спрацював, використовуємо старий алгоритм
        if (!invoiceDate) {
          const [day, month, yearPart] = datePart.split('.');
          // Обробляємо різні формати року: 2025, 25р., 25
          let year: string;
          if (yearPart && yearPart.length === 4) {
            year = yearPart; // 2025
          } else if (yearPart && (yearPart.endsWith('р.') || yearPart.endsWith('р'))) {
            year = '20' + yearPart.replace(/р\.?/, ''); // 25р. → 2025
          } else if (yearPart && yearPart.length === 2) {
            year = '20' + yearPart; // 25 → 2025
          } else if (yearPart) {
            year = yearPart;
          } else {
            year = new Date().getFullYear().toString(); // Fallback на поточний рік
          }
          try {
            invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            // КРИТИЧНИЙ FIX: Перевіряємо чи дата валідна
            if (isNaN(invoiceDate.getTime())) {
              console.error(`🏦 ❌ Створена дата невалідна: "${datePart}" → Invalid Date`);
              invoiceDate = undefined;
            } else {
            }
          } catch (error) {
            console.error(`🏦 ❌ Помилка створення дати з "${datePart}":`, error);
            invoiceDate = undefined;
          }
        }
      }
      // Очищаємо operationType від зайвих символів і тексту (включно з комами)
      const cleanOperationType = operationMatch[1].trim().split('\n')[0].trim().replace(/[,\.;]+$/, '');
      // КРИТИЧНЕ ВИПРАВЛЕННЯ: Автоматичне додавання префіксу РМ00- до часткових номерів
      let finalInvoiceNumber = invoiceNumber;
      let finalPartialInvoiceNumber = partialInvoiceNumber;
      if (partialInvoiceNumber && !isFullInvoiceNumber) {
        // Додаємо префікс РМ00- до часткового номера для правильного пошуку
        const paddedNumber = partialInvoiceNumber.padStart(6, '0'); // 27779 → 027779
        finalInvoiceNumber = `РМ00-${paddedNumber}`; // РМ00-027779
      }
      // Витягуємо валюту правильно з currencyMatch
      let currency = "UAH"; // За замовчуванням
      if (currencyMatch) {
        // Перший regex: валюта в [1] групі
        // Другий regex: сума в [1], валюта в [2] групі  
        if (currencyMatch.length === 2) {
          // Перший regex: /валюта.*?:\s*([A-Z]{3})/i
          currency = currencyMatch[1];
        } else if (currencyMatch.length === 3) {
          // Другий regex: /(\d+[,\.]\d+)\s*(UAH|USD|EUR)/i
          currency = currencyMatch[2];
        }
      }
      return {
        accountNumber: accountMatch?.[1] || "CARD_OPERATION", // Для карткових операцій
        currency: currency,
        operationType: cleanOperationType,
        amount: amount,
        correspondent: correspondentMatch[1].trim(),
        paymentPurpose: purposeMatch?.[1]?.trim() || "",
        invoiceNumber: finalInvoiceNumber || undefined,
        isFullInvoiceNumber: isFullInvoiceNumber,
        invoiceDate: invoiceDate,
        vatAmount: vatAmount,
        paymentTime: paymentTime,
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
  private async processPayment(notificationId: number, paymentInfo: any, emailContent?: any): Promise<{ success: boolean; message: string; orderId?: number }> {
    try {
      // Перевіряємо, чи це операція зарахування
      if (!paymentInfo.operationType || paymentInfo.operationType !== "зараховано") {
        return { success: false, message: `Операція "${paymentInfo.operationType}" пропущена` };
      }
      let order = null;
      let searchDetails = "";
      // Обчислюємо дату 6 місяців тому для фільтра
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      // РОЗУМНИЙ ПОШУК ЗАМОВЛЕНЬ - НОВИЙ АЛГОРИТМ
      if (paymentInfo.invoiceNumber) {
        if (paymentInfo.isFullInvoiceNumber) {
          // Якщо є повний номер типу РМ00-027689, шукаємо точно
          const foundOrder = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
          if (foundOrder) {
            const orderDate = foundOrder.createdAt ? new Date(foundOrder.createdAt) : new Date();
            if (orderDate >= sixMonthsAgo) {
              order = foundOrder;
              searchDetails += `Пошук за повним номером: ${paymentInfo.invoiceNumber}`;
              // Для повних номерів можемо перевірити суму, але це не критично
              if (paymentInfo.amount) {
                const orderTotal = parseFloat(order.totalAmount?.toString() || '0');
                const paymentAmount = parseFloat(paymentInfo.amount.toString());
                if (orderTotal === paymentAmount) {
                } else {
                  // НЕ скидаємо order для повних номерів - якщо номер правильний, то це наше замовлення
                }
              }
            } else {
              searchDetails += `знайдено ${paymentInfo.invoiceNumber}, але дата ${orderDate.toISOString().split('T')[0]} старше 6 місяців`;
            }
          } else {
            searchDetails += `Пошук за повним номером: ${paymentInfo.invoiceNumber} - не знайдено`;
          }
        } else {
          // Якщо частковий номер типу "27741", використовуємо комплексний пошук
          const foundOrder = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
          if (foundOrder) {
            const orderDate = foundOrder.createdAt ? new Date(foundOrder.createdAt) : new Date();
            if (orderDate >= sixMonthsAgo) {
              order = foundOrder;
              searchDetails += `Простий пошук частково: ${paymentInfo.invoiceNumber}`;
            } else {
              searchDetails += `знайдено ${paymentInfo.invoiceNumber}, але дата ${orderDate.toISOString().split('T')[0]} старше 6 місяців`;
            }
          } else {
            // Перейдемо до розширеного пошуку нижче
          }
        }
      }
      // РОЗШИРЕНИЙ ПОШУК для часткових номерів або коли основний пошук не дав результатів
      if (!order) {

        // Використовуємо частковий номер з paymentInfo якщо є
        let partialNumber = paymentInfo.partialInvoiceNumber || paymentInfo.invoiceNumber;
        // Якщо номер має формат РМ00-, витягуємо числову частину
        if (partialNumber && partialNumber.startsWith('РМ00-')) {
          const match = partialNumber.match(/РМ00-(\d+)/);
          if (match) {
            partialNumber = match[1];

          }
        }
        // Створюємо об'єкт для розширеного пошуку
        const searchCriteria: any = {};
        if (partialNumber) {
          searchCriteria.partialInvoiceNumber = partialNumber;

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
          // Фільтруємо результати за датою
          const recentOrders = foundOrders.filter(ord => {
            const orderDate = new Date(ord.createdAt);
            return orderDate >= sixMonthsAgo;
          });

          if (recentOrders.length > 0) {
            // ПРІОРИТИЗАЦІЯ: Точне співпадіння суми має найвищий пріоритет
            if (paymentInfo.amount && recentOrders.length > 1) {
              const paymentAmount = parseFloat(paymentInfo.amount.toString());

              for (const foundOrder of recentOrders) {
                const orderTotal = parseFloat(foundOrder.totalAmount?.toString() || '0');
                if (orderTotal === paymentAmount) {
                  order = foundOrder;
                  break;
                }
              }
            }
            // Якщо точного співпадіння суми немає, беремо перше найближче з підходящих
            if (!order) {
              order = recentOrders[0];
            }
            searchDetails += `, розширений пошук: ${recentOrders.length} підходящих з ${foundOrders.length} загальних`;
          } else {

            searchDetails += `, розширений пошук: ${foundOrders.length} замовлень знайдено, але всі старше 6 місяців`;
          }
        } else {

        }
      }
      // FALLBACK ЛОГІКА: Якщо замовлення не знайдено за номером рахунку, шукаємо за кореспондентом та сумою
      if (!order && paymentInfo.correspondent && paymentInfo.amount) {

        try {
          // Шукаємо останнє замовлення з точним співпадінням суми та кореспондента, новіше 6 місяців
          const fallbackOrders = await storage.query(`
            SELECT o.*, c.name as client_name 
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            WHERE c.name ILIKE $1 AND o.total_amount = $2::numeric AND o.created_at >= $3
            ORDER BY o.created_at DESC
            LIMIT 5
          `, [`%${paymentInfo.correspondent}%`, paymentInfo.amount.toString(), sixMonthsAgo]);
          if (fallbackOrders.length > 0) {
            order = fallbackOrders[0]; // Беремо найновіше замовлення
            const orderDate = new Date(order.created_at);

            searchDetails += `, fallback пошук за кореспондентом та сумою (новіше 6 місяців)`;
            // Конвертуємо snake_case до camelCase для сумісності
            if (order.invoice_number && !order.invoiceNumber) {
              order.invoiceNumber = order.invoice_number;
            }
            if (order.total_amount && !order.totalAmount) {
              order.totalAmount = order.total_amount;
            }
          } else {

            searchDetails += `, fallback пошук: не знайдено підходящих замовлень новіших за 6 місяців`;
          }
        } catch (fallbackError) {
          console.error("🔄❌ FALLBACK ERROR:", fallbackError);
          const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          searchDetails += `, fallback пошук failed: ${errorMessage}`;
        }
      }
      if (!order) {

        const errorMsg = `Замовлення не знайдено. ${searchDetails}`;
        return { success: false, message: errorMsg };
      }
      // Якщо notificationId = 0, це означає що ми тільки перевіряємо існування замовлення
      if (notificationId === 0) {
        return {
          success: true,
          message: `Замовлення знайдено: #${order.id} (${order.invoiceNumber})`,
          orderId: order.id
        };
      }
      // Оновлюємо статус оплати замовлення тільки якщо notificationId реальний
      // ПРІОРИТЕТ: emailDate (заголовок email) -> fallback на invoiceDate -> поточна дата
      const finalPaymentDate = emailContent?.emailDate || (paymentInfo.invoiceDate ? new Date(paymentInfo.invoiceDate) : new Date());
      const result = await storage.updateOrderPaymentStatus(
        order.id, 
        paymentInfo.amount, 
        "bank_transfer",
        notificationId,
        paymentInfo.accountNumber,
        paymentInfo.correspondent,
        undefined, // reference
        undefined, // notes
        paymentInfo.paymentTime,
        finalPaymentDate, // ВИПРАВЛЕНО: Використовуємо дату з email заголовка як пріоритет
        emailContent?.receivedAt || new Date()  // Дата отримання email ERP системою
      );
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
   * Перевірка ВСіХ банківських повідомлень (включно з прочитаними)
   */
  async checkForProcessedEmails(): Promise<void> {
    try {
      // Очищуємо старі записи з кешу неіснуючих рахунків
      this.cleanupNotFoundCache();
      const emailSettings = await storage.getEmailSettings();
      const bankEmailUser = emailSettings?.bankEmailUser || process.env.BANK_EMAIL_USER;
      const bankEmailPassword = emailSettings?.bankEmailPassword || process.env.BANK_EMAIL_PASSWORD;
      const bankEmailHost = emailSettings?.bankEmailHost || process.env.BANK_EMAIL_HOST || 'mail.regmik.ua';
      const bankEmailPort = emailSettings?.bankEmailPort || parseInt(process.env.BANK_EMAIL_PORT || '993');
      if (!bankEmailUser || !bankEmailPassword) {
        return;
      }
      const imapConfig: any = {
        user: bankEmailUser,
        password: bankEmailPassword,
        host: bankEmailHost,
        port: bankEmailPort,
        authTimeout: 15000,
        connTimeout: 20000,
        tlsOptions: {
          rejectUnauthorized: false,
          secureProtocol: 'TLSv1_2_method'
        }
      };
      const bankSslEnabled = emailSettings?.bankSslEnabled ?? (bankEmailPort === 993);
      imapConfig.tls = bankSslEnabled;
      const { default: Imap } = await import('imap');
      const imap = new Imap(imapConfig);
      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox('INBOX', false, (err: any, box: any) => {
            if (err) {
              console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка відкриття INBOX:", err);
              imap.end();
              resolve();
              return;
            }
            // Шукаємо ВСІ email від банку (включно з прочитаними) БЕЗ часових обмежень
            const bankFromAddress = emailSettings.bankEmailAddress || 'online@ukrsibbank.com';
            imap.search([
              ['FROM', bankFromAddress]
              // Видалено ['SINCE', lastWeek] щоб обробити весь архів
              // НЕ додаємо 'UNSEEN' щоб отримати ВСІ повідомлення а не тільки непрочитані
            ], (err: any, results: any) => {
              if (err) {
                console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка пошуку email:", err);
                imap.end();
                resolve();
                return;
              }
              if (!results || results.length === 0) {
                imap.end();
                resolve();
                return;
              }
              // Обробляємо всі знайдені email
              const fetch = imap.fetch(results, { 
                bodies: 'TEXT',
                struct: true,
                markSeen: false // НЕ позначаємо як прочитані
              });
              let processedCount = 0;
              fetch.on('message', (msg: any, seqno: any) => {
                let emailContent = '';
                let emailSubject = '';
                msg.on('body', (stream: any, info: any) => {
                  let buffer = '';
                  stream.on('data', (chunk: any) => {
                    buffer += chunk.toString('utf8');
                  });
                  stream.once('end', () => {
                    emailContent = buffer;
                  });
                });
                msg.once('attributes', (attrs: any) => {
                  if (attrs.envelope && attrs.envelope.subject) {
                    emailSubject = attrs.envelope.subject;
                  }
                });
                msg.once('end', async () => {
                  try {
                    const actualSubject = emailSubject || 'Банківське повідомлення';
                    // Декодуємо Base64 контент якщо потрібно
                    let decodedContent = emailContent;
                    try {
                      if (/^[A-Za-z0-9+/]+=*$/.test(emailContent.replace(/\s/g, ''))) {
                        decodedContent = Buffer.from(emailContent, 'base64').toString('utf8');
                      }
                    } catch (error) {
                      decodedContent = emailContent;
                    }
                    const mockEmail = {
                      messageId: `processed-${seqno}-${Date.now()}`, // Простий fallback ID
                      subject: actualSubject,
                      fromAddress: emailSettings.bankEmailAddress || 'online@ukrsibbank.com',
                      receivedAt: new Date(),
                      textContent: decodedContent
                    };
                    const result = await this.processBankEmail(mockEmail);
                    if (result.success) {
                      // Успішно оброблено
                    } else {
                      console.error(`❌ Помилка обробки платежу: ${result.message}`);
                    }
                    // Якщо skipLogging === true, то не логуємо - рахунок у кеші
                    processedCount++;
                    if (processedCount === results.length) {
                      imap.end();
                      resolve();
                    }
                  } catch (error) {
                    console.error(`❌ ОБРОБКА ПРОЧИТАНИХ: Помилка обробки email ${seqno}:`, error);
                    processedCount++;
                    if (processedCount === results.length) {
                      imap.end();
                      resolve();
                    }
                  }
                });
              });
              fetch.once('error', (err: any) => {
                console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка отримання email:", err);
                imap.end();
                resolve();
              });
            });
          });
        });
        imap.once('error', (err: any) => {
          console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка IMAP з'єднання:", err);
          resolve();
        });
        imap.connect();
      });
    } catch (error) {
      console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Загальна помилка:", error);
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
      // Використовуємо реальну дату з email заголовка користувача
      // Date: Mon, 21 Jul 2025 16:32:17 +0300 (EEST)
      const realEmailDate = new Date("Mon, 21 Jul 2025 16:32:17 +0300");
      const mockEmail = {
        messageId: `manual-${Date.now()}`,
        subject: "Банківське повідомлення",
        fromAddress: fromAddress,
        receivedAt: new Date(), // Дата отримання ERP системою (зараз)
        emailDate: realEmailDate, // СПРАВЖНЯ дата з email заголовка
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
   * Парсинг контенту банківського email для витягування платіжних даних
   */
  private parseEmailContent(emailContent: string): { amount: number; currency: string; purpose?: string; correspondent?: string; bankAccount?: string } | null {
    try {
      // Пошук суми платежу
      const amountMatch = emailContent.match(/(\d+(?:[.,]\d{2})?)\s*(UAH|грн|₴)/i);
      if (!amountMatch) return null;
      const amount = parseFloat(amountMatch[1].replace(',', '.'));
      const currency = 'UAH';
      // Пошук призначення платежу
      const purposeMatch = emailContent.match(/(?:призначення|purpose|за рах[уо]нок|замовлення)\s*[:№]?\s*([^\n\r]+)/i);
      const purpose = purposeMatch ? purposeMatch[1].trim() : '';
      // Пошук кореспондента
      const correspondentMatch = emailContent.match(/(?:кореспондент|від|from)\s*[:№]?\s*([^\n\r]+)/i);
      const correspondent = correspondentMatch ? correspondentMatch[1].trim() : '';
      // Пошук банківського рахунку
      const accountMatch = emailContent.match(/(?:рах[уо]нок|account)\s*[:№]?\s*([^\n\r\s]+)/i);
      const bankAccount = accountMatch ? accountMatch[1].trim() : '';
      return {
        amount,
        currency,
        purpose,
        correspondent,
        bankAccount
      };
    } catch (error) {
      console.error('❌ Помилка парсингу банківського email:', error);
      return null;
    }
  }
  /**
   * Обробка всіх необроблених банківських повідомлень  
   */
  async processUnprocessedNotifications(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    skipped: number;
    details: string[];
  }> {
    try {
      const unprocessedNotifications = await storage.getBankPaymentNotifications();
      const toProcess = unprocessedNotifications.filter(n => !n.processed);
      let processed = 0;
      let failed = 0;
      let skipped = 0;
      const details: string[] = [];
      for (const notification of toProcess) {
        try {
          // Перевіряємо чи це повідомлення вже було оброблене
          if (notification.processed) {
            skipped++;
            details.push(`⏭️ Повідомлення ${notification.id}: вже оброблено`);
            continue;
          }
          // Безпечно отримуємо дані для обробки без спроби створити дублікат
          const paymentData = this.parseEmailContent(notification.rawEmailContent || '');
          if (!paymentData) {
            await storage.markBankNotificationAsProcessed(notification.id);
            failed++;
            details.push(`❌ Повідомлення ${notification.id}: не вдалося розпізнати банківські дані`);
            continue;
          }
          // Шукаємо замовлення за номером рахунку
          const orders = await storage.findOrdersByPaymentInfo({
            invoiceNumber: paymentData.purpose || '',
            correspondent: paymentData.correspondent || '',
            amount: paymentData.amount
          });
          if (orders.length > 0) {
            for (const order of orders) {
              await storage.createOrderPayment({
                orderId: order.id,
                paymentDate: new Date(notification.receivedAt),
                paymentAmount: paymentData.amount.toString(),
                notes: `Автоматично: ${paymentData.purpose}`,
                correspondent: paymentData.correspondent || '',
                bankAccount: paymentData.bankAccount || '',
                createdBy: "1"
              });
              await storage.updateOrderPaymentDate(order.id, new Date().toISOString());
            }
            await storage.markBankNotificationAsProcessed(notification.id);
            processed++;
            details.push(`✅ Повідомлення ${notification.id}: знайдено ${orders.length} замовлень, оплата записана`);
          } else {
            await storage.markBankNotificationAsProcessed(notification.id);
            failed++;
            details.push(`❌ Повідомлення ${notification.id}: не знайдено відповідних замовлень`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // Якщо це помилка дублікату - пропускаємо
          if (errorMessage.includes('duplicate key value')) {
            skipped++;
            details.push(`⏭️ Повідомлення ${notification.id}: вже існує в системі`);
            await storage.markBankNotificationAsProcessed(notification.id);
          } else {
            failed++;
            details.push(`❌ Повідомлення ${notification.id}: помилка - ${errorMessage}`);
          }
        }
      }
      return {
        success: true,
        processed,
        failed,
        skipped,
        details
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Помилка обробки необроблених повідомлень:", errorMessage);
      return {
        success: false,
        processed: 0,
        failed: 0,
        skipped: 0,
        details: [`Помилка: ${errorMessage}`]
      };
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