import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/supplier-orders"],
    queryFn: () => apiRequest("/api/supplier-orders"),
  });

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

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження замовлень...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Замовлення постачальникам</h1>
          <p className="text-muted-foreground">
            Управління замовленнями матеріалів та компонентів
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього замовлень</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">У процесі</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: SupplierOrder) => ["sent", "confirmed", "in_delivery"].includes(o.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доставлено</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o: SupplierOrder) => o.status === "delivered").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальна сума</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((sum: number, order: SupplierOrder) => sum + parseFloat(order.totalAmount || "0"), 0).toFixed(2)} ₴
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблиця замовлень */}
      <Card>
        <CardHeader>
          <CardTitle>Список замовлень</CardTitle>
          <CardDescription>
            Перегляд та управління замовленнями постачальникам
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Немає замовлень</h3>
              <p className="text-gray-500">
                Замовлення будуть створені автоматично при дефіциті матеріалів
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер замовлення</TableHead>
                  <TableHead>Постачальник</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead>Дата створення</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: SupplierOrder) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier.name}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{parseFloat(order.totalAmount).toFixed(2)} ₴</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Деталі
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Замовлення {order.orderNumber}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Інформація про замовлення */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Постачальник</label>
                                  <p className="text-sm text-gray-600">{selectedOrder.supplier.name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Статус</label>
                                  <div className="mt-1">
                                    <Select
                                      value={selectedOrder.status}
                                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                                    >
                                      <SelectTrigger className="w-48">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Чернетка</SelectItem>
                                        <SelectItem value="sent">Відправлено</SelectItem>
                                        <SelectItem value="confirmed">Підтверджено</SelectItem>
                                        <SelectItem value="in_delivery">У доставці</SelectItem>
                                        <SelectItem value="delivered">Доставлено</SelectItem>
                                        <SelectItem value="cancelled">Скасовано</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Загальна сума</label>
                                  <p className="text-sm text-gray-600">{parseFloat(selectedOrder.totalAmount).toFixed(2)} ₴</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Дата створення</label>
                                  <p className="text-sm text-gray-600">
                                    {new Date(selectedOrder.createdAt).toLocaleDateString('uk-UA')}
                                  </p>
                                </div>
                              </div>

                              {/* Позиції замовлення */}
                              <div>
                                <h3 className="text-lg font-medium mb-3">Позиції замовлення</h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Товар</TableHead>
                                      <TableHead>SKU</TableHead>
                                      <TableHead>Кількість</TableHead>
                                      <TableHead>Ціна за одиницю</TableHead>
                                      <TableHead>Загальна вартість</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedOrder.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell>{item.product.sku}</TableCell>
                                        <TableCell>{item.quantity} {item.unit}</TableCell>
                                        <TableCell>{parseFloat(item.unitPrice).toFixed(2)} ₴</TableCell>
                                        <TableCell>{parseFloat(item.totalPrice).toFixed(2)} ₴</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Примітки */}
                              {selectedOrder.notes && (
                                <div>
                                  <label className="text-sm font-medium">Примітки</label>
                                  <p className="text-sm text-gray-600 mt-1">{selectedOrder.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}