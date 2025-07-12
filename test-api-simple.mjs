/**
 * Простий тест чому frontend не отримує дані
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const express = require('express');
const app = express();

app.use(express.json());

// Простий endpoint який повертає дані з 1С формату
app.get('/api/1c/outgoing-invoices', async (req, res) => {
  console.log("📡 API викликано");
  
  // Точно такі ж дані як з тесту storage
  const data = [
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
  
  console.log(`✅ Повертаємо ${data.length} рахунків`);
  res.json(data);
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Тестовий сервер на порту ${PORT}`);
  console.log("📱 Тепер можна протестувати frontend запити");
  console.log("🌐 URL: http://localhost:5001/api/1c/outgoing-invoices");
});