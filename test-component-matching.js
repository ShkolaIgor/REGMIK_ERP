// Тест алгоритму зіставлення компонентів
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Імітуємо API запит до нашого сервера
async function testCheckItemMapping(itemName) {
  try {
    const response = await fetch('http://localhost:5000/api/1c/invoices/check-mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemName })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ ПОМИЛКА запиту для "${itemName}":`, error.message);
    return { isMapped: false, error: error.message };
  }
}

async function testComponentMatching() {
  console.log('🧪 ТЕСТУВАННЯ АЛГОРИТМУ ЗІСТАВЛЕННЯ КОМПОНЕНТІВ');
  
  // Тестові назви з реальних накладних 1С
  const testCases = [
    'Мікроконтролер STM32F107VCT6',
    'Стабілітрон BZX84C3V3', 
    'DF10S',
    'РП2-У-110',
    'Резистор 1кОм',
    'Конденсатор 100мкФ',
    'Невідомий товар 12345'
  ];
  
  console.log('\n📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ:');
  console.log('='.repeat(60));
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Тестуємо: "${testCase}"`);
    
    const result = await testCheckItemMapping(testCase);
    
    if (result.isMapped) {
      console.log(`✅ ЗНАЙДЕНО: ${testCase} → ${result.mappedComponentName} (ID: ${result.mappedComponentId})`);
    } else {
      console.log(`❌ НЕ ЗНАЙДЕНО: ${testCase}`);
      if (result.error) {
        console.log(`   Помилка: ${result.error}`);
      }
    }
    
    // Невелика затримка між запитами
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🏁 ТЕСТ ЗАВЕРШЕНО');
}

// Запускаємо тест
testComponentMatching().catch(console.error);