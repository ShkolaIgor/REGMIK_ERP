# Nova Poshta Production Database Update Guide

## Проблема
Міграції 0028 і 0029 містили неповну структуру таблиць Nova Poshta. У коді використовуються додаткові поля, які відсутні в міграціях.

## Рішення
Створено міграцію 0030, яка виправляє структуру таблиць відповідно до фактичного коду.

## Різниця між міграціями

### Міграція 0029 (неповна)
- `nova_poshta_cities`: 6 полів (ref, name, area, region, last_updated, id)
- `nova_poshta_warehouses`: 9 полів (ref, city_ref, description, description_ru, short_address, phone, schedule, number, place_max_weight_allowed)

### Міграція 0030 (повна)
- `nova_poshta_cities`: 13 полів (додано name_ru, area_ru, region_ru, settlement_type, delivery_city, warehouses, is_active)
- `nova_poshta_warehouses`: 29 полів (додано всі необхідні поля з Nova Poshta API)

## Додані поля в nova_poshta_cities
- `name_ru` - назва російською
- `area_ru` - область російською  
- `region_ru` - регіон російською
- `settlement_type` - тип населеного пункту
- `delivery_city` - місто доставки
- `warehouses` - кількість відділень
- `is_active` - статус активності

## Додані поля в nova_poshta_warehouses
- `short_address_ru` - коротка адреса російською
- `type_of_warehouse` - тип відділення
- `category_of_warehouse` - категорія відділення
- `reception` - прийом (JSON)
- `delivery` - видача (JSON)
- `district_code` - код району
- `ward_code` - код округу
- `settlement_area_description` - опис району
- `sending_limitations_on_dimensions` - обмеження відправки (JSON)
- `receiving_limitations_on_dimensions` - обмеження отримання (JSON)
- `post_finance` - поштовий фінанс
- `bicycle_parking` - велопарковка
- `payment_access` - доступ до оплати
- `pos_terminal` - POS термінал
- `international_shipping` - міжнародна доставка
- `self_service_workplaces_count` - кількість місць самообслуговування
- `total_max_weight_allowed` - максимальна вага
- `longitude` - довгота
- `latitude` - широта
- `is_active` - статус активності

## Кроки для оновлення продакшн БД

### 1. Підготовка
```bash
# Завантажити файли на сервер
scp migrations/0030_fix_nova_poshta_tables.sql server:/path/to/app/
scp update-production-nova-poshta.sh server:/path/to/app/
```

### 2. Налаштування змінних середовища
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=your_user
export DB_NAME=your_database
export PGPASSWORD=your_password
```

### 3. Виконання оновлення
```bash
# Запустити скрипт оновлення
./update-production-nova-poshta.sh
```

### 4. Альтернативний спосіб (ручне виконання)
```bash
# Застосувати міграції по черзі
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0028_add_carrier_sync_settings.sql
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0029_add_nova_poshta_integration.sql  
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/0030_fix_nova_poshta_tables.sql
```

## Перевірка результату

### Перевірка структури
```sql
-- Перевірити кількість полів у таблицях
SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'nova_poshta_cities';
-- Очікуваний результат: 13

SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'nova_poshta_warehouses';  
-- Очікуваний результат: 29
```

### Перевірка індексів
```sql
SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('nova_poshta_cities', 'nova_poshta_warehouses');
-- Очікуваний результат: 8
```

## Після оновлення

1. Перезапустити додаток
2. Перейти в розділ "Перевізники"
3. Знайти Nova Poshta та натиснути "Синхронізувати"
4. Дочекатися завершення синхронізації (~10,000 міст + ~40,000 відділень)

## Виправлені помилки

- ✅ Foreign key constraint violations при синхронізації
- ✅ Відсутні поля в структурі БД
- ✅ Неправильні типи даних для JSON полів
- ✅ Відсутні індекси для оптимізації

## Технічні деталі

### Методи синхронізації
- Замінено DELETE/INSERT на UPSERT операції
- Додано UPDATE ON CONFLICT для безпечного оновлення
- Виправлено порядок синхронізації (спочатку міста, потім відділення)

### Типи полів
- JSON поля для schedule, reception, delivery, limitations
- DECIMAL для координат (longitude, latitude)
- BOOLEAN для флагів (is_active, post_finance, тощо)
- VARCHAR для текстових полів з довжиною до 255 символів
- TEXT для довгих описів

Після виконання цих кроків Nova Poshta інтеграція буде повністю функціональною з правильною структурою БД.