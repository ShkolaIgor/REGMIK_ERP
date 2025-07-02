# Production Debugging Guide для Бітрікс24 Інтеграції

## Детальне логування в production

Система тепер включає повне логування всіх етапів обробки запитів з Бітрікс24. Усі лог-повідомлення мають префікс `[BITRIX ORDER]` для легкого пошуку.

### Етапи логування

#### 1. Початок обробки запиту
```
[BITRIX ORDER] =================== ПОЧАТОК ОБРОБКИ ===================
[BITRIX ORDER] HTTP Headers: {...}
[BITRIX ORDER] Request Body Type: object
[BITRIX ORDER] Request Body Keys: [...]
[BITRIX ORDER] Повні дані запиту: {...}
```

#### 2. Валідація даних
```
[BITRIX ORDER] Витягнуті поля:
  - invoiceNumb: INV-001
  - clientEDRPOU: 1234567890
  - companyEDRPOU: 0987654321
  - items: [...]
  - items type: object
  - items length: 2
```

#### 3. Пошук клієнта
```
[BITRIX ORDER] =============== ПОШУК КЛІЄНТА ===============
[BITRIX ORDER] Загальна кількість клієнтів в базі: 150
[BITRIX ORDER] Шукаємо клієнта з податковим кодом: 1234567890
[BITRIX ORDER] Клієнти з податковими кодами: [{id: 1, name: "...", taxCode: "..."}]
[BITRIX ORDER] Знайдений клієнт: ТОВ "Тест" (ID: 67) | НЕ ЗНАЙДЕНО
```

#### 4. Пошук компанії
```
[BITRIX ORDER] =============== ПОШУК КОМПАНІЇ ===============
[BITRIX ORDER] Загальна кількість компаній в базі: 3
[BITRIX ORDER] Шукаємо компанію з податковим кодом: 0987654321
[BITRIX ORDER] Компанії з податковими кодами: [{id: 1, name: "...", taxCode: "..."}]
[BITRIX ORDER] Знайдена компанія: РЕГМІК (ID: 1) | НЕ ЗНАЙДЕНО
```

#### 5. Обробка товарів
```
[BITRIX ORDER] =============== ОБРОБКА ТОВАРІВ ===============
[BITRIX ORDER] Загальна кількість товарів в базі: 74
[BITRIX ORDER] Обробляємо 2 позицій з рахунку:
[BITRIX ORDER] === Позиція 1 ===
[BITRIX ORDER] Дані позиції: {...}
[BITRIX ORDER] Автоматично створено товар: Тест товар (SKU: BTX-TEST001, ID: 75)
[BITRIX ORDER] Знайдено існуючий товар: Існуючий товар (ID: 25)
[BITRIX ORDER] Обчислення цін для позиції:
  - Кількість: 2
  - Ціна за одиницю: 100.50
  - Загальна ціна: 201.00
[BITRIX ORDER] Створена позиція замовлення: {...}
```

#### 6. Створення замовлення
```
[BITRIX ORDER] =============== СТВОРЕННЯ ЗАМОВЛЕННЯ ===============
[BITRIX ORDER] Дані замовлення для створення: {...}
[BITRIX ORDER] Позиції замовлення (2): [...]
[BITRIX ORDER] Загальна сума позицій: 301.50
[BITRIX ORDER] Викликаємо storage.createOrder...
[BITRIX ORDER] ✅ Замовлення створено з ID: 64
```

#### 7. Обробка помилок
```
[BITRIX ORDER] ❌ КРИТИЧНА ПОМИЛКА: Error: ...
[BITRIX ORDER] Stack trace: ...
[BITRIX ORDER] Деталі помилки: {name: "...", message: "...", cause: "..."}
[BITRIX ORDER] =================== ЗАВЕРШЕНО З ПОМИЛКОЮ ===================
```

### Тестові endpoints

#### Тест логування
```bash
POST /api/bitrix/test-logging
Content-Type: application/json

{
  "test": "діагностика",
  "data": "будь-які дані"
}
```

#### Повний тест створення замовлення
```bash
POST /api/bitrix/create-order-from-invoice
Content-Type: application/json

{
  "invoiceNumb": "TEST-001",
  "clientEDRPOU": "1234567890",
  "companyEDRPOU": "0987654321",
  "items": [
    {
      "productName": "Тестовий товар",
      "quantity": 1,
      "priceAccount": 100.00,
      "priceBrutto": 120.00,
      "measureSymbol": "товар",
      "productCode": "TEST-001"
    }
  ]
}
```

### Типові проблеми та діагностика

#### 1. Дані не приходять
- Перевірте `[BITRIX ORDER] Request Body:` - чи є дані?
- Перевірте `Content-Type` header - має бути `application/json`
- Перевірте `Request Body Keys` - чи є потрібні поля?

#### 2. Клієнт/компанія не знайдені
- Перевірте список `Клієнти з податковими кодами` в логах
- Переконайтеся що taxCode в базі точно збігається з clientEDRPOU/companyEDRPOU
- Перевірте чи є null значення в taxCode полях

#### 3. Товари не створюються
- Перевірте `[BITRIX ORDER] Дані позиції:` для кожної позиції
- Переконайтеся що productName не пустий
- Перевірте чи правильно парситься priceAccount

#### 4. Замовлення не створюється
- Перевірте `[BITRIX ORDER] Дані замовлення для створення:`
- Переконайтеся що всі обов'язкові поля заповнені
- Перевірте помилки в storage.createOrder()

### Де знайти логи в Replit

Логи знаходяться в консолі workflow:

1. **Відкрийте панель "Workflows"** (зліва в меню)
2. **Виберіть workflow "Start application"**
3. **Переглядайте консольний вивід в реальному часі**

Усі логи Бітрікс24 інтеграції мають префікс `[BITRIX ORDER]` та відображаються в консолі workflow.

### Як шукати специфічні логи:

1. **Використовуйте пошук у консолі** (Ctrl+F):
   - `[BITRIX ORDER]` - всі логи інтеграції
   - `ПОЧАТОК ОБРОБКИ` - початок кожного запиту
   - `КРИТИЧНА ПОМИЛКА` - серйозні помилки
   - `Замовлення створено з ID` - успішні створення

2. **Фільтрування за часом:**
   Логи показують timestamp кожного повідомлення

### Моніторинг в production (на сервері)

1. **Пошук логів по часу:**
   ```bash
   grep "\[BITRIX ORDER\]" logs.txt | grep "2025-07-02 19:"
   ```

2. **Пошук конкретних помилок:**
   ```bash
   grep "КРИТИЧНА ПОМИЛКА" logs.txt
   ```

3. **Статистика обробки:**
   ```bash
   grep "ПОЧАТОК ОБРОБКИ" logs.txt | wc -l
   grep "Замовлення створено з ID" logs.txt | wc -l
   ```

4. **Моніторинг автоматичного створення товарів:**
   ```bash
   grep "Автоматично створено товар" logs.txt
   ```

### URL для тестування

- Production URL: `https://f8b5b2ba-8ffe-4b9f-85c7-4b82acc96cfe-00-2vxegxo6dxlmg.picard.replit.dev`
- Endpoint: `/api/bitrix/create-order-from-invoice`
- Test endpoint: `/api/bitrix/test-logging`

### Контакти

- Розробник: ShkolaIhor
- Система: REGMIK ERP з Бітрікс24 інтеграцією
- Документація: replit.md