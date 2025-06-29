# Документація інтеграції з Бітрікс24

## Огляд

Система містить функції для синхронізації клієнтів та рахунків з Бітрікс24 CRM в ERP систему REGMIK, аналогічно до існуючої інтеграції з 1C.

## Функціонал

### 1. Синхронізація компаній з Бітрікс24

**Endpoint:** `POST /api/bitrix/sync-company/:companyId`

**Опис:** Синхронізує дані компанії з Бітрікс24 до ERP системи

**Параметри:**
- `companyId` (string) - ID компанії в Бітрікс24

**Приклад запиту:**
```bash
curl -X POST http://localhost:5000/api/bitrix/sync-company/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Приклад відповіді:**
```json
{
  "success": true,
  "message": "Клієнт успішно синхронізований: ТОВ «Приклад»",
  "clientId": 45
}
```

### 2. Синхронізація рахунків з Бітрікс24

**Endpoint:** `POST /api/bitrix/sync-invoice`

**Опис:** Синхронізує рахунок з Бітрікс24 до ERP системи

**Параметри тіла запиту:**
```json
{
  "ID": "456",
  "ACCOUNT_NUMBER": "INV-2025-001",
  "DATE": "2025-06-29",
  "PRICE": 15000.00,
  "CURRENCY": "UAH",
  "CLIENT": "123",
  "MANAGER": "manager@company.com",
  "STATUS": "NEW"
}
```

**Приклад запиту:**
```bash
curl -X POST http://localhost:5000/api/bitrix/sync-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ID": "456",
    "ACCOUNT_NUMBER": "INV-2025-001",
    "DATE": "2025-06-29",
    "PRICE": 15000.00,
    "CURRENCY": "UAH",
    "CLIENT": "123",
    "STATUS": "NEW"
  }'
```

### 3. Масова синхронізація компаній

**Endpoint:** `POST /api/bitrix/sync-all-companies`

**Опис:** Масово синхронізує всі компанії з Бітрікс24

**Приклад запиту:**
```bash
curl -X POST http://localhost:5000/api/bitrix/sync-all-companies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Масова синхронізація рахунків

**Endpoint:** `POST /api/bitrix/sync-all-invoices`

**Опис:** Масово синхронізує всі рахунки з Бітрікс24

## Налаштування

### Необхідні кроки для користувача:

1. **Отримати API ключі Бітрікс24:**
   - Увійдіть до свого Бітрікс24 порталу
   - Перейдіть до "Налаштування" → "Інтеграції" → "Вебхуки"
   - Створіть новий вебхук з правами на читання CRM
   - Скопіюйте URL та токен доступу

2. **Налаштувати функції отримання даних:**
   У файлі `server/bitrix-sync.ts` замініть заглушки на реальні виклики до Бітрікс24 REST API:

```typescript
// Приклад реалізації getCompanyData
async function getCompanyData(companyId: string): Promise<BitrixCompanyData | null> {
  const apiUrl = `${process.env.BITRIX24_WEBHOOK_URL}crm.company.get?id=${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Помилка отримання даних компанії:', error);
    return null;
  }
}
```

3. **Додати змінні середовища:**
```bash
BITRIX24_WEBHOOK_URL=https://your-portal.bitrix24.ua/rest/1/your-webhook-token/
```

## Мапінг даних

### Компанії (Бітрікс24 → ERP)

| Поле Бітрікс24 | Поле ERP | Опис |
|----------------|----------|------|
| TITLE | name | Назва компанії |
| RQ_COMPANY_FULL_NAME | fullName | Повна назва |
| RQ_INN | taxCode | ІПН |
| RQ_EDRPOU | taxCode | ЄДРПОУ |
| PHONE[0].VALUE | телефон контакту | Основний телефон |
| EMAIL[0].VALUE | email контакту | Основний email |
| PRESET_ID | clientTypeId | Тип клієнта (1-юр.особа, 2-фіз.особа) |

### Рахунки (Бітрікс24 → ERP)

| Поле Бітрікс24 | Поле ERP | Опис |
|----------------|----------|------|
| ACCOUNT_NUMBER | orderNumber | Номер рахунку |
| PRICE | totalAmount | Загальна сума |
| DATE | orderDate | Дата створення |
| STATUS | status | Статус замовлення |

### Статуси (Бітрікс24 → ERP)

| Статус Бітрікс24 | Статус ERP | Опис |
|------------------|------------|------|
| NEW, PREPARATION | pending | Новий/Підготовка |
| PREPAYMENT_INVOICE, EXECUTING | confirmed | Підтверджений |
| FINAL_INVOICE | in_progress | В роботі |
| SENT | shipped | Відправлений |
| PAID, WON | delivered | Доставлений |
| LOSE, DECLINED | cancelled | Скасований |

## Приклади використання

### Синхронізація однієї компанії з JavaScript

```javascript
async function syncCompanyFromBitrix(companyId) {
  try {
    const response = await fetch(`/api/bitrix/sync-company/${companyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Компанія синхронізована: ${result.message}`);
      return result.clientId;
    } else {
      console.error(`Помилка синхронізації: ${result.message}`);
    }
  } catch (error) {
    console.error('Помилка запиту:', error);
  }
}
```

### Синхронізація рахунку з JavaScript

```javascript
async function syncInvoiceFromBitrix(invoiceData) {
  try {
    const response = await fetch('/api/bitrix/sync-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Рахунок синхронізований: ${result.message}`);
      return result.orderId;
    } else {
      console.error(`Помилка синхронізації: ${result.message}`);
    }
  } catch (error) {
    console.error('Помилка запиту:', error);
  }
}
```

## Порівняння з 1C інтеграцією

Функції синхронізації з Бітрікс24 створені за аналогією з існуючими функціями 1C (`sendCompanyDataTo1C`, `sendInvoiceTo1C`):

### Спільні риси:
- Автоматичне створення/оновлення клієнтів
- Синхронізація реквізитів компаній
- Обробка рахунків та їх позицій
- Логування операцій
- Обробка помилок

### Відмінності:
- Бітрікс24 використовує REST API замість SOAP
- Інша структура даних та поля
- Різні методи автентифікації
- Інші статуси та типи документів

## Можливості розширення

1. **Синхронізація товарів** - додавання функцій для синхронізації каталогу товарів
2. **Webhook підтримка** - автоматична синхронізація при змінах в Бітрікс24
3. **Двостороння синхронізація** - відправка змін з ERP назад в Бітрікс24
4. **Планувальник** - автоматична синхронізація за розкладом
5. **Налаштування мапінгу** - UI для налаштування відповідності полів

## Логування та моніторинг

Всі операції синхронізації логуються в консоль з детальною інформацією:

```
Створено нового клієнта в ERP: ТОВ «Приклад» (ID: 45)
Оновлено клієнта в ERP: ТОВ «Тест» (ID: 23)
Створено нове замовлення в ERP: INV-2025-001 (ID: 67)
```

Для production середовища рекомендується додати логування в базу даних або файли.