#!/usr/bin/env node

import { db } from './server/db.ts';
import { DatabaseStorage } from './server/db-storage.ts';

console.log('Testing 1C fallback mechanism...');

const storage = new DatabaseStorage();

// Test get1CInvoices fallback
console.log('\n=== Testing get1CInvoices fallback ===');
try {
  const invoices = await storage.get1CInvoices();
  console.log(`✓ Received ${invoices.length} invoices`);
  console.log(`✓ First invoice ID: ${invoices[0]?.id}`);
  console.log(`✓ First invoice number: ${invoices[0]?.number}`);
  console.log(`✓ First invoice supplier: ${invoices[0]?.supplierName}`);
} catch (error) {
  console.error('✗ Error:', error.message);
}

// Test get1COutgoingInvoices fallback  
console.log('\n=== Testing get1COutgoingInvoices fallback ===');
try {
  const outgoingInvoices = await storage.get1COutgoingInvoices();
  console.log(`✓ Received ${outgoingInvoices.length} outgoing invoices`);
  console.log(`✓ First outgoing invoice ID: ${outgoingInvoices[0]?.id}`);
  console.log(`✓ First outgoing invoice number: ${outgoingInvoices[0]?.number}`);
  console.log(`✓ First outgoing invoice client: ${outgoingInvoices[0]?.clientName}`);
} catch (error) {
  console.error('✗ Error:', error.message);
}

console.log('\nFallback mechanism test completed!');
process.exit(0);