import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Plus, Upload, Package, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface SupplierOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  materialShortageId: number | null;
  product: Product;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface SupplierOrder {
  id: number;
  supplierId: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  expectedDelivery: string | null;
  notes: string | null;
  createdAt: string;
  supplier: Supplier;
  items: SupplierOrderItem[];
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  in_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  draft: "Чернетка",
  sent: "Відправлено",
  confirmed: "Підтверджено",
  in_delivery: "У доставці",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export default function SupplierOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-orders"],
    queryFn: () => apiRequest("/api/supplier-orders"),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: () => apiRequest("/api/suppliers"),
  });

  // Фільтровані дані для пошуку
  const filteredOrders = Array.isArray(orders) ? orders.filter((order: SupplierOrder) => {
    if (!order || typeof order !== 'object') return false;
    
    const matchesSearch = order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    const matchesSupplier = supplierFilter === "all" || 
      order.supplierId?.toString() === supplierFilter;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  }) : [];

  // Статистичні дані
  const totalOrders = Array.isArray(orders) ? orders.length : 0;
  const activeOrders = Array.isArray(orders) ? orders.filter(o => o && o.status !== 'cancelled' && o.status !== 'delivered').length : 0;
  const totalAmount = Array.isArray(orders) ? orders.reduce((sum, o) => sum + Number(o?.totalAmount || 0), 0) : 0;
  const pendingOrders = Array.isArray(orders) ? orders.filter(o => o && (o.status === 'draft' || o.status === 'sent')).length : 0;

  // Форматування валюти
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4" />;
      case "sent":
        return <Package className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_delivery":
        return <Package className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Колонки для DataTable
  const columns = [
    {
      key: "orderNumber",
      label: "Номер замовлення",
      sortable: true,
    },
    {
      key: "supplier",
      label: "Постачальник",
      render: (order: SupplierOrder) => {
        if (!order || !order.supplier) return "—";
        return order.supplier.name;
      }
    },
    {
      key: "status",
      label: "Статус",
      render: (order: SupplierOrder) => {
        if (!order || !order.status) return "—";
        return (
          <Badge className={statusColors[order.status as keyof typeof statusColors]}>
            {getStatusIcon(order.status)}
            <span className="ml-1">{statusLabels[order.status as keyof typeof statusLabels]}</span>
          </Badge>
        );
      }
    },
    {
      key: "totalAmount",
      label: "Сума",
      render: (order: SupplierOrder) => {
        if (!order || !order.totalAmount) return "—";
        return formatCurrency(Number(order.totalAmount));
      }
    },
    {
      key: "expectedDelivery",
      label: "Очікувана доставка",
      render: (order: SupplierOrder) => {
        if (!order || !order.expectedDelivery) return "—";
        return new Date(order.expectedDelivery).toLocaleDateString('uk-UA');
      }
    },
    {
      key: "actions",
      label: "Дії",
      render: (order: SupplierOrder) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedOrder(order)}
          >
            Деталі
          </Button>
        </div>
      )
    }
  ];

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiRequest({
        url: `/api/supplier-orders/${orderId}/status`,
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      setSelectedOrder(null);
    },
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="w-full p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Завантаження замовлень постачальників...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full p-6">
          {/* Header з градієнтом */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Склад замовлень постачальників</h1>
                  <p className="text-blue-100 text-lg">Управління закупками та постачанням матеріалів</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Імпорт XML
                </Button>
                <Button
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Нове замовлення
                </Button>
              </div>
            </div>
          </div>

          {/* Статистичні картки */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                    <p className="text-sm text-gray-500">Всього замовлень</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
                    <p className="text-sm text-gray-500">Активні замовлення</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                    <p className="text-sm text-gray-500">Загальна сума</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                    <p className="text-sm text-gray-500">Очікують підтвердження</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SearchFilters */}
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                key: "status",
                label: "Статус",
                value: statusFilter,
                options: [
                  { value: "all", label: "Всі статуси" },
                  { value: "draft", label: "Чернетка" },
                  { value: "sent", label: "Відправлено" },
                  { value: "confirmed", label: "Підтверджено" },
                  { value: "in_delivery", label: "У доставці" },
                  { value: "delivered", label: "Доставлено" },
                  { value: "cancelled", label: "Скасовано" }
                ],
                onChange: setStatusFilter
              },
              {
                key: "supplier",
                label: "Постачальник",
                value: supplierFilter,
                options: [
                  { value: "all", label: "Всі постачальники" },
                  ...Array.isArray(suppliers) ? suppliers.map((supplier: any) => ({
                    value: supplier.id.toString(),
                    label: supplier.name
                  })) : []
                ],
                onChange: setSupplierFilter
              }
            ]}
          />

          {/* DataTable */}
          <DataTable
            data={filteredOrders}
            columns={columns}
            loading={isLoading}
            storageKey="supplier-orders-table"
          />

          {/* Dialog для деталей замовлення */}
          {selectedOrder && (
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Деталі замовлення {selectedOrder.orderNumber}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Постачальник:</label>
                      <p className="text-sm text-muted-foreground">{selectedOrder.supplier.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Статус:</label>
                      <p className="text-sm text-muted-foreground">
                        {statusLabels[selectedOrder.status as keyof typeof statusLabels]}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Загальна сума:</label>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(selectedOrder.totalAmount))}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Очікувана доставка:</label>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.expectedDelivery ? new Date(selectedOrder.expectedDelivery).toLocaleDateString('uk-UA') : "Не вказано"}
                      </p>
                    </div>
                  </div>
                  
                  {selectedOrder.notes && (
                    <div>
                      <label className="text-sm font-medium">Примітки:</label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}