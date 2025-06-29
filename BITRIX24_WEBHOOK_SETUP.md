# Налаштування Webhook для Бітрікс24

## PHP файли для інтеграції

Створено два PHP файли для автоматичної синхронізації з ERP REGMIK:

### 1. `bitrix24-webhook-company.php` - Синхронізація компаній
**URL для webhook:** `https://ваш-домен/webhook/bitrix/company-to-erp/{companyId}`

**Функціонал:**
- Отримує дані компанії з Бітрікс24 API
- Автоматично шукає реквізити та адреси
- Відправляє в ERP з базовою авторизацією
- Генерує номер замовлення в ERP автоматично

### 2. `bitrix24-webhook-invoice.php` - Синхронізація рахунків
**URL для webhook:** `https://ваш-домен/webhook/bitrix/invoice-to-erp`

**Функціонал:**
- Отримує дані рахунку та позиції з Бітрікс24
- Автоматично створює товари в ERP якщо не знайдено
- Створює замовлення з позиціями в ERP
- Використовує авторизацію ШкоМ.:100

## Налаштування webhook в Бітрікс24

### 1. Створення webhook для компаній

1. Перейдіть в **Налаштування** → **Розробникам** → **Інші** → **Вхідні webhook**
2. Натисніть **Створити webhook**
3. Налаштуйте права доступу:
   - `crm.company.get` - читання компаній
   - `crm.requisite.list` - читання реквізитів
   - `crm.requisite.get` - читання конкретних реквізитів
   - `crm.address.list` - читання адрес

4. **URL обробника:** `https://ваш-домен/bitrix24-webhook-company.php`
5. **Події:**
   - `ONCRMCOMPANYADD` - додавання компанії
   - `ONCRMCOMPANYUPDATE` - оновлення компанії

### 2. Створення webhook для рахунків

1. Створіть новий webhook з правами:
   - `crm.invoice.get` - читання рахунків
   - `crm.invoice.productrows.get` - читання позицій рахунку

2. **URL обробника:** `https://ваш-домен/bitrix24-webhook-invoice.php`
3. **Події:**
   - `ONCRMINVOICEADD` - додавання рахунку
   - `ONCRMINVOICEUPDATE` - оновлення рахунку

## Структура даних

### Дані компанії для ERP:
```json
{
  "company": {
    "bitrix_id": "123",
    "title": "ТОВ Приклад",
    "phone": "+380501234567",
    "email": "info@example.com",
    "full_name": "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ ПРИКЛАД",
    "tax_code": "12345678",
    "legal_address": "Україна, Київ, вул. Примірна 1",
    "preset_id": 1
  }
}
```

### Дані рахунку для ERP:
```json
{
  "invoice": {
    "bitrix_id": "456",
    "account_number": "ІНВ-001",
    "date": "2025-06-29",
    "price": 1500.00,
    "currency": "UAH",
    "company_name": "ТОВ Приклад",
    "client_name": "Іванов Іван",
    "manager": "Менеджер",
    "status": "confirmed"
  },
  "items": [
    {
      "productName": "Товар 1",
      "quantity": 2,
      "price": 750.00,
      "productCode": "TOV001",
      "measureName": "шт"
    }
  ]
}
```

## Відповіді ERP

### Успішна синхронізація компанії:
```json
{
  "success": true,
  "message": "Компанію успішно синхронізовано з ERP",
  "client_id": 67
}
```

### Успішна синхронізація рахунку:
```json
{
  "success": true,
  "message": "Рахунок успішно синхронізовано з ERP",
  "order_id": 54,
  "order_number": "ORD-000054"
}
```

## Тестування

### Тест синхронізації компанії:
```bash
curl -X POST "https://ваш-домен/bitrix24-webhook-company.php" \
  -H "Content-Type: application/json" \
  -d '{"data":{"FIELDS":{"ID":"123"}}}'
```

### Тест синхронізації рахунку:
```bash
curl -X POST "https://ваш-домен/bitrix24-webhook-invoice.php" \
  -H "Content-Type: application/json" \
  -d '{"data":{"FIELDS":{"ID":"456"}}}'
```

## Логування

Всі операції логуються в ERP системі з префіксом `[WEBHOOK ERP]`:
- Створення компаній/клієнтів
- Генерація номерів замовлень
- Автоматичне створення товарів
- Створення позицій замовлень

## Підтримка

При помилках перевірте:
1. Доступність ERP за адресою `https://erp.regmik.ua`
2. Правильність логіну/паролю `ШкоМ.:100`
3. Права доступу webhook в Бітрікс24
4. Формат даних у запиті

Номери замовлень генеруються автоматично в ERP у форматі `ORD-XXXXXX`.