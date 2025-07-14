#!/usr/bin/env node

/**
 * ОСТАТОЧНИЙ ТЕСТ АЛГОРИТМУ ЗІСТАВЛЕННЯ КОМПОНЕНТІВ
 * Перевіряє всі типи збігів та блокувань після завершального виправлення
 */

const testCases = [
  // ✅ РЕЗИСТОРИ - новий алгоритм normalizeResistorValue + matchResistorValues
  {
    input: "0603 4,7 kOm",
    expected: "R0603 4,7 kOm 1%",
    type: "РЕЗИСТОРИ",
    description: "Номінал резистора без префіксу → з префіксом R"
  },
  
  // ✅ МІКРОСХЕМИ - новий алгоритм extractEnglishParts
  {
    input: "Мікросхема TNY274GN-TL",
    expected: "TNY274GN-TL", 
    type: "МІКРОСХЕМИ",
    description: "Витягування англійських частин з кирилично-англійської назви"
  },
  
  // ✅ МІКРОСХЕМИ - числові збіги (існуючий алгоритм)
  {
    input: "Мікросхема XTR111",
    expected: "XTR 111  AIDGQR",
    type: "МІКРОСХЕМИ", 
    description: "Числовий збіг з компонентом (390 score)"
  },
  
  // ✅ ДІОДИ - високоякісні збіги кодів (існуючий алгоритм)  
  {
    input: "Діод BAT54CW",
    expected: "BAT54C",
    type: "ДІОДИ",
    description: "Високоякісний збіг коду діода (1700 score)"
  },
  
  // ❌ БЛОКУВАННЯ - низький score відкидається
  {
    input: "Микросхема LD1117S33TR",
    expected: null,
    type: "БЛОКУВАННЯ",
    description: "Дуже низький score (10) - система повинна відкинути результат"
  },
  
  // ❌ БЛОКУВАННЯ - категорійне блокування
  {
    input: "Фреза концевая 12мм",
    expected: null, 
    type: "БЛОКУВАННЯ",
    description: "Фреза не може бути метчиком - категорійне блокування"
  }
];

async function runTests() {
  console.log('🧪 ПОЧАТОК ОСТАТОЧНОГО ТЕСТУВАННЯ АЛГОРИТМУ');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔍 ТЕСТ ${i + 1}: ${testCase.type}`);
    console.log(`📝 Опис: ${testCase.description}`);
    console.log(`📥 Вхід: "${testCase.input}"`);
    console.log(`🎯 Очікуваний результат: ${testCase.expected || 'НЕ ЗНАЙДЕНО'}`);
    
    try {
      const encodedInput = encodeURIComponent(testCase.input);
      const response = await fetch(`http://localhost:5000/api/1c/invoices/check-mapping/${encodedInput}`);
      const result = await response.json();
      
      const actualComponent = result.found ? result.component.name : null;
      const isCorrect = actualComponent === testCase.expected;
      
      console.log(`📤 Фактичний результат: ${actualComponent || 'НЕ ЗНАЙДЕНО'}`);
      
      if (isCorrect) {
        console.log('✅ ТЕСТ ПРОЙДЕНО');
        passed++;
      } else {
        console.log('❌ ТЕСТ НЕ ПРОЙДЕНО');
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ПОМИЛКА ТЕСТУ: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('📊 ПІДСУМКИ ТЕСТУВАННЯ:');
  console.log(`✅ Успішно: ${passed}`);
  console.log(`❌ Невдало: ${failed}`);
  console.log(`📈 Відсоток успіху: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('🎉 УСІХ ТЕСТИ ПРОЙДЕНО! АЛГОРИТМ ГОТОВИЙ ДЛЯ PRODUCTION!');
  } else {
    console.log('⚠️  Є проблеми, які потребують виправлення');
  }
}

// Запуск тестів
runTests().catch(console.error);