import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import {
  Plus,
  Search,
  Filter,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  ShoppingCart,
  Calendar,
  User,
  Phone,
  MapPin,
  Truck,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  AlertTriangle,
  CreditCard,
  Printer,
  Mail,
  Edit2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/DataTable/DataTable";

// Schema definitions
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Номер замовлення обов'язковий"),
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  totalAmount: z.string().min(1, "Сума обов'язкова"),
  status: z.string().min(1, "Статус обов'язковий"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// Type definitions
type Order = {
  id: number;
  orderSequenceNumber: number;
  orderNumber: string;
  clientName?: string;
  clientTaxCode?: string;
  contactName?: string;
  clientId: number;
  clientContactsId: number | null;
  statusId: number | null;
  status: string;
  totalAmount: string;
  notes: string | null;
  paymentDate: Date | null;
  paymentType: string | null;
  paidAmount: string | null;
  contractNumber: string | null;
  productionApproved: boolean | null;
  productionApprovedBy: string | null;
  productionApprovedAt: Date | null;
  dueDate: Date | null;
  shippedDate: Date | null;
  createdAt: Date | null;
  items?: OrderItem[];
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  product?: {
    name: string;
    sku: string;
  };
};

type OrderStatus = {
  id: number;
  name: string;
  textColor: string;
  backgroundColor: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

// Ukrainian Date helper
class UkrainianDate {
  constructor(private date: Date) {}

  toLocaleDateString(): string {
    return format(this.date, "dd.MM.yyyy", { locale: uk });
  }
}

// Currency formatter
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 2,
  }).format(num);
};

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      clientId: "",
      totalAmount: "",
      status: "",
      notes: "",
    },
  });

  // Data fetching
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: orderStatuses } = useQuery({
    queryKey: ["/api/order-statuses"],
  });

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Safely extract data with proper typing
  const orders = (ordersData as any)?.orders || [];
  const totalOrders = (ordersData as any)?.total || 0;
  const clients = (clientsData as any)?.clients || [];
  const orderStatusesList = (orderStatuses as OrderStatus[]) || [];

  // Calculate statistics
  const totalRevenue = orders.reduce((sum: number, order: Order) => {
    return sum + parseFloat(order.totalAmount || '0');
  }, 0);

  const pendingOrders = orders.filter((order: Order) => 
    order.status === 'Очікує обробки' || order.status === 'В обробці'
  ).length;

  const completedOrders = orders.filter((order: Order) => 
    order.status === 'Виконано' || order.status === 'Відвантажено'
  ).length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      return apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення створено успішно",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити замовлення",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: OrderFormData }) => {
      return apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення оновлено успішно",
      });
      setIsDialogOpen(false);
      setEditingOrder(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити замовлення",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/orders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити замовлення",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleCreate = () => {
    setEditingOrder(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    form.reset({
      orderNumber: order.orderNumber,
      clientId: order.clientId.toString(),
      totalAmount: order.totalAmount,
      status: order.status,
      notes: order.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити це замовлення?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const handleSubmit = (data: OrderFormData) => {
    if (editingOrder) {
      updateOrderMutation.mutate({ id: editingOrder.id, data });
    } else {
      createOrderMutation.mutate(data);
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: "orderNumber",
      label: "Номер замовлення",
      sortable: true,
      render: (value: string, row: Order) => {
        const isOverdue = isOrderOverdue(row);
        return (
          <div className={`flex items-center space-x-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            <span>{value}</span>
            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: "clientName",
      label: "Клієнт",
      sortable: true,
    },
    {
      key: "status",
      label: "Статус",
      sortable: true,
      render: (value: string) => {
        const status = orderStatusesList?.find((s: OrderStatus) => s.name === value);
        return (
          <Badge 
            style={{
              backgroundColor: status?.backgroundColor || '#e5e7eb',
              color: status?.textColor || '#374151'
            }}
          >
            {value}
          </Badge>
        );
      },
    },
    {
      key: "totalAmount",
      label: "Сума",
      sortable: true,
      render: (value: string) => formatCurrency(value),
    },
    {
      key: "createdAt",
      label: "Дата створення",
      sortable: true,
      render: (value: Date) => value ? new UkrainianDate(value).toLocaleDateString() : '-',
    },
  ];

  // Check if order is overdue
  const isOrderOverdue = (order: Order) => {
    if (!order.dueDate) return false;
    const dueDate = new Date(order.dueDate);
    const today = new Date();
    return dueDate < today && order.status !== 'delivered' && order.status !== 'completed';
  };

  // Card template for mobile view with overdue highlighting
  const cardTemplate = (order: Order) => {
    const isOverdue = isOrderOverdue(order);
    
    return (
      <div className={`p-4 space-y-3 ${isOverdue ? 'bg-red-50 border-red-200' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Прострочено
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{order.clientName}</p>
          </div>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Badge 
            style={{
              backgroundColor: orderStatusesList?.find((s: OrderStatus) => s.name === order.status)?.backgroundColor || '#e5e7eb',
              color: orderStatusesList?.find((s: OrderStatus) => s.name === order.status)?.textColor || '#374151'
            }}
          >
            {order.status}
          </Badge>
          <span className="font-bold text-lg">{formatCurrency(order.totalAmount)}</span>
        </div>
        
        <div className="text-xs text-gray-500 flex justify-between">
          <span>{order.createdAt ? new UkrainianDate(order.createdAt).toLocaleDateString() : 'Дата невідома'}</span>
          {order.dueDate && (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              До: {new UkrainianDate(order.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Expandable content for order items with payment/delivery buttons
  const expandableContent = (order: Order) => (
    <div className="p-4 bg-gray-50 border-t">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-3">Склад замовлення:</h4>
          {order.items && order.items.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="bg-white rounded border p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium">{item.product?.name || 'Товар не знайдено'}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.product?.sku})</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span>Кіл.: {item.quantity}</span>
                      <span>Ціна: {formatCurrency(item.unitPrice)}</span>
                      <span className="font-medium">Σ: {formatCurrency(item.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Замовлення не містить товарів</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h4 className="font-medium mb-3">Дії з замовленням:</h4>
          
          {/* Payment Buttons */}
          <div className="bg-white rounded border p-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Оплата</h5>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                <CreditCard className="h-4 w-4 mr-1" />
                Готівка
              </Button>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <CreditCard className="h-4 w-4 mr-1" />
                Картка
              </Button>
              <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                <CreditCard className="h-4 w-4 mr-1" />
                Переказ
              </Button>
            </div>
          </div>

          {/* Delivery Buttons */}
          <div className="bg-white rounded border p-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Доставка</h5>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                <Truck className="h-4 w-4 mr-1" />
                Нова Пошта
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Truck className="h-4 w-4 mr-1" />
                Укр Пошта
              </Button>
              <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                <MapPin className="h-4 w-4 mr-1" />
                Самовивіз
              </Button>
            </div>
          </div>

          {/* Status Change */}
          <div className="bg-white rounded border p-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Змінити статус</h5>
            <div className="flex flex-wrap gap-2">
              {orderStatusesList?.map((status: OrderStatus) => (
                <Button 
                  key={status.id} 
                  size="sm" 
                  variant="outline"
                  style={{
                    borderColor: status.backgroundColor,
                    color: status.backgroundColor
                  }}
                  className="hover:opacity-80"
                  onClick={() => {
                    console.log(`Changing status to ${status.name} for order ${order.id}`);
                  }}
                >
                  {status.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional Actions */}
          <div className="bg-white rounded border p-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Додаткові дії</h5>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                <FileText className="h-4 w-4 mr-1" />
                Рахунок
              </Button>
              <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                <Printer className="h-4 w-4 mr-1" />
                Друк
              </Button>
              <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Нове замовлення
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Всього замовлень</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-blue-100">Загальна кількість</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Загальний дохід</CardTitle>
              <DollarSign className="h-4 w-4 text-green-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-green-100">Сума всіх замовлень</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">В обробці</CardTitle>
              <Clock className="h-4 w-4 text-yellow-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-yellow-100">Очікують обробки</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Середній чек</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-100" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
              <p className="text-xs text-purple-100">На одне замовлення</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Список замовлень</span>
            </CardTitle>
            <CardDescription>Перегляд та управління всіма замовленнями</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={orders}
              columns={columns}
              searchPlaceholder="Пошук замовлень..."
              onRowClick={handleView}
              cardTemplate={cardTemplate}
              expandableContent={expandableContent}
              actions={(row: Order) => (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(row);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(row);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              storageKey="orders-table"
              loading={ordersLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? "Редагувати замовлення" : "Створити нове замовлення"}
            </DialogTitle>
            <DialogDescription>
              {editingOrder ? "Внесіть зміни до замовлення" : "Заповніть форму для створення нового замовлення"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Номер замовлення</label>
                <Input
                  {...form.register("orderNumber")}
                  placeholder="ORD-001"
                />
                {form.formState.errors.orderNumber && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.orderNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Клієнт</label>
                <Select
                  value={form.watch("clientId")}
                  onValueChange={(value) => form.setValue("clientId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть клієнта" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.clientId && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.clientId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Загальна сума</label>
                <Input
                  {...form.register("totalAmount")}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                {form.formState.errors.totalAmount && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.totalAmount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Статус</label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatusesList?.map((status: OrderStatus) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Примітки</label>
              <textarea
                {...form.register("notes")}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                placeholder="Додаткові примітки до замовлення..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
              >
                {createOrderMutation.isPending || updateOrderMutation.isPending
                  ? "Збереження..."
                  : editingOrder
                  ? "Оновити"
                  : "Створити"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі замовлення</DialogTitle>
            <DialogDescription>
              Повна інформація про замовлення {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Основна інформація</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Номер:</span>
                      <span className="font-medium">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Клієнт:</span>
                      <span className="font-medium">{selectedOrder.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Статус:</span>
                      <Badge 
                        style={{
                          backgroundColor: orderStatusesList?.find((s: OrderStatus) => s.name === selectedOrder.status)?.backgroundColor || '#e5e7eb',
                          color: orderStatusesList?.find((s: OrderStatus) => s.name === selectedOrder.status)?.textColor || '#374151'
                        }}
                      >
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Загальна сума:</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Дати</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Створено:</span>
                      <span>{selectedOrder.createdAt ? new UkrainianDate(selectedOrder.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Термін виконання:</span>
                      <span>{selectedOrder.dueDate ? new UkrainianDate(selectedOrder.dueDate).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Відвантажено:</span>
                      <span>{selectedOrder.shippedDate ? new UkrainianDate(selectedOrder.shippedDate).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Примітки</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              {expandableContent(selectedOrder)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}