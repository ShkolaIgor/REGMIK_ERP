
# Логіка пошуку INDEX_PREDPR для XML імпорту

## Поточна логіка:
1. INDEX_PREDPR з XML → clients.external_id 
2. clients.id → supplier_id в supplier_receipts
3. Валідація: clients.is_supplier = true

## Проблема:
Клієнти-постачальники існують в БД продакшн, але система їх не знаходить.

## Потрібно перевірити:
1. Формат external_id в БД (string vs integer)
2. Наявність потрібних записів в clients
3. Правильність is_supplier flags

## Виправлення:
- Видалено автоматичне створення клієнтів
- Залишено тільки пошук існуючих

