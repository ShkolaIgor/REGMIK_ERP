import { spawn } from 'child_process';

console.log('Starting development server...');

// Запускаємо npm run dev
const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

dev.on('error', (err) => {
  console.error('Failed to start dev server:', err);
});

dev.on('close', (code) => {
  console.log(`Dev server exited with code ${code}`);
});