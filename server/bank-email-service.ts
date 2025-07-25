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
      console.log(`🏦 Очищено ${cleanedCount} старих записів з кешу неіснуючих рахунків`);
    }
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
    
    // Перевіряємо email кожні 5 хвилин (всі банківські повідомлення за останні дні)
    this.monitoringInterval = setInterval(async () => {
      try {
        console.log("🏦 Автоматична перевірка банківських email...");
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

            // Шукаємо ВСІ email від банку (без часових обмежень для повної обробки архіву)
            const bankFromAddress = emailSettings?.bankEmailAddress || 'online@ukrsibbank.com';
            console.log(`🏦 Пошук ВСІХ email за критеріями: від=${bankFromAddress} (без часових обмежень)`);
            
            imap.search([
              ['FROM', bankFromAddress]
              // Видалено ['SINCE', lastWeek] щоб обробити всі банківські повідомлення
            ], (err: any, results: any) => {
              if (err) {
                console.error("❌ Помилка пошуку email:", err);
                imap.end();
                reject(err);
                return;
              }

              console.log(`🏦 Результати пошуку email: знайдено ${results ? results.length : 0} повідомлень`);

              if (!results || results.length === 0) {
                console.log("🏦 Банківських email не знайдено (перевірено всі повідомлення в INBOX)");
                console.log(`🏦 Пошук завершено для: ${bankFromAddress} (весь архів)`);
                imap.end();
                resolve();
                return;
              }

              console.log(`🏦 Знайдено ${results.length} банківських email (всього в архіві)`);
              console.log(`🏦 Початок обробки всіх банківських повідомлень...`);

              // Обробляємо кожен email - отримуємо headers та зміст
              const fetch = imap.fetch(results, { 
                bodies: ['HEADER', 'TEXT'], // Отримуємо повні заголовки та текст
                struct: true,
                markSeen: false  // НЕ помічаємо як прочитаний
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
                        console.log(`🏦 Email ${seqno} справжній Message-ID: ${realMessageId}`);
                      } else {
                        // Спробуємо альтернативні regex для Message-ID без кутових дужок
                        const altRegex = buffer.match(/Message-ID:\s*([^\r\n\s]+)/i);
                        if (altRegex && altRegex[1] && altRegex[1].trim().length > 5) {
                          realMessageId = altRegex[1].trim();
                          console.log(`🏦 Email ${seqno} Message-ID (без дужок): ${realMessageId}`);
                        }
                      }
                      
                      // Витягуємо дату з email заголовків
                      const dateMatch = buffer.match(/Date:\s*(.*?)\r?\n/i);
                      if (dateMatch) {
                        try {
                          const rawDate = dateMatch[1].trim();
                          console.log(`🏦 DEBUG: Витягнуто дату з email ${seqno}: "${rawDate}"`);
                          
                          emailDate = new Date(rawDate);
                          
                          // Перевіряємо чи дата валідна
                          if (isNaN(emailDate.getTime())) {
                            console.log(`🏦 ⚠️ Невалідна дата email ${seqno}: "${rawDate}", використовуємо поточну дату`);
                            emailDate = new Date();
                          } else {
                            console.log(`🏦 ✅ Дата email ${seqno} валідна: ${emailDate.toISOString()}`);
                          }
                        } catch (e) {
                          console.log(`🏦 ❌ Помилка парсингу дати email ${seqno}:`, e);
                          emailDate = new Date();
                        }
                      } else {
                        console.log(`🏦 ⚠️ Дата не знайдена в заголовках email ${seqno}, використовуємо поточну дату`);
                        emailDate = new Date();
                      }
                      headerProcessed = true;
                      checkAndProcessEmail(); // Перевіряємо чи готові всі частини
                    } else if (info.which === 'TEXT') {
                      emailContent = buffer;
                      console.log(`🏦 Отримано зміст email ${seqno}, довжина: ${buffer.length} символів`);
                      textProcessed = true;
                      checkAndProcessEmail(); // Перевіряємо чи готові всі частини
                    }
                  });
                });

                // Отримуємо атрибути повідомлення (subject тощо)
                msg.once('attributes', (attrs: any) => {
                  if (attrs.envelope && attrs.envelope.subject) {
                    emailSubject = attrs.envelope.subject;
                    console.log(`🏦 Email ${seqno} subject: ${emailSubject}`);
                  }
                  if (attrs.envelope && attrs.envelope.messageId) {
                    // Якщо не вдалося витягти з headers, використовуємо з envelope
                    if (!realMessageId) {
                      realMessageId = attrs.envelope.messageId;
                      console.log(`🏦 Email ${seqno} Message-ID з envelope: ${realMessageId}`);
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
                    
                    console.log(`🏦 DEBUG: Email ${seqno} - messageId: "${messageId}"`);
                    console.log(`🏦 DEBUG: Email ${seqno} - emailDate: ${emailDate ? emailDate.toISOString() : 'NULL'}`);
                    console.log(`🏦 DEBUG: Email ${seqno} - finalEmailDate: ${finalEmailDate.toISOString()}`);
                    console.log(`🏦 DEBUG: Email ${seqno} - headerProcessed: ${headerProcessed}, textProcessed: ${textProcessed}`);
                    
                    // ПОКРАЩЕНА ПЕРЕВІРКА ДУБЛІКАТІВ - за subject + correspondent + amount
                    const actualSubject = emailSubject || 'Банківське повідомлення';
                    
                    // Спочатку витягуємо інформацію з email для перевірки дублікатів
                    let decodedContent = emailContent;
                    try {
                      if (/^[A-Za-z0-9+/]+=*$/.test(emailContent.replace(/\s/g, ''))) {
                        decodedContent = Buffer.from(emailContent, 'base64').toString('utf8');
                        console.log(`🏦 Email ${seqno} декодовано з Base64`);
                      }
                    } catch (error) {
                      console.log(`🏦 Email ${seqno} не потребує декодування Base64`);
                      decodedContent = emailContent;
                    }

                    // Швидко витягуємо основні дані для перевірки дублікатів
                    const quickPaymentInfo = this.analyzeBankEmailContent(decodedContent);
                    
                    // ПЕРЕВІРКА ДУБЛІКАТІВ ЗА КОМБІНАЦІЄЮ ПОЛІВ (НАДІЙНІШЕ ЗА MESSAGE-ID)
                    if (quickPaymentInfo.correspondent && quickPaymentInfo.amount) {
                      const isDuplicate = await storage.checkPaymentDuplicate({
                        subject: actualSubject,
                        correspondent: quickPaymentInfo.correspondent,
                        amount: quickPaymentInfo.amount.toString()
                      });
                      
                      if (isDuplicate) {
                        console.log(`🏦⏭️ Email ${seqno} є дублікатом (subject+correspondent+amount), пропускаємо`);
                        processedCount++;
                        
                        if (processedCount === results.length) {
                          console.log(`🏦 Обробка завершена: ${processedCount}/${results.length} email`);
                          imap.end();
                          resolve();
                        }
                        return;
                      }
                    } else {
                      // Fallback на MessageId якщо немає даних для складної перевірки
                      const existingNotification = await storage.getBankNotificationByMessageId(messageId);
                      if (existingNotification) {
                        console.log(`🏦⏭️ Email ${seqno} (${messageId}) вже оброблений за MessageId, пропускаємо`);
                        processedCount++;
                        
                        if (processedCount === results.length) {
                          console.log(`🏦 Обробка завершена: ${processedCount}/${results.length} email`);
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
                      emailDate: emailDate, // Дата з Email заголовка (Date:) - фактична дата банківського повідомлення
                      textContent: decodedContent
                    };

                    console.log(`🏦 Обробляємо НОВИЙ email ${seqno}:`);
                    console.log(`  Message-ID: ${messageId}`);
                    console.log(`  Subject: ${actualSubject}`);
                    console.log(`  ReceivedAt: ${finalEmailDate.toISOString()}`);

                    const result = await this.processBankEmail(emailData);
                    
                    if (result.success) {
                      console.log(`🏦✅ Email ${seqno} оброблено успішно`);
                    } else if (!result.skipLogging) {
                      console.log(`🏦⚠️ Email ${seqno}: ${result.message}`);
                    }

                    processedCount++;
                    
                    if (processedCount === results.length) {
                      console.log(`🏦 Обробка завершена: ${processedCount}/${results.length} email`);
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
    emailDate?: Date; // Дата з Email заголовка (Date:)
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
      
      console.log("🏦 🔧 РЕЗУЛЬТАТ analyzeBankEmailContent:");
      console.log("🏦 🔧 paymentInfo:", JSON.stringify(paymentInfo, null, 2));
      
      if (!paymentInfo) {
        return { success: false, message: "Не вдалося розпізнати банківську операцію в email" };
      }

      // Створюємо запис про банківське повідомлення
      console.log("🏦 Зберігання операції:", paymentInfo.operationType);
      
      // КРИТИЧНИЙ FIX: Перевіряємо валідність дати перед збереженням в БД
      let validInvoiceDate: Date | undefined;
      if (paymentInfo.invoiceDate && !isNaN(paymentInfo.invoiceDate.getTime())) {
        validInvoiceDate = paymentInfo.invoiceDate;
        console.log("🏦 ✅ Дата рахунку валідна:", validInvoiceDate.toLocaleDateString('uk-UA'));
      } else {
        validInvoiceDate = undefined;
        console.log("🏦 ⚠️ Дата рахунку невалідна або відсутня, встановлюємо undefined");
      }
      
      // Перевіряємо чи receivedAt валідна дата
      let validReceivedAt = emailContent.receivedAt;
      console.log(`🏦 DEBUG: emailContent.receivedAt = ${emailContent.receivedAt?.toISOString()} (valid: ${!isNaN(emailContent.receivedAt?.getTime() || 0)})`);
      
      if (isNaN(emailContent.receivedAt.getTime())) {
        console.log("🏦 ⚠️ emailContent.receivedAt невалідна, використовуємо поточну дату (це джерело проблеми з датою платежу!)");
        validReceivedAt = new Date();
      } else {
        console.log(`🏦 ✅ emailContent.receivedAt валідна: ${validReceivedAt.toISOString()}`);
      }

      // Якщо це зарахування коштів та знайдено номер рахунку - обробляємо платіж  
      console.log(`🏦 ПЕРЕВІРКА УМОВ: operationType="${paymentInfo.operationType}", invoiceNumber="${paymentInfo.invoiceNumber}"`);
      if (paymentInfo.operationType === "зараховано" && paymentInfo.invoiceNumber) {
        // Очищуємо кеш неіснуючих рахунків при кожній перевірці для актуальності
        this.notFoundInvoicesCache.clear();
        
        console.log("🏦 Розпочинаю обробку платежу...");
        
        // ПЕРЕВІРЯЄМО ЧИ ЦЕЙ EMAIL ВЖЕ ОБРОБЛЕНИЙ (за комбінацією полів замість Message-ID)
        const duplicateKey = `${emailContent.subject}-${paymentInfo.correspondent}-${paymentInfo.amount}`;
        console.log("🏦 Перевірка дублікатів за ключем:", duplicateKey);
        
        // Шукаємо існуючі записи з такою ж комбінацією полів
        const existingNotifications = await storage.query(`
          SELECT * FROM bank_payment_notifications 
          WHERE subject = $1 AND correspondent = $2 AND amount::text = $3
        `, [emailContent.subject, paymentInfo.correspondent, paymentInfo.amount.toString()]);
        
        if (existingNotifications.length > 0) {
          console.log("🏦 ⚠️ Email дублікат знайдено за комбінацією полів, пропускаємо");
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

        console.log("🏦 🔧 ПЕРЕД ЗБЕРЕЖЕННЯМ notification:");
        console.log("🏦 🔧 currency:", `"${notification.currency}" (length: ${notification.currency?.length})`);
        console.log("🏦 🔧 operationType:", `"${notification.operationType}" (length: ${notification.operationType?.length})`);
        console.log("🏦 🔧 accountNumber:", `"${notification.accountNumber}" (length: ${notification.accountNumber?.length})`);

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
          console.log("🏦⏭️ Замовлення не знайдено, банківське повідомлення збережено як необроблене");
          
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
      console.log("🏦 НОВА ЛОГІКА: Обробляємо email без номеру рахунку або не 'зараховано'");
      
      // Перевіряємо чи цей email вже оброблений за новою системою дублікатів
      const isDuplicate = await storage.checkPaymentDuplicate({
        subject: emailContent.subject,
        correspondent: paymentInfo.correspondent,
        amount: paymentInfo.amount.toString()
      });

      if (isDuplicate) {
        console.log(`🏦 ⚠️ Дублікат знайдено за новою системою перевірки`);
        return { 
          success: false, 
          skipLogging: true, // Не логуємо дублікати
          message: "Email вже оброблений (дублікат за subject+correspondent+amount)" 
        };
      }

      // Створюємо запис про банківське повідомлення для ВСІХ email
      console.log("🏦 🔧 ДРУГИЙ БЛОК - ПЕРЕД ЗБЕРЕЖЕННЯМ notification:");
      console.log("🏦 🔧 paymentInfo.currency:", `"${paymentInfo.currency}" (length: ${paymentInfo.currency?.length})`);
      console.log("🏦 🔧 paymentInfo.operationType:", `"${paymentInfo.operationType}" (length: ${paymentInfo.operationType?.length})`);
      
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

      console.log("🏦 🔧 notification.currency:", `"${notification.currency}" (length: ${notification.currency?.length})`);

      const savedNotification = await storage.createBankPaymentNotification(notification);
      console.log(`🏦 ✅ Створено запис банківського повідомлення ID: ${savedNotification.id} для ВСІХ типів email`);

      return {
        success: true,
        message: `Банківське повідомлення збережено: ${paymentInfo.operationType} на суму ${paymentInfo.amount} ${paymentInfo.currency}`,
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
   * ВИПРАВЛЕНИЙ парсинг українських назв місяців у дати
   */
  private parseUkrainianDate(dateString: string): Date | null {
    try {
      console.log(`🏦 Спроба парсингу дати: "${dateString}"`);
      
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
            console.log(`🏦 ✅ Парсинг української дати: "${dateString}" → ${date.toISOString()}`);
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
          console.log(`🏦 ✅ Парсинг числової дати: "${dateString}" → ${date.toISOString()}`);
          return date;
        }
      }

      // Додатковий формат: "від ДД.ММ.РРРР" або просто "ДД.ММ.РРРР"
      const additionalMatch = dateString.match(/(?:від\s+)?(\d{1,2})\.(\d{1,2})\.(\d{4})/i);
      if (additionalMatch) {
        const [, day, month, year] = additionalMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          console.log(`🏦 ✅ Парсинг додаткового формату: "${dateString}" → ${date.toISOString()}`);
          return date;
        }
      }

      console.log(`🏦 ⚠️ Не вдалося розпізнати формат дати: "${dateString}"`);
      return null;
    } catch (error) {
      console.error(`🏦 ❌ Помилка парсингу дати "${dateString}":`, error);
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
      console.log("🏦 СТАРТ АНАЛІЗУ EMAIL КОНТЕНТУ");
      console.log("🏦 Аналіз тексту email:", emailText.substring(0, 200) + "...");
      
      // Витягуємо час оплати з email (формат: "18:10" - може бути після <br>)
      const timeMatch = emailText.match(/(?:^|<br>\s*)(\d{1,2}:\d{2})/);
      const paymentTime = timeMatch ? timeMatch[1] : undefined;
      console.log("🏦 Час платежу витягнуто:", paymentTime);
      
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
      
      // ВИПРАВЛЕНИЙ ПОШУК НОМЕРІВ РАХУНКІВ
      // 1. Шукаємо в тексті призначення платежу номери рахунків
      let invoiceMatch = null;
      let invoiceNumber = "";
      
      console.log("🏦 🔍 ПОЧАТОК НОВОГО АЛГОРИТМУ ПОШУКУ НОМЕРІВ РАХУНКІВ");
      
      // Пріоритет 1: Пошук в purposeMatch (призначення платежу)
      let isFullInvoiceNumber = false; // Флаг для визначення чи є номер повним
      let partialInvoiceNumber = null; // Для збереження часткового номера
      
      if (purposeMatch?.[1]) {
        console.log("🏦 Пошук номера рахунку в призначенні платежу:", purposeMatch[1]);
        
        // Спочатку шукаємо повний формат РМ00-XXXXXX
        const fullInvoiceMatch = purposeMatch[1].match(/РМ00[-\s]*(\d{5,6})/i);
        if (fullInvoiceMatch) {
          const rawNumber = fullInvoiceMatch[1];
          invoiceNumber = `РМ00-${rawNumber.padStart(6, '0')}`;
          invoiceMatch = fullInvoiceMatch;
          isFullInvoiceNumber = true;
          console.log("🏦 ✅ ПОВНИЙ НОМЕР в призначенні:", fullInvoiceMatch[0], "→", invoiceNumber);
        } else {
          // Шукаємо частковий номер: "згідно рах.№ 27751", "рах №27759", "№ 27779", "No 27771"
          let purposeInvoiceMatch = purposeMatch[1].match(/(?:рах\.?\s*)?№\s*(\d+)/i);
          
          // Додаємо підтримку англійського формату "No XXXXX"
          if (!purposeInvoiceMatch) {
            purposeInvoiceMatch = purposeMatch[1].match(/\bNo\s+(\d+)/i);
          }
          
          if (purposeInvoiceMatch) {
            partialInvoiceNumber = purposeInvoiceMatch[1];
            invoiceNumber = partialInvoiceNumber; // Тимчасово зберігаємо як є
            invoiceMatch = purposeInvoiceMatch;
            isFullInvoiceNumber = false;
            console.log("🏦 ✅ ЧАСТКОВИЙ НОМЕР в призначенні:", partialInvoiceNumber, "→ потребує складного пошуку");
          } else {
            console.log("🏦 ❌ Номер не знайдено в призначенні");
          }
        }
      }
      
      // КРИТИЧНЕ ВИПРАВЛЕННЯ: НЕ шукаємо номери рахунків в основному тексті!
      // Тільки в призначенні платежу, щоб уникнути помилкового витягування номерів банківських рахунків
      
      // ЯКЩО НЕ ЗНАЙДЕНО В ПРИЗНАЧЕННІ - ВСТАНОВЛЮЄМО null
      if (!invoiceMatch) {
        console.log("🏦 ❌ Номер рахунку НЕ знайдено в призначенні платежу - завершуємо пошук");
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
      
      console.log("🏦 Пошук дати рахунку:", dateMatch?.[1]);
      
      // Шукаємо ПДВ
      const vatMatch = emailText.match(/ПДВ.*?(\d+[,\.]\d+)/i);
      
      // Видалено дублікат пошуку - основний алгоритм вже перевіряє purposeMatch
      
      console.log("🏦 Додаткові регекси:");
      console.log("  invoiceMatch:", invoiceMatch);
      console.log("  invoiceNumber (final):", invoiceNumber);
      console.log("  isFullInvoiceNumber:", isFullInvoiceNumber);
      console.log("  partialInvoiceNumber:", partialInvoiceNumber);
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

      console.log("🏦 🔧 DEBUG СТАТУС ПЕРЕД ПЕРЕВІРКАМИ:");
      console.log("🏦 🔧 operationMatch:", !!operationMatch, operationMatch?.[1]);
      console.log("🏦 🔧 correspondentMatch:", !!correspondentMatch, correspondentMatch?.[1]);
      console.log("🏦 🔧 amountMatch:", !!amountMatch, amountMatch?.[1]);
      console.log("🏦 🔧 currencyMatch:", !!currencyMatch, currencyMatch?.[1]);

      // Витягуємо суму з amountMatch або currencyMatch
      let amount: number;
      console.log("🏦 ПОЧАТОК ВИТЯГУВАННЯ СУМИ:");
      console.log("🏦 amountMatch:", amountMatch);
      console.log("🏦 currencyMatch:", currencyMatch);
      
      if (amountMatch) {
        const amountStr = amountMatch[1].replace(',', '.'); // Українські коми → крапки
        amount = parseFloat(amountStr);
        console.log("🏦 ✅ Сума з amountMatch:", amount);
      } else if (currencyMatch) {
        // Якщо amountMatch не знайдено, спробуємо витягти з currencyMatch
        const amountStr = currencyMatch[1].replace(',', '.'); // Українські коми → крапки
        amount = parseFloat(amountStr);
        console.log("🏦 ✅ Сума з currencyMatch:", amount);
      } else {
        console.log("🏦 ❌ Не вдалося знайти суму в email");
        return null;
      }
      
      console.log("🏦 ОТРИМАНА СУМА:", amount, "тип:", typeof amount, "isNaN:", isNaN(amount));

      // Для карткових операцій accountMatch може бути відсутнім
      if (!operationMatch || isNaN(amount) || !correspondentMatch) {
        console.log("🏦 Не вдалося розпізнати основні поля банківського повідомлення");
        console.log("🏦 НОВИЙ DEBUG: operationMatch:", !!operationMatch, "amount:", amount, "isNaN(amount):", isNaN(amount), "correspondentMatch:", !!correspondentMatch);
        return null;
      }

      console.log("🏦 ✅ УСПІШНО РОЗПІЗНАНО EMAIL! Переходимо до обробки платежу");
      console.log("🏦 ✅ operation:", operationMatch[1], "amount:", amount, "correspondent:", correspondentMatch[1]);

      const vatAmount = vatMatch ? parseFloat(vatMatch[1].replace(',', '.')) : undefined;

      let invoiceDate: Date | undefined;
      if (dateMatch) {
        const datePart = dateMatch[1];
        console.log(`🏦 Знайдено дату в тексті: "${datePart}"`);
        
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
            console.log(`🏦 ⚠️ Не вдалося розпізнати рік у даті: "${datePart}"`);
            year = new Date().getFullYear().toString(); // Fallback на поточний рік
          }
          
          try {
            invoiceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            // КРИТИЧНИЙ FIX: Перевіряємо чи дата валідна
            if (isNaN(invoiceDate.getTime())) {
              console.error(`🏦 ❌ Створена дата невалідна: "${datePart}" → Invalid Date`);
              invoiceDate = undefined;
            } else {
              console.log(`🏦 ✅ Розпізнано дату (старий алгоритм): ${datePart} → ${invoiceDate.toLocaleDateString('uk-UA')}`);
            }
          } catch (error) {
            console.error(`🏦 ❌ Помилка створення дати з "${datePart}":`, error);
            invoiceDate = undefined;
          }
        }
      }

      // Очищаємо operationType від зайвих символів і тексту (включно з комами)
      const cleanOperationType = operationMatch[1].trim().split('\n')[0].trim().replace(/[,\.;]+$/, '');
      
      console.log("🏦 Очищена operationType:", cleanOperationType);
      console.log("🏦 Перевірка чи це 'зараховано':", cleanOperationType === "зараховано");
      console.log("🏦 🆕 НОВА ЛОГІКА: isFullInvoiceNumber:", isFullInvoiceNumber);
      console.log("🏦 🆕 НОВА ЛОГІКА: partialInvoiceNumber:", partialInvoiceNumber);
      console.log("🏦 🆕 НОВА ЛОГІКА: invoiceNumber:", invoiceNumber);
      console.log("🏦 Повертаю результат з operationType:", cleanOperationType);

      // КРИТИЧНЕ ВИПРАВЛЕННЯ: Автоматичне додавання префіксу РМ00- до часткових номерів
      let finalInvoiceNumber = invoiceNumber;
      let finalPartialInvoiceNumber = partialInvoiceNumber;
      
      if (partialInvoiceNumber && !isFullInvoiceNumber) {
        // Додаємо префікс РМ00- до часткового номера для правильного пошуку
        const paddedNumber = partialInvoiceNumber.padStart(6, '0'); // 27779 → 027779
        finalInvoiceNumber = `РМ00-${paddedNumber}`; // РМ00-027779
        console.log(`🏦 ✅ АВТОПЕРЕТВОРЕННЯ: ${partialInvoiceNumber} → ${finalInvoiceNumber}`);
      }

      // Витягуємо валюту правильно з currencyMatch
      console.log("🏦 🔧 ПОЧАТОК ВИТЯГУВАННЯ ВАЛЮТИ:");
      console.log("🏦 🔧 currencyMatch:", currencyMatch);
      console.log("🏦 🔧 currencyMatch.length:", currencyMatch?.length);
      
      let currency = "UAH"; // За замовчуванням
      if (currencyMatch) {
        // Перший regex: валюта в [1] групі
        // Другий regex: сума в [1], валюта в [2] групі  
        if (currencyMatch.length === 2) {
          // Перший regex: /валюта.*?:\s*([A-Z]{3})/i
          currency = currencyMatch[1];
          console.log("🏦 🔧 Валюта з regex 1 (group[1]):", currency);
        } else if (currencyMatch.length === 3) {
          // Другий regex: /(\d+[,\.]\d+)\s*(UAH|USD|EUR)/i
          currency = currencyMatch[2];
          console.log("🏦 🔧 Валюта з regex 2 (group[2]):", currency);
        }
      }
      
      console.log("🏦 🔧 ОСТАТОЧНА ВИТЯГНУТА ВАЛЮТА:", currency);

      return {
        accountNumber: accountMatch?.[1] || "CARD_OPERATION", // Для карткових операцій
        currency: currency,
        operationType: cleanOperationType,
        amount: amount,
        correspondent: correspondentMatch[1].trim(),
        paymentPurpose: purposeMatch?.[1]?.trim() || "",
        invoiceNumber: finalInvoiceNumber || undefined,
        partialInvoiceNumber: finalPartialInvoiceNumber,
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
      console.log(`🏦 processPayment called with notificationId=${notificationId}, paymentInfo:`, paymentInfo);
      console.log(`🏦 DEBUG: emailContent provided at start: ${!!emailContent}`);
      
      // Перевіряємо, чи це операція зарахування
      console.log(`🏦 DEBUG operationType: "${paymentInfo.operationType}"`);
      if (!paymentInfo.operationType || paymentInfo.operationType !== "зараховано") {
        console.log(`🏦⏭️ Пропускаємо: operationType = "${paymentInfo.operationType}" (не зараховано)`);
        return { success: false, message: `Операція "${paymentInfo.operationType}" пропущена` };
      }
      
      let order = null;
      let searchDetails = "";

      // РОЗУМНИЙ ПОШУК ЗАМОВЛЕНЬ - НОВИЙ АЛГОРИТМ
      console.log(`🏦 🔍 РОЗУМНИЙ ПОШУК ПОЧАТОК`);
      console.log(`🏦 🔍 paymentInfo.invoiceNumber = "${paymentInfo.invoiceNumber}"`);
      console.log(`🏦 🔍 paymentInfo.isFullInvoiceNumber = ${paymentInfo.isFullInvoiceNumber}`);
      console.log(`🏦 🔍 paymentInfo.partialInvoiceNumber = "${paymentInfo.partialInvoiceNumber}"`);
      
      if (paymentInfo.invoiceNumber) {
        if (paymentInfo.isFullInvoiceNumber) {
          // Якщо є повний номер типу РМ00-027689, шукаємо точно
          console.log(`🏦 📋 ПОВНИЙ НОМЕР: Пошук за ${paymentInfo.invoiceNumber}`);
          order = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
          console.log(`🏦 📋 ПОВНИЙ НОМЕР результат:`, order ? `✅ Знайдено ID ${order.id}` : '❌ НЕ ЗНАЙДЕНО');
          searchDetails += `Пошук за повним номером: ${paymentInfo.invoiceNumber}`;
          
          // Для повних номерів можемо перевірити суму, але це не критично
          if (order && paymentInfo.amount) {
            const orderTotal = parseFloat(order.totalAmount?.toString() || '0');
            const paymentAmount = parseFloat(paymentInfo.amount.toString());
            
            console.log(`🏦 📋 Перевірка співпадіння суми: ${orderTotal} vs ${paymentAmount}`);
            
            if (orderTotal === paymentAmount) {
              console.log(`🏦✅ PERFECT! Повний номер + точна сума: ${paymentInfo.invoiceNumber} = ${paymentAmount} UAH`);
            } else {
              console.log(`🏦⚠️ Повний номер знайдено, але сума відрізняється: ${orderTotal} vs ${paymentAmount}. Приймаємо все одно.`);
              // НЕ скидаємо order для повних номерів - якщо номер правильний, то це наше замовлення
            }
          }
        } else {
          // Якщо частковий номер типу "27741", використовуємо комплексний пошук
          console.log(`🏦 🔍 ЧАСТКОВИЙ НОМЕР: Спочатку пробуємо простий пошук за ${paymentInfo.invoiceNumber}`);
          order = await storage.getOrderByInvoiceNumber(paymentInfo.invoiceNumber);
          
          if (order) {
            console.log(`🏦 🔍 ✅ Частковий номер знайдено простим пошуком: ID ${order.id}`);
            searchDetails += `Простий пошук частково: ${paymentInfo.invoiceNumber}`;
          } else {
            console.log(`🏦 🔍 ❌ Частковий номер НЕ знайдено простим пошуком. Переходимо до розширеного пошуку.`);
            // Перейдемо до розширеного пошуку нижче
          }
        }
      }

      // РОЗШИРЕНИЙ ПОШУК для часткових номерів або коли основний пошук не дав результатів
      if (!order) {
        console.log("🔍 🎯 РОЗШИРЕНИЙ ПОШУК замовлення за комплексними критеріями...");
        
        // Використовуємо частковий номер з paymentInfo якщо є
        let partialNumber = paymentInfo.partialInvoiceNumber || paymentInfo.invoiceNumber;
        
        // Якщо номер має формат РМ00-, витягуємо числову частину
        if (partialNumber && partialNumber.startsWith('РМ00-')) {
          const match = partialNumber.match(/РМ00-(\d+)/);
          if (match) {
            partialNumber = match[1];
            console.log(`🔍 📋 Витягуємо числову частину з ${partialNumber}: ${partialNumber}`);
          }
        }
        
        // Створюємо об'єкт для розширеного пошуку
        const searchCriteria: any = {};
        
        if (partialNumber) {
          searchCriteria.partialInvoiceNumber = partialNumber;
          console.log(`🔍 🎯 Додаємо частковий номер до пошуку: ${partialNumber}`);
        }
        
        if (paymentInfo.invoiceDate) {
          searchCriteria.invoiceDate = paymentInfo.invoiceDate;
          console.log(`🔍 📅 Додаємо дату рахунку: ${paymentInfo.invoiceDate}`);
        }
        
        if (paymentInfo.correspondent) {
          searchCriteria.correspondent = paymentInfo.correspondent;
          console.log(`🔍 👤 Додаємо клієнта: ${paymentInfo.correspondent}`);
        }
        
        if (paymentInfo.amount) {
          searchCriteria.amount = paymentInfo.amount;
          console.log(`🔍 💰 Додаємо суму: ${paymentInfo.amount} UAH`);
        }

        console.log(`🔍 🎯 Критерії розширеного пошуку:`, searchCriteria);
        const foundOrders = await storage.findOrdersByPaymentInfo(searchCriteria);
        
        if (foundOrders.length > 0) {
          console.log(`🔍 ✅ Знайдено ${foundOrders.length} замовлень за розширеним пошуком`);
          
          // ПРІОРИТИЗАЦІЯ: Точне співпадіння суми має найвищий пріоритет
          if (paymentInfo.amount && foundOrders.length > 1) {
            const paymentAmount = parseFloat(paymentInfo.amount.toString());
            console.log(`🔍 💰 Шукаємо серед ${foundOrders.length} замовлень з точним співпадінням суми ${paymentAmount}`);
            
            for (const foundOrder of foundOrders) {
              const orderTotal = parseFloat(foundOrder.totalAmount?.toString() || '0');
              console.log(`🔍 💰 Перевіряємо замовлення ${foundOrder.invoiceNumber}: ${orderTotal} UAH`);
              
              if (orderTotal === paymentAmount) {
                order = foundOrder;
                console.log(`🔍✅ PERFECT MATCH! ${foundOrder.invoiceNumber} = ${paymentAmount} UAH`);
                break;
              }
            }
          }
          
          // Якщо точного співпадіння суми немає, беремо перше найближче
          if (!order) {
            order = foundOrders[0];
            console.log(`🔍 📋 Взято найкраще з результатів пошуку: ${order.invoiceNumber}`);
          }
          
          searchDetails += `, розширений пошук: ${JSON.stringify(searchCriteria)}`;
        } else {
          console.log(`🔍 ❌ Розширений пошук не дав результатів для критеріїв:`, searchCriteria);
        }
      }

      // FALLBACK ЛОГІКА: Якщо замовлення не знайдено за номером рахунку, шукаємо за кореспондентом та сумою
      if (!order && paymentInfo.correspondent && paymentInfo.amount) {
        console.log("🔄 FALLBACK: Пошук останнього замовлення за кореспондентом та сумою...");
        console.log(`🔄 Критерії: кореспондент="${paymentInfo.correspondent}", сума=${paymentInfo.amount}`);
        
        try {
          // Шукаємо останнє замовлення з точним співпадінням суми та кореспондента
          const fallbackOrders = await storage.query(`
            SELECT o.*, c.name as client_name 
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            WHERE c.name ILIKE $1 AND o.total_amount = $2::numeric
            ORDER BY o.created_at DESC
            LIMIT 5
          `, [`%${paymentInfo.correspondent}%`, paymentInfo.amount.toString()]);
          
          if (fallbackOrders.length > 0) {
            order = fallbackOrders[0]; // Беремо найновіше замовлення
            console.log(`🔄✅ FALLBACK УСПІШНИЙ: Знайдено замовлення #${order.id} (${order.invoice_number || order.invoiceNumber}) для клієнта "${order.client_name}"`);
            console.log(`🔄 Деталі: сума ${order.total_amount || order.totalAmount} UAH, дата ${order.created_at}`);
            searchDetails += `, fallback пошук за кореспондентом та сумою`;
            
            // Конвертуємо snake_case до camelCase для сумісності
            if (order.invoice_number && !order.invoiceNumber) {
              order.invoiceNumber = order.invoice_number;
            }
            if (order.total_amount && !order.totalAmount) {
              order.totalAmount = order.total_amount;
            }
          } else {
            console.log(`🔄❌ FALLBACK: Не знайдено замовлень для кореспондента="${paymentInfo.correspondent}" та суми=${paymentInfo.amount}`);
          }
        } catch (fallbackError) {
          console.error("🔄❌ FALLBACK ERROR:", fallbackError);
          searchDetails += `, fallback пошук failed: ${fallbackError.message}`;
        }
      }

      if (!order) {
        console.log(`🔄 DEBUG: Перевіряємо умови для fallback логіки:`);
        console.log(`  - order знайдено: ${!!order}`);
        console.log(`  - correspondent є: ${!!paymentInfo.correspondent} ("${paymentInfo.correspondent}")`);
        console.log(`  - amount є: ${!!paymentInfo.amount} (${paymentInfo.amount})`);
        
        const errorMsg = `Замовлення не знайдено. ${searchDetails}`;
        console.log(`🏦❌ ${errorMsg}`);
        return { success: false, message: errorMsg };
      }

      console.log(`🏦 DEBUG: Found order for payment processing:`, { orderId: order.id, orderNumber: order.invoiceNumber, amount: paymentInfo.amount });

      // Якщо notificationId = 0, це означає що ми тільки перевіряємо існування замовлення
      if (notificationId === 0) {
        console.log(`🏦 Замовлення знайдено: #${order.id} (${order.invoiceNumber}) - повертаємо success без створення платежу`);
        return {
          success: true,
          message: `Замовлення знайдено: #${order.id} (${order.invoiceNumber})`,
          orderId: order.id
        };
      }

      // Оновлюємо статус оплати замовлення тільки якщо notificationId реальний
      console.log(`🏦 DEBUG: Calling updateOrderPaymentStatus...`);
      console.log(`🏦 DEBUG: emailContent provided: ${!!emailContent}`);
      console.log(`🏦 DEBUG: emailDate from header: ${emailContent?.emailDate?.toISOString()}`);
      console.log(`🏦 DEBUG: emailReceivedAt (current logic): ${emailContent?.receivedAt?.toISOString()}`);
      
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
        emailContent?.emailDate || new Date(), // Дата з Email заголовка (Date:) - фактична дата платежу
        emailContent?.receivedAt || new Date()  // Дата отримання email ERP системою
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
      // Очищуємо старі записи з кешу неіснуючих рахунків
      this.cleanupNotFoundCache();
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

            // Шукаємо ВСІ email від банку (включно з прочитаними) БЕЗ часових обмежень
            const bankFromAddress = emailSettings.bankEmailAddress || 'online@ukrsibbank.com';
            console.log(`🏦 ОБРОБКА ПРОЧИТАНИХ: Пошук за критеріями: від=${bankFromAddress} (весь архів, ВСІ повідомлення)`);
            
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
                      console.log(`🏦✅ ОБРОБКА ПРОЧИТАНИХ: Email ${seqno} оброблено успішно - ${result.message}`);
                    } else if (!result.skipLogging) {
                      console.log(`🏦⚠️ ОБРОБКА ПРОЧИТАНИХ: Email ${seqno}: ${result.message}`);
                    }
                    // Якщо skipLogging === true, то не логуємо - рахунок у кеші

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