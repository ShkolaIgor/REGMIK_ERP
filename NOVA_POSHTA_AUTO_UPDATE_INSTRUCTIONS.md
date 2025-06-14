# Автоматичне оновлення Nova Poshta на продакшн

## Огляд
Система тепер підтримує автоматичне оновлення даних Nova Poshta аналогічно до курсів валют, з повним виправленням UTF-8 кодування для кирилічних символів.

## Функціональність
- Автоматичне оновлення даних Nova Poshta за розкладом
- Ручне оновлення через API
- Моніторинг статусу та налаштувань
- Правильна обробка UTF-8 кирилічних символів

## Налаштування за замовчуванням
- **Час оновлення**: 06:00 ранку
- **Дні оновлення**: Понеділок-П'ятниця (1-5)
- **Автоматичне оновлення**: Увімкнено

## API endpoints
- `GET /api/nova-poshta/status` - статус і налаштування
- `POST /api/nova-poshta/update` - ручне оновлення
- `POST /api/nova-poshta/settings` - зміна налаштувань

## Інструкції для оновлення продакшн

### 1. Зупиніть сервіс
```bash
sudo systemctl stop regmik-erp
```

### 2. Створіть backup
```bash
cd /opt/regmik-erp
sudo cp -r deployment-package deployment-package-backup-$(date +%Y%m%d-%H%M%S)
```

### 3. Оновіть файли
Замініть наступні файли в deployment-package:

**server/index.ts** - додано UTF-8 кодування та ініціалізацію Nova Poshta сервісу
**server/routes.ts** - додано UTF-8 декодування та API маршрути Nova Poshta
**server/nova-poshta-service.ts** - новий сервіс автоматичного оновлення

### 4. Встановіть права доступу
```bash
sudo chown -R regmik-erp:regmik-erp deployment-package/
```

### 5. Перебудуйте та запустіть
```bash
cd deployment-package
sudo -u regmik-erp npm run build
sudo systemctl start regmik-erp
```

### 6. Перевірте роботу
```bash
# Статус сервісу
sudo systemctl status regmik-erp

# Статус Nova Poshta
curl "http://localhost:5000/api/nova-poshta/status"

# Тест UTF-8 пошуку
curl "http://localhost:5000/api/nova-poshta/cities?q=чернігів"
```

## Логи після успішного запуску
```
Ініціалізація кешу Нової Пошти...
Синхронізовано 10558 міст Нової Пошти в базу даних
Синхронізовано 40443 відділень Нової Пошти в базу даних
Кеш Нової Пошти готовий: 10558 міст, 40443 відділень
Автоматичне оновлення курсів валют ініціалізовано
Налаштовано автоматичне оновлення Nova Poshta: 06:00 у дні 1,2,3,4,5
Наступне оновлення Nova Poshta: [дата наступного оновлення]
Автоматичне оновлення Nova Poshta ініціалізовано
```

## Очікувані результати
- Пошук міст працює з кирилічними символами
- "чернігів" повертає ~340 міст
- "київ" повертає ~150 міст
- Автоматичне оновлення Nova Poshta кожного робочого дня о 06:00
- Можливість ручного оновлення через API

## Налаштування розкладу оновлення
Для зміни розкладу використовуйте API:

```bash
curl -X POST "http://localhost:5000/api/nova-poshta/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "autoUpdateEnabled": true,
    "updateTime": "05:00",
    "updateDays": [1,2,3,4,5,6]
  }'
```

## Моніторинг
Перевіряйте логи сервісу для контролю оновлень:
```bash
sudo journalctl -u regmik-erp -f
```