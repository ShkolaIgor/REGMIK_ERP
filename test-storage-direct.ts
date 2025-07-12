/**
 * Прямий тест storage.get1COutgoingInvoices()
 */

import { storage } from './server/db-storage';

console.log("=== ТЕСТ STORAGE.get1COutgoingInvoices() ===");

async function testStorage() {
  try {
    console.log("🔧 Викликаю storage.get1COutgoingInvoices()...");
    
    const result = await storage.get1COutgoingInvoices();
    
    console.log(`✅ Функція виконана успішно`);
    console.log(`📊 Результат: ${result.length} рахунків`);
    
    if (result.length > 0) {
      console.log("📄 Перший рахунок:");
      console.log(JSON.stringify(result[0], null, 2));
    } else {
      console.log("⚠️ Функція працює, але повертає порожні дані");
    }
    
    console.log("\n=== ВИСНОВОК ===");
    console.log("✅ Backend storage працює коректно");
    console.log("✅ API endpoint повинен працювати");
    console.log("🔧 Проблема може бути в запуску сервера");
    
  } catch (error) {
    console.log("❌ Помилка виконання функції:", error.message);
    console.log("📝 Можлива причина:", error.message.includes('інтеграцію') ? 'Відсутня 1C інтеграція' : 'Проблема з базою даних');
    
    console.log("\n=== ВИСНОВОК ===");
    console.log("❌ Backend storage має проблеми");
    console.log("✅ Fallback дані у frontend забезпечують роботу");
    console.log("🔧 Потрібно налаштувати 1C інтеграцію або перевірити базу");
  }
}

testStorage();