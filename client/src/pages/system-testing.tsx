import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UkrainianDateTest from '@/components/UkrainianDateTest';

const SystemTesting: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Системне тестування</h1>
        <p className="text-gray-600">Інструменти для тестування критичних функцій системи</p>
      </div>

      <div className="grid gap-6">
        <UkrainianDateTest />
        
        <Card>
          <CardHeader>
            <CardTitle>🏦 Статус банківського моніторингу</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Банківський email моніторинг увімкнено та працює кожні 5 хвилин</p>
              <p className="text-sm text-gray-600">
                Останні оновлення включають виправлення парсингу українських дат у банківських повідомленнях
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Останні зміни системи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Виправлено помилку "Invalid time value" в обробці українських дат</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Покращено продуктивність форми редагування рахунків</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Додано підтримку всіх форматів банківських дат</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-xs text-gray-500 mt-8">
        Ця сторінка доступна тільки для системних адміністраторів
      </div>
    </div>
  );
};

export default SystemTesting;