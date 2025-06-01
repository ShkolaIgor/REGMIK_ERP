import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, DoughnutChart } from "@/components/Charts";

import { useState } from "react";
import { 
  Package, 
  ShoppingCart, 
  Cog, 
  AlertTriangle, 
  Scan, 
  Plus, 
  ShoppingCartIcon,
  Printer
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarcodeScanner } from "@/components/BarcodeScanner";

export default function Dashboard() {
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeScanned = (product: any) => {
    console.log("Product found:", product);
    // Тут можна додати логіку для роботи зі знайденим товаром
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/production-tasks"],
  });

  const recentProducts = products.slice(0, 4);
  
  const kanbanStats = {
    planned: tasks.filter((t: any) => t.status === 'planned').length,
    inProgress: tasks.filter((t: any) => t.status === 'in-progress').length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
  };

  const inventoryChartData = {
    labels: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер'],
    datasets: [{
      label: 'Загальні запаси',
      data: [1200, 1150, 1300, 1247, 1180, 1247],
      borderColor: 'hsl(207, 90%, 54%)',
      backgroundColor: 'hsla(207, 90%, 54%, 0.1)',
      tension: 0.4
    }]
  };

  const costChartData = {
    labels: ['Матеріали', 'Робота', 'Накладні', 'Інше'],
    datasets: [{
      data: [45, 30, 20, 5],
      backgroundColor: [
        'hsl(207, 90%, 54%)',
        'hsl(198, 93%, 60%)',
        'hsl(43, 96%, 56%)',
        'hsl(142, 76%, 36%)'
      ]
    }]
  };

  if (statsLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Дашборд</h2>
            <p className="text-gray-600">Огляд системи обліку та виробництва</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Нове замовлення
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Олексій Петренко</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всього товарів</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-green-600">+12%</span>
                <span className="text-gray-600 ml-2">за місяць</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Активні замовлення</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.activeOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-green-600">+5</span>
                <span className="text-gray-600 ml-2">сьогодні</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Виробничі завдання</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {stats?.productionTasks || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cog className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-yellow-600">{kanbanStats.inProgress}</span>
                <span className="text-gray-600 ml-2">в роботі</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Дефіцит товарів</p>
                  <p className="text-3xl font-semibold text-red-600">
                    {stats?.lowStockCount || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-red-600">Потребує уваги</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Дефіцит матеріалів</p>
                  <p className="text-3xl font-semibold text-orange-600">
                    {stats?.materialShortages || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCartIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-orange-600">Потребує замовлення</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Критичний дефіцит</p>
                  <p className="text-3xl font-semibold text-red-600">
                    {stats?.criticalShortages || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-red-600">Негайно</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Products */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Нові товари</CardTitle>
                  <Button variant="link">Переглянути всі</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(product.retailPrice)}
                          </span>
                          <Badge className="bg-green-100 text-green-800">
                            В наявності
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Виробництво</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-800">До виконання</span>
                    <Badge className="bg-yellow-200 text-yellow-800">
                      {kanbanStats.planned}
                    </Badge>
                  </div>
                  <div className="text-sm text-yellow-700">Заплановані завдання</div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">В роботі</span>
                    <Badge className="bg-blue-200 text-blue-800">
                      {kanbanStats.inProgress}
                    </Badge>
                  </div>
                  <div className="text-sm text-blue-700">Активні завдання</div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Виконано</span>
                    <Badge className="bg-green-200 text-green-800">
                      {kanbanStats.completed}
                    </Badge>
                  </div>
                  <div className="text-sm text-green-700">Завершені завдання</div>
                </div>
              </div>

              <Button className="w-full mt-4">
                Повний Kanban
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Динаміка запасів</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <LineChart data={inventoryChartData} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Собівартість виробництва</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <DoughnutChart data={costChartData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Швидкі дії</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
                onClick={() => setShowScanner(true)}
              >
                <Scan className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">Сканувати штрих-код</span>
                <span className="text-xs text-gray-500 mt-1">Швидке додавання</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Plus className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Новий товар</span>
                <span className="text-xs text-gray-500 mt-1">Додати в каталог</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <ShoppingCartIcon className="w-8 h-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Нове замовлення</span>
                <span className="text-xs text-gray-500 mt-1">Створити замовлення</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center p-6 h-auto"
              >
                <Printer className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Друк етикеток</span>
                <span className="text-xs text-gray-500 mt-1">Для товарів</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onProductFound={handleBarcodeScanned}
      />
    </div>
  );
}
