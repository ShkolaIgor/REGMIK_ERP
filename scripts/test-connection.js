#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

// Тест з DATABASE_URL
console.log('Тестування підключення через DATABASE_URL...');
const poolUrl = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await poolUrl.connect();
  console.log('✓ DATABASE_URL підключення успішне');
  await client.query('SELECT version()');
  console.log('✓ База даних відповідає');
  client.release();
  await poolUrl.end();
} catch (error) {
  console.error('✗ DATABASE_URL помилка:', error.message);
}

// Тест з окремими змінними
console.log('\nТестування підключення через окремі змінні...');
const poolSeparate = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await poolSeparate.connect();
  console.log('✓ Окремі змінні підключення успішне');
  await client.query('SELECT version()');
  console.log('✓ База даних відповідає');
  client.release();
  await poolSeparate.end();
} catch (error) {
  console.error('✗ Окремі змінні помилка:', error.message);
}

// Тест з явним перетворенням типів
console.log('\nТестування з явним перетворенням типів...');
const poolTyped = new Pool({
  host: String(process.env.PGHOST || 'localhost'),
  port: Number(process.env.PGPORT || 5432),
  database: String(process.env.PGDATABASE || 'regmik-erp'),
  user: String(process.env.PGUSER || 'postgres'),
  password: String(process.env.PGPASSWORD || ''),
  ssl: { rejectUnauthorized: false }
});

try {
  const client = await poolTyped.connect();
  console.log('✓ Типізоване підключення успішне');
  await client.query('SELECT version()');
  console.log('✓ База даних відповідає');
  client.release();
  await poolTyped.end();
} catch (error) {
  console.error('✗ Типізоване підключення помилка:', error.message);
}