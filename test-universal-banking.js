// Тест для перевірки що нова логіка обробляє ВСІ банківські email

async function testUniversalBankingLogic() {
  const baseUrl = 'http://localhost:5000';
  
  // Тестовий email операції списання (без номеру рахунку)
  const testEmailDebiting = {
    messageId: "test-debit-12345",
    subject: "Банківське повідомлення про операцію",
    fromAddress: "online@ukrsibbank.com",
    receivedAt: new Date().toISOString(),
    textContent: `
      <br>12:45<br>
      рух коштів по рахунку: UA743510050000026005031648800,<br>
      валюта: UAH,<br>
      тип операції: списано,<br>
      сумма: 2500.00,<br>
      номер документу: @2PL123456,<br>
      корреспондент: ТЕСТОВА КОМПАНІЯ ТОВ,<br>
      рахунок кореспондента: UA123456789012345678901234567,<br>
      призначення платежу: Оплата за послуги, комісія банку<br>
      клієнт: НВФ "РЕГМІК".<br>
      Інформаційна лінія: 729
    `
  };
  
  // Тестовий email переказу (без номеру рахунку)
  const testEmailTransfer = {
    messageId: "test-transfer-67890",
    subject: "Банківське повідомлення",
    fromAddress: "online@ukrsibbank.com", 
    receivedAt: new Date().toISOString(),
    textContent: `
      <br>14:20<br>
      рух коштів по рахунку: UA743510050000026005031648800,<br>
      валюта: UAH,<br>
      тип операції: переказ,<br>
      сумма: 750.50,<br>
      номер документу: @2PL789012,<br>
      корреспондент: ІНШАБАНК,<br>
      рахунок кореспондента: UA987654321098765432109876543,<br>
      призначення платежу: Міжбанківський переказ коштів<br>
      клієнт: НВФ "РЕГМІК".<br>
    `
  };

  console.log("🔍 Тестування універсальної логіки банківського моніторингу");
  
  try {
    // Тест 1: Операція списання
    console.log("\n📤 Тест 1: Операція списання");
    const response1 = await fetch(`${baseUrl}/api/test-bank-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailContent: testEmailDebiting.textContent })
    });
    
    const result1 = await response1.json();
    console.log("Результат 1:", result1);
    
    // Тест 2: Операція переказу  
    console.log("\n↔️ Тест 2: Операція переказу");
    const response2 = await fetch(`${baseUrl}/api/test-bank-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailContent: testEmailTransfer.textContent })
    });
    
    const result2 = await response2.json();
    console.log("Результат 2:", result2);
    
    // Перевірка статистики
    console.log("\n📊 Перевірка статистики після тестів");
    const statsResponse = await fetch(`${baseUrl}/api/bank-email-stats`);
    const stats = await statsResponse.json();
    console.log("Статистика:", stats);
    
    return { 
      success: true, 
      debitTest: result1, 
      transferTest: result2, 
      stats 
    };
    
  } catch (error) {
    console.error("❌ Помилка тестування:", error);
    return { success: false, error: error.message };
  }
}

// Запуск тесту
testUniversalBankingLogic().then(result => {
  console.log("\n🏁 ФІНАЛЬНИЙ РЕЗУЛЬТАТ:");
  console.log(JSON.stringify(result, null, 2));
}).catch(console.error);