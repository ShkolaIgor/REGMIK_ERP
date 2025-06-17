#!/bin/bash

echo "🔍 ДІАГНОСТИКА ПРОДАКШН СЕРВЕРА"
echo "================================"

# Перевірка статусу сервісу
echo "1. Статус сервісу regmik-erp:"
sudo systemctl status regmik-erp --no-pager | head -10

echo -e "\n2. Логи сервісу (останні 20 рядків):"
sudo journalctl -u regmik-erp -n 20 --no-pager

echo -e "\n3. Перевірка портів:"
sudo netstat -tlnp | grep :5000

echo -e "\n4. Перевірка файлів deployment-package:"
ls -la /opt/regmik-erp/deployment-package/server/ | head -10

echo -e "\n5. Перевірка прав доступу:"
ls -la /opt/regmik-erp/deployment-package/

echo -e "\n6. Тест HTTP запиту:"
curl -I http://localhost:5000/ 2>/dev/null || echo "Сервер не відповідає"

echo -e "\n7. Перевірка процесів Node.js:"
ps aux | grep node | grep -v grep

echo -e "\n8. Перевірка дискового простору:"
df -h /opt/regmik-erp/

echo -e "\n9. Останні помилки збірки:"
if [ -f /opt/regmik-erp/deployment-package/build.log ]; then
    tail -20 /opt/regmik-erp/deployment-package/build.log
else
    echo "Файл build.log не знайдено"
fi

echo -e "\n================================"
echo "Діагностика завершена"