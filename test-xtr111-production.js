/**
 * Тест алгоритму XTR111 зіставлення - повна діагностика production проблеми
 */

import { DatabaseStorage } from './server/db-storage.js';

async function testXTR111ProductionIssue() {
  console.log('🔥 =======  ТЕСТ XTR111 PRODUCTION ПРОБЛЕМИ =======');
  
  const storage = new DatabaseStorage();
  
  try {
    console.log('🔍 1. Перевіряємо всі компоненти з XTR та XL у базі...');
    const allComponents = await storage.getComponents();
    const relevantComponents = allComponents.filter(c => 
      c.name.toLowerCase().includes('xtr') || 
      c.name.toLowerCase().includes('xl2596')
    );
    
    console.log('📋 Знайдені релевантні компоненти:');
    relevantComponents.forEach(c => {
      console.log(`   - ID: ${c.id}, Назва: "${c.name}"`);
    });
    
    console.log('\n🔍 2. Перевіряємо існуючі зіставлення...');
    const mappings = await storage.getProductNameMappings();
    const xtrMappings = mappings.filter(m => 
      m.externalProductName.toLowerCase().includes('xtr')
    );
    
    console.log('📋 Існуючі зіставлення XTR:');
    xtrMappings.forEach(m => {
      console.log(`   - "${m.externalProductName}" → "${m.erpProductName}" (ID: ${m.erpProductId}, confidence: ${m.confidence})`);
    });
    
    console.log('\n🔍 3. Тестуємо прямий алгоритм findSimilarComponent...');
    const directResult = await storage.findSimilarComponent("Мікросхема XTR111");
    console.log('🎯 Результат прямого алгоритму:', directResult);
    
    console.log('\n🔍 4. Тестуємо повний алгоритм findProductByAlternativeName...');
    const fullResult = await storage.findProductByAlternativeName("Мікросхема XTR111", "1C");
    console.log('🎯 Результат повного алгоритму:', fullResult);
    
    console.log('\n🔍 5. Видаляємо існуючі зіставлення та тестуємо знову...');
    // Видаляємо зіставлення
    await storage.deleteProductNameMapping("Мікросхема XTR111", "1C");
    
    const cleanResult = await storage.findProductByAlternativeName("Мікросхема XTR111", "1C");
    console.log('🎯 Результат без зіставлень:', cleanResult);
    
    console.log('\n🔥 =======  ЗАВЕРШЕННЯ ТЕСТУ =======');
    
  } catch (error) {
    console.error('❌ Помилка під час тестування:', error);
  }
}

// Запускаємо тест
testXTR111ProductionIssue().catch(console.error);