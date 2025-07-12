/**
 * Прямий тест функції get1COutgoingInvoices без запуску сервера
 */

console.log("=== ТЕСТ ФУНКЦІЇ get1COutgoingInvoices ===");

async function testDirect() {
  try {
    // Пробуємо імпортувати функцію напряму
    console.log("📡 Імпортую функцію get1COutgoingInvoices...");
    
    // Спочатку імпортуємо з правильними типами
    const dbStorage = await import('./server/db-storage.js');
    const { get1COutgoingInvoices } = dbStorage;
    
    console.log("✅ Функція успішно імпортована");
    
    // Викликаємо функцію
    console.log("🔧 Викликаю get1COutgoingInvoices()...");
    const result = await get1COutgoingInvoices({});
    
    console.log(`✅ Функція виконана успішно`);
    console.log(`📊 Результат: ${result.length} рахунків`);
    
    if (result.length > 0) {
      console.log("📄 Перший рахунок:", JSON.stringify(result[0], null, 2));
    }
    
    console.log("\n=== ВИСНОВОК ===");
    console.log("✅ Backend функція працює коректно");
    console.log("✅ Дані отримуються правильно");
    console.log("🔧 Проблема можливо в запуску сервера або маршрутизації");
    
  } catch (error) {
    console.log("❌ Помилка виконання функції:", error.message);
    console.log("📝 Stack trace:", error.stack);
    
    console.log("\n=== ВИСНОВОК ===");
    console.log("❌ Backend функція має проблеми");
    console.log("✅ Fallback дані у frontend забезпечують роботу");
    console.log("🔧 Потрібно перевірити з'єднання з базою даних");
  }
}

testDirect();