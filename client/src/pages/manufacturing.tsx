import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Factory, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  Edit,
  Trash2,
  Calendar,
  Package,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ManufacturingOrder {
  id: number;
  orderNumber: string;
  productId: number;
  recipeId?: number;
  plannedQuantity: string;
  producedQuantity: string;
  unit: string;
  status: string;
  priority: string;
  assignedWorkerId?: number;
  warehouseId?: number;
  startDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  materialCost: string;
  laborCost: string;
  overheadCost: string;
  totalCost: string;
  qualityRating: string;
  notes?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
  product?: any;
  recipe?: any;
  worker?: any;
  warehouse?: any;
}

export default function Manufacturing() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ManufacturingOrder | null>(null);
  const [formData, setFormData] = useState({
    productId: "",
    recipeId: "",
    plannedQuantity: "",
    unit: "шт",
    priority: "medium",
    assignedWorkerId: "",
    warehouseId: "",
    plannedEndDate: "",
    estimatedDuration: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/manufacturing-orders"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/manufacturing-orders", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Завдання на виготовлення створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити завдання на виготовлення",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/manufacturing-orders/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Завдання на виготовлення оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити завдання на виготовлення",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/manufacturing-orders/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Завдання на виготовлення видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити завдання на виготовлення",
        variant: "destructive",
      });
    },
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/manufacturing-orders/${id}/start`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Виробництво розпочато",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/manufacturing-orders/${id}/complete`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Виробництво завершено",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      productId: "",
      recipeId: "",
      plannedQuantity: "",
      unit: "шт",
      priority: "medium",
      assignedWorkerId: "",
      warehouseId: "",
      plannedEndDate: "",
      estimatedDuration: "",
      notes: ""
    });
    setEditingOrder(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.plannedQuantity) {
      toast({
        title: "Помилка",
        description: "Заповніть обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      productId: parseInt(formData.productId),
      recipeId: formData.recipeId ? parseInt(formData.recipeId) : undefined,
      assignedWorkerId: formData.assignedWorkerId ? parseInt(formData.assignedWorkerId) : undefined,
      warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : undefined,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      plannedEndDate: formData.plannedEndDate ? new Date(formData.plannedEndDate).toISOString() : undefined,
    };

    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (order: ManufacturingOrder) => {
    setEditingOrder(order);
    setFormData({
      productId: order.productId.toString(),
      recipeId: order.recipeId?.toString() || "",
      plannedQuantity: order.plannedQuantity,
      unit: order.unit,
      priority: order.priority,
      assignedWorkerId: order.assignedWorkerId?.toString() || "",
      warehouseId: order.warehouseId?.toString() || "",
      plannedEndDate: order.plannedEndDate ? new Date(order.plannedEndDate).toISOString().split('T')[0] : "",
      estimatedDuration: order.estimatedDuration?.toString() || "",
      notes: order.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, orderNumber: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити завдання ${orderNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "paused": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "in_progress": return <Factory className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      case "paused": return <Pause className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "urgent": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgress = (planned: string, produced: string) => {
    const plannedNum = parseFloat(planned);
    const producedNum = parseFloat(produced);
    return plannedNum > 0 ? Math.min((producedNum / plannedNum) * 100, 100) : 0;
  };

  const filteredOrders = orders.filter((order: ManufacturingOrder) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Виготовлення товарів</h1>
          <p className="text-gray-600">Управління завданнями на виробництво</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Створити завдання
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Редагувати завдання" : "Нове завдання на виготовлення"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productId">Товар *</Label>
                    <Select 
                      value={formData.productId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть товар" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product: any) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recipeId">Рецепт</Label>
                    <Select 
                      value={formData.recipeId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recipeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть рецепт" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без рецепту</SelectItem>
                        {recipes.map((recipe: any) => (
                          <SelectItem key={recipe.id} value={recipe.id.toString()}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plannedQuantity">Кількість до виробництва *</Label>
                    <Input
                      id="plannedQuantity"
                      type="number"
                      step="0.01"
                      value={formData.plannedQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, plannedQuantity: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Одиниця вимірювання</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Пріоритет</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низький</SelectItem>
                        <SelectItem value="medium">Середній</SelectItem>
                        <SelectItem value="high">Високий</SelectItem>
                        <SelectItem value="urgent">Терміновий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assignedWorkerId">Відповідальний</Label>
                    <Select 
                      value={formData.assignedWorkerId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedWorkerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть працівника" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Не призначено</SelectItem>
                        {workers.map((worker: any) => (
                          <SelectItem key={worker.id} value={worker.id.toString()}>
                            {worker.firstName} {worker.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warehouseId">Склад</Label>
                    <Select 
                      value={formData.warehouseId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть склад" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unspecified">Не вказано</SelectItem>
                        {warehouses.map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="plannedEndDate">Планова дата завершення</Label>
                    <Input
                      id="plannedEndDate"
                      type="date"
                      value={formData.plannedEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, plannedEndDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedDuration">Очікувана тривалість (хвилини)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Примітки</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Додаткові вказівки та примітки"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingOrder ? "Оновити" : "Створити"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Пошук за номером або товаром..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            <SelectItem value="pending">Очікує</SelectItem>
            <SelectItem value="in_progress">В роботі</SelectItem>
            <SelectItem value="completed">Завершено</SelectItem>
            <SelectItem value="paused">Пауза</SelectItem>
            <SelectItem value="cancelled">Скасовано</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Таблиця завдань */}
      <Card>
        <CardHeader>
          <CardTitle>Завдання на виготовлення</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Товар</TableHead>
                <TableHead>Кількість</TableHead>
                <TableHead>Прогрес</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Пріоритет</TableHead>
                <TableHead>Відповідальний</TableHead>
                <TableHead>Дата завершення</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order: ManufacturingOrder) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.product?.name}</div>
                      <div className="text-sm text-gray-500">{order.product?.sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{order.producedQuantity} / {order.plannedQuantity} {order.unit}</div>
                      <Progress 
                        value={getProgress(order.plannedQuantity, order.producedQuantity)} 
                        className="w-16 h-2 mt-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {Math.round(getProgress(order.plannedQuantity, order.producedQuantity))}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status === "pending" && "Очікує"}
                        {order.status === "in_progress" && "В роботі"}
                        {order.status === "completed" && "Завершено"}
                        {order.status === "cancelled" && "Скасовано"}
                        {order.status === "paused" && "Пауза"}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority === "low" && "Низький"}
                      {order.priority === "medium" && "Середній"}
                      {order.priority === "high" && "Високий"}
                      {order.priority === "urgent" && "Терміновий"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.worker ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {order.worker.firstName} {order.worker.lastName}
                      </div>
                    ) : (
                      <span className="text-gray-500">Не призначено</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.plannedEndDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.plannedEndDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-500">Не вказано</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startMutation.mutate(order.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(order.id, order.orderNumber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Завдання на виготовлення не знайдено
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}