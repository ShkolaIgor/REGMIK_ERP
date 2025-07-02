<?php
/**
 * Webhook для відправки рахунків з Бітрікс24 в ERP REGMIK
 * Аналогічно до sendCompanyInfoTo1C структури
 * Використовує прямі cURL запити без залежності від CRest
 * 
 * Використання:
 * POST https://bitrix.regmik.ua/webhook/bitrix/invoice-to-erp
 * Content-Type: application/json
 */

// Конфігурація
$bitrixWebhookUrl = 'https://ваш-портал.bitrix24.com/rest/1/webhook_код/'; // Замініть на ваш webhook URL
// URL локальної ERP системи - оберіть правильний варіант:
// Для production Replit (змініть YOUR-APP-NAME на назву вашого додатку):
$localErpUrl = 'https://YOUR-APP-NAME.replit.app/api/bitrix/create-order-from-invoice';

// Для локального тестування (якщо на тому ж сервері):
// $localErpUrl = 'http://localhost:5000/api/bitrix/create-order-from-invoice';

// Поточна розробка (тимчасово відключена через мережеві проблеми):
// $localErpUrl = 'https://f8b5b2ba-8ffe-4b9f-85c7-4b82acc96cfe-00-2vxegxo6dxlmg.picard.replit.dev/api/bitrix/create-order-from-invoice';
$externalErpUrl = 'https://erp.regmik.ua/bitrix/hs/sync/receive_invoice/';
$erpLogin = 'ШкоМ.';
$erpPassword = '100';

/**
 * Виконання API запиту до Бітрікс24 через cURL
 * @param string $method Метод API (наприклад 'crm.invoice.get')
 * @param array $params Параметри запиту
 * @return array|false Результат запиту або false при помилці
 */
function bitrixApiCall($method, $params = []) {
    global $bitrixWebhookUrl;
    
    $url = $bitrixWebhookUrl . $method;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($params),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return false;
    }
    
    $result = json_decode($response, true);
    return $result ?? false;
}

/**
 * Функція для відправки рахунку в локальну ERP REGMIK
 * @param string $invoiceId ID рахунку в Бітрікс24
 * @return array результат синхронізації
 */
function sendInvoiceToERP($invoiceId) {
    global $localErpUrl, $externalErpUrl, $erpLogin, $erpPassword;
    
    // Логування для діагностики
    error_log("[PHP WEBHOOK] Початок обробки рахунку ID: $invoiceId");
    
    // Отримуємо дані рахунку з Бітрікс24
    $invoiceData = getBitrixInvoiceData($invoiceId);
    if (!$invoiceData) {
        error_log("[PHP WEBHOOK] Помилка: не вдалося отримати дані рахунку з Бітрікс24");
        return ['success' => false, 'message' => 'Не вдалося отримати дані рахунку з Бітрікс24'];
    }
    
    // Отримуємо позиції рахунку
    $invoiceItems = getBitrixInvoiceItems($invoiceId);
    error_log("[PHP WEBHOOK] Отримано позицій рахунку: " . count($invoiceItems['productRows']));
    
    // Формуємо дані в форматі, який очікує наш Node.js endpoint
    $localErpData = [
        'invoiceNumb' => $invoiceData['ACCOUNT_NUMBER'] ?? "INV-$invoiceId",
        'clientEDRPOU' => $invoiceData['UF_CRM_CLIENT_EDRPOU'] ?? '', // Потрібно додати поле в Бітрікс24
        'companyEDRPOU' => $invoiceData['UF_CRM_COMPANY_EDRPOU'] ?? '', // Потрібно додати поле в Бітрікс24
        'items' => []
    ];
    
    // Перетворюємо позиції в потрібний формат
    foreach ($invoiceItems['productRows'] as $item) {
        $localErpData['items'][] = [
            'productName' => $item['productName'],
            'quantity' => $item['quantity'],
            'priceAccount' => $item['priceAccount'],
            'priceBrutto' => $item['priceBrutto'],
            'measureSymbol' => $item['measureName'],
            'productCode' => $item['productCode']
        ];
    }
    
    error_log("[PHP WEBHOOK] Отримано дані рахунку від PHP скрипту: " . json_encode($localErpData));
    
    // 1. Відправляємо в локальну ERP (Node.js)
    $localResult = sendToLocalERP($localErpData);
    
    // 2. Відправляємо в зовнішню ERP (за потреби)
    $externalResult = sendToExternalERP($invoiceData, $invoiceItems);
    
    return [
        'success' => $localResult['success'],
        'message' => $localResult['message'],
        'local_order_id' => $localResult['orderId'] ?? null,
        'external_result' => $externalResult
    ];
}

/**
 * Відправка в локальну Node.js ERP
 */
