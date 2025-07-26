// Прямий тест банківського сервісу з старим рахунком

const testOldInvoice = async () => {
  try {
    console.log('🧪 === ТЕСТ БАНКІВСЬКОГО СЕРВІСУ З СТАРИМ РАХУНКОМ ===\n');
    
    // Імітуємо банківське повідомлення зі старим рахунком РМ00-999999 (2013)
    const oldInvoiceEmailContent = `
<br>Банк відправник: УКРСІББАНК<br>
<br>  09:15 <br> рух коштів по карт-рахунку<br>
<br>зг. рах. № 999999 від 15.01.2013р.<br>
<br>сумма: 12345.67<br>
<br>тип операції: зараховано<br>
<br>корреспондент: Тестова компанія для старого рахунку ТОВ<br>
<br>призначення платежу: Оплата за товари зг. рах. №999999 від 15.01.2013р., у т.ч. ПДВ 20% - 2057.61 грн.,<br>
    `;
    
    console.log('📋 Імітуємо банківське повідомлення для старого рахунку...');
    console.log('📄 Рахунок: РМ00-999999');
    console.log('📅 Дата: 15.01.2013 (більше 12 років тому)');
    console.log('💰 Сума: 12345.67 UAH\n');
    
    // Відправляємо через тестовий endpoint
    const response = await fetch('http://localhost:5000/api/test-bank-payment-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: oldInvoiceEmailContent
      })
    });
    
    const result = await response.json();
    
    console.log('🏦 === РЕЗУЛЬТАТ БАНКІВСЬКОГО ОБРОБКИ ===');
    console.log(`Статус: ${result.success ? 'УСПІХ' : 'ВІДХИЛЕНО'}`);
    console.log(`Повідомлення: ${result.message || 'Не вказано'}`);
    
    if (result.analysisResult) {
      console.log('\n📊 Аналіз повідомлення:');
      console.log(`   Номер рахунку: ${result.analysisResult.paymentInfo?.invoiceNumber}`);
      console.log(`   Сума: ${result.analysisResult.paymentInfo?.amount}`);
      console.log(`   Дата рахунку: ${result.analysisResult.paymentInfo?.invoiceDate}`);
    }
    
    console.log('\n🎯 === ОЧІКУВАНИЙ РЕЗУЛЬТАТ ===');
    console.log('   📌 Старий рахунок (2013) повинен бути ВІДХИЛЕНО через 6-місячний фільтр');
    console.log('   📌 Система повинна повернути success: false');
    console.log('   📌 Повідомлення повинно вказувати на застарілість рахунку');
    
    console.log('\n🔍 === ВИСНОВОК ===');
    if (!result.success) {
      if (result.message && result.message.includes('6 місяц')) {
        console.log('   ✅ СИСТЕМА ПРАЦЮЄ ІДЕАЛЬНО');
        console.log('   ✅ Старий рахунок відхилено через 6-місячний фільтр');
        console.log('   ✅ Повідомлення про помилку коректне');
      } else {
        console.log('   ⚠️  СИСТЕМА ЧАСТКОВО ПРАЦЮЄ');
        console.log('   ✅ Старий рахунок відхилено');
        console.log('   ❓ Причина відхилення може бути іншою');
      }
    } else {
      console.log('   ❌ КРИТИЧНА ПРОБЛЕМА');
      console.log('   ❌ Старий рахунок НЕ відхилено системою');
      console.log('   ❌ 6-місячний фільтр НЕ працює');
    }
    
  } catch (error) {
    console.error('❌ Помилка тесту старого рахунку:', error.message);
    console.log('\n🔧 Можлива причина: Тестовий endpoint може бути недоступний');
    console.log('🔧 Спробуйте запустити тест через інший механізм');
  }
};

testOldInvoice();