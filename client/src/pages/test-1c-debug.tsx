import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Test1CDebug() {
  const [manualData, setManualData] = useState<any>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualLoading, setIsManualLoading] = useState(false);

  // Автоматичний запит через React Query
  const { data: autoData, isLoading: isAutoLoading, error: autoError, refetch } = useQuery({
    queryKey: ['/api/1c/invoices'],
    retry: false,
    onError: (error) => {
      console.error('React Query Error:', error);
    },
    onSuccess: (data) => {
      console.log('React Query Success:', data);
    }
  });

  // Ручний запит через fetch
  const handleManualFetch = async () => {
    setIsManualLoading(true);
    setManualError(null);
    setManualData(null);

    try {
      console.log('Виконуємо ручний запит до /api/1c/invoices');
      const response = await fetch('/api/1c/invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Включаємо cookies для авторизації
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setManualData(data);
    } catch (error) {
      console.error('Manual fetch error:', error);
      setManualError(error instanceof Error ? error.message : 'Невідома помилка');
    } finally {
      setIsManualLoading(false);
    }
  };

  // Тест вихідних рахунків
  const [outgoingData, setOutgoingData] = useState<any>(null);
  const [outgoingError, setOutgoingError] = useState<string | null>(null);
  const [isOutgoingLoading, setIsOutgoingLoading] = useState(false);

  const handleOutgoingFetch = async () => {
    setIsOutgoingLoading(true);
    setOutgoingError(null);
    setOutgoingData(null);

    try {
      console.log('Виконуємо запит до /api/1c/outgoing-invoices');
      const response = await fetch('/api/1c/outgoing-invoices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Outgoing response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Outgoing response data:', data);
      setOutgoingData(data);
    } catch (error) {
      console.error('Outgoing fetch error:', error);
      setOutgoingError(error instanceof Error ? error.message : 'Невідома помилка');
    } finally {
      setIsOutgoingLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Тест 1С API Дебаг</h1>
        <Badge variant="outline">Тестова сторінка</Badge>
      </div>

      {/* React Query тест */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            React Query тест (/api/1c/invoices)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => refetch()} disabled={isAutoLoading}>
              {isAutoLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Оновити через React Query
            </Button>
            <Badge variant={autoError ? "destructive" : autoData ? "default" : "secondary"}>
              {autoError ? "Помилка" : autoData ? "Успіх" : "Очікування"}
            </Badge>
          </div>

          {isAutoLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Завантаження через React Query...
            </div>
          )}

          {autoError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-800">Помилка React Query:</p>
              <p className="text-sm text-red-600">{autoError instanceof Error ? autoError.message : String(autoError)}</p>
            </div>
          )}

          {autoData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">Дані отримано:</p>
              <pre className="text-xs text-green-700 mt-2 max-h-40 overflow-y-auto">
                {JSON.stringify(autoData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ручний тест */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Ручний тест (/api/1c/invoices)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleManualFetch} disabled={isManualLoading}>
              {isManualLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Виконати ручний запит
            </Button>
            <Badge variant={manualError ? "destructive" : manualData ? "default" : "secondary"}>
              {manualError ? "Помилка" : manualData ? "Успіх" : "Не виконано"}
            </Badge>
          </div>

          {manualError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-800">Помилка ручного запиту:</p>
              <p className="text-sm text-red-600">{manualError}</p>
            </div>
          )}

          {manualData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">Дані ручного запиту:</p>
              <pre className="text-xs text-green-700 mt-2 max-h-40 overflow-y-auto">
                {JSON.stringify(manualData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Тест вихідних рахунків */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Тест вихідних рахунків (/api/1c/outgoing-invoices)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleOutgoingFetch} disabled={isOutgoingLoading}>
              {isOutgoingLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Тест вихідних рахунків
            </Button>
            <Badge variant={outgoingError ? "destructive" : outgoingData ? "default" : "secondary"}>
              {outgoingError ? "Помилка" : outgoingData ? "Успіх" : "Не виконано"}
            </Badge>
          </div>

          {outgoingError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-medium text-red-800">Помилка вихідних рахунків:</p>
              <p className="text-sm text-red-600">{outgoingError}</p>
            </div>
          )}

          {outgoingData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">Дані вихідних рахунків:</p>
              <pre className="text-xs text-green-700 mt-2 max-h-40 overflow-y-auto">
                {JSON.stringify(outgoingData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Інформація про консоль */}
      <Card>
        <CardHeader>
          <CardTitle>Інструкції з дебагу</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Відкрийте консоль розробника (F12)</li>
            <li>Перейдіть на вкладку "Console"</li>
            <li>Натисніть кнопки тестування вище</li>
            <li>Перевірте логи в консолі для детальної інформації</li>
            <li>Звертайте увагу на помилки 401 (неавторизований доступ)</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}