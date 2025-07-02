/**
 * Функція для відправки даних рахунку з Бітрікс24 в ERP систему
 * Викликається з PHP коду bitrix24-webhook-invoice.php
 * 
 * @param {string} jsonData - JSON дані рахунку в форматі:
 * {
 *   "invoiceNumb": "INV-001", 
 *   "clientEDRPOU": "1234567890",
 *   "companyEDRPOU": "0987654321", 
 *   "items": [
 *     {
 *       "productName": "Товар 1",
 *       "quantity": 2,
 *       "priceAccount": 100.50,
 *       "priceBrutto": 120.60,
 *       "measureSymbol": "товар",
 *       "priceSum": 201.00
 *     }
 *   ]
 * }
 */
function sendInvoiceToERP(jsonData) {
    const https = require('https');
    
    // Парсимо JSON дані
    let invoiceData;
    try {
        invoiceData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    } catch (error) {
        console.error('Помилка парсингу JSON:', error);
        return { success: false, message: 'Невірний формат JSON даних' };
    }
    
    console.log('Відправка даних рахунку в ERP:', JSON.stringify(invoiceData, null, 2));
    
    // Дані для POST запиту до нашого ERP API
    const postData = JSON.stringify(invoiceData);
    
    const options = {
        hostname: 'localhost', // або ваш домен ERP
        port: 5000, // порт вашого ERP сервера
        path: '/api/bitrix/create-order-from-invoice',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseData);
                    console.log('Відповідь ERP:', response);
                    resolve(response);
                } catch (error) {
                    console.error('Помилка парсингу відповіді ERP:', error);
                    resolve({ success: false, message: 'Помилка обробки відповіді ERP' });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('Помилка запиту до ERP:', error);
            resolve({ success: false, message: error.message });
        });
        
        // Відправляємо дані
        req.write(postData);
        req.end();
    });
}

// Експортуємо функцію для використання в PHP через Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sendInvoiceToERP };
}

// Для виклику з командного рядка
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const jsonData = args[0];
        sendInvoiceToERP(jsonData)
            .then(result => {
                console.log('Результат:', JSON.stringify(result, null, 2));
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('Помилка:', error);
                process.exit(1);
            });
    } else {
        console.error('Використання: node sendInvoiceToERP.js \'{"invoiceNumb":"INV-001",...}\'');
        process.exit(1);
    }
}