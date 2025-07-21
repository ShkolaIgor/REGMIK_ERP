import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BankEmailSettings {
  bankMonitoringEnabled: boolean;
  bankEmailAddress: string;
  bankEmailUser: string;
  smtpHost: string;
  smtpPort: number;
  hasPassword: boolean;
}

interface BankEmailStats {
  total: number;
  processed: number;
  unprocessed: number;
  lastWeek: number;
}

interface TestResult {
  success: boolean;
  message: string;
  notification?: any;
}

interface ProcessResult {
  success: boolean;
  details?: {
    processed: number;
    failed: number;
    skipped: number;
  };
}

export default function BankEmailTest() {
  const [emailContent, setEmailContent] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Отримання налаштувань банківського email
  const { data: settings, isLoading: settingsLoading } = useQuery<BankEmailSettings>({
    queryKey: ["/api/bank-email-settings"],
  });

  // Отримання статистики банківських повідомлень
  const { data: stats, isLoading: statsLoading } = useQuery<BankEmailStats>({
    queryKey: ["/api/bank-email-stats"],
  });

  // Тестування обробки email
  const testEmailMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("/api/test-bank-email", {
        method: "POST",
        body: { emailContent: content },
      });
    },
    onSuccess: (result) => {
      setTestResult(result);
      if (result.success) {
        toast({
          title: "Успіх",
          description: result.message,
        });
      } else {
        toast({
          title: "Помилка",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Помилка тестування",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Обробка необроблених повідомлень
  const processUnprocessedMutation = useMutation<ProcessResult>({
    mutationFn: async () => {
      return apiRequest("/api/bank-email/process-unprocessed", {
        method: "POST",
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-email-stats"] });
      toast({
        title: "Обробка завершена",
        description: `Оброблено: ${result.details?.processed || 0}, Помилок: ${result.details?.failed || 0}, Пропущено: ${result.details?.skipped || 0}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка обробки",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestEmail = () => {
    if (!emailContent.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть текст email для тестування",
        variant: "destructive",
      });
      return;
    }
    testEmailMutation.mutate(emailContent);
  };

  const sampleEmail = `рух коштів по рахунку: UA123456789012345678
валюта: UAH
тип операції: зараховано
сумма: 9072,50
корреспондент: ВІКОРД ТОВ
призначення платежу: За рахунок РМ00-027688 від 15.01.2025. ПДВ 1512,08`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Тестування банківського email</h1>
          <p className="text-muted-foreground">
            Перевірка обробки банківських повідомлень та налаштувань
          </p>
        </div>
      </div>

      {/* Налаштування банківського email */}
      <Card>
        <CardHeader>
          <CardTitle>Налаштування банківського моніторингу</CardTitle>
          <CardDescription>Поточні налаштування для обробки банківських email</CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <p>Завантаження налаштувань...</p>
          ) : settings ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Статус моніторингу:</p>
                <Badge variant={settings.bankMonitoringEnabled ? "default" : "secondary"}>
                  {settings.bankMonitoringEnabled ? "Увімкнено" : "Вимкнено"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Банківська адреса:</p>
                <p className="text-sm text-muted-foreground">{settings.bankEmailAddress || "Не налаштовано"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email користувач:</p>
                <p className="text-sm text-muted-foreground">{settings.bankEmailUser || "Не налаштовано"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">SMTP хост:</p>
                <p className="text-sm text-muted-foreground">{settings.smtpHost || "Не налаштовано"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">SMTP порт:</p>
                <p className="text-sm text-muted-foreground">{settings.smtpPort || "Не налаштовано"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Пароль налаштовано:</p>
                <Badge variant={settings.hasPassword ? "default" : "destructive"}>
                  {settings.hasPassword ? "Так" : "Ні"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-destructive">Помилка завантаження налаштувань</p>
          )}
        </CardContent>
      </Card>

      {/* Статистика банківських повідомлень */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика банківських повідомлень</CardTitle>
          <CardDescription>Кількість оброблених та необроблених повідомлень</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <p>Завантаження статистики...</p>
          ) : stats ? (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Усього</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
                <p className="text-sm text-muted-foreground">Оброблено</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.unprocessed}</p>
                <p className="text-sm text-muted-foreground">Необроблено</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.lastWeek}</p>
                <p className="text-sm text-muted-foreground">За тиждень</p>
              </div>
            </div>
          ) : (
            <p className="text-destructive">Помилка завантаження статистики</p>
          )}
          
          {/* Кнопка для обробки необроблених повідомлень */}
          {stats && stats.unprocessed > 0 && (
            <div className="pt-4 border-t">
              <Button 
                onClick={() => processUnprocessedMutation.mutate()}
                disabled={processUnprocessedMutation.isPending}
                variant="default"
                className="w-full"
              >
                {processUnprocessedMutation.isPending 
                  ? "Обробка необроблених повідомлень..." 
                  : `Обробити ${stats.unprocessed} необроблених повідомлень`
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Тестування email */}
      <Card>
        <CardHeader>
          <CardTitle>Тестування обробки email</CardTitle>
          <CardDescription>
            Введіть текст банківського повідомлення для перевірки обробки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              variant="outline" 
              onClick={() => setEmailContent(sampleEmail)}
              className="mb-2"
            >
              Використати зразок email
            </Button>
            <Textarea
              placeholder="Вставте текст банківського email для тестування..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending || !emailContent.trim()}
            className="w-full"
          >
            {testEmailMutation.isPending ? "Тестування..." : "Тестувати email"}
          </Button>

          {/* Результат тестування */}
          {testResult && (
            <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Результат: {testResult.success ? "Успіх" : "Помилка"}
                  </p>
                  <p>{testResult.message}</p>
                  {testResult.notification && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <p><strong>ID повідомлення:</strong> {testResult.notification.id}</p>
                      <p><strong>Сума:</strong> {testResult.notification.amount} {testResult.notification.currency}</p>
                      <p><strong>Кореспондент:</strong> {testResult.notification.correspondent}</p>
                      <p><strong>Операція:</strong> {testResult.notification.operationType}</p>
                      {testResult.notification.invoiceNumber && (
                        <p><strong>Номер рахунку:</strong> {testResult.notification.invoiceNumber}</p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}