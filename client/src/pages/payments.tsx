import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, RefreshCw, Download, Eye, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/DataTable";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: number;
  orderId: number;
  orderNumber?: string;
  clientName?: string;
  paymentAmount: number;
  paymentDate: string;
  paymentType: string;
  paymentStatus: string;
  correspondent?: string;
  bankAccount?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  invoiceNumber?: string;
  invoiceDate?: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  todayPayments: number;
  todayAmount: number;
  pendingPayments: number;
  confirmedPayments: number;
  bankTransfers: number;
  cardPayments: number;
  cashPayments: number;
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Отримання статистики платежів
  const { data: stats, isLoading: statsLoading } = useQuery<PaymentStats>({
    queryKey: ["/api/payments/stats"],
    refetchInterval: 30000, // Автоматичне оновлення кожні 30 секунд
    refetchIntervalInBackground: true,
  });

  // Отримання списку платежів
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", searchTerm, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      
      return apiRequest(`/api/payments?${params.toString()}`);
    },
    refetchInterval: 30000, // Автоматичне оновлення кожні 30 секунд для синхронізації з банківськими платежами
    refetchIntervalInBackground: true, // Оновлюється навіть коли вкладка неактивна
  });

  // Видалення платежу
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/payments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      toast({ description: "Платіж видалено успішно" });
    },
    onError: () => {
      toast({ description: "Помилка при видаленні платежу", variant: "destructive" });
    },
  });

  // Експорт платежів
  const exportMutation = useMutation({
    mutationFn: () => apiRequest("/api/payments/export"),
    onSuccess: (data) => {
      // Створюємо і скачуємо файл
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ description: "Дані експортовано успішно" });
    },
    onError: () => {
      toast({ description: "Помилка при експорті даних", variant: "destructive" });
    },
  });

  // Мутація для видалення дублікатів платежів
  const removeDuplicatesMutation = useMutation({
    mutationFn: () => apiRequest("/api/payments/remove-duplicates", {
      method: "POST",
    }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
      
      if (response.success) {
        toast({
          title: "Дублікати видалено",
          description: `Успішно видалено ${response.details.totalDeleted} дублікатів платежів`,
        });
      }
    },
    onError: (error: any) => {
      console.error("Error removing duplicates:", error);
      toast({
        title: "Помилка видалення дублікатів",
        description: error.message || "Не вдалося видалити дублікати платежів",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending": return <RefreshCw className="h-4 w-4 text-yellow-600" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge variant="default" className="bg-green-100 text-green-800">Підтверджено</Badge>;
      case "pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Очікує</Badge>;
      case "failed": return <Badge variant="destructive">Помилка</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bank_transfer": return "Банківський переказ";
      case "card_payment": return "Картка";
      case "cash": return "Готівка";
      case "other": return "Інше";
      default: return type;
    }
  };

  // Дані фільтруються на backend, тому використовуємо їх напряму
  const filteredPayments = payments || [];

  const columns = [
    {
      key: "id",
      label: "№",
      width: 60,
      render: (value: any, row: any) => (
        <div className="font-medium">#{value}</div>
      ),
    },
    {
      key: "orderNumber",
      label: "Замовлення",
      width: 120,
      render: (value: any, row: any) => {
        // Перевіряємо чи створювався платіж протягом останніх 2 хвилин
        const isRecentPayment = row.createdAt && 
          (new Date().getTime() - new Date(row.createdAt).getTime()) < 2 * 60 * 1000;
        
        return (
          <div className="flex items-center gap-2">
            {isRecentPayment && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Новий платіж"></div>
            )}
            <div className="font-medium text-blue-600">
              {value || `ID: ${row.orderId}`}
            </div>
          </div>
        );
      },
    },
    {
      key: "client",
      label: "Клієнт/Кореспондент",
      width: 200,
      render: (value: any, row: any) => (
        <div>
          <div className="font-medium">{row.clientName || "Не вказано"}</div>
          {row.correspondent && (
            <div className="text-sm text-gray-500">{row.correspondent}</div>
          )}
        </div>
      ),
    },
    {
      key: "paymentAmount",
      label: "Сума",
      width: 120,
      render: (value: any, row: any) => {
        const amount = parseFloat(row.paymentAmount || value || "0");
        return (
          <div className="font-semibold text-green-600">
            {amount.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн
          </div>
        );
      },
    },
    {
      key: "invoice",
      label: "Рахунок",
      width: 150,
      render: (value: any, row: any) => (
        <div className="text-sm">
          {row.invoiceNumber && (
            <>
              <div className="font-medium">{row.invoiceNumber}</div>
              {row.invoiceDate && (
                <div className="text-gray-500 text-xs">
                  {new Date(row.invoiceDate).toLocaleDateString('uk-UA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
              )}
            </>
          )}
          {!row.invoiceNumber && <span className="text-gray-400">—</span>}
        </div>
      ),
    },
    {
      key: "paymentType",
      label: "Тип платежу",
      width: 120,
      render: (value: any, row: any) => (
        <Badge variant="outline">{getTypeLabel(value)}</Badge>
      ),
    },
    {
      key: "paymentStatus",
      label: "Статус",
      width: 100,
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(value)}
          {getStatusBadge(value)}
        </div>
      ),
    },
    {
      key: "paymentDate",
      label: "Дата платежу",
      width: 110,
      render: (value: any, row: any) => (
        <div className="text-sm">
          {new Date(value).toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Дії",
      width: 80,
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayment(row)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Деталі платежу #{selectedPayment?.id}</DialogTitle>
                <DialogDescription>
                  Повна інформація про платіж
                </DialogDescription>
              </DialogHeader>
              {selectedPayment && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Замовлення</label>
                    <div className="font-medium">{selectedPayment.orderNumber || `ID: ${selectedPayment.orderId}`}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Сума платежу</label>
                    <div className="font-semibold text-green-600">{(typeof selectedPayment.paymentAmount === 'string' ? parseFloat(selectedPayment.paymentAmount) : selectedPayment.paymentAmount || 0).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} грн</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Тип платежу</label>
                    <div>{getTypeLabel(selectedPayment.paymentType)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Статус</label>
                    <div>{getStatusBadge(selectedPayment.paymentStatus)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Дата платежу</label>
                    <div>{new Date(selectedPayment.paymentDate).toLocaleString('uk-UA')}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Дата створення</label>
                    <div>{new Date(selectedPayment.createdAt).toLocaleString('uk-UA')}</div>
                  </div>
                  {selectedPayment.correspondent && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Кореспондент</label>
                      <div>{selectedPayment.correspondent}</div>
                    </div>
                  )}
                  {selectedPayment.bankAccount && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Банківський рахунок</label>
                      <div className="font-mono text-sm">{selectedPayment.bankAccount}</div>
                    </div>
                  )}
                  {selectedPayment.reference && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Референс</label>
                      <div>{selectedPayment.reference}</div>
                    </div>
                  )}
                  {selectedPayment.notes && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Примітки</label>
                      <div className="text-sm text-gray-600">{selectedPayment.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Підтвердити видалення</AlertDialogTitle>
                <AlertDialogDescription>
                  Ви впевнені, що хочете видалити цей платіж? Цю дію неможливо скасувати.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(row.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Видалити
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Платежі</h1>
          <p className="text-muted-foreground">
            Управління та відстеження платежів за замовленнями
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Видалити дублікати
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Підтвердити видалення дублікатів</AlertDialogTitle>
                <AlertDialogDescription>
                  Ця операція знайде та видалить всі дублікати платежів (однакові замовлення, суми та кореспонденти).
                  Перший платіж з групи дублікатів залишиться, решта будуть видалені.
                  Цю дію неможливо скасувати.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeDuplicatesMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={removeDuplicatesMutation.isPending}
                >
                  {removeDuplicatesMutation.isPending ? "Видаляю..." : "Видалити дублікати"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Автооновлення кожні 30с
          </div>
        </div>
      </div>

      {/* Статистика */}
      {stats && !statsLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всього платежів</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAmount.toLocaleString()} грн
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сьогодні</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayPayments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayAmount.toLocaleString()} грн
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Підтверджені</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Банківські перекази</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bankTransfers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle>Фільтри та пошук</CardTitle>
          <CardDescription>
            Знайдіть потрібні платежі за різними критеріями
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Пошук за номером замовлення, клієнтом, кореспондентом, номером рахунку..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                <SelectItem value="confirmed">Підтверджені</SelectItem>
                <SelectItem value="pending">Очікують</SelectItem>
                <SelectItem value="failed">Помилка</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Тип платежу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі типи</SelectItem>
                <SelectItem value="bank_transfer">Банківський переказ</SelectItem>
                <SelectItem value="card_payment">Картка</SelectItem>
                <SelectItem value="cash">Готівка</SelectItem>
                <SelectItem value="other">Інше</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Експорт..." : "Експорт"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Таблиця платежів */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Список платежів</CardTitle>
              <CardDescription>
                Знайдено {filteredPayments.length} платежів • Автооновлення активне
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/payments"] })}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Оновити
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredPayments} 
            loading={isLoading}
            storageKey="payments"
          />
        </CardContent>
      </Card>
    </div>
  );
}