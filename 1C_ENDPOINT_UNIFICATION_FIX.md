# 1C Endpoint Unification Fix

## Проблема
Різні endpoints для вхідних накладних та вихідних рахунків спричиняли HTTP 500 помилки:
- ❌ `/invoices` - працював для вхідних накладних
- ❌ `/outgoing-invoices` - не існував в 1С системі

## Рішення
Обидва типи документів отримуються з одного endpoint `/invoices` з різними параметрами `action`:

### Вхідні накладні
```javascript
POST /invoices
{
  "action": "getInvoices",
  "limit": 100
}
```

### Вихідні рахунки
```javascript
POST /invoices
{
  "action": "getOutgoingInvoices", 
  "limit": 100
}
```

## Виправлення коду

### get1COutgoingInvoices()
```javascript
// Використовуємо той самий endpoint /invoices з різним action
let outgoingUrl = config.baseUrl.trim();
if (!outgoingUrl.endsWith('/')) outgoingUrl += '/';
outgoingUrl += 'invoices'; // Змінено з 'outgoing-invoices' на 'invoices'
```

## Результат тестування
✅ **Вхідні накладні**: `action=getInvoices` → HTTP 200 OK, 50 записів
✅ **Вихідні рахунки**: `action=getOutgoingInvoices` → HTTP 200 OK, реальні дані

## Структура URL після виправлення
- **Базовий URL**: `http://baf.regmik.ua/bitrix/hs/erp`
- **Endpoint**: `/invoices` (для обох типів документів)
- **Розрізнення**: через параметр `action` в POST body

## Переваги
1. **Уніфікація** - один endpoint для всіх типів документів
2. **Спрощення** - менше confusion з різними URL
3. **Надійність** - використання реально існуючих endpoints
4. **Консистентність** - одна логіка для всіх запитів

Дата виправлення: 2025-07-11