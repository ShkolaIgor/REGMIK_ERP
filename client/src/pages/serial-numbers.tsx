import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { insertSerialNumberSchema, type SerialNumber, type Product, type Warehouse } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSerialNumberSchema.extend({
  manufacturedDate: z.string().optional(),
  saleDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const statusLabels = {
  available: "Доступний",
  reserved: "Зарезервований", 
  sold: "Проданий",
  defective: "Дефектний",
};

const statusColors = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-blue-100 text-blue-800", 
  defective: "bg-red-100 text-red-800",
};

export default function SerialNumbers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SerialNumber | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductId, setFilterProductId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      serialNumber: "",
      status: "available",
      warehouseId: undefined,
      orderId: undefined,
      notes: "",
      manufacturedDate: "",
      invoiceNumber: "",
      clientShortName: "",
      saleDate: "",
    },
  });

  // Fetch serial numbers
  const { data: serialNumbers = [], isLoading } = useQuery({
    queryKey: ["/api/serial-numbers"],
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        manufacturedDate: data.manufacturedDate ? new Date(data.manufacturedDate).toISOString() : null,
        saleDate: data.saleDate ? new Date(data.saleDate).toISOString() : null,
      };
      return apiRequest("/api/serial-numbers", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Серійний номер створено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const payload = {
        ...data,
        manufacturedDate: data.manufacturedDate ? new Date(data.manufacturedDate).toISOString() : null,
        saleDate: data.saleDate ? new Date(data.saleDate).toISOString() : null,
      };
      return apiRequest(`/api/serial-numbers/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Серійний номер оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/serial-numbers/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      toast({
        title: "Успіх",
        description: "Серійний номер видалено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (item: SerialNumber) => {
    setEditingItem(item);
    form.reset({
      productId: item.productId,
      serialNumber: item.serialNumber,
      status: item.status,
      warehouseId: item.warehouseId || undefined,
      orderId: item.orderId || undefined,
      notes: item.notes || "",
      invoiceNumber: item.invoiceNumber || "",
      clientShortName: item.clientShortName || "",
      manufacturedDate: item.manufacturedDate ? new Date(item.manufacturedDate).toISOString().slice(0, 16) : "",
      saleDate: item.saleDate ? new Date(item.saleDate).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Auto-generate serial number mutation
  const autoGenerateMutation = useMutation({
    mutationFn: async () => {
      const productId = form.getValues("productId");
      const selectedProduct = (products as Product[]).find((p: Product) => p.id === productId);
      
      return apiRequest("/api/serial-numbers/generate", {
        method: "POST",
        body: {
          productId,
          categoryId: selectedProduct?.categoryId,
        },
      });
    },
    onSuccess: (data) => {
      form.setValue("serialNumber", data.serialNumber);
      toast({
        title: "Успіх",
        description: "Серійний номер згенеровано автоматично",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося згенерувати серійний номер",
        variant: "destructive",
      });
    },
  });

  const handleAutoGenerate = () => {
    autoGenerateMutation.mutate();
  };

  // Filter serial numbers
  const filteredSerialNumbers = (serialNumbers as (SerialNumber & { product?: Product })[]).filter((item) => {
    const matchesSearch = item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = filterProductId === "all" || !filterProductId || item.productId.toString() === filterProductId;
    const matchesStatus = filterStatus === "all" || !filterStatus || item.status === filterStatus;
    
    return matchesSearch && matchesProduct && matchesStatus;
  });

  const onSubmit = (data: FormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="w-full px-4 py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Серійні номери</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Додати серійний номер
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Редагувати серійний номер" : "Додати серійний номер"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Продукт</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть продукт" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(products as Product[]).map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.sku})
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
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Серійний номер</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} placeholder="Введіть серійний номер" />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAutoGenerate}
                            disabled={!form.watch("productId")}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Авто
                          </Button>
                        </div>
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
                            <SelectItem value="available">Доступний</SelectItem>
                            <SelectItem value="reserved">Зарезервований</SelectItem>
                            <SelectItem value="sold">Проданий</SelectItem>
                            <SelectItem value="defective">Дефектний</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Склад</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть склад" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Не вибрано</SelectItem>
                            {(warehouses as Warehouse[]).map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name}
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
                    name="manufacturedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата виробництва</FormLabel>
                        <FormControl>
                          <UkrainianDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString() : "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер рахунку</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Введіть номер рахунку" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientShortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Скорочена назва клієнта</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Введіть скорочену назву клієнта" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата продажі</FormLabel>
                        <FormControl>
                          <UkrainianDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString() : "")}
                          />
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
                        <Textarea {...field} placeholder="Додаткові примітки" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фільтри</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Пошук за серійним номером, назвою продукту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterProductId} onValueChange={setFilterProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Фільтр за продуктом" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі продукти</SelectItem>
                {(products as Product[]).map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Фільтр за статусом" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                <SelectItem value="available">Доступний</SelectItem>
                <SelectItem value="reserved">Зарезервований</SelectItem>
                <SelectItem value="sold">Проданий</SelectItem>
                <SelectItem value="defective">Дефектний</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблиця */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">Завантаження...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Серійний номер</TableHead>
                  <TableHead>Продукт</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead>Номер рахунку</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Дата продажі</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.serialNumber}</TableCell>
                    <TableCell>
                      {item.product?.name} ({item.product?.sku})
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(warehouses as Warehouse[]).find((w) => w.id === item.warehouseId)?.name || "-"}
                    </TableCell>
                    <TableCell>{item.invoiceNumber || "-"}</TableCell>
                    <TableCell>{item.clientShortName || "-"}</TableCell>
                    <TableCell>
                      {item.saleDate ? new Date(item.saleDate).toLocaleDateString("uk-UA") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSerialNumbers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      Серійні номери не знайдено
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}