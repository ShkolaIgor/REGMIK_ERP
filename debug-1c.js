#!/usr/bin/env node

// Простий діагностичний скрипт для перевірки 1С інтеграції
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test1CIntegration() {
  try {
    console.log('🔍 Діагностика 1С інтеграції');
    
    // Перевірка підключення до БД
    console.log('📊 Перевірка підключення до БД...');
    const dbResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ БД підключено:', dbResult.rows[0]);
    
    // Перевірка інтеграційних конфігурацій
    console.log('🔧 Перевірка 1С конфігурацій...');
    const integrations = await pool.query(`
      SELECT id, name, type, is_active, config 
      FROM integration_configs 
      WHERE type = '1c_accounting' AND is_active = true
    `);
    
    console.log(`📋 Знайдено ${integrations.rows.length} активних 1С інтеграцій:`);
    for (const integration of integrations.rows) {
      console.log(`  - ID: ${integration.id}, Назва: ${integration.name}`);
      console.log(`  - Конфігурація:`, integration.config);
    }
    
    if (integrations.rows.length === 0) {
      console.log('❌ ПРОБЛЕМА: Не знайдено активних 1С інтеграцій!');
      console.log('💡 Рішення: Створіть активну 1С інтеграцію через веб-інтерфейс');
    }
    
    // Тестування простого HTTP запиту
    console.log('🌐 Тестування HTTP запиту...');
    try {
      const response = await fetch('https://httpbin.org/get');
      const data = await response.json();
      console.log('✅ HTTP запити працюють');
    } catch (httpError) {
      console.log('❌ HTTP запити не працюють:', httpError.message);
    }
    
  } catch (error) {
    console.error('❌ КРИТИЧНА ПОМИЛКА:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

test1CIntegration();