/**
 * Тест API endpoint без запуску повного сервера
 */

const express = require('express');
const app = express();

// Налаштування CORS та middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Симулюємо storage з простими даними
const mockStorage = {
  async get1COutgoingInvoices() {
    console.log("🔧 Mock storage викликано");
    
    // Повертаємо прості тестові дані
    return [
      {
        id: "РМ00-027688",
        number: "РМ00-027688", 
        date: "2025-07-11",
        clientName: "ВІКОРД",
        total: 9072,
        currency: "UAH",
        status: "posted",
        paymentStatus: "unpaid",
        description: "",
        clientTaxCode: "",
        itemsCount: 0,
        managerName: "",
        positions: []
      },
      {
        id: "РМ00-027687",
        number: "РМ00-027687",
        date: "2025-07-11", 
        clientName: "ВІКОРД",
        total: 4752,
        currency: "UAH",
        status: "posted",
        paymentStatus: "unpaid", 
        description: "",
        clientTaxCode: "",
        itemsCount: 0,
        managerName: "",
        positions: []
      }
    ];
  }
};

// API endpoint
app.get('/api/1c/outgoing-invoices', async (req, res) => {
  console.log("📡 API Endpoint викликано: GET /api/1c/outgoing-invoices");
  
  try {
    const invoices = await mockStorage.get1COutgoingInvoices();
    console.log(`✅ Повертаємо ${invoices.length} рахунків`);
    
    res.json(invoices);
  } catch (error) {
    console.error("❌ Помилка API:", error.message);
    res.status(500).json({ 
      error: error.message,
      details: "Mock API test endpoint"
    });
  }
});

// Запускаємо тестовий сервер
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Тестовий API сервер запущено на порту ${PORT}`);
  console.log(`🌐 Тестуйте: http://localhost:${PORT}/api/1c/outgoing-invoices`);
});

// Робимо тестовий запит
setTimeout(async () => {
  try {
    console.log("\n🧪 Виконуємо тестовий запит...");
    const response = await fetch(`http://localhost:${PORT}/api/1c/outgoing-invoices`);
    const data = await response.json();
    
    console.log("📊 Результат тесту:");
    console.log("- Status:", response.status);
    console.log("- Data length:", data.length);
    console.log("- First item:", JSON.stringify(data[0], null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Тестовий запит неуспішний:", error.message);
    process.exit(1);
  }
}, 1000);