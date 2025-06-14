const { spawn } = require('child_process');

console.log('Запуск продакшн сервера для тестування...');

const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Помилка запуску сервера:', error);
});

server.on('exit', (code, signal) => {
  console.log(`Сервер зупинився з кодом ${code}, сигнал: ${signal}`);
});

// Тестуємо HTTP запити через 3 секунди
setTimeout(async () => {
  try {
    const response = await fetch('http://localhost:5000/');
    const text = await response.text();
    console.log('HTTP запит успішний, довжина відповіді:', text.length, 'символів');
    console.log('Перші 100 символів:', text.substring(0, 100));
  } catch (error) {
    console.error('Помилка HTTP запиту:', error.message);
  }
}, 3000);

// Тестуємо API Nova Poshta через 5 секунд
setTimeout(async () => {
  try {
    const response = await fetch('http://localhost:5000/api/nova-poshta/cities?search=київ&limit=3');
    const data = await response.json();
    console.log('API Nova Poshta:', response.status, data);
  } catch (error) {
    console.error('Помилка API Nova Poshta:', error.message);
  }
  
  // Зупиняємо сервер після тестів
  setTimeout(() => {
    console.log('Зупиняємо тестовий сервер...');
    server.kill('SIGTERM');
    process.exit(0);
  }, 2000);
}, 5000);