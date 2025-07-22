-- Видалення дублікатів оплат
-- Залишаємо тільки найновіші записи для кожного замовлення

WITH duplicate_payments AS (
  SELECT 
    id,
    order_id,
    payment_amount,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, payment_amount 
      ORDER BY created_at DESC
    ) as rn
  FROM order_payments
),
payments_to_delete AS (
  SELECT id 
  FROM duplicate_payments 
  WHERE rn > 1
)
DELETE FROM order_payments 
WHERE id IN (SELECT id FROM payments_to_delete);

-- Інформація про видалені дублікати
SELECT 
  order_id,
  COUNT(*) as remaining_payments,
  SUM(CAST(payment_amount AS DECIMAL)) as total_amount
FROM order_payments 
WHERE order_id IN (79, 118, 120, 123)
GROUP BY order_id
ORDER BY order_id;