# Інструкції розгортання UTF-8 рішення

## Доступні варіанти:

### Варіант 1: Повна міграція з перейменуванням (РЕКОМЕНДОВАНО)
```bash
# Перейменовує regmik-erp -> regmikerp_bak, створює нову UTF-8 regmik-erp
sudo ./migrate-database-with-rename.sh
```

**Результат:**
- Стара база: `regmikerp_bak` (backup)
- Нова база: `regmik-erp` (UTF-8)
- Повний backup файл створений
- Можливість швидкого rollback

### Варіант 2: JavaScript пошук (швидке рішення)
```bash
# Залишає поточну базу, змінює логіку пошуку
sudo ./deploy-utf8-fix.sh
```

**Результат:**
- База залишається незмінною
- Пошук працює через JavaScript фільтрування
- Мінімальний downtime (30 секунд)

### Rollback (якщо потрібно)
```bash
# Відновлює оригінальну базу з backup
sudo ./rollback-database-migration.sh
```

## Перевірка перед виконанням
```bash
# Діагностика поточного стану
sudo ./check-database-encoding.sh
```

## Тестування після розгортання
Система автоматично тестує:
- Пошук "че" = 1,451 результат
- Пошук "Чернівці", "Київ", "Харків"
- Перевірка працездатності сервісу

## Файли в комплекті:
- `migrate-database-with-rename.sh` - повна міграція
- `deploy-utf8-fix.sh` - JavaScript пошук
- `rollback-database-migration.sh` - відкат змін
- `check-database-encoding.sh` - діагностика
- `deployment-package/` - оновлені файли коду