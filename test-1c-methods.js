#!/usr/bin/env node

// Прямий тест 1С методів без сервера
import pg from 'pg';
import { DatabaseStorage } from './server/db-storage.js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const { Pool: PgPool } = pg;

async function test1CMethods() {
  console.log('🔍 Тестування 1С методів напряму...');
  
  try {
    // Налаштування БД
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);
    
    // Створення storage
    const storage = new DatabaseStorage(db);
    
    console.log('✅ Storage створено');
    
    // Тест get1CInvoices
    console.log('\n📥 Тестування get1CInvoices()...');
    try {
      const invoices = await storage.get1CInvoices();
      console.log(`✅ Отримано ${invoices.length} накладних`);
      
      if (invoices.length > 0) {
        console.log(`   Перша накладна: ${invoices[0].documentNumber || 'без номера'}`);
        console.log(`   Постачальник: ${invoices[0].supplierName || 'без постачальника'}`);
        console.log(`   Сума: ${invoices[0].totalAmount || 0}`);
      }
    } catch (error) {
      console.log(`❌ Помилка get1CInvoices: ${error.message}`);
    }
    
    // Тест get1COutgoingInvoices
    console.log('\n📤 Тестування get1COutgoingInvoices()...');
    try {
      const outgoing = await storage.get1COutgoingInvoices();
      console.log(`✅ Отримано ${outgoing.length} вихідних рахунків`);
      
      if (outgoing.length > 0) {
        console.log(`   Перший рахунок: ${outgoing[0].documentNumber || 'без номера'}`);
        console.log(`   Клієнт: ${outgoing[0].customerName || 'без клієнта'}`);
        console.log(`   Сума: ${outgoing[0].totalAmount || 0}`);
      }
    } catch (error) {
      console.log(`❌ Помилка get1COutgoingInvoices: ${error.message}`);
    }
    
    await pool.end();
    console.log('\n🎯 Тест завершено');
    
  } catch (error) {
    console.error('❌ КРИТИЧНА ПОМИЛКА:', error.message);
  }
}

test1CMethods();