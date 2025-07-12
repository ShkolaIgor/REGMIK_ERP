/**
 * Простий запуск сервера для тестування
 */

const { spawn } = require('child_process');

console.log("🚀 Запускаю простий сервер для тестування...");

const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

console.log("📡 Сервер запущено в окремому процесі");
console.log("🌐 Очікуйте на повідомлення 'serving on port 5000'");
console.log("📱 Після цього frontend буде доступний на localhost:5000");

// Обробка сигналів для коректного завершення
process.on('SIGINT', () => {
  console.log("\n🛑 Отримано сигнал завершення, зупиняю сервер...");
  serverProcess.kill('SIGINT');
  process.exit(0);
});

serverProcess.on('exit', (code) => {
  console.log(`📊 Сервер завершено з кодом: ${code}`);
  process.exit(code);
});