import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, CreditCard, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

export function BankMonitoringTest() {
  const { toast } = useToast();
  const [testEmailContent, setTestEmailContent] = useState(`Щановний клієнте!

Інформуємо Вас про рух коштів по рахунку: UA123456789012345678901234567890
Валюта: UAH

Операція від 12.07.2025:
Тип операції: зараховано
Сумма: 9072,00
Корреспондент: ВІКОРД ТОВ
Призначення платежу: Оплата згідно рахунку РМ00-027688 від 11.07.2025, у т.ч. ПДВ 1512,00

З повагою,
Укрсіббанк`);

  // Тестування системи з реальним email зразком
  const testPresetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/bank-payments/test-monitoring", "POST");
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Тест успішний",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Тест не пройдено",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "❌ Помилка тестування",
        description: "Не вдалося протестувати банківський моніторинг",
        variant: "destructive",
      });
      console.error("Test error:", error);
    },
  });

  // Тестування з користувацьким email
  const testCustomMutation = useMutation({
    mutationFn: async (emailContent: string) => {
      return await apiRequest("/api/bank-payments/process-manual", "POST", {
        emailContent,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Email оброблено",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Не вдалося обробити",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "❌ Помилка обробки",
        description: "Не вдалося обробити email",
        variant: "destructive",
      });
      console.error("Processing error:", error);
    },
  });

  // Отримання статистики банківських платежів
  const { data: stats } = useQuery({
    queryKey: ["/api/bank-payments/stats"],
    refetchInterval: 30000, // Оновлюємо кожні 30 секунд
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Тестування банківського моніторингу
          </CardTitle>
          <CardDescription>
            Перевірте як система розпізнає та обробляє банківські повідомлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Статистика */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Всього повідомлень</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
                <div className="text-sm text-gray-600">Оброблено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unprocessed}</div>
                <div className="text-sm text-gray-600">Необроблено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.lastWeek}</div>
                <div className="text-sm text-gray-600">За тиждень</div>
              </div>
            </div>
          )}

          {/* Швидкий тест з прикладом */}
          <div className="space-y-2">
            <h4 className="font-semibold">Швидкий тест з прикладом Укрсіббанку:</h4>
            <Button
              onClick={() => testPresetMutation.mutate()}
              disabled={testPresetMutation.isPending}
              className="w-full"
              variant="outline"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testPresetMutation.isPending ? "Тестування..." : "Протестувати з прикладом РМ00-027688"}
            </Button>
          </div>

          {/* Тест з користувацьким email */}
          <div className="space-y-2">
            <h4 className="font-semibold">Тест з власним email:</h4>
            <Textarea
              value={testEmailContent}
              onChange={(e) => setTestEmailContent(e.target.value)}
              placeholder="Вставте текст банківського повідомлення тут..."
              rows={8}
              className="font-mono text-sm"
            />
            <Button
              onClick={() => testCustomMutation.mutate(testEmailContent)}
              disabled={testCustomMutation.isPending || !testEmailContent.trim()}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {testCustomMutation.isPending ? "Обробка..." : "Обробити email"}
            </Button>
          </div>

          {/* Інструкції для формату email */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Формат банківського повідомлення:</h4>
                <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                  <li><strong>рух коштів по рахунку:</strong> UA123456789012345678901234567890</li>
                  <li><strong>Тип операції:</strong> зараховано</li>
                  <li><strong>Сумма:</strong> 9072,00 (український формат з комою)</li>
                  <li><strong>Корреспондент:</strong> Назва компанії</li>
                  <li><strong>Призначення платежу:</strong> ... рахунку РМ00-027688 ...</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}