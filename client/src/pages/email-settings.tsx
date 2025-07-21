import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEmailSettingsSchema, type InsertEmailSettings } from "@shared/schema";
import { Settings, Mail, TestTube, CreditCard } from "lucide-react";
import { BankMonitoringTest } from "@/components/BankMonitoringTest";

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: emailSettings, isLoading } = useQuery<any>({
    queryKey: ["/api/email-settings"],
    retry: false,
  });

  const form = useForm<InsertEmailSettings>({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "REGMIK ERP",
      isActive: false,
      bankEmailUser: "",
      bankEmailPassword: "",
      bankEmailAddress: "",
      bankEmailHost: "",
      bankEmailPort: 993,
      bankMonitoringEnabled: false,
    },
  });

  // Заповнити форму поточними налаштуваннями
  useEffect(() => {
    if (emailSettings) {
      form.reset({
        smtpHost: emailSettings?.smtpHost || "",
        smtpPort: emailSettings?.smtpPort || 587,
        smtpSecure: emailSettings?.smtpSecure || false,
        smtpUser: emailSettings?.smtpUser || "",
        smtpPassword: emailSettings?.smtpPassword || "",
        fromEmail: emailSettings?.fromEmail || "",
        fromName: emailSettings?.fromName || "REGMIK ERP",
        isActive: emailSettings?.isActive || false,
        bankEmailUser: emailSettings?.bankEmailUser || "",
        bankEmailPassword: emailSettings?.bankEmailPassword || "",
        bankEmailAddress: emailSettings?.bankEmailAddress || "",
        bankEmailHost: emailSettings?.bankEmailHost || "",
        bankEmailPort: emailSettings?.bankEmailPort || 993,
        bankMonitoringEnabled: emailSettings?.bankMonitoringEnabled || false,
      });
    }
  }, [emailSettings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: InsertEmailSettings) => {
      await apiRequest("/api/email-settings", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування email збережено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування email",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/email-settings/test", {
        method: "POST",
        body: form.getValues(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Підключення до SMTP сервера успішне",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка підключення",
        description: "Не вдалося підключитися до SMTP сервера. Перевірте налаштування.",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  const onSubmit = (data: InsertEmailSettings) => {
    saveSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Завантаження налаштувань...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
    <div className="max-w-4xl space-y-4 lg:space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Налаштування Email
          </h1>
          <p className="text-gray-500 mt-1">Управління налаштуваннями Email</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Mail className="h-4 w-4 lg:h-5 lg:w-5" />
            SMTP Налаштування
          </CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Налаштуйте SMTP сервер для відправки email повідомлень
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Хост</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.gmail.com"
                  {...form.register("smtpHost")}
                />
                {form.formState.errors.smtpHost && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.smtpHost.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Порт</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  placeholder="587"
                  {...form.register("smtpPort", { valueAsNumber: true })}
                />
                {form.formState.errors.smtpPort && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.smtpPort.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Користувач</Label>
                <Input
                  id="smtpUser"
                  placeholder="your-email@gmail.com"
                  {...form.register("smtpUser")}
                />
                {form.formState.errors.smtpUser && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.smtpUser.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Пароль</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="Пароль або App Password"
                  {...form.register("smtpPassword")}
                />
                {form.formState.errors.smtpPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.smtpPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email відправника</Label>
                <Input
                  id="fromEmail"
                  placeholder="noreply@regmik.ua"
                  {...form.register("fromEmail")}
                />
                {form.formState.errors.fromEmail && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.fromEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">Ім'я відправника</Label>
                <Input
                  id="fromName"
                  placeholder="REGMIK ERP"
                  {...form.register("fromName")}
                />
                {form.formState.errors.fromName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.fromName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="smtpSecure"
                checked={Boolean(form.watch("smtpSecure"))}
                onCheckedChange={(checked) => form.setValue("smtpSecure", checked)}
              />
              <Label htmlFor="smtpSecure">Використовувати SSL/TLS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={Boolean(form.watch("isActive"))}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Активувати email розсилку</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending}
                className="w-full sm:w-auto"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? "Тестування..." : "Тестувати підключення"}
              </Button>

              <Button
                type="submit"
                disabled={saveSettingsMutation.isPending}
                className="w-full sm:w-auto"
              >
                {saveSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <CreditCard className="h-4 w-4 lg:h-5 lg:w-5" />
            Налаштування банку для моніторингу платежів
          </CardTitle>
          <CardDescription className="text-sm lg:text-base">
            Налаштуйте підключення до банківської пошти для автоматичного відмічення оплат
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="bankEmailUser">SMTP Користувач банку</Label>
                <Input
                  id="bankEmailUser"
                  placeholder="bank@example.com"
                  {...form.register("bankEmailUser")}
                />
                {form.formState.errors.bankEmailUser && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankEmailUser.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankEmailPassword">SMTP Пароль банку</Label>
                <Input
                  id="bankEmailPassword"
                  type="password"
                  placeholder="Пароль для банківської пошти"
                  {...form.register("bankEmailPassword")}
                />
                {form.formState.errors.bankEmailPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankEmailPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankEmailHost">IMAP Хост банку</Label>
                <Input
                  id="bankEmailHost"
                  placeholder="mail.regmik.ua"
                  {...form.register("bankEmailHost")}
                />
                <p className="text-xs text-gray-500">
                  IMAP сервер для читання банківських повідомлень (зазвичай mail.вашдомен.ua)
                </p>
                {form.formState.errors.bankEmailHost && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankEmailHost.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankEmailPort">IMAP Порт банку</Label>
                <Input
                  id="bankEmailPort"
                  type="number"
                  placeholder="993"
                  {...form.register("bankEmailPort", { valueAsNumber: true })}
                />
                <p className="text-xs text-gray-500">
                  IMAP порт (993 для SSL/TLS, 143 для plain text)
                </p>
                {form.formState.errors.bankEmailPort && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankEmailPort.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankEmailAddress">Адреса банківських повідомлень</Label>
                <Input
                  id="bankEmailAddress"
                  placeholder="noreply@ukrsib.com.ua"
                  {...form.register("bankEmailAddress")}
                />
                <p className="text-xs text-gray-500">
                  Вкажіть email адресу з якої банк надсилає повідомлення про платежі
                </p>
                {form.formState.errors.bankEmailAddress && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankEmailAddress.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="bankMonitoringEnabled"
                checked={Boolean(form.watch("bankMonitoringEnabled"))}
                onCheckedChange={(checked) => form.setValue("bankMonitoringEnabled", checked)}
              />
              <Label htmlFor="bankMonitoringEnabled">Увімкнути моніторинг банківських платежів</Label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Інструкції для налаштування банківського моніторингу:</h4>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>Використовуйте ті ж SMTP налаштування що й для звичайної пошти</li>
                <li>Вкажіть точну адресу відправника банківських повідомлень (наприклад: noreply@ukrsib.com.ua)</li>
                <li>Система буде шукати в листах: "тип операції: зараховано", номери рахунків РМ00-XXXXXX та суми</li>
                <li>При знаходженні платежу система автоматично оновить статус замовлення</li>
                <li>Підтримується часткова оплата - якщо сума менша за рахунок</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    setIsTestingConnection(true);
                    const response = await apiRequest("/api/bank-email/test-connection", {
                      method: "POST",
                    });
                    toast({
                      title: "Тест підключення успішний",
                      description: response.message,
                    });
                  } catch (error: any) {
                    toast({
                      title: "Помилка підключення",
                      description: error.message || "Не вдалося підключитися до банківської пошти",
                      variant: "destructive",
                    });
                  } finally {
                    setIsTestingConnection(false);
                  }
                }}
                disabled={isTestingConnection}
                className="w-full sm:w-auto"
              >
                {isTestingConnection ? "Тестування..." : "Тестувати підключення до банку"}
              </Button>
              
              <BankMonitoringTest />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 lg:pb-6">
          <CardTitle className="text-lg lg:text-xl">Інструкції для налаштування</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <h4 className="font-semibold text-base lg:text-lg mb-2">Gmail SMTP:</h4>
              <ul className="list-disc list-inside text-sm lg:text-base text-gray-600 space-y-1">
                <li>Хост: smtp.gmail.com</li>
                <li>Порт: 587 (TLS) або 465 (SSL)</li>
                <li>Використовуйте App Password замість звичайного паролю</li>
                <li>Увімкніть двофакторну автентифікацію в Gmail</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-base lg:text-lg mb-2">Outlook/Hotmail SMTP:</h4>
              <ul className="list-disc list-inside text-sm lg:text-base text-gray-600 space-y-1">
                <li>Хост: smtp-mail.outlook.com</li>
                <li>Порт: 587 (TLS)</li>
                <li>Використовуйте ваш email та пароль Outlook</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
           </div>
        </header>
      </div>
      );
}