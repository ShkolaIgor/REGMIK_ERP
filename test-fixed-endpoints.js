#!/usr/bin/env node

/**
 * Тест виправлених 1С endpoints з правильними параметрами
 */

async function testFixed1CEndpoints() {
    console.log('=== ТЕСТ ВИПРАВЛЕНИХ 1С ENDPOINTS ===\n');
    
    const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
    const auth = Buffer.from('100:ШкоМ.').toString('base64');
    
    console.log('1. Тест вихідних рахунків з action параметром:');
    const outgoingUrl = baseUrl + '/outgoing-invoices';
    
    try {
        console.log(`   POST на: ${outgoingUrl}`);
        console.log(`   Body: {"action": "getOutgoingInvoices", "limit": 100}`);
        
        const response = await fetch(outgoingUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'REGMIK-ERP/1.0'
            },
            body: JSON.stringify({
                action: 'getOutgoingInvoices',
                limit: 100
            })
        });
        
        console.log(`   Статус: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Успішно! Отримано: ${data.invoices?.length || 0} вихідних рахунків`);
            if (data.invoices && data.invoices.length > 0) {
                const invoice = data.invoices[0];
                console.log(`   📄 Перший рахунок: ${invoice.invoiceNumber || invoice.НомерСчета || 'без номера'}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n2. Тест вхідних накладних (для порівняння):');
    const invoicesUrl = baseUrl + '/invoices';
    
    try {
        console.log(`   POST на: ${invoicesUrl}`);
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
            console.log(`   ✅ Успішно! Отримано: ${data.invoices?.length || 0} вхідних накладних`);
            if (data.invoices && data.invoices.length > 0) {
                const invoice = data.invoices[0];
                console.log(`   📄 Перша накладна: ${invoice.documentNumber || invoice.НомерДокумента || 'без номера'}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n=== ПІДСУМОК ===');
    console.log('✅ Виправлено: додано action=getOutgoingInvoices для вихідних рахунків');
    console.log('✅ Структура: POST /outgoing-invoices з {"action": "getOutgoingInvoices", "limit": 100}');
    console.log('✅ Код ERP оновлено для правильного формування запитів');
}

testFixed1CEndpoints().catch(console.error);