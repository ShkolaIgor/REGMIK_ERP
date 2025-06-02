import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calculator, AlertTriangle, CheckCircle, Clock, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type MaterialShortage, type Product, type Warehouse, insertMaterialShortageSchema } from "@shared/schema";
import { z } from "zod";

// Розширена схема для форми
const formSchema = insertMaterialShortageSchema.extend({
  productId: z.number().min(1, "Виберіть продукт"),
});

type FormData = z.infer<typeof formSchema>;

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const priorityLabels = {
  low: "Низький",
  medium: "Середній",
  high: "Високий", 
  critical: "Критичний"
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  ordered: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const statusLabels = {
  pending: "Очікує",
  ordered: "Замовлено",
  delivered: "Доставлено",
  cancelled: "Скасовано"
};

export default function MaterialShortagesPage() {
  const [selectedShortage, setSelectedShortage] = useState<MaterialShortage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShortage, setEditingShortage] = useState<MaterialShortage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      warehouseId: undefined,
      requiredQuantity: "0",
      availableQuantity: "0",
      shortageQuantity: "0",
      priority: "medium",
      status: "pending",
      estimatedCost: "0",
      supplierRecommendationId: undefined,
      notes: "",
    },
  });

  // Запити даних
  const { data: shortages = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/material-shortages"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Мутації
  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest({
        url: "/api/material-shortages",
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Запис про дефіцит створено успішно",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      apiRequest({
        url: `/api/material-shortages/${id}`,
        method: "PATCH", 
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      setEditingShortage(null);
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Запис оновлено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error?.message || "Не вдалося оновити запис",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest({
        url: `/api/material-shortages/${id}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      toast({
        title: "Успіх",
        description: "Запис видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error?.message || "Не вдалося видалити запис про дефіцит",
        variant: "destructive",
      });
    },
  });

  const calculateShortages = useMutation({
    mutationFn: () =>
      apiRequest({
        url: "/api/material-shortages/calculate",
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      toast({
        title: "Успіх",
        description: "Дефіцити розраховано автоматично",
      });
    },
  });

  const updateShortageStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest({
        url: `/api/material-shortages/${id}`,
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено успішно",
      });
    },
  });

  const createSupplierOrder = useMutation({
    mutationFn: (shortageId: number) =>
      apiRequest({
        url: `/api/material-shortages/${shortageId}/create-order`,
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({
        title: "Успіх",
        description: "Замовлення постачальнику створено",
      });
    },
  });

  // Обробники подій
  const handleSubmit = (data: FormData) => {
    console.log('Form submitted with data:', data);
    console.log('Editing shortage:', editingShortage);
    
    if (editingShortage) {
      console.log('Calling updateMutation with:', { id: editingShortage.id, data });
      updateMutation.mutate({ id: editingShortage.id, data });
    } else {
      console.log('Calling createMutation with:', data);
      createMutation.mutate(data);
    }
  };

  const handleEdit = (shortage: any) => {
    setEditingShortage(shortage);
    form.reset({
      productId: shortage.productId,
      warehouseId: shortage.warehouseId || undefined,
      requiredQuantity: shortage.requiredQuantity,
      availableQuantity: shortage.availableQuantity,
      shortageQuantity: shortage.shortageQuantity,
      priority: shortage.priority,
      status: shortage.status,
      estimatedCost: shortage.estimatedCost || "0",
      supplierRecommendationId: shortage.supplierRecommendationId || undefined,
      notes: shortage.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей запис?")) {
      deleteMutation.mutate(id);
    }
  };

  // Статистика
  const stats = {
    total: shortages.length,
    critical: shortages.filter((s: any) => s.priority === "critical").length,
    pending: shortages.filter((s: any) => s.status === "pending").length,
    totalCost: shortages.reduce((sum: number, s: any) => sum + (parseFloat(s.estimatedCost) || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження даних про дефіцити...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Дефіцит матеріалів</h1>
          <p className="text-gray-600">Моніторинг та управління нестачею матеріалів</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => calculateShortages.mutate()}
            disabled={calculateShortages.isPending}
            variant="outline"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calculateShortages.isPending ? "Розрахунок..." : "Розрахувати"}
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingShortage(null); form.reset(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Додати запис
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingShortage ? "Редагувати дефіцит" : "Додати новий запис про дефіцит"}
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
                          <FormLabel>Продукт *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Виберіть продукт" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product: any) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
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
                              {warehouses.map((warehouse: any) => (
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
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="requiredQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Потрібна кількість</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="availableQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Доступна кількість</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shortageQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дефіцит</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пріоритет</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Низький</SelectItem>
                              <SelectItem value="medium">Середній</SelectItem>
                              <SelectItem value="high">Високий</SelectItem>
                              <SelectItem value="critical">Критичний</SelectItem>
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
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Очікує</SelectItem>
                              <SelectItem value="ordered">Замовлено</SelectItem>
                              <SelectItem value="delivered">Доставлено</SelectItem>
                              <SelectItem value="cancelled">Скасовано</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Орієнтовна вартість</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierRecommendationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Рекомендований постачальник</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))} value={field.value ? field.value.toString() : "0"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Виберіть постачальника" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Без постачальника</SelectItem>
                              {(suppliers as any[])?.map((supplier: any) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          <Textarea placeholder="Додаткова інформація..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                      Скасувати
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      onClick={() => {
                        console.log('Submit button clicked, editingShortage:', editingShortage);
                        console.log('Form errors:', form.formState.errors);
                        console.log('Form values:', form.getValues());
                      }}
                    >
                      {editingShortage ? "Оновити" : "Створити"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього записів</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Критичний дефіцит</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Очікує замовлення</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальна вартість</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₴{stats.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Список дефіцитів */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Список дефіцитів матеріалів</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {shortages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Дефіцитів не знайдено</h3>
              <p className="text-gray-600 mb-4">Поки що немає записів про дефіцит матеріалів</p>
              <Button onClick={() => calculateShortages.mutate()} variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Розрахувати автоматично
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4">
              {shortages.map((shortage: any) => (
                <Card key={shortage.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{shortage.product?.name}</h3>
                        <p className="text-gray-600">SKU: {shortage.product?.sku}</p>
                        {shortage.warehouse && (
                          <p className="text-sm text-gray-500">Склад: {shortage.warehouse.name}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={priorityColors[shortage.priority as keyof typeof priorityColors]}>
                          {priorityLabels[shortage.priority as keyof typeof priorityLabels]}
                        </Badge>
                        <Badge className={statusColors[shortage.status as keyof typeof statusColors]}>
                          {statusLabels[shortage.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Потрібно</p>
                        <p className="font-semibold">{shortage.requiredQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Доступно</p>
                        <p className="font-semibold">{shortage.availableQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-600">Дефіцит</p>
                        <p className="font-semibold text-red-600">{shortage.shortageQuantity}</p>
                      </div>
                    </div>

                    {shortage.estimatedCost && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Орієнтовна вартість</p>
                        <p className="font-semibold">₴{parseFloat(shortage.estimatedCost).toFixed(2)}</p>
                      </div>
                    )}

                    {shortage.supplier && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Рекомендований постачальник</p>
                        <p className="font-semibold">{shortage.supplier.name}</p>
                        {shortage.supplier.contactPerson && (
                          <p className="text-xs text-gray-500">Контактна особа: {shortage.supplier.contactPerson}</p>
                        )}
                      </div>
                    )}

                    {shortage.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Примітки</p>
                        <p className="text-sm">{shortage.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(shortage)}
                        >
                          Редагувати
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(shortage.id)}
                        >
                          Видалити
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        {shortage.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createSupplierOrder.mutate(shortage.id)}
                            disabled={createSupplierOrder.isPending}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Створити замовлення
                          </Button>
                        )}
                        {shortage.status === "ordered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateShortageStatus.mutate({ id: shortage.id, status: 'delivered' })}
                            disabled={updateShortageStatus.isPending}
                          >
                            Відмітити як доставлено
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}