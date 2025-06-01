import { useState } from "react";
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
  serviceType: string | null;
  isActive: boolean;
}

interface Shipment {
  id: number;
  orderId: number;
  shipmentNumber: string;
  trackingNumber: string | null;
  carrierId: number | null;
  carrier?: Carrier;
  shippingAddress: string;
  weight: string | null;
  dimensions: string | null;
  shippingCost: string | null;
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

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Форма для відвантаження
  const [formData, setFormData] = useState({
    orderId: "",
    carrierId: "",
    shippingAddress: "",
    weight: "",
    dimensions: "",
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
  const { data: availableOrders = [] } = useQuery({
    queryKey: ["/api/orders", "ready-to-ship"],
    queryFn: async () => {
      const response = await fetch("/api/orders?status=processing");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    }
  });

  // Завантаження перевізників
  const { data: carriers = [] } = useQuery({
    queryKey: ["/api/carriers"],
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
      return response.json();
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
      weight: "",
      dimensions: "",
      shippingCost: "",
      declaredValue: "",
      estimatedDelivery: "",
      notes: "",
      trackingNumber: ""
    });
    setEditingShipment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      orderId: parseInt(formData.orderId),
      carrierId: formData.carrierId ? parseInt(formData.carrierId) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : null,
      estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery) : null,
    };

    if (editingShipment) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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

  const filteredShipments = shipments.filter((shipment: Shipment) =>
    shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.order?.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.carrier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Відвантаження</h1>
          <p className="text-gray-600">Управління відвантаженнями замовлень</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Створити відвантаження
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingShipment ? "Редагувати відвантаження" : "Нове відвантаження"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="orderId">Замовлення</Label>
                <Select 
                  value={formData.orderId} 
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, orderId: value }));
                    const order = availableOrders.find((o: Order) => o.id.toString() === value);
                    if (order) {
                      setFormData(prev => ({ 
                        ...prev, 
                        shippingAddress: `${order.customerName}\n${order.customerEmail || ''}\n${order.customerPhone || ''}` 
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть замовлення" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrders.map((order: Order) => (
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Вага (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="declaredValue">Оголошена вартість (грн)</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    step="0.01"
                    value={formData.declaredValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, declaredValue: e.target.value }))}
                    placeholder="1000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dimensions">Розміри (см)</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="30x20x10"
                  />
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
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedDelivery">Очікувана дата доставки</Label>
                <Input
                  id="estimatedDelivery"
                  type="datetime-local"
                  value={formData.estimatedDelivery}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                />
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
                const selectedCarrier = carriers.find((c: any) => c.id.toString() === formData.carrierId);
                return selectedCarrier && selectedCarrier.name.toLowerCase().includes('нова пошта') ? (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Інтеграція з Новою Поштою</h3>
                    <NovaPoshtaIntegration
                      onAddressSelect={(address, cityRef, warehouseRef) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          shippingAddress: address 
                        }));
                      }}
                      onCostCalculated={(cost) => {
                        setFormData(prev => ({ 
                          ...prev, 
                          shippingCost: cost.Cost 
                        }));
                      }}
                      trackingNumber={formData.trackingNumber}
                      weight={formData.weight}
                      declaredValue={formData.declaredValue}
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
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Фільтри
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

      {/* Таблиця відвантажень */}
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
                  <TableRow key={shipment.id}>
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
                          onClick={() => {
                            setEditingShipment(shipment);
                            setFormData({
                              orderId: shipment.orderId.toString(),
                              carrierId: shipment.carrierId?.toString() || "",
                              shippingAddress: shipment.shippingAddress,
                              weight: shipment.weight || "",
                              dimensions: shipment.dimensions || "",
                              shippingCost: shipment.shippingCost || "",
                              declaredValue: shipment.declaredValue || "",
                              estimatedDelivery: shipment.estimatedDelivery 
                                ? new Date(shipment.estimatedDelivery).toISOString().split('T')[0] 
                                : "",
                              trackingNumber: shipment.trackingNumber || "",
                              notes: shipment.notes || ""
                            });
                            setIsDialogOpen(true);
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
  );
}