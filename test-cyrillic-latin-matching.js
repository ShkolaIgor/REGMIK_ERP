// Тест кирилично-латинського зіставлення символів
// Приклад: 74НС04D має знаходити 74HC04D

console.log('🧪 Тестування кирилично-латинського зіставлення символів...\n');

// Тестові випадки
const testCases = [
  {
    input: '74НС04D',
    expected: '74HC04D',
    description: 'Н→H, С→C (мікросхема HC серії)'
  },
  {
    input: 'КР580ВМ80А',  
    expected: 'KP580BM80A',
    description: 'К→K, Р→P, В→B, М→M, А→A (радянська мікросхема)'
  },
  {
    input: 'ТМС34010',
    expected: 'TMC34010', 
    description: 'Т→T, М→M, С→C (процесор TI)'
  },
  {
    input: 'АТ89С51',
    expected: 'AT89C51',
    description: 'А→A, Т→T, С→C (мікроконтролер Atmel)'
  },
  {
    input: 'НЕ555Р',
    expected: 'HE555P',
    description: 'Н→H, Е→E, Р→P (таймер)'
  },
  {
    input: 'DФ10С',
    expected: 'DF10C',
    description: 'Ф→F, С→C (діод, змішана кирилиця/латиниця)'
  }
];

// Функція нормалізації (копія з backend)
function normalizeProductName(name) {
  return name
    .toLowerCase()
    // КРОК 1: Конвертуємо схожі кирилично-латинські символи 
    .replace(/[АВЕКМНОРСТУХФавекмнорстухф]/g, (match) => {
      const cyrLatinMap = {
        // Великі букви (схожі за написом)
        'А': 'a', 'В': 'b', 'Е': 'e', 'К': 'k', 'М': 'm', 'Н': 'h', 
        'О': 'o', 'Р': 'p', 'С': 'c', 'Т': 't', 'У': 'y', 'Х': 'x', 'Ф': 'f',
        // Малі букви (схожі за написом)
        'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h',
        'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y', 'х': 'x', 'ф': 'f'
      };
      return cyrLatinMap[match] || match;
    })
    .toLowerCase()
    .replace(/[\s\-_\.\/\\]/g, '') // Видаляємо розділювачі
    .replace(/[()[\]{}]/g, '') // Видаляємо дужки
    .replace(/[а-яё]/g, (match) => { // Транслітерація решти
      const map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g'
      };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Виконання тестів
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((test, index) => {
  const normalizedInput = normalizeProductName(test.input);
  const normalizedExpected = normalizeProductName(test.expected);
  const isMatch = normalizedInput === normalizedExpected;
  
  console.log(`Тест ${index + 1}: ${test.description}`);
  console.log(`   Вхід: "${test.input}" → нормалізовано: "${normalizedInput}"`);
  console.log(`   Очікується: "${test.expected}" → нормалізовано: "${normalizedExpected}"`);
  console.log(`   Результат: ${isMatch ? '✅ ЗБІГ' : '❌ НЕ ЗБІГ'}`);
  console.log('');
  
  if (isMatch) passedTests++;
});

console.log(`📊 Підсумок: ${passedTests}/${totalTests} тестів пройдено (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('🎉 Всі тести пройшли успішно! Кирилично-латинське зіставлення працює правильно.');
} else {
  console.log('⚠️ Деякі тести не пройшли. Потрібно доопрацювати алгоритм.');
}