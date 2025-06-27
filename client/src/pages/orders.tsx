import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  Plus,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Edit,
  CreditCard,
  Truck,
  Edit2,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/DataTable/DataTable";

// Types
interface Order {
  id: number;
  orderNumber: string;
  clientId: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  dueDate?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

// Schema
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Номер замовлення обов'язковий"),
  clientId: z.coerce.number().min(1, "Клієнт обов'язковий"),
  totalAmount: z.coerce.number().min(0, "Сума повинна бути позитивною"),
  status: z.string().min(1, "Статус обов'язковий"),
  orderDate: z.string(),
  dueDate: z.string().optional(),
  deliveryMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

const STATUS_OPTIONS = [
  { value: "новий", label: "Новий" },
  { value: "в_роботі", label: "В роботі" },
  { value: "готовий", label: "Готовий" },
  { value: "відправлений", label: "Відправлений" },
  { value: "доставлений", label: "Доставлений" },
  { value: "скасований", label: "Скасований" },
];

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Form
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      clientId: 0,
      totalAmount: 0,
      status: "новий",
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      deliveryMethod: "",
      deliveryAddress: "",
      notes: "",
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<OrderFormData> }) => {
      return apiRequest(`/api/orders/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsEditDialogOpen(false);
      toast({ title: "Замовлення оновлено", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Помилка оновлення", description: error.message, variant: "destructive" });
    },
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "новий": { color: "bg-blue-100 text-blue-800", icon: FileText },
      "в_роботі": { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      "готовий": { color: "bg-green-100 text-green-800", icon: CheckCircle },
      "відправлений": { color: "bg-purple-100 text-purple-800", icon: Truck },
      "доставлений": { color: "bg-green-100 text-green-800", icon: CheckCircle },
      "скасований": { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["новий"];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {STATUS_OPTIONS.find(opt => opt.value === status)?.label || status}
      </Badge>
    );
  };

  const isOverdue = (order: Order) => {
    if (!order.dueDate) return false;
    const due = new Date(order.dueDate);
    const now = new Date();
    return due < now && order.status !== "доставлений" && order.status !== "скасований";
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || `Клієнт #${clientId}`;
  };

  // Card template for DataTable
  const cardTemplate = (order: Order) => (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue(order) ? 'border-red-300 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600">{getClientName(order.clientId)}</p>
          </div>
          <div className="flex items-center gap-2">
            {isOverdue(order) && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Сума:</span>
            <span className="font-medium">{order.totalAmount.toLocaleString()} ₴</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Статус:</span>
            {getStatusBadge(order.status)}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Дата:</span>
            <span className="text-sm">{format(new Date(order.orderDate), "dd.MM.yyyy")}</span>
          </div>
          
          {order.dueDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Термін:</span>
              <span className={`text-sm ${isOverdue(order) ? 'text-red-600 font-medium' : ''}`}>
                {format(new Date(order.dueDate), "dd.MM.yyyy")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Expandable content for DataTable
  const expandableContent = (order: Order) => (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Швидкі дії */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Швидкі дії</h4>
          <div className="flex flex-col space-y-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                console.log("Оплатити замовлення:", order.id);
                toast({ title: "Функція оплати", description: "Буде реалізована пізніше" });
              }}
              className="flex items-center justify-start"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Оплатити
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                console.log("Відправити замовлення:", order.id);
                toast({ title: "Функція відправки", description: "Буде реалізована пізніше" });
              }}
              className="flex items-center justify-start"
            >
              <Truck className="h-4 w-4 mr-2" />
              Відправити
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                console.log("Змінити статус:", order.id);
                setSelectedOrder(order);
                form.reset({
                  orderNumber: order.orderNumber,
                  clientId: order.clientId,
                  totalAmount: order.totalAmount,
                  status: order.status,
                  orderDate: order.orderDate.split('T')[0],
                  dueDate: order.dueDate ? order.dueDate.split('T')[0] : "",
                  deliveryMethod: order.deliveryMethod || "",
                  deliveryAddress: order.deliveryAddress || "",
                  notes: order.notes || "",
                });
                setIsEditDialogOpen(true);
              }}
              className="flex items-center justify-start"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Змінити статус
            </Button>
          </div>
        </div>

        {/* Деталі доставки */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Доставка</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Метод: {order.deliveryMethod || "Не вказано"}</div>
            <div>Адреса: {order.deliveryAddress || "Не вказана"}</div>
            <div>
              Дата: {order.dueDate ? format(new Date(order.dueDate), "dd MMM yyyy", { locale: uk }) : "Не вказана"}
            </div>
          </div>
        </div>

        {/* Контакти */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Контакти</h4>
          <div className="flex flex-col space-y-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                console.log("Подзвонити клієнту:", order.id);
                toast({ title: "Функція дзвінка", description: "Буде реалізована пізніше" });
              }}
              className="flex items-center justify-start"
            >
              <Phone className="h-4 w-4 mr-1" />
              Дзвінок
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                console.log("Надіслати email:", order.id);
                toast({ title: "Функція email", description: "Буде реалізована пізніше" });
              }}
              className="flex items-center justify-start"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          </div>
        </div>
      </div>
      
      {order.notes && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h5 className="font-medium text-gray-700 mb-1">Примітки:</h5>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );

  // Handle edit
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    form.reset({
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      totalAmount: order.totalAmount,
      status: order.status,
      orderDate: order.orderDate.split('T')[0],
      dueDate: order.dueDate ? order.dueDate.split('T')[0] : "",
      deliveryMethod: order.deliveryMethod || "",
      deliveryAddress: order.deliveryAddress || "",
      notes: order.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: OrderFormData) => {
    if (!selectedOrder) return;
    updateMutation.mutate({ id: selectedOrder.id, data });
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = orders.filter(order => order.status === "доставлений").length;
  const overdueOrders = orders.filter(isOverdue).length;

  const columns = [
    {
      accessorKey: "orderNumber",
      header: "Номер",
      sortable: true,
    },
    {
      accessorKey: "clientId",
      header: "Клієнт",
      cell: (order: Order) => getClientName(order.clientId),
    },
    {
      accessorKey: "totalAmount",
      header: "Сума",
      cell: (order: Order) => `${order.totalAmount.toLocaleString()} ₴`,
      sortable: true,
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: (order: Order) => getStatusBadge(order.status),
    },
    {
      accessorKey: "orderDate",
      header: "Дата замовлення",
      cell: (order: Order) => format(new Date(order.orderDate), "dd.MM.yyyy"),
      sortable: true,
    },
    {
      accessorKey: "dueDate",
      header: "Термін виконання",
      cell: (order: Order) => order.dueDate ? format(new Date(order.dueDate), "dd.MM.yyyy") : "—",
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Замовлення клієнтів</h1>
              <p className="text-gray-600 mt-2">Управління замовленнями та їх статусами</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Нове замовлення
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Всього замовлень</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-xs text-gray-500 mt-1">активних замовлень</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Загальний дохід</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} ₴</div>
              <p className="text-xs text-gray-500 mt-1">за всі замовлення</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Виконано</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{completedOrders}</div>
              <p className="text-xs text-gray-500 mt-1">доставлених замовлень</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Прострочені</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueOrders}</div>
              <p className="text-xs text-gray-500 mt-1">потребують уваги</p>
            </CardContent>
          </Card>
        </div>

        {/* DataTable */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <DataTable
              data={orders}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Пошук замовлень..."
              storageKey="orders-table"
              cardTemplate={cardTemplate}
              expandableContent={expandableContent}
              onRowClick={handleEdit}
              actions={(order: Order) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(order);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редагувати замовлення</DialogTitle>
            <DialogDescription>
              Внесіть зміни до замовлення
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер замовлення</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Клієнт</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть клієнта" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сума</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}