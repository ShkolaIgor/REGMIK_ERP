import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  FileText, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  User,
  Building,
  CreditCard,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  clientId?: number;
  companyId?: number;
  items?: any[];
}

interface InvoiceWithJoins {
  invoices: {
    id: number;
    clientId: number;
    companyId: number;
    orderId?: number;
    invoiceNumber: string;
    amount: string;
    currency: string;
    status: string;
    issueDate: string;
    dueDate: string;
    paidDate?: string;
    description?: string;
    source: string;
    createdAt: string;
  };
  clients?: {
    id: number;
    name: string;
    taxCode: string;
  } | null;
  companies?: {
    id: number;
    name: string;
    fullName: string;
  } | null;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800"
};

const statusLabels = {
  pending: "Очікує",
  processing: "Обробляється", 
  completed: "Завершено",
  cancelled: "Скасовано",
  draft: "Чернетка",
  sent: "Відправлено",
  paid: "Оплачено",
  overdue: "Прострочено"
};

export default function OrdersInvoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/orders/${orderId}/create-invoice`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Помилка при створенні рахунку");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Рахунок створено успішно",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити рахунок",
        variant: "destructive",
      });
    },
  });

  // Об'єднуємо дані замовлень і рахунків
  const combinedData = [
    ...orders.map((order: Order) => ({
      ...order,
      type: "order",
      number: order.orderNumber,
      amount: order.totalAmount,
      date: order.createdAt,
      clientName: order.customerName,
    })),
    ...invoices.map((invoice: InvoiceWithJoins) => ({
      ...invoice.invoices,
      type: "invoice",
      number: invoice.invoices.invoiceNumber,
      amount: invoice.invoices.amount,
      date: invoice.invoices.createdAt,
      clientName: invoice.clients?.name || "Невідомий клієнт",
      client: invoice.clients,
      company: invoice.companies,
    }))
  ];

  // Фільтрація даних
  const filteredData = combinedData.filter(item => {
    const matchesSearch = 
      item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "orders" && item.type === "order") ||
      (activeTab === "invoices" && item.type === "invoice");
    
    return matchesSearch && matchesTab;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Статистика
  const stats = {
    totalOrders: orders.length,
    totalInvoices: invoices.length,
    totalAmount: combinedData.reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0),
    pendingOrders: orders.filter((o: Order) => o.status === "pending").length,
    paidInvoices: invoices.filter((i: InvoiceWithJoins) => i.invoices.status === "paid").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6" />
                Замовлення та Рахунки
              </h1>
              <p className="text-gray-600 mt-1">
                Управління замовленнями та рахунками в одному місці
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Замовлення</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Рахунки</p>
                  <p className="text-2xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна сума</p>
                  <p className="text-2xl font-bold">
                    {stats.totalAmount.toLocaleString()} ₴
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Очікують</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Оплачено</p>
                  <p className="text-2xl font-bold">{stats.paidInvoices}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Фільтри та пошук */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Пошук за номером або клієнтом..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Всі</TabsTrigger>
                  <TabsTrigger value="orders">Замовлення</TabsTrigger>
                  <TabsTrigger value="invoices">Рахунки</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Таблиця */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Номер</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading || invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Завантаження...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Дані не знайдено
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item: any) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.type === "order" ? (
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-medium">
                            {item.type === "order" ? "Замовлення" : "Рахунок"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{item.number}</TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(item.amount).toLocaleString()} ₴
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status] || "bg-gray-100 text-gray-800"}>
                          {statusLabels[item.status] || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString('uk-UA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {item.type === "order" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => createInvoiceMutation.mutate(item.id)}
                              disabled={createInvoiceMutation.isPending}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Створити рахунок
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Переглянути
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}