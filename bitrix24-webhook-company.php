<?php
/**
 * Webhook для відправки компаній з Бітрікс24 в ERP REGMIK
 * Аналогічно до sendCompanyInfoTo1C структури
 * Використовує прямі cURL запити без залежності від CRest
 * 
 * Використання:
 * POST https://bitrix.regmik.ua/webhook/bitrix/company-to-erp/{companyId}
 * Content-Type: application/json
 */

// Конфігурація
$bitrixWebhookUrl = 'https://ваш-портал.bitrix24.com/rest/1/webhook_код/'; // Замініть на ваш webhook URL
$erpUrl = 'http://localhost:5000/bitrix/hs/sync/receive_company/'; // Локальний ERP endpoint
$erpLogin = 'ШкоМ.'; 
$erpPassword = '100';

/**
 * Виконання API запиту до Бітрікс24 через cURL
 * @param string $method Метод API (наприклад 'crm.company.get')
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
 * Функція для відправки компанії в ERP REGMIK
 * @param string $companyId ID компанії в Бітрікс24
 * @param string $requisiteId ID реквізитів компанії (опціонально)
 * @return array результат синхронізації
 */
function sendCompanyToERP($companyId, $requisiteId = null) {
    global $erpUrl, $erpLogin, $erpPassword;
    
    // Отримуємо дані компанії з Бітрікс24
    $companyData = getBitrixCompanyData($companyId);
    if (!$companyData) {
        return ['success' => false, 'message' => 'Не вдалося отримати дані компанії з Бітрікс24'];
    }
    
    // Отримуємо реквізити компанії
    $requisiteData = null;
    if ($requisiteId) {
        $requisiteData = getBitrixCompanyRequisite($requisiteId);
    } else {
        // Шукаємо реквізити автоматично
        $requisites = getBitrixCompanyRequisites($companyId);
        if (!empty($requisites)) {
            $requisiteData = $requisites[0]; // Беремо перші реквізити
            $requisiteId = $requisiteData['ID'];
        }
    }
    
    // Отримуємо адресу компанії
    $address = '';
    if ($requisiteId) {
        $address = getBitrixCompanyAddress($requisiteId);
    }
    
    // Формуємо дані для відправки в ERP
    $erpData = [
        'company' => [
            'bitrix_id' => $companyData['ID'],
            'title' => $companyData['TITLE'],
            'phone' => !empty($companyData['PHONE']) ? $companyData['PHONE'][0]['VALUE'] : '',
            'email' => !empty($companyData['EMAIL']) ? $companyData['EMAIL'][0]['VALUE'] : '',
            'full_name' => $requisiteData ? $requisiteData['RQ_COMPANY_FULL_NAME'] : $companyData['TITLE'],
            'tax_code' => $requisiteData ? ($requisiteData['RQ_INN'] ?? $requisiteData['RQ_EDRPOU'] ?? '') : '',
            'legal_address' => $address,
            'preset_id' => $requisiteData ? intval($requisiteData['PRESET_ID'] ?? 0) : 0
        ]
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
        'message' => 'Компанію успішно синхронізовано з ERP',
        'client_id' => $result['clientId'] ?? null
    ];
}

/**
 * Отримання даних компанії з Бітрікс24
 */
function getBitrixCompanyData($companyId) {
    $companyData = bitrixApiCall('crm.company.get', [
        'id' => $companyId
    ]);
    
    if (!$companyData || !isset($companyData['result'])) {
        return false;
    }
    
    return $companyData['result'];
}

/**
 * Отримання реквізитів компанії з Бітрікс24
 */
function getBitrixCompanyRequisites($companyId) {
    $requisitesData = bitrixApiCall('crm.requisite.list', [
        'filter' => [
            'ENTITY_TYPE_ID' => 4, // 4 = компанія
            'ENTITY_ID' => $companyId
        ]
    ]);
    
    return $requisitesData['result'] ?? [];
}

/**
 * Отримання конкретних реквізитів компанії з Бітрікс24
 */
function getBitrixCompanyRequisite($requisiteId) {
    $requisiteData = bitrixApiCall('crm.requisite.get', [
        'id' => $requisiteId
    ]);
    
    if (!$requisiteData || !isset($requisiteData['result'])) {
        return false;
    }
    
    return $requisiteData['result'];
}

/**
 * Отримання адреси компанії з Бітрікс24
 */
function getBitrixCompanyAddress($requisiteId) {
    $addressData = bitrixApiCall('crm.address.list', [
        'filter' => [
            'ENTITY_TYPE_ID' => 8, // 8 = реквізити
            'ENTITY_ID' => $requisiteId,
            'TYPE_ID' => 1 // 1 = юридична адреса
        ]
    ]);
    
    if (!$addressData || empty($addressData['result'])) {
        return '';
    }
    
    $address = $addressData['result'][0];
    $addressParts = [];
    
    if (!empty($address['POSTAL_CODE'])) $addressParts[] = $address['POSTAL_CODE'];
    if (!empty($address['COUNTRY'])) $addressParts[] = $address['COUNTRY'];
    if (!empty($address['REGION'])) $addressParts[] = $address['REGION'];
    if (!empty($address['CITY'])) $addressParts[] = $address['CITY'];
    if (!empty($address['ADDRESS_1'])) $addressParts[] = $address['ADDRESS_1'];
    if (!empty($address['ADDRESS_2'])) $addressParts[] = $address['ADDRESS_2'];
    
    return implode(', ', $addressParts);
}

// Обробка webhook запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Отримуємо companyId з URL
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';
    $pathParts = explode('/', trim($pathInfo, '/'));
    
    if (count($pathParts) < 1 || empty($pathParts[0])) {
        // Пробуємо отримати з POST даних
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['data']['FIELDS']['ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Невірні дані запиту - не вказано ID компанії']);
            exit;
        }
        
        $companyId = $input['data']['FIELDS']['ID'];
        $requisiteId = $input['data']['FIELDS']['REQUISITE_ID'] ?? null;
    } else {
        $companyId = $pathParts[0];
        $requisiteId = $_GET['requisite_id'] ?? null;
    }
    
    $result = sendCompanyToERP($companyId, $requisiteId);
    
    http_response_code($result['success'] ? 200 : 500);
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не підтримується']);
}
?>