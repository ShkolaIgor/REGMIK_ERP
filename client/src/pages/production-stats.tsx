import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  DollarSign,
  TrendingUp,
  Boxes,
  Activity,
  BarChart3,
  Calendar,
  ShoppingCart,
  Truck,
  FileChartPie,
  Clock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface ProductionStat {
  categoryId: number;
  categoryName: string;
  totalProduced: number;
  totalValue: number;
  productsCount: number;
  averageQuality: string;
}

interface PeriodStat {
  date: string;
  ordered: number;
  paid: number;
  produced: number;
  shipped: number;
  orderedValue: number;
  paidValue: number;
  producedValue: number;
  shippedValue: number;
}

export default function ProductionStats() {
  const [selectedTab, setSelectedTab] = useState<'category' | 'period'>('category');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [categoryPeriod, setCategoryPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: categoryStats, isLoading: categoryLoading } = useQuery<ProductionStat[]>({
    queryKey: ["/api/production-stats/by-category", categoryPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/production-stats/by-category?period=${categoryPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch category stats');
      return response.json();
    },
  });

  const { data: periodStats, isLoading: periodLoading } = useQuery<PeriodStat[]>({
    queryKey: ["/api/production-stats/by-period", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/production-stats/by-period?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch period stats');
      return response.json();
    },
  });

  if (categoryLoading || periodLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculations for category tab
  const totalProduced = categoryStats?.reduce((sum, stat) => sum + stat.totalProduced, 0) || 0;
  const totalValue = categoryStats?.reduce((sum, stat) => sum + stat.totalValue, 0) || 0;
  const totalProducts = categoryStats?.reduce((sum, stat) => sum + stat.productsCount, 0) || 0;
  const avgQuality = categoryStats?.length ? 
    categoryStats.reduce((sum, stat) => sum + parseInt(stat.averageQuality), 0) / categoryStats.length : 0;

  const chartData = categoryStats?.map((stat) => ({
    name: stat.categoryName,
    produced: stat.totalProduced,
    value: stat.totalValue,
    products: stat.productsCount,
    quality: parseInt(stat.averageQuality)
  })) || [];

  const pieData = categoryStats?.map((stat, index) => ({
    name: stat.categoryName,
    value: stat.totalValue,
    color: `hsl(${index * 60}, 70%, 50%)`
  })) || [];

  // Calculations for period tab
  const periodTotals = periodStats?.reduce((acc, stat) => ({
    totalOrdered: acc.totalOrdered + stat.ordered,
    totalPaid: acc.totalPaid + stat.paid,
    totalProduced: acc.totalProduced + stat.produced,
    totalShipped: acc.totalShipped + stat.shipped,
    totalOrderedValue: acc.totalOrderedValue + stat.orderedValue,
    totalPaidValue: acc.totalPaidValue + stat.paidValue,
    totalProducedValue: acc.totalProducedValue + stat.producedValue,
    totalShippedValue: acc.totalShippedValue + stat.shippedValue,
  }), {
    totalOrdered: 0,
    totalPaid: 0,
    totalProduced: 0,
    totalShipped: 0,
    totalOrderedValue: 0,
    totalPaidValue: 0,
    totalProducedValue: 0,
    totalShippedValue: 0,
  }) || {
    totalOrdered: 0,
    totalPaid: 0,
    totalProduced: 0,
    totalShipped: 0,
    totalOrderedValue: 0,
    totalPaidValue: 0,
    totalProducedValue: 0,
    totalShippedValue: 0,
  };

  const periodChartData = periodStats?.map((stat) => ({
    date: stat.date,
    Замовлено: stat.ordered,
    Оплачено: stat.paid,
    Виготовлено: stat.produced,
    Відвантажено: stat.shipped,
  })) || [];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section  sticky top-0 z-40*/}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileChartPie className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Статистика виробництва</h1>
                    <p className="text-gray-500 mt-1">Аналіз виготовленої продукції та замовлень</p>
                  </div>
                </div>
          </div>  
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={selectedTab === 'category' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('category')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          По категоріях
        </Button>
        <Button
          variant={selectedTab === 'period' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('period')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          За періодом
        </Button>
      </div>

      {/* Period filters for both tabs */}
      <div className="flex space-x-2">
        <Button
          variant={(selectedTab === 'category' ? categoryPeriod : selectedPeriod) === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => selectedTab === 'category' ? setCategoryPeriod('week') : setSelectedPeriod('week')}
        >
          Тиждень
        </Button>
        <Button
          variant={(selectedTab === 'category' ? categoryPeriod : selectedPeriod) === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => selectedTab === 'category' ? setCategoryPeriod('month') : setSelectedPeriod('month')}
        >
          Місяць
        </Button>
        <Button
          variant={(selectedTab === 'category' ? categoryPeriod : selectedPeriod) === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => selectedTab === 'category' ? setCategoryPeriod('year') : setSelectedPeriod('year')}
        >
          Рік
        </Button>
      </div>

      {/* Category Statistics Tab */}
      {selectedTab === 'category' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Загальна кількість</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProduced.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Загальна вартість</p>
                    <p className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()} грн</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Кількість продуктів</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Boxes className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Середня якість</p>
                    <p className="text-2xl font-bold text-gray-900">{avgQuality.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Виробництво по категоріях</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${parseInt(value as string).toLocaleString()}`,
                        name === 'produced' ? 'Виготовлено' : 
                        name === 'value' ? 'Вартість (грн)' : 
                        name === 'products' ? 'Продуктів' : 'Якість (%)'
                      ]}
                    />
                    <Bar dataKey="produced" fill="#3B82F6" name="produced" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Розподіл вартості</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${parseInt(value as string).toLocaleString()} грн`, 'Вартість']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детальна статистика по категоріях</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats?.map((stat, index) => (
                  <div key={stat.categoryId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{stat.categoryName}</h3>
                      <Badge variant="secondary">{stat.productsCount} продуктів</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Виготовлено</p>
                        <p className="text-xl font-bold">{stat.totalProduced.toLocaleString()} од.</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Вартість</p>
                        <p className="text-xl font-bold">{stat.totalValue.toLocaleString()} грн</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Якість</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${parseInt(stat.averageQuality)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stat.averageQuality}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Period Statistics Tab */}
      {selectedTab === 'period' && (
        <>
          {/* Period Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Замовлено</p>
                    <p className="text-2xl font-bold text-gray-900">{periodTotals.totalOrdered.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Оплачено</p>
                    <p className="text-2xl font-bold text-gray-900">{periodTotals.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Виготовлено</p>
                    <p className="text-2xl font-bold text-gray-900">{periodTotals.totalProduced.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Відвантажено</p>
                    <p className="text-2xl font-bold text-gray-900">{periodTotals.totalShipped.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Period Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Динаміка замовлень за {selectedPeriod === 'week' ? 'тижнями' : selectedPeriod === 'month' ? 'місяцями' : 'роками'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={periodChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Замовлено" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Оплачено" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Виготовлено" stroke="#8B5CF6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Відвантажено" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Period Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детальна статистика за період</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {periodStats?.map((stat, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{stat.date}</h3>
                      <Badge variant="outline">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedPeriod === 'week' ? 'Тиждень' : selectedPeriod === 'month' ? 'Місяць' : 'Рік'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Замовлено</p>
                        <p className="text-xl font-bold">{stat.ordered.toLocaleString()} од.</p>
                        <p className="text-sm text-gray-500">{stat.orderedValue.toLocaleString()} грн</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Оплачено</p>
                        <p className="text-xl font-bold">{stat.paid.toLocaleString()} од.</p>
                        <p className="text-sm text-gray-500">{stat.paidValue.toLocaleString()} грн</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Виготовлено</p>
                        <p className="text-xl font-bold">{stat.produced.toLocaleString()} од.</p>
                        <p className="text-sm text-gray-500">{stat.producedValue.toLocaleString()} грн</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Відвантажено</p>
                        <p className="text-xl font-bold">{stat.shipped.toLocaleString()} од.</p>
                        <p className="text-sm text-gray-500">{stat.shippedValue.toLocaleString()} грн</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}