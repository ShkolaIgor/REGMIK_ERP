# API Синхронізації REGMIK ERP

## Огляд

API синхронізації дозволяє зовнішнім системам (Bitrix24, 1C) передавати дані в REGMIK ERP. Система підтримує синхронізацію клієнтів, контактів та рахунків з автоматичною обробкою дублікатів.

## Базовий URL

```
POST /api/sync/
```

## Endpoints

### 1. Синхронізація клієнтів

**POST /api/sync/clients**

Створює нового клієнта або оновлює існуючого.

**Тіло запиту:**
```json
{
  "externalId": "BITRIX_12345",
  "name": "ТестКомпанія ТОВ",
  "taxCode": "12345678",
  "fullName": "Тестова Компанія Товариство з Обмеженою Відповідальністю",
  "legalAddress": "01001, м. Київ, вул. Хрещатик, 1",
  "physicalAddress": "01001, м. Київ, вул. Хрещатик, 1",
  "notes": "Клієнт синхронізований з Bitrix24",
  "isActive": true,
  "type": "юридична особа",
  "source": "bitrix24"
}
```

**Відповідь:**
```json
{
  "success": true,
  "client": {
    "id": 1,
    "taxCode": "12345678",
    "name": "ТестКомпанія ТОВ",
    "externalId": "BITRIX_12345",
    "source": "bitrix24",
    ...
  },
  "action": "linked"
}
```

**Логіка обробки:**
- `created` - створено нового клієнта
- `updated` - оновлено існуючого клієнта з таким же externalId
- `linked` - пов'язано існуючого клієнта (за tax_code) з зовнішньою системою

### 2. Синхронізація контактів

**POST /api/sync/contacts**

**Тіло запиту:**
```json
{
  "externalId": "BITRIX_CONTACT_567",
  "clientExternalId": "BITRIX_12345",
  "fullName": "Іван Петрович Коваленко",
  "position": "Генеральний директор",
  "email": "ivan.kovalenko@testcompany.ua",
  "primaryPhone": "+380671234567",
  "primaryPhoneType": "mobile",
  "isPrimary": true,
  "notes": "Основний контакт з Bitrix24",
  "isActive": true,
  "source": "bitrix24"
}
```

### 3. Синхронізація рахунків

**POST /api/sync/invoices**

**Тіло запиту:**
```json
{
  "externalId": "BITRIX_INVOICE_789",
  "clientExternalId": "BITRIX_12345",
  "invoiceNumber": "INV-2025-001",
  "amount": "15000.00",
  "currency": "UAH",
  "status": "issued",
  "issueDate": "2025-06-07",
  "dueDate": "2025-06-21",
  "description": "Послуги з розробки програмного забезпечення",
  "notes": "Рахунок синхронізований з Bitrix24",
  "source": "bitrix24"
}
```

### 4. Статистика синхронізації

**POST /api/sync/stats**

Повертає статистику синхронізованих даних.

## Приклади використання

### Bitrix24 Webhook
```php
$data = [
    'externalId' => $bitrix_client_id,
    'name' => $client['TITLE'],
    'taxCode' => $client['UF_CRM_TAX_CODE'],
    'source' => 'bitrix24'
];

$response = post_to_regmik('/api/sync/clients', $data);
```

### 1C REST API
```javascript
const clientData = {
    externalId: client.Ref_Key,
    name: client.Description,
    taxCode: client.EDNRPOU,
    source: '1c'
};

await axios.post('/api/sync/clients', clientData);
```

## Безпека

- Валідація всіх вхідних даних через Zod схеми
- Захист від SQL ін'єкцій через Drizzle ORM
- Логування всіх операцій синхронізації

## Підтримувані джерела

- `bitrix24` - Bitrix24 CRM
- `1c` - 1C:Підприємство
- `manual` - Ручне введення (за замовчуванням)