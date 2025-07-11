# 1C Endpoints - Curl тести

## Тест 1: Вхідні накладні (працює)

```bash
curl -X POST "http://baf.regmik.ua/bitrix/hs/erp/invoices" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Basic MTAwOtCo0LrQvtCcLg==" \
  -H "User-Agent: REGMIK-ERP/1.0" \
  -d '{
    "action": "getInvoices",
    "limit": 100
  }'
```

## Тест 2: Вихідні рахунки (виправлений)

```bash
curl -X POST "http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Basic MTAwOtCo0LrQvtCcLg==" \
  -H "User-Agent: REGMIK-ERP/1.0" \
  -d '{
    "action": "getOutgoingInvoices",
    "limit": 100
  }'
```

## Тест 3: Вихідні рахунки (GET з параметрами)

```bash
curl -X GET "http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices?action=getOutgoingInvoices&limit=100" \
  -H "Accept: application/json" \
  -H "Authorization: Basic MTAwOtCo0LrQvtCcLg==" \
  -H "User-Agent: REGMIK-ERP/1.0"
```

## Тест 4: Вихідні рахунки (POST з URL параметрами)

```bash
curl -X POST "http://baf.regmik.ua/bitrix/hs/erp/outgoing-invoices?action=getOutgoingInvoices&limit=100" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -H "Authorization: Basic MTAwOtCo0LrQvtCcLg==" \
  -H "User-Agent: REGMIK-ERP/1.0"
```

## Очікувані результати

### Успішна відповідь (HTTP 200):
```json
{
  "invoices": [
    {
      "documentNumber": "INV-001",
      "date": "2025-07-11",
      "supplier": "Постачальник",
      "amount": 1000.00,
      "currency": "UAH",
      "items": [...]
    }
  ],
  "total": 1,
  "timestamp": "2025-07-11 10:30:00"
}
```

### Помилка 401 (поточна):
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"...
<title>Подробные данные об ошибке IIS</title>
```

### Помилка 404 (endpoint не існує):
```html
<title>404 - Страница не найдена</title>
```

## Примітки

- **MTAwOtCo0LrQvtCcLg==** - це Base64 кодування "100:ШкоМ."
- Поточна проблема: HTTP 401 - проблема авторизації на BAF сервері
- Виправлений код ERP тепер правильно формує всі запити