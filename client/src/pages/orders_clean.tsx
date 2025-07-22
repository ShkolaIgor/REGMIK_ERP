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
import { DataTable, type DataTableColumn } from "@/components/DataTable";
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

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.correspondent?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.paymentStatus === statusFilter;
    const matchesType = typeFilter === "all" || payment.paymentType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  // Колонки для DataTable з оптимізованими ширинами
  const getPaymentColumns = (): DataTableColumn<Payment>[] => {
    return [
      {
        id: 'orderNumber',
        header: 'Замовлення',
        cell: (payment) => (
          <div className="font-mono text-sm">
            {payment.orderNumber || `#${payment.orderId}`}
          </div>
        ),
        width: 120,
        sortable: true,
      },
      {
        id: 'clientName',
        header: 'Клієнт',
        cell: (payment) => (
          <div className="max-w-[200px]">
            <div className="font-medium text-sm truncate">
              {payment.clientName || 'Клієнт не вказаний'}
            </div>
            {payment.correspondent && (
              <div className="text-xs text-gray-500 truncate">
                {payment.correspondent}
              </div>
            )}
          </div>
        ),
        width: 200,
        sortable: true,
      },
      {
        id: 'paymentAmount',
        header: 'Сума',
        cell: (payment) => (
          <div className="text-right font-medium">
            {new Intl.NumberFormat('uk-UA', {
              style: 'currency',
              currency: 'UAH'
            }).format(payment.paymentAmount)}
          </div>
        ),
        width: 120,
        sortable: true,
      },
      {
        id: 'paymentDate',
        header: 'Дата платежу',
        cell: (payment) => (
          <div className="text-sm">
            {new Date(payment.paymentDate).toLocaleDateString('uk-UA', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </div>
        ),
        width: 110,
        sortable: true,
      },
      {
        id: 'paymentType',
        header: 'Тип',
        cell: (payment) => (
          <Badge variant="secondary" className="text-xs">
            {getTypeLabel(payment.paymentType)}
          </Badge>
        ),
        width: 140,
        sortable: true,
      },
      {
        id: 'paymentStatus',
        header: 'Статус',
        cell: (payment) => (
          <div className="flex items-center gap-2">
            {getStatusIcon(payment.paymentStatus)}
            {getStatusBadge(payment.paymentStatus)}
          </div>
        ),
        width: 130,
        sortable: true,
      },
      {
        id: 'bankAccount',
        header: 'Рахунок',
        cell: (payment) => (
          <div className="font-mono text-xs max-w-[150px] truncate">
            {payment.bankAccount || '-'}
          </div>
        ),
        width: 150,
        sortable: false,
      },
      {
        id: 'createdAt',
        header: 'Створено',
        cell: (payment) => (
          <div className="text-xs text-gray-500">
            {new Date(payment.createdAt).toLocaleDateString('uk-UA', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        ),
        width: 100,
        sortable: true,
      },
      {
        id: 'actions',
        header: 'Дії',
        cell: (payment) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" title="Переглянути деталі">
                  <Eye className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Деталі платежу</DialogTitle>
                  <DialogDescription>
                    Інформація про платіж #{payment.id}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Замовлення:</label>
                    <p className="text-sm text-gray-700">{payment.orderNumber || `#${payment.orderId}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Клієнт:</label>
                    <p className="text-sm text-gray-700">{payment.clientName || 'Не вказано'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Сума платежу:</label>
                    <p className="text-sm text-gray-700 font-medium">
                      {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(payment.paymentAmount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Дата платежу:</label>
                    <p className="text-sm text-gray-700">
                      {new Date(payment.paymentDate).toLocaleString('uk-UA')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Тип платежу:</label>
                    <p className="text-sm text-gray-700">{getTypeLabel(payment.paymentType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Статус:</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(payment.paymentStatus)}
                      {getStatusBadge(payment.paymentStatus)}
                    </div>
                  </div>
                  {payment.correspondent && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Кореспондент:</label>
                      <p className="text-sm text-gray-700">{payment.correspondent}</p>
                    </div>
                  )}
                  {payment.bankAccount && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Банківський рахунок:</label>
                      <p className="text-sm text-gray-700 font-mono">{payment.bankAccount}</p>
                    </div>
                  )}
                  {payment.reference && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Призначення платежу:</label>
                      <p className="text-sm text-gray-700">{payment.reference}</p>
                    </div>
                  )}
                  {payment.notes && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Примітки:</label>
                      <p className="text-sm text-gray-700">{payment.notes}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Створено:</label>
                    <p className="text-sm text-gray-700">
                      {new Date(payment.createdAt).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="Видалити платіж">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити платіж?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ця дія незворотна. Платіж буде видалено назавжди.
                    <br />
                    <strong>Платіж:</strong> {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(payment.paymentAmount)}
                    <br />
                    <strong>Замовлення:</strong> {payment.orderNumber || `#${payment.orderId}`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(payment.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Видалити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        width: 100,
        sortable: false,
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Статистичні картки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього платежів</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalPayments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              на суму {statsLoading ? "..." : (
                new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(stats?.totalAmount || 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сьогодні</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : stats?.todayPayments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              на суму {statsLoading ? "..." : (
                new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(stats?.todayAmount || 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Підтверджено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? "..." : stats?.confirmedPayments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Очікують: {statsLoading ? "..." : stats?.pendingPayments || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">За типами</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Банк:</span>
                <span className="font-medium">{statsLoading ? "..." : stats?.bankTransfers || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Картка:</span>
                <span className="font-medium">{statsLoading ? "..." : stats?.cardPayments || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Готівка:</span>
                <span className="font-medium">{statsLoading ? "..." : stats?.cashPayments || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фільтри та дії */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Список платежів</CardTitle>
              <CardDescription>
                Управління платежами та перегляд історії транзакцій
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                variant="outline"
                size="sm"
              >
                {exportMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Експорт
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Рядок фільтрів */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Пошук за замовленням, клієнтом або кореспондентом..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="confirmed">Підтверджено</SelectItem>
                  <SelectItem value="pending">Очікує</SelectItem>
                  <SelectItem value="failed">Помилка</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  <SelectItem value="bank_transfer">Банк</SelectItem>
                  <SelectItem value="card_payment">Картка</SelectItem>
                  <SelectItem value="cash">Готівка</SelectItem>
                  <SelectItem value="other">Інше</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Таблиця з DataTable */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <DataTable
                data={filteredPayments}
                columns={getPaymentColumns()}
                pageSize={50}
                initialSort={{ field: 'createdAt', direction: 'desc' }}
                className="border rounded-lg"
                emptyMessage="Платежі не знайдено"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
