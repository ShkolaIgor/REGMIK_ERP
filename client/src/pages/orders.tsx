import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Eye, Edit, Trash2, ShoppingCart, Truck, Package, FileText, Check, ChevronsUpDown, GripVertical, ChevronUp, ChevronDown, Search, Filter, X, Settings, Palette } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PartialShipmentDialog } from "@/components/PartialShipmentDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientForm } from "@/components/ClientForm";
import { PaymentDateButton } from "@/components/PaymentDateButton";
import DueDateButton from "@/components/DueDateButton";
import { useSorting } from "@/hooks/useSorting";
// Типи
type Order = {
  id: number;
  orderSequenceNumber: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  clientId: string | null;
  status: string;
  totalAmount: string;
  notes: string | null;
  paymentDate: Date | null;
  dueDate: Date | null;
  shippedDate: Date | null;
  createdAt: Date | null;
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

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};

// Схеми валідації
const orderItemSchema = z.object({
  productId: z.number().min(1, "Оберіть товар"),
  quantity: z.string().min(1, "Введіть кількість"),
  unitPrice: z.string().min(1, "Введіть ціну"),
});

const orderSchema = z.object({
  clientId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email("Введіть правильний email").optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  status: z.string().default("pending"),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  shippedDate: z.string().optional(),
}).refine(data => data.clientId || data.customerName, {
  message: "Оберіть клієнта або введіть ім'я клієнта",
  path: ["clientId"],
});

