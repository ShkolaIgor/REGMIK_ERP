<?php
/**
 * Тестовий скрипт для перевірки PHP webhook
 */

// Імітація даних від Бітрікс24
$testInvoiceData = [
    'invoiceNumb' => 'TEST-PHP-001',
    'clientEDRPOU' => '1234567890',
    'companyEDRPOU' => '0987654321',
    'items' => [
        [
            'productName' => 'Тестовий товар з PHP',
            'quantity' => 2,
            'priceAccount' => 75.00,
            'priceBrutto' => 90.00,
            'measureSymbol' => 'товар',
            'productCode' => 'PHP-TEST-001'
        ],
        [
            'productName' => 'Другий товар з PHP',
            'quantity' => 1,
            'priceAccount' => 150.00,
            'priceBrutto' => 180.00,
            'measureSymbol' => 'товар',
            'productCode' => 'PHP-TEST-002'
        ]
    ]
];

$localErpUrl = 'https://f8b5b2ba-8ffe-4b9f-85c7-4b82acc96cfe-00-2vxegxo6dxlmg.picard.replit.dev/api/bitrix/create-order-from-invoice';

echo "[PHP TEST] Відправляємо тестові дані:\n";
echo json_encode($testInvoiceData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

// Відправляємо дані в локальну ERP
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $localErpUrl,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($testInvoiceData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "[PHP TEST] HTTP код: $httpCode\n";
if ($error) {
    echo "[PHP TEST] cURL помилка: $error\n";
}
echo "[PHP TEST] Відповідь від ERP:\n";
echo $response . "\n";

$result = json_decode($response, true);
if ($result) {
    echo "[PHP TEST] Результат:\n";
    echo "  - Успішно: " . ($result['success'] ? 'ТАК' : 'НІ') . "\n";
    echo "  - Повідомлення: " . ($result['message'] ?? 'N/A') . "\n";
    echo "  - ID замовлення: " . ($result['orderId'] ?? 'N/A') . "\n";
}
?>