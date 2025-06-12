# Інструкції розгортання виправлень віджетів валют

## Версія: 12.06.2025 11:40:00

### Що було виправлено

1. **Завантаження віджетів панелей валют** - виправлено помилку в database query
2. **Підтримка типів віджетів** - додано сумісність для всіх типів (rate_card, rate_chart, rate_trend, rate_history)
3. **Відображення віджетів** - виправлено рендеринг різних типів віджетів
4. **Помилка "Невідомий тип віджета"** - повністю усунена

### Файли для оновлення

- `server/db-storage.ts` - виправлено завантаження віджетів
- `client/src/pages/currencies.tsx` - виправлено типи та рендеринг віджетів

### Інструкції розгортання

#### На сервері продакшн (192.168.0.247):

```bash
# 1. Завантажити скрипт розгортання
scp deploy-currency-widget-fix.sh regmik@192.168.0.247:/opt/regmik-erp/

# 2. Підключитися до сервера
ssh regmik@192.168.0.247

# 3. Перейти до директорії проекту
cd /opt/regmik-erp

# 4. Запустити скрипт розгортання
sudo ./deploy-currency-widget-fix.sh
```

### Або ручне оновлення:

#### 1. Зупинити сервіс
```bash
sudo systemctl stop regmik-erp
```

#### 2. Створити резервну копію
```bash
cp server/db-storage.ts server/db-storage.ts.backup.$(date +%Y%m%d_%H%M%S)
cp client/src/pages/currencies.tsx client/src/pages/currencies.tsx.backup.$(date +%Y%m%d_%H%M%S)
```

#### 3. Оновити файли

**server/db-storage.ts** - метод `getCurrencyDashboards`:
```typescript
async getCurrencyDashboards(userId: number): Promise<any[]> {
  try {
    const dashboards = await db.select()
      .from(currencyDashboards)
      .where(eq(currencyDashboards.userId, userId))
      .orderBy(desc(currencyDashboards.isDefault), desc(currencyDashboards.updatedAt));
    
    // Завантажуємо віджети для кожної панелі
    for (const dashboard of dashboards) {
      const widgets = await db.select()
        .from(currencyWidgets)
        .where(eq(currencyWidgets.dashboardId, dashboard.id))
        .orderBy(currencyWidgets.createdAt);
      
      dashboard.widgets = widgets;
    }
    
    return dashboards;
  } catch (error) {
    console.error("Error fetching currency dashboards:", error);
    return [];
  }
}
```

**client/src/pages/currencies.tsx** - метод `renderWidget`:
- Додати підтримку всіх типів віджетів:
  - `rate-display` або `rate_card`
  - `rate-chart` або `rate_chart`
  - `currency-summary` або `rate_comparison`
  - `rate_trend`
  - `rate_history`

#### 4. Побудувати додаток
```bash
npm run build
```

#### 5. Запустити сервіс
```bash
sudo systemctl start regmik-erp
```

#### 6. Перевірити статус
```bash
sudo systemctl status regmik-erp
```

### Тестування

1. Відкрити http://192.168.0.247:5000
2. Авторизуватися (ShkolaIhor/123456)
3. Перейти до "Валюти" → вкладка "Панелі"
4. Створити нову панель
5. Додати віджети різних типів
6. Переконатися що віджети відображаються правильно

### Підтримка

У разі проблем:
- Перевірити логи: `sudo journalctl -u regmik-erp -f`
- Відновити з резервної копії
- Перезапустити сервіс

### Результат

Після успішного розгортання:
- Панелі валют працюють повноцінно
- Віджети створюються та відображаються
- Підтримуються всі типи віджетів
- Усунена помилка "Невідомий тип віджета"