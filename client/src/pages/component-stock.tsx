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
  const [categoryFilter, setCategoryFilter] = useState("all"); // all or category ID

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

  // Fetch component categories for filter
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/component-categories"],
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

    const matchesCategory = categoryFilter === "all" || 
      stock.component.categoryId?.toString() === categoryFilter;

    return matchesSearch && matchesWarehouse && matchesStockFilter && matchesCategory;
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
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього компонентів</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalComponents}</p>

                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">Відсутні</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900 mb-1">{outOfStock}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-yellow-700 font-medium">Низький запас</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{lowStock}</p>
                  <p className="text-xs text-yellow-600">Потрібна увага</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Нормальний запас</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{normalStock}</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук компонентів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі категорії" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
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
              key: "category",
              label: "Категорія",
              sortable: true,
              render: (value: any, stock: ComponentStock) => {
                // Знайти категорію за categoryId з завантажених категорій
                const category = categories.find((cat: any) => cat.id === stock.component.categoryId);
                if (!category) return <span className="text-gray-400 text-sm">Не вказано</span>;
                
                return (
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="text-sm">{category.name}</span>
                  </div>
                );
              }
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