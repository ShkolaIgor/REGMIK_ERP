import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Star,
  Activity,
  Calendar,
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

  const { data: categoryStats, isLoading: categoryLoading } = useQuery<ProductionStat[]>({
    queryKey: ["/api/production-stats/by-category"],
  });

  const { data: periodStats, isLoading: periodLoading } = useQuery<PeriodStat[]>({
    queryKey: ["/api/production-stats/by-period", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/production-stats/by-period?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch period stats');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalProduced = stats?.reduce((sum, stat) => sum + stat.totalProduced, 0) || 0;
  const totalValue = stats?.reduce((sum, stat) => sum + stat.totalValue, 0) || 0;
  const totalProducts = stats?.reduce((sum, stat) => sum + stat.productsCount, 0) || 0;
  const avgQuality = stats?.length ? 
    stats.reduce((sum, stat) => sum + parseInt(stat.averageQuality), 0) / stats.length : 0;

  const chartData = stats?.map((stat) => ({
    name: stat.categoryName,
    produced: stat.totalProduced,
    value: stat.totalValue,
    products: stat.productsCount,
    quality: parseInt(stat.averageQuality)
  })) || [];

  const pieData = stats?.map((stat, index) => ({
    name: stat.categoryName,
    value: stat.totalValue,
    color: `hsl(${index * 60}, 70%, 50%)`
  })) || [];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Статистика виробництва</h1>
          <p className="text-gray-600">Аналіз виготовленої продукції у розрізі категорій</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          <Activity className="w-4 h-4 mr-1" />
          Онлайн
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальний обсяг</p>
                <p className="text-2xl font-bold text-gray-900">{totalProduced.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">одиниць виготовлено</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Загальна вартість</p>
                <p className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()} грн</p>
                <p className="text-xs text-green-600 mt-1">виробленої продукції</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Номенклатура</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
                <p className="text-xs text-purple-600 mt-1">найменувань продукції</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Середня якість</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgQuality)}%</p>
                <p className="text-xs text-orange-600 mt-1">виготовленої продукції</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Обсяг виробництва по категоріях
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} од.`, 
                    name === 'produced' ? 'Виготовлено' : name
                  ]}
                />
                <Bar dataKey="produced" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Розподіл вартості виробництва
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} грн`, 'Вартість']} />
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
            {stats?.map((stat, index) => (
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
    </div>
  );
}