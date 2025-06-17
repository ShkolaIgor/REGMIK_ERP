# Керівництво з міграцій бази даних

Посібник з роботи з міграціями бази даних для ERP системи.

## Доступні скрипти

### Швидкий запуск міграції 0032
```bash
./run-migration-0032.sh
```

### Універсальний скрипт міграцій
```bash
./run-migration.sh [ОПЦІЇ] [ФАЙЛ_МІГРАЦІЇ]
```

## Команди

### Показ всіх доступних міграцій
```bash
./run-migration.sh --list
```

### Запуск конкретної міграції
```bash
./run-migration.sh 0032_post_0031_complete_sync.sql
./run-migration.sh 0032_post_0031_complete_sync
```

### Запуск останньої міграції
```bash
./run-migration.sh --latest
```

### Міграція з резервною копією
```bash
./run-migration.sh --backup 0032_post_0031_complete_sync.sql
```

### Міграція з подальшим Drizzle push
```bash
./run-migration.sh --drizzle-push 0032_post_0031_complete_sync.sql
```

### Комбіновані опції
```bash
./run-migration.sh --backup --drizzle-push --latest
```

## Опції

| Опція | Опис |
|-------|------|
| `--backup` | Створює резервну копію бази даних перед міграцією |
| `--list` | Показує всі доступні міграції |
| `--latest` | Запускає останню міграцію |
| `--drizzle-push` | Виконує `drizzle-kit push` після міграції |
| `--help` | Показує довідку |

## Вимоги

- PostgreSQL клієнт (psql)
- Змінна середовища `DATABASE_URL`
- Доступ до бази даних

## Структура міграцій

Міграції зберігаються в директорії `migrations/` з розширенням `.sql`.

### Міграція 0032
Файл: `migrations/0032_post_0031_complete_sync.sql`

Виправляє:
- Структуру таблиці `carriers` (додає `alternative_names`)
- Поля відправника та отримувача в `shipments`
- Видаляє поля цін з `shipment_items`
- Створює оптимізаційні індекси

## Резервні копії

Резервні копії створюються в директорії `backups/` з форматом:
```
backup_before_[назва_міграції]_YYYYMMDD_HHMMSS.sql
```

## Усунення неполадок

### Помилка підключення до бази даних
Перевірте змінну `DATABASE_URL`:
```bash
echo $DATABASE_URL
```

### Міграція не знайдена
Перегляньте доступні міграції:
```bash
./run-migration.sh --list
```

### Помилка PostgreSQL
Переконайтеся що встановлено PostgreSQL клієнт:
```bash
psql --version
```

## Приклади використання

### Базовий запуск
```bash
./run-migration.sh 0032_post_0031_complete_sync.sql
```

### Безпечний запуск з резервною копією
```bash
./run-migration.sh --backup 0032_post_0031_complete_sync.sql
```

### Повний цикл з синхронізацією
```bash
./run-migration.sh --backup --drizzle-push 0032_post_0031_complete_sync.sql
```