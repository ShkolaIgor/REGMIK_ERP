<?php
/**
 * Локальний тест webhook endpoint
 * Створіть цей файл на production сервері для тестування
 */

// Логування всіх деталей
error_log("[LOCAL TEST] ====== ЛОКАЛЬНИЙ WEBHOOK ТЕСТ ======");
error_log("[LOCAL TEST] Метод: " . $_SERVER['REQUEST_METHOD']);
error_log("[LOCAL TEST] Headers: " . json_encode(getallheaders()));

// Отримуємо POST дані
$input = file_get_contents('php://input');
error_log("[LOCAL TEST] Raw Input: " . $input);

$data = json_decode($input, true);
error_log("[LOCAL TEST] Parsed Data: " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Перевіряємо формат даних
if ($data && isset($data['invoiceNumb']) && isset($data['clientEDRPOU'])) {
    error_log("[LOCAL TEST] ✅ Дані валідні");
    error_log("[LOCAL TEST] Рахунок: " . $data['invoiceNumb']);
    error_log("[LOCAL TEST] Клієнт ЄДРПОУ: " . $data['clientEDRPOU']);
    error_log("[LOCAL TEST] Товарів: " . count($data['items'] ?? []));
    
    // Імітуємо успішну відповідь ERP
    $response = [
        'success' => true,
        'message' => 'Замовлення успішно створено локально',
        'orderId' => rand(1000, 9999),
        'orderNumber' => $data['invoiceNumb'],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
} else {
    error_log("[LOCAL TEST] ❌ Невалідні дані");
    $response = [
        'success' => false,
        'message' => 'Невалідні дані запиту',
        'received' => $data
    ];
}

// Відправляємо відповідь
header('Content-Type: application/json');
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

error_log("[LOCAL TEST] Відповідь: " . json_encode($response));
error_log("[LOCAL TEST] ====== ТЕСТ ЗАВЕРШЕНО ======");
?>