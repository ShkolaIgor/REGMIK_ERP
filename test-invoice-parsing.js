// Детальний тест парсингу банківського повідомлення для старого та нового рахунків

const testInvoiceParsing = async () => {
  try {
    console.log('🧪 === ДЕТАЛЬНИЙ ТЕСТ ПАРСИНГУ БАНКІВСЬКИХ ПОВІДОМЛЕНЬ ===\n');
    
    // Тест 1: Старий рахунок з правильним форматом
    console.log('📋 ТЕСТ 1: Старий рахунок (2013) з правильним форматом...');
    const oldInvoiceEmailContent = `
Subject: Повідомлення про операцію по картковому рахунку
Date: Mon, 21 Jul 2025 13:32:17 +0300 (EEST)

<br>Банк відправник: УКРСІББАНК<br>
<br>  09:15 <br> рух коштів по карт-рахунку<br>
<br>зг. рах. № 999999 від 15.01.2013р.<br>
<br>сумма: 12345.67<br>
<br>тип операції: зараховано<br>
<br>корреспондент: Тестова компанія для старого рахунку ТОВ<br>
<br>призначення платежу: Оплата за товари зг. рах. №999999 від 15.01.2013р., у т.ч. ПДВ 20% - 2057.61 грн.<br>
    `;
    
    const response1 = await fetch('http://localhost:5000/api/test-universal-invoice-parsing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: oldInvoiceEmailContent
      })
    });
    
    const result1 = await response1.json();
    console.log('   Парсинг старого рахунку:', result1.foundInvoice ? '✅ УСПІШНО' : '❌ НЕ ЗНАЙДЕНО');
    if (result1.foundInvoice) {
      console.log(`   Номер: ${result1.foundInvoice}`);
      console.log(`   Причина: ${result1.reason || 'не вказано'}`);
    }
    
    // Тест 2: Новий рахунок з правильним форматом
    console.log('\n📋 ТЕСТ 2: Новий рахунок (2025) з правильним форматом...');
    const newInvoiceEmailContent = `
Subject: Повідомлення про операцію по картковому рахунку
Date: Mon, 21 Jul 2025 13:32:17 +0300 (EEST)

<br>Банк відправник: УКРСІББАНК<br>
<br>  14:25 <br> рух коштів по карт-рахунку<br>
<br>зг. рах. № 27435 від 11.06.2025р.<br>
<br>сумма: 39535.20<br>
<br>тип операції: зараховано<br>
<br>корреспондент: Товариство з обмеженою відповідальністю "АГРО-ОВЕН"<br>
<br>призначення платежу: Оплата за термоперетворювач, датчик вологості та температури зг. рах. 27435 від 11.06.2025р., у т.ч. ПДВ 20% - 6589.20 грн.<br>
    `;
    
    const response2 = await fetch('http://localhost:5000/api/test-universal-invoice-parsing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputText: newInvoiceEmailContent
      })
    });
    
    const result2 = await response2.json();
    console.log('   Парсинг нового рахунку:', result2.foundInvoice ? '✅ УСПІШНО' : '❌ НЕ ЗНАЙДЕНО');
    if (result2.foundInvoice) {
      console.log(`   Номер: ${result2.foundInvoice}`);
      console.log(`   Причина: ${result2.reason || 'не вказано'}`);
    }
    
    // Тест 3: Прямий тест банківського email аналізу
    console.log('\n📋 ТЕСТ 3: Прямий тест банківського email аналізу...');
    const response3 = await fetch('http://localhost:5000/api/test-bank-email-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: oldInvoiceEmailContent,
        emailFrom: 'online@ukrsibbank.com'
      })
    });
    
    const result3 = await response3.json();
    console.log('   Аналіз старого email:', result3.success ? '✅ УСПІШНО' : '❌ НЕ ВДАЛОСЯ');
    if (result3.paymentInfo) {
      console.log(`   Номер рахунку: ${result3.paymentInfo.invoiceNumber}`);
      console.log(`   Дата рахунку: ${result3.paymentInfo.invoiceDate}`);
      console.log(`   Сума: ${result3.paymentInfo.amount}`);
      console.log(`   Кореспондент: ${result3.paymentInfo.correspondent}`);
    }
    
    console.log('\n🎯 === ВИСНОВКИ ===');
    console.log('   📌 Парсинг банківських повідомлень:');
    console.log(`   📌 Старий рахунок (2013): ${result1.foundInvoice ? 'знайдено' : 'не знайдено'}`);
    console.log(`   📌 Новий рахунок (2025): ${result2.foundInvoice ? 'знайдено' : 'не знайдено'}`);
    console.log(`   📌 Email аналіз: ${result3.success ? 'працює' : 'не працює'}`);
    
    if (result1.foundInvoice && result2.foundInvoice && result3.success) {
      console.log('\n🎯 === НАСТУПНИЙ КРОК ===');
      console.log('   ✅ Парсинг працює правильно');
      console.log('   ➡️  Потрібно протестувати 6-місячний фільтр у банківському процесингу');
      console.log('   ➡️  Старий рахунок повинен бути відхилено через дату');
    }
    
  } catch (error) {
    console.error('❌ Помилка тесту парсингу:', error.message);
  }
};

testInvoiceParsing();