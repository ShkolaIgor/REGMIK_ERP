# 1C Вихідні рахунки - Остаточне виправлення

## Проблема
Користувач повідомив: "імпорт вихідних рахунків з 1С поилково викликає /invoices, /invoices не працює"

## Корінь проблеми
Я неправильно видалив параметр `action` з запиту для вихідних рахунків. Згідно з 1С документацією (`1C_OUTGOING_INVOICES_SETUP.md`), вихідні рахунки **ТАКОЖ** потребують параметр `action`.

## Правильна структура запиту

### До виправлення (неправильно):
```javascript
POST /outgoing-invoices
{
  "limit": 100  // Відсутній action параметр
}
```

### Після виправлення (правильно):
```javascript
POST /outgoing-invoices  
{
  "action": "getOutgoingInvoices",  // Додано action параметр
  "limit": 100
}
```

## Виправлення коду

### 1. POST JSON body:
```javascript
body: JSON.stringify({ 
  action: 'getOutgoingInvoices',  // Додано
  limit: 100
})
```

### 2. GET URL parameters:
```javascript
response = await fetch(`${outgoingUrl}?action=getOutgoingInvoices&limit=100`, {
```

### 3. POST URL parameters:
```javascript
const urlWithParams = `${outgoingUrl}?action=getOutgoingInvoices&limit=100`;
```

### 4. Логування:
```javascript
console.log(`Параметри запиту: action=getOutgoingInvoices, limit=100 (використовуємо окремий endpoint для вихідних рахунків)`);
```

## Остаточна структура endpoints

### Вхідні накладні:
- **URL**: `POST /invoices`
- **Body**: `{"action": "getInvoices", "limit": 100}`

### Вихідні рахунки:
- **URL**: `POST /outgoing-invoices`
- **Body**: `{"action": "getOutgoingInvoices", "limit": 100}`

## Поточний статус

✅ **Код виправлено**: Всі три способи запиту (GET, POST JSON, POST URL params) тепер включають `action=getOutgoingInvoices`

❌ **Блокер**: HTTP 401 Unauthorized - проблема авторизації BAF сервера заважає повноцінному тестуванню

## Висновок

Запит тепер правильно формується на `/outgoing-invoices` endpoint з необхідним параметром `action=getOutgoingInvoices`. Структура запиту відповідає 1С документації та логіці HTTP-сервісу.

Дата виправлення: 2025-07-11