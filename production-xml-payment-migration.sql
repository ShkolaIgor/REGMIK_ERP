-- PRODUCTION XML PAYMENT MIGRATION SCRIPT
-- Цей скрипт переносить XML оплати з таблиці orders в order_payments
-- Виконайте на вашому production сервері

-- Крок 1: Перевірка поточного стану
SELECT 
    'Поточний стан' as status,
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

-- Крок 2: Міграція XML оплат
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
    'XML Migration',
    CONCAT('Оплата мігрована з XML імпорту. Замовлення: ', o.order_number),
    COALESCE(o.payment_date, o.created_at)
FROM orders o
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0
    AND NOT EXISTS (
        SELECT 1 FROM order_payments op 
        WHERE op.order_id = o.id 
        AND op.payment_type = 'xml_import'
    );

-- Крок 3: Перевірка результату
SELECT 
    'Після міграції' as status,
    COUNT(*) as total_orders_with_payments,
    COUNT(CASE WHEN EXISTS(
        SELECT 1 FROM order_payments op WHERE op.order_id = o.id
    ) THEN 1 END) as orders_have_payment_records
FROM orders o 
WHERE o.payment_date IS NOT NULL 
    AND o.paid_amount IS NOT NULL 
    AND CAST(o.paid_amount AS DECIMAL) > 0;

-- Крок 4: Статистика по типах оплат
SELECT 
    payment_type,
    COUNT(*) as count,
    SUM(payment_amount) as total_amount
FROM order_payments 
GROUP BY payment_type 
ORDER BY count DESC;