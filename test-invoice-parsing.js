// Тест парсингу номерів рахунків

function testInvoiceParsing() {
  const testCases = [
    {
      purpose: "за комплектуючі згідно рах.№ 27751 від 22.07.25., клієнт: НВФ 'РЕГМІК'",
      expected: "27751",
      description: "Формат рах.№ XXXXX"
    },
    {
      purpose: "Оплата за товар згідно рах №27759 від 22.07.2025 р. В т.ч. ПДВ 20%: 174,00 грн",
      expected: "27759", 
      description: "Формат рах №XXXXX"
    },
    {
      purpose: "Сплата за ТМЦ зг.дог. № БВ 17/07-2023 від 17.07.2023 в т.ч. ПДВ",
      expected: null,
      description: "Номер договору, не рахунок"
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n=== ТЕСТ ${index + 1}: ${testCase.description} ===`);
    console.log(`Призначення: "${testCase.purpose}"`);
    
    // Застосовую мій новий regex
    const purposeInvoiceMatch = testCase.purpose.match(/рах\.?\s*№?\s*(\d+)/i);
    const result = purposeInvoiceMatch ? purposeInvoiceMatch[1] : null;
    
    console.log(`Очікувано: ${testCase.expected}`);
    console.log(`Отримано: ${result}`);
    console.log(`Результат: ${result === testCase.expected ? "✅ ПРОЙШОВ" : "❌ НЕ ПРОЙШОВ"}`);
  });
}

testInvoiceParsing();