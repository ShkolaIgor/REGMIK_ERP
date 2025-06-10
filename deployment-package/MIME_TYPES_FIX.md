# Виправлення MIME типів для REGMIK ERP

## Проблема
```
[Error] Did not parse stylesheet at 'https://erp.regmik.ua/assets/index-tysoLeLN.css' because non CSS MIME types are not allowed in strict mode.
[Error] TypeError: 'text/html' is not a valid JavaScript MIME type.
```

## Рішення
Оновлено продакшн сервер з правильними MIME типами для всіх статичних файлів:

### Налаштовані MIME типи:
- `.css` → `text/css; charset=utf-8`
- `.js`, `.mjs` → `application/javascript; charset=utf-8`
- `.json` → `application/json; charset=utf-8`
- `.html` → `text/html; charset=utf-8`
- `.svg` → `image/svg+xml; charset=utf-8`
- `.png` → `image/png`
- `.jpg`, `.jpeg` → `image/jpeg`
- `.ico` → `image/x-icon`
- `.woff`, `.woff2` → `font/woff2`

### Кешування
Додано оптимізацію кешування для статичних файлів:
`Cache-Control: public, max-age=31536000`

## Файли оновлені:
- `server/production.ts` - додано middleware для MIME типів
- `dist/server.js` - оновлена продакшн збірка

## Результат
Після розгортання всі статичні файли подаватимуться з правильними MIME типами, що усуне помилки браузера.