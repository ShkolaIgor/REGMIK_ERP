#!/bin/bash

# Швидке оновлення управління валютами для продакшн
# Копіює тільки змінені файли без повної збірки

set -e

echo "🚀 Швидке оновлення системи управління валютами..."

# Перевірка що скрипт запускається з правильної директорії
if [ ! -f "package.json" ]; then
    echo "❌ Помилка: Запустіть скрипт з кореневої директорії проекту"
    exit 1
fi

# Створення пакету оновлення
UPDATE_DIR="currency-quick-update-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$UPDATE_DIR"

# Копіювання змінених файлів
echo "📋 Копіювання оновлених файлів..."
cp client/src/pages/currencies.tsx "$UPDATE_DIR/"
cp package.json "$UPDATE_DIR/"

# Створення структури директорій для розгортання
mkdir -p "$UPDATE_DIR/client/src/pages"
cp client/src/pages/currencies.tsx "$UPDATE_DIR/client/src/pages/"

# Створення скрипту розгортання
cat > "$UPDATE_DIR/deploy-quick.sh" << 'EOL'
#!/bin/bash

set -e

echo "🔄 Розгортання швидкого оновлення управління валютами..."

# Перевірка прав
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустіть скрипт з правами sudo"
    exit 1
fi

# Зупинка сервісу
echo "⏹️ Зупинка сервісу..."
systemctl stop regmik-erp || true

# Резервна копія
echo "📦 Створення резервної копії..."
cp -r /opt/regmik-erp /opt/regmik-erp-backup-$(date +%Y%m%d-%H%M%S)

# Копіювання файлів
echo "📂 Оновлення файлів..."
# Якщо це built версія
if [ -d "/opt/regmik-erp/client" ]; then
    cp client/src/pages/currencies.tsx /opt/regmik-erp/client/src/pages/
else
    # Якщо це dist версія - потрібна повна збірка
    echo "⚠️ Потрібна повна збірка для dist версії"
    echo "Використайте update-currency-management.sh"
    exit 1
fi

# Встановлення прав
chown -R regmik:regmik /opt/regmik-erp/

# Запуск сервісу
echo "▶️ Запуск сервісу..."
systemctl start regmik-erp

# Перевірка статусу
echo "🔍 Перевірка статусу..."
sleep 5
systemctl status regmik-erp --no-pager

echo "✅ Швидке оновлення завершено!"
echo "🌐 Перевірте роботу на: http://192.168.0.247:5000"
EOL

chmod +x "$UPDATE_DIR/deploy-quick.sh"

# Створення інструкції
cat > "$UPDATE_DIR/README.md" << 'EOL'
# Швидке оновлення управління валютами

## Що включено:
- Оновлений файл currencies.tsx з новим функціоналом
- НБУ управління в табі "Валюти" замість "Налаштування"
- Відображення сьогоднішнього курсу
- Автоматичне збереження налаштувань

## Розгортання:
```bash
# Копіювання на сервер
scp -r currency-quick-update-* user@192.168.0.247:/tmp/

# Розгортання
sudo ./deploy-quick.sh
```

## Примітка:
Цей скрипт працює тільки якщо продакшн використовує source файли.
Для dist версії використайте update-currency-management.sh
EOL

# Створення tar архіву
tar -czf "${UPDATE_DIR}.tar.gz" "$UPDATE_DIR"

# Очищення
rm -rf "$UPDATE_DIR"

echo "✅ Швидке оновлення підготовлено: ${UPDATE_DIR}.tar.gz"
echo ""
echo "📋 Інструкції:"
echo "1. Скопіюйте файл на продакшн сервер"
echo "2. Розпакуйте: tar -xzf ${UPDATE_DIR}.tar.gz"
echo "3. Перейдіть в директорію: cd currency-quick-update-*"
echo "4. Запустіть: sudo ./deploy-quick.sh"
echo ""
echo "⚠️ Увага: Працює тільки для source-based розгортань"