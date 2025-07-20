import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TestTube, Play, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface WebhookTestResult {
  success: boolean;
  action: string;
  result?: any;
  message: string;
}

export function WebhookTest() {
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  
  const [updateData, setUpdateData] = useState(`{
  "action": "update",
  "invoiceData": {
    "НомерДокумента": "РМ00-000562",
    "ДатаДокумента": "2025-06-18T17:00:09",
    "Постачальник": "АЛЬФА-ПЛАСТ",
    "ЄДРПОУ": "38138158",
    "СуммаДокумента": 7200,
    "КодВалюты": "980",
    "positions": [
      {
        "НаименованиеТовара": "Фенольні формовочні компаунди",
        "КодТовара": "00000026579",
        "Количество": 50,
        "Цена": 120,
        "Сумма": 6000
      }
    ]
  }
}`);

  const [createData, setCreateData] = useState(`{
  "action": "create",
  "invoiceData": {
    "НомерДокумента": "РМ00-000999",
    "ДатаДокумента": "2025-07-20T18:30:00",
    "Постачальник": "ТЕСТ ПОСТАЧАЛЬНИК",
    "ЄДРПОУ": "12345678",
    "СуммаДокумента": 5000,
    "КодВалюты": "980",
    "positions": [
      {
        "НаименованиеТовара": "Тестовий товар",
        "КодТовара": "TEST001",
        "Количество": 10,
        "Цена": 500,
        "Сумма": 5000
      }
    ]
  }
}`);

  const testWebhookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/webhook/test-invoice", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast({
        title: "✅ Webhook тест успішний",
        description: `Операція ${data.action} виконана успішно`,
      });
    },
    onError: (error: any) => {
      console.error("Webhook test error:", error);
      setTestResult({
        success: false,
        action: "error",
        message: error.message || "Невідома помилка",
      });
      toast({
        title: "❌ Помилка webhook тесту",
        description: error.message || "Виникла помилка при тестуванні webhook",
        variant: "destructive",
      });
    },
  });

  const runTest = (testData: string) => {
    try {
      const parsedData = JSON.parse(testData);
      testWebhookMutation.mutate(parsedData);
    } catch (error) {
      toast({
        title: "❌ Помилка JSON",
        description: "Перевірте правильність JSON формату",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Тестування 1C Webhook
          </CardTitle>
          <CardDescription>
            Тестування webhook endpoints для створення та оновлення накладних з 1С системи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test Update (with auto-create) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Тест Update (створює накладну якщо не існує)</h3>
              <Button
                onClick={() => runTest(updateData)}
                disabled={testWebhookMutation.isPending}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                {testWebhookMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Тест Update
              </Button>
            </div>
            <Textarea
              value={updateData}
              onChange={(e) => setUpdateData(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder="JSON дані для тестування..."
            />
          </div>

          {/* Test Create */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Тест Create (нова накладна)</h3>
              <Button
                onClick={() => runTest(createData)}
                disabled={testWebhookMutation.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {testWebhookMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Тест Create
              </Button>
            </div>
            <Textarea
              value={createData}
              onChange={(e) => setCreateData(e.target.value)}
              rows={12}
              className="font-mono text-xs"
              placeholder="JSON дані для тестування..."
            />
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-3">
              <h3 className="font-medium">Результат тестування</h3>
              <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? "Успіх" : "Помилка"}
                    </Badge>
                    {testResult.action && (
                      <Badge variant="outline">
                        {testResult.action}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">{testResult.message}</p>
                    {testResult.result && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Деталі результату
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                          {JSON.stringify(testResult.result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Інструкції</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Update Test:</strong> Перевіряє логіку оновлення накладної. Якщо накладна не існує, автоматично створює нову.</p>
              <p><strong>Create Test:</strong> Створює нову накладну з унікальним номером.</p>
              <p><strong>External ID:</strong> Система генерує hash з комбінації "НомерДокумента + ДатаДокумента".</p>
              <p><strong>Формат дати:</strong> Використовуйте ISO формат: "2025-07-20T18:30:00".</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}