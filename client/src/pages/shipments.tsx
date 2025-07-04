import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CarrierSelect } from "@/components/CarrierSelect";
import { NovaPoshtaIntegration } from "@/components/NovaPoshtaIntegration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
import { Plus, Package, Truck, MapPin, Calendar, Search, Edit, Trash2 } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  totalAmount: string;
  createdAt: Date | null;
}

interface Carrier {
  id: number;
  name: string;
}

interface ShipmentItem {
  id: number;
  shipmentId: number;
  productId: number;
  quantity: number;
  productName: string;
  productSku: string;
  serialNumbers?: string[];
}

interface ShipmentDetails {
  id: number;
  shipmentNumber: string;
  status: string;
  trackingNumber: string | null;
  weight: string | null;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  notes: string | null;
  shippedAt: Date | null;
  carrier: { name: string } | null;
  order: { orderNumber: string; customerName: string } | null;
  items: ShipmentItem[];
}

interface Shipment {
  id: number;
  orderId: number;
  shipmentNumber: string;
  trackingNumber: string | null;
  carrierId: number | null;
  carrier?: Carrier;
  recipientWarehouseAddress: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  shippingCost: string | null;
  declaredValue: string | null;
  status: string;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  notes: string | null;
  createdAt: Date | null;
  shippedAt: Date | null;
  order?: Order;
}

const statusLabels: Record<string, string> = {
  preparing: "Підготовка",
  shipped: "Відправлено",
  in_transit: "В дорозі",
  delivered: "Доставлено"
};

