// Тест імпорту одного рахунку з позицією "РП2-У-110"
const testInvoice = {
  id: "TEST-РП2-У-110",
  number: "TEST-РП2-У-110",
  date: "2025-07-12",
  client: "Тестовий клієнт",
  total: 1000,
  currency: "UAH",
  positions: [
    {
      productName: "РП2-У-110",
      quantity: 1,
      price: 1000,
      total: 1000
    }
  ]
};

// Відправляємо POST запит для імпорту
fetch('http://localhost:5000/api/1c/outgoing-invoices/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    invoices: [testInvoice]
  })
})
.then(response => response.json())
.then(data => console.log('Test import result:', data))
.catch(error => console.error('Test import error:', error));