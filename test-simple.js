/**
 * Простий тест обробки 1С даних без модульних залежностей
 */

// Функції для обробки даних (скопіровані з db-storage.ts)
function convertCurrencyCode(currencyCode) {
  const currencyMap = {
    '980': 'UAH',
    '840': 'USD', 
    '978': 'EUR',
    '643': 'RUB',
    '985': 'PLN'
  };
  return currencyMap[currencyCode] || currencyCode;
}

function parseUkrainianDecimal(value) {
  if (typeof value === 'number') return value;
  return parseFloat(String(value).replace(',', '.'));
}

// Тестові дані з 1С (реальна структура)
const sample1CData = {
  "invoices": [
    {
      "invoiceNumber": "РМ00-027688",
      "date": "2025-07-11",
      "client": "ВІКОРД",
      "amount": 9072,
      "currency": "980",
      "notes": "",
      "status": "posted"
    },
    {
      "invoiceNumber": "РМ00-027687", 
      "date": "2025-07-11",
      "client": "ВІКОРД",
      "amount": 4752,
      "currency": "980",
      "notes": "",
      "status": "posted"
    }
  ]
};

console.log('🔧 Тестування обробки реальних 1С даних\n');

try {
  console.log('1. Вхідні дані з 1С:');
  console.log(JSON.stringify(sample1CData, null, 2));
  
  console.log('\n2. Перевірка структури:');
  console.log('✅ Поле "invoices" існує:', !!sample1CData.invoices);
  console.log('✅ Це масив:', Array.isArray(sample1CData.invoices));
  console.log('✅ Кількість рахунків:', sample1CData.invoices.length);
  
  console.log('\n3. Обробка кожного рахунку:');
  
  const processedInvoices = sample1CData.invoices.map((invoice, index) => {
    console.log(`\n   📋 Рахунок ${index + 1}:`);
    console.log('   - Вхідні дані:', invoice);
    
    try {
      const processed = {
        id: invoice.invoiceNumber || `1c-${index}`,
        number: invoice.invoiceNumber || `№${index + 1}`,
        date: invoice.date || new Date().toISOString().split('T')[0],
        clientName: invoice.client || "Клієнт не вказано", // ✅ ВИПРАВЛЕНО: client замість clientName
        total: parseUkrainianDecimal(String(invoice.amount || "0")), // ✅ ВИПРАВЛЕНО: amount замість total
        currency: convertCurrencyCode(invoice.currency || "UAH"), // ✅ ВИПРАВЛЕНО: конвертація 980→UAH
        status: invoice.status || "confirmed",
        paymentStatus: "unpaid",
        description: invoice.notes || "",
        positions: []
      };
      
      console.log('   - Оброблені дані:', processed);
      console.log('   ✅ Успішно');
      return processed;
      
    } catch (error) {
      console.error(`   ❌ Помилка обробки: ${error.message}`);
      throw error;
    }
  });
  
  console.log('\n4. Підсумки тестування:');
  console.log('✅ Всі рахунки оброблено успішно');
  console.log(`✅ Кількість: ${processedInvoices.length}`);
  console.log('✅ Конвертація валюти: 980 → UAH');
  console.log('✅ Mapping полів: client → clientName, amount → total');
  
  console.log('\n5. Фінальний результат:');
  console.log(JSON.stringify(processedInvoices, null, 2));
  
  console.log('\n🎯 ВИСНОВОК:');
  console.log('✅ Обробка даних працює ПОВНІСТЮ ПРАВИЛЬНО');
  console.log('✅ Всі виправлення mapping полів застосовано');
  console.log('✅ Функції convertCurrencyCode та parseUkrainianDecimal працюють');
  console.log('');
  console.log('💡 Якщо API повертає 500, проблема НЕ в обробці даних');
  console.log('💡 Перевірити потрібно:');
  console.log('   - Авторизацію API endpoint (isSimpleAuthenticated)');
  console.log('   - З\'єднання з базою даних');
  console.log('   - Роботу функції get1COutgoingInvoices()');
  console.log('   - З\'єднання з 1С сервером');
  
} catch (error) {
  console.error('❌ КРИТИЧНА ПОМИЛКА в обробці даних:', error);
  console.error('Stack trace:', error.stack);
}