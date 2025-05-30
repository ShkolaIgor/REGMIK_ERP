import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Settings, Play, Check, X, Package, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      productId: "0",
      warehouseId: "0",
      quantity: "",
      unit: "шт",
      plannedDate: "",
      performedBy: "",
      notes: "",
    },
  });

  // Запити даних
  const { data: operations = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/assembly-operations"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  // Мутації
  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("/api/assembly-operations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      setIsFormOpen(false);
      form.reset();
      toast({ title: "Операцію створено успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка створення операції",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      apiRequest(`/api/assembly-operations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      setIsFormOpen(false);
      setEditingOperation(null);
      form.reset();
      toast({ title: "Операцію оновлено успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка оновлення операції",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/assembly-operations/${id}/execute`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Операцію виконано успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка виконання операції",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/assembly-operations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-operations"] });
      toast({ title: "Операцію видалено успішно" });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка видалення операції",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingOperation) {
      updateMutation.mutate({ id: editingOperation.id, data });
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Збірка та розбірка товарів</h1>
          <p className="text-muted-foreground">
            Управління операціями збірки та розбірки виробів
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть тип операції" />
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
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть товар" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(products as any[])?.map((product: any) => (
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
                    name="warehouseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Склад</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть склад" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(warehouses as any[])?.map((warehouse: any) => (
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
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Кількість</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0" {...field} />
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
                          <Input placeholder="шт" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plannedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Планована дата</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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
                          <Input placeholder="Ім'я виконавця" {...field} />
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
                        <Textarea placeholder="Додаткові примітки" {...field} />
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
                      setIsFormOpen(false);
                      setEditingOperation(null);
                      form.reset();
                    }}
                  >
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingOperation ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assembly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assembly">
            <Package className="h-4 w-4 mr-2" />
            Збірка товарів
          </TabsTrigger>
          <TabsTrigger value="disassembly">
            <PackageOpen className="h-4 w-4 mr-2" />
            Розбірка товарів
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assembly">
          <div className="grid gap-4">
            {assemblyOperations.map((operation: any) => (
              <Card key={operation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getOperationIcon(operation.operationType)}
                        {operation.product?.name}
                        <span className="text-sm text-muted-foreground">
                          ({operation.product?.sku})
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Склад: {operation.warehouse?.name} • 
                        Кількість: {operation.quantity} {operation.unit}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(operation.status)}
                      <div className="flex gap-1">
                        {operation.status === "planned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecute(operation.id)}
                            disabled={executeMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(operation)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(operation.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {(operation.notes || operation.performedBy || operation.plannedDate) && (
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {operation.plannedDate && (
                        <div>
                          <strong>Планована дата:</strong> {new Date(operation.plannedDate).toLocaleString()}
                        </div>
                      )}
                      {operation.performedBy && (
                        <div>
                          <strong>Виконавець:</strong> {operation.performedBy}
                        </div>
                      )}
                      {operation.notes && (
                        <div>
                          <strong>Примітки:</strong> {operation.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {assemblyOperations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Немає операцій збірки</h3>
                  <p className="text-muted-foreground mb-4">
                    Створіть першу операцію збірки товарів
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Створити операцію
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disassembly">
          <div className="grid gap-4">
            {disassemblyOperations.map((operation: any) => (
              <Card key={operation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getOperationIcon(operation.operationType)}
                        {operation.product?.name}
                        <span className="text-sm text-muted-foreground">
                          ({operation.product?.sku})
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Склад: {operation.warehouse?.name} • 
                        Кількість: {operation.quantity} {operation.unit}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(operation.status)}
                      <div className="flex gap-1">
                        {operation.status === "planned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecute(operation.id)}
                            disabled={executeMutation.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEdit(operation)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(operation.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {(operation.notes || operation.performedBy || operation.plannedDate) && (
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {operation.plannedDate && (
                        <div>
                          <strong>Планована дата:</strong> {new Date(operation.plannedDate).toLocaleString()}
                        </div>
                      )}
                      {operation.performedBy && (
                        <div>
                          <strong>Виконавець:</strong> {operation.performedBy}
                        </div>
                      )}
                      {operation.notes && (
                        <div>
                          <strong>Примітки:</strong> {operation.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            {disassemblyOperations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Немає операцій розбірки</h3>
                  <p className="text-muted-foreground mb-4">
                    Створіть першу операцію розбірки товарів
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Створити операцію
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}