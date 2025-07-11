import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, RefreshCw, TestTube, Trash2, Check, X, Clock, AlertCircle, Workflow } from "lucide-react";
import { Import1CInvoices } from "@/components/Import1CInvoices";
import { Import1COutgoingInvoices } from "@/components/Import1COutgoingInvoices";
import { SimpleLogin } from "@/components/SimpleLogin";

interface IntegrationConfig {
  id: number;
  name: string;
  displayName: string;
  type: string;
  isActive: boolean;
  config: {
    baseUrl?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    webhookUrl?: string;
    syncInterval?: number;
    lastSyncAt?: string;
    syncMethods?: string[];
    customFields?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

interface SyncLog {
  id: number;
  integrationId: number;
  operation: string;
  status: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    type: "",
    baseUrl: "",
    clientId: "",
    clientSecret: "",
    webhookUrl: "",
    syncInterval: 60,
    syncMethods: [] as string[],
  });

  // Локальний стейт для інтеграцій та авторизації
  const [localIntegrations, setLocalIntegrations] = useState<IntegrationConfig[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Запити даних без кешування
  const { data: integrations = [], isLoading: integrationsLoading, refetch: refetchIntegrations } = useQuery({
    queryKey: ["/api/integrations"],
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  // Синхронізуємо локальний стейт з даними сервера
  useEffect(() => {
    if (integrations.length > 0) {
      setLocalIntegrations(integrations);
    }
  }, [integrations]);

  // Використовуємо локальний стейт якщо є дані, інакше дані з query
  const displayIntegrations = localIntegrations.length > 0 ? localIntegrations : integrations;

  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/integrations/sync-logs"],
  });

  // Мутації
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/integrations", "POST", data);
    },
    onSuccess: async (newIntegration) => {
      // КРИТИЧНЕ ВИПРАВЛЕННЯ: СИНХРОННО додаємо до локального стейту
      setLocalIntegrations(prev => [...prev, newIntegration]);
      
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Інтеграцію створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити інтеграцію",
        variant: "destructive",
      });
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/integrations/${id}`, "PUT", data);
    },
    onSuccess: async (updatedIntegration) => {
      // КРИТИЧНЕ ВИПРАВЛЕННЯ: СИНХРОННО оновлюємо локальний стейт
      setLocalIntegrations(prev => 
        prev.map(integration => 
          integration.id === updatedIntegration.id ? updatedIntegration : integration
        )
      );
      
      setSelectedIntegration(updatedIntegration);
      
      // Оновлюємо форму з новими даними
      setFormData({
        name: updatedIntegration.name,
        displayName: updatedIntegration.displayName,
        type: updatedIntegration.type,
        baseUrl: updatedIntegration.config.baseUrl || "",
        clientId: updatedIntegration.config.clientId || "",
        clientSecret: updatedIntegration.config.clientSecret || "",
        webhookUrl: updatedIntegration.config.webhookUrl || "",
        syncInterval: updatedIntegration.config.syncInterval || 60,
        syncMethods: updatedIntegration.config.syncMethods || [],
      });
      
      // Закриваємо діалог після успішного оновлення 
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Успіх", 
        description: "Інтеграцію оновлено успішно",
      });
    },
    onError: (error: any) => {
      console.error("Update integration error:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити інтеграцію",
        variant: "destructive",
      });
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/integrations/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Успіх",
        description: "Інтеграцію видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити інтеграцію",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/integrations/${id}/test`, "POST");
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Успіх" : "Помилка",
        description: data.success ? "З'єднання успішне" : "Не вдалося підключитися",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка тестування з'єднання",
        variant: "destructive",
      });
    },
  });

  const syncDataMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: string }) => {
      return apiRequest(`/api/integrations/${id}/sync`, "POST", { direction });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/sync-logs"] });
      toast({
        title: "Успіх",
        description: "Синхронізацію запущено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося запустити синхронізацію",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      type: "",
      baseUrl: "",
      clientId: "",
      clientSecret: "",
      webhookUrl: "",
      syncInterval: 60,
      syncMethods: [],
    });
    setSelectedIntegration(null);
  };

  const handleSubmit = () => {
    const configData = {
      name: formData.name,
      displayName: formData.displayName,
      type: formData.type,
      isActive: true,
      config: {
        baseUrl: formData.baseUrl,
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        webhookUrl: formData.webhookUrl,
        syncInterval: formData.syncInterval,
        syncMethods: formData.syncMethods,
      },
    };

    if (selectedIntegration) {
      updateIntegrationMutation.mutate({ id: selectedIntegration.id, data: configData });
    } else {
      createIntegrationMutation.mutate(configData);
    }
  };

  const toggleIntegrationStatus = (integration: IntegrationConfig) => {
    updateIntegrationMutation.mutate({
      id: integration.id,
      data: { isActive: !integration.isActive },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "failed":
        return <X className="h-4 w-4 text-red-500" />;
      case "started":
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      failed: "destructive",
      started: "secondary",
      processing: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Інтеграції</h1>
          <p className="text-muted-foreground">Управління інтеграціями із зовнішніми системами</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowLoginDialog(true)}
                >
                  Увійти
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => resetForm()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Додати інтеграцію
                    </Button>
                  </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedIntegration ? "Редагування інтеграції" : "Нова інтеграція"}
              </DialogTitle>
              <DialogDescription>
                Налаштуйте параметри підключення до зовнішньої системи
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Тип системи</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bitrix24">Бітрікс24</SelectItem>
                      <SelectItem value="1c">1С (загальна)</SelectItem>
                      <SelectItem value="1c_enterprise">1С:Підприємство</SelectItem>
                      <SelectItem value="1c_accounting">1С:Бухгалтерія</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Системне ім'я</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="bitrix24_main"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Унікальне системне ім'я для внутрішнього використання
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="displayName">Відображуване ім'я</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Основний Бітрікс24"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Назва яка відображається в інтерфейсі користувача
                </p>
              </div>

              <div>
                <Label htmlFor="baseUrl">URL сервера</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://your-domain.bitrix24.ua"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID / Логін</Label>
                  <Input
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="clientSecret">Client Secret / Пароль</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL (опціонально)</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://webhook.url/integration"
                />
              </div>

              <div>
                <Label htmlFor="syncInterval">Інтервал синхронізації (хвилини)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  value={formData.syncInterval}
                  onChange={(e) => setFormData({ ...formData, syncInterval: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Скасувати
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createIntegrationMutation.isPending || updateIntegrationMutation.isPending}
              >
                {selectedIntegration ? "Оновити" : "Створити"}
              </Button>
            </DialogFooter>
          </DialogContent>
                </Dialog>
              </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Конфігурації</TabsTrigger>
          <TabsTrigger value="logs">Логи синхронізації</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {integrationsLoading ? (
            <div>Завантаження...</div>
          ) : (
            <div className="grid gap-4">
              {displayIntegrations.map((integration: IntegrationConfig) => {
                console.log("UI: Рендеринг інтеграції:", integration.id, integration.name, integration.displayName);
                return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {integration.displayName}
                          <Badge variant={integration.isActive ? "default" : "secondary"}>
                            {integration.isActive ? "Активна" : "Неактивна"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {integration.type} • {integration.name} (ID: {integration.id})
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnectionMutation.mutate(integration.id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <TestTube className="mr-2 h-4 w-4" />
                          Тест
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncDataMutation.mutate({ id: integration.id, direction: "import" })}
                          disabled={syncDataMutation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Імпорт
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncDataMutation.mutate({ id: integration.id, direction: "export" })}
                          disabled={syncDataMutation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Експорт
                        </Button>
                        {(integration.type === "1c" || integration.type === "1c_enterprise" || integration.type === "1c_accounting") && (
                          <>
                            <Import1CInvoices />
                            <Import1COutgoingInvoices />
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("UI: Відкриваємо форму редагування для інтеграції:", integration);
                            
                            setSelectedIntegration(integration);
                            const initialFormData = {
                              name: integration.name,
                              displayName: integration.displayName,
                              type: integration.type,
                              baseUrl: integration.config.baseUrl || "",
                              clientId: integration.config.clientId || "",
                              clientSecret: integration.config.clientSecret || "",
                              webhookUrl: integration.config.webhookUrl || "",
                              syncInterval: integration.config.syncInterval || 60,
                              syncMethods: integration.config.syncMethods || [],
                            };
                            
                            setFormData(initialFormData);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Налаштування
                        </Button>
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={() => toggleIntegrationStatus(integration)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>URL:</strong> {integration.config.baseUrl || "Не налаштовано"}
                      </div>
                      <div>
                        <strong>Останя синхронізація:</strong>{" "}
                        {integration.config.lastSyncAt
                          ? new Date(integration.config.lastSyncAt).toLocaleString("uk-UA")
                          : "Ніколи"}
                      </div>
                      <div>
                        <strong>Інтервал:</strong> {integration.config.syncInterval || 60} хв
                      </div>
                      <div>
                        <strong>Методи синхронізації:</strong>{" "}
                        {integration.config.syncMethods?.join(", ") || "Не налаштовано"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {integrations.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      Поки що немає налаштованих інтеграцій
                    </p>
                    <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Додати першу інтеграцію
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logsLoading ? (
            <div>Завантаження...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Історія синхронізації</CardTitle>
                <CardDescription>
                  Логи останніх операцій синхронізації з зовнішніми системами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncLogs.map((log: SyncLog) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(log.status)}
                        <div>
                          <p className="font-medium">{log.operation}</p>
                          <p className="text-sm text-muted-foreground">
                            Оброблено: {log.recordsProcessed} • Успішно: {log.recordsSuccessful} • 
                            Помилки: {log.recordsFailed}
                          </p>
                          {log.errorMessage && (
                            <p className="text-sm text-red-500 mt-1">{log.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.startedAt).toLocaleString("uk-UA")}
                      </div>
                    </div>
                  ))}

                  {syncLogs.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Поки що немає логів синхронізації
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Потрібна авторизація</DialogTitle>
            <DialogDescription>
              Для використання 1С інтеграції потрібно увійти в систему
            </DialogDescription>
          </DialogHeader>
          <SimpleLogin onSuccess={() => setShowLoginDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}