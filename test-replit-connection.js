/**
 * Тест з'єднання з Replit endpoint
 */

const testData = {
  "invoiceNumb": "РМ00-027625",
  "clientEDRPOU": "35046206", 
  "companyEDRPOU": "32195027",
  "items": [
    {
      "productName": "ТСП-102 Pt100-В3 D6 L150-10000 (-40..270)",
      "quantity": 2,
      "priceAccount": 1337.5,
      "priceBrutto": 1605,
      "measureSymbol": "шт"
    }
  ]
};

console.log("Тестуємо відправку даних до Replit...");
console.log("Дані:", JSON.stringify(testData, null, 2));

fetch('https://f8b5b2ba-8ffe-4b9f-85c7-4b82acc96cfe-00-2vxegxo6dxlmg.picard.replit.dev/api/bitrix/create-order-from-invoice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log("HTTP Status:", response.status);
  return response.text();
})
.then(data => {
  console.log("Відповідь:", data);
  try {
    const json = JSON.parse(data);
    console.log("Parsed JSON:", json);
  } catch (e) {
    console.log("Не JSON відповідь");
  }
})
.catch(error => {
  console.error("Помилка:", error);
});