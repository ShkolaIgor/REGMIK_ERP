import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Settings, Play, Check, X, Package, PackageOpen, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  operationType: z.string().min(1, "Тип операції обов'язковий"),
  productId: z.string().min(1, "Товар обов'язковий").transform(val => parseInt(val)),
  warehouseId: z.string().min(1, "Склад обов'язковий").transform(val => parseInt(val)),
  quantity: z.string().min(1, "Кількість обов'язкова"),
  unit: z.string().min(1, "Одиниця виміру обов'язкова"),
  plannedDate: z.string().optional(),
  performedBy: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AssemblyOperationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operationType: "assembly",
      productId: 0,
      warehouseId: 0,
      quantity: "",
      unit: "шт",
      plannedDate: "",
      performedBy: "",
      notes: "",
    },
  });

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ["/api/assembly-operations"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("/api/assembly-operations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      toast({ title: "Операцію створено успішно" });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData & { id: number }) => {
      await apiRequest(`/api/assembly-operations/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      toast({ title: "Операцію оновлено успішно" });
      setIsFormOpen(false);
      setEditingOperation(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/assembly-operations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      toast({ title: "Операцію видалено успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/assembly-operations/${id}/execute`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      toast({ title: "Операцію виконано успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingOperation) {
      updateMutation.mutate({ ...data, id: editingOperation.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (operation: any) => {
    setEditingOperation(operation);
    form.reset({
      operationType: operation.operationType,
      productId: operation.productId.toString(),
      warehouseId: operation.warehouseId.toString(),
      quantity: operation.quantity,
      unit: operation.unit,
      plannedDate: operation.plannedDate ? new Date(operation.plannedDate).toISOString().slice(0, 16) : "",
      performedBy: operation.performedBy || "",
      notes: operation.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю операцію?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleExecute = (id: number) => {
    if (confirm("Ви впевнені, що хочете виконати цю операцію? Це оновить інвентар.")) {
      executeMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      planned: "outline",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      planned: "Заплановано",
      in_progress: "Виконується",
      completed: "Завершено",
      cancelled: "Скасовано",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getOperationIcon = (type: string) => {
    return type === "assembly" ? <Package className="h-4 w-4" /> : <PackageOpen className="h-4 w-4" />;
  };

  const getOperationTypeLabel = (type: string) => {
    return type === "assembly" ? "Збірка" : "Розбірка";
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  const assemblyOperations = (operations as any[]).filter(op => op.operationType === "assembly");
  const disassemblyOperations = (operations as any[]).filter(op => op.operationType === "disassembly");

  // Статистичні дані
  const totalOperations = operations?.length || 0;
  const completedOperations = operations?.filter((op: any) => op.status === "completed").length || 0;
  const plannedOperations = operations?.filter((op: any) => op.status === "planned").length || 0;
  const inProgressOperations = operations?.filter((op: any) => op.status === "in_progress").length || 0;

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Settings className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Збірка та розбірка товарів
                </h1>
                <p className="text-blue-100 text-xl font-medium">Управління операціями збірки та розбірки виробів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Нова операція
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOperation ? "Редагувати операцію" : "Створити операцію"}
                    </DialogTitle>
                    <DialogDescription>
                      Заповніть дані для {editingOperation ? "редагування" : "створення"} операції збірки або розбірки
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="operationType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Тип операції</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Оберіть тип операції" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="assembly">Збірка</SelectItem>
                                  <SelectItem value="disassembly">Розбірка</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Товар</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Оберіть товар" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(products) && products.map((product: any) => (
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
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Кількість</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Одиниця виміру</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="шт" />
                              </FormControl>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Оберіть склад" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(warehouses) && warehouses.map((warehouse: any) => (
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="plannedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Планова дата</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="performedBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Виконавець</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ім'я виконавця" />
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
                              <Textarea {...field} placeholder="Додаткові примітки..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsFormOpen(false)}
                        >
                          Скасувати
                        </Button>
                        <Button type="submit">
                          {editingOperation ? "Оновити" : "Створити"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього операцій</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalOperations}</p>
                  <p className="text-xs text-blue-600">Загальна кількість операцій</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Settings className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Завершено</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{completedOperations}</p>
                  <p className="text-xs text-emerald-600">Завершені операції</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">В процесі</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{inProgressOperations}</p>
                  <p className="text-xs text-purple-600">Операції в роботі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Заплановано</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{plannedOperations}</p>
                  <p className="text-xs text-orange-600">Очікують виконання</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <div className="w-full">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Всі операції ({totalOperations})</TabsTrigger>
                  <TabsTrigger value="assembly">Збірка ({assemblyOperations.length})</TabsTrigger>
                  <TabsTrigger value="disassembly">Розбірка ({disassemblyOperations.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="space-y-4">
                    {(operations as any[]).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Немає операцій для відображення
                      </div>
                    ) : (
                      (operations as any[]).map((operation) => (
                        <Card key={operation.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {getOperationIcon(operation.operationType)}
                              <div>
                                <h3 className="font-semibold">
                                  {getOperationTypeLabel(operation.operationType)} - {operation.product?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {operation.quantity} {operation.unit} • {operation.warehouse?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(operation.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(operation)}
                              >
                                Редагувати
                              </Button>
                              {operation.status === "planned" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleExecute(operation.id)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Виконати
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(operation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="assembly" className="mt-6">
                  <div className="space-y-4">
                    {assemblyOperations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Немає операцій збірки для відображення
                      </div>
                    ) : (
                      assemblyOperations.map((operation) => (
                        <Card key={operation.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Package className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-semibold">
                                  Збірка - {operation.product?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {operation.quantity} {operation.unit} • {operation.warehouse?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(operation.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(operation)}
                              >
                                Редагувати
                              </Button>
                              {operation.status === "planned" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleExecute(operation.id)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Виконати
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(operation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="disassembly" className="mt-6">
                  <div className="space-y-4">
                    {disassemblyOperations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Немає операцій розбірки для відображення
                      </div>
                    ) : (
                      disassemblyOperations.map((operation) => (
                        <Card key={operation.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <PackageOpen className="h-5 w-5 text-orange-600" />
                              <div>
                                <h3 className="font-semibold">
                                  Розбірка - {operation.product?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {operation.quantity} {operation.unit} • {operation.warehouse?.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(operation.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(operation)}
                              >
                                Редагувати
                              </Button>
                              {operation.status === "planned" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleExecute(operation.id)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Виконати
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(operation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}