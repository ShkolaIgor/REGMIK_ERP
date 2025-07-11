import http from 'http';

// Тестування імпорту вихідних рахунків з 1C
async function testOutgoingInvoicesImport() {
  console.log('🔍 Тестування імпорту вихідних рахунків з 1C...\n');
  
  // 1. Отримуємо список вихідних рахунків
  console.log('1. Завантаження вихідних рахунків...');
  const outgoingInvoices = await makeRequest('/api/1c/outgoing-invoices', 'GET');
  
  if (!outgoingInvoices || outgoingInvoices.length === 0) {
    console.log('❌ Вихідні рахунки не знайдені');
    return;
  }
  
  console.log(`✅ Знайдено ${outgoingInvoices.length} вихідних рахунків:`);
  outgoingInvoices.forEach((invoice, index) => {
    console.log(`   ${index + 1}. ${invoice.number} (${invoice.clientName}) - ${invoice.total} ${invoice.currency}`);
  });
  
  console.log('\n2. Тестування імпорту першого рахунку...');
  const firstInvoice = outgoingInvoices[0];
  
  try {
    const importResult = await makeRequest(`/api/1c/outgoing-invoices/${firstInvoice.id}/import`, 'POST');
    console.log('✅ Імпорт успішний:');
    console.log(`   Створено замовлення: ${importResult.orderNumber}`);
    console.log(`   Клієнт: ${importResult.clientName}`);
    console.log(`   Позицій товарів: ${importResult.totalItems}`);
    console.log(`   Сума: ${importResult.totalAmount}`);
    console.log(`   Статус: ${importResult.status}`);
    console.log(`   Повідомлення: ${importResult.message}`);
  } catch (error) {
    console.log('❌ Помилка імпорту:', error.message);
  }
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        // Додаємо базову авторизацію для тестування
        'Authorization': 'Basic ' + Buffer.from('demo:demo123').toString('base64')
      }
    };

    if (data && method !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsedResponse = JSON.parse(responseBody);
            resolve(parsedResponse);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
          }
        } catch (e) {
          reject(new Error(`JSON Parse Error: ${e.message}. Raw response: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Запускаємо тест
testOutgoingInvoicesImport().catch(console.error);