import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "@/components/DataTable";

interface Component {
  id: number;
  name: string;
  sku: string;
  description?: string;
  costPrice: string;
  supplier?: string;
  categoryId?: number;
  isActive: boolean;
  minStock?: number;
  stock?: number;
  warehouseId?: number;
  category?: {
    id: number;
    name: string;
    color?: string;
  };
  warehouse?: {
    id: number;
    name: string;
  };
}

interface ComponentStock {
  componentId: number;
  warehouseId: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  component: Component;
  warehouse: {
    id: number;
    name: string;
  };
}

export default function ComponentStockPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // all, low, normal, out

  // Fetch components with stock data
  const { data: componentStocks = [], isLoading: isLoadingStocks, refetch } = useQuery<ComponentStock[]>({
    queryKey: ["/api/component-stocks"],
    enabled: isAuthenticated
  });

  // Fetch warehouses for filter
  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ["/api/warehouses"],
    enabled: isAuthenticated
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Будь ласка, увійдіть в систему</div>
        </div>
      </div>
    );
  }

  // Filter components based on search and filters
  const filteredStocks = componentStocks.filter((stock: ComponentStock) => {
    const matchesSearch = searchQuery === "" || 
      stock.component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.component.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesWarehouse = warehouseFilter === "all" || 
      stock.warehouseId.toString() === warehouseFilter;

    const matchesStockFilter = stockFilter === "all" || 
      (stockFilter === "out" && stock.quantity === 0) ||
      (stockFilter === "low" && stock.quantity > 0 && stock.quantity <= stock.minStock) ||
      (stockFilter === "normal" && stock.quantity > stock.minStock);

    return matchesSearch && matchesWarehouse && matchesStockFilter;
  });

  // Calculate statistics
  const totalComponents = componentStocks.length;
  const outOfStock = componentStocks.filter((stock: ComponentStock) => stock.quantity === 0).length;
  const lowStock = componentStocks.filter((stock: ComponentStock) => 
    stock.quantity > 0 && stock.quantity <= stock.minStock
  ).length;
  const normalStock = componentStocks.filter((stock: ComponentStock) => 
    stock.quantity > stock.minStock
  ).length;

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return { status: "out", color: "destructive", icon: AlertTriangle };
    } else if (quantity <= minStock) {
      return { status: "low", color: "warning", icon: Clock };
    } else {
      return { status: "normal", color: "success", icon: CheckCircle };
    }
  };

  const getStockBadge = (quantity: number, minStock: number) => {
    const { status, color, icon: Icon } = getStockStatus(quantity, minStock);
    
    if (status === "out") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Icon className="w-3 h-3" />
          Відсутній
        </Badge>
      );
    } else if (status === "low") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <Icon className="w-3 h-3" />
          Низький
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <Icon className="w-3 h-3" />
          Нормальний
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Запаси компонентів
                </h1>
                <p className="text-gray-500 mt-1">Контроль та управління запасами компонентів на складі</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Оновити
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Всього компонентів</p>
                  <div className="text-2xl font-bold">{totalComponents}</div>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Відсутні</p>
                  <div className="text-2xl font-bold text-red-600">{outOfStock}</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Низький запас</p>
                  <div className="text-2xl font-bold text-yellow-600">{lowStock}</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Нормальний запас</p>
                  <div className="text-2xl font-bold text-green-600">{normalStock}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Фільтри</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук компонентів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі склади" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі склади</SelectItem>
                  {warehouses.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Стан запасів" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі</SelectItem>
                  <SelectItem value="out">Відсутні</SelectItem>
                  <SelectItem value="low">Низький запас</SelectItem>
                  <SelectItem value="normal">Нормальний запас</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Components Table */}
        <DataTable
          data={filteredStocks}
          columns={[
            {
              key: "componentName",
              label: "Компонент",
              sortable: true,
              render: (value: any, stock: ComponentStock) => (
                <div>
                  <div className="font-medium">{stock.component.name}</div>
                  {stock.component.description && (
                    <div className="text-sm text-gray-500">{stock.component.description}</div>
                  )}
                </div>
              )
            },
            {
              key: "sku",
              label: "Артикул",
              sortable: true,
              render: (value: any, stock: ComponentStock) => (
                <span className="font-mono text-sm">{stock.component.sku}</span>
              )
            },
            {
              key: "warehouseName",
              label: "Склад",
              sortable: true,
              render: (value: any, stock: ComponentStock) => stock.warehouse.name
            },
            {
              key: "quantity",
              label: "Кількість",
              sortable: true,
              render: (value: number) => <span className="font-medium">{value}</span>
            },
            {
              key: "minStock",
              label: "Мін. запас",
              sortable: true,
              render: (value: number) => value
            },
            {
              key: "status",
              label: "Статус",
              sortable: false,
              render: (value: any, stock: ComponentStock) => getStockBadge(stock.quantity, stock.minStock)
            },
            {
              key: "costPrice",
              label: "Ціна",
              sortable: true,
              render: (value: any, stock: ComponentStock) => `${parseFloat(stock.component.costPrice).toFixed(2)} грн`
            },
            {
              key: "totalValue",
              label: "Вартість запасу",
              sortable: true,
              render: (value: any, stock: ComponentStock) => {
                const totalValue = (parseFloat(stock.component.costPrice) * stock.quantity).toFixed(2);
                return <span className="font-medium">{totalValue} грн</span>;
              }
            }
          ]}
          loading={isLoadingStocks}
          title="Список компонентів"
          description={`Показано ${filteredStocks.length} з ${totalComponents} компонентів`}
          storageKey="component-stock"
        />
      </div>
    </div>
  );
}