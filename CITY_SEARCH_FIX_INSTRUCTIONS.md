# Інструкція оновлення пошуку міст на продакшн сервері

## Проблема
Пошук міст у формі клієнтів не працює на продакшн сервері - "черні" знаходить 132 міста, але "черніг" знаходить 0.

## Рішення
Замінено логіку пошуку міст на робочу з модуля "Відвантаження":

### Зміни в client/src/components/ClientForm.tsx

1. **Змінено query логіку** (рядки 66-76):
```typescript
// Старий код:
const { data: cities, isLoading: citiesLoading } = useQuery({
  queryKey: ["/api/nova-poshta/cities", cityQuery],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (cityQuery) {
      params.set('q', cityQuery);
    }
    const response = await fetch(`/api/nova-poshta/cities?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    return response.json();
  },
  enabled: cityQuery.length >= 2 && selectedCarrierId === 4,
});

// Новий код:
const { data: cities = [], isLoading: citiesLoading } = useQuery({
  queryKey: ["/api/nova-poshta/cities", cityQuery],
  queryFn: async () => {
    const response = await fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(cityQuery)}`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    return response.json();
  },
  enabled: cityQuery.length >= 2 && selectedCarrierId === 4,
  staleTime: 0, // Відключаємо кеш для правильного пошуку
  gcTime: 0, // Видаляємо кеш одразу після використання
});
```

2. **Видалено додаткову фільтрацію** (рядки 85-87):
```typescript
// Старий код:
const filteredCities = cityQuery.length >= 2 ? (cities as any[])?.filter((city: any) =>
  city.Description.toLowerCase().includes(cityQuery.toLowerCase())
) || [] : [];

// Новий код:
// Використовуємо результати сервера без додаткової фільтрації (як у відвантаженнях)
const filteredCities = cities;
```

## Команди для оновлення продакшн сервера

```bash
# 1. Підключитися до продакшн сервера
ssh regmik@192.168.0.247

# 2. Перейти до директорії проекту
cd /opt/regmik-erp

# 3. Зробити резервну копію поточного файлу
sudo cp client/src/components/ClientForm.tsx client/src/components/ClientForm.tsx.backup.$(date +%Y%m%d_%H%M%S)

# 4. Завантажити оновлений файл (вручну скопіювати зміни або використати git)

# 5. Перезібрати проект
sudo npm run build

# 6. Перезапустити сервіс
sudo systemctl restart regmik-erp

# 7. Перевірити статус
sudo systemctl status regmik-erp
```

## Тестування
Після оновлення перевірити:
1. Відкрити форму створення клієнта
2. Вибрати перевізника "Нова Пошта" 
3. У полі пошуку міста ввести "черніг"
4. Переконатися, що знаходяться міста (наприклад, "Чернігів")

## Файли змінено
- `client/src/components/ClientForm.tsx` - основна логіка пошуку міст
- `deployment-package/client/src/components/ClientForm.tsx` - копія для розгортання

## Примітки
- Логіка тепер використовує прямі результати сервера без додаткової клієнтської фільтрації
- Відключено кешування для забезпечення актуальних результатів пошуку
- Використано `encodeURIComponent` для правильного кодування української мови в URL