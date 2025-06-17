# REGMIK ERP - Швидкий старт

## Development (Розробка)

```bash
# Клонування та встановлення
git clone <repository>
cd REGMIK_ERP
npm install

# Створення .env файлу
cp .env.example .env
# Відредагуйте .env з вашими налаштуваннями

# Ініціалізація бази даних
node scripts/init-database.js

# Запуск
npm run dev
# Доступ: http://localhost:5000
```

## Production (Виробництво)

### Автоматичне розгортання
```bash
sudo ./setup-production.sh
```

### Ручне розгортання
```bash
# 1. Створення .env файлу
sudo tee .env << 'EOF'
PGHOST=localhost
PGPORT=5432
PGDATABASE=regmik-erp
PGUSER=regmik_user
PGPASSWORD=YOUR_PASSWORD
SESSION_SECRET=YOUR_SECRET
EOF

# 2. Ініціалізація БД
node scripts/init-database.js

# 3. Запуск службі
sudo systemctl start regmik-erp
sudo systemctl enable regmik-erp
```

## Швидке виправлення помилок

### Database connection error
```bash
# Перевірка змінних оточення
sudo systemctl edit regmik-erp
# Додайте Environment= змінні

sudo systemctl daemon-reload
sudo systemctl restart regmik-erp
```

### Перевірка статусу
```bash
sudo systemctl status regmik-erp
sudo journalctl -u regmik-erp -f
curl http://localhost:5000/api/dashboard/stats
```

## Модулі системи
- ✅ Управління товарами та замовленнями
- ✅ Складський облік та інвентаризація  
- ✅ Nova Poshta API інтеграція
- ✅ Виробництво та рецепти
- ✅ Фінансова аналітика
- ✅ 16+ додаткових модулів

Система готова до виробничого використання з базою даних `regmik-erp`.