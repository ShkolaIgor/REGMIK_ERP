# Швидке виправлення Production помилки

## Проблема
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

## Рішення №1: Оновлення systemd service (Рекомендується)

```bash
# Зупиніть сервіс
sudo systemctl stop regmik-erp

# Відредагуйте конфігурацію
sudo systemctl edit regmik-erp

# Додайте у файл override.conf:
[Service]
Environment=PGHOST=localhost
Environment=PGPORT=5432
Environment=PGDATABASE=regmik-erp
Environment=PGUSER=regmik_user
Environment=PGPASSWORD=npg_PQu4CAr9yIYq
Environment=SESSION_SECRET=your_session_secret_here
Environment=NOVA_POSHTA_API_KEY=your_api_key_here

# Перезавантажте та запустіть
sudo systemctl daemon-reload
sudo systemctl start regmik-erp
sudo systemctl status regmik-erp
```

## Рішення №2: Використання .env файлу

```bash
cd /opt/REGMIK_ERP

# Створіть .env файл
sudo tee .env << 'EOF'
PGHOST=localhost
PGPORT=5432
PGDATABASE=regmik-erp
PGUSER=regmik_user
PGPASSWORD=npg_PQu4CAr9yIYq
SESSION_SECRET=regmik_erp_session_secret_2025
NOVA_POSHTA_API_KEY=your_nova_poshta_key
EOF

# Встановіть права доступу
sudo chown regmik:regmik .env
sudo chmod 600 .env

# Перезапустіть сервіс
sudo systemctl restart regmik-erp
```

## Перевірка роботи

```bash
# Перевірте статус
sudo systemctl status regmik-erp

# Перевірте логи
sudo journalctl -u regmik-erp -f

# Перевірте підключення
curl http://localhost:5000/api/dashboard/stats
```

## База даних готова
Система вже має повністю налаштовану базу даних `regmik-erp` з усіма таблицями та даними.