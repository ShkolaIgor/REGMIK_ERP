import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, Clock, ShoppingCart, AlertTriangle, Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OrderedProduct {
  id: number;
  productName: string;
  sku: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  orderNumber: string;
  clientName: string;
  dueDate: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function OrderedProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OrderedProduct | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Mock data for demonstration
  const orderedProducts: OrderedProduct[] = [
    {
      id: 1,
      productName: "Виріб А",
      sku: "VIR-001",
      orderedQuantity: 100,
      deliveredQuantity: 60,
      remainingQuantity: 40,
      orderNumber: "ORD-001",
      clientName: "ТОВ Клієнт",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "in_production",
      priority: "high",
      createdAt: new Date().toISOString()
    }
  ];

  // Filter products
  const filteredProducts = orderedProducts.filter((product: OrderedProduct) => {
    const matchesSearch = !searchQuery || 
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || product.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalProducts = filteredProducts.length;
  const inProductionProducts = filteredProducts.filter(p => p.status === "in_production").length;
  const totalOrdered = filteredProducts.reduce((sum, p) => sum + p.orderedQuantity, 0);
  const totalRemaining = filteredProducts.reduce((sum, p) => sum + p.remainingQuantity, 0);

  // DataTable columns
  const columns = [
    {
      key: "productName",
      label: "Товар",
      sortable: true,
    },
    {
      key: "sku",
      label: "SKU",
      sortable: true,
    },
    {
      key: "orderNumber",
      label: "Замовлення",
      sortable: true,
    },
    {
      key: "clientName",
      label: "Клієнт",
      sortable: true,
    },
    {
      key: "orderedQuantity",
      label: "Замовлено",
      sortable: true,
    },
    {
      key: "remainingQuantity",
      label: "Залишок",
      sortable: true,
      render: (product: OrderedProduct) => {
        const isUrgent = product.remainingQuantity > 0 && new Date(product.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        return (
          <span className={isUrgent ? "text-red-600 font-semibold" : ""}>
            {product.remainingQuantity}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Статус",
      sortable: true,
      render: (product: OrderedProduct) => {
        const statusMap = {
          "in_production": { label: "У виробництві", color: "bg-blue-100 text-blue-800" },
          "completed": { label: "Завершено", color: "bg-green-100 text-green-800" },
          "pending": { label: "Очікує", color: "bg-yellow-100 text-yellow-800" },
          "delayed": { label: "Затримка", color: "bg-red-100 text-red-800" },
        };
        const status = statusMap[product.status as keyof typeof statusMap] || statusMap.pending;
        return <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span>;
      },
    },
  ];

  // Card template
  const cardTemplate = (product: OrderedProduct) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{product.productName}</h3>
            <p className="text-sm text-muted-foreground">{product.sku}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${
            product.status === "completed" ? "bg-green-100 text-green-800" :
            product.status === "in_production" ? "bg-blue-100 text-blue-800" :
            product.status === "delayed" ? "bg-red-100 text-red-800" :
            "bg-yellow-100 text-yellow-800"
          }`}>
            {product.status === "completed" ? "Завершено" :
             product.status === "in_production" ? "У виробництві" :
             product.status === "delayed" ? "Затримка" : "Очікує"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Замовлення:</span>
            <span className="font-medium">{product.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Клієнт:</span>
            <span className="text-sm">{product.clientName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Залишок:</span>
            <span className={`font-medium ${product.remainingQuantity > 0 ? "text-orange-600" : "text-green-600"}`}>
              {product.remainingQuantity}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Потрібна авторизація для перегляду замовлених товарів</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Замовлені товари</h1>
                <p className="text-green-100 text-lg">Контроль виконання замовлень</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm transition-all duration-300"
                disabled={!isAuthenticated}
              >
                <Plus className="w-4 h-4 mr-2" />
                Додати товар
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Всього товарів</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{totalProducts}</p>
                  <p className="text-xs text-green-600">В замовленнях</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">У виробництві</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{inProductionProducts}</p>
                  <p className="text-xs text-blue-600">Активних позицій</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Всього замовлено</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{totalOrdered.toLocaleString("uk-UA")}</p>
                  <p className="text-xs text-purple-600">Одиниць товару</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Залишок до виконання</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{totalRemaining.toLocaleString("uk-UA")}</p>
                  <p className="text-xs text-orange-600">Одиниць товару</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Пошук за товаром, SKU, замовленням або клієнтом..."
          filters={[
            {
              key: "status",
              label: "Статус",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Всі статуси" },
                { value: "pending", label: "Очікує" },
                { value: "in_production", label: "У виробництві" },
                { value: "completed", label: "Завершено" },
                { value: "delayed", label: "Затримка" },
              ],
            },
          ]}
        />

        {/* DataTable */}
        <div className="w-full">
          <DataTable
            data={filteredProducts}
            columns={columns}
            storageKey="ordered-products-table"
            cardTemplate={cardTemplate}
            onRowClick={(product) => setEditingProduct(product)}
            loading={false}
          />
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Деталі товару</DialogTitle>
              <DialogDescription>
                Перегляд замовленого товару
              </DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Функція редагування товарів в розробці
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>
                    Закрити
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Додати товар</DialogTitle>
              <DialogDescription>
                Додавання товару до замовлення
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Функція додавання товарів в розробці
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