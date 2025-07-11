#!/usr/bin/env node

// Тест 1С API напряму
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDirect1CConnection() {
  try {
    console.log('🔍 Тестування прямого з\'єднання з 1С...');
    
    // Отримуємо налаштування 1С
    const integrations = await pool.query(`
      SELECT * FROM integration_configs 
      WHERE type = '1c_accounting' AND is_active = true 
      LIMIT 1
    `);
    
    if (integrations.rows.length === 0) {
      console.log('❌ Активна 1С інтеграція не знайдена');
      return;
    }
    
    const config = integrations.rows[0].config;
    console.log('🔧 Використовуємо конфігурацію:', config);
    
    // Тестуємо формування URL для різних endpoints
    const baseUrl = config.baseUrl;
    const invoicesUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'invoices';
    const outgoingUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + 'outgoing-invoices';
    
    console.log(`🌐 Базовий URL: ${baseUrl}`);
    console.log(`📥 URL вхідних накладних: ${invoicesUrl}`);
    console.log(`📤 URL вихідних рахунків: ${outgoingUrl}`);
    
    const testUrl = invoicesUrl;
    
    // Формуємо headers
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'REGMIK-ERP/1.0'
    };
    
    if (config.clientId && config.clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(config.clientId + ':' + config.clientSecret).toString('base64')}`;
      console.log('🔐 Додано Basic авторизацію');
    }
    
    console.log('📤 Відправляємо POST запит з JSON...');
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'getInvoices',
        limit: 50
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`📥 Відповідь: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Контент (перші 500 символів): ${responseText.substring(0, 500)}`);
    
    if (!response.ok) {
      console.log('❌ Помилка:', responseText);
    } else {
      console.log('✅ З\'єднання успішне');
      
      // Спробуємо парсити JSON
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ JSON валідний, кількість записів:', Array.isArray(jsonData) ? jsonData.length : 'не масив');
        
        // Тест вихідних рахунків
        console.log('\n📤 Тестування вихідних рахунків...');
        const outgoingResponse = await fetch(outgoingUrl, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'getOutgoingInvoices',
            limit: 20
          }),
          signal: AbortSignal.timeout(10000)
        });
        
        console.log(`📤 Вихідні рахунки: ${outgoingResponse.status} ${outgoingResponse.statusText}`);
        
        if (outgoingResponse.ok) {
          const outgoingText = await outgoingResponse.text();
          console.log(`📤 Вихідні дані (перші 200 символів): ${outgoingText.substring(0, 200)}`);
          
          try {
            const outgoingData = JSON.parse(outgoingText);
            console.log('✅ Вихідні рахунки JSON валідний, кількість:', Array.isArray(outgoingData) ? outgoingData.length : 'не масив');
          } catch (e) {
            console.log('⚠️ Вихідні рахунки - відповідь не є валідним JSON');
          }
        } else {
          console.log(`❌ Помилка вихідних рахунків: ${outgoingResponse.status}`);
        }
        
      } catch (parseError) {
        console.log('⚠️ Відповідь не є валідним JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ ПОМИЛКА тестування:', error.message);
    if (error.name === 'AbortError') {
      console.error('⏰ Тайм-аут запиту (більше 10 секунд)');
    }
  } finally {
    await pool.end();
  }
}

testDirect1CConnection();