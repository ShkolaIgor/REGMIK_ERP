#!/usr/bin/env node

// Простий тест для виявлення проблеми з 1C fallback логікою
// Симулюємо виклики до get1COutgoingInvoices

console.log('🧪 ТЕСТ: Перевірка логіки 1C вихідних рахунків');

// Симулуємо успішну відповідь від 1С
const simulateReal1CResponse = () => {
  console.log('\n📊 СЦЕНАРІЙ 1: Успішна відповідь від 1С');
  
  const mockRealData = {
    invoices: [
      {
        invoiceNumber: "РМ00-027688", 
        client: "ТОВ РЕАЛЬНИЙ КЛІЄНТ",
        amount: "9072.00",
        currency: "980",
        date: "2025-07-11",
        status: "confirmed",
        positions: [
          {
            productName: "Метал профіль реальний",
            quantity: 10,
            price: 907.20,
            total: 9072.00
          }
        ]
      }
    ],
    total: 1,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ Реальні дані з 1С:', JSON.stringify(mockRealData, null, 2));
  console.log('🎯 Очікуваний результат: Система має повернути ці реальні дані');
  
  return mockRealData;
};

// Симулуємо помилку мережі
const simulateNetworkError = () => {
  console.log('\n❌ СЦЕНАРІЙ 2: Помилка мережі (1С недоступна)');
  
  const networkError = new TypeError('fetch failed: ENOTFOUND baf.regmik.ua');
  console.log('💥 Мережева помилка:', networkError.message);
  console.log('🎯 Очікуваний результат: Fallback дані');
  
  throw networkError;
};

// Симулуємо timeout помилку  
const simulateTimeoutError = () => {
  console.log('\n⏰ СЦЕНАРІЙ 3: Timeout помилка');
  
  const timeoutError = new Error('Тайм-аут запиту до 1С після 8 секунд');
  console.log('💥 Timeout помилка:', timeoutError.message);
  console.log('🎯 Очікуваний результат: Fallback дані');
  
  throw timeoutError;
};

// Тестуємо логіку
console.log('\n🔧 ДІАГНОСТИКА ПОТОЧНОЇ ПРОБЛЕМИ:');
console.log('❌ Система завжди показує fallback дані (РП-000001, РП-000002)');
console.log('✅ Має показувати реальні дані коли 1С доступна (РМ00-027688)');

console.log('\n💡 ПІДОЗРА:');
console.log('- get1COutgoingInvoices() може передчасно повертати fallback');
console.log('- routes.ts може неправильно обробляти успішні відповіді');
console.log('- frontend може показувати кешовані fallback дані');

try {
  simulateReal1CResponse();
  console.log('\n✅ ВИСНОВОК: Якщо 1С повертає дані - система має їх показати');
} catch (error) {
  console.log('\n❌ Неочікувана помилка в тесті:', error);
}

console.log('\n🔍 НАСТУПНІ КРОКИ:');
console.log('1. Перевірити чи get1COutgoingInvoices() правильно обробляє успішні відповіді');
console.log('2. Переконатися що routes.ts не застосовує fallback при успіху');
console.log('3. Очистити кеш frontend та перевірити API відповіді');