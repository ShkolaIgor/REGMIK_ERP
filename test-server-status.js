#!/usr/bin/env node

/**
 * Тест статусу сервера після оновлення на реальні дані
 */

import fetch from 'node-fetch';

async function testServerStatus() {
    console.log('=== ТЕСТ СТАТУСУ СЕРВЕРА ПІСЛЯ ОНОВЛЕННЯ ===\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // Тест 1: Базове з'єднання
        console.log('🔍 Тест 1: Базове з\'єднання...');
        const healthResponse = await fetch(`${baseUrl}/`, {
            timeout: 5000
        });
        console.log(`   Статус: ${healthResponse.status}`);
        
        if (healthResponse.ok) {
            console.log('   ✅ Сервер працює');
        } else {
            console.log('   ❌ Сервер недоступний');
            return;
        }
        
    } catch (error) {
        console.log('   ❌ Помилка з\'єднання:', error.message);
        console.log('\n🚀 Спроба запуску сервера...');
        
        // Імпортуємо та запускаємо сервер
        try {
            const { startServer } = await import('./server/index.js');
            await startServer();
            console.log('   ✅ Сервер запущено');
        } catch (startError) {
            console.log('   ❌ Не вдалося запустити сервер:', startError.message);
        }
        return;
    }
    
    // Тест 2: API статус
    console.log('\n🔍 Тест 2: API статус...');
    try {
        const apiResponse = await fetch(`${baseUrl}/api/1c/invoices`, {
            timeout: 10000
        });
        console.log(`   Статус: ${apiResponse.status}`);
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            console.log(`   ✅ API працює, отримано: ${data?.length || 0} накладних`);
        } else {
            const errorText = await apiResponse.text();
            console.log(`   ❌ API помилка: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ API недоступне: ${error.message}`);
    }
    
    // Тест 3: Вихідні рахунки
    console.log('\n🔍 Тест 3: Вихідні рахунки...');
    try {
        const outgoingResponse = await fetch(`${baseUrl}/api/1c/outgoing-invoices`, {
            timeout: 10000
        });
        console.log(`   Статус: ${outgoingResponse.status}`);
        
        if (outgoingResponse.ok) {
            const data = await outgoingResponse.json();
            console.log(`   ✅ Вихідні рахунки працюють, отримано: ${data?.length || 0} рахунків`);
        } else {
            const errorText = await outgoingResponse.text();
            console.log(`   ❌ Вихідні рахунки помилка: ${errorText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.log(`   ❌ Вихідні рахунки недоступні: ${error.message}`);
    }
    
    console.log('\n=== ТЕСТ ЗАВЕРШЕНО ===');
}

testServerStatus().catch(console.error);