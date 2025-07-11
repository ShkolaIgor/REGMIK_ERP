# 1C URL Structure Fix

## Проблема
Раніше в 1С інтеграції потрібно було вказувати повний URL з endpoint:
- `http://baf.regmik.ua/bitrix/hs/erp/invoices` - для вхідних накладних
- `http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices` - для вихідних рахунків

## Рішення
Тепер використовується базовий URL, а endpoints додаються автоматично:

### Налаштування
**Базовий URL**: `http://baf.regmik.ua/bitrix/hs/erp`

### Автоматичне формування endpoints
- При імпорті **вхідних накладних**: додається `/invoices`
- При імпорті **вихідних рахунків**: додається `/outgoing-invoices`

## Переваги нового підходу
1. **Простота налаштування** - один базовий URL замість багатьох
2. **Менше помилок** - автоматичне формування правильних endpoints
3. **Легше підтримка** - зміна базового URL оновлює всі endpoints
4. **Гнучкість** - легко додавати нові endpoints в майбутньому

## Код виправлення

### get1CInvoices()
```javascript
// Формуємо URL додаючи /invoices до базового URL
let invoicesUrl = config.baseUrl.trim();
if (!invoicesUrl.endsWith('/')) invoicesUrl += '/';
invoicesUrl += 'invoices';
```

### get1COutgoingInvoices()
```javascript
// Формуємо URL додаючи /outgoing-invoices до базового URL
let outgoingUrl = config.baseUrl.trim();
if (!outgoingUrl.endsWith('/')) outgoingUrl += '/';
outgoingUrl += 'outgoing-invoices';
```

## Оновлення БД
```sql
UPDATE integration_configs 
SET config = jsonb_set(config, '{baseUrl}', '"http://baf.regmik.ua/bitrix/hs/erp"')
WHERE type = '1c_accounting' AND is_active = true;
```

## Тестування
Тест показав успішну роботу з новою структурою URL:
- ✅ Базовий URL: `http://baf.regmik.ua/bitrix/hs/erp`
- ✅ Вхідні накладні: `http://baf.regmik.ua/bitrix/hs/erp/invoices` (HTTP 200 OK)
- ✅ Отримано 50 реальних записів з 1С системи

Дата: 2025-07-11