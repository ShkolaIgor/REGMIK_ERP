import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface UseSortingProps<T> {
  data: T[];
  tableName: string;
  defaultSort?: SortConfig;
}

export function useSorting<T extends Record<string, any>>({ data, tableName, defaultSort }: UseSortingProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    // Спочатку спробуємо завантажити з localStorage
    const localStorageKey = `sort-preferences-${tableName}`;
    const savedInLocalStorage = localStorage.getItem(localStorageKey);
    if (savedInLocalStorage) {
      try {
        const parsed = JSON.parse(savedInLocalStorage);
        return { field: parsed.sortField, direction: parsed.sortDirection };
      } catch {
        // Якщо помилка парсингу, використовуємо defaultSort
      }
    }
    return defaultSort || { field: 'id', direction: 'asc' };
  });

  // Завантаження збережених налаштувань сортування з сервера
  const { data: savedPreferences } = useQuery({
    queryKey: [`/api/user-sort-preferences/${tableName}`],
    retry: false,
  });

  // Збереження налаштувань сортування на сервері
  const saveSortPreferencesMutation = useMutation({
    mutationFn: async (sortConfig: SortConfig) => {
      return apiRequest('/api/user-sort-preferences', {
        method: 'POST',
        body: {
          tableName,
          sortField: sortConfig.field,
          sortDirection: sortConfig.direction
        }
      });
    },
  });

  // Встановлення збережених налаштувань при завантаженні з сервера
  useEffect(() => {
    if (savedPreferences && savedPreferences.sortField) {
      const serverSortConfig = {
        field: savedPreferences.sortField,
        direction: savedPreferences.sortDirection
      };
      setSortConfig(serverSortConfig);
      
      // Також зберігаємо в localStorage як backup
      const localStorageKey = `sort-preferences-${tableName}`;
      localStorage.setItem(localStorageKey, JSON.stringify(savedPreferences));
    }
  }, [savedPreferences, tableName]);

  // Функція для зміни сортування
  const handleSort = (field: string) => {
    const newDirection = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { field, direction: newDirection };
    
    setSortConfig(newSortConfig);
    
    // Зберігаємо в localStorage як fallback
    const localStorageKey = `sort-preferences-${tableName}`;
    localStorage.setItem(localStorageKey, JSON.stringify({
      sortField: newSortConfig.field,
      sortDirection: newSortConfig.direction
    }));
    
    // Також намагаємося зберегти на сервері
    saveSortPreferencesMutation.mutate(newSortConfig);
  };

  // Відсортовані дані
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.field);
      const bValue = getNestedValue(b, sortConfig.field);
      
      // Обробка null та undefined значень
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      // Порівняння значень
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'uk', { numeric: true });
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Перетворення в рядки для порівняння
        comparison = String(aValue).localeCompare(String(bValue), 'uk', { numeric: true });
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    isLoading: saveSortPreferencesMutation.isPending
  };
}

// Допоміжна функція для отримання вкладених значень по шляху (наприклад, "client.name")
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}