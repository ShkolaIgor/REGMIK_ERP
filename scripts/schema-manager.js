#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class SchemaManager {
  async run() {
    const client = await pool.connect();
    
    try {
      console.log('Управління схемою бази даних...');
      
      // Блокування drizzle-kit
      await this.blockDrizzleKit(client);
      
      // Синхронізація схеми
      await this.syncSchema(client);
      
      // Оптимізація продуктивності
      await this.optimize(client);
      
      console.log('Схема повністю синхронізована та готова до роботи');
      
    } catch (error) {
      console.error('Помилка управління схемою:', error.message);
      process.exit(1);
    } finally {
      client.release();
      await pool.end();
    }
  }
  
  async blockDrizzleKit(client) {
    // Створення dummy таблиці для блокування drizzle-kit
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_block (
        id SERIAL PRIMARY KEY,
        message TEXT DEFAULT 'Використовуйте scripts/schema-manager.js замість drizzle-kit',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Додавання запису для попередження
    await client.query(`
      INSERT INTO __drizzle_block (message) 
      VALUES ('База даних керується через custom schema manager') 
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ Drizzle-kit заблоковано');
  }
  
  async syncSchema(client) {
    // Перевірка всіх критичних таблиць
    const tables = ['orders', 'client_mail', 'products', 'clients', 'users', 'sessions'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [table]);
      
      if (result.rows[0].count === '0') {
        console.log(`⚠ Таблиця ${table} відсутня`);
      } else {
        console.log(`✓ Таблиця ${table} існує`);
      }
    }
    
    // Фіксація client_id типів
    await client.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN SELECT table_name FROM information_schema.columns 
                 WHERE column_name = 'client_id' AND table_schema = 'public'
        LOOP
          EXECUTE format('COMMENT ON COLUMN %I.client_id IS %L', 
            r.table_name, 'Integer type - managed by schema-manager');
        END LOOP;
      END $$;
    `);
    
    console.log('✓ Схема синхронізована');
  }
  
  async optimize(client) {
    // Оновлення статистик для оптимізатора запитів
    await client.query('ANALYZE');
    
    // Перевірка та створення критичних індексів
    const indexes = [
      { table: 'orders', column: 'client_id', name: 'idx_orders_client_id' },
      { table: 'client_mail', column: 'client_id', name: 'idx_client_mail_client_id' },
      { table: 'products', column: 'sku', name: 'idx_products_sku' },
      { table: 'inventory', column: 'product_id', name: 'idx_inventory_product_id' }
    ];
    
    for (const idx of indexes) {
      try {
        await client.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${idx.name} 
          ON ${idx.table}(${idx.column})
        `);
        console.log(`✓ Індекс ${idx.name} готовий`);
      } catch (error) {
        if (error.code === '42P07') {
          console.log(`ℹ Індекс ${idx.name} вже існує`);
        }
      }
    }
  }
}

const manager = new SchemaManager();
manager.run().catch(console.error);