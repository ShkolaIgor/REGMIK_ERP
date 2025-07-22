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

  constructor() {
    // Не викликаємо initializeMonitoring() тут, щоб уникнути проблем з БД
    // Буде викликано з index.ts після ініціалізації сервера
  }

  /**
   * Безпечна ініціалізація моніторингу банківських email
   */
  async initializeEmailMonitoring(): Promise<void> {
    try {
      console.log("🏦 Запуск ініціалізації банківського email моніторингу...");
      
      // Спочатку перевіряємо налаштування в базі даних
      let emailSettings;
      try {
        emailSettings = await storage.getEmailSettings();
        console.log("🏦 Отримані налаштування з бази даних:", {
          bankMonitoringEnabled: emailSettings?.bankMonitoringEnabled,
          hasBankEmailUser: !!emailSettings?.bankEmailUser,
          hasSmtpHost: !!emailSettings?.smtpHost,
          bankEmailHost: emailSettings?.bankEmailHost
        });
      } catch (dbError) {
        console.log("🏦 Помилка читання з БД, перевіряємо змінні оточення:", dbError);
        emailSettings = null;
      }
      
      // Якщо в БД є налаштування і моніторинг увімкнено - використовуємо їх
      if (emailSettings?.bankMonitoringEnabled && emailSettings?.bankEmailUser && emailSettings?.bankEmailHost) {
        console.log("🏦 Використовуємо налаштування з бази даних");
        
        if (!this.isMonitoring) {
          this.startMonitoring();
          console.log("🏦 Запущено періодичний моніторинг банківських email (кожні 5 хвилин)");
        }
        
        console.log("🏦 Банківський email моніторинг ініціалізовано з налаштуваннями БД");
        return;
      }
      
      // Fallback на змінні оточення якщо в БД немає налаштувань
      const bankEmailHost = process.env.BANK_EMAIL_HOST;
      const bankEmailUser = process.env.BANK_EMAIL_USER;
      const bankEmailPassword = process.env.BANK_EMAIL_PASSWORD;
      
      if (!bankEmailHost || !bankEmailUser || !bankEmailPassword) {
        console.log("🏦 Банківський email моніторинг не налаштовано");
        console.log("🏦 Налаштуйте через меню 'Налаштування Email' або додайте змінні оточення");
        return;
      }
      
      console.log("🏦 Використовуємо налаштування зі змінних оточення:", {
        hasHost: !!bankEmailHost,
        hasUser: !!bankEmailUser, 
        hasPassword: !!bankEmailPassword,
        host: bankEmailHost
      });

      // Запускаємо моніторинг зі змінними оточення
      if (!this.isMonitoring) {
        this.startMonitoring();
        console.log("🏦 Запущено періодичний моніторинг банківських email (кожні 5 хвилин)");
      }

      console.log("🏦 Банківський email моніторинг ініціалізовано зі змінними оточення");
    } catch (error) {
      console.error("❌ Помилка ініціалізації банківського моніторингу:", error);
    }
  }

  /**
   * Застаріла ініціалізація моніторингу банківських email (через БД)
   */
  async initializeMonitoring(): Promise<void> {
    try {
      console.log("🏦 Запуск ініціалізації банківського email моніторингу...");
      const emailSettings = await storage.getEmailSettings();
      
      console.log("🏦 Отримані налаштування email:", {
        bankMonitoringEnabled: emailSettings?.bankMonitoringEnabled,
        hasBankEmailUser: !!emailSettings?.bankEmailUser,
        hasSmtpHost: !!emailSettings?.smtpHost,
        smtpPort: emailSettings?.smtpPort
      });
      
      if (!emailSettings?.bankMonitoringEnabled || !emailSettings?.bankEmailUser) {
        console.log("🏦 Банківський email моніторinг вимкнено або не налаштовано");
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
        console.log("🏦 Запущено періодичний моніторинг банківських email (кожні 5 хвилин)");
      }

      console.log("🏦 Банківський email моніторinг ініціалізовано");
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
   * Публічний метод для ручної перевірки нових email повідомлень
   */
  async checkForNewEmails(): Promise<void> {
    try {
      console.log("🏦 Ручна перевірка нових банківських email...");
      await this.checkNewEmails();
      console.log("🏦 Ручна перевірка нових email завершена");
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
        console.log("🏦 Банківський моніторинг не налаштовано - відсутні дані автентифікації");
        console.log("🏦 Налаштуйте через меню 'Налаштування Email'");
        return;
      }
      
      if (emailSettings && !emailSettings.bankMonitoringEnabled) {
        console.log("🏦 Банківський моніторинг вимкнено в налаштуваннях");
        return;
      }

      console.log("🏦 Підключення до IMAP для перевірки нових банківських email...");
      console.log("🏦 IMAP Host:", bankEmailHost);
      console.log("🏦 IMAP Port:", bankEmailPort);
      console.log("🏦 IMAP User:", bankEmailUser);

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
      
      console.log(`🏦 SSL налаштування: ${bankSslEnabled ? 'увімкнено' : 'вимкнено'}`);
      
      // Автоматичні рекомендації за портом
      if (bankEmailPort === 993 && !bankSslEnabled) {
        console.log("⚠️ Увага: порт 993 зазвичай використовується з SSL");
      } else if (bankEmailPort === 143 && bankSslEnabled) {
        console.log("⚠️ Увага: порт 143 зазвичай використовується без SSL");
      } else if (bankEmailPort === 587) {
        console.log("⚠️ Увага: порт 587 зазвичай для SMTP, але спробуємо IMAP");
      }

      console.log(`🏦 IMAP конфігурація: порт=${bankEmailPort}, TLS=${imapConfig.tls}`);
      
      const imap = new Imap(imapConfig);

      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          console.log("🏦 IMAP з'єднання встановлено");
          
          imap.openBox('INBOX', false, (err: any, box: any) => {
            if (err) {
              console.error("❌ Помилка відкриття INBOX:", err);
              imap.end();
              reject(err);
              return;
            }

            console.log(`🏦 Відкрито INBOX, всього повідомлень: ${box.messages.total}`);

            // Шукаємо нові email від банку за останні 24 години
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const bankFromAddress = emailSettings.bankEmailAddress || 'noreply@ukrsib.com.ua';
            console.log(`🏦 Пошук email за критеріями: від=${bankFromAddress}, з=${yesterday.toDateString()}, непрочитані`);
            
            imap.search([
              'UNSEEN',
              ['FROM', bankFromAddress],
              ['SINCE', yesterday]
            ], (err: any, results: any) => {
              if (err) {
                console.error("❌ Помилка пошуку email:", err);
                imap.end();
                reject(err);
                return;
              }

              console.log(`🏦 Результати пошуку email: знайдено ${results ? results.length : 0} повідомлень`);

              if (!results || results.length === 0) {
                console.log("🏦 Нових банківських email не знайдено (перевірено INBOX за сьогодні)");
                console.log(`🏦 Пошук завершено для: ${bankFromAddress} з ${yesterday.toDateString()}`);
                imap.end();
                resolve();
                return;
              }

              console.log(`🏦 Знайдено ${results.length} нових банківських email`);
              console.log(`🏦 Початок обробки email повідомлень...`);

              // Обробляємо кожен email - отримуємо повний зміст БЕЗ позначення як прочитаний
              const fetch = imap.fetch(results, { 
                bodies: 'TEXT', // Отримуємо текстову частину email
                struct: true,
                markSeen: false  // НЕ помічаємо як прочитаний для збереження автоматичного моніторингу
              });
              let processedCount = 0;

              fetch.on('message', (msg: any, seqno: any) => {
                let emailContent = '';
                let emailSubject = '';

                // Отримуємо заголовки
                msg.on('body', (stream: any, info: any) => {
                  if (info.which === 'TEXT') {
                    // Це текстовий зміст email
                    let buffer = '';
                    stream.on('data', (chunk: any) => {
                      buffer += chunk.toString('utf8');
                    });
                    
                    stream.once('end', () => {
                      emailContent = buffer;
                      console.log(`🏦 Отримано зміст email ${seqno}, довжина: ${buffer.length} символів`);
                    });
                  }
                });

                // Отримуємо атрибути повідомлення (subject, date тощо)
                msg.once('attributes', (attrs: any) => {
                  if (attrs.envelope && attrs.envelope.subject) {
                    emailSubject = attrs.envelope.subject;
                    console.log(`🏦 Email ${seqno} subject: ${emailSubject}`);
                  }
                });

                msg.once('end', async () => {
                  try {
                    // Використовуємо отриманий subject або fallback
                    const actualSubject = emailSubject || 'Банківське повідомлення';
                    
                    // Декодуємо Base64 контент якщо потрібно
                    let decodedContent = emailContent;
                    try {
                      // Перевіряємо чи це Base64 (типово починається з букв і цифр без пробілів)
                      if (/^[A-Za-z0-9+/]+=*$/.test(emailContent.replace(/\s/g, ''))) {
                        decodedContent = Buffer.from(emailContent, 'base64').toString('utf8');
                        console.log(`🏦 Email ${seqno} декодовано з Base64`);
                      }
                    } catch (error) {
                      console.log(`🏦 Email ${seqno} не потребує декодування Base64`);
                      decodedContent = emailContent;
                    }

                    // Створюємо об'єкт email з декодованим вмістом
                    const mockEmail = {
                      messageId: `imap-${seqno}-${Date.now()}`,
                      subject: actualSubject,
                      fromAddress: emailSettings.bankEmailAddress || 'noreply@ukrsib.com.ua',
                      receivedAt: new Date(),
                      textContent: decodedContent
                    };

                    console.log(`🏦 Готовий до обробки email ${seqno}:`);
                    console.log(`  Subject: ${actualSubject}`);
                    console.log(`  Original length: ${emailContent.length} символів`);
                    console.log(`  Decoded length: ${decodedContent.length} символів`);
                    console.log(`  Decoded preview: ${decodedContent.substring(0, 150)}...`);

                    const result = await this.processBankEmail(mockEmail);
                    
                    if (result.success) {
                      console.log(`🏦✅ Email ${seqno} оброблено успішно`);
                    } else {
                      console.log(`🏦⚠️ Email ${seqno}: ${result.message}`);
                    }

                    processedCount++;
                    
                    if (processedCount === results.length) {
                      console.log(`🏦 Обробка завершена: ${processedCount}/${results.length} email`);
                      console.log(`🏦 Усі банківські повідомлення оброблено успішно`);
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
                });
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
            console.log(`❌ Перевірте налаштування: host=${bankEmailHost}, port=${bankEmailPort}, user=${bankEmailUser}`);
            console.log(`❌ Можлива причина: невірні credentials або заблокований доступ IMAP`);
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
      console.log("  operationType type:", typeof paymentInfo.operationType);
      console.log("  operationType length:", paymentInfo.operationType?.length);
      
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
        
        console.log("🏦 DEBUG: paymentInfo для обробки:", paymentInfo);
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
      console.log("🏦 СТАРТ АНАЛІЗУ EMAIL КОНТЕНТУ");
      console.log("🏦 Аналіз тексту email:", emailText.substring(0, 200) + "...");
      
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
      const purposeMatch = emailText.match(/призначення платежу:\s*([^\n\r]+)/i);
      
      console.log("🏦 Результати пошуку регекспів:");
      console.log("  accountMatch:", accountMatch?.[1]);
      console.log("  currencyMatch:", currencyMatch?.[1]);
      console.log("  operationMatch:", operationMatch?.[1]);
      console.log("  amountMatch:", amountMatch?.[1]);
      console.log("  correspondentMatch:", correspondentMatch?.[1]);
      console.log("  purposeMatch:", purposeMatch?.[1]);
      
      // EMERGENCY FIX: Якщо correspondentMatch не спрацював, витягуємо кореспондента простим способом
      if (!correspondentMatch) {
        console.log("🏦 EMERGENCY: Виконую резервний пошук кореспондента...");
        
        try {
          // Простий підхід - знаходимо позицію "корреспондент:" (може бути різні варіанти написання)
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
              console.log("🏦 EMERGENCY: Знайдено варіант:", variant, "на позиції:", correspondentIndex);
              break;
            }
          }
          if (correspondentIndex !== -1) {
            const startPos = correspondentIndex + keywordLength;
            let endPos = emailText.indexOf(',', startPos);
            const brPos = emailText.indexOf('<br>', startPos);
            
            // Використовуємо найближчу позицію
            if (endPos === -1 || (brPos !== -1 && brPos < endPos)) {
              endPos = brPos;
            }
            
            if (endPos > startPos) {
              const correspondentText = emailText.substring(startPos, endPos).trim();
              console.log("🏦 EMERGENCY: ✅ Знайдено кореспондента:", correspondentText);
              correspondentMatch = [null, correspondentText]; // Fake regex match format
            } else {
              console.log("🏦 EMERGENCY: ❌ Не вдалося знайти кінець імені кореспондента");
            }
          } else {
            console.log("🏦 EMERGENCY: ❌ Не знайдено жодного варіанту 'кореспондент:'");
            // Додатковий debug - показуємо фрагмент тексту для аналізу
            const keywordPos = emailText.toLowerCase().indexOf('кореспондент');
            if (keywordPos !== -1) {
              const fragment = emailText.substring(keywordPos, keywordPos + 50);
              console.log("🏦 EMERGENCY DEBUG: Фрагмент з 'кореспондент':", fragment);
            }
          }
        } catch (emergencyError) {
          console.log("🏦 EMERGENCY: ❌ Помилка в emergency пошуку:", emergencyError);
        }
      }
      
      // DEBUG: Перевіримо чи є слово "кореспондент" в тексті
      const hasCorrespondent = emailText.toLowerCase().includes('кореспондент');
      console.log("🏦 DEBUG: Чи є 'кореспондент' в тексті:", hasCorrespondent);
      if (hasCorrespondent) {
        const correspondentIndex = emailText.toLowerCase().indexOf('кореспондент');
        const contextAround = emailText.substring(correspondentIndex - 10, correspondentIndex + 100);
        console.log("🏦 DEBUG: Контекст навколо 'кореспондент':", contextAround);
      }
      
      // Спочатку шукаємо стандартні формати рахунків
      let invoiceMatch = emailText.match(/(?:РМ00-(\d+)|(?:згідно\s+)?(?:рах\.?|рахунку)\s*№?\s*(\d+))/i);
      
      // Якщо не знайшли, шукаємо номери з датами (будь-який текст між номером та датою)
      if (!invoiceMatch) {
        invoiceMatch = emailText.match(/(\d{5,6}).*?(\d{1,2}\.\d{1,2}\.(?:\d{4}|\d{2}р?))/i);
        if (invoiceMatch) {
          // Створюємо структуру як для стандартного match
          invoiceMatch = [invoiceMatch[0], null, null, invoiceMatch[1]];
        }
      }
      
      // Шукаємо дату рахунку (підтримка різних форматів: від 18.07.2025, від 18.07.25р.)
      const dateMatch = emailText.match(/від\s*(\d{2}\.\d{2}\.(?:\d{4}|\d{2}р?))/i);
      
      // Шукаємо ПДВ
      const vatMatch = emailText.match(/ПДВ.*?(\d+[,\.]\d+)/i);
      
      console.log("🏦 Додаткові регекси:");
      console.log("  invoiceMatch:", invoiceMatch);
      console.log("  dateMatch:", dateMatch);
      console.log("  vatMatch:", vatMatch);

      // FINAL FIX: Якщо correspondentMatch не спрацював, витягуємо з додаткових регексів
      if (!correspondentMatch && invoiceMatch?.input) {
        console.log("🏦 FINAL FIX: Витягуємо кореспондента з повного input тексту...");
        const fullText = invoiceMatch.input;
        const correspondentMatch2 = fullText.match(/корреспондент:\s*([^<,]+)/i);
        if (correspondentMatch2) {
          correspondentMatch = correspondentMatch2;
          console.log("🏦 FINAL FIX: ✅ Знайдено кореспондента:", correspondentMatch2[1]);
        }
      }

      // Для карткових операцій accountMatch може бути відсутнім
      if (!operationMatch || !amountMatch || !correspondentMatch) {
        console.log("🏦 Не вдалося розпізнати основні поля банківського повідомлення");
        console.log("🏦 operationMatch:", !!operationMatch, "amountMatch:", !!amountMatch, "correspondentMatch:", !!correspondentMatch);
        return null;
      }

      // Конвертуємо суму - підтримуємо і крапки, і коми як десяткові розділювачі
      const amountStr = amountMatch[1].replace(',', '.'); // Українські коми → крапки
      const amount = parseFloat(amountStr);

      const vatAmount = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : undefined;

      let invoiceDate: Date | undefined;
      if (dateMatch) {
        const datePart = dateMatch[1];
        const [day, month, yearPart] = datePart.split('.');
        
        // Обробляємо різні формати року: 2025, 25р., 25
        let year: string;
        if (yearPart.length === 4) {
          year = yearPart; // 2025
        } else if (yearPart.endsWith('р.') || yearPart.endsWith('р')) {
          year = '20' + yearPart.replace(/р\.?/, ''); // 25р. → 2025
        } else if (yearPart.length === 2) {
          year = '20' + yearPart; // 25 → 2025
        } else {
          year = yearPart;
        }
        
        invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        console.log(`🏦 Розпізнано дату: ${datePart} → ${invoiceDate.toLocaleDateString('uk-UA')}`);
      }

      // Очищаємо operationType від зайвих символів і тексту (включно з комами)
      const cleanOperationType = operationMatch[1].trim().split('\n')[0].trim().replace(/[,\.;]+$/, '');
      
      console.log("🏦 Очищена operationType:", cleanOperationType);
      console.log("🏦 Перевірка чи це 'зараховано':", cleanOperationType === "зараховано");
      console.log("🏦 Повертаю результат з operationType:", cleanOperationType);

      return {
        accountNumber: accountMatch?.[1] || "CARD_OPERATION", // Для карткових операцій
        currency: currencyMatch?.[1] || "UAH",
        operationType: cleanOperationType,
        amount: amount,
        correspondent: correspondentMatch[1].trim(),
        paymentPurpose: purposeMatch?.[1]?.trim() || "",
        invoiceNumber: invoiceMatch ? `РМ00-${invoiceMatch[1] || invoiceMatch[2] || invoiceMatch[3]}` : undefined,
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
      console.log(`🏦 processPayment called with notificationId=${notificationId}, paymentInfo:`, paymentInfo);
      
      let order = null;
      let searchDetails = "";

      // Спочатку пробуємо простий пошук за номером рахунку
      if (paymentInfo.invoiceNumber) {
        console.log(`🏦 Searching for order by invoice number: ${paymentInfo.invoiceNumber}`);
        order = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
        console.log(`🏦 Simple search result:`, order ? `Found order ID ${order.id}` : 'Not found');
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

      console.log(`🏦 DEBUG: Found order for payment processing:`, { orderId: order.id, orderNumber: order.invoiceNumber, amount: paymentInfo.amount });

      // Оновлюємо статус оплати замовлення
      console.log(`🏦 DEBUG: Calling updateOrderPaymentStatus...`);
      const result = await storage.updateOrderPaymentStatus(
        order.id, 
        paymentInfo.amount, 
        "bank_transfer",
        notificationId,
        paymentInfo.accountNumber,
        paymentInfo.correspondent
      );

      console.log(`🏦 DEBUG: updateOrderPaymentStatus result:`, result);
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
   * Перевірка ВСіХ банківських повідомлень (включно з прочитаними)
   */
  async checkForProcessedEmails(): Promise<void> {
    try {
      const emailSettings = await storage.getEmailSettings();
      
      const bankEmailUser = emailSettings?.bankEmailUser || process.env.BANK_EMAIL_USER;
      const bankEmailPassword = emailSettings?.bankEmailPassword || process.env.BANK_EMAIL_PASSWORD;
      const bankEmailHost = emailSettings?.bankEmailHost || process.env.BANK_EMAIL_HOST || 'mail.regmik.ua';
      const bankEmailPort = emailSettings?.bankEmailPort || parseInt(process.env.BANK_EMAIL_PORT || '993');
      
      if (!bankEmailUser || !bankEmailPassword) {
        console.log("🏦 Відсутні налаштування банківського email");
        return;
      }

      console.log("🏦 ОБРОБКА ПРОЧИТАНИХ: Підключення до IMAP для аналізу всіх банківських повідомлень...");

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

      console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: IMAP налаштування: host=${bankEmailHost}, port=${bankEmailPort}, TLS=${imapConfig.tls}`);
      
      const { default: Imap } = await import('imap');
      const imap = new Imap(imapConfig);

      return new Promise((resolve, reject) => {
        imap.once('ready', () => {
          console.log("🏦 ОБРОБКА ПРОЧИТАНИХ: IMAP з'єднання встановлено");
          
          imap.openBox('INBOX', false, (err: any, box: any) => {
            if (err) {
              console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка відкриття INBOX:", err);
              imap.end();
              resolve();
              return;
            }

            console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: INBOX відкрито, всього повідомлень: ${box.messages.total}`);

            // Шукаємо ВСІ email від банку (включно з прочитаними) за останні 7 днів
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            
            const bankFromAddress = emailSettings.bankEmailAddress || 'online@ukrsibbank.com';
            console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Пошук за критеріями: від=${bankFromAddress}, за останні 7 днів (ВСІ повідомлення)`);
            
            imap.search([
              ['FROM', bankFromAddress],
              ['SINCE', lastWeek]
              // НЕ додаємо 'UNSEEN' щоб отримати ВСІ повідомлення а не тільки непрочитані
            ], (err: any, results: any) => {
              if (err) {
                console.error("❌ ОБРОБКА ПРОЧИТАНИХ: Помилка пошуку email:", err);
                imap.end();
                resolve();
                return;
              }

              console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Знайдено ${results ? results.length : 0} email від банку`);

              if (!results || results.length === 0) {
                console.log("🏦 ОБРОБКА ПРОЧИТАНИХ: Email від банку не знайдено");
                imap.end();
                resolve();
                return;
              }

              // Обробляємо всі знайдені email
              console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Обробляємо ${results.length} email...`);

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
                  if (info.which === 'TEXT') {
                    let buffer = '';
                    stream.on('data', (chunk: any) => {
                      buffer += chunk.toString('utf8');
                    });
                    
                    stream.once('end', () => {
                      emailContent = buffer;
                      console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} - зміст отримано, довжина: ${buffer.length} символів`);
                    });
                  }
                });

                msg.once('attributes', (attrs: any) => {
                  if (attrs.envelope && attrs.envelope.subject) {
                    emailSubject = attrs.envelope.subject;
                    console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} subject: ${emailSubject}`);
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
                        console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} декодовано з Base64`);
                      }
                    } catch (error) {
                      console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} не потребує декодування Base64`);
                      decodedContent = emailContent;
                    }

                    const mockEmail = {
                      messageId: `processed-${seqno}-${Date.now()}`,
                      subject: actualSubject,
                      fromAddress: emailSettings.bankEmailAddress || 'online@ukrsibbank.com',
                      receivedAt: new Date(),
                      textContent: decodedContent
                    };

                    console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Готовий до обробки email ${seqno}:`);
                    console.log(`  Subject: ${actualSubject}`);
                    console.log(`  Original length: ${emailContent.length} символів`);
                    console.log(`  Decoded length: ${decodedContent.length} символів`);
                    console.log(`  Decoded preview: ${decodedContent.substring(0, 150)}...`);

                    const result = await this.processBankEmail(mockEmail);
                    
                    if (result.success) {
                      console.log(`🏦✅ ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} оброблено успішно - ${result.message}`);
                    } else {
                      console.log(`🏦⚠️ ОБРОБКА ПРОЧИТАНИХ: Email ${seqno}: ${result.message}`);
                    }

                    processedCount++;
                    
                    if (processedCount === results.length) {
                      console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Завершено: ${processedCount}/${results.length} email оброблено`);
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
      
      console.log(`🏦 Знайдено ${toProcess.length} необроблених банківських повідомлень`);
      
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
          const orders = await storage.findOrdersByPaymentInfo(paymentData.purpose || '');
          
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