#!/usr/bin/env node

// Тестовий скрипт для перевірки API пошуку міст Nova Poshta
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:5000';

async function testCitiesSearch() {
  console.log('=== Тестування API пошуку міст Nova Poshta ===\n');
  
  const queries = ['че', 'чер', 'черн', 'черні', 'чернігів'];
  
  for (const query of queries) {
    try {
      console.log(`Пошук міст для: "${query}"`);
      
      const response = await fetch(`${baseUrl}/api/nova-poshta/cities?q=${encodeURIComponent(query)}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Помилка HTTP: ${response.status}`);
        continue;
      }
      
      const cities = await response.json();
      console.log(`✅ Знайдено міст: ${cities.length}`);
      
      if (cities.length > 0) {
        console.log(`   Перші 3 міста:`);
        cities.slice(0, 3).forEach((city, index) => {
          console.log(`   ${index + 1}. ${city.Description} (${city.AreaDescription})`);
        });
      }
      
      console.log('');
      
      // Затримка між запитами
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Помилка запиту для "${query}":`, error.message);
    }
  }
  
  console.log('=== Тестування завершено ===');
}

// Запуск тестування
testCitiesSearch().catch(console.error);