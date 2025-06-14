# Nova Poshta UTF-8 Search Diagnostics Report

## Проблема
У production системі пошук "че" повертає 162 міст, тоді як у development - 1,451 міст.

## Діагностика Development
```json
{
  "totalCities": 10558,
  "totalWarehouses": 40443,
  "searchQuery": "че",
  "apiResults": 1451,
  "directSqlResults": "1451",
  "encoding": {
    "server_encoding": "UTF8",
    "client_encoding": "UTF8"
  },
  "environment": "development",
  "timestamp": "2025-06-14T19:34:33.709Z"
}
```

## Виправлення UTF-8
✅ **Виправлено підключення до бази даних:**
- Додано `client_encoding: 'UTF8'` в конфігурацію pool
- Додано обробник `pool.on('connect')` для гарантування UTF-8
- Синхронізовано зміни в `server/db.ts` та `deployment-package/server/db.ts`

## Причина розбіжності
Різниця між development (1,451) та production (162) результатами вказує на:

1. **Неповні дані в production базі** - менше загальних записів Nova Poshta
2. **Застарілу версію даних** - можливо, синхронізація не відбулася повністю
3. **Різні версії бази даних** - development має свіжіші дані

## Рекомендації для production

### 1. Перевірити кількість даних
```bash
curl -s "http://your-production-url/api/nova-poshta/diagnostics?q=че"
```

### 2. Принудова синхронізація
Якщо в production менше даних, потрібно:
- Виконати повну синхронізацію Nova Poshta
- Перевірити процес автоматичного оновлення
- Перевірити доступність Nova Poshta API з production сервера

### 3. Перевірити статус бази даних
```sql
SELECT COUNT(*) FROM nova_poshta_cities;
SELECT COUNT(*) FROM nova_poshta_warehouses;
```

## Endpoint для діагностики
Додано `/api/nova-poshta/diagnostics` для моніторингу:
- Загальна кількість міст і відділень
- Результати пошуку через API та SQL
- Статус кодування UTF-8
- Інформація про середовище

## Корінь проблеми виявлено
**Production проблема:** `client_encoding: SQL_ASCII` замість `UTF8`

## Виправлення впроваджено
✅ **Поліпшено database connection handler:**
```javascript
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

## Статус UTF-8
✅ **Development:** Повністю функціональний (UTF8/UTF8)
🔧 **Production:** Виправлення готове до розгортання

## Розгортання в production
Створено автоматизований скрипт `fix-utf8-production.sh`:
- Зупиняє службу
- Створює резервну копію
- Розгортає виправлення UTF-8
- Запускає службу
- Тестує функціональність

## Очікувані результати після розгортання
- Production `client_encoding` зміниться з `SQL_ASCII` на `UTF8`
- Пошук "че" повинен повертати 1,451 міст (як у development)
- Пошук "Чернігів" працюватиме коректно
- Діагностичний endpoint покаже правильне кодування