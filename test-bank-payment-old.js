// Простий тест для перевірки фільтру 6 місяців

const testBankPaymentOld = async () => {
  try {
    // Тестове банківське повідомлення з номером 999999 (2013 рік)
    const bankEmailContent = `
    Операція: зараховано
    Сума: 12345.67 грн
    Кореспондент: ТестКомпанія ТОВ
    Призначення платежу: Оплата за товар згідно рах. № 999999 від 15 січня 2013 р.
    Дата: 15 січня 2013 р.
    `;
    
    console.log('🧪 Тестуємо банківський платіж для старого рахунку 2013 року...');
    
    const response = await fetch('http://localhost:5000/api/test-bank-payment-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: bankEmailContent
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('🧪 Результат обробки старого рахунку:', JSON.stringify(result, null, 2));
    
    // Перевіряємо чи система правильно відфільтрувала старий рахунок
    if (result.success === false) {
      if (result.message.includes('старше 6 місяців') || 
          result.message.includes('не знайдено замовлення') ||
          result.analysisResult?.paymentInfo?.invoiceNumber === 'РМ00-999999') {
        console.log('✅ УСПІХ: Система правильно відфільтрувала старий рахунок 2013 року');
        console.log('   Платіж НЕ був оброблений для старого рахунку');
      } else {
        console.log('⚠️  УВАГА: Платіж не оброблено, але причина може бути інша');
      }
    } else {
      console.log('❌ ПРОБЛЕМА: Система НЕ відфільтрувала старий рахунок або помилка в логіці');
      console.log('   Платіж був оброблений для рахунку старше 6 місяців!');
    }
    
  } catch (error) {
    console.error('❌ Помилка тесту:', error.message);
  }
};

testBankPaymentOld();