#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Ініціалізація бази даних...');
    
    // Перевірка підключення
    await client.query('SELECT NOW()');
    console.log('✓ Підключення до бази даних успішне');
    
    // Створення розширень
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ Розширення створені');
    
    // Перевірка існування критичних таблиць
    const tables = ['sessions', 'users', 'products', 'orders', 'clients'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`✓ Таблиця ${table} існує`);
      } else {
        console.log(`⚠ Таблиця ${table} не існує`);
      }
    }
    
    // Перевірка foreign keys для client_mail
    const fkResult = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'client_mail' 
        AND constraint_type = 'FOREIGN KEY'
    `);
    
    if (fkResult.rows.length > 0) {
      console.log('✓ Foreign keys для client_mail налаштовані');
    } else {
      console.log('⚠ Foreign keys для client_mail потребують налаштування');
    }
    
    console.log('\nБаза даних готова до роботи!');
    
  } catch (error) {
    console.error('Помилка ініціалізації бази даних:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };