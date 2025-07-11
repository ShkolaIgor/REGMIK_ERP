import { storage } from './server/db-storage.ts';

// Прямий тест імпорту вихідних рахунків
async function testDirectImport() {
  console.log('🔍 Тестування прямого імпорту вихідних рахунків...\n');
  
  try {
    // Створимо тестовий рахунок для імпорту
    const testInvoice = {
      id: 'test-outgoing-001',
      number: 'РР-2025-001',
      date: '2025-01-11',
      clientName: 'ТОВ "Тестовий клієнт"',
      clientTaxCode: '12345678',
      total: '15000.00',
      currency: 'UAH',
      status: 'paid',
      items: [
        {
          name: 'Тестовий товар 1',
          quantity: '10',
          unit: 'шт',
          price: '1000.00',
          total: '10000.00'
        },
        {
          name: 'Тестовий товар 2', 
          quantity: '5',
          unit: 'шт',
          price: '1000.00',
          total: '5000.00'
        }
      ]
    };

    console.log('1. Тестування методу generateOrderNumber...');
    const orderNumber = await storage.generateOrderNumber();
    console.log(`✅ Згенеровано номер замовлення: ${orderNumber}`);

    console.log('\n2. Тестування імпорту рахунку...');
    
    // Імпортуємо рахунок (симуляція import1COutgoingInvoice)
    console.log(`Імпорт рахунку: ${testInvoice.number}`);
    console.log(`Клієнт: ${testInvoice.clientName}`);
    console.log(`Сума: ${testInvoice.total} ${testInvoice.currency}`);
    console.log(`Позицій: ${testInvoice.items.length}`);
    
    // Перевіримо чи є клієнт
    console.log('\n3. Пошук клієнта...');
    let client = await storage.getClientByTaxCode(testInvoice.clientTaxCode);
    
    if (!client) {
      console.log('Клієнт не знайдений, створюю нового...');
      client = await storage.createClient({
        name: testInvoice.clientName,
        taxCode: testInvoice.clientTaxCode,
        fullName: testInvoice.clientName,
        clientTypeId: 1,
        statusId: 1,
        isActive: true
      });
      console.log(`✅ Створено клієнта ID: ${client.id}`);
    } else {
      console.log(`✅ Знайдено клієнта ID: ${client.id}`);
    }

    // Створимо замовлення 
    console.log('\n4. Створення замовлення...');
    const order = await storage.createOrder({
      orderNumber: orderNumber,
      clientId: client.id,
      status: 'completed',
      orderDate: new Date(testInvoice.date),
      totalAmount: testInvoice.total,
      currency: testInvoice.currency,
      notes: `Імпортовано з 1С рахунок ${testInvoice.number}`,
      invoiceNumber: testInvoice.number
    });
    
    console.log(`✅ Створено замовлення ID: ${order.id}, номер: ${order.orderNumber}`);

    console.log('\n5. Створення позицій замовлення...');
    for (const item of testInvoice.items) {
      // Знайдемо або створимо товар
      let product = await storage.getProductByName(item.name);
      
      if (!product) {
        console.log(`Створюю товар: ${item.name}`);
        product = await storage.createProduct({
          name: item.name,
          sku: `1C-${Date.now()}`,
          categoryId: 1,
          unit: item.unit,
          retailPrice: item.price,
          costPrice: item.price,
          isActive: true
        });
        console.log(`✅ Створено товар ID: ${product.id}`);
      } else {
        console.log(`✅ Знайдено товар ID: ${product.id}`);
      }

      // Створимо позицію замовлення
      await storage.createOrderItem({
        orderId: order.id,
        productId: product.id,
        quantity: parseInt(item.quantity),
        unitPrice: item.price,
        totalPrice: item.total
      });
      
      console.log(`✅ Додано позицію: ${item.name} x ${item.quantity}`);
    }

    console.log('\n🎉 ТЕСТ ЗАВЕРШЕНО УСПІШНО!');
    console.log(`Створено замовлення #${order.orderNumber} для клієнта "${client.name}"`);
    console.log(`Загальна сума: ${testInvoice.total} ${testInvoice.currency}`);
    console.log(`Позицій товарів: ${testInvoice.items.length}`);
    
  } catch (error) {
    console.error('❌ Помилка тестування:', error.message);
    console.error(error.stack);
  }
}

// Запуск тесту
testDirectImport().catch(console.error);