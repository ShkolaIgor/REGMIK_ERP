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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Plus, Edit, Trash2, Search, Package, Settings, ChevronsUpDown, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn, formatCurrency } from "@/lib/utils";

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

export default function Orders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Стани компонента
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyComboboxOpen, setCompanyComboboxOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

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

  // Встановлюємо компанію за замовчуванням
  useEffect(() => {
    if (companies && companies.length > 0 && !isEditMode && !selectedCompanyId) {
      const defaultCompany = companies.find((company: any) => company.isDefault);
      if (defaultCompany) {
        setSelectedCompanyId(defaultCompany.id.toString());
        form.setValue("companyId", defaultCompany.id.toString());
      }
    }
  }, [companies, isEditMode, selectedCompanyId, form]);

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
      setSelectedCompanyId("");
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
      setSelectedCompanyId("");
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
    
    // Знаходимо компанію за замовчуванням
    const defaultCompany = companies && companies.find ? companies.find((company: any) => company.isDefault) : null;
    const defaultCompanyId = defaultCompany ? defaultCompany.id.toString() : "";
    
    form.reset({
      companyId: defaultCompanyId,
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
    
    setSelectedCompanyId(defaultCompanyId);
    setIsDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setIsEditMode(true);
    setEditingOrder(order);
    setSelectedCompanyId(order.companyId.toString());
    
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

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    form.setValue("companyId", companyId);
    setCompanyComboboxOpen(false);
  };

  // Фільтрація замовлень
  const filteredOrders = orders && orders.filter ? orders.filter((order: Order) =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

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
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {isEditMode ? "Редагувати замовлення" : "Створити замовлення"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Внесіть зміни до замовлення" : "Створіть нове замовлення"}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Компанія */}
                  <div>
                    <Label htmlFor="companyId">Компанія *</Label>
                    <Popover open={companyComboboxOpen} onOpenChange={setCompanyComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={companyComboboxOpen}
                          className="w-full justify-between"
                        >
                          {selectedCompanyId && companies && companies.find
                            ? companies.find((company: any) => company.id.toString() === selectedCompanyId)?.name || "Оберіть компанію..."
                            : "Оберіть компанію..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Пошук компанії..." />
                          <CommandEmpty>Компанія не знайдена</CommandEmpty>
                          <CommandGroup>
                            {companies && companies.map && companies.map((company: any) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => handleCompanySelect(company.id.toString())}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCompanyId === company.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {company.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      <Select onValueChange={(value) => form.setValue("status", value)} defaultValue={form.getValues("status")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses && orderStatuses.map && orderStatuses.map((status: any) => (
                            <SelectItem key={status.id} value={status.name}>
                              {status.displayName || status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={(value) => form.setValue("carrierId", value)} defaultValue={form.getValues("carrierId")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть перевізника" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Без перевізника</SelectItem>
                          {carriers && carriers.map && carriers.map((carrier: any) => (
                            <SelectItem key={carrier.id} value={carrier.id.toString()}>
                              {carrier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Textarea
                      {...form.register("notes")}
                      className="min-h-[80px]"
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

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всього замовлень</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders ? orders.length : 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активні замовлення</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders ? orders.filter((order: any) => order.status === "pending").length : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Виконані замовлення</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders ? orders.filter((order: any) => order.status === "completed").length : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Загальна сума</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orders ? formatCurrency(orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)) : "0 ₴"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Таблиця замовлень */}
        <Card>
          <CardHeader>
            <CardTitle>Список замовлень</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <Badge
                        variant={
                          order.status === "completed" ? "default" :
                          order.status === "pending" ? "secondary" :
                          "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(order.totalAmount || 0)}</TableCell>
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
          </CardContent>
        </Card>

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