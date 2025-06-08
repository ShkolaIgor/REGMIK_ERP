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
import { Plus, Eye, Edit, Trash2, ShoppingCart, Truck, Package, FileText, Check, ChevronsUpDown } from "lucide-react";
import { PartialShipmentDialog } from "@/components/PartialShipmentDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientForm } from "@/components/ClientForm";
import { PaymentDateButton } from "@/components/PaymentDateButton";
import DueDateButton from "@/components/DueDateButton";
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

type OrderFormData = z.infer<typeof orderSchema>;
type OrderItemFormData = z.infer<typeof orderItemSchema>;

export default function Orders() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
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
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/orders/${id}/status`, { method: "PUT", body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено",
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Очікує';
      case 'processing': return 'В обробці';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Скасовано';
      case 'partially_shipped': return 'Частково відвантажено';
      case 'shipped': return 'Відвантажено';
      default: return status;
    }
  };

  // Функція для визначення кольору фону номера рахунку
  const getOrderNumberBgColor = (order: any) => {
    const currentDate = new Date();
    const dueDate = order.dueDate ? new Date(order.dueDate) : null;
    const paymentDate = order.paymentDate ? new Date(order.paymentDate) : null;
    const shippedDate = order.shippedDate ? new Date(order.shippedDate) : null;

    // Якщо поточна дата більша за термін відвантаження - червоний фон
    if (dueDate && currentDate > dueDate) {
      return 'bg-red-200 text-red-900';
    }

    // Якщо рахунок оплачений і не відвантажений і не прострочений - світло-зелений фон
    if (paymentDate && !shippedDate && (!dueDate || currentDate <= dueDate)) {
      return 'bg-green-200 text-green-900';
    }

    // Звичайний фон
    return '';
  };

  const handlePartialShipment = (order: Order) => {
    setSelectedOrderForShipment(order);
    setIsPartialShipmentOpen(true);
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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



                <div className="flex justify-end space-x-2 pt-4">
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
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер рахунку</TableHead>
                    <TableHead>Клієнт</TableHead>
                    <TableHead>Дата створення</TableHead>
                    <TableHead>Дата оплати</TableHead>
                    <TableHead>Термін виконання</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <React.Fragment key={order.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <TableCell className={`font-mono ${getOrderNumberBgColor(order)}`}>{order.orderNumber}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <PaymentDateButton 
                            order={order}
                            onPaymentDateChange={(orderId, paymentDate) => {
                              updatePaymentDateMutation.mutate({ id: orderId, paymentDate });
                            }}
                            isLoading={updatePaymentDateMutation.isPending}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DueDateButton 
                            order={order}
                            onDueDateChange={(orderId, dueDate) => {
                              updateDueDateMutation.mutate({ id: orderId, dueDate });
                            }}
                            isLoading={updateDueDateMutation.isPending}
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl" aria-describedby="order-details-description">
                              <DialogHeader>
                                <DialogTitle>Деталі замовлення {selectedOrder?.orderNumber}</DialogTitle>
                                <DialogDescription id="order-details-description">
                                  Повна інформація про замовлення, клієнта та товари
                                </DialogDescription>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Інформація про клієнта */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Клієнт</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customerEmail || "Не вказано"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Телефон</Label>
                                      <p className="text-sm text-gray-600">{selectedOrder.customerPhone || "Не вказано"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Статус</Label>
                                      <Select
                                        value={selectedOrder.status}
                                        onValueChange={(value) => updateStatusMutation.mutate({ id: selectedOrder.id, status: value })}
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Очікує</SelectItem>
                                          <SelectItem value="processing">В обробці</SelectItem>
                                          <SelectItem value="completed">Завершено</SelectItem>
                                          <SelectItem value="cancelled">Скасовано</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Товари в замовленні */}
                                  <div>
                                    <Label className="text-lg font-medium">Товари</Label>
                                    <Table className="mt-2">
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Товар</TableHead>
                                          <TableHead>Кількість</TableHead>
                                          <TableHead>Ціна за одиницю</TableHead>
                                          <TableHead>Сума</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {selectedOrder.items?.map((item: any) => (
                                          <TableRow key={item.id}>
                                            <TableCell>
                                              <div>
                                                <div className="font-medium">{item.product?.name}</div>
                                                <div className="text-sm text-gray-500">SKU: {item.product?.sku}</div>
                                              </div>
                                            </TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    <div className="text-right mt-4">
                                      <p className="text-lg font-semibold">
                                        Загальна сума: {formatCurrency(selectedOrder.totalAmount)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Примітки */}
                                  {selectedOrder.notes && (
                                    <div>
                                      <Label className="text-sm font-medium">Примітки</Label>
                                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.notes}</p>
                                    </div>
                                  )}

                                  {/* Дата створення */}
                                  <div>
                                    <Label className="text-sm font-medium">Дата створення</Label>
                                    <p className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button
                                  onClick={() => handleCreateInvoice(selectedOrder)}
                                  disabled={createInvoiceMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  {createInvoiceMutation.isPending ? "Створюється..." : "Створити рахунок"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {order.shippedDate ? (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleShipOrder(order)}
                                title="Повне відвантаження"
                              >
                                <Truck className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => handlePartialShipment(order)}
                                title="Часткове відвантаження"
                              >
                                <Package className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              console.log('Delete button clicked for order:', order.id);
                              if (confirm('Ви впевнені, що хочете видалити це замовлення?')) {
                                console.log('User confirmed deletion, calling API...');
                                deleteOrderMutation.mutate(order.id);
                              } else {
                                console.log('User cancelled deletion');
                              }
                            }}
                            disabled={deleteOrderMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Розкривний рядок з деталями замовлення */}
                      {expandedOrderId === order.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-gray-50 p-0">
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
