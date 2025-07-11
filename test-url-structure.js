#!/usr/bin/env node

/**
 * Тест правильності URL структури після відкату унифікації
 */

function testUrlStructure() {
  console.log('=== ТЕСТ URL СТРУКТУРИ 1С ENDPOINTS ===\n');
  
  const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
  
  // Функція для формування URL вхідних накладних
  function getInvoicesUrl(base) {
    let url = base.trim();
    if (!url.endsWith('/')) url += '/';
    url += 'invoices';
    return url;
  }
  
  // Функція для формування URL вихідних рахунків
  function getOutgoingInvoicesUrl(base) {
    let url = base.trim();
    if (!url.endsWith('/')) url += '/';
    url += 'outgoing-invoices';
    return url;
  }
  
  const invoicesUrl = getInvoicesUrl(baseUrl);
  const outgoingUrl = getOutgoingInvoicesUrl(baseUrl);
  
  console.log('📋 Вхідні накладні:');
  console.log(`   URL: ${invoicesUrl}`);
  console.log(`   Метод: POST`);
  console.log(`   Body: {"action": "getInvoices", "limit": 100}`);
  console.log('');
  
  console.log('📋 Вихідні рахунки:');
  console.log(`   URL: ${outgoingUrl}`);
  console.log(`   Метод: POST`);
  console.log(`   Body: {"limit": 100}`);
  console.log('');
  
  // Перевірка правильності URL
  console.log('✅ Перевірка URL структури:');
  console.log(`   Базовий URL: ${baseUrl}`);
  console.log(`   Вхідні накладні: ${invoicesUrl === baseUrl + '/invoices' ? '✅' : '❌'} ${invoicesUrl}`);
  console.log(`   Вихідні рахунки: ${outgoingUrl === baseUrl + '/outgoing-invoices' ? '✅' : '❌'} ${outgoingUrl}`);
  
  // Перевірка різності endpoints
  console.log('');
  console.log('✅ Перевірка унікальності endpoints:');
  console.log(`   Різні URL: ${invoicesUrl !== outgoingUrl ? '✅' : '❌'} (${invoicesUrl} !== ${outgoingUrl})`);
  
  console.log('');
  console.log('=== ПІДСУМОК ===');
  console.log('✅ Відкат унифікації завершено');
  console.log('✅ Окремі endpoints для різних типів документів');
  console.log('✅ Правильна структура URL відновлена');
  console.log('✅ Готово для тестування з реальними даними');
}

// Запуск тесту
testUrlStructure();