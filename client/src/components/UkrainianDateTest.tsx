import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const UkrainianDateTest: React.FC = () => {
  const [testString, setTestString] = useState('22 липня 2025 р.');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDateParsing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-ukrainian-date-parsing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateString: testString })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        setResult({ error: 'Помилка API запиту' });
      }
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Помилка тестування' });
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    '22 липня 2025 р.',
    '15 березня 2024',
    '1 січня 2025 р.',
    '30 грудня 2024',
    '18.07.25р.',
    '18.07.2025',
    'від 22 липня 2025 р.',
    'від 18.07.2025'
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Тестування парсингу українських дат</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Введіть дату для тестування"
          />
          <Button onClick={testDateParsing} disabled={loading}>
            {loading ? 'Тестування...' : 'Тест'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Швидкий вибір:</span>
          {testCases.map((testCase, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => setTestString(testCase)}
            >
              {testCase}
            </Badge>
          ))}
        </div>

        {result && (
          <Card className={result.error ? 'border-red-200 bg-red-50' : result.isValid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div><strong>Введено:</strong> {result.input || testString}</div>
                {result.error ? (
                  <div className="text-red-600"><strong>Помилка:</strong> {result.error}</div>
                ) : (
                  <>
                    <div><strong>Статус:</strong> {result.isValid ? '✅ Розпізнано' : '❌ Не розпізнано'}</div>
                    {result.parsedDate && (
                      <div><strong>Парсинг ISO:</strong> {result.parsedDate}</div>
                    )}
                    {result.formattedDate && (
                      <div><strong>Український формат:</strong> {result.formattedDate}</div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Підтримувані формати:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Українські місяці: "22 липня 2025 р."</li>
            <li>Числовий формат: "22.07.2025" або "22.07.25р."</li>
            <li>З префіксом: "від 22 липня 2025 р."</li>
            <li>Всі відмінки місяців: січня/січні/січень, липня/липні/липень</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default UkrainianDateTest;