#!/usr/bin/env node

// Простий запуск сервера для тестування
const { spawn } = require('child_process');

console.log('Запускаємо сервер на порту 5000...');

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: '5000' }
});

server.on('error', (error) => {
  console.error('Помилка запуску сервера:', error);
});

server.on('close', (code) => {
  console.log(`Сервер зупинився з кодом: ${code}`);
});

process.on('SIGINT', () => {
  console.log('\nЗупиняємо сервер...');
  server.kill('SIGINT');
  process.exit(0);
});