// Тестування Base64 декодування банківських email через прямий виклик

async function testBase64Banking() {
  try {
    console.log("🧪 Запуск тестування Base64 декодування банківських email...");
    
    const response = await fetch('http://localhost:5000/api/test-base64-banking', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error("Response text:", text);
      return;
    }
    
    const result = await response.json();
    console.log("✅ Результат тестування:", result);
    
  } catch (error) {
    console.error("❌ Помилка тестування:", error);
  }
}

// Запуск тестування
testBase64Banking();