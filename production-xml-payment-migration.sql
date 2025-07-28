-- PRODUCTION XML PAYMENT MIGRATION SCRIPT
-- Цей скрипт переносить XML оплати з таблиці orders в order_payments
-- Виконайте на вашому production сервері

BEGIN;

-- Крок 1: Перевірка поточного стану ПЕРЕД міграцією
SELECT 
    'ДО МІГРАЦІЇ' as status,
    COUNT(*) as orders_with_payments,
    COUNT(CASE WHEN EXISTS(
        SELECT 1 FROM order_payments op WHERE op.order_id = o.id
    ) THEN 1 END) as orders_have_payment_records,
    COUNT(CASE WHEN NOT EXISTS(
        SELECT 1 FROM order_payments op WHERE op.order_id = o.id
    ) THEN 1 END) as orders_need_migration
FROM orders o 
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0;

-- Крок 2: Показати замовлення що будуть мігровані
SELECT 
    'ЗАМОВЛЕННЯ ДЛЯ МІГРАЦІЇ' as info,
    o.id,
    o.order_number,
    o.invoice_number, 
    o.payment_date,
    o.paid_amount
FROM orders o
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0
    AND NOT EXISTS (
        SELECT 1 FROM order_payments op 
        WHERE op.order_id = o.id
    )
ORDER BY o.id
LIMIT 20;

-- Крок 3: ВИКОНАННЯ МІГРАЦІЇ
INSERT INTO order_payments (
    order_id,
    payment_amount,
    payment_date,
    payment_type,
    payment_status,
    correspondent,
    notes,
    created_at
)
SELECT 
    o.id,
    CAST(o.paid_amount AS NUMERIC),  -- Конвертуємо в numeric тип
    o.payment_date,
    'xml_import',
    'confirmed',
    COALESCE(
        (SELECT c.full_name FROM clients c WHERE c.id = o.client_id), 
        'XML Import Client'
    ),
    CONCAT('Мігровано з orders.payment_date. Замовлення: ', o.order_number),
    COALESCE(o.payment_date, o.created_at, NOW())
FROM orders o
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0
    AND NOT EXISTS (
        SELECT 1 FROM order_payments op 
        WHERE op.order_id = o.id
    );

-- Крок 4: Перевірка результату ПІСЛЯ міграції  
SELECT 
    'ПІСЛЯ МІГРАЦІЇ' as status,
    COUNT(*) as total_orders_with_payments,
    COUNT(CASE WHEN EXISTS(
        SELECT 1 FROM order_payments op WHERE op.order_id = o.id
    ) THEN 1 END) as orders_have_payment_records,
    COUNT(CASE WHEN NOT EXISTS(
        SELECT 1 FROM order_payments op WHERE op.order_id = o.id
    ) THEN 1 END) as orders_still_need_migration
FROM orders o 
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0;

-- Крок 5: Статистика по типах оплат
SELECT 
    'СТАТИСТИКА ОПЛАТ' as info,
    payment_type,
    COUNT(*) as count,
    SUM(payment_amount) as total_amount
FROM order_payments 
GROUP BY payment_type 
ORDER BY count DESC;

-- Крок 6: Показати декілька мігрованих записів
SELECT 
    'ПРИКЛАДИ МІГРОВАНИХ ОПЛАТ' as info,
    op.id,
    o.order_number,
    op.payment_amount,
    op.payment_date,
    op.correspondent,
    op.notes
FROM order_payments op
JOIN orders o ON op.order_id = o.id
WHERE op.payment_type = 'xml_import'
ORDER BY op.created_at DESC
LIMIT 10;

COMMIT;