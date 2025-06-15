# UTF-8 Search Fix Instructions

## Проблема
Production система має `client_encoding: SQL_ASCII` замість `UTF8`, що призводить до неправильних результатів пошуку українських міст:
- Пошук "че": повертає 162 міста замість 1,451
- Пошук "Чернігів": працює некоректно

## Рішення
Виправлено database connection handler для примусового встановлення UTF-8 кодування.

## Виправлення впроваджено в код:
```javascript
// server/db.ts та deployment-package/server/db.ts
pool.on('connect', async (client) => {
  try {
    await client.query('SET client_encoding TO "UTF8"');
    await client.query('SET standard_conforming_strings TO on');
    console.log('Database connection configured for UTF-8');
  } catch (error) {
    console.error('Error setting UTF-8 encoding:', error);
  }
});
```

## Розгортання виправлень в production

### Крок 1: Backup поточної системи
```bash
# На production сервері
sudo systemctl stop regmik-erp
tar -czf production-backup-$(date +%Y%m%d-%H%M%S).tar.gz /opt/regmik-erp/
```

### Крок 2: Розгортання виправлень
```bash
# Копіювання файлів з deployment-package
cp deployment-package/server/db.ts /opt/regmik-erp/server/
cp deployment-package/server/routes.ts /opt/regmik-erp/server/
sudo chown -R regmik:regmik /opt/regmik-erp/
```

### Крок 3: Перезапуск системи
```bash
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

### Крок 4: Верифікація виправлень
```bash
# Перевірка діагностичного endpoint
curl -s "http://localhost:3000/api/nova-poshta/diagnostics?q=че"

# Очікуваний результат:
# {
#   "totalCities": 10558,
#   "totalWarehouses": 40443,
#   "searchQuery": "че",
#   "apiResults": 1451,
#   "directSqlResults": "1451",
#   "encoding": {
#     "server_encoding": "UTF8",
#     "client_encoding": "UTF8"
#   },
#   "environment": "production"
# }
```

### Крок 5: Тестування пошуку
```bash
# Тест пошуку "Чернігів"
curl -s "http://localhost:3000/api/nova-poshta/cities?q=Чернігів"

# Очікуваний результат: 340 міст з правильним UTF-8 кодуванням
```

## Очікувані результати після виправлення:
- ✅ `client_encoding` зміниться з `SQL_ASCII` на `UTF8`
- ✅ Пошук "че" повертатиме 1,451 міст (як у development)
- ✅ Пошук "Чернігів" працюватиме коректно
- ✅ Діагностичний endpoint показуватиме правильне кодування

## Моніторинг
Використовуйте діагностичний endpoint для регулярної перевірки UTF-8 статусу:
```bash
curl -s "http://localhost:3000/api/nova-poshta/diagnostics" | grep client_encoding
```

## Rollback інструкції
У разі проблем:
```bash
sudo systemctl stop regmik-erp
tar -xzf production-backup-[timestamp].tar.gz -C /
sudo systemctl start regmik-erp
```