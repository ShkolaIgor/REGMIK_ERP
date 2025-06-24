import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, DataTableColumn } from "@/components/DataTable";
// import { PaymentDialog } from "@/components/payment-dialog"; // Temporarily disabled
import { UkrainianDate } from "@/components/ukrainian-date";
// import { InlineSerialNumbers } from "@/components/inline-serial-numbers"; // Temporarily disabled
import { 
  Plus, 
  Edit, 
  Truck, 
  X, 
  FileText, 
  Settings, 
  Calendar, 
  Package
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define types
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
  client?: any;
  contact?: any;
  items?: any[];
};

type OrderStatus = {
  id: number;
  name: string;
  textColor: string;
  backgroundColor: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: string;
  unitPrice: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  barcode: string | null;
  categoryId: number | null;
  costPrice: string;
  retailPrice: string;
  photo: string | null;
  productType: string;
  unit: string;
  minStock: number | null;
  maxStock: number | null;
  createdAt: Date | null;
};

type Company = {
  id: number;
  name: string;
  fullName: string | null;
  taxCode: string;
  isDefault: boolean | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

// Form schemas
const orderSchema = z.object({
  orderNumber: z.string().min(1, "Номер замовлення обов'язковий"),
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  clientContactsId: z.string().optional(),
  statusId: z.string().optional(),
  totalAmount: z.string().min(1, "Сума обов'язкова"),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
  paymentType: z.string().optional(),
  paidAmount: z.string().optional(),
  contractNumber: z.string().optional(),
  productionApproved: z.boolean().optional(),
  dueDate: z.string().optional(),
  companyId: z.string().min(1, "Компанія обов'язкова"),
});

const orderItemSchema = z.object({
  productId: z.string().min(1, "Продукт обов'язковий"),
  quantity: z.string().min(1, "Кількість обов'язкова"),
  unitPrice: z.string().min(1, "Ціна обов'язкова"),
});

const statusSchema = z.object({
  name: z.string().min(1, "Назва статусу обов'язкова"),
  textColor: z.string().min(1, "Колір тексту обов'язковий"),
  backgroundColor: z.string().min(1, "Колір фону обов'язковий"),
});

type OrderFormData = z.infer<typeof orderSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;
type StatusFormData = z.infer<typeof statusSchema>;

// Utility functions
const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

const isOrderOverdue = (order: Order): boolean => {
  if (!order.dueDate || order.shippedDate) return false;
  return new Date(order.dueDate) < new Date();
};

export default function Orders() {
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isStatusSettingsOpen, setIsStatusSettingsOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // DataTable columns
  const columns: DataTableColumn[] = [
    {
      key: 'orderNumber',
      label: 'Номер замовлення',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="font-semibold text-center text-lg p-2 rounded">
          {isOrderOverdue(row) && <div className="text-xs text-red-600 font-bold mb-1">ПРОСТРОЧЕНО</div>}
          {row.orderNumber || row.orderSequenceNumber}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Клієнт',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{row.client?.name || row.clientName || 'Невідомий клієнт'}</div>
          {row.client?.taxCode && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block">
              {row.client.taxCode}
            </div>
          )}
          {row.contact && (
            <div className="text-xs text-gray-600">
              👤 {row.contact.fullName}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Сума',
      sortable: true,
      render: (value) => <div className="font-medium">{formatCurrency(parseFloat(value))}</div>
    },
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const statusInfo = orderStatuses?.find((s: any) => s.id === row.statusId);
        return statusInfo ? (
          <Badge 
            style={{ 
              color: statusInfo.textColor, 
              backgroundColor: statusInfo.backgroundColor 
            }}
          >
            {statusInfo.name}
          </Badge>
        ) : (
          <Badge variant="secondary">{value}</Badge>
        );
      }
    },
    {
      key: 'paymentDate',
      label: 'Оплата',
      sortable: true,
      render: (value, row) => {
        if (!row.paymentDate) {
          return (
            <Button variant="outline" size="sm">
              💳 Оплатити
            </Button>
          );
        }
        return (
          <div className="space-y-1">
            <Badge className="bg-green-100 text-green-800 border-green-300">
              ✅ Оплачено
            </Badge>
            <div className="text-xs text-green-700 font-medium">
              📅 <UkrainianDate date={row.paymentDate} format="short" />
            </div>
          </div>
        );
      }
    },
    {
      key: 'dueDate',
      label: 'Термін виконання',
      sortable: true,
      render: (value) => value ? <UkrainianDate date={value} format="short" /> : '—'
    },
    {
      key: 'shippedDate',
      label: 'Відвантаження',
      sortable: true,
      render: (value) => value ? <UkrainianDate date={value} format="short" /> : '—'
    },
    {
      key: 'createdAt',
      label: 'Дата створення',
      sortable: true,
      render: (value) => value ? <UkrainianDate date={value} format="short" /> : '—'
    }
  ];

  // Data fetching
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders', searchTerm],
    select: (data: any) => data.orders || []
  });

  const { data: orderStatuses = [] } = useQuery({
    queryKey: ['/api/order-statuses']
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products']
  });

  const { data: clientsResponse = { clients: [] } } = useQuery({
    queryKey: ['/api/clients/search']
  });
  const clients = clientsResponse.clients || [];

  const { data: clientContacts = [] } = useQuery({
    queryKey: ['/api/client-contacts']
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies']
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      return apiRequest('/api/orders', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsDialogOpen(false);
      toast({
        title: "Успішно",
        description: "Замовлення створено",
      });
    },
    onError: (error) => {
      console.error('Помилка створення замовлення:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити замовлення",
        variant: "destructive",
      });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: OrderFormData }) => {
      return apiRequest(`/api/orders/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsDialogOpen(false);
      setEditingOrder(null);
      toast({
        title: "Успішно",
        description: "Замовлення оновлено",
      });
    },
    onError: (error) => {
      console.error('Помилка оновлення замовлення:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити замовлення",
        variant: "destructive",
      });
    }
  });

  const createStatusMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      return apiRequest('/api/order-statuses', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-statuses'] });
      setIsStatusDialogOpen(false);
      toast({
        title: "Успішно",
        description: "Статус створено",
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StatusFormData }) => {
      return apiRequest(`/api/order-statuses/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/order-statuses'] });
      setIsStatusDialogOpen(false);
      setEditingStatus(null);
      toast({
        title: "Успішно",
        description: "Статус оновлено",
      });
    }
  });

  // Event handlers
  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleShipOrder = (order: Order) => {
    // Implementation for shipping order
    console.log('Shipping order:', order);
  };

  const handleEditStatus = (status: OrderStatus) => {
    setEditingStatus(status);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSubmit = (data: StatusFormData) => {
    if (editingStatus) {
      updateStatusMutation.mutate({ id: editingStatus.id, data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  const handleSubmit = (data: OrderFormData) => {
    if (editingOrder) {
      updateOrderMutation.mutate({ id: editingOrder.id, data });
    } else {
      createOrderMutation.mutate(data);
    }
  };

  // Form setup
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderNumber: "",
      clientId: "",
      clientContactsId: "",
      statusId: "",
      totalAmount: "",
      notes: "",
      paymentDate: "",
      paymentType: "",
      paidAmount: "",
      contractNumber: "",
      productionApproved: false,
      dueDate: "",
      companyId: companies.find((c: Company) => c.isDefault === true)?.id.toString() || "",
    }
  });

  // Update form when editing
  useEffect(() => {
    if (editingOrder) {
      const defaultCompany = companies.find((c: Company) => c.isDefault);
      form.reset({
        orderNumber: editingOrder.orderNumber || "",
        clientId: editingOrder.clientId?.toString() || "",
        clientContactsId: editingOrder.clientContactsId?.toString() || "",
        statusId: editingOrder.statusId?.toString() || "",
        totalAmount: editingOrder.totalAmount || "",
        notes: editingOrder.notes || "",
        paymentDate: editingOrder.paymentDate ? new Date(editingOrder.paymentDate).toISOString().split('T')[0] : "",
        paymentType: editingOrder.paymentType || "",
        paidAmount: editingOrder.paidAmount || "",
        contractNumber: editingOrder.contractNumber || "",
        productionApproved: editingOrder.productionApproved || false,
        dueDate: editingOrder.dueDate ? new Date(editingOrder.dueDate).toISOString().split('T')[0] : "",
        companyId: defaultCompany?.id.toString() || "",
      });
    } else {
      const defaultCompany = companies.find((c: Company) => c.isDefault);
      form.reset({
        orderNumber: "",
        clientId: "",
        clientContactsId: "",
        statusId: "",
        totalAmount: "",
        notes: "",
        paymentDate: "",
        paymentType: "",
        paidAmount: "",
        contractNumber: "",
        productionApproved: false,
        dueDate: "",
        companyId: defaultCompany?.id.toString() || "",
      });
    }
  }, [editingOrder, companies, form]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Замовлення</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setIsStatusSettingsOpen(!isStatusSettingsOpen)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Статуси
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Додати замовлення
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border">
        {isStatusSettingsOpen ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Налаштування статусів</h3>
              <Button 
                variant="outline" 
                onClick={() => setIsStatusSettingsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Закрити
              </Button>
            </div>
            {/* Status management UI would go here */}
          </div>
        ) : (
          <DataTable
            data={orders}
            columns={columns}
            loading={isLoading}
            searchable={true}
            onSearch={(query) => setSearchTerm(query)}
            actions={(row) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}
                  title="Редагувати"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShipOrder(row);
                  }}
                  title="Відвантажити"
                >
                  <Truck className="h-4 w-4" />
                </Button>
              </div>
            )}
            title="Замовлення"
            storageKey="orders-table"
          />
        )}
      </div>

      {/* Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? "Редагувати замовлення" : "Додати замовлення"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер замовлення</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Введіть номер замовлення" />
                      </FormControl>
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
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клієнт</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть клієнта" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть статус" />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((status: OrderStatus) => (
                              <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примітки</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Введіть примітки" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingOrder(null);
                  }}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                >
                  {editingOrder ? "Оновити" : "Створити"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}