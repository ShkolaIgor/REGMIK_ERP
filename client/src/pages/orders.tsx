import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, ShoppingCart, TrendingUp, DollarSign, Clock, Package } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Order {
  id: number;
  orderSequenceNumber: number;
  orderNumber: string;
  clientName?: string;
  clientTaxCode?: string;
  contactName?: string;
  clientId: number;
  clientContactsId: number | null;
  statusId: number | null;
  status: string;
  totalAmount: string;
  notes: string | null;
  paymentDate: Date | null;
  paymentType: string | null;
  paidAmount: string | null;
  contractNumber: string | null;
  productionApproved: boolean | null;
  productionApprovedBy: string | null;
  productionApprovedAt: Date | null;
  dueDate: Date | null;
  shippedDate: Date | null;
  createdAt: Date | null;
}

interface OrderStatus {
  id: number;
  name: string;
  textColor: string;
  backgroundColor: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const { data: orderStatuses = [] } = useQuery({
    queryKey: ["/api/order-statuses"],
    enabled: isAuthenticated,
  });

  // Filter orders
  const filteredOrders = (orders as Order[]).filter((order: Order) => {
    const matchesSearch = !searchQuery || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o: Order) => o.status === "pending").length;
  const totalValue = filteredOrders.reduce((sum: number, o: Order) => sum + parseFloat(o.totalAmount || "0"), 0);
  const completedOrders = filteredOrders.filter((o: Order) => o.status === "delivered").length;

  // DataTable columns
  const columns = [
    {
      key: "orderNumber",
      label: "Номер замовлення",
      sortable: true,
    },
    {
      key: "clientName",
      label: "Клієнт",
      sortable: true,
    },
    {
      key: "status",
      label: "Статус",
      sortable: true,
      render: (order: Order) => (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {order.status}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      label: "Сума",
      sortable: true,
      render: (order: Order) => `${parseFloat(order.totalAmount || "0").toLocaleString("uk-UA")} ₴`,
    },
    {
      key: "createdAt",
      label: "Створено",
      sortable: true,
      render: (order: Order) => 
        order.createdAt ? new Date(order.createdAt).toLocaleDateString("uk-UA") : "-",
    },
  ];

  // Card template
  const cardTemplate = (order: Order) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
            <p className="text-sm text-muted-foreground">{order.clientName}</p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {order.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Сума:</span>
            <span className="font-medium">{parseFloat(order.totalAmount || "0").toLocaleString("uk-UA")} ₴</span>
          </div>
          {order.createdAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Створено:</span>
              <span className="text-sm">{new Date(order.createdAt).toLocaleDateString("uk-UA")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Потрібна авторизація для перегляду замовлень</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Управління замовленнями</h1>
                <p className="text-blue-100 text-lg">Повний контроль над замовленнями клієнтів</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm transition-all duration-300"
                disabled={!isAuthenticated}
              >
                <Plus className="w-4 h-4 mr-2" />
                Нове замовлення
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього замовлень</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalOrders}</p>
                  <p className="text-xs text-blue-600">Активні замовлення в системі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ShoppingCart className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-orange-700 font-medium">Очікують обробки</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{pendingOrders}</p>
                  <p className="text-xs text-orange-600">Нові замовлення</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Загальна вартість</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{totalValue.toLocaleString("uk-UA")} ₴</p>
                  <p className="text-xs text-green-600">Сума всіх замовлень</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <DollarSign className="w-8 h-8 text-white" />
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
                    <Package className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Виконано</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{completedOrders}</p>
                  <p className="text-xs text-purple-600">Доставлені замовлення</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Пошук за номером замовлення, клієнтом або нотатками..."
          filters={[
            {
              key: "status",
              label: "Статус",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Всі статуси" },
                ...(orderStatuses as OrderStatus[]).map((status: OrderStatus) => ({
                  value: status.name,
                  label: status.name,
                })),
              ],
            },
          ]}
        />

        {/* DataTable */}
        <div className="w-full">
          <DataTable
            data={filteredOrders}
            columns={columns}
            storageKey="orders-table"
            cardTemplate={cardTemplate}
            onRowClick={(order) => setEditingOrder(order)}
            loading={isLoading}
          />
        </div>

        {/* Edit Order Dialog */}
        <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Деталі замовлення</DialogTitle>
              <DialogDescription>
                Перегляд та редагування замовлення
              </DialogDescription>
            </DialogHeader>
            {editingOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Номер замовлення</label>
                    <input
                      type="text"
                      defaultValue={editingOrder.orderNumber}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Клієнт</label>
                    <input
                      type="text"
                      defaultValue={editingOrder.clientName || ''}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Статус</label>
                    <input
                      type="text"
                      defaultValue={editingOrder.status}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Сума</label>
                    <input
                      type="text"
                      defaultValue={`${parseFloat(editingOrder.totalAmount || "0").toLocaleString("uk-UA")} ₴`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      readOnly
                    />
                  </div>
                </div>
                {editingOrder.notes && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Нотатки</label>
                    <textarea
                      defaultValue={editingOrder.notes}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      readOnly
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingOrder(null)}>
                    Закрити
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Order Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Нове замовлення</DialogTitle>
              <DialogDescription>
                Створення нового замовлення
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Функція створення замовлення в розробці
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Закрити
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}