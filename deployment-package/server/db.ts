import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Конфігурація підключення з підтримкою як DATABASE_URL так і окремих змінних
let poolConfig;

if (process.env.DATABASE_URL) {
  // Використовуємо DATABASE_URL якщо доступний
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
  // Використовуємо окремі змінні PostgreSQL
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  };
} else {
  throw new Error(
    "Database configuration missing. Please set either DATABASE_URL or PostgreSQL environment variables (PGHOST, PGUSER, PGPASSWORD, PGDATABASE)"
  );
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });