const { spawn } = require('child_process');

console.log('Тестування пошуку "Чернігів" у продакшн режимі...');

// Запускаємо продакшн сервер
const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'pipe'
});

let serverOutput = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('SERVER:', output.trim());
});

server.stderr.on('data', (data) => {
  console.error('SERVER ERROR:', data.toString().trim());
});

server.on('error', (error) => {
  console.error('Помилка запуску сервера:', error);
});

// Тестуємо пошук через 5 секунд
setTimeout(async () => {
  console.log('\n=== ТЕСТУВАННЯ ПОШУКУ "Чернігів" ===');
  
  try {
    // Тест 1: Базовий пошук
    console.log('Тест 1: Базовий пошук Чернігів...');
    const response1 = await fetch('http://localhost:5000/api/nova-poshta/cities?q=Чернігів');
    const data1 = await response1.json();
    console.log('Статус:', response1.status);
    console.log('Кількість результатів:', data1.length);
    if (data1.length > 0) {
      console.log('Перший результат:', data1[0].Description);
      console.log('Область:', data1[0].AreaDescription);
    }
    
    // Тест 2: Альтернативний запис
    console.log('\nТест 2: Пошук з іншим кодуванням...');
    const response2 = await fetch('http://localhost:5000/api/nova-poshta/cities?q=' + encodeURIComponent('Чернігів'));
    const data2 = await response2.json();
    console.log('Статус:', response2.status);
    console.log('Кількість результатів:', data2.length);
    
    // Тест 3: Пошук без параметрів
    console.log('\nТест 3: Пошук без параметрів...');
    const response3 = await fetch('http://localhost:5000/api/nova-poshta/cities');
    const data3 = await response3.json();
    console.log('Статус:', response3.status);
    console.log('Загальна кількість міст:', data3.length);
    
    // Тест 4: Пошук міста що точно існує
    console.log('\nТест 4: Пошук Київ для порівняння...');
    const response4 = await fetch('http://localhost:5000/api/nova-poshta/cities?q=Київ');
    const data4 = await response4.json();
    console.log('Статус:', response4.status);
    console.log('Кількість результатів для Києва:', data4.length);
    
  } catch (error) {
    console.error('Помилка тестування:', error.message);
  }
  
  // Зупиняємо сервер
  setTimeout(() => {
    console.log('\nЗупиняємо сервер...');
    server.kill('SIGTERM');
    process.exit(0);
  }, 2000);
}, 5000);