# Інструкції розгортання виправлень панелей валют на продакшн

## Версія: 12.06.2025 12:00:00

### Опис оновлення
Повне виправлення функціональності панелей валют з віджетами, включаючи оновлення бази даних та коду додатка.

### Файли для передачі на сервер
```
migrations/0026_currency_widget_fixes.sql
deploy-complete-currency-update.sh
update-database-currency-widgets.sh
CURRENCY_WIDGET_FIX_INSTRUCTIONS.md
```

### Швидке розгортання (рекомендовано)

1. **Завантажити на сервер:**
```bash
scp deploy-complete-currency-update.sh regmik@192.168.0.247:/opt/regmik-erp/
scp migrations/0026_currency_widget_fixes.sql regmik@192.168.0.247:/opt/regmik-erp/migrations/
```

2. **Запустити на сервері:**
```bash
ssh regmik@192.168.0.247
cd /opt/regmik-erp
sudo ./deploy-complete-currency-update.sh
```

### Або покрокове оновлення

#### Крок 1: Оновлення бази даних
```bash
scp update-database-currency-widgets.sh regmik@192.168.0.247:/opt/regmik-erp/
scp migrations/0026_currency_widget_fixes.sql regmik@192.168.0.247:/opt/regmik-erp/migrations/
ssh regmik@192.168.0.247
cd /opt/regmik-erp
sudo ./update-database-currency-widgets.sh
```

#### Крок 2: Оновлення коду
```bash
scp deploy-currency-widget-fix.sh regmik@192.168.0.247:/opt/regmik-erp/
ssh regmik@192.168.0.247
cd /opt/regmik-erp
sudo ./deploy-currency-widget-fix.sh
```

### Зміни в базі даних
- Створення/оновлення таблиць `currency_dashboards` та `currency_widgets`
- Додавання індексів для продуктивності
- Створення тригерів для автоматичного оновлення часових міток
- Додавання панелей за замовчуванням для існуючих користувачів
- Додавання базових віджетів (USD, EUR)

### Зміни в коді
- Виправлення завантаження віджетів у `server/db-storage.ts`
- Розширення підтримки типів віджетів у `client/src/pages/currencies.tsx`
- Підтримка як старих (з дефісами), так і нових (з підкресленнями) типів віджетів

### Результат
Після успішного розгортання:
- Панелі валют повністю функціональні
- Можна створювати нові панелі та віджети
- Підтримуються типи: rate_card, rate_chart, rate_comparison, rate_trend, rate_history
- Усунена помилка "Невідомий тип віджета"

### Доступ для тестування
- URL: http://192.168.0.247:5000
- Користувачі: ShkolaIhor/123456 або demo/demo123
- Навігація: Валюти → Панелі

### Відкат у разі проблем
Всі скрипти створюють резервні копії. У разі проблем:
```bash
sudo systemctl stop regmik-erp
# Відновити файли з backup директорії
# Відновити базу даних з backup файлу
sudo systemctl start regmik-erp
```