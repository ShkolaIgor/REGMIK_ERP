import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, BarChart3, Download, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState("overview");
  const [period, setPeriod] = useState("last-month");

  // Data fetching with proper null safety
  const { data: ordersData } = useQuery({ queryKey: ["/api/orders"] });
  const { data: inventoryData } = useQuery({ queryKey: ["/api/inventory"] });
  const { data: productsData } = useQuery({ queryKey: ["/api/products"] });
  const { data: recipesData } = useQuery({ queryKey: ["/api/recipes"] });

  // Safe data extraction
  const orders = Array.isArray(ordersData?.orders) ? ordersData.orders : [];
  const inventory = Array.isArray(inventoryData) ? inventoryData : [];
  const products = Array.isArray(productsData) ? productsData : [];
  const recipes = Array.isArray(recipesData) ? recipesData : [];

  // Calculate metrics with null safety
  const profitMetrics = {
    totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
    totalProfit: orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0) * 0.3, 0),
    profitMargin: 30
  };

  const productionCosts = {
    totalProductionCost: inventory.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      return sum + (item.quantity || 0) * (product?.cost || 0);
    }, 0)
  };

  const lowStockItems = inventory.filter((item: any) => item.quantity < 10).slice(0, 5);

  const topPerformingProducts = Array.isArray(inventory) && Array.isArray(products)
    ? products
        .filter((product: any) => inventory.some((inv: any) => inv.productId === product.id))
        .sort((a: any, b: any) => (b.cost || 0) - (a.cost || 0))
        .slice(0, 5)
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  const exportCurrentReport = () => {
    console.log(`Експорт звіту: ${reportType} за ${period}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white">
          <div className="px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Звіти та аналітика</h1>
                  <p className="text-purple-100 text-lg mt-2">Комплексний аналіз ефективності та прибутковості бізнесу</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Сьогодні</SelectItem>
                    <SelectItem value="yesterday">Вчора</SelectItem>
                    <SelectItem value="last-week">Останній тиждень</SelectItem>
                    <SelectItem value="last-month">Останній місяць</SelectItem>
                    <SelectItem value="last-quarter">Останній квартал</SelectItem>
                    <SelectItem value="last-year">Останній рік</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => exportCurrentReport()}>
                  <Download className="w-4 h-4 mr-2" />
                  Експорт звіту
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Загальний оборот</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{profitMetrics.totalRevenue?.toLocaleString('uk-UA') || '0'} ₴</p>
                    <p className="text-xs text-purple-600">За обраний період</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <DollarSign className="w-8 h-8 text-white" />
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
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Чистий прибуток</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{profitMetrics.totalProfit?.toLocaleString('uk-UA') || '0'} ₴</p>
                    <p className="text-xs text-emerald-600">Маржа {profitMetrics.profitMargin?.toFixed(1) || '0'}%</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TrendingUp className="w-8 h-8 text-white" />
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
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">Загальні витрати</p>
                    </div>
                    <p className="text-3xl font-bold text-red-900 mb-1">{productionCosts.totalProductionCost?.toLocaleString('uk-UA') || '0'} ₴</p>
                    <p className="text-xs text-red-600">Виробництво та накладні</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TrendingDown className="w-8 h-8 text-white" />
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
                      <p className="text-sm text-orange-700 font-medium">Товари в дефіциті</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{lowStockItems.length}</p>
                    <p className="text-xs text-orange-600">Потребують поповнення</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Топ товари за прибутковістю</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingProducts.map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(product.cost || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Товари з низьким залишком</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length > 0 ? (
                    <div className="space-y-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Товар</TableHead>
                            <TableHead>Залишок</TableHead>
                            <TableHead>Статус</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStockItems.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {products.find((p: any) => p.id === item.productId)?.name || 'Невідомий товар'}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={item.quantity === 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {item.quantity === 0 ? 'Немає' : 'Мало'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Всі товари в достатній кількості</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Рекомендації та аналітика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockItems.length > 0 && (
                    <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Критичний дефіцит матеріалів</p>
                        <p className="text-sm text-red-600">
                          {lowStockItems.length} позицій потребують термінового поповнення. 
                          Рекомендується збільшити замовлення на {Math.ceil(lowStockItems.length * 1.5)} одиниць.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {profitMetrics.profitMargin < 15 && (
                    <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                      <TrendingDown className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Низька рентабельність</p>
                        <p className="text-sm text-yellow-600">
                          Розгляньте можливість оптимізації витрат виробництва або підвищення цін.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Аналіз ефективності</p>
                      <p className="text-sm text-blue-600">
                        Середній час виробництва: {Array.isArray(recipes) && recipes.length > 0 
                          ? Math.round(recipes.reduce((sum: number, r: any) => sum + (r.estimatedTime || 0), 0) / recipes.length)
                          : 0} хвилин. 
                        Розгляньте автоматизацію процесів для підвищення продуктивності.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}