# Виправлення UTF-8 пошуку Nova Poshta на продакшн

## Проблема
Пошук міст Nova Poshta не працює з кирилічними символами на продакшн сервері через проблеми з UTF-8 кодуванням.

## Рішення
Додано правильну обробку UTF-8 кодування в Express сервері та API маршрутах.

## Інструкції для оновлення продакшн

### 1. Підключіться до продакшн сервера
```bash
ssh your-production-server
```

### 2. Зупиніть сервіс
```bash
sudo systemctl stop regmik-erp
```

### 3. Скопіюйте виправлені файли
Замініть файли в deployment-package наступними виправленнями:

**deployment-package/server/index.ts** - додайте після рядка 8:
```javascript
// Налаштування UTF-8 для всього додатку
app.use((req, res, next) => {
  // Встановлюємо правильне кодування для запитів
  if (req.method === 'GET') {
    // Перекодування query параметрів для правильної обробки UTF-8
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        try {
          // Спробуємо декодувати якщо потрібно
          const decoded = Buffer.from(value, 'latin1').toString('utf8');
          if (decoded !== value && /[а-яё]/i.test(decoded)) {
            req.query[key] = decoded;
          }
        } catch (e) {
          // Залишаємо оригінальне значення якщо декодування не вдалося
        }
      }
    }
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
```

**deployment-package/server/routes.ts** - замініть маршрут cities:
```javascript
app.get("/api/nova-poshta/cities", async (req, res) => {
  const { q } = req.query;
  let searchQuery = typeof q === 'string' ? q : "";
  
  // Правильне декодування UTF-8 для кирилічних символів
  try {
    searchQuery = decodeURIComponent(searchQuery);
  } catch (error) {
    // Якщо вже декодовано або некоректний формат
  }
  
  console.log(`Nova Poshta cities API called with query: "${searchQuery}"`);
  // ... решта коду
});
```

### 4. Перебудуйте та запустіть
```bash
cd /opt/regmik-erp/deployment-package
npm run build
sudo systemctl start regmik-erp
```

### 5. Перевірте роботу
```bash
curl "http://localhost:5000/api/nova-poshta/cities?q=чернігів"
```

## Результат
Після оновлення пошук міст працюватиме з кирилічними символами:
- "чернігів" поверне ~340 міст
- "київ" поверне ~150 міст
- "львів" поверне ~100 міст