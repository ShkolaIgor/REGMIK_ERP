import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Package, Factory, CheckCircle, ArrowRight, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Компонент для відображення замовлень по товару
function OrdersByProduct({ productId }: { productId: number }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders-by-product", productId],
    queryFn: () => fetch(`/api/orders-by-product/${productId}`).then(res => res.json()),
  });

  if (isLoading) {
    return <div className="p-4 text-center">Завантаження...</div>;
  }

  if (orders.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Замовлень не знайдено</div>;
  }

  // Видаляємо дублікати за orderNumber
  const uniqueOrders = orders.filter((order: any, index: number, self: any[]) => 
    index === self.findIndex((o: any) => o.orderNumber === order.orderNumber)
  );

  return (
    <div className="space-y-2">
      <h4 className="font-medium mb-2">Замовлення з цим товаром:</h4>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {uniqueOrders.map((order: any) => (
          <div key={order.orderNumber} className="border rounded p-2 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{order.orderNumber}</div>
                <div className="text-muted-foreground">
                  {order.customerName || 'Без клієнта'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{order.quantity} шт</div>
                <div className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                </div>
              </div>
            </div>
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {order.status}
              </Badge>
              <span className="ml-2 text-xs text-muted-foreground">
                {order.totalAmount} грн
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderedProducts() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productionNotes, setProductionNotes] = useState("");
  const [productionQuantity, setProductionQuantity] = useState<number>(0);
  const [completeQuantity, setCompleteQuantity] = useState<number>(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState("");
  const [isProductionDialogOpen, setIsProductionDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isSupplierOrderDialogOpen, setIsSupplierOrderDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  
  // Стан для фільтрації та пошуку
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderedProducts = [], isLoading } = useQuery({
    queryKey: ["/api/ordered-products-info"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  // Фільтрована та відсортована продукція
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...(orderedProducts as any[])];
    
    // Пошук
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Фільтр за статусом
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => {
        const shortage = Math.max(0, item.totalOrdered - item.available - item.inProduction);
        const needsProduction = item.needsProduction;
        const inProduction = item.inProduction > 0;
        
        switch (statusFilter) {
          case "shortage":
            return shortage > 0;
          case "production":
            return needsProduction && shortage === 0;
          case "inProgress":
            return inProduction;
          case "sufficient":
            return !needsProduction && shortage === 0 && !inProduction;
          default:
            return true;
        }
      });
    }
    
    // Сортування
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case "quantity":
          aValue = a.totalOrdered;
          bValue = b.totalOrdered;
          break;
        case "shortage":
          aValue = Math.max(0, a.totalOrdered - a.available - a.inProduction);
          bValue = Math.max(0, b.totalOrdered - b.available - b.inProduction);
          break;
        case "available":
          aValue = a.available;
          bValue = b.available;
          break;
        default:
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [orderedProducts, searchTerm, statusFilter, sortBy, sortOrder]);

  const sendToProductionMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; notes?: string }) => {
      return await apiRequest("/api/send-to-production", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Товар передано у виробництво",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-tasks"] });
      setIsProductionDialogOpen(false);
      setSelectedProduct(null);
      setProductionNotes("");
      setProductionQuantity(0);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося передати товар у виробництво",
        variant: "destructive",
      });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: string; warehouseId: number }) => {
      return await apiRequest("/api/complete-order", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Товар укомплектовано зі складу",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCompleteDialogOpen(false);
      setSelectedProduct(null);
      setCompleteQuantity(0);
      setSelectedWarehouse("");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося укомплектувати товар",
        variant: "destructive",
      });
    },
  });

  const createSupplierOrderMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: string; notes?: string }) => {
      return await apiRequest("/api/create-supplier-order-for-shortage", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Створено замовлення постачальнику",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      setIsSupplierOrderDialogOpen(false);
      setSelectedProduct(null);
      setOrderQuantity(0);
      setOrderNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити замовлення постачальнику",
        variant: "destructive",
      });
    },
  });

  const deleteOrderedProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest(`/api/ordered-products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Замовлений товар видалено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити замовлений товар",
        variant: "destructive",
      });
    },
  });

  const handleSendToProduction = () => {
    if (!selectedProduct || productionQuantity <= 0) return;

    sendToProductionMutation.mutate({
      productId: selectedProduct.productId,
      quantity: productionQuantity,
      notes: productionNotes,
    });
  };

  const handleCompleteOrder = () => {
    if (!selectedProduct || completeQuantity <= 0 || !selectedWarehouse) return;

    completeOrderMutation.mutate({
      productId: selectedProduct.productId,
      quantity: completeQuantity.toString(),
      warehouseId: parseInt(selectedWarehouse),
    });
  };

  const handleCreateSupplierOrder = () => {
    if (!selectedProduct || orderQuantity <= 0) return;

    createSupplierOrderMutation.mutate({
      productId: selectedProduct.productId,
      quantity: orderQuantity.toString(),
      notes: orderNotes,
    });
  };

  const getStatusColor = (needsProduction: boolean, shortage: number) => {
    if (shortage > 0) return "destructive";
    if (needsProduction) return "secondary";
    return "default";
  };

  const getStatusText = (needsProduction: boolean, shortage: number, inProduction: number) => {
    if (shortage > 0) return `Дефіцит: ${shortage} шт.`;
    if (inProduction > 0) return `У виробництві: ${inProduction} шт.`;
    if (needsProduction) return "Потрібне виробництво";
    return "Достатньо на складі";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Замовлені товари</h1>
          <p className="text-muted-foreground">
            Інформація про наявність замовлених товарів та їх статус виробництва
          </p>
        </div>
      </div>

      {/* Фільтри та пошук */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фільтри та пошук
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Пошук */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Пошук за назвою або артикулом..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Фільтр за статусом */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                <SelectItem value="shortage">Дефіцит</SelectItem>
                <SelectItem value="production">Потрібне виробництво</SelectItem>
                <SelectItem value="inProgress">У виробництві</SelectItem>
                <SelectItem value="sufficient">Достатньо на складі</SelectItem>
              </SelectContent>
            </Select>

            {/* Сортування */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Сортувати за" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Назвою</SelectItem>
                <SelectItem value="quantity">Кількістю замовлено</SelectItem>
                <SelectItem value="shortage">Дефіцитом</SelectItem>
                <SelectItem value="available">Наявністю</SelectItem>
              </SelectContent>
            </Select>

            {/* Порядок сортування */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2"
            >
              {sortOrder === "asc" ? (
                <>
                  <ArrowUp className="h-4 w-4" />
                  За зростанням
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4" />
                  За спаданням
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Немає активних замовлень</h3>
            <p className="text-muted-foreground text-center">
              Коли будуть створені замовлення з товарами, вони з'являться тут
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всього товарів</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(orderedProducts as any[]).length}</div>
                <p className="text-xs text-muted-foreground">
                  Відфільтровано: {filteredAndSortedProducts.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Потребують виробництва</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(orderedProducts as any[]).filter((p: any) => p.needsProduction).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">З дефіцитом</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(orderedProducts as any[]).filter((p: any) => p.shortage > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список замовлених товарів</CardTitle>
              <CardDescription>
                Детальна інформація про наявність та статус виробництва
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Замовлено</TableHead>
                    <TableHead>На складі</TableHead>
                    <TableHead>У виробництві</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.map((item: any) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="link" className="p-0 h-auto font-medium text-left">
                                {item.product.name}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <OrdersByProduct productId={item.productId} />
                            </PopoverContent>
                          </Popover>
                          <div className="text-sm text-muted-foreground">
                            {item.product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.totalOrdered}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={item.totalAvailable >= item.totalOrdered ? "text-green-600" : "text-red-600"}>
                            {item.totalAvailable}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={item.inProduction > 0 ? "text-blue-600" : "text-muted-foreground"}>
                            {item.inProduction}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.needsProduction, item.shortage)}>
                          {getStatusText(item.needsProduction, item.shortage, item.inProduction)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {/* Кнопка укомплектування зі складу */}
                          {item.totalAvailable > 0 && (
                            <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(item);
                                    setCompleteQuantity(Math.min(item.totalAvailable, item.totalOrdered));
                                    setSelectedWarehouse("");
                                    setIsCompleteDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Укомплектувати
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Укомплектувати товар</DialogTitle>
                                  <DialogDescription>
                                    Списати товар зі складу для виконання замовлення
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="complete-quantity">Кількість для укомплектування</Label>
                                    <Input
                                      id="complete-quantity"
                                      type="number"
                                      value={completeQuantity}
                                      onChange={(e) => setCompleteQuantity(parseInt(e.target.value) || 0)}
                                      min="1"
                                      max={item.totalAvailable}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Доступно на складі: {item.totalAvailable} {item.product.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="warehouse">Склад</Label>
                                    <select
                                      id="warehouse"
                                      value={selectedWarehouse}
                                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                                      className="w-full p-2 border rounded-md"
                                    >
                                      <option value="">Виберіть склад</option>
                                      {warehouses.map((warehouse: any) => (
                                        <option key={warehouse.id} value={warehouse.id}>
                                          {warehouse.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleCompleteOrder}
                                    disabled={completeOrderMutation.isPending || !selectedWarehouse}
                                  >
                                    {completeOrderMutation.isPending ? "Обробка..." : "Укомплектувати"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Кнопка передачі у виробництво */}
                          {item.needsProduction && (
                            <Dialog open={isProductionDialogOpen} onOpenChange={setIsProductionDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(item);
                                    setProductionQuantity(Math.max(1, item.shortage || (item.totalOrdered - item.totalAvailable)));
                                    setIsProductionDialogOpen(true);
                                  }}
                                >
                                  <Factory className="h-4 w-4 mr-2" />
                                  У виробництво
                                </Button>
                              </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Передати у виробництво</DialogTitle>
                                <DialogDescription>
                                  Створити завдання на виробництво для товару "{selectedProduct?.product.name}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="quantity">Кількість для виробництва</Label>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      value={productionQuantity}
                                      onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 0)}
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Одиниця вимірювання</Label>
                                    <Input value={selectedProduct?.product.unit || ""} disabled />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Примітки</Label>
                                  <Textarea
                                    id="notes"
                                    value={productionNotes}
                                    onChange={(e) => setProductionNotes(e.target.value)}
                                    placeholder="Додаткові примітки для виробництва..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleSendToProduction}
                                  disabled={sendToProductionMutation.isPending || productionQuantity <= 0}
                                >
                                  {sendToProductionMutation.isPending ? (
                                    "Створення..."
                                  ) : (
                                    <>
                                      <ArrowRight className="h-4 w-4 mr-2" />
                                      Створити завдання
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}

                          {/* Кнопка створення замовлення при дефіциті */}
                          {item.shortage > 0 && (
                            <Dialog open={isSupplierOrderDialogOpen} onOpenChange={setIsSupplierOrderDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct(item);
                                    setOrderQuantity(item.shortage);
                                    setOrderNotes("");
                                    setIsSupplierOrderDialogOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Замовити
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Створити замовлення постачальнику</DialogTitle>
                                  <DialogDescription>
                                    Автоматично створити замовлення постачальнику для покриття дефіциту товару
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="order-quantity">Кількість для замовлення</Label>
                                    <Input
                                      id="order-quantity"
                                      type="number"
                                      value={orderQuantity}
                                      onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                                      min="1"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Дефіцит: {item.shortage} {item.product.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="order-notes">Примітки до замовлення</Label>
                                    <Textarea
                                      id="order-notes"
                                      value={orderNotes}
                                      onChange={(e) => setOrderNotes(e.target.value)}
                                      placeholder="Опціональні примітки..."
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleCreateSupplierOrder}
                                    disabled={createSupplierOrderMutation.isPending || orderQuantity <= 0}
                                  >
                                    {createSupplierOrderMutation.isPending ? "Створення..." : "Створити замовлення"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {/* Кнопка видалення замовленого товару */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProductToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Видалити
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Діалог підтвердження видалення */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Підтвердити видалення</DialogTitle>
            <DialogDescription>
              Ви дійсно хочете видалити замовлений товар "{productToDelete?.product?.name}"?
              Ця дія призведе до видалення всіх пов'язаних замовлень і виробничих завдань.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProductToDelete(null);
              }}
            >
              Скасувати
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (productToDelete) {
                  deleteOrderedProductMutation.mutate(productToDelete.productId);
                }
              }}
              disabled={deleteOrderedProductMutation.isPending}
            >
              {deleteOrderedProductMutation.isPending ? "Видалення..." : "Видалити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}