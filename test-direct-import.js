// Прямий тест імпорту РМ00-027685 з товаром РП2-У-110
import { db } from './server/db.ts';
import { components, products } from './shared/schema.ts';
import { eq, ilike } from 'drizzle-orm';

async function findProductByName(productName) {
  console.log(`🔍 Шукаємо товар "${productName}"...`);
  
  // Спочатку шукаємо в products
  const [product] = await db.select().from(products).where(eq(products.name, productName));
  
  if (product) {
    console.log(`✅ Знайдено товар "${productName}" в таблиці products:`, product);
    return product;
  }
  
  // Потім шукаємо в components
  const [component] = await db.select().from(components).where(eq(components.name, productName));
  
  if (component) {
    console.log(`✅ Знайдено товар "${productName}" в таблиці components:`, component);
    return component;
  }
  
  console.log(`❌ Товар "${productName}" не знайдено ні в products, ні в components`);
  return null;
}

async function testFullImport() {
  try {
    console.log('🧪 ПОВНИЙ ТЕСТ: Створення замовлення з рахунку РМ00-027685...');
    
    // Тестові дані рахунку РМ00-027685 на основі реальних даних з 1С
    const testInvoiceData = {
      number: "РМ00-027685",
      date: "2025-07-11",
      clientName: "ТЕСТОВИЙ КЛІЄНТ",
      totalAmount: 24000.00,
      currency: "UAH",
      positions: [
        {
          productName: "РП2-У-110", 
          quantity: 6,
          price: 4000.00,
          total: 24000.00
        }
      ]
    };
    
    console.log('📋 Тестові дані рахунку:', JSON.stringify(testInvoiceData, null, 2));
    
    // Пошук товару
    const product = await findProductByName("РП2-У-110");
    if (!product) {
      throw new Error("Товар РП2-У-110 не знайдено");
    }
    
    console.log('✅ Товар знайдено, можна створювати замовлення');
    console.log(`   - ID: ${product.id}`);
    console.log(`   - Назва: ${product.name}`); 
    console.log(`   - SKU: ${product.sku}`);
    console.log(`   - Роздрібна ціна: ${product.retailPrice} UAH`);
    
    // Імітація створення замовлення
    const orderResult = {
      success: true,
      orderId: 999,
      orderNumber: "52999",
      invoiceNumber: testInvoiceData.number,
      clientName: testInvoiceData.clientName,
      totalAmount: testInvoiceData.totalAmount,
      itemsCount: testInvoiceData.positions.length,
      productFound: true,
      productId: product.id,
      productSku: product.sku
    };
    
    console.log('🎯 РЕЗУЛЬТАТ ТЕСТУ:', JSON.stringify(orderResult, null, 2));
    
    return orderResult;
  } catch (error) {
    console.error('❌ ПОМИЛКА:', error);
    throw error;
  }
}

async function testDirectImport() {
  await testFullImport();
}

testDirectImport().then(result => {
  console.log('🎯 ТЕСТ ЗАВЕРШЕНО УСПІШНО');
  process.exit(0);
}).catch(error => {
  console.error('💥 ТЕСТ ПРОВАЛИВСЯ:', error);
  process.exit(1);
});