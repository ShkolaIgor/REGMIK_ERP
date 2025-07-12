/**
 * Прямий тест запуску сервера та API endpoint
 */

import { spawn } from 'child_process';
import http from 'http';

console.log("=== ЗАПУСК СЕРВЕРА ТА ТЕСТ API ===");

// Запуск сервера
console.log("🚀 Запускаю сервер...");
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Чекаємо 5 секунд для запуску сервера
setTimeout(async () => {
  console.log("🔍 Тестую API endpoint...");
  
  try {
    const response = await fetch('http://localhost:5000/api/1c/outgoing-invoices');
    console.log(`📡 HTTP статус: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API працює! Отримано рахунків: ${data.length}`);
      
      if (data.length > 0) {
        console.log("📄 Перший рахунок:", JSON.stringify(data[0], null, 2));
      } else {
        console.log("⚠️ API працює, але повертає пусті дані");
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API помилка: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Помилка з'єднання з API: ${error.message}`);
    console.log("🔧 Fallback дані будуть відображені у frontend");
  }
  
  // Зупиняємо сервер
  console.log("🛑 Зупиняю сервер...");
  serverProcess.kill();
  process.exit(0);
}, 5000);