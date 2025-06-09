#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;

// Створюємо конфігурацію підключення з окремих змінних для обходу SCRAM проблем
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'regmik-erp',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
    };

const pool = new Pool({
  ...poolConfig,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class ManualMigration {
  async execute() {
    const client = await pool.connect();
    
    try {
      console.log('Виконання ручної міграції без drizzle-kit...');
      
      // Перевірка версії схеми
      const versionCheck = await client.query('SELECT MAX(version) as current_version FROM schema_versions');
      const currentVersion = versionCheck.rows[0]?.current_version || 0;
      console.log(`Поточна версія схеми: ${currentVersion}`);
      
      // Застосування нових міграцій
      await this.applyMigration2(client, currentVersion);
      
      console.log('Ручна міграція завершена успішно');
      
    } catch (error) {
      console.error('Помилка міграції:', error.message);
      process.exit(1);
    } finally {
      client.release();
      await pool.end();
    }
  }
  
  async applyMigration2(client, currentVersion) {
    if (currentVersion >= 2) {
      console.log('Міграція 2 вже застосована');
      return;
    }
    
    console.log('Застосування міграції 2: Фіналізація схеми client_id...');
    
    // Створення індексів для продуктивності
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_client_id ON orders(client_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_mail_client_id ON client_mail(client_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_client_id ON invoices(client_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nova_poshta_client_id ON client_nova_poshta_settings(client_id)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log('✓ Індекс створено');
      } catch (error) {
        if (error.code === '42P07') {
          console.log('ℹ Індекс вже існує');
        } else {
          throw error;
        }
      }
    }
    
    // Оновлення статистик
    await client.query('ANALYZE orders, client_mail, client_contacts, invoices, client_nova_poshta_settings');
    
    // Фіксація версії
    await client.query('INSERT INTO schema_versions (version, description) VALUES (2, \'Індекси для client_id створені, схема оптимізована\')');
    
    console.log('✓ Міграція 2 завершена');
  }
}

const migration = new ManualMigration();
migration.execute().catch(console.error);