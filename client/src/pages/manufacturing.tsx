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
  sourceOrderId?: number;
  totalCost: string;
  qualityRating: string;
  notes?: string;
  batchNumber?: string;
  serialNumbers?: string[];
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
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);
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
  const [completeData, setCompleteData] = useState({
    producedQuantity: "",
    qualityRating: "good",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/manufacturing-orders"],
    staleTime: 0, // Дозволяємо оновлення даних
    gcTime: 0, // Не кешуємо дані між оновленнями
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

  // Запит для отримання кроків виробництва для вибраного завдання
  const { data: manufacturingSteps = [], refetch: refetchSteps } = useQuery({
    queryKey: ["/api/manufacturing-orders", selectedOrder?.id, "steps"],
    enabled: !!selectedOrder?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating manufacturing order with data:", data);
      return apiRequest("/api/manufacturing-orders", "POST", data);
    },
    onSuccess: (result) => {
      console.log("Manufacturing order created successfully:", result);
      console.log("Invalidating cache for /api/manufacturing-orders");
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      console.log("Cache invalidated, refetching data...");
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Завдання на виготовлення створено",
      });
    },
    onError: (error) => {
      console.error("Error creating manufacturing order:", error);
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
      setIsCompleteDialogOpen(false);
      toast({
        title: "Успіх",
        description: "Виробництво завершено",
      });
    },
  });

  const startStepMutation = useMutation({
    mutationFn: async (stepId: number) => 
      apiRequest(`/api/manufacturing-steps/${stepId}/start`, "POST"),
    onSuccess: () => {
      refetchSteps();
      toast({
        title: "Успіх",
        description: "Крок виробництва розпочато",
      });
    },
  });

  const completeStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: number; data: any }) => 
      apiRequest(`/api/manufacturing-steps/${stepId}/complete`, "POST", data),
    onSuccess: () => {
      refetchSteps();
      toast({
        title: "Успіх",
        description: "Крок виробництва завершено",
      });
    },
  });

  const generateSerialNumbersMutation = useMutation({
    mutationFn: async (orderId: number) => 
      apiRequest(`/api/manufacturing-orders/${orderId}/generate-serial-numbers`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Серійні номери згенеровано",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося згенерувати серійні номери",
        variant: "destructive",
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Очікує";
      case "in_progress": return "У виробництві";
      case "completed": return "Завершено";
      case "cancelled": return "Скасовано";
      case "paused": return "Пауза";
      default: return status;
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
                <TableHead>Джерельне замовлення</TableHead>
                <TableHead>Серійні номери</TableHead>
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
                        {getStatusText(order.status)}
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
                    {order.sourceOrderId ? (
                      <div className="text-sm">
                        <div className="font-medium text-blue-600">
                          Замовлення #{order.sourceOrder?.orderNumber || order.sourceOrderId}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Автоматично створено
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Ручне створення</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.serialNumbers && order.serialNumbers.length > 0 ? (
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {order.serialNumbers.length} номерів
                        </div>
                        <div className="text-gray-600 leading-tight">
                          <div className="text-xs">{order.serialNumbers[0]}</div>
                          {order.serialNumbers.length > 1 && (
                            <div className="text-xs">-</div>
                          )}
                          {order.serialNumbers.length > 1 && (
                            <div className="text-xs">{order.serialNumbers[order.serialNumbers.length - 1]}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateSerialNumbersMutation.mutate(order.id)}
                        disabled={generateSerialNumbersMutation.isPending}
                        className="h-8"
                      >
                        Згенерувати
                      </Button>
                    )}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDetailsDialogOpen(true);
                        }}
                        title="Деталі"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      {order.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startMutation.mutate(order.id)}
                          title="Розпочати виробництво"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === "in_progress" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setCompleteData({
                              producedQuantity: order.producedQuantity,
                              qualityRating: "good",
                              notes: ""
                            });
                            setIsCompleteDialogOpen(true);
                          }}
                          title="Завершити виробництво"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(order)}
                        title="Редагувати"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(order.id, order.orderNumber)}
                        title="Видалити"
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

      {/* Діалог деталей виробничого завдання */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Деталі виробничого завдання #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2 space-y-6">
              {/* Основна інформація */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5" />
                    Основна інформація
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Товар</Label>
                    <div className="mt-1">
                      <div className="font-medium">{selectedOrder.product?.name}</div>
                      <div className="text-sm text-gray-500">{selectedOrder.product?.sku}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Статус</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(selectedOrder.status)}
                          {selectedOrder.status === "pending" && "Очікує"}
                          {selectedOrder.status === "in_progress" && "В роботі"}
                          {selectedOrder.status === "completed" && "Завершено"}
                          {selectedOrder.status === "cancelled" && "Скасовано"}
                          {selectedOrder.status === "paused" && "Пауза"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Кількість</Label>
                    <div className="mt-1">
                      <div className="text-lg font-semibold">
                        {selectedOrder.producedQuantity} / {selectedOrder.plannedQuantity} {selectedOrder.unit}
                      </div>
                      <Progress 
                        value={getProgress(selectedOrder.plannedQuantity, selectedOrder.producedQuantity)} 
                        className="w-full h-2 mt-2"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        {Math.round(getProgress(selectedOrder.plannedQuantity, selectedOrder.producedQuantity))}% завершено
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Пріоритет</Label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(selectedOrder.priority)}>
                        {selectedOrder.priority === "low" && "Низький"}
                        {selectedOrder.priority === "medium" && "Середній"}
                        {selectedOrder.priority === "high" && "Високий"}
                        {selectedOrder.priority === "urgent" && "Терміновий"}
                      </Badge>
                    </div>
                  </div>
                  {selectedOrder.worker && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Відповідальний</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedOrder.worker.firstName} {selectedOrder.worker.lastName}
                      </div>
                    </div>
                  )}
                  {selectedOrder.warehouse && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Склад</Label>
                      <div className="mt-1">
                        {selectedOrder.warehouse.name}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Витрати та вартість */}
              <Card>
                <CardHeader>
                  <CardTitle>Витрати та вартість</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Вартість матеріалів</Label>
                      <div className="mt-1 text-lg font-semibold">
                        ₴{parseFloat(selectedOrder.materialCost).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Вартість праці</Label>
                      <div className="mt-1 text-lg font-semibold">
                        ₴{parseFloat(selectedOrder.laborCost).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Накладні витрати</Label>
                      <div className="mt-1 text-lg font-semibold">
                        ₴{parseFloat(selectedOrder.overheadCost).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Загальна вартість</Label>
                      <div className="mt-1 text-lg font-semibold text-green-600">
                        ₴{parseFloat(selectedOrder.totalCost).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Часові показники */}
              {(selectedOrder.startDate || selectedOrder.plannedEndDate || selectedOrder.estimatedDuration) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Часові показники
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {selectedOrder.startDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Дата початку</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedOrder.startDate).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedOrder.plannedEndDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Планова дата завершення</Label>
                        <div className="mt-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedOrder.plannedEndDate).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedOrder.estimatedDuration && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Планова тривалість</Label>
                        <div className="mt-1">
                          {Math.floor(selectedOrder.estimatedDuration / 60)} год {selectedOrder.estimatedDuration % 60} хв
                        </div>
                      </div>
                    )}
                    {selectedOrder.actualDuration && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Фактична тривалість</Label>
                        <div className="mt-1">
                          {Math.floor(selectedOrder.actualDuration / 60)} год {selectedOrder.actualDuration % 60} хв
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Стадії виробництва */}
              {manufacturingSteps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="h-5 w-5" />
                      Стадії виробництва
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {manufacturingSteps.map((step: any, index: number) => (
                        <div key={step.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                step.status === 'completed' ? 'bg-green-100 text-green-700' :
                                step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {step.stepNumber}
                              </div>
                              <div>
                                <h4 className="font-medium">{step.name}</h4>
                                {step.description && (
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                step.status === 'completed' ? 'bg-green-100 text-green-700' :
                                step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }>
                                {step.status === 'pending' && 'Очікує'}
                                {step.status === 'in_progress' && 'В роботі'}
                                {step.status === 'completed' && 'Завершено'}
                                {step.status === 'skipped' && 'Пропущено'}
                              </Badge>
                              {step.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startStepMutation.mutate(step.id)}
                                  disabled={startStepMutation.isPending}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {step.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => completeStepMutation.mutate({ 
                                    stepId: step.id, 
                                    data: { qualityCheckPassed: true } 
                                  })}
                                  disabled={completeStepMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            {step.estimatedDuration && (
                              <div>
                                <span className="text-gray-600">Планова тривалість:</span>
                                <div>{Math.floor(step.estimatedDuration / 60)} год {step.estimatedDuration % 60} хв</div>
                              </div>
                            )}
                            {step.actualDuration && (
                              <div>
                                <span className="text-gray-600">Фактична тривалість:</span>
                                <div>{Math.floor(step.actualDuration / 60)} год {step.actualDuration % 60} хв</div>
                              </div>
                            )}
                            {step.startTime && (
                              <div>
                                <span className="text-gray-600">Розпочато:</span>
                                <div>{new Date(step.startTime).toLocaleString()}</div>
                              </div>
                            )}
                            {step.endTime && (
                              <div>
                                <span className="text-gray-600">Завершено:</span>
                                <div>{new Date(step.endTime).toLocaleString()}</div>
                              </div>
                            )}
                            {step.worker && (
                              <div>
                                <span className="text-gray-600">Відповідальний:</span>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {step.worker.firstName} {step.worker.lastName}
                                </div>
                              </div>
                            )}
                            {step.qualityCheckPassed !== null && step.status === 'completed' && (
                              <div>
                                <span className="text-gray-600">Контроль якості:</span>
                                <div className={step.qualityCheckPassed ? 'text-green-600' : 'text-red-600'}>
                                  {step.qualityCheckPassed ? 'Пройдено' : 'Не пройдено'}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {step.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                              <span className="text-gray-600 font-medium">Примітки:</span>
                              <div>{step.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Примітки */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Примітки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedOrder.notes}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Діалог завершення виробництва */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Завершити виробництво #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedOrder) {
                completeMutation.mutate({
                  id: selectedOrder.id,
                  data: completeData
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="producedQuantity">Фактично вироблено *</Label>
              <Input
                id="producedQuantity"
                type="number"
                step="0.01"
                value={completeData.producedQuantity}
                onChange={(e) => setCompleteData(prev => ({ ...prev, producedQuantity: e.target.value }))}
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                Планувалось: {selectedOrder?.plannedQuantity} {selectedOrder?.unit}
              </div>
            </div>

            <div>
              <Label htmlFor="qualityRating">Оцінка якості</Label>
              <Select 
                value={completeData.qualityRating} 
                onValueChange={(value) => setCompleteData(prev => ({ ...prev, qualityRating: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Відмінно</SelectItem>
                  <SelectItem value="good">Добре</SelectItem>
                  <SelectItem value="acceptable">Задовільно</SelectItem>
                  <SelectItem value="poor">Незадовільно</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="completeNotes">Примітки</Label>
              <Textarea
                id="completeNotes"
                value={completeData.notes}
                onChange={(e) => setCompleteData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Додаткові примітки про завершення виробництва..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCompleteDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {completeMutation.isPending ? "Завершення..." : "Завершити виробництво"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}