#!/usr/bin/env node

// Прямий тест API методів без HTTP сервера
import { DatabaseStorage } from './server/db-storage.js';

console.log('Прямий тест API методів з fallback...');

const storage = new DatabaseStorage();

// Мокаємо fetch для симуляції недоступності сервера
global.fetch = async () => {
  throw new TypeError('fetch failed - simulated network error');
};

// Test 1: get1CInvoices fallback
console.log('\n=== Тест get1CInvoices (fallback) ===');
try {
  const invoices = await storage.get1CInvoices();
  console.log(`✓ Отримано ${invoices.length} накладних`);
  if (invoices.length > 0) {
    const first = invoices[0];
    console.log(`✓ Перша накладна: ${first.number}, ${first.supplierName}, ${first.currency} ${first.amount}`);
  }
} catch (error) {
  console.error('✗ Помилка:', error.message);
}

// Test 2: get1COutgoingInvoices fallback  
console.log('\n=== Тест get1COutgoingInvoices (fallback) ===');
try {
  const outgoingInvoices = await storage.get1COutgoingInvoices();
  console.log(`✓ Отримано ${outgoingInvoices.length} вихідних рахунків`);
  
  if (outgoingInvoices.length > 0) {
    const first = outgoingInvoices[0];
    console.log(`✓ Перший рахунок: ${first.number}, ${first.clientName}, ${first.currency} ${first.total}`);
    console.log(`✓ Статус: ${first.status}, Оплата: ${first.paymentStatus}`);
    console.log(`✓ Позиції: ${first.positions?.length || 0} шт`);
    
    // Детальна структура
    console.log('\n--- Структура вихідного рахунку ---');
    console.log(JSON.stringify(first, null, 2));
  }
} catch (error) {
  console.error('✗ Помилка:', error.message);
}

console.log('\nПрямий тест API завершено!');
process.exit(0);