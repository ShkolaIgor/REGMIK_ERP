import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Конфігурація локального поштового клієнта
const transporter = nodemailer.createTransporter({
  host: 'localhost',
  port: 1025, // Для тестування з MailHog або подібним
  secure: false,
  auth: {
    user: 'test@regmik.ua',
    pass: 'test'
  },
  // Для продакшену можна налаштувати SMTP
  // або використовувати Gmail SMTP
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: '"REGMIK ERP" <noreply@regmik.ua>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function generatePasswordResetEmail(username: string, resetToken: string, resetUrl: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Скидання паролю - REGMIK ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REGMIK ERP</h1>
          <h2>Скидання паролю</h2>
        </div>
        <div class="content">
          <p>Вітаємо, <strong>${username}</strong>!</p>
          
          <p>Ви отримали цей лист, оскільки був запитаний скидання паролю для вашого облікового запису в системі REGMIK ERP.</p>
          
          <p>Для скидання паролю натисніть на кнопку нижче:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Скинути пароль</a>
          </div>
          
          <p>Або скопіюйте та вставте це посилання у браузер:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Важливо:</strong>
            <ul>
              <li>Це посилання діє протягом 1 години</li>
              <li>Після використання посилання воно стане недійсним</li>
              <li>Якщо ви не запитували скидання паролю, проігноруйте цей лист</li>
            </ul>
          </div>
          
          <p>Якщо у вас виникли питання, зверніться до адміністратора системи.</p>
        </div>
        <div class="footer">
          <p>© 2025 REGMIK ERP. Всі права захищені.</p>
          <p>Цей лист було надіслано автоматично, не відповідайте на нього.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
REGMIK ERP - Скидання паролю

Вітаємо, ${username}!

Ви отримали цей лист, оскільки був запитаний скидання паролю для вашого облікового запису в системі REGMIK ERP.

Для скидання паролю перейдіть за посиланням:
${resetUrl}

⚠️ ВАЖЛИВО:
- Це посилання діє протягом 1 години
- Після використання посилання воно стане недійсним
- Якщо ви не запитували скидання паролю, проігноруйте цей лист

Якщо у вас виникли питання, зверніться до адміністратора системи.

© 2025 REGMIK ERP. Всі права захищені.
Цей лист було надіслано автоматично, не відповідайте на нього.
  `;

  return { html, text };
}

export function generateRegistrationConfirmationEmail(username: string, confirmationToken: string, confirmationUrl: string): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Підтвердження реєстрації - REGMIK ERP</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REGMIK ERP</h1>
          <h2>Підтвердження реєстрації</h2>
        </div>
        <div class="content">
          <p>Вітаємо, <strong>${username}</strong>!</p>
          
          <p>Дякуємо за реєстрацію в системі REGMIK ERP. Для завершення реєстрації необхідно підтвердити вашу електронну адресу.</p>
          
          <p>Натисніть на кнопку нижче для підтвердження:</p>
          
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">Підтвердити реєстрацію</a>
          </div>
          
          <p>Або скопіюйте та вставте це посилання у браузер:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">${confirmationUrl}</p>
          
          <div class="info">
            <strong>ℹ️ Інформація:</strong>
            <ul>
              <li>Це посилання діє протягом 24 годин</li>
              <li>Після підтвердження ви зможете увійти в систему</li>
              <li>Якщо ви не реєструвалися, проігноруйте цей лист</li>
            </ul>
          </div>
          
          <p>Після підтвердження електронної адреси ви зможете увійти в систему та почати роботу.</p>
        </div>
        <div class="footer">
          <p>© 2025 REGMIK ERP. Всі права захищені.</p>
          <p>Цей лист було надіслано автоматично, не відповідайте на нього.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
REGMIK ERP - Підтвердження реєстрації

Вітаємо, ${username}!

Дякуємо за реєстрацію в системі REGMIK ERP. Для завершення реєстрації необхідно підтвердити вашу електронну адресу.

Для підтвердження перейдіть за посиланням:
${confirmationUrl}

ℹ️ ІНФОРМАЦІЯ:
- Це посилання діє протягом 24 годин
- Після підтвердження ви зможете увійти в систему
- Якщо ви не реєструвалися, проігноруйте цей лист

Після підтвердження електронної адреси ви зможете увійти в систему та почати роботу.

© 2025 REGMIK ERP. Всі права захищені.
Цей лист було надіслано автоматично, не відповідайте на нього.
  `;

  return { html, text };
}