#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

// Завжди використовуємо окремі змінні для обходу SCRAM проблем з DATABASE_URL
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'regmik-erp',
  user: process.env.PGUSER || 'postgres',
  password: String(process.env.PGPASSWORD || ''),
  ssl: { rejectUnauthorized: false }
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
    
    // Перевірка та оновлення схеми client_mail
    const clientMailColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'client_mail' 
      ORDER BY ordinal_position
    `);
    
    const expectedColumns = [
      'recipient_name', 'recipient_address', 'envelope_size', 
      'postage_cost', 'tracking_number', 'sent_date', 
      'delivered_date', 'return_date'
    ];
    
    const existingColumns = clientMailColumns.rows.map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`⚠ Додаю відсутні колонки до client_mail: ${missingColumns.join(', ')}`);
      
      for (const column of missingColumns) {
        let columnDef = '';
        switch (column) {
          case 'recipient_name':
            columnDef = 'VARCHAR(255)';
            break;
          case 'recipient_address':
            columnDef = 'TEXT';
            break;
          case 'envelope_size':
            columnDef = 'VARCHAR(50)';
            break;
          case 'postage_cost':
            columnDef = 'DECIMAL(10,2)';
            break;
          case 'tracking_number':
            columnDef = 'VARCHAR(100)';
            break;
          case 'sent_date':
          case 'delivered_date':
          case 'return_date':
            columnDef = 'TIMESTAMP';
            break;
        }
        
        try {
          await client.query(`ALTER TABLE client_mail ADD COLUMN IF NOT EXISTS ${column} ${columnDef}`);
          console.log(`✓ Колонка ${column} додана`);
        } catch (error) {
          console.log(`⚠ Помилка додавання ${column}: ${error.message}`);
        }
      }
    } else {
      console.log('✓ Схема client_mail актуальна');
    }
    
    // Перевірка foreign keys
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
    
    // Оптимізація таблиць для кращої продуктивності
    await client.query('VACUUM ANALYZE');
    console.log('✓ Оптимізація бази даних завершена');
    
    console.log('\nБаза даних повністю синхронізована та готова до роботи!');
    
  } catch (error) {
    console.error('Помилка ініціалізації бази даних:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запуск функції якщо файл викликається безпосередньо
initializeDatabase().catch(console.error);