function sendToLocalERP($data) {
    global $localErpUrl;
    
    error_log("[PHP WEBHOOK] Відправляємо в локальну ERP: " . json_encode($data));
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $localErpUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
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
    
    error_log("[PHP WEBHOOK] Локальна ERP відповідь - HTTP: $httpCode, Response: $response");
    $curlInfo = curl_getinfo($ch);
    error_log("[PHP WEBHOOK] cURL Info: " . json_encode($curlInfo));
    
    // Додаткова діагностика якщо помилка
    if ($httpCode !== 200) {
        error_log("[PHP WEBHOOK] ДІАГНОСТИКА ПОМИЛКИ:");
        error_log("[PHP WEBHOOK] - URL: $localErpUrl");
        error_log("[PHP WEBHOOK] - HTTP Code: $httpCode");
        error_log("[PHP WEBHOOK] - Response Body: $response");
        error_log("[PHP WEBHOOK] - cURL Error: $error");
        error_log("[PHP WEBHOOK] - Request Data: " . json_encode($data));
    }
    
    if ($error) {
        error_log("[PHP WEBHOOK] cURL помилка: $error");
        return ['success' => false, 'message' => 'Помилка cURL: ' . $error];
    }
    
    if ($httpCode !== 200) {
        error_log("[PHP WEBHOOK] HTTP помилка: $httpCode");
        return ['success' => false, 'message' => 'HTTP помилка: ' . $httpCode];
    }
    
    $result = json_decode($response, true);
    return $result ?? ['success' => false, 'message' => 'Невірна відповідь від локальної ERP'];
}

/**
 * Відправка в зовнішню ERP
 */
function sendToExternalERP($invoiceData, $invoiceItems) {
    global $externalErpUrl, $erpLogin, $erpPassword;
    
    // Формуємо дані для зовнішньої ERP в старому форматі
    $erpData = [
        'invoice' => [
            'bitrix_id' => $invoiceData['ID'],
            'account_number' => $invoiceData['ACCOUNT_NUMBER'],
            'date' => $invoiceData['DATE'],
            'price' => floatval($invoiceData['PRICE']),
            'currency' => $invoiceData['CURRENCY'] ?? 'UAH',
            'company_name' => $invoiceData['COMPANY'],
            'client_name' => $invoiceData['CLIENT'],
            'manager' => $invoiceData['MANAGER'] ?? '',
            'status' => $invoiceData['STATUS'] ?? 'pending'
        ],
        'items' => $invoiceItems['productRows'] ?? []
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $externalErpUrl,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($erpData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($erpLogin . ':' . $erpPassword)
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'success' => $httpCode === 200,
        'http_code' => $httpCode,
        'response' => $response
    ];
}

/**
 * Отримання даних рахунку з Бітрікс24
 */
function getBitrixInvoiceData($invoiceId) {
    $invoiceData = bitrixApiCall('crm.invoice.get', [
        'id' => $invoiceId
    ]);
    
    if (!$invoiceData || !isset($invoiceData['result'])) {
        return false;
    }
    
    return $invoiceData['result'];
}

/**
 * Отримання позицій рахунку з Бітрікс24
 */
function getBitrixInvoiceItems($invoiceId) {
    $itemsData = bitrixApiCall('crm.invoice.productrows.get', [
        'id' => $invoiceId
    ]);
    
    if (!$itemsData || !isset($itemsData['result'])) {
        return ['productRows' => []];
    }
    
    // Перетворюємо позиції в потрібний формат
    $productRows = [];
    foreach ($itemsData['result'] as $item) {
        $productRows[] = [
            'productName' => $item['PRODUCT_NAME'] ?? '',
            'quantity' => floatval($item['QUANTITY'] ?? 1),
            'price' => floatval($item['PRICE'] ?? 0),
            'priceAccount' => floatval($item['PRICE_ACCOUNT'] ?? 0),
            'priceNetto' => floatval($item['PRICE_NETTO'] ?? 0),
            'priceBrutto' => floatval($item['PRICE_BRUTTO'] ?? 0),
            'priceExclusive' => floatval($item['PRICE_EXCLUSIVE'] ?? 0),
            'productCode' => $item['PRODUCT_ID'] ?? '',
            'type' => intval($item['TYPE'] ?? 4),
            'measureName' => $item['MEASURE_NAME'] ?? 'шт',
            'discountSum' => floatval($item['DISCOUNT_SUM'] ?? 0),
            'taxRate' => floatval($item['TAX_RATE'] ?? 0)
        ];
    }
    
    return ['productRows' => $productRows];
}

// Обробка webhook запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['data']['FIELDS']['ID'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Невірні дані запиту']);
        exit;
    }
    
    $invoiceId = $input['data']['FIELDS']['ID'];
    $result = sendInvoiceToERP($invoiceId);
    
    http_response_code($result['success'] ? 200 : 500);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не підтримується']);
}
?>