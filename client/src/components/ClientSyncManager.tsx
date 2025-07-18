import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, History, Eye, TestTube, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface ClientSyncHistory {
  id: number;
  clientId: number | null;
  external1cId: string;
  syncAction: string;
  syncStatus: string;
  syncDirection: string;
  changeData: any;
  errorMessage: string | null;
  syncedAt: string;
  createdAt: string;
}

interface ClientSyncTestData {
  action: 'create' | 'update' | 'delete';
  clientId: string;
  timestamp: string;
  changeDescription: string;
  clientData: {
    id: string;
    name: string;
    fullName?: string;
    taxCode?: string;
    legalAddress?: string;
    physicalAddress?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
    isCustomer?: boolean;
    isSupplier?: boolean;
    discount?: number;
    notes?: string;
    contactPersons?: Array<{
      fullName: string;
      position?: string;
      phone?: string;
      email?: string;
    }>;
  };
}

export function ClientSyncManager() {
  const [selectedTab, setSelectedTab] = useState("history");
  const [historyFilters, setHistoryFilters] = useState({
    external1cId: "",
    syncStatus: "",
    fromDate: "",
    toDate: "",
  });
  const [testData, setTestData] = useState<ClientSyncTestData>({
    action: 'create',
    clientId: `test-client-${Date.now()}`,
    timestamp: new Date().toISOString(),
    changeDescription: "Тестова синхронізація клієнта",
    clientData: {
      id: `test-client-${Date.now()}`,
      name: "Тестовий клієнт",
      fullName: "Тестовий клієнт ТОВ",
      taxCode: "12345678",
      legalAddress: "вул. Тестова, 1, Київ",
      physicalAddress: "вул. Тестова, 1, Київ",
      phone: "+380123456789",
      email: "test@example.com",
      isActive: true,
      isCustomer: true,
      isSupplier: false,
      discount: 0,
      notes: "Тестовий клієнт для перевірки синхронізації",
      contactPersons: [
        {
          fullName: "Тестова Контактна Особа",
          position: "Менеджер",
          phone: "+380123456789",
          email: "contact@example.com"
        }
      ]
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Завантаження історії синхронізації
  const { data: syncHistory, isLoading: isLoadingHistory } = useQuery<ClientSyncHistory[]>({
    queryKey: ['/api/1c/clients/sync-history', historyFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (historyFilters.external1cId) params.append('external1cId', historyFilters.external1cId);
      if (historyFilters.syncStatus) params.append('syncStatus', historyFilters.syncStatus);
      if (historyFilters.fromDate) params.append('fromDate', historyFilters.fromDate);
      if (historyFilters.toDate) params.append('toDate', historyFilters.toDate);
      
      const response = await fetch(`/api/1c/clients/sync-history?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sync history');
      }
      return response.json();
    },
  });

  // Тестування webhook синхронізації
  const testSyncMutation = useMutation({
    mutationFn: async (data: ClientSyncTestData) => {
      return await apiRequest('/api/1c/clients/sync', 'POST', data);
    },
    onSuccess: (result) => {
      toast({
        title: "Тест синхронізації",
        description: result.success ? result.message : "Помилка тестування",
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/1c/clients/sync-history'] });
    },
    onError: (error) => {
      toast({
        title: "Помилка тестування",
        description: error instanceof Error ? error.message : "Невідома помилка",
        variant: "destructive",
      });
    },
  });

  const handleTestSync = () => {
    testSyncMutation.mutate(testData);
  };

  const handleFilterChange = (key: string, value: string) => {
    setHistoryFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Синхронізація клієнтів з 1С</h2>
          <p className="text-muted-foreground">
            Управління синхронізацією клієнтів між 1С та ERP системою
          </p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/1c/clients/sync-history'] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Оновити
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Історія синхронізації
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Тестування
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Eye className="h-4 w-4 mr-2" />
            Налаштування
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Фільтри</CardTitle>
              <CardDescription>
                Налаштуйте фільтри для перегляду історії синхронізації
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="external1cId">ID в 1С</Label>
                  <Input
                    id="external1cId"
                    placeholder="Введіть ID клієнта в 1С"
                    value={historyFilters.external1cId}
                    onChange={(e) => handleFilterChange('external1cId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="syncStatus">Статус</Label>
                  <Select
                    value={historyFilters.syncStatus}
                    onValueChange={(value) => handleFilterChange('syncStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Всі статуси" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі статуси</SelectItem>
                      <SelectItem value="success">Успішно</SelectItem>
                      <SelectItem value="error">Помилка</SelectItem>
                      <SelectItem value="pending">Очікування</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fromDate">Дата з</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={historyFilters.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="toDate">Дата по</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={historyFilters.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Історія синхронізації</CardTitle>
              <CardDescription>
                Записи про синхронізацію клієнтів з 1С
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Завантаження...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>ID в 1С</TableHead>
                      <TableHead>Дія</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Напрямок</TableHead>
                      <TableHead>Деталі</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncHistory?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.syncedAt), "dd.MM.yyyy HH:mm", { locale: uk })}
                        </TableCell>
                        <TableCell className="font-mono">
                          {record.external1cId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.syncAction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.syncStatus)}>
                            {getStatusIcon(record.syncStatus)}
                            <span className="ml-1">
                              {record.syncStatus === 'success' ? 'Успішно' : 
                               record.syncStatus === 'error' ? 'Помилка' : 'Очікування'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {record.syncDirection === 'from_1c' ? 'З 1С' : 'В 1С'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Деталі синхронізації</DialogTitle>
                                <DialogDescription>
                                  Детальна інформація про запис синхронізації
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>ID в ERP</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {record.clientId || 'Не визначено'}
                                  </p>
                                </div>
                                {record.errorMessage && (
                                  <div>
                                    <Label>Помилка</Label>
                                    <p className="text-sm text-red-600">
                                      {record.errorMessage}
                                    </p>
                                  </div>
                                )}
                                {record.changeData && (
                                  <div>
                                    <Label>Дані клієнта</Label>
                                    <pre className="text-xs bg-muted p-2 rounded-md mt-1 overflow-auto">
                                      {JSON.stringify(record.changeData, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Тестування webhook синхронізації</CardTitle>
              <CardDescription>
                Надішліть тестові дані для перевірки роботи синхронізації
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testAction">Дія</Label>
                  <Select
                    value={testData.action}
                    onValueChange={(value: 'create' | 'update' | 'delete') => 
                      setTestData(prev => ({ ...prev, action: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Створити</SelectItem>
                      <SelectItem value="update">Оновити</SelectItem>
                      <SelectItem value="delete">Видалити</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="testClientId">ID клієнта</Label>
                  <Input
                    id="testClientId"
                    value={testData.clientId}
                    onChange={(e) => 
                      setTestData(prev => ({ ...prev, clientId: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="testName">Назва клієнта</Label>
                  <Input
                    id="testName"
                    value={testData.clientData.name}
                    onChange={(e) => 
                      setTestData(prev => ({ 
                        ...prev, 
                        clientData: { ...prev.clientData, name: e.target.value }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="testTaxCode">ЄДРПОУ</Label>
                  <Input
                    id="testTaxCode"
                    value={testData.clientData.taxCode}
                    onChange={(e) => 
                      setTestData(prev => ({ 
                        ...prev, 
                        clientData: { ...prev.clientData, taxCode: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="testDescription">Опис змін</Label>
                <Textarea
                  id="testDescription"
                  value={testData.changeDescription}
                  onChange={(e) => 
                    setTestData(prev => ({ ...prev, changeDescription: e.target.value }))
                  }
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleTestSync}
                  disabled={testSyncMutation.isPending}
                >
                  {testSyncMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Тестування...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Тестувати синхронізацію
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setTestData(prev => ({ 
                    ...prev, 
                    clientId: `test-client-${Date.now()}`,
                    timestamp: new Date().toISOString()
                  }))}
                >
                  Новий тест
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування синхронізації</CardTitle>
              <CardDescription>
                Конфігурація параметрів синхронізації з 1С
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    readOnly
                    value={`${window.location.origin}/api/1c/clients/sync`}
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Використовуйте цю адресу в 1С для налаштування webhook
                  </p>
                </div>
                
                <div>
                  <Label>Формат запиту</Label>
                  <pre className="text-xs bg-muted p-4 rounded-md mt-1 overflow-auto">
{`POST /api/1c/clients/sync
Content-Type: application/json

{
  "action": "create|update|delete",
  "clientId": "uuid-клиента-в-1c",
  "timestamp": "2025-01-18T10:30:00Z",
  "clientData": {
    "id": "uuid-клиента-в-1c",
    "name": "Коротка назва",
    "fullName": "Повна назва",
    "taxCode": "12345678",
    "legalAddress": "Адреса",
    "phone": "+380123456789",
    "email": "client@example.com",
    "isActive": true,
    "isCustomer": true,
    "isSupplier": false
  }
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}