#!/usr/bin/env node

import { Pool } from 'pg';
import { config } from 'dotenv';

// Завантажуємо змінні середовища
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function removeSerialUniqueConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Підключення до бази даних...');
    
    // Перевіряємо чи існує унікальне обмеження
    const checkConstraint = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'serial_numbers' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%serial_number%';
    `);
    
    if (checkConstraint.rows.length > 0) {
      console.log('Знайдено унікальне обмеження:', checkConstraint.rows[0].constraint_name);
      
      // Видаляємо унікальне обмеження
      await client.query(`
        ALTER TABLE serial_numbers 
        DROP CONSTRAINT IF EXISTS ${checkConstraint.rows[0].constraint_name};
      `);
      
      console.log('Унікальне обмеження успішно видалено');
    } else {
      console.log('Унікальне обмеження не знайдено');
    }
    
    // Перевіряємо унікальні індекси
    const checkIndex = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'serial_numbers' 
      AND indexdef LIKE '%UNIQUE%'
      AND indexname LIKE '%serial_number%';
    `);
    
    if (checkIndex.rows.length > 0) {
      console.log('Знайдено унікальний індекс:', checkIndex.rows[0].indexname);
      
      // Видаляємо унікальний індекс
      await client.query(`
        DROP INDEX IF EXISTS ${checkIndex.rows[0].indexname};
      `);
      
      console.log('Унікальний індекс успішно видалено');
    } else {
      console.log('Унікальний індекс не знайдено');
    }
    
    console.log('Операція завершена успішно');
    
  } catch (error) {
    console.error('Помилка:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

removeSerialUniqueConstraint();