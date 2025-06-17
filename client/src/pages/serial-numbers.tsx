import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash, Search, QrCode } from "lucide-react";
import { SerialNumber, Product, Warehouse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  serialNumber: z.string().min(1, "Серійний номер обов'язковий"),
  productId: z.number().min(1, "Виберіть продукт"),
  status: z.enum(["available", "reserved", "sold", "defective"]),
  warehouseId: z.number().optional(),
  manufacturedDate: z.string().optional(),
  invoiceNumber: z.string().optional(),
  clientShortName: z.string().optional(),
  notes: z.string().optional(),
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
  const [sortField, setSortField] = useState<string>("serialNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      status: "available",
    },
  });

  const { data: serialNumbers = [], isLoading } = useQuery({
    queryKey: ["/api/serial-numbers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        manufacturedDate: data.manufacturedDate ? new Date(data.manufacturedDate) : undefined,
      };
      return apiRequest("/api/serial-numbers", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Серійний номер створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити серійний номер",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => {
      const payload = {
        ...data,
        manufacturedDate: data.manufacturedDate ? new Date(data.manufacturedDate) : undefined,
      };
      return apiRequest(`/api/serial-numbers/${id}`, { method: "PATCH", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Серійний номер оновлено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити серійний номер",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/serial-numbers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      toast({
        title: "Успіх",
        description: "Серійний номер видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити серійний номер",
        variant: "destructive",
      });
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: () => apiRequest("/api/serial-numbers/auto-generate", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/serial-numbers"] });
      toast({
        title: "Успіх",
        description: "Серійні номери згенеровано автоматично",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося згенерувати серійні номери",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      serialNumber: "",
      status: "available",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: SerialNumber) => {
    setEditingItem(item);
    form.reset({
      serialNumber: item.serialNumber,
      productId: item.productId,
      status: item.status as any,
      warehouseId: item.warehouseId || undefined,
      manufacturedDate: item.manufacturedDate 
        ? new Date(item.manufacturedDate).toISOString().split('T')[0] 
        : undefined,
      invoiceNumber: item.invoiceNumber || "",
      clientShortName: item.clientShortName || "",
      notes: item.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей серійний номер?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAutoGenerate = () => {
    autoGenerateMutation.mutate();
  };

  // Filter and sort serial numbers
  const filteredAndSortedSerialNumbers = (serialNumbers as (SerialNumber & { product?: Product })[])
    .filter((item) => {
      const matchesSearch = item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = filterProductId === "all" || !filterProductId || item.productId.toString() === filterProductId;
      const matchesStatus = filterStatus === "all" || !filterStatus || item.status === filterStatus;
      
      return matchesSearch && matchesProduct && matchesStatus;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "serialNumber":
          aVal = a.serialNumber.toLowerCase();
          bVal = b.serialNumber.toLowerCase();
          break;
        case "product":
          aVal = a.product?.name.toLowerCase() || "";
          bVal = b.product?.name.toLowerCase() || "";
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "createdAt":
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalItems = filteredAndSortedSerialNumbers.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
  const startIndex = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalItems : startIndex + pageSize;
  const paginatedSerialNumbers = filteredAndSortedSerialNumbers.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const onSubmit = (data: FormData) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Серійні номери</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAutoGenerate}>
              Автогенерація
            </Button>
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
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Серійний номер</FormLabel>
                            <FormControl>
                              <Input placeholder="Введіть серійний номер" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Продукт</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Виберіть продукт" />
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Статус</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Виберіть статус" />
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
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Виберіть склад" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Без складу</SelectItem>
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
                              <Input type="date" {...field} />
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
                            <FormLabel>Номер накладної</FormLabel>
                            <FormControl>
                              <Input placeholder="Номер накладної" {...field} value={field.value || ""} />
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
                            <FormLabel>Коротка назва клієнта</FormLabel>
                            <FormControl>
                              <Input placeholder="Коротка назва клієнта" {...field} value={field.value || ""} />
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
                            <Textarea placeholder="Додаткові примітки" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
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
        </div>

        {/* Фільтри і пошук */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Пошук за серійним номером, продуктом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Select value={filterProductId} onValueChange={setFilterProductId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Всі продукти" />
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
            <SelectTrigger className="w-[150px]">
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

        {/* Пагінація верхня */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} з {totalItems} записів
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Розмір сторінки:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(value === "all" ? -1 : parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Всі</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("serialNumber")}
                  >
                    Серійний номер
                    {sortField === "serialNumber" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("product")}
                  >
                    Продукт
                    {sortField === "product" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("status")}
                  >
                    Статус
                    {sortField === "status" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("createdAt")}
                  >
                    Дата виробництва
                    {sortField === "createdAt" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSerialNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <QrCode className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">Серійні номери не знайдено</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSerialNumbers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.serialNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-500">{item.product?.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                          {statusLabels[item.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.warehouseId ? (
                          (warehouses as Warehouse[]).find(w => w.id === item.warehouseId)?.name || "Невідомо"
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.manufacturedDate 
                          ? new Date(item.manufacturedDate).toLocaleDateString('uk-UA')
                          : "-"}
                      </TableCell>
                      <TableCell>{item.clientShortName || "-"}</TableCell>
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
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash className="h-4 w-4" />
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

        {/* Пагінація нижня */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Сторінка {currentPage} з {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Перша
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <span className="mx-2">
                Сторінка {currentPage} з {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Остання
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}