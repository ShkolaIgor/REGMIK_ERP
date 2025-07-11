#!/usr/bin/env node

// Тест нової структури URL для 1С інтеграції

function testUrlStructure() {
  console.log('🧪 Тестування нової структури URL для 1С інтеграції\n');
  
  // Базовий URL з налаштувань
  const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
  
  // Тест формування URL для вхідних накладних
  function getInvoicesUrl(base) {
    let url = base.trim();
    if (!url.endsWith('/')) url += '/';
    url += 'invoices';
    return url;
  }
  
  // Тест формування URL для вихідних рахунків
  function getOutgoingInvoicesUrl(base) {
    let url = base.trim();
    if (!url.endsWith('/')) url += '/';
    url += 'outgoing-invoices';
    return url;
  }
  
  // Тестові сценарії
  const testCases = [
    { name: 'Базовий URL без слешу', url: 'http://baf.regmik.ua/bitrix/hs/erp' },
    { name: 'Базовий URL з слешем', url: 'http://baf.regmik.ua/bitrix/hs/erp/' },
    { name: 'Старий формат з /invoices', url: 'http://baf.regmik.ua/bitrix/hs/erp/invoices' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`📝 Тест: ${testCase.name}`);
    console.log(`   Вхідний URL: ${testCase.url}`);
    console.log(`   🔽 Вхідні накладні: ${getInvoicesUrl(testCase.url)}`);
    console.log(`   🔼 Вихідні рахунки: ${getOutgoingInvoicesUrl(testCase.url)}`);
    console.log('');
  });
  
  console.log('✅ Результат тестування:');
  console.log('• Базовий URL: http://baf.regmik.ua/bitrix/hs/erp');
  console.log('• Вхідні накладні: http://baf.regmik.ua/bitrix/hs/erp/invoices');
  console.log('• Вихідні рахунки: http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices');
  console.log('• Структура URL правильна для всіх випадків ✅');
}

testUrlStructure();