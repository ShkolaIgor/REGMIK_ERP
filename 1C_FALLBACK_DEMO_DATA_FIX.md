# Виправлення проблеми з fallback demo даними в 1C інтеграції

## Проблема
Після видалення fallback demo даних з функції `get1COutgoingInvoices()`, регулярна інтеграція 1С (функція `get1CInvoices()`) перестала працювати через використання застарілої функції `getProduction1CDemo()`.

## Виправлення (11 липня 2025)

### 1. Видалено fallback на demo дані
Замінено fallback логіку в `get1CInvoices()`:

**БУЛО:**
```typescript
if (!config?.baseUrl || config.baseUrl.trim() === '' || config.baseUrl === 'http://') {
  console.log("1C URL не налаштований, використовуємо production demo режим");
  return await this.getProduction1CDemo();
}
```

**СТАЛО:**
```typescript
if (!config?.baseUrl || config.baseUrl.trim() === '' || config.baseUrl === 'http://') {
  throw new Error("1C URL не налаштований. Будь ласка, вкажіть URL 1C сервера в налаштуваннях інтеграції.");
}
```

### 2. Повністю видалено demo функцію
- Видалено функцію `getProduction1CDemo()` з файлу `server/db-storage.ts`
- Видалено всі demo дані та логіку fallback
- Система тепер працює тільки з реальними даними з 1С

### 3. Результат
- ✅ Регулярна інтеграція 1С (`get1CInvoices()`) тепер працює з реальними даними
- ✅ Інтеграція вихідних рахунків (`get1COutgoingInvoices()`) продовжує працювати з реальними даними
- ✅ Повністю усунуто можливість отримання demo/тестових даних
- ✅ Система вимагає правильного налаштування URL 1С сервера

## Як налаштувати 1С інтеграцію
1. Перейдіть в розділ "Інтеграції"
2. Знайдіть 1С інтеграцію
3. Вкажіть правильний URL 1С сервера (наприклад: `http://baf.regmik.ua/bitrix/hs/erp/invoices`)
4. Введіть правильні clientId та clientSecret
5. Збережіть налаштування

## Технічні деталі
- Файл: `server/db-storage.ts`
- Функції: `get1CInvoices()`, `get1COutgoingInvoices()`
- Видалено: `getProduction1CDemo()` (рядки 10462-10631)
- Статус: Повністю виправлено та протестовано

Система тепер гарантовано працює тільки з реальними даними з 1С без можливості fallback на demo дані.