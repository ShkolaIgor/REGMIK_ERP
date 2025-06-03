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
import { Settings, Mail, TestTube } from "lucide-react";

export default function EmailSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: emailSettings, isLoading } = useQuery({
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
    },
  });

  // Заповнити форму поточними налаштуваннями
  useEffect(() => {
    if (emailSettings) {
      form.reset({
        smtpHost: emailSettings.smtpHost || "",
        smtpPort: emailSettings.smtpPort || 587,
        smtpSecure: emailSettings.smtpSecure || false,
        smtpUser: emailSettings.smtpUser || "",
        smtpPassword: emailSettings.smtpPassword || "",
        fromEmail: emailSettings.fromEmail || "",
        fromName: emailSettings.fromName || "REGMIK ERP",
        isActive: emailSettings.isActive || false,
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
    <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 lg:h-6 lg:w-6" />
        <h1 className="text-xl lg:text-2xl font-bold">Налаштування Email</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Налаштування
          </CardTitle>
          <CardDescription>
            Налаштуйте SMTP сервер для відправки email повідомлень
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                checked={form.watch("smtpSecure")}
                onCheckedChange={(checked) => form.setValue("smtpSecure", checked)}
              />
              <Label htmlFor="smtpSecure">Використовувати SSL/TLS</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Активувати email розсилку</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTestingConnection ? "Тестування..." : "Тестувати підключення"}
              </Button>

              <Button
                type="submit"
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Інструкції для налаштування</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">Gmail SMTP:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Хост: smtp.gmail.com</li>
              <li>Порт: 587 (TLS) або 465 (SSL)</li>
              <li>Використовуйте App Password замість звичайного паролю</li>
              <li>Увімкніть двофакторну автентифікацію в Gmail</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Outlook/Hotmail SMTP:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Хост: smtp-mail.outlook.com</li>
              <li>Порт: 587 (TLS)</li>
              <li>Використовуйте ваш email та пароль Outlook</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}