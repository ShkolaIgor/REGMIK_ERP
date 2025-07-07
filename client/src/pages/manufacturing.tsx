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
  Square,
  Edit,
  Trash2,
  Calendar,
  Package,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import ComponentDeductions from "@/components/ComponentDeductions";

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

  // Статистичні дані
  const totalOrders = (orders as ManufacturingOrder[]).length;
  const activeOrders = (orders as ManufacturingOrder[]).filter((order: ManufacturingOrder) => order.status === "in_progress").length;
  const completedOrders = (orders as ManufacturingOrder[]).filter((order: ManufacturingOrder) => order.status === "completed").length;
  const pendingOrders = (orders as ManufacturingOrder[]).filter((order: ManufacturingOrder) => order.status === "pending").length;

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

  const { data: manufacturingSteps = [], refetch: refetchSteps } = useQuery({
    queryKey: ["/api/manufacturing-steps", selectedOrder?.id],
    enabled: !!selectedOrder?.id && isDetailsDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/manufacturing-orders", "POST", data);
    },
    onSuccess: (result) => {
      console.log("Manufacturing order created successfully:", result);
      console.log("Invalidating cache for /api/manufacturing-orders");
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
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

  const stopMutation = useMutation({
    mutationFn: async (orderId: number) => 
      apiRequest(`/api/manufacturing-orders/${orderId}/stop`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      toast({
        title: "Успіх",
        description: "Виробництво зупинено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося зупинити виробництво",
        variant: "destructive",
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (orderId: number) => 
      apiRequest(`/api/manufacturing-orders/${orderId}/pause`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Виробництво призупинено",
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (orderId: number) => 
      apiRequest(`/api/manufacturing-orders/${orderId}/resume`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-orders"] });
      toast({
        title: "Успіх",
        description: "Виробництво відновлено",
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
    
    console.log("Form data before validation:", formData);
    
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
    
    console.log("Submit data after transformation:", submitData);

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "paused": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Очікує";
      case "in_progress": return "В роботі";
      case "paused": return "Призупинено";
      case "completed": return "Завершено";
      case "cancelled": return "Скасовано";
      default: return status;
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

  const filteredOrders = (orders as ManufacturingOrder[]).filter((order: ManufacturingOrder) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section  sticky top-0 z-40*/}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Factory className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Виготовлення товарів
                    </h1>
                    <p className="text-gray-500 mt-1">Управління виробничими завданнями та контроль якості</p>
                  </div>
                </div>
            <div className="flex items-center space-x-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Створити завдання
                </Button>
              </DialogTrigger>
            </Dialog>
            </div>
              </div>
          </div>
        </header>


      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Factory className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього завдань</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalOrders}</p>
                  <p className="text-xs text-blue-600">Створено завдань</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Factory className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">В роботі</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{activeOrders}</p>
                  <p className="text-xs text-green-600">Активні завдання</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Очікують</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{pendingOrders}</p>
                  <p className="text-xs text-yellow-600">На початок</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Завершені</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{completedOrders}</p>
                  <p className="text-xs text-purple-600">Готово</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Пошук за номером замовлення або назвою товару..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="pending">Очікує</SelectItem>
                  <SelectItem value="in_progress">В роботі</SelectItem>
                  <SelectItem value="paused">Призупинено</SelectItem>
                  <SelectItem value="completed">Завершено</SelectItem>
                  <SelectItem value="cancelled">Скасовано</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Orders Table */}
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
                  <TableHead>Джерело</TableHead>
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
                      <div className="space-y-1">
                        <Progress value={getProgress(order.plannedQuantity, order.producedQuantity)} className="w-20" />
                        <span className="text-xs text-gray-500">
                          {Math.round(getProgress(order.plannedQuantity, order.producedQuantity))}%
                        </span>
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
                            Замовлення #{order.sourceOrderId}
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
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => stopMutation.mutate(order.id)}
                              disabled={stopMutation.isPending}
                              title="Зупинити виробництво"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Square className="h-4 w-4" />
                            </Button>
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
                          </>
                        )}
                        {order.status === "paused" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startMutation.mutate(order.id)}
                            disabled={startMutation.isPending}
                            title="Відновити виробництво"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Play className="h-4 w-4" />
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        {(products as any[]).map((product: any) => (
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
                        {(recipes as any[]).map((recipe: any) => (
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
                        {(workers as any[]).map((worker: any) => (
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
                        {(warehouses as any[]).map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="plannedEndDate">Планова дата завершення</Label>
                    <UkrainianDatePicker
                      date={formData.plannedEndDate ? new Date(formData.plannedEndDate) : undefined}
                      onDateChange={(date) => setFormData(prev => ({ ...prev, plannedEndDate: date ? date.toISOString().split('T')[0] : '' }))}
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
              {(manufacturingSteps as any[]).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="h-5 w-5" />
                      Стадії виробництва
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(manufacturingSteps as any[]).map((step: any, index: number) => (
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

              {/* Списання компонентів */}
              {selectedOrder.sourceOrderId && (
                <ComponentDeductions orderId={selectedOrder.sourceOrderId} />
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