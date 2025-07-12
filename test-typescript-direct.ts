/**
 * Прямий тест TypeScript функції get1COutgoingInvoices
 */

import { get1COutgoingInvoices } from './server/db-storage';

console.log("=== ТЕСТ ФУНКЦІЇ get1COutgoingInvoices (TypeScript) ===");

async function testDirectTS() {
  try {
    console.log("🔧 Викликаю get1COutgoingInvoices()...");
    
    const result = await get1COutgoingInvoices({});
    
    console.log(`✅ Функція виконана успішно`);
    console.log(`📊 Результат: ${result.length} рахунків`);
    
    if (result.length > 0) {
      console.log("📄 Перший рахунок:");
      console.log(JSON.stringify(result[0], null, 2));
    }
    
  } catch (error) {
    console.log("❌ Помилка виконання функції:", error.message);
    console.log("🔧 Fallback дані у frontend забезпечують роботу");
  }
}

testDirectTS();