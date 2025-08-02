// Тестовий скрипт для перевірки збереження номеру відділення

const testOrderData = {
  orderNumber: "TEST-12345",
  clientId: 67,
  clientContactsId: 19,
  companyId: 1,
  statusId: 1,
  totalAmount: "1000",
  carrierId: 4, // Нова пошта
  contactEmail: "test@example.com",
  contactPhone: "0501234567",
  recipientCityRef: "TEST-CITY-REF",
  recipientCityName: "Тестове місто",
  recipientWarehouseRef: "TEST-WAREHOUSE-REF", 
  recipientWarehouseAddress: "Тестове відділення",
  recipientWarehouseNumber: "9999", // Ключове поле!
  shippingCost: "50.00",
  notes: "Тест збереження номера відділення"
};

const testItems = [
  {
    productId: null,
    itemName: "Тестовий товар",
    quantity: 1,
    unitPrice: "1000",
    totalPrice: "1000",
    comment: "Тест"
  }
];

console.log("🧪 Тестові дані для створення замовлення:");
console.log("Order data:", JSON.stringify(testOrderData, null, 2));
console.log("Items:", JSON.stringify(testItems, null, 2));
console.log("\n📝 Для продакшн тесту:");
console.log("1. Створіть нове замовлення з цими даними");
console.log("2. Перевірте номер відділення: recipientWarehouseNumber = '9999'");
console.log("3. Збережіть замовлення");
console.log("4. Відкрийте пакувальний лист та шукайте '№9999'");