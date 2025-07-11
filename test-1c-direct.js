/**
 * Прямий тест API endpoint для вихідних рахунків 1С
 */

import http from 'http';

async function testDirect1CConnection() {
  console.log('🔧 Прямий тест 1С вихідних рахунків API\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/1c/outgoing-invoices',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    console.log('📡 Відправляємо запит на http://localhost:3000/api/1c/outgoing-invoices');
    
    const req = http.request(options, (res) => {
      console.log(`📊 Статус відповіді: ${res.statusCode}`);
      console.log('📋 Headers:', res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📄 Сирі дані відповіді:');
        console.log(data);
        
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            console.log('\n✅ JSON парсинг успішний');
            console.log(`📊 Тип даних: ${Array.isArray(jsonData) ? 'Array' : typeof jsonData}`);
            console.log(`📊 Кількість рахунків: ${Array.isArray(jsonData) ? jsonData.length : 'не масив'}`);
            
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              console.log('\n📋 Перший рахунок:');
              console.log(JSON.stringify(jsonData[0], null, 2));
            } else {
              console.log('\n⚠️  Масив порожній або дані не є масивом');
            }
            
            resolve(jsonData);
          } else {
            console.log(`\n❌ HTTP помилка ${res.statusCode}`);
            try {
              const errorData = JSON.parse(data);
              console.log('📋 Деталі помилки:', errorData);
            } catch {
              console.log('📋 Текст помилки:', data);
            }
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (parseError) {
          console.error('❌ Помилка парсингу JSON:', parseError);
          console.log('📄 Проблемний контент:', data);
          reject(parseError);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Помилка мережевого з\'єднання:', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ Тайм-аут запиту');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(10000); // 10 секунд тайм-аут
    req.end();
  });
}

// Запуск тесту
console.log('🚀 Запуск прямого тесту 1С API...\n');

testDirect1CConnection()
  .then((result) => {
    console.log('\n🎯 РЕЗУЛЬТАТ ТЕСТУВАННЯ:');
    console.log('✅ API endpoint працює');
    console.log('✅ Дані отримано успішно');
    console.log(`✅ Повернуто ${Array.isArray(result) ? result.length : 0} рахунків`);
  })
  .catch((error) => {
    console.log('\n❌ ПРОБЛЕМА З API:');
    console.error(error.message);
    console.log('\n💡 Можливі причини:');
    console.log('   - Сервер не запущений');
    console.log('   - Проблема з авторизацією (isSimpleAuthenticated)');
    console.log('   - Помилка в storage.get1COutgoingInvoices()');
    console.log('   - З\'єднання з 1С сервером недоступне');
  });