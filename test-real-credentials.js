#!/usr/bin/env node

/**
 * Тест 1С endpoints з правильними обліковими даними
 * Логін: Школа І.М.
 * Пароль: 1
 */

async function testWithRealCredentials() {
    console.log('=== ТЕСТ З ПРАВИЛЬНИМИ ОБЛІКОВИМИ ДАНИМИ ===\n');
    
    const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
    // Кодуємо правильні облікові дані
    const auth = Buffer.from('Школа І.М.:1').toString('base64');
    
    console.log(`Авторизація: "Школа І.М.:1" → Base64: ${auth}`);
    
    console.log('\n1. Тест вхідних накладних:');
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
                console.log(`   💰 Сума: ${invoice.amount || invoice.Сума || 'не вказано'} ${invoice.currency || invoice.Валюта || ''}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n2. Тест вихідних рахунків (виправлений):');
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
                console.log(`   💰 Сума: ${invoice.amount || invoice.Сума || 'не вказано'} ${invoice.currency || invoice.Валюта || ''}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }
    
    console.log('\n=== ВИСНОВОК ===');
    console.log('Тестування з правильними обліковими даними "Школа І.М.:1"');
    console.log('Якщо endpoints працюють - можна оновити ERP систему');
}

testWithRealCredentials().catch(console.error);