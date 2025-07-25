/**
 * Тест для перевірки чи система тепер обробляє ВСІ банківські повідомлення
 * без 7-денного часового обмеження
 */

const API_BASE = 'http://localhost:5000';

async function testUnlimitedBankingProcessing() {
    console.log("🧪 ТЕСТ: Перевірка обробки всіх банківських повідомлень (без часових обмежень)");
    console.log("=".repeat(80));
    
    try {
        // Крок 1: Перевіряємо поточну кількість платежів в системі
        console.log("1️⃣ Поточна статистика платежів:");
        const statsResponse = await fetch(`${API_BASE}/api/payments/stats`);
        const stats = await statsResponse.json();
        console.log(`   📊 Всього платежів в системі: ${stats.totalPayments}`);
        console.log(`   💰 Загальна сума: ${stats.totalAmount.toLocaleString()} UAH`);
        
        // Крок 2: Запускаємо перевірку всіх email
        console.log("\n2️⃣ Запуск обробки всіх банківських email:");
        const checkStart = Date.now();
        
        const checkResponse = await fetch(`${API_BASE}/api/test-base64-banking`, {
            method: 'GET'
        });
        
        if (!checkResponse.ok) {
            throw new Error(`HTTP ${checkResponse.status}: ${checkResponse.statusText}`);
        }
        
        const result = await checkResponse.json();
        const checkTime = Date.now() - checkStart;
        
        console.log(`   ⏱️  Час обробки: ${checkTime}ms`);
        console.log(`   📧 Результат: ${result.message || 'Обробка завершена'}`);
        
        // Крок 3: Перевіряємо статистику після обробки
        console.log("\n3️⃣ Статистика після обробки:");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Пауза для бази даних
        
        const newStatsResponse = await fetch(`${API_BASE}/api/payments/stats`);
        const newStats = await newStatsResponse.json();
        
        const paymentsDiff = newStats.totalPayments - stats.totalPayments;
        const amountDiff = newStats.totalAmount - stats.totalAmount;
        
        console.log(`   📊 Всього платежів тепер: ${newStats.totalPayments}`);
        console.log(`   💰 Загальна сума тепер: ${newStats.totalAmount.toLocaleString()} UAH`);
        console.log(`   ➕ Нових платежів: ${paymentsDiff}`);
        console.log(`   ➕ Додаткова сума: ${amountDiff.toLocaleString()} UAH`);
        
        // Крок 4: Аналіз результатів
        console.log("\n4️⃣ Аналіз результатів:");
        if (paymentsDiff > 0) {
            console.log(`   ✅ УСПІХ: Система знайшла та обробила ${paymentsDiff} додаткових платежів!`);
            console.log(`   🔍 Це означає що видалення часових обмежень працює правильно`);
        } else if (paymentsDiff === 0) {
            console.log(`   ℹ️  ІНФОРМАЦІЯ: Нових платежів не знайдено`);
            console.log(`   💡 Можливо всі email вже були оброблені раніше`);
        } else {
            console.log(`   ⚠️  УВАГА: Кількість платежів зменшилась на ${Math.abs(paymentsDiff)}`);
        }
        
        // Крок 5: Перевірка останніх платежів
        console.log("\n5️⃣ Останні 5 платежів:");
        const paymentsResponse = await fetch(`${API_BASE}/api/payments?limit=5&sort=createdAt&order=desc`);
        const payments = await paymentsResponse.json();
        
        payments.slice(0, 5).forEach((payment, index) => {
            const date = new Date(payment.createdAt).toLocaleString('uk-UA');
            console.log(`   ${index + 1}. Рахунок: ${payment.orderNumber || 'N/A'} | Сума: ${payment.paymentAmount} UAH | Дата: ${date}`);
        });
        
        console.log("\n" + "=".repeat(80));
        console.log("🎯 ВИСНОВОК:");
        if (paymentsDiff > 0) {
            console.log("✅ Видалення часових обмежень працює! Система тепер обробляє весь архів email.");
        } else {
            console.log("ℹ️  Система працює, але нових платежів не виявлено в архіві.");
        }
        console.log("📊 Рекомендація: запускайте цей тест періодично для моніторингу");
        
    } catch (error) {
        console.error("❌ Помилка тесту:", error.message);
        console.error("🔧 Переконайтеся що:");
        console.error("   - Сервер запущений на localhost:5000");
        console.error("   - Банківський email моніторинг налаштований");
        console.error("   - Є інтернет з'єднання");
    }
}

// Запускаємо тест
testUnlimitedBankingProcessing();