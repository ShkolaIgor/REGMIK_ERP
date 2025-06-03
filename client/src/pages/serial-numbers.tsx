import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Package, Search, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSerialNumberSchema, type SerialNumber, type Product, type Warehouse } from "@shared/schema";
import { z } from "zod";

const formSchema = insertSerialNumberSchema.extend({
  manufacturedDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const statusLabels = {
  available: "Доступний",
  reserved: "Зарезервований", 
  sold: "Проданий",
  defective: "Дефектний"
};

const statusColors = {
  available: "default",
  reserved: "secondary",
  sold: "destructive", 
  defective: "outline"
} as const;

export default function SerialNumbers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SerialNumber | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductId, setFilterProductId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
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
      expiryDate: "",
    },
  });

  // Fetch serial numbers
  const { data: serialNumbers = [], isLoading } = useQuery({
    queryKey: ["/api/serial-numbers"],
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch warehouses for dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        manufacturedDate: data.manufacturedDate ? new Date(data.manufacturedDate).toISOString() : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
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
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : null,
      };
      return apiRequest(`/api/serial-numbers/${id}`, {
        method: "PUT",
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
    mutationFn: (id: number) => apiRequest(`/api/serial-numbers/${id}`, { method: "DELETE" }),
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

  const handleSubmit = (data: FormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: SerialNumber) => {
    setEditingItem(item);
    
    // Format dates for datetime-local input
    const formatDateForInput = (date: string | Date | null) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    };

    form.reset({
      productId: item.productId,
      serialNumber: item.serialNumber,
      status: item.status,
      warehouseId: item.warehouseId || undefined,
      orderId: item.orderId || undefined,
      notes: item.notes || "",
      manufacturedDate: formatDateForInput(item.manufacturedDate),
      expiryDate: formatDateForInput(item.expiryDate),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей серійний номер?")) {
      deleteMutation.mutate(id);
    }
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
      const selectedProduct = products.find((p: Product) => p.id === productId);
      
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
  const filteredSerialNumbers = serialNumbers.filter((item: SerialNumber & { product?: Product }) => {
    const matchesSearch = item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = filterProductId === "all" || !filterProductId || item.productId.toString() === filterProductId;
    const matchesStatus = filterStatus === "all" || !filterStatus || item.status === filterStatus;
    
    return matchesSearch && matchesProduct && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Серійні номери</h1>
          <p className="text-muted-foreground">Управління серійними номерами продукції</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Додати серійний номер
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Редагувати серійний номер" : "Новий серійний номер"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Продукт</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть продукт" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product: Product) => (
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
                            {warehouses.map((warehouse: Warehouse) => (
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
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Термін придатності</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                        <Textarea {...field} placeholder="Додаткова інформація" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingItem ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Пошук</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Пошук за серійним номером або продуктом..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label>Продукт</Label>
              <Select value={filterProductId} onValueChange={setFilterProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі продукти" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі продукти</SelectItem>
                  {products.map((product: Product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Статус</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі статуси" />
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
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5" />
            Серійні номери ({filteredSerialNumbers.length})
          </CardTitle>
          <CardDescription>
            Список всіх серійних номерів у системі
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Завантаження...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Серійний номер</TableHead>
                  <TableHead>Продукт</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead>Дата виробництва</TableHead>
                  <TableHead>Термін придатності</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.map((item: SerialNumber & { product?: Product; warehouse?: Warehouse }) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.serialNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-sm text-muted-foreground">{item.product?.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[item.status as keyof typeof statusColors]}>
                        {statusLabels[item.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.warehouse?.name || "—"}</TableCell>
                    <TableCell>
                      {item.manufacturedDate ? new Date(item.manufacturedDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSerialNumbers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
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