#!/usr/bin/env node

// Тест fallback механізму з примусовим відключенням 1C сервера
import { DatabaseStorage } from './server/db-storage.js';

// Мокаємо fetch для симуляції недоступності сервера
global.fetch = async () => {
  throw new TypeError('fetch failed - simulated network error');
};

console.log('Testing 1C fallback mechanism with forced server unavailability...');

const storage = new DatabaseStorage();

// Test get1CInvoices fallback
console.log('\n=== Testing get1CInvoices fallback (forced) ===');
try {
  const invoices = await storage.get1CInvoices();
  console.log(`✓ Received ${invoices.length} invoices`);
  console.log(`✓ First invoice ID: ${invoices[0]?.id}`);
  console.log(`✓ First invoice number: ${invoices[0]?.number}`);
  console.log(`✓ First invoice supplier: ${invoices[0]?.supplierName}`);
  console.log(`✓ First invoice amount: ${invoices[0]?.amount}`);
  console.log(`✓ First invoice items: ${invoices[0]?.items?.length || 0} items`);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test get1COutgoingInvoices fallback  
console.log('\n=== Testing get1COutgoingInvoices fallback (forced) ===');
try {
  const outgoingInvoices = await storage.get1COutgoingInvoices();
  console.log(`✓ Received ${outgoingInvoices.length} outgoing invoices`);
  console.log(`✓ First outgoing invoice ID: ${outgoingInvoices[0]?.id}`);
  console.log(`✓ First outgoing invoice number: ${outgoingInvoices[0]?.number}`);
  console.log(`✓ First outgoing invoice client: ${outgoingInvoices[0]?.clientName}`);
  console.log(`✓ First outgoing invoice amount: ${outgoingInvoices[0]?.total}`);
  console.log(`✓ First outgoing invoice positions: ${outgoingInvoices[0]?.positions?.length || 0} positions`);
} catch (error) {
  console.error('✗ Error:', error.message);
}

console.log('\nForced fallback mechanism test completed!');
process.exit(0);