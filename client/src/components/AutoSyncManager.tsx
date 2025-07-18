import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  FileText, 
  Receipt 
} from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface AutoSyncSettings {
  id: number;
  syncType: string;
  isEnabled: boolean;
  webhookUrl: string | null;
  syncFrequency: number;
  lastSyncAt: string | null;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SyncTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export function AutoSyncManager() {
  const [selectedSyncType, setSelectedSyncType] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [syncFrequency, setSyncFrequency] = useState(300);
  const [testResults, setTestResults] = useState<Record<string, SyncTestResult>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Отримання налаштувань синхронізації
  const { data: syncSettings = [], isLoading } = useQuery({
    queryKey: ['/api/auto-sync/settings'],
  });

  // Мутація для оновлення налаштувань
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { syncType: string; isEnabled: boolean; webhookUrl?: string; syncFrequency?: number }) => {
      return apiRequest(`/api/auto-sync/settings/${data.syncType}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-sync/settings'] });
      toast({
        title: "Налаштування оновлено",
        description: "Налаштування автоматичної синхронізації збережено",
      });
      setIsSettingsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося оновити налаштування",
        variant: "destructive",
      });
    },
  });

  // Мутація для тестування синхронізації
  const testSyncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      return apiRequest(`/api/auto-sync/test/${syncType}`, {
        method: 'POST',
      });
    },
    onSuccess: (data, syncType) => {
      setTestResults(prev => ({
        ...prev,
        [syncType]: data
      }));
      toast({
        title: "Тест завершено",
        description: data.success ? "Синхронізація працює" : "Виявлено помилки",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error, syncType) => {
      setTestResults(prev => ({
        ...prev,
        [syncType]: {
          success: false,
          message: error instanceof Error ? error.message : "Помилка тестування"
        }
      }));
      toast({
        title: "Помилка тестування",
        description: "Не вдалося протестувати синхронізацію",
        variant: "destructive",
      });
    },
  });

  // Мутація для запуску синхронізації вручну
  const runSyncMutation = useMutation({
    mutationFn: async (syncType: string) => {
      return apiRequest(`/api/auto-sync/run/${syncType}`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auto-sync/settings'] });
      toast({
        title: "Синхронізація запущена",
        description: data.message || "Синхронізація виконана успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка синхронізації",
        description: error instanceof Error ? error.message : "Не вдалося запустити синхронізацію",
        variant: "destructive",
      });
    },
  });

  const getSyncTypeIcon = (syncType: string) => {
    switch (syncType) {
      case 'clients':
        return <Users className="h-4 w-4" />;
      case 'invoices':
        return <FileText className="h-4 w-4" />;
      case 'outgoing_invoices':
        return <Receipt className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  const getSyncTypeName = (syncType: string) => {
    switch (syncType) {
      case 'clients':
        return 'Клієнти';
      case 'invoices':
        return 'Вхідні накладні';
      case 'outgoing_invoices':
        return 'Вихідні рахунки';
      default:
        return syncType;
    }
  };

  const getStatusBadge = (setting: AutoSyncSettings) => {
    if (!setting.isEnabled) {
      return <Badge variant="secondary">Вимкнено</Badge>;
    }
    
    if (setting.errorCount > 0) {
      return <Badge variant="destructive">Помилки ({setting.errorCount})</Badge>;
    }
    
    if (setting.lastSyncAt) {
      return <Badge variant="default">Активна</Badge>;
    }
    
    return <Badge variant="outline">Очікує</Badge>;
  };

  const openSettings = (syncType: string) => {
    const setting = syncSettings.find((s: AutoSyncSettings) => s.syncType === syncType);
    setSelectedSyncType(syncType);
    setWebhookUrl(setting?.webhookUrl || "");
    setSyncFrequency(setting?.syncFrequency || 300);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    updateSettingsMutation.mutate({
      syncType: selectedSyncType,
      isEnabled: true,
      webhookUrl,
      syncFrequency,
    });
  };

  const toggleSync = (syncType: string, isEnabled: boolean) => {
    updateSettingsMutation.mutate({
      syncType,
      isEnabled,
    });
  };

  const testSync = (syncType: string) => {
    testSyncMutation.mutate(syncType);
  };

  const runSync = (syncType: string) => {
    runSyncMutation.mutate(syncType);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Автоматична синхронізація з 1С</h2>
          <p className="text-muted-foreground">
            Налаштування автоматичної синхронізації клієнтів, накладних та рахунків
          </p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/auto-sync/settings'] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Оновити
        </Button>
      </div>

      <div className="grid gap-4">
        {['clients', 'invoices', 'outgoing_invoices'].map((syncType) => {
          const setting = syncSettings.find((s: AutoSyncSettings) => s.syncType === syncType);
          const testResult = testResults[syncType];
          
          return (
            <Card key={syncType}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSyncTypeIcon(syncType)}
                    <div>
                      <CardTitle className="text-lg">{getSyncTypeName(syncType)}</CardTitle>
                      <CardDescription>
                        {syncType === 'clients' && 'Синхронізація даних клієнтів при створенні або зміні'}
                        {syncType === 'invoices' && 'Синхронізація вхідних накладних від постачальників'}
                        {syncType === 'outgoing_invoices' && 'Синхронізація вихідних рахунків клієнтам'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(setting)}
                    <Switch
                      checked={setting?.isEnabled || false}
                      onCheckedChange={(checked) => toggleSync(syncType, checked)}
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Остання синхронізація</div>
                      <div className="font-medium">
                        {setting?.lastSyncAt 
                          ? format(new Date(setting.lastSyncAt), 'dd.MM.yyyy HH:mm', { locale: uk })
                          : 'Ніколи'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Частота синхронізації</div>
                      <div className="font-medium">
                        {setting?.syncFrequency 
                          ? `${Math.floor(setting.syncFrequency / 60)} хв`
                          : 'Не налаштовано'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Webhook URL</div>
                      <div className="font-medium">
                        {setting?.webhookUrl ? 'Налаштовано' : 'Не налаштовано'}
                      </div>
                    </div>
                  </div>

                  {setting?.lastError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Остання помилка:</span>
                      </div>
                      <p className="text-sm text-destructive/80 mt-1">{setting.lastError}</p>
                    </div>
                  )}

                  {testResult && (
                    <div className={`p-3 rounded-md border ${
                      testResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">Результат тестування:</span>
                      </div>
                      <p className="text-sm mt-1">{testResult.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openSettings(syncType)}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Налаштування
                    </Button>
                    <Button
                      onClick={() => testSync(syncType)}
                      variant="outline"
                      size="sm"
                      disabled={testSyncMutation.isPending || !setting?.isEnabled}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Тестувати
                    </Button>
                    <Button
                      onClick={() => runSync(syncType)}
                      variant="outline"
                      size="sm"
                      disabled={runSyncMutation.isPending || !setting?.isEnabled}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Запустити
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Налаштування синхронізації: {getSyncTypeName(selectedSyncType)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://your-1c-server.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                URL для отримання webhook повідомлень з 1С
              </p>
            </div>

            <div>
              <Label htmlFor="syncFrequency">Частота синхронізації (секунди)</Label>
              <Input
                id="syncFrequency"
                type="number"
                min="60"
                max="3600"
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(parseInt(e.target.value) || 300)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Мінімум 60 секунд, максимум 3600 секунд (1 година)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Скасувати
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Зберегти
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}