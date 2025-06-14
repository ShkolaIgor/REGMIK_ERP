# ТЕРМІНОВИЙ ВИПРАВЛЕННЯ ПРОДАКШН СЕРВЕРА

## Проблема
Продакшн сервер не відображає сторінки через дублікати методів у файлі db-storage.ts:
- removeSerialNumberFromOrderItem (дублікат)
- getAvailableSerialNumbersForProduct (дублікат)
- completeOrderWithSerialNumbers (дублікат)

## Виправлення виконано
Видалено дублікати методів з файлу server/db-storage.ts (рядки 6323-6433)

## Інструкції для продакшн
1. Зупинити сервіс:
```bash
sudo systemctl stop regmik-erp
```

2. Оновити файл db-storage.ts:
```bash
cd /opt/regmik-erp
# Замінити deployment-package/server/db-storage.ts новою версією без дублікатів
```

3. Перебудувати та запустити:
```bash
cd deployment-package
sudo -u regmik-erp npm run build
sudo systemctl start regmik-erp
```

4. Перевірити роботу:
```bash
sudo systemctl status regmik-erp
curl http://localhost:5000/
```

## Статус
✅ Дублікати видалено з development версії
🔄 Потрібно оновити продакшн файл