# Виправлення проблеми з тестовими даними в 1С інтеграції

## Проблема

Користувач отримував тестові дані замість реальних рахунків з 1С системи при використанні функції "Імпорт вихідних рахунків з 1С".

## Причина

Система мала множинні fallback механізми, які автоматично повертали demo дані при будь-яких проблемах з'єднання з 1С сервером:

1. **Fallback в storage функції** - `get1COutgoingInvoices()` автоматично викликала `getDemoOutgoingInvoices()`
2. **Fallback в API endpoint** - `/api/1c/outgoing-invoices` мав try-catch з поверненням до demo даних
3. **Demo функція існувала** - `getDemoOutgoingInvoices()` завжди повертала тестові рахунки

## Виправлення

### 1. Оновлено storage функцію

**Файл:** `server/db-storage.ts`

```typescript
async get1COutgoingInvoices() {
  try {
    // Перевірка URL конфігурації - тепер кидає помилку замість fallback
    if (!config?.baseUrl || config.baseUrl.trim() === '' || config.baseUrl === 'http://') {
      throw new Error("1C URL не налаштований. Будь ласка, вкажіть URL 1C сервера в налаштуваннях інтеграції.");
    }

    // Покращене формування URL
    // GET запит замість POST
    // Збільшений timeout до 30 секунд
    // Детальне логування запитів та відповідей

  } catch (error) {
    console.error('Критична помилка отримання вихідних рахунків з 1C:', error);
    throw error; // Кидаємо помилку замість fallback
  }
}
```

### 2. Видалено fallback з API endpoint

**Файл:** `server/routes.ts`

```typescript
app.get('/api/1c/outgoing-invoices', isSimpleAuthenticated, async (req, res) => {
  try {
    console.log('Запит вихідних рахунків з 1С через API endpoint');
    const outgoingInvoices = await storage.get1COutgoingInvoices();
    console.log(`API endpoint повертає ${outgoingInvoices.length} вихідних рахунків`);
    res.json(outgoingInvoices);
  } catch (error) {
    console.error('Критична помилка отримання вихідних рахунків з 1С:', error);
    res.status(500).json({ 
      message: 'Не вдалося отримати вихідні рахунки з 1С', 
      error: error instanceof Error ? error.message : 'Невідома помилка'
    });
  }
});
```

### 3. Видалено demo функцію

**Файл:** `server/db-storage.ts`

```typescript
// ДЕМО ДАНІ ВИДАЛЕНО - система працює тільки з реальними даними з 1С
```

## Результат

Тепер система **гарантовано** не може повернути тестові дані. При натисканні кнопки "Імпорт вихідних рахунків з 1С" відбувається:

1. **Перевірка конфігурації** - якщо URL не налаштований, показується чітка помилка
2. **Запит до 1С сервера** - система робить GET запит до правильного endpoint
3. **Обробка реальних даних** - парсинг полів invoiceNumber, clientName, totalAmount тощо
4. **Детальні помилки** - якщо з'єднання не вдалося, показується точна причина

## Налаштування URL

Система тепер правильно формує URL для вихідних рахунків:

- `http://192.168.0.1/accounting/hs/erp/invoices` → `http://192.168.0.1/accounting/hs/erp/outgoing-invoices`
- Додає параметри: `?action=getInvoices&limit=100`
- Використовує GET запит замість POST

## Діагностика

Всі запити до 1С сервера тепер логуються:

```
Запит реальних вихідних рахунків з 1C: http://192.168.0.1/accounting/hs/erp/outgoing-invoices
Параметри запиту: action=getInvoices, limit=100
1C відповідь: 200 OK
1C raw response: {"invoices": [...]}
Успішно оброблено 15 вихідних рахунків
```

## Тестування

Для перевірки виправлення:

1. Відкрийте ERP → Інтеграції → 1С інтеграцію
2. Натисніть "Імпорт вихідних рахунків з 1С"
3. Система показуватиме або реальні дані з 1С, або чітку помилку

**Тестові дані більше неможливі!**