/**
 * Прямий тест API endpoint для вихідних рахунків 1С
 */

async function testDirect1CConnection() {
  const baseUrl = process.env.REPL_URL ? `https://${process.env.REPL_URL}` : 'http://localhost:5000';
  const endpoint = `${baseUrl}/api/1c/outgoing-invoices`;
  
  console.log('🔍 Тестування прямого з\'єднання з 1С API');
  console.log(`📡 URL: ${endpoint}`);
  
  try {
    // Симулюємо авторизацію (якщо потрібна)
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 HTTP статус: ${response.status} ${response.statusText}`);
    console.log('📋 Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    console.log(`📄 Response body length: ${responseText.length} символів`);
    console.log(`📄 Response body (перші 500 символів):`);
    console.log(responseText.substring(0, 500));
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ JSON успішно парситься');
        console.log(`📊 Кількість рахунків: ${Array.isArray(data) ? data.length : 'Не масив'}`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('📋 Перший рахунок:');
          console.log(JSON.stringify(data[0], null, 2));
        }
      } catch (jsonError) {
        console.error('❌ Помилка парсингу JSON:', jsonError.message);
        console.error('🔧 Можливо проблема з кодуванням або структурою відповіді');
      }
    } else {
      console.error('❌ HTTP помилка');
      
      try {
        const errorData = JSON.parse(responseText);
        console.error('📄 Деталі помилки:');
        console.error(JSON.stringify(errorData, null, 2));
      } catch {
        console.error('📄 Текст помилки:', responseText);
      }
    }
    
  } catch (networkError) {
    console.error('❌ Мережева помилка:', networkError.message);
    console.error('🔧 Можливо сервер не запущений або недоступний');
  }
}

// Запускаємо тест
testDirect1CConnection().catch(console.error);