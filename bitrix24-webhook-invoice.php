<?php
/**
 * Webhook для відправки рахунків з Бітрікс24 в ERP REGMIK
 * Аналогічно до sendCompanyInfoTo1C структури
 * 
 * Використання:
 * POST https://ваш-домен.replit.app/webhook/bitrix/invoice-to-erp
 * Content-Type: application/json
 */

// URL ERP системи REGMIK
$erpUrl = 'https://erp.regmik.ua/bitrix/hs/sync/receive_invoice/';
$erpLogin = 'ШкоМ.';
$erpPassword = '100';

/**
 * Функція для відправки рахунку в ERP REGMIK
 * @param string $invoiceId ID рахунку в Бітрікс24
 * @return array результат синхронізації
 */
function sendInvoiceToERP($invoiceId) {
    global $erpUrl, $erpLogin, $erpPassword;
    
    // Отримуємо дані рахунку з Бітрікс24
    $invoiceData = getBitrixInvoiceData($invoiceId);
    if (!$invoiceData) {
        return ['success' => false, 'message' => 'Не вдалося отримати дані рахунку з Бітрікс24'];
    }
    
    // Отримуємо позиції рахунку
    $invoiceItems = getBitrixInvoiceItems($invoiceId);
    
    // Формуємо дані для відправки в ERP
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
    
    // Відправляємо дані в ERP
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $erpUrl,
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
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'message' => 'Помилка cURL: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'message' => 'HTTP помилка: ' . $httpCode];
    }
    
    $result = json_decode($response, true);
    if (!$result || !$result['success']) {
        return ['success' => false, 'message' => 'ERP повернула помилку: ' . ($result['message'] ?? 'невідома помилка')];
    }
    
    return [
        'success' => true, 
        'message' => 'Рахунок успішно синхронізовано з ERP',
        'order_id' => $result['orderId'] ?? null,
        'order_number' => $result['orderNumber'] ?? null
    ];
}

/**
 * Отримання даних рахунку з Бітрікс24
 */
function getBitrixInvoiceData($invoiceId) {
    // Тут ваш код для отримання даних з Бітрікс24 API
    // Приклад запиту до crm.invoice.get
    $invoiceData = CRest::call('crm.invoice.get', [
        'id' => $invoiceId
    ]);
    
    if (!$invoiceData['result']) {
        return false;
    }
    
    return $invoiceData['result'];
}

/**
 * Отримання позицій рахунку з Бітрікс24
 */
function getBitrixInvoiceItems($invoiceId) {
    // Тут ваш код для отримання позицій рахунку з Бітрікс24 API
    // Приклад запиту до crm.invoice.productrows.get
    $itemsData = CRest::call('crm.invoice.productrows.get', [
        'id' => $invoiceId
    ]);
    
    if (!$itemsData['result']) {
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