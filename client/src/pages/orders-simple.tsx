import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, Package, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Схеми валідації
const orderSchema = z.object({
  companyId: z.string().min(1, "Оберіть компанію"),
  customerName: z.string().min(1, "Введіть ім'я клієнта"),
  customerEmail: z.string().email("Введіть коректний email").optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  status: z.string().min(1, "Оберіть статус"),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  shippedDate: z.string().optional(),
  trackingNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  carrierId: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  companyId: number;
  invoiceNumber?: string;
  carrierId?: number;
  trackingNumber?: string;
  paymentDate?: string;
  dueDate?: string;
  shippedDate?: string;
  notes?: string;
}

export default function OrdersSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Стани компонента
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Завантаження даних
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: orderStatuses = [] } = useQuery({
    queryKey: ["/api/order-statuses"],
  });

  const { data: carriers = [] } = useQuery({
    queryKey: ["/api/carriers"],
  });

  // Форма
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      companyId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      notes: "",
      paymentDate: "",
      dueDate: "",
      shippedDate: "",
      trackingNumber: "",
      invoiceNumber: "",
      carrierId: "",
    },
  });

  // Знаходимо компанію за замовчуванням
  const defaultCompany = companies.find((company: any) => company.isDefault);

  // Встановлюємо компанію за замовчуванням при створенні нового замовлення
  useEffect(() => {
    if (!isEditMode && defaultCompany && !form.getValues("companyId")) {
      form.setValue("companyId", defaultCompany.id.toString());
    }
  }, [isEditMode, defaultCompany, form]);

  // Мутації
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      return await apiRequest("/api/orders", {
        method: "POST",
        body: {
          ...data,
          companyId: parseInt(data.companyId),
          carrierId: data.carrierId ? parseInt(data.carrierId) : null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Замовлення створено",
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

  const updateOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData & { id: number }) => {
      return await apiRequest(`/api/orders/${data.id}`, {
        method: "PATCH",
        body: {
          ...data,
          companyId: parseInt(data.companyId),
          carrierId: data.carrierId ? parseInt(data.carrierId) : null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingOrder(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Замовлення оновлено",
      });
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
      return await apiRequest(`/api/orders/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення видалено",
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

  // Обробники подій
  const handleCreateOrder = () => {
    setIsEditMode(false);
    setEditingOrder(null);
    form.reset({
      companyId: defaultCompany ? defaultCompany.id.toString() : "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      notes: "",
      paymentDate: "",
      dueDate: "",
      shippedDate: "",
      trackingNumber: "",
      invoiceNumber: "",
      carrierId: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setIsEditMode(true);
    setEditingOrder(order);
    form.reset({
      companyId: order.companyId.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      status: order.status,
      notes: order.notes || "",
      paymentDate: order.paymentDate || "",
      dueDate: order.dueDate || "",
      shippedDate: order.shippedDate || "",
      trackingNumber: order.trackingNumber || "",
      invoiceNumber: order.invoiceNumber || "",
      carrierId: order.carrierId ? order.carrierId.toString() : "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити це замовлення?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const handleSubmit = (data: OrderFormData) => {
    if (isEditMode && editingOrder) {
      updateOrderMutation.mutate({ ...data, id: editingOrder.id });
    } else {
      createOrderMutation.mutate(data);
    }
  };

  // Фільтрація замовлень
  const filteredOrders = orders.filter((order: Order) =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (ordersLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Замовлення</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Пошук замовлень..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateOrder}>
                  <Plus className="w-4 h-4 mr-2" />
                  Нове замовлення
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? "Редагувати замовлення" : "Створити замовлення"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Внесіть зміни до замовлення" : "Створіть нове замовлення"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* Компанія */}
                  <div>
                    <Label htmlFor="companyId">Компанія *</Label>
                    <select
                      {...form.register("companyId")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Оберіть компанію</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id.toString()}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.companyId && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.companyId.message}
                      </p>
                    )}
                  </div>

                  {/* Інформація про клієнта */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Ім'я клієнта *</Label>
                      <Input
                        {...form.register("customerName")}
                        className={form.formState.errors.customerName ? "border-red-500" : ""}
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.customerName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
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
                      <Input {...form.register("customerPhone")} />
                    </div>
                    <div>
                      <Label htmlFor="status">Статус *</Label>
                      <select
                        {...form.register("status")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        {orderStatuses.map((status: any) => (
                          <option key={status.id} value={status.name}>
                            {status.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Додаткові поля */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">Номер рахунку</Label>
                      <Input {...form.register("invoiceNumber")} />
                    </div>
                    <div>
                      <Label htmlFor="carrierId">Перевізник</Label>
                      <select
                        {...form.register("carrierId")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Оберіть перевізника</option>
                        {carriers.map((carrier: any) => (
                          <option key={carrier.id} value={carrier.id.toString()}>
                            {carrier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Треки та дати */}
                  {isEditMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trackingNumber">Трек-номер</Label>
                        <Input {...form.register("trackingNumber")} />
                      </div>
                      <div>
                        <Label htmlFor="paymentDate">Дата оплати</Label>
                        <Input type="date" {...form.register("paymentDate")} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dueDate">Дата виконання</Label>
                      <Input type="date" {...form.register("dueDate")} />
                    </div>
                    <div>
                      <Label htmlFor="shippedDate">Дата відправки</Label>
                      <Input type="date" {...form.register("shippedDate")} />
                    </div>
                  </div>

                  {/* Примітки */}
                  <div>
                    <Label htmlFor="notes">Примітки</Label>
                    <textarea
                      {...form.register("notes")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 min-h-[80px]"
                      placeholder="Додаткова інформація..."
                    />
                  </div>

                  {/* Кнопки */}
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
                      disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending || updateOrderMutation.isPending
                        ? "Збереження..."
                        : isEditMode
                        ? "Оновити"
                        : "Створити"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Таблиця замовлень */}
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Клієнт</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сума</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerEmail || "-"}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      order.status === "completed" ? "bg-green-100 text-green-800" :
                      order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{order.totalAmount.toLocaleString()} ₴</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString("uk-UA")}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Немає замовлень</h3>
            <p className="text-gray-500">Створіть перше замовлення для початку роботи</p>
          </div>
        )}
      </div>
    </div>
  );
}