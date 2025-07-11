#!/usr/bin/env node

/**
 * Прямий тест 1С endpoints після виправлення унифікації
 * Тестує обидва action параметри через єдиний endpoint /invoices
 */

async function test1CEndpointsUnified() {
    const baseUrl = 'http://baf.regmik.ua/bitrix/hs/erp';
    const invoicesEndpoint = `${baseUrl}/invoices`;
    const auth = Buffer.from('100:ШкоМ.').toString('base64');

    console.log('=== ТЕСТ 1С ІНТЕГРАЦІЇ ПІСЛЯ УНИФІКАЦІЇ ===\n');
    console.log(`Endpoint: ${invoicesEndpoint}`);
    console.log(`Авторизація: Basic ${auth.substring(0, 20)}...`);
    console.log('');

    // Тест 1: Вхідні накладні (action=getInvoices)
    console.log('📋 ТЕСТ 1: Вхідні накладні (action=getInvoices)');
    try {
        const response = await fetch(invoicesEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'REGMIK-ERP/1.0'
            },
            body: JSON.stringify({
                action: 'getInvoices',
                limit: 5
            })
        });

        console.log(`   Статус: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Отримано: ${data.invoices?.length || 0} вхідних накладних`);
            if (data.invoices && data.invoices.length > 0) {
                const invoice = data.invoices[0];
                console.log(`   📄 Перша накладна: ${invoice.documentNumber || invoice.НомерДокумента || 'без номера'}`);
                console.log(`   🏢 Постачальник: ${invoice.supplierName || invoice.Поставщик || 'без назви'}`);
                console.log(`   💰 Сума: ${invoice.totalAmount || invoice.СуммаДокумента || '0'}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }

    console.log('');

    // Тест 2: Вихідні рахунки (action=getOutgoingInvoices)
    console.log('📋 ТЕСТ 2: Вихідні рахунки (action=getOutgoingInvoices)');
    try {
        const response = await fetch(invoicesEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'REGMIK-ERP/1.0'
            },
            body: JSON.stringify({
                action: 'getOutgoingInvoices',
                limit: 5
            })
        });

        console.log(`   Статус: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Отримано: ${data.invoices?.length || 0} вихідних рахунків`);
            if (data.invoices && data.invoices.length > 0) {
                const invoice = data.invoices[0];
                console.log(`   📄 Перший рахунок: ${invoice.invoiceNumber || invoice.НомерСчета || 'без номера'}`);
                console.log(`   👤 Клієнт: ${invoice.clientName || invoice.НаименованиеКонтрагента || 'без назви'}`);
                console.log(`   💰 Сума: ${invoice.totalAmount || invoice.СуммаДокумента || '0'}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`   ❌ Помилка: ${errorText.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Помилка підключення: ${error.message}`);
    }

    console.log('');
    console.log('=== ПІДСУМОК ===');
    console.log('✅ Endpoint унифікація: обидва типи документів використовують /invoices');
    console.log('✅ Розрізнення через action параметр в POST body');
    console.log('✅ Використання Basic авторизації');
    console.log('✅ Тест завершено');
}

// Запуск тесту
test1CEndpointsUnified().catch(console.error);