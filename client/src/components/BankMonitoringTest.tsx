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

Операція від 16.07.2025:
Тип операції: зараховано
Сумма: 5250,50
Корреспондент: ТОВ "ТЕСТОВА КОМПАНІЯ"
Призначення платежу: Передоплата за товар згідно рах 27711 від16.07.25 у т.ч. ПДВ 20% - 875.08 грн.

З повагою,
Укрсіббанк`);

  // Тестування Base64 декодування - перевірка ВСІХ прочитаних повідомлень
  const testBase64Mutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/test-base64-banking", {
        method: "GET",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Base64 декодування працює",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Помилка Base64 декодування",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "❌ Помилка тестування Base64",
        description: "Не вдалося протестувати Base64 декодування",
        variant: "destructive",
      });
      console.error("Base64 test error:", error);
    },
  });

  // Тестування системи з реальним email зразком
  const testPresetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/bank-payments/test-monitoring", {
        method: "POST",
      });
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
      return await apiRequest("/api/bank-payments/process-manual", {
        method: "POST",
        body: { emailContent },
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

  // Тестування універсального алгоритму розпізнавання номерів
  const testUniversalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/test-universal-invoice-parsing", {
        method: "GET",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Універсальний алгоритм працює",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "❌ Помилка алгоритму",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "❌ Помилка тестування",
        description: "Не вдалося протестувати універсальний алгоритм",
        variant: "destructive",
      });
      console.error("Universal test error:", error);
    },
  });

  // Тестування реального банківського повідомлення користувача
  const testUserBankMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/test-user-bank-parsing", {
        method: "GET",
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Тест реального банківського повідомлення",
          description: `Успішно розпізнано суму: ${data.parsed?.amount} ${data.parsed?.currency}`,
          variant: "default",
        });
        console.log("Очікувані дані:", data.expected);
        console.log("Розпізнані дані:", data.parsed);
      } else {
        toast({
          title: "❌ Помилка парсингу",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "❌ Помилка тестування",
        description: "Не вдалося протестувати реальне банківське повідомлення",
        variant: "destructive",
      });
      console.error("User bank test error:", error);
    },
  });

  // Отримання статистики банківських платежів
  const { data: stats } = useQuery<{
    total: number;
    processed: number;
    unprocessed: number;
    lastWeek: number;
  }>({
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

          {/* Тестування Base64 декодування */}
          <div className="space-y-2">
            <h4 className="font-semibold">Тестування Base64 декодування банківських email:</h4>
            <Button
              onClick={() => testBase64Mutation.mutate()}
              disabled={testBase64Mutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testBase64Mutation.isPending ? "Обробка ВСІХ email..." : "Обробити всі банківські email (включно з прочитаними)"}
            </Button>
            <p className="text-sm text-gray-600">
              Перевіряє та обробляє ВСІ банківські повідомлення за останній тиждень з Base64 декодуванням
            </p>
          </div>

          {/* Тестування універсального алгоритму */}
          <div className="space-y-2">
            <h4 className="font-semibold">Тест універсального розпізнавання номерів:</h4>
            <Button
              onClick={() => testUniversalMutation.mutate()}
              disabled={testUniversalMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testUniversalMutation.isPending ? "Тестування..." : "Протестувати всі формати рахунків"}
            </Button>
            <p className="text-sm text-gray-600">
              Перевіряє розпізнавання форматів: "27711 від 16.07.25", "згідно рах 27688", "рах.№27711" тощо
            </p>
          </div>

          {/* Тестування реального банківського повідомлення */}
          <div className="space-y-2">
            <h4 className="font-semibold">Тест з реальним банківським повідомленням (сумма: 39535.20):</h4>
            <Button
              onClick={() => testUserBankMutation.mutate()}
              disabled={testUserBankMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {testUserBankMutation.isPending ? "Перевірка парсингу..." : "Тестувати з реальними даними від АГРО-ОВЕН"}
            </Button>
            <p className="text-sm text-gray-600">
              Перевіряє точність розпізнавання суми, кореспондента та номера рахунку з реального банківського повідомлення
            </p>
          </div>

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