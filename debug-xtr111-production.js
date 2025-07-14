/**
 * Production debugging для XTR111 проблеми - фокус на англійських назвах
 */

import { DatabaseStorage } from './server/db-storage.js';

async function debugXTR111Production() {
  console.log('🔥 DEBUG XTR111 PRODUCTION - АНГЛІЙСЬКІ НАЗВИ');
  
  const storage = new DatabaseStorage();
  
  try {
    // 1. Показати всі XTR/XL компоненти з їх англійськими назвами
    console.log('\n📋 ВСІ XTR/XL КОМПОНЕНТИ В БАЗІ:');
    const allComponents = await storage.getComponents();
    const relevantComponents = allComponents.filter(c => 
      c.name.toLowerCase().includes('xtr') || 
      c.name.toLowerCase().includes('xl2596')
    );
    
    relevantComponents.forEach(c => {
      console.log(`   ID: ${c.id}, Назва: "${c.name}"`);
      
      // Показати нормалізацію
      const normalized = c.name.toLowerCase()
        .replace(/[а-яёії]/g, (char) => {
          const map = {
            'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'у': 'y', 'х': 'x', 'ф': 'f', 'і': 'i', 'ї': 'i', 'є': 'e', 'ґ': 'g'
          };
          return map[char] || char;
        })
        .replace(/[^\w]/g, '');
      
      console.log(`       Нормалізовано: "${normalized}"`);
      
      // Показати коди моделей
      const codes = normalized.match(/[a-z]+\d+[a-z]*/g) || [];
      console.log(`       Коди моделей: [${codes.join(', ')}]`);
    });
    
    // 2. Тестувати пошук з детальним логуванням
    console.log('\n🔍 ТЕСТ ПОШУКУ "Мікросхема XTR111":');
    
    const testName = "Мікросхема XTR111";
    const testNormalized = testName.toLowerCase()
      .replace(/[а-яёії]/g, (char) => {
        const map = {
          'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'у': 'y', 'х': 'x', 'ф': 'f', 'і': 'i', 'ї': 'i', 'є': 'e', 'ґ': 'g'
        };
        return map[char] || char;
      })
      .replace(/[^\w]/g, '');
      
    console.log(`Нормалізований пошук: "${testNormalized}"`);
    
    const testCodes = testNormalized.match(/[a-z]+\d+[a-z]*/g) || [];
    console.log(`Коди в пошуку: [${testCodes.join(', ')}]`);
    
    // 3. Перевірити кожен компонент на збіг
    console.log('\n🔍 ДЕТАЛЬНА ПЕРЕВІРКА КОЖНОГО КОМПОНЕНТА:');
    
    relevantComponents.forEach(component => {
      const compNormalized = component.name.toLowerCase()
        .replace(/[а-яёії]/g, (char) => {
          const map = {
            'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't', 'у': 'y', 'х': 'x', 'ф': 'f', 'і': 'i', 'ї': 'i', 'є': 'e', 'ґ': 'g'
          };
          return map[char] || char;
        })
        .replace(/[^\w]/g, '');
        
      const compCodes = compNormalized.match(/[a-z]+\d+[a-z]*/g) || [];
      
      console.log(`\n   Компонент: "${component.name}" (ID: ${component.id})`);
      console.log(`   Нормалізований: "${compNormalized}"`);
      console.log(`   Коди: [${compCodes.join(', ')}]`);
      
      // Перевірити збіги кодів
      const exactMatches = testCodes.filter(testCode => 
        compCodes.some(compCode => testCode === compCode || compCode.includes(testCode) || testCode.includes(compCode))
      );
      
      if (exactMatches.length > 0) {
        console.log(`   ✅ ЗБІГ КОДІВ: [${exactMatches.join(', ')}]`);
        
        // Розрахувати score
        let score = 0;
        exactMatches.forEach(match => {
          score += match.length * 100; // Базовий score за збіг
          if (compCodes.some(code => code === match)) {
            score += 1500; // Бонус за точний збіг
          }
        });
        
        console.log(`   📊 SCORE: ${score}`);
      } else {
        console.log(`   ❌ Немає збігів кодів`);
      }
    });
    
    // 4. Виконати реальний алгоритм
    console.log('\n🎯 РЕАЛЬНИЙ РЕЗУЛЬТАТ АЛГОРИТМУ:');
    const result = await storage.findSimilarComponent(testName);
    
    if (result) {
      console.log(`✅ Знайдено: "${result.name}" (ID: ${result.id})`);
    } else {
      console.log(`❌ Не знайдено`);
    }
    
    // 5. Перевірити обмеження в запитах
    console.log('\n🔍 ПЕРЕВІРКА ОБМЕЖЕНЬ У ЗАПИТАХ:');
    console.log(`Загальна кількість компонентів: ${allComponents.length}`);
    console.log(`XTR/XL компонентів: ${relevantComponents.length}`);
    
    // Шукати .limit() в коді
    console.log('\nПерервемо аналіз для виправлення коду...');
    
  } catch (error) {
    console.error('❌ Помилка:', error);
  }
}

// Запускаємо
debugXTR111Production().catch(console.error);