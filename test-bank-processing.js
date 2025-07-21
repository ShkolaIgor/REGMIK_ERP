// Тест обробки банківських повідомлень
import { bankEmailService } from './server/bank-email-service.js';

async function testBankProcessing() {
  try {
    console.log("🏦 Тестування обробки банківських повідомлень...");
    
    const result = await bankEmailService.processUnprocessedNotifications();
    
    console.log("Результат обробки:");
    console.log(`  Успішно оброблено: ${result.processed}`);
    console.log(`  Помилок: ${result.failed}`);
    console.log(`  Деталі:`);
    result.details.forEach(detail => console.log(`    ${detail}`));
    
  } catch (error) {
    console.error("❌ Помилка тестування:", error);
  }
}

testBankProcessing();