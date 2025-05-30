import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, Search, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  warehouseId: z.string().min(1, "Склад обов'язковий").transform(val => parseInt(val)),
  auditType: z.string().min(1, "Тип інвентаризації обов'язковий"),
  plannedDate: z.string().optional(),
  responsiblePersonId: z.string().min(1, "Відповідальна особа обов'язкова").transform(val => parseInt(val)),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const auditItemFormSchema = z.object({
  productId: z.string().min(1, "Товар обов'язковий").transform(val => parseInt(val)),
  systemQuantity: z.string().min(1, "Системна кількість обов'язкова"),
  countedQuantity: z.string().optional(),
  unit: z.string().min(1, "Одиниця виміру обов'язкова"),
  reason: z.string().optional(),
  countedBy: z.string().optional(),
  notes: z.string().optional(),
});

type AuditItemFormData = z.infer<typeof auditItemFormSchema>;

export default function InventoryAuditsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouseId: "0",
      auditType: "full",
      plannedDate: "",
      responsiblePersonId: "0",
      notes: "",
    },
  });

  const itemForm = useForm<AuditItemFormData>({
    resolver: zodResolver(auditItemFormSchema),
    defaultValues: {
      productId: "0",
      systemQuantity: "",
      countedQuantity: "",
      unit: "шт",
      reason: "",
      countedBy: "",
      notes: "",
    },
  });

  // Запити даних
  const { data: audits = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory-audits"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"],
  });

  const { data: auditItems = [] } = useQuery({
    queryKey: [`/api/inventory-audits/${selectedAudit?.id}/items`],
    enabled: !!selectedAudit?.id,
  });



  // Мутації
  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("/api/inventory-audits", {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits"] });
      setIsFormOpen(false);
      form.reset();
      toast({
        title: "Успішно",
        description: "Інвентаризацію створено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити інвентаризацію",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) =>
      apiRequest(`/api/inventory-audits/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits"] });
      setIsFormOpen(false);
      setEditingAudit(null);
      form.reset();
      toast({
        title: "Успішно",
        description: "Інвентаризацію оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити інвентаризацію",
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (data: AuditItemFormData & { auditId: number }) =>
      apiRequest(`/api/inventory-audits/${data.auditId}/items`, {
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory-audits/${selectedAudit?.id}/items`] });
      setIsItemFormOpen(false);
      itemForm.reset({
        productId: "0",
        systemQuantity: "",
        countedQuantity: "",
        unit: "шт",
        reason: "",
        countedBy: "",
        notes: "",
      });
      toast({
        title: "Успішно",
        description: "Позицію додано до інвентаризації",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати позицію",
        variant: "destructive",
      });
    },
  });

  const generateItemsMutation = useMutation({
    mutationFn: (auditId: number) =>
      apiRequest(`/api/inventory-audits/${auditId}/generate-items`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory-audits/${selectedAudit?.id}/items`] });
      toast({
        title: "Успішно",
        description: "Позиції згенеровано автоматично",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося згенерувати позиції",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: (data: { id: number; itemData: Partial<AuditItemFormData> }) =>
      apiRequest(`/api/inventory-audit-items/${data.id}`, {
        method: "PATCH",
        body: data.itemData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/inventory-audits/${selectedAudit?.id}/items`] });
      setIsItemFormOpen(false);
      setEditingItem(null);
      itemForm.reset({
        productId: "0",
        systemQuantity: "",
        countedQuantity: "",
        unit: "шт",
        reason: "",
        countedBy: "",
        notes: "",
      });
      toast({
        title: "Успішно",
        description: "Позицію оновлено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити позицію",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingAudit) {
      updateMutation.mutate({ id: editingAudit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (audit: any) => {
    setEditingAudit(audit);
    form.reset({
      warehouseId: audit.warehouseId?.toString() || "0",
      auditType: audit.auditType,
      plannedDate: audit.plannedDate ? new Date(audit.plannedDate).toISOString().slice(0, 16) : "",
      responsiblePersonId: audit.responsiblePersonId?.toString() || "0",
      notes: audit.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleAddItem = (data: AuditItemFormData) => {
    if (!selectedAudit) return;
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, itemData: data });
    } else {
      addItemMutation.mutate({ ...data, auditId: selectedAudit.id });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    itemForm.reset({
      productId: item.productId.toString(),
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity || "",
      unit: item.unit,
      reason: item.reason || "",
      countedBy: item.countedBy || "",
      notes: item.notes || "",
    });
    setIsItemFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      planned: "outline",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };

    const labels: { [key: string]: string } = {
      planned: "Заплановано",
      in_progress: "В процесі",
      completed: "Завершено",
      cancelled: "Скасовано",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getAuditTypeBadge = (type: string) => {
    const labels: { [key: string]: string } = {
      full: "Повна",
      partial: "Часткова",
      cycle_count: "Циклічний підрахунок",
    };

    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    );
  };

  if (isLoading) return <div>Завантаження...</div>;

  // Фільтрація інвентаризацій за пошуковим запитом
  const filteredAudits = audits.filter((audit: any) =>
    audit.auditNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (audit.warehouse?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (audit.responsiblePerson ? `${audit.responsiblePerson.firstName} ${audit.responsiblePerson.lastName}` : "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">Інвентаризації</h2>
            <Badge className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Онлайн
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Пошук інвентаризацій..."
                className="w-80 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { setEditingAudit(null); form.reset(); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Нова інвентаризація
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Кнопка для створення нової інвентаризації */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingAudit(null); form.reset(); }}>
                <Plus className="mr-2 h-4 w-4" />
                Нова інвентаризація
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingAudit ? "Редагувати інвентаризацію" : "Нова інвентаризація"}
              </DialogTitle>
              <DialogDescription>
                {editingAudit ? "Редагуйте дані інвентаризації" : "Створіть нову інвентаризацію товарних запасів"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Склад</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть склад" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Всі склади</SelectItem>
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

                <FormField
                  control={form.control}
                  name="auditType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип інвентаризації</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full">Повна інвентаризація</SelectItem>
                          <SelectItem value="partial">Часткова інвентаризація</SelectItem>
                          <SelectItem value="cycle_count">Циклічний підрахунок</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Планова дата</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="responsiblePersonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Відповідальна особа</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть відповідальну особу" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Не вказано</SelectItem>
                          {workers.map((worker: any) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.firstName} {worker.lastName} - {worker.position}
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Додаткові примітки..." {...field} />
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
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingAudit ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Список інвентаризацій</TabsTrigger>
          {selectedAudit && (
            <TabsTrigger value="items">
              Позиції ({selectedAudit.auditNumber})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Інвентаризації
              </CardTitle>
              <CardDescription>
                Управління всіма інвентаризаціями товарних запасів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№ Інвентаризації</TableHead>
                      <TableHead>Склад</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Планова дата</TableHead>
                      <TableHead>Відповідальний</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Інвентаризації не знайдено
                        </TableCell>
                      </TableRow>
                    ) : (
                      audits.map((audit: any) => (
                        <TableRow key={audit.id}>
                          <TableCell className="font-medium">
                            {audit.auditNumber}
                          </TableCell>
                          <TableCell>
                            {audit.warehouse?.name || "Всі склади"}
                          </TableCell>
                          <TableCell>
                            {getAuditTypeBadge(audit.auditType)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(audit.status)}
                          </TableCell>
                          <TableCell>
                            {audit.plannedDate
                              ? new Date(audit.plannedDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {audit.responsiblePerson 
                              ? `${audit.responsiblePerson.firstName} ${audit.responsiblePerson.lastName}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(audit)}
                              >
                                Редагувати
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAudit(audit);
                                }}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Позиції
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedAudit && (
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Позиції інвентаризації: {selectedAudit.auditNumber}
                </CardTitle>
                <CardDescription>
                  Управління позиціями для інвентаризації
                </CardDescription>
                <div className="flex space-x-2">
                  <Dialog open={isItemFormOpen} onOpenChange={setIsItemFormOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Додати позицію
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Редагувати позицію" : "Додати позицію"}</DialogTitle>
                        <DialogDescription>
                          {editingItem ? "Редагуйте дані позиції інвентаризації" : "Додайте товар до інвентаризації"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...itemForm}>
                        <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="space-y-4">
                          <FormField
                            control={itemForm.control}
                            name="productId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Товар</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Оберіть товар" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products.map((product: any) => (
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
                            control={itemForm.control}
                            name="systemQuantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Системна кількість</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={itemForm.control}
                            name="unit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Одиниця виміру</FormLabel>
                                <FormControl>
                                  <Input placeholder="шт, кг, л..." {...field} />
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
                                setIsItemFormOpen(false);
                                setEditingItem(null);
                                itemForm.reset({
                                  productId: "0",
                                  systemQuantity: "",
                                  countedQuantity: "",
                                  unit: "шт",
                                  reason: "",
                                  countedBy: "",
                                  notes: "",
                                });
                              }}
                            >
                              Скасувати
                            </Button>
                            <Button type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
                              {editingItem ? "Зберегти" : "Додати"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateItemsMutation.mutate(selectedAudit.id)}
                    disabled={generateItemsMutation.isPending}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Згенерувати автоматично
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Товар</TableHead>
                        <TableHead>Системна кількість</TableHead>
                        <TableHead>Фактична кількість</TableHead>
                        <TableHead>Відхилення</TableHead>
                        <TableHead>Одиниця</TableHead>
                        <TableHead>Підраховував</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4">
                            Позиції не знайдено
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.product?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.product?.sku}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.systemQuantity}</TableCell>
                            <TableCell>
                              {item.countedQuantity || "-"}
                            </TableCell>
                            <TableCell>
                              {item.variance ? (
                                <span className={item.variance > 0 ? "text-green-600" : "text-red-600"}>
                                  {item.variance > 0 ? "+" : ""}{item.variance}
                                  {item.variancePercent && ` (${item.variancePercent}%)`}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.countedBy || "-"}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                Редагувати
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      </div>
    </div>
  );
}