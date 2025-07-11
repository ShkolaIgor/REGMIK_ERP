#!/usr/bin/env node

/**
 * Діагностика проблеми з 1С вихідними рахунками
 */

async function test1CIntegration() {
    console.log('=== ДІАГНОСТИКА 1С ВИХІДНИХ РАХУНКІВ ===\n');
    
    // Тестуємо формування URL
    const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
    
    console.log('1. Формування URL для вихідних рахунків:');
    let outgoingUrl = baseUrl.trim();
    if (!outgoingUrl.endsWith('/')) outgoingUrl += '/';
    outgoingUrl += 'outgoing-invoices';
    
    console.log(`   Базовий URL: ${baseUrl}`);
    console.log(`   Кінцевий URL: ${outgoingUrl}`);
    console.log(`   Правильно: ${outgoingUrl === 'http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices' ? '✅' : '❌'}`);
    
    // Тестуємо запит
    console.log('\n2. Тестування запиту:');
    const auth = Buffer.from('100:ШкоМ.').toString('base64');
    
    try {
        console.log(`   Відправляємо POST на: ${outgoingUrl}`);
        console.log(`   Авторизація: Basic ${auth.substring(0, 20)}...`);
        console.log(`   Body: {"limit": 100}`);
        
        const response = await fetch(outgoingUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'REGMIK-ERP/1.0'
            },
            body: JSON.stringify({ 
                limit: 100
            })
        });
        
        console.log(`   Статус: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Отримано: ${data.invoices?.length || 0} вихідних рахунків`);
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n3. Порівняння з вхідними накладними:');
    const invoicesUrl = baseUrl + '/invoices';
    
    try {
        console.log(`   Відправляємо POST на: ${invoicesUrl}`);
        console.log(`   Body: {"action": "getInvoices", "limit": 100}`);
        
        const response = await fetch(invoicesUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'REGMIK-ERP/1.0'
            },
            body: JSON.stringify({ 
                action: 'getInvoices',
                limit: 100
            })
        });
        
        console.log(`   Статус: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Отримано: ${data.invoices?.length || 0} вхідних накладних`);
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n=== ВИСНОВОК ===');
    console.log('Якщо вихідні рахунки повертають 401/404, а вхідні накладні працюють - проблема в 1С налаштуваннях');
    console.log('Можливо потрібно створити окремий HTTP-сервіс для вихідних рахунків в 1С');
}

test1CIntegration().catch(console.error);