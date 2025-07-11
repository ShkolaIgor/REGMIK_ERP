/**
 * Діагностика проблеми з 1С вихідними рахунками
 */

// Тестуємо структуру даних з прикладеного файлу
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
  ],
  "total": 100,
  "timestamp": "11.07.2025 23:46:35"
};

console.log('🔍 Діагностика структури даних з 1С\n');

console.log('1. Структура отриманих даних:');
console.log('- Кореневий об\'єкт має поле "invoices" (масив)');
console.log('- Кожен рахунок має поля: invoiceNumber, date, client, amount, currency, notes, status');
console.log('- Валюта приходить як код "980" (потрібна конвертація в UAH)');
console.log('- Назва клієнта в полі "client", а не "clientName"');
console.log('- Сума в полі "amount", а не "total"');

console.log('\n2. Проблеми в обробці:');
console.log('❌ Очікувалось поле "clientName", а приходить "client"');
console.log('❌ Очікувалось поле "total", а приходить "amount"');
console.log('❌ Потрібна конвертація валюти "980" → "UAH"');
console.log('❌ Відсутні позиції товарів (поле "positions")');

console.log('\n3. Тестування обробки першого рахунку:');
const firstInvoice = sample1CData.invoices[0];

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

const processedInvoice = {
  id: firstInvoice.invoiceNumber,
  number: firstInvoice.invoiceNumber,
  date: firstInvoice.date,
  clientName: firstInvoice.client, // ✅ ВИПРАВЛЕНО: client замість clientName
  total: parseUkrainianDecimal(firstInvoice.amount), // ✅ ВИПРАВЛЕНО: amount замість total
  currency: convertCurrencyCode(firstInvoice.currency), // ✅ ВИПРАВЛЕНО: конвертація 980→UAH
  status: firstInvoice.status,
  paymentStatus: "unpaid",
  description: firstInvoice.notes || "",
  positions: [] // ⚠️ ПРОБЛЕМА: немає позицій товарів
};

console.log('Оброблений рахунок:', JSON.stringify(processedInvoice, null, 2));

console.log('\n4. Рекомендації для виправлення:');
console.log('✅ Виправити mapping полів в get1COutgoingInvoices()');
console.log('✅ Додати детальне логування помилок в API endpoint');
console.log('✅ Перевірити чи функція convertCurrencyCode() доступна');
console.log('✅ Додати try-catch для кожного етапу обробки');
console.log('⚠️ Врахувати що позиції товарів можуть бути відсутні');

console.log('\n5. Можлива причина помилки 500:');
console.log('- Помилка в парсингу JSON (десяткові числа з комами)');
console.log('- Невірний mapping полів в processedInvoices');
console.log('- Помилка в convertCurrencyCode() або parseUkrainianDecimal()');
console.log('- Проблема з валідацією структури даних');

console.log('\n🎯 НАСТУПНІ КРОКИ:');
console.log('1. Виправити mapping полів client→clientName, amount→total');
console.log('2. Додати детальне логування в API endpoint');
console.log('3. Протестувати обробку реальних даних');
console.log('4. Перевірити чи працює імпорт після виправлень');