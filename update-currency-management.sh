#!/bin/bash

# Скрипт оновлення системи управління валютами для продакшн
# Дата: 12 червня 2025
# Включає: управління НБУ валютами через таб "Валюти", відображення сьогоднішнього курсу

set -e

echo "🔄 Початок оновлення системи управління валютами..."

# Функція логування
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Перевірка що скрипт запускається з правильної директорії
if [ ! -f "package.json" ]; then
    echo "❌ Помилка: Запустіть скрипт з кореневої директорії проекту"
    exit 1
fi

# Створення резервної копії
log "📦 Створення резервної копії..."
BACKUP_DIR="/tmp/regmik-erp-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r client/src/pages/currencies.tsx "$BACKUP_DIR/" 2>/dev/null || true
cp -r server/routes.ts "$BACKUP_DIR/" 2>/dev/null || true
cp -r server/db-storage.ts "$BACKUP_DIR/" 2>/dev/null || true
log "✅ Резервна копія створена: $BACKUP_DIR"

# Збірка проекту
log "🔨 Збірка оновленого проекту..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Помилка збірки проекту"
    exit 1
fi

# Перевірка наявності dist директорії
if [ ! -d "dist" ]; then
    echo "❌ Помилка: Директорія dist не знайдена після збірки"
    exit 1
fi

log "✅ Проект успішно зібрано"

# Створення пакету для розгортання
log "📋 Створення пакету для розгортання..."
DEPLOY_DIR="currency-management-update-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Копіювання файлів
cp -r dist "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp drizzle.config.ts "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/" 2>/dev/null || true
cp -r shared "$DEPLOY_DIR/"

# Створення інструкції з розгортання
cat > "$DEPLOY_DIR/DEPLOY_INSTRUCTIONS.md" << 'EOL'
# Інструкція з розгортання оновлення управління валютами

## Що включено в оновлення:
1. ✅ Управління НБУ валютами перенесено з табу "Налаштування" до табу "Валюти"
2. ✅ Додано чекбокси для швидкого вмикання/вимикання автоматичного оновлення валют
3. ✅ Автоматичне збереження змін при зміні стану чекбоксів
4. ✅ Показ сьогоднішнього курсу НБУ замість останнього доступного
5. ✅ UAH виключена з НБУ оновлень (показується "—")

## Кроки розгортання:

### 1. Зупинити сервіс
```bash
sudo systemctl stop regmik-erp
```

### 2. Створити резервну копію
```bash
sudo cp -r /opt/regmik-erp /opt/regmik-erp-backup-$(date +%Y%m%d)
```

### 3. Оновити файли
```bash
sudo cp -r dist/* /opt/regmik-erp/
sudo chown -R regmik:regmik /opt/regmik-erp/
```

### 4. Запустити сервіс
```bash
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

### 5. Перевірити роботу
- Перейти на http://192.168.0.247:5000
- Авторизуватися (ShkolaIhor/123456)
- Перевірити таб "Валюти" - тепер там є управління НБУ
- Перевірити що показується сьогоднішній курс

## Відкат у разі проблем:
```bash
sudo systemctl stop regmik-erp
sudo rm -rf /opt/regmik-erp
sudo mv /opt/regmik-erp-backup-YYYYMMDD /opt/regmik-erp
sudo systemctl start regmik-erp
```
EOL

# Створення скрипту автоматичного розгортання
cat > "$DEPLOY_DIR/auto-deploy.sh" << 'EOL'
#!/bin/bash

set -e

echo "🚀 Автоматичне розгортання оновлення управління валютами..."

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

# Оновлення файлів
echo "📂 Оновлення файлів..."
cp -r dist/* /opt/regmik-erp/
chown -R regmik:regmik /opt/regmik-erp/

# Запуск сервісу
echo "▶️ Запуск сервісу..."
systemctl start regmik-erp

# Перевірка статусу
echo "🔍 Перевірка статусу..."
sleep 5
systemctl status regmik-erp --no-pager

echo "✅ Розгортання завершено!"
echo "🌐 Сервіс доступний на: http://192.168.0.247:5000"
EOL

chmod +x "$DEPLOY_DIR/auto-deploy.sh"

# Створення tar архіву
log "📦 Створення архіву..."
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"

log "✅ Пакет для розгортання готовий: ${DEPLOY_DIR}.tar.gz"

# Очищення тимчасових файлів
rm -rf "$DEPLOY_DIR"

echo ""
echo "🎉 Оновлення підготовлено успішно!"
echo ""
echo "📋 Що далі:"
echo "1. Скопіюйте файл ${DEPLOY_DIR}.tar.gz на продакшн сервер"
echo "2. Розпакуйте: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "3. Запустіть: sudo ./auto-deploy.sh"
echo ""
echo "🔧 Основні зміни:"
echo "   ✅ Управління НБУ валютами в табі 'Валюти'"
echo "   ✅ Автоматичне збереження налаштувань"
echo "   ✅ Відображення сьогоднішнього курсу"
echo "   ✅ Прибрано дублювання з табу 'Налаштування'"
echo ""