import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Конфігурація підключення з підтримкою як DATABASE_URL так і окремих змінних
let poolConfig;

if (process.env.DATABASE_URL) {
  // Використовуємо DATABASE_URL якщо доступний
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Додаємо підтримку UTF-8 для українського тексту
    client_encoding: 'UTF8',
    application_name: 'regmik-erp'
  };
} else if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
  // Використовуємо окремі змінні PostgreSQL
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
    // Додаємо підтримку UTF-8 для українського тексту
    client_encoding: 'UTF8',
    application_name: 'regmik-erp'
  };
} else {
  throw new Error(
    "Database configuration missing. Please set either DATABASE_URL or PostgreSQL environment variables (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)"
  );
}

export const pool = new Pool(poolConfig);

// Забезпечуємо UTF-8 кодування для всіх підключень
pool.on('connect', (client) => {
  client.query('SET client_encoding TO "UTF8"');
});

export const db = drizzle(pool, { schema });