# Виправлення помилки "Class 'CRest' not found"

## Проблема
На хості bitrix.regmik.ua виникала помилка:
```
Class "CRest" not found (0)
```

## Причина
PHP файли webhook-ів використовували клас CRest з Бітрікс24 REST SDK, який не встановлений на сервері.

## Рішення
Замінено всі виклики CRest::call() на прямі cURL запити до Бітрікс24 API.

### Зміни в `bitrix24-webhook-company.php`:

1. **Додано функцію bitrixApiCall():**
```php
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
```

2. **Замінено виклики CRest на bitrixApiCall:**
- `getBitrixCompanyData()` - отримання даних компанії
- `getBitrixCompanyRequisites()` - отримання реквізитів
- `getBitrixCompanyRequisite()` - отримання конкретних реквізитів
- `getBitrixCompanyAddress()` - отримання адреси

### Зміни в `bitrix24-webhook-invoice.php`:

1. **Додано ту ж функцію bitrixApiCall()**

2. **Замінено виклики CRest на bitrixApiCall:**
- `getBitrixInvoiceData()` - отримання даних рахунку
- `getBitrixInvoiceItems()` - отримання позицій рахунку

## Конфігурація

Обидва файли тепер потребують налаштування змінної `$bitrixWebhookUrl`:

```php
$bitrixWebhookUrl = 'https://ваш-портал.bitrix24.com/rest/1/webhook_код/';
```

## Переваги нового підходу

1. **Відсутність залежностей** - не потрібно встановлювати Бітрікс24 REST SDK
2. **Прозорість** - всі API запити виконуються через стандартний cURL
3. **Контроль помилок** - краща обробка HTTP помилок та відповідей
4. **Портативність** - працює на будь-якому PHP сервері з cURL

## Налаштування webhook URL

Для отримання webhook URL в Бітрікс24:

1. Перейдіть в **Налаштування** → **Розробникам** → **Інші** → **Вхідні webhook**
2. Створіть новий webhook з необхідними правами
3. Скопіюйте URL у форматі: `https://ваш-портал.bitrix24.com/rest/1/webhook_код/`
4. Вставте цей URL у змінну `$bitrixWebhookUrl` в PHP файлах

## Необхідні права для webhook

### Для компаній:
- `crm.company.get`
- `crm.requisite.list`
- `crm.requisite.get`
- `crm.address.list`

### Для рахунків:
- `crm.invoice.get`
- `crm.invoice.productrows.get`

## Статус
✅ Проблема виправлена - PHP файли тепер працюють без залежності від CRest SDK