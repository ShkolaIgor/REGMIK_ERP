-- ПРОСТИЙ МІГРАЦІЙНИЙ СКРИПТ БЕЗ ТРАНЗАКЦІЇ
-- Виконайте кожен блок окремо для безпеки

-- ========================================
-- КРОК 1: ПЕРЕВІРКА СТАНУ ДО МІГРАЦІЇ
-- ========================================
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

-- ========================================
-- КРОК 2: ПОКАЗАТИ ЗАМОВЛЕННЯ ДЛЯ МІГРАЦІЇ
-- ========================================
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

-- ========================================
-- КРОК 3: ВИКОНАННЯ МІГРАЦІЇ (ОСНОВНИЙ)
-- ========================================
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
    CAST(o.paid_amount AS NUMERIC),
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

-- ========================================
-- КРОК 4: ПЕРЕВІРКА РЕЗУЛЬТАТУ
-- ========================================
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

-- ========================================
-- КРОК 5: СТАТИСТИКА ОПЛАТ
-- ========================================
SELECT 
    'СТАТИСТИКА ОПЛАТ' as info,
    payment_type,
    COUNT(*) as count,
    SUM(payment_amount) as total_amount
FROM order_payments 
GROUP BY payment_type 
ORDER BY count DESC;

-- ========================================
-- КРОК 6: ПРИКЛАДИ МІГРОВАНИХ ЗАПИСІВ
-- ========================================
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