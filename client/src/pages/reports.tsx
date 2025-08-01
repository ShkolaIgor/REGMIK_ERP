import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, DoughnutChart } from "@/components/Charts";
import { formatCurrency, formatDate, getStockStatus } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Flag,
  Factory
} from "lucide-react";

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-month");
  const [reportType, setReportType] = useState("overview");

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ["/api/orders"],
  });
  
  const orders = ordersResponse?.orders || [];

  const { data: recipes = [] } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Calculate profit margins
  const calculateProfitMetrics = () => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    orders.forEach((order: any) => {
      if (order.status === 'completed') {
        totalRevenue += parseFloat(order.totalAmount);
      }
    });

    inventory.forEach((inv: any) => {
      const product = products.find((p: any) => p.id === inv.productId);
      if (product) {
        totalCost += inv.quantity * parseFloat(product.costPrice);
      }
    });

    totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin
    };
  };

  // Get low stock items for shortage report
  const getLowStockItems = () => {
    return inventory
      .filter((inv: any) => {
        const status = getStockStatus(inv.quantity, inv.minStock);
        return status === 'low-stock' || status === 'out-of-stock';
      })
      .map((inv: any) => ({
        ...inv,
        product: products.find((p: any) => p.id === inv.productId),
        status: getStockStatus(inv.quantity, inv.minStock)
      }))
      .sort((a, b) => a.quantity - b.quantity);
  };

  // Calculate production costs
  const getProductionCosts = () => {
    const totalMaterialCost = inventory.reduce((sum: number, inv: any) => {
      const product = products.find((p: any) => p.id === inv.productId);
      return sum + (product ? inv.quantity * parseFloat(product.costPrice) : 0);
    }, 0);

    const totalLaborCost = recipes.reduce((sum: number, recipe: any) => {
      return sum + parseFloat(recipe.laborCost || 0);
    }, 0);

    const overheadCost = totalMaterialCost * 0.15; // 15% overhead
    const totalProductionCost = totalMaterialCost + totalLaborCost + overheadCost;

    return {
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      overheadCost,
      totalProductionCost
    };
  };

  // Get turnover data
  const getTurnoverData = () => {
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthName = date.toLocaleDateString('uk-UA', { month: 'short' });
      
      // Simulate monthly revenue (in real app, this would be calculated from actual data)
      const revenue = Math.floor(Math.random() * 200000) + 150000;
      return { month: monthName, revenue };
    });

    return monthlyData;
  };

  const profitMetrics = calculateProfitMetrics();
  const lowStockItems = getLowStockItems();
  const productionCosts = getProductionCosts();
  const turnoverData = getTurnoverData();

  // Функції експорту
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        }).join(",")
      )
    ].join("\n");
    
    // Додаємо BOM для правильного відображення українських символів
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportCurrentReport = () => {
    const reportData = {
      profitMetrics: [profitMetrics],
      lowStockItems: lowStockItems.map(item => ({
        Товар: item.product?.name || 'Невідомий товар',
        SKU: item.product?.sku || '',
        Кількість: item.quantity,
        'Мін. запас': item.product?.minStock || 0,
        Статус: item.status === 'out-of-stock' ? 'Немає в наявності' : 'Мало на складі',
        'Вартість за одиницю': item.product?.costPrice || 0,
        'Загальна вартість': (item.quantity * parseFloat(item.product?.costPrice || '0')).toFixed(2)
      })),
      productionCosts: [productionCosts],
      turnoverData: turnoverData,
      summary: {
        'Загальний оборот': profitMetrics.totalRevenue,
        'Чистий прибуток': profitMetrics.totalProfit,
        'Маржа %': profitMetrics.profitMargin.toFixed(2),
        'Витрати виробництва': productionCosts.totalProductionCost,
        'Товарів в дефіциті': lowStockItems.length,
        'Дата звіту': new Date().toLocaleDateString('uk-UA')
      }
    };

    // Експорт як CSV
    exportToCSV([reportData.summary], 'summary_report');
    
    // Якщо є товари в дефіциті, експортуємо їх окремо
    if (reportData.lowStockItems.length > 0) {
      exportToCSV(reportData.lowStockItems, 'shortage_report');
    }
  };

  // Chart data
  const turnoverChartData = {
    labels: turnoverData.map(d => d.month),
    datasets: [{
      label: 'Оборот (₴)',
      data: turnoverData.map(d => d.revenue),
      borderColor: 'hsl(207, 90%, 54%)',
      backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const profitMarginChartData = {
    labels: ['Прибуток', 'Собівартість'],
    datasets: [{
      data: [profitMetrics.totalProfit, profitMetrics.totalCost],
      backgroundColor: [
        'hsl(142, 76%, 36%)', // Green for profit
        'hsl(0, 84%, 60%)'    // Red for cost
      ]
    }]
  };

  const productionCostChartData = {
    labels: ['Матеріали', 'Робота', 'Накладні витрати'],
    datasets: [{
      data: [
        productionCosts.materialCost,
        productionCosts.laborCost,
        productionCosts.overheadCost
      ],
      backgroundColor: [
        'hsl(207, 90%, 54%)',
        'hsl(198, 93%, 60%)',
        'hsl(43, 96%, 56%)'
      ]
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Flag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Звіти та аналітика
                  </h1>
                <p className="text-gray-500 mt-1">Прибутковість, оборот та планування матеріалів</p>
          </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-week">Останній тиждень</SelectItem>
                <SelectItem value="last-month">Останній місяць</SelectItem>
                <SelectItem value="last-quarter">Останній квартал</SelectItem>
                <SelectItem value="last-year">Останній рік</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => exportCurrentReport()}>
              <Download className="w-4 h-4 mr-2" />
              Експорт звіту
            </Button>
          </div>
          </div>
        </div>
      </header>

      {/* Key Metrics */}
      <main className="w-full px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Загальний оборот</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{formatCurrency(profitMetrics.totalRevenue)}</p>
                  <p className="text-xs text-blue-600">+15.3% за місяць</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <BarChart3 className="w-8 h-8 text-white" />
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
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700 font-medium">Чистий прибуток</p>
                </div>
                <p className="text-3xl font-bold text-emerald-900 mb-1">{formatCurrency(profitMetrics.totalProfit)}</p>
                <p className="text-xs text-emerald-600">Маржа: {profitMetrics.profitMargin.toFixed(1)}%</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                  <Factory className="w-4 h-4 text-purple-600" />
                  <p className="text-sm text-purple-700 font-medium">Витрати на виробництво</p>
                </div>
                <p className="text-3xl font-bold text-purple-900 mb-1">{formatCurrency(productionCosts.totalProductionCost)}</p>
                <p className="text-xs text-purple-600"> Всього витрат</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                <Factory className="w-8 h-8 text-white" />
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Turnover Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Динаміка обороту</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <LineChart data={turnoverChartData} />
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Структура прибутку</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <DoughnutChart data={profitMarginChartData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production Costs and Material Shortage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Структура витрат виробництва</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                <DoughnutChart data={productionCostChartData} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Матеріали:</span>
                  <span className="font-semibold">{formatCurrency(productionCosts.materialCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Робота:</span>
                  <span className="font-semibold">{formatCurrency(productionCosts.laborCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Накладні витрати:</span>
                  <span className="font-semibold">{formatCurrency(productionCosts.overheadCost)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Загалом:</span>
                    <span>{formatCurrency(productionCosts.totalProductionCost)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Shortage Planning */}
          <Card>
            <CardHeader>
              <CardTitle>Планування дефіциту матеріалів</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Всі товари в достатній кількості</p>
                  <p className="text-sm text-gray-500 mt-2">Дефіцит матеріалів відсутній</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-semibold text-red-600">
                        {lowStockItems.filter(item => item.status === 'out-of-stock').length}
                      </p>
                      <p className="text-sm text-red-600">Немає в наявності</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-semibold text-yellow-600">
                        {lowStockItems.filter(item => item.status === 'low-stock').length}
                      </p>
                      <p className="text-sm text-yellow-600">Мало на складі</p>
                    </div>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead>Кількість</TableHead>
                          <TableHead>Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.slice(0, 10).map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.product?.name || 'Невідомий товар'}</div>
                              <div className="text-xs text-gray-500">{item.product?.sku}</div>
                            </TableCell>
                            <TableCell>{item.quantity} шт</TableCell>
                            <TableCell>
                              <Badge 
                                className={item.status === 'out-of-stock' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {item.status === 'out-of-stock' ? 'Немає' : 'Мало'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Детальний аналіз прибутковості</CardTitle>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Загальний огляд</SelectItem>
                  <SelectItem value="products">По товарах</SelectItem>
                  <SelectItem value="categories">По категоріях</SelectItem>
                  <SelectItem value="orders">По замовленнях</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Рентабельність</h3>
                <p className="text-3xl font-bold text-green-600">
                  {profitMetrics.profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {profitMetrics.profitMargin >= 20 ? 'Відмінний показник' : 
                   profitMetrics.profitMargin >= 10 ? 'Нормальний показник' : 'Потребує покращення'}
                </p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Оборотність запасів</h3>
                <p className="text-3xl font-bold text-blue-600">4.2</p>
                <p className="text-sm text-blue-600 mt-2">Разів на рік</p>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">ROI виробництва</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {((profitMetrics.totalProfit / productionCosts.totalProductionCost) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-orange-600 mt-2">Повернення інвестицій</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Рекомендації щодо оптимізації</h4>
              <div className="space-y-3">
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
                      Середній час виробництва: {recipes.length > 0 
                        ? Math.round(recipes.reduce((sum: number, r: any) => sum + (r.estimatedTime || 0), 0) / recipes.length)
                        : 0} хвилин. 
                      Розгляньте автоматизацію процесів для підвищення продуктивності.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