const statusSchema = z.object({
  name: z.string().min(1, "Введіть назву статусу"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Введіть правильний HEX колір"),
});

type OrderFormData = z.infer<typeof orderSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;
type StatusFormData = z.infer<typeof statusSchema>;

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [orderItems, setOrderItems] = useState<OrderItemFormData[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isPartialShipmentOpen, setIsPartialShipmentOpen] = useState(false);
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isStatusSettingsOpen, setIsStatusSettingsOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<OrderStatus | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  // Стан для керування порядком стовпців
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('orders-column-order');
    return saved ? JSON.parse(saved) : [
      'orderSequenceNumber',
      'orderNumber', 
      'customerName',
      'paymentDate',
      'dueDate',
      'totalAmount',
      'status',
      'actions'
    ];
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Функція обробки перетягування стовпців
  const handleColumnDragEnd = (result: any) => {
    if (!result.destination) return;

    const newColumnOrder = Array.from(columnOrder);
    const [reorderedItem] = newColumnOrder.splice(result.source.index, 1);
    newColumnOrder.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(newColumnOrder);
    localStorage.setItem('orders-column-order', JSON.stringify(newColumnOrder));
  };

  // Мапа назв стовпців
  const columnLabels = {
    orderSequenceNumber: 'Замовлення',
    orderNumber: 'Рахунок',
    customerName: 'Клієнт',
    paymentDate: 'Дата оплати',
    dueDate: 'Термін виконання',
    totalAmount: 'Сума',
    status: 'Статус',
    actions: 'Дії'
  };

  // Функція рендерингу контенту стовпця
  const renderColumnContent = (columnKey: string, order: any) => {
    switch (columnKey) {
      case 'orderSequenceNumber':
        return (
          <div className={`font-semibold text-center text-lg p-2 rounded ${getOrderNumberBgColor(order)}`}>
            {order.orderSequenceNumber}
          </div>
        );
      
      case 'orderNumber':
        return (
          <div>
            <div className="font-mono font-medium">{order.orderNumber}</div>
            <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
          </div>
        );
      
      case 'customerName':
        return (
          <div>
            <div className="font-medium">
              {order.clientId 
                ? (clients.find((client: any) => client.id === order.clientId)?.name || order.customerName)
                : order.customerName
              }
            </div>
            <div className="text-sm text-gray-500">
              {order.clientId && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                  {clients.find((client: any) => client.id === order.clientId)?.taxCode || order.clientId}
                </span>
              )}
              {order.customerEmail}
            </div>
          </div>
        );
      
      case 'paymentDate':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <PaymentDateButton 
              order={order}
              onPaymentDateChange={(orderId, paymentDate) => {
                updatePaymentDateMutation.mutate({ id: orderId, paymentDate });
              }}
              isLoading={updatePaymentDateMutation.isPending}
            />
          </div>
        );
      
      case 'dueDate':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DueDateButton 
              order={order}
              onDueDateChange={(orderId, dueDate) => {
                updateDueDateMutation.mutate({ id: orderId, dueDate });
              }}
              isLoading={updateDueDateMutation.isPending}
            />
          </div>
        );
      
      case 'totalAmount':
        return <div className="font-medium">{formatCurrency(parseFloat(order.totalAmount))}</div>;
      
      case 'status':
        const statusInfo = orderStatuses.find(s => s.name === order.status);
        
        const handleStatusChange = (newStatus: string) => {
          console.log("Status change handler called with:", { orderId: order.id, currentStatus: order.status, newStatus });
          console.log("About to call updateStatusMutation.mutate with:", { id: order.id, status: newStatus });
          updateStatusMutation.mutate({ id: order.id, status: newStatus });
        };
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={order.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[140px] h-7 border-0 p-1">
                <Badge 
                  className="text-sm font-medium border-0 w-full justify-center"
                  style={{
                    color: statusInfo?.textColor || '#000000',
                    backgroundColor: statusInfo?.backgroundColor || '#f3f4f6'
                  }}
                >
                  {order.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: status.backgroundColor }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'actions':
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditOrder(order)}
              title="Редагувати замовлення"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePartialShipment(order)}
              title="Частково відвантажити"
            >
              <Package className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShipOrder(order)}
              title="Повністю відвантажити"
            >
              <Truck className="w-4 h-4" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const { data: allOrders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: orderStatuses = [] } = useQuery<OrderStatus[]>({
    queryKey: ["/api/order-statuses"],
  });

  // Функція фільтрації замовлень
  const filterOrders = (orders: any[]) => {
    return orders.filter((order: any) => {
      // Пошук по тексту
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.customerPhone?.toLowerCase().includes(searchLower) ||
        order.orderSequenceNumber.toString().includes(searchLower);

      // Фільтр за статусом
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Фільтр за оплатою
      const matchesPayment = 
        paymentFilter === "all" ||
        (paymentFilter === "paid" && order.paymentDate) ||
        (paymentFilter === "unpaid" && !order.paymentDate) ||
        (paymentFilter === "overdue" && !order.paymentDate && order.dueDate && new Date(order.dueDate) < new Date());

      // Фільтр за датами
      const now = new Date();
      const orderDate = new Date(order.createdAt);
      const matchesDateRange = 
        dateRangeFilter === "all" ||
        (dateRangeFilter === "today" && orderDate.toDateString() === now.toDateString()) ||
        (dateRangeFilter === "week" && (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
        (dateRangeFilter === "month" && (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000);

      return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
    });
  };

  const filteredOrders = filterOrders(allOrders);

  // Хук сортування з збереженням налаштувань користувача
  const { sortedData: orders, sortConfig, handleSort } = useSorting({
    data: filteredOrders,
    tableName: 'orders',
    defaultSort: { field: 'orderSequenceNumber', direction: 'desc' }
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Додаємо логування для діагностики
  console.log("Products in orders dialog:", products);

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Форма для замовлення
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      notes: "",
    },
  });

  // Форма для управління статусами
  const statusForm = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: "",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    },
  });

  // Мутація для створення замовлення
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleCloseDialog();
      toast({
        title: "Успіх",
        description: "Замовлення створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: (params: { id: number; status: string }) => {
      console.log("Frontend: Updating order status - params:", params);
      console.log("Frontend: Updating order status - id:", params.id, "status:", params.status);
      const requestData = { status: params.status };
      console.log("Frontend: Request data being sent:", requestData);
      return apiRequest(`/api/orders/${params.id}/status`, { method: "PUT", body: requestData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: (error: any) => {
      console.error("Frontend: Error updating status:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  // Мутація для видалення замовлення
  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення замовлення
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending PUT request to:", `/api/orders/${data.id}`);
      console.log("Request data:", data);
      return await apiRequest(`/api/orders/${data.id}`, { method: "PUT", body: data });
    },
    onSuccess: (result) => {
      console.log("Order update success:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingOrder(null);
      setOrderItems([]);
      form.reset();
      toast({
        title: "Успіх",
        description: "Замовлення оновлено",
      });
    },
    onError: (error: any) => {
      console.error("Order update error:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення дати оплати
  const updatePaymentDateMutation = useMutation({
    mutationFn: async ({ id, paymentDate }: { id: number; paymentDate: string | null }) => {
      return await apiRequest(`/api/orders/${id}/payment-date`, { 
        method: "PATCH", 
        body: { paymentDate } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Дату оплати оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити дату оплати",
        variant: "destructive",
      });
    },
  });

  // Мутація для оновлення терміну виконання
  const updateDueDateMutation = useMutation({
    mutationFn: async ({ id, dueDate }: { id: number; dueDate: string | null }) => {
      return await apiRequest(`/api/orders/${id}/due-date`, { 
        method: "PATCH", 
        body: { dueDate } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Термін виконання оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити термін виконання",
        variant: "destructive",
      });
    },
  });

  // Мутація для відвантаження замовлення
  const shipOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const now = new Date().toISOString();
      return await apiRequest(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: { shippedDate: now }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення відвантажено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося відвантажити замовлення",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення рахунку з замовлення
  const createInvoiceMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest(`/api/orders/${orderId}/create-invoice`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Рахунок створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити рахунок",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення нового клієнта
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return await apiRequest("/api/clients", {
        method: "POST",
        body: clientData
      });
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      // Автоматично вибираємо новоствореного клієнта
      form.setValue("clientId", newClient.id.toString());
      setIsCreateClientDialogOpen(false);
      setNewClientName("");
      setClientSearchValue("");
      toast({
        title: "Успіх",
        description: "Клієнта створено та обрано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити клієнта",
        variant: "destructive",
      });
    },
  });

  // Мутації для управління статусами
  const createStatusMutation = useMutation({
    mutationFn: async (data: StatusFormData) => {
      return await apiRequest("/api/order-statuses", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      setIsStatusDialogOpen(false);
      setEditingStatus(null);
      statusForm.reset();
      toast({
        title: "Успіх",
        description: "Статус створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити статус",
        variant: "destructive",
      });
    },
  });

  const updateStatusSettingsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StatusFormData }) => {
      return await apiRequest(`/api/order-statuses/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      setEditingStatus(null);
      statusForm.reset();
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/order-statuses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-statuses"] });
      toast({
        title: "Успіх",
        description: "Статус видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити статус",
        variant: "destructive",
      });
    },
  });

  // Функція для відвантаження замовлення
  const handleShipOrder = (order: any) => {
    if (confirm(`Підтвердити відвантаження замовлення ${order.orderNumber}?`)) {
      shipOrderMutation.mutate(order.id);
    }
  };

  // Функція для створення рахунку
  const handleCreateInvoice = (order: any) => {
    if (confirm(`Створити рахунок для замовлення ${order.orderNumber}?`)) {
      createInvoiceMutation.mutate(order.id);
    }
  };

  // Функції для управління статусами
  const handleCreateStatus = () => {
    setEditingStatus(null);
    statusForm.reset({
      name: "",
      textColor: "#000000",
      backgroundColor: "#ffffff",
    });
    setIsStatusDialogOpen(true);
  };

  const handleEditStatus = (status: OrderStatus) => {
    setEditingStatus(status);
    statusForm.reset({
      name: status.name,
      textColor: status.textColor,
      backgroundColor: status.backgroundColor,
    });
    setIsStatusDialogOpen(true);
  };

  const handleDeleteStatus = (id: number) => {
    if (confirm("Видалити цей статус?")) {
      deleteStatusMutation.mutate(id);
    }
  };

  const handleStatusSubmit = (data: StatusFormData) => {
    if (editingStatus) {
      updateStatusSettingsMutation.mutate({ id: editingStatus.id, data });
    } else {
      createStatusMutation.mutate(data);
    }
  };

  // Функція для закриття діалогу та очищення форми
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    form.reset();
  };

  // Функція для закриття діалогу редагування
  const handleCloseEditDialog = () => {
    setIsEditMode(false);
    setEditingOrder(null);
    setOrderItems([]);
    form.reset();
  };

  // Функція для початку редагування замовлення
  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsEditMode(true);
    
    // Функція для конвертації дати в формат datetime-local
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };

    // Заповнюємо форму даними замовлення
    form.reset({
      clientId: order.clientId ? order.clientId.toString() : "",
      customerName: order.customerName || "",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      status: order.status,
      notes: order.notes || "",
      paymentDate: formatDateForInput(order.paymentDate),
      dueDate: formatDateForInput(order.dueDate),
      shippedDate: formatDateForInput(order.shippedDate),
    });

    // Заповнюємо товари замовлення
    if (order.items) {
      console.log("Order items:", order.items);
      setOrderItems(order.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
      })));
    } else {
      console.log("No items in order");
      setOrderItems([]);
    }
    
    setIsDialogOpen(true);
  };

  // Функції для управління товарами в замовленні
  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: 0, quantity: "", unitPrice: "" }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItemFormData, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Якщо обирається товар, автоматично встановлюємо його ціну
    if (field === "productId" && value > 0 && products) {
      const selectedProduct = products.find((p: any) => p.id === value);
      if (selectedProduct) {
        updated[index].unitPrice = selectedProduct.retailPrice;
      }
    }
    
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Допоміжні функції для таблиці
  const getOrderNumberBgColor = (order: any) => {
    if (order.paymentDate) return "bg-green-50 border-green-200";
    if (order.dueDate && new Date(order.dueDate) < new Date()) return "bg-red-50 border-red-200";
    return "bg-gray-50";
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Нове",
      processing: "В обробці", 
      completed: "Завершено",
      cancelled: "Скасовано"
    };
    return statusMap[status] || status;
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handlePartialShipment = (order: Order) => {
    setSelectedOrderForShipment(order);
    setIsPartialShipmentOpen(true);
  };

  // Функції для роботи з клієнтами
  const filteredClients = clients.filter((client: any) =>
    client.name.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
    client.taxCode.toLowerCase().includes(clientSearchValue.toLowerCase())
  );

  const handleClientSelect = (clientId: string) => {
    form.setValue("clientId", clientId);
    setClientComboboxOpen(false);
    setClientSearchValue("");
  };

  const handleClientSearchChange = (value: string) => {
    setClientSearchValue(value);
    if (value.length > 0) {
      setClientComboboxOpen(true);
    } else {
      setClientComboboxOpen(false);
    }
  };

  const handleCreateNewClient = (formData: any) => {
    createClientMutation.mutate(formData);
  };

  const handleSubmit = (data: OrderFormData) => {
    console.log("=== FORM SUBMIT STARTED ===");
    console.log("Handle submit called with data:", data);
    console.log("Order items:", orderItems);
    console.log("Is edit mode:", isEditMode);
    
    // Перевіряємо, чи додані товари
    if (orderItems.length === 0) {
      toast({
        title: "Помилка",
        description: "Додайте хоча б один товар до замовлення",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо валідність товарів
    const invalidItems = orderItems.filter(item => 
      !item.productId || !item.quantity || !item.unitPrice
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля для кожного товару",
        variant: "destructive",
      });
      return;
    }

    // Функція для конвертації дати з datetime-local у ISO формат
    const parseDateForServer = (dateString: string) => {
      if (!dateString) return null;
      return new Date(dateString).toISOString();
    };

    const orderData = {
      order: {
        ...(data.clientId && { clientId: parseInt(data.clientId) }),
        ...(data.customerName && { customerName: data.customerName }),
        ...(data.customerEmail && { customerEmail: data.customerEmail }),
        ...(data.customerPhone && { customerPhone: data.customerPhone }),
        status: data.status,
        ...(data.notes && { notes: data.notes }),
        ...(data.paymentDate && { paymentDate: parseDateForServer(data.paymentDate) }),
        ...(data.dueDate && { dueDate: parseDateForServer(data.dueDate) }),
        ...(data.shippedDate && { shippedDate: parseDateForServer(data.shippedDate) }),
      },
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: item.unitPrice,
        totalPrice: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toString(),
      })),
    };
    
    if (isEditMode && editingOrder) {
      // Редагування існуючого замовлення
      console.log("Updating order with data:", {
        id: editingOrder.id,
        ...orderData,
      });
      updateOrderMutation.mutate({
        id: editingOrder.id,
        ...orderData,
      });
    } else {
      // Створення нового замовлення
      createOrderMutation.mutate(orderData);
    }
  };





  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Замовлення / Рахунки</h2>
            <p className="text-gray-600">Управління замовленнями та рахунками (номер замовлення = номер рахунку)</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsStatusSettingsOpen(!isStatusSettingsOpen)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Налаштування статусів
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Новий рахунок/замовлення
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="order-dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? `Редагувати рахунок ${editingOrder?.orderNumber}` : "Створити новий рахунок/замовлення"}
                </DialogTitle>
                <DialogDescription id="order-dialog-description">
                  {isEditMode ? "Внесіть зміни до існуючого замовлення та його товарів" : "Створіть новий рахунок для клієнта з товарами та датами"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Інформація про клієнта */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientId">Клієнт *</Label>
                    <div className="relative">
                      <Input
                        placeholder="Почніть вводити назву клієнта..."
                        value={form.watch("clientId") ? 
                          clients.find((c: any) => c.id.toString() === form.watch("clientId"))?.name || clientSearchValue 
                          : clientSearchValue}
                        onChange={(e) => {
                          // Якщо є обраний клієнт і користувач редагує, скидаємо вибір
                          if (form.watch("clientId")) {
                            form.setValue("clientId", "");
                          }
                          handleClientSearchChange(e.target.value);
                        }}
                        onFocus={() => {
                          // При фокусі, якщо є обраний клієнт, очищаємо поле для редагування
                          if (form.watch("clientId")) {
                            const selectedClient = clients.find((c: any) => c.id.toString() === form.watch("clientId"));
                            setClientSearchValue(selectedClient?.name || "");
                            form.setValue("clientId", "");
                          }
                          // Не відкриваємо автоматично список при фокусі
                        }}
                        onBlur={() => setTimeout(() => setClientComboboxOpen(false), 200)}
                        className={form.formState.errors.clientId ? "border-red-500" : ""}
                      />
                      {clientSearchValue && clientComboboxOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.length > 0 ? (
                            <div className="py-1">
                              {filteredClients.map((client: any) => (
                                <div
                                  key={client.id}
                                  onClick={() => handleClientSelect(client.id.toString())}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      form.watch("clientId") === client.id.toString()
                                        ? "opacity-100 text-blue-600"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.taxCode}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : clientSearchValue.length > 2 ? (
                            <div className="p-3">
                              <p className="text-sm text-gray-600 mb-3">
                                Клієнт "{clientSearchValue}" не знайдений
                              </p>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setNewClientName(clientSearchValue);
                                  setIsCreateClientDialogOpen(true);
                                  setClientComboboxOpen(false);
                                }}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Створити нового клієнта
                              </Button>
                            </div>
                          ) : (
                            <div className="p-3 text-sm text-gray-500">
                              Введіть мінімум 3 символи для пошуку
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {form.formState.errors.clientId && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.clientId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...form.register("customerEmail")}
                      className={form.formState.errors.customerEmail ? "border-red-500" : ""}
                    />
                    {form.formState.errors.customerEmail && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customerEmail.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerPhone">Телефон</Label>
                    <Input
                      id="customerPhone"
                      {...form.register("customerPhone")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    {!isEditMode ? (
                      <Input
                        value="Нове"
                        disabled
                        className="bg-gray-50"
                      />
                    ) : (
                      <Select
                        value={form.watch("status")}
                        onValueChange={(value) => form.setValue("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Нове</SelectItem>
                          <SelectItem value="processing">В обробці</SelectItem>
                          <SelectItem value="completed">Завершено</SelectItem>
                          <SelectItem value="cancelled">Скасовано</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Дати для рахунку */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paymentDate">Дата оплати</Label>
                    <Input
                      id="paymentDate"
                      type="datetime-local"
                      {...form.register("paymentDate")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Термін виконання</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      {...form.register("dueDate")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippedDate">Дата відвантаження</Label>
                    <Input
                      id="shippedDate"
                      type="datetime-local"
                      {...form.register("shippedDate")}
                    />
                  </div>
                </div>

                {/* Примітки */}
                <div>
                  <Label htmlFor="notes">Примітки до рахунку</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Додаткова інформація про замовлення/рахунок"
                    rows={3}
                  />
                </div>

                {/* Товари в замовленні */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Товари в замовленні</Label>
                    <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати товар
                    </Button>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Додайте товари до замовлення</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Select
                            value={item.productId > 0 ? item.productId.toString() : ""}
                            onValueChange={(value) => updateOrderItem(index, "productId", parseInt(value))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Оберіть товар" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.length > 0 ? (
                                products.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-products" disabled>
                                  Немає доступних товарів
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="Кількість"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", e.target.value)}
                            className="w-24"
                          />
                          
                          <Input
                            placeholder="Ціна"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItem(index, "unitPrice", e.target.value)}
                            className="w-24"
                          />
                          
                          <div className="w-24 text-sm">
                            {(parseFloat(item.quantity) * parseFloat(item.unitPrice) || 0).toFixed(2)} ₴
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrderItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="text-right text-lg font-semibold">
                        Загальна сума: {calculateTotal().toFixed(2)} ₴
                      </div>
                    </div>
                  )}
                </div>



                <div className="flex justify-between pt-4">
                  {/* Кнопка видалення (тільки в режимі редагування) */}
                  {isEditMode && editingOrder && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => {
                        if (window.confirm(`Ви впевнені, що хочете видалити замовлення ${editingOrder.orderNumber}? Цю дію неможливо скасувати.`)) {
                          deleteOrderMutation.mutate(editingOrder.id);
                        }
                      }}
                      disabled={deleteOrderMutation.isPending}
                    >
                      {deleteOrderMutation.isPending ? "Видалення..." : "Видалити замовлення"}
                    </Button>
                  )}
                  
                  {/* Кнопки скасування та збереження */}
                  <div className="flex space-x-2 ml-auto">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Скасувати
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isEditMode ? updateOrderMutation.isPending : createOrderMutation.isPending}
                    >
                      {isEditMode 
                        ? (updateOrderMutation.isPending ? "Оновлення..." : "Оновити замовлення")
                        : (createOrderMutation.isPending ? "Створення..." : "Створити рахунок")
                      }
                    </Button>
                  </div>
                </div>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Status Settings Panel */}
      {isStatusSettingsOpen && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Управління статусами замовлень</h3>
              <Button
                variant="outline"
                onClick={() => setIsStatusSettingsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Закрити
              </Button>
            </div>

            {/* Create New Status Form */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Створити новий статус</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="statusName">Назва статусу</Label>
                    <Input
                      id="statusName"
                      {...statusForm.register("name")}
                      placeholder="Назва статусу"
                    />
                  </div>
                  <div>
                    <Label htmlFor="textColor">Колір тексту</Label>
                    <Input
                      id="textColor"
                      type="color"
                      {...statusForm.register("textColor")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor">Колір фону</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      {...statusForm.register("backgroundColor")}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      disabled={createStatusMutation.isPending}
                      className="w-full"
                    >
                      {createStatusMutation.isPending ? "Створення..." : "Створити"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Existing Statuses */}
            <Card>
              <CardHeader>
                <CardTitle>Існуючі статуси</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orderStatuses?.map((status: OrderStatus) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            color: status.textColor,
                            backgroundColor: status.backgroundColor
                          }}
                        >
                          {status.name}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStatus(status)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStatusMutation.mutate(status.id)}
                          disabled={deleteStatusMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Status Dialog */}
            <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редагувати статус</DialogTitle>
                </DialogHeader>
                {editingStatus && (
                  <form onSubmit={statusForm.handleSubmit((data) => {
                    updateStatusSettingsMutation.mutate({
                      id: editingStatus.id,
                      data
                    });
                  })}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editStatusName">Назва статусу</Label>
                        <Input
                          id="editStatusName"
                          {...statusForm.register("name")}
                          defaultValue={editingStatus.name}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editTextColor">Колір тексту</Label>
                        <Input
                          id="editTextColor"
                          type="color"
                          {...statusForm.register("textColor")}
                          defaultValue={editingStatus.textColor}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editBackgroundColor">Колір фону</Label>
                        <Input
                          id="editBackgroundColor"
                          type="color"
                          {...statusForm.register("backgroundColor")}
                          defaultValue={editingStatus.backgroundColor}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setEditingStatus(null)}
                        >
                          Скасувати
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={updateStatusSettingsMutation.isPending}
                        >
                          {updateStatusSettingsMutation.isPending ? "Оновлення..." : "Оновити"}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">Всього замовлень</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-blue-600">
                  {orders.filter((o: any) => o.status === 'processing').length}
                </p>
                <p className="text-sm text-gray-600">В обробці</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {orders.filter((o: any) => o.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Завершено</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0))}
                </p>
                <p className="text-sm text-gray-600">Загальна сума</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук за номером замовлення, клієнтом, email або телефоном..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Filter */}
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Оплата" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="paid">Оплачено</SelectItem>
                  <SelectItem value="unpaid">Не оплачено</SelectItem>
                  <SelectItem value="overdue">Прострочено</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Період" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Весь час</SelectItem>
                  <SelectItem value="today">Сьогодні</SelectItem>
                  <SelectItem value="week">Тиждень</SelectItem>
                  <SelectItem value="month">Місяць</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== "all" || paymentFilter !== "all" || dateRangeFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setPaymentFilter("all");
                    setDateRangeFilter("all");
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Очистити
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600">
              Знайдено: {orders.length} з {allOrders.length} замовлень
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список замовлень</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Замовлення відсутні</p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Створити перше замовлення
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleColumnDragEnd}>
                <Table>
                  <TableHeader>
                    <Droppable droppableId="table-headers" direction="horizontal">
                      {(provided) => (
                        <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                          {columnOrder.map((columnKey, index) => (
                            <Draggable key={columnKey} draggableId={columnKey} index={index}>
                              {(provided, snapshot) => (
                                <TableHead
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative ${snapshot.isDragging ? 'bg-blue-100 shadow-lg' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    </div>
                                    {columnKey !== 'actions' ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSort(columnKey);
                                        }}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                      >
                                        <span>{columnLabels[columnKey as keyof typeof columnLabels]}</span>
                                        {sortConfig.field === columnKey && (
                                          sortConfig.direction === 'asc' ? 
                                            <ChevronUp className="w-4 h-4" /> : 
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                      </button>
                                    ) : (
                                      <span>{columnLabels[columnKey as keyof typeof columnLabels]}</span>
                                    )}
                                  </div>
                                </TableHead>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableRow>
                      )}
                    </Droppable>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <React.Fragment key={order.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          {columnOrder.map((columnKey) => (
                            <TableCell key={columnKey}>
                              {renderColumnContent(columnKey, order)}
                            </TableCell>
                          ))}
                        </TableRow>
                        
                        {/* Розкривний рядок з деталями замовлення */}
                        {expandedOrderId === order.id && (
                          <TableRow>
                            <TableCell colSpan={columnOrder.length} className="bg-gray-50 p-0">
                              <div className="p-4">
                                <h4 className="font-medium mb-3">Склад замовлення:</h4>
                                {order.items && order.items.length > 0 ? (
                                  <div className="space-y-2">
                                    {order.items.map((item: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                                        <div className="flex-1">
                                          <span className="font-medium">{item.product?.name || 'Товар не знайдено'}</span>
                                          <span className="text-sm text-gray-500 ml-2">({item.product?.sku})</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <span className="text-sm text-gray-600">
                                            Кількість: <span className="font-medium">{item.quantity}</span>
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            Ціна: <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                                          </span>
                                          <span className="text-sm font-medium">
                                            Всього: {formatCurrency(item.totalPrice)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm">Замовлення не містить товарів</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Діалог часткового відвантаження */}
      {selectedOrderForShipment && (
        <PartialShipmentDialog
          open={isPartialShipmentOpen}
          onOpenChange={setIsPartialShipmentOpen}
          orderId={selectedOrderForShipment.id}
          orderNumber={selectedOrderForShipment.orderNumber}
        />
      )}

      {/* Діалог для створення нового клієнта */}
      <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Створити нового клієнта</DialogTitle>
            <DialogDescription>
              Додайте повну інформацію про нового клієнта
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            prefillName={newClientName}
            onSubmit={handleCreateNewClient}
            onCancel={() => {
              setIsCreateClientDialogOpen(false);
              setNewClientName("");
            }}
            isLoading={createClientMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