const statusColors: Record<string, string> = {
  preparing: "bg-yellow-100 text-yellow-800",
  shipped: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800"
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    preparing: "Підготовка",
    shipped: "Відправлено",
    in_transit: "В дорозі",
    delivered: "Доставлено"
  };
  return labels[status] || status;
};

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [calculatedShippingCost, setCalculatedShippingCost] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [selectedShipmentDetails, setSelectedShipmentDetails] = useState<ShipmentDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Форма для відвантаження
  const [formData, setFormData] = useState({
    orderId: "",
    carrierId: "",
    shippingAddress: "",
    recipientName: "",
    recipientPhone: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    shippingCost: "",
    declaredValue: "",
    estimatedDelivery: "",
    notes: "",
    trackingNumber: ""
  });

  // Завантаження відвантажень
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["/api/shipments"],
  });

  // Завантаження замовлень готових до відвантаження
  const { data: availableOrdersData } = useQuery({
    queryKey: ["/api/orders", "ready-to-ship"],
    queryFn: async () => {
      const response = await fetch("/api/orders?status=processing");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    }
  });

  // Завантаження всіх замовлень для редагування
  const { data: allOrdersData } = useQuery({
    queryKey: ["/api/orders", "all"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("Failed to fetch all orders");
      return response.json();
    },
    enabled: !!editingShipment // Завантажуємо тільки при редагуванні
  });
  
  const availableOrders = editingShipment 
    ? (allOrdersData?.orders || [])
    : (availableOrdersData?.orders || []);

  // Завантаження перевізників
  const { data: carriers = [] } = useQuery({
    queryKey: ["/api/carriers"],
  });

  // Завантаження збережених адрес клієнтів
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["/api/customer-addresses"],
    enabled: showSavedAddresses,
  });

  // Мутація створення відвантаження
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create shipment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Відвантаження створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити відвантаження",
        variant: "destructive",
      });
    },
  });

  // Мутація оновлення статусу
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Статус оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive",
      });
    },
  });

  // Мутація оновлення відвантаження
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/shipments/${editingShipment?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update shipment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      setEditingShipment(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Відвантаження оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити відвантаження",
        variant: "destructive",
      });
    },
  });

  // Мутація видалення відвантаження
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shipments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete shipment");
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Успіх",
        description: "Відвантаження видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити відвантаження",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      orderId: "",
      carrierId: "",
      shippingAddress: "",
      recipientName: "",
      recipientPhone: "",
      weight: "",
      length: "",
      width: "",
      height: "",
      shippingCost: "",
      declaredValue: "",
      estimatedDelivery: "",
      notes: "",
      trackingNumber: ""
    });
    setEditingShipment(null);
    setCalculatedShippingCost(null);
    setShowSavedAddresses(false);
  };

  // Функція для заповнення форми з обраної адреси
  const fillFormFromAddress = (address: any) => {
    console.log("Заповнення форми з адреси:", address);
    
    // Пошук правильного перевізника по carrierId або за назвою
    let selectedCarrierId = "";
    if (address.carrierId && carriers) {
      // Спробуємо знайти перевізника за ID
      const carrierFound = (carriers as Carrier[]).find(c => c.id === address.carrierId);
      if (carrierFound) {
        selectedCarrierId = address.carrierId.toString();
      } else if (address.carrierName) {
        // Якщо не знайшли за ID, шукаємо за назвою включаючи альтернативні назви
        const carrierByName = (carriers as Carrier[]).find(c => {
          const carrierName = c.name.toLowerCase();
          const addressCarrierName = address.carrierName.toLowerCase();
          
          // Перевіряємо основну назву
          if (carrierName.includes(addressCarrierName) || addressCarrierName.includes(carrierName)) {
            return true;
          }
          
          // Перевіряємо альтернативні назви
          const alternativeNames = (c as any).alternativeNames || [];
          return alternativeNames.some((altName: string) => 
            altName && (
              altName.toLowerCase().includes(addressCarrierName) || 
              addressCarrierName.includes(altName.toLowerCase())
            )
          );
        });
        
        if (carrierByName) {
          selectedCarrierId = carrierByName.id.toString();
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      recipientName: address.recipientName || address.customerName || "",
      recipientPhone: address.recipientPhone || address.customerPhone || "",
      shippingAddress: `${address.recipientName || address.customerName}\n${address.cityName} - ${address.warehouseAddress}`,
      carrierId: selectedCarrierId || prev.carrierId
    }));
    
    setShowSavedAddresses(false);
  };

  // Функція для обробки розрахованої вартості доставки
  const handleCostCalculated = (costData: any) => {
    const cost = typeof costData.Cost === 'number' ? costData.Cost : (typeof costData.cost === 'number' ? costData.cost : 0);
    setCalculatedShippingCost(cost);
    setFormData(prev => ({ 
      ...prev, 
      shippingCost: cost.toString() 
    }));
  };

  // Функція для отримання деталей відвантаження
  const handleViewDetails = async (shipmentId: number) => {
    try {
      const response = await fetch(`/api/shipments/${shipmentId}/details`);
      if (response.ok) {
        const details = await response.json();
        setSelectedShipmentDetails(details);
        setShowDetailsDialog(true);
      } else {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити деталі відвантаження",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching shipment details:", error);
      toast({
        title: "Помилка",
        description: "Помилка при завантаженні деталей",
        variant: "destructive",
      });
    }
  };

  // Функція для перевірки чи є перевізник Nova Poshta
  const isNovaPoshtaCarrier = (carrier: Carrier) => {
    if (!carrier) return false;
    
    const nameToCheck = carrier.name.toLowerCase();
    const alternativeNames = (carrier as any).alternativeNames || [];
    
    // Перевіряємо основну назву
    if (nameToCheck.includes('нова пошта') || nameToCheck.includes('nova poshta')) {
      return true;
    }
    
    // Перевіряємо альтернативні назви
    return alternativeNames.some((altName: string) => 
      altName && altName.toLowerCase().includes('пошта')
    );
  };

  // Функція валідації обов'язкових полів для Nova Poshta
  const validateNovaPoshtaFields = () => {
    const errors: Record<string, boolean> = {};
    const selectedCarrier = (carriers as Carrier[])?.find((c: Carrier) => c.id.toString() === formData.carrierId);
    const isNovaPoshta = selectedCarrier && isNovaPoshtaCarrier(selectedCarrier);
    
    if (isNovaPoshta) {
      if (!formData.weight) errors.weight = true;
      if (!formData.declaredValue) errors.declaredValue = true;
      if (!formData.length) errors.length = true;
      if (!formData.width) errors.width = true;
      if (!formData.height) errors.height = true;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Ефект для автоматичної валідації при зміні перевізника
  useEffect(() => {
    if (!carriers || carriers.length === 0) return;
    
    const selectedCarrier = (carriers as Carrier[])?.find((c: Carrier) => c.id.toString() === formData.carrierId);
    const isNovaPoshta = selectedCarrier && (selectedCarrier.name.toLowerCase().includes('нова пошта') || selectedCarrier.name.toLowerCase().includes('nova poshta'));
    
    if (isNovaPoshta) {
      // Тільки встановлюємо помилки, не очищуємо їх автоматично
      const errors: Record<string, boolean> = {};
      if (!formData.weight) errors.weight = true;
      if (!formData.declaredValue) errors.declaredValue = true;
      if (!formData.length) errors.length = true;
      if (!formData.width) errors.width = true;
      if (!formData.height) errors.height = true;
      setFieldErrors(errors);
    } else {
      setFieldErrors({});
    }
  }, [formData.carrierId, carriers]);

  // Ефект для очищення помилок при заповненні полів
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const newErrors = { ...fieldErrors };
      if (formData.weight && newErrors.weight) delete newErrors.weight;
      if (formData.declaredValue && newErrors.declaredValue) delete newErrors.declaredValue;
      if (formData.length && newErrors.length) delete newErrors.length;
      if (formData.width && newErrors.width) delete newErrors.width;
      if (formData.height && newErrors.height) delete newErrors.height;
      setFieldErrors(newErrors);
    }
  }, [formData.weight, formData.declaredValue, formData.length, formData.width, formData.height]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевіряємо обов'язкові поля
    if (!formData.orderId) {
      toast({
        title: "Помилка",
        description: "Оберіть замовлення",
        variant: "destructive",
      });
      return;
    }

    // Валідація полів для Nova Poshta
    if (!validateNovaPoshtaFields()) {
      toast({
        title: "Помилка",
        description: "Для Nova Poshta обов'язково заповніть вагу, оголошену вартість та розміри",
        variant: "destructive",
      });
      return;
    }

    // Очищуємо дані від пустих рядків та правильно типізуємо
    const cleanData: any = {
      orderId: parseInt(formData.orderId),
      status: "preparing"
    };

    if (formData.carrierId) cleanData.carrierId = parseInt(formData.carrierId);
    if (formData.shippingAddress) cleanData.recipientWarehouseAddress = formData.shippingAddress;
    if (formData.recipientName) cleanData.recipientName = formData.recipientName;
    if (formData.recipientPhone) cleanData.recipientPhone = formData.recipientPhone;
    if (formData.weight) cleanData.weight = formData.weight;
    if (formData.length) cleanData.length = formData.length;
    if (formData.width) cleanData.width = formData.width;
    if (formData.height) cleanData.height = formData.height;
    if (formData.shippingCost) cleanData.shippingCost = formData.shippingCost;
    if (formData.declaredValue) cleanData.declaredValue = formData.declaredValue;
    if (formData.estimatedDelivery) cleanData.estimatedDelivery = formData.estimatedDelivery;
    if (formData.notes) cleanData.notes = formData.notes;
    if (formData.trackingNumber) cleanData.trackingNumber = formData.trackingNumber;

    if (editingShipment) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleStatusChange = (shipmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: shipmentId, status: newStatus });
  };

  const handleDelete = (id: number, shipmentNumber: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити відвантаження ${shipmentNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredShipments = (shipments as Shipment[])?.filter((shipment: Shipment) =>
    shipment.shipmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.carrier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Відвантаження</h1>
                <p className="text-gray-600 mt-1">Управління відвантаженнями замовлень</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Створити відвантаження
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingShipment ? "Редагувати відвантаження" : "Нове відвантаження"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <Label htmlFor="orderId">Замовлення</Label>
                <Select 
                  value={formData.orderId} 
                  onValueChange={async (value) => {
                    setFormData(prev => ({ ...prev, orderId: value }));
                    const order = availableOrders.find((o: Order) => o.id.toString() === value);
                    if (order) {
                      // Отримуємо товари замовлення для формування опису
                      try {
                        const response = await fetch(`/api/orders/${value}`);
                        const orderDetails = await response.json();
                        console.log('Order details:', orderDetails);
                        
                        // Збираємо унікальні категорії товарів
                        const categories = new Set<string>();
                        if (orderDetails.items && Array.isArray(orderDetails.items)) {
                          console.log('Order items:', orderDetails.items);
                          
                          // Отримуємо список категорій для знаходження назв
                          const categoriesResponse = await fetch('/api/categories');
                          const allCategories = await categoriesResponse.json();
                          console.log('All categories:', allCategories);
                          
                          orderDetails.items.forEach((item: any) => {
                            console.log('Processing item:', item);
                            if (item.product && item.product.categoryId) {
                              // Знаходимо категорію за ID
                              const category = allCategories.find((cat: any) => cat.id === item.product.categoryId);
                              if (category) {
                                categories.add(category.name);
                                console.log('Added category:', category.name);
                              }
                            }
                          });
                        }
                        
                        const description = Array.from(categories).join(', ');
                        console.log('Generated description:', description);
                        
                        // Якщо немає категорій товарів, використовуємо номер замовлення
                        const finalDescription = description || `Товари з замовлення ${order.orderNumber}`;
                        
                        setFormData(prev => ({ 
                          ...prev, 
                          shippingAddress: `${order.customerName}\n${order.customerEmail || ''}`,
                          recipientPhone: order.customerPhone || "",
                          recipientName: order.customerName,
                          declaredValue: order.totalAmount || "",
                          description: finalDescription
                        }));
                      } catch (error) {
                        console.error('Помилка завантаження деталей замовлення:', error);
                        setFormData(prev => ({ 
                          ...prev, 
                          shippingAddress: `${order.customerName}\n${order.customerEmail || ''}`,
                          recipientPhone: order.customerPhone || "",
                          recipientName: order.customerName,
                          declaredValue: order.totalAmount || "",
                          description: "Товари"
                        }));
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть замовлення" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(availableOrders) && availableOrders.map((order: Order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} - {order.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carrier">Перевізник</Label>
                  <CarrierSelect
                    value={formData.carrierId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, carrierId: value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="trackingNumber">Трек-номер</Label>
                  <Input
                    id="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    placeholder="20450000000000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingAddress">Адреса доставки</Label>
                  <Textarea
                    id="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                    placeholder="Повна адреса доставки"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="recipientPhone">Телефон отримувача</Label>
                  <Input
                    id="recipientPhone"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientPhone: e.target.value }))}
                    placeholder="+380501234567"
                  />
                </div>
              </div>

              {/* Кнопка для показу збережених адрес */}
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                  className="text-sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showSavedAddresses ? "Приховати збережені адреси" : "Вибрати збережену адресу"}
                </Button>
              </div>

              {/* Список збережених адрес */}
              {showSavedAddresses && (
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <h4 className="font-medium mb-3">Збережені адреси доставки</h4>
                  {savedAddresses.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {savedAddresses.map((address: any) => (
                        <div
                          key={address.id}
                          className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => fillFormFromAddress(address)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {address.recipientName || address.customerName} ({address.recipientPhone || address.customerPhone})
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {address.cityName} - {address.warehouseAddress}
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>Використано: {address.usageCount} раз</span>
                              {address.carrierId && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  Перевізник: {address.carrierName || `ID ${address.carrierId}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Збережені адреси не знайдені</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="weight">Вага (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="1.5"
                    className={fieldErrors.weight ? "border-red-500 bg-red-50" : ""}
                  />
                  {fieldErrors.weight && (
                    <p className="text-xs text-red-600 mt-1">Обов'язковий параметр</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="length">Довжина (см)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                    placeholder="30"
                    className={fieldErrors.length ? "border-red-500 bg-red-50" : ""}
                  />
                  {fieldErrors.length && (
                    <p className="text-xs text-red-600 mt-1">Обов'язковий параметр</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="width">Ширина (см)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="20"
                    className={fieldErrors.width ? "border-red-500 bg-red-50" : ""}
                  />
                  {fieldErrors.width && (
                    <p className="text-xs text-red-600 mt-1">Обов'язковий параметр</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="height">Висота (см)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="10"
                    className={fieldErrors.height ? "border-red-500 bg-red-50" : ""}
                  />
                  {fieldErrors.height && (
                    <p className="text-xs text-red-600 mt-1">Обов'язковий параметр</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="declaredValue">Оголошена вартість (грн)</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    step="0.01"
                    value={formData.declaredValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, declaredValue: e.target.value }))}
                    placeholder="1000.00"
                    className={fieldErrors.declaredValue ? "border-red-500 bg-red-50" : ""}
                  />
                  {fieldErrors.declaredValue && (
                    <p className="text-xs text-red-600 mt-1">Обов'язковий параметр</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shippingCost">Вартість доставки</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                    placeholder="150.00"
                    className={calculatedShippingCost ? "bg-green-50 border-green-300 text-green-800" : ""}
                  />
                  {calculatedShippingCost && (
                    <p className="text-xs text-green-600 mt-1">Автоматично розраховано Nova Poshta</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="estimatedDelivery">Очікувана дата доставки</Label>
                  <UkrainianDatePicker
                    date={formData.estimatedDelivery ? new Date(formData.estimatedDelivery) : undefined}
                    onDateChange={(date) => setFormData(prev => ({ ...prev, estimatedDelivery: date ? date.toISOString() : "" }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Примітки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Додаткова інформація"
                  rows={2}
                />
              </div>

              {/* Інтеграція з Новою Поштою - показується тільки при виборі Нової Пошти */}
              {(() => {
                const selectedCarrier = (carriers as Carrier[])?.find((c: Carrier) => c.id.toString() === formData.carrierId);
                return selectedCarrier && (selectedCarrier.name.toLowerCase().includes('нова пошта') || selectedCarrier.name.toLowerCase().includes('nova poshta')) ? (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Інтеграція з Новою Поштою</h3>
                    <NovaPoshtaIntegration
                      onAddressSelect={(address, cityRef, warehouseRef) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          shippingAddress: address 
                        }));
                      }}
                      onCostCalculated={handleCostCalculated}
                      onTrackingNumberCreated={(trackingNumber) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          trackingNumber: trackingNumber 
                        }));
                      }}
                      orderId={formData.orderId}
                      shipmentId={editingShipment?.id?.toString()}
                      trackingNumber={formData.trackingNumber}
                      weight={formData.weight}
                      length={formData.length}
                      width={formData.width}
                      height={formData.height}
                      declaredValue={formData.declaredValue}
                      recipientName={formData.recipientName}
                      recipientPhone={formData.recipientPhone}
                    />
                  </div>
                ) : null;
              })()}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingShipment 
                    ? (updateMutation.isPending ? "Збереження..." : "Зберегти")
                    : (createMutation.isPending ? "Створення..." : "Створити")
                  }
                </Button>
              </div>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>
      </div>
        </div>

      {/* Фільтри */}
      <div className="w-full pb-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Фільтри1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Пошук за номером відвантаження, клієнтом або перевізником..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Таблиця відвантажень */}
      <div className="w-full space-y-6 flex-1 overflow-auto">
      <Card>
        <CardHeader>
          <CardTitle>Список відвантажень</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Замовлення</TableHead>
                <TableHead>Клієнт</TableHead>
                <TableHead>Перевізник</TableHead>
                <TableHead>Трек-номер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Вага</TableHead>
                <TableHead>Дата відправки</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    Відвантажень не знайдено
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment: Shipment) => (
                  <TableRow 
                    key={shipment.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDetails(shipment.id)}
                  >
                    <TableCell className="font-medium">
                      {shipment.shipmentNumber}
                    </TableCell>
                    <TableCell>
                      {shipment.order?.orderNumber || `#${shipment.orderId}`}
                    </TableCell>
                    <TableCell>
                      {shipment.order?.customerName || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {shipment.carrier?.name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.trackingNumber || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={shipment.status}
                        onValueChange={(value) => handleStatusChange(shipment.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge className={statusColors[shipment.status] || "bg-gray-100 text-gray-800"}>
                            {statusLabels[shipment.status] || shipment.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {shipment.weight ? `${shipment.weight} кг` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {shipment.shippedAt
                          ? new Date(shipment.shippedAt).toLocaleDateString()
                          : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              // Завантажуємо деталі відвантаження з сервера
                              const response = await fetch(`/api/shipments/${shipment.id}/details`);
                              if (response.ok) {
                                const details = await response.json();
                                setEditingShipment(shipment);
                                setFormData({
                                  orderId: details.order ? details.order.id.toString() : shipment.orderId.toString(),
                                  carrierId: shipment.carrierId?.toString() || "",
                                  shippingAddress: shipment.recipientWarehouseAddress || "",
                                  recipientName: shipment.recipientName || "",
                                  recipientPhone: shipment.recipientPhone || "",
                                  weight: shipment.weight || "",
                                  length: shipment.length || "",
                                  width: shipment.width || "",
                                  height: shipment.height || "",
                                  shippingCost: shipment.shippingCost || "",
                                  declaredValue: shipment.declaredValue || "",
                                  estimatedDelivery: shipment.estimatedDelivery 
                                    ? new Date(shipment.estimatedDelivery).toISOString().split('T')[0] 
                                    : "",
                                  trackingNumber: shipment.trackingNumber || "",
                                  notes: shipment.notes || ""
                                });
                                setIsDialogOpen(true);
                              } else {
                                toast({
                                  title: "Помилка",
                                  description: "Не вдалося завантажити деталі відвантаження",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Error loading shipment details:", error);
                              toast({
                                title: "Помилка", 
                                description: "Помилка при завантаженні деталей",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(shipment.id, shipment.shipmentNumber)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
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
        </div>

      {/* Модальне вікно деталей відвантаження */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Деталі відвантаження {selectedShipmentDetails?.shipmentNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedShipmentDetails && (
            <div className="space-y-6">
              {/* Основна інформація */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Інформація про відвантаження</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Статус:</span>
                      <Badge className={statusColors[selectedShipmentDetails.status] || "bg-gray-100 text-gray-800"}>
                        {getStatusLabel(selectedShipmentDetails.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Трек-номер:</span>
                      <span>{selectedShipmentDetails.trackingNumber || 'Не вказано'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Вага:</span>
                      <span>{selectedShipmentDetails.weight ? `${selectedShipmentDetails.weight} кг` : 'Не вказано'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Перевізник:</span>
                      <span>{selectedShipmentDetails.carrier?.name || 'Не вказано'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дата відправки:</span>
                      <span>
                        {selectedShipmentDetails.shippedAt 
                          ? new Date(selectedShipmentDetails.shippedAt).toLocaleDateString('uk-UA')
                          : 'Не відправлено'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Отримувач</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ім'я:</span>
                      <span>{selectedShipmentDetails.recipientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Телефон:</span>
                      <span>{selectedShipmentDetails.recipientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Адреса:</span>
                      <span className="text-right max-w-[200px]">{selectedShipmentDetails.shippingAddress}</span>
                    </div>
                    {selectedShipmentDetails.order && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Замовлення:</span>
                          <span>{selectedShipmentDetails.order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Клієнт:</span>
                          <span>{selectedShipmentDetails.order.customerName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Примітки */}
              {selectedShipmentDetails.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Примітки</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedShipmentDetails.notes}
                  </p>
                </div>
              )}

              {/* Товари у відвантаженні */}
              <div>
                <h3 className="font-semibold mb-3">Товари у відвантаженні</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Кількість</TableHead>
                      <TableHead>Серійні номери</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedShipmentDetails.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>{item.productSku}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell>
                          {item.serialNumbers && item.serialNumbers.length > 0 ? (
                            <div className="space-y-1">
                              {item.serialNumbers.map((serial, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {serial}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Без серійних номерів</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}