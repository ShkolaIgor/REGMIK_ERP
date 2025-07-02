import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Clock, ChartSpline} from "lucide-react";
import { LoadingState, DashboardLoadingState } from "@/components/ui/loading-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [period, setPeriod] = useState("month");

  const { data: salesData = { totalSales: 0, orderCount: 0 }, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/analytics/sales", period],
  });

  const { data: expensesData = { totalExpenses: 0, calculationCount: 0 }, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/analytics/expenses", period],
  });

  const { data: profitData = { totalProfit: 0, profitMargin: 0 }, isLoading: profitLoading } = useQuery({
    queryKey: ["/api/analytics/profit", period],
  });

  const { data: timeEntries = [], isLoading: timeLoading } = useQuery({
    queryKey: ["/api/time-entries"],
  });

  const { data: inventoryAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/inventory/alerts"],
  });

  // Обчислюємо загальні показники
  const totalSales = salesData.totalSales || 0;
  const totalExpenses = expensesData.totalExpenses || 0;
  const totalProfit = profitData.totalProfit || 0;

  // Дані для кругової діаграми витрат (використовуємо заглушки для демонстрації)
  const expensesPieData = totalExpenses > 0 ? [
    { name: 'Виробництво', value: totalExpenses * 0.6 },
    { name: 'Логістика', value: totalExpenses * 0.25 },
    { name: 'Адміністрування', value: totalExpenses * 0.15 }
  ] : [];

  // Обчислюємо загальний час роботи
  const totalTimeMinutes = timeEntries.reduce((sum: number, entry: any) => 
    sum + (entry.durationMinutes || 0), 0
  );
  const totalTimeHours = Math.round(totalTimeMinutes / 60 * 10) / 10;

  const isLoading = salesLoading || expensesLoading || profitLoading || timeLoading || alertsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Аналітика</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section  sticky top-0 z-40*/}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ChartSpline className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Аналітика
                    </h1>
                    <p className="text-gray-500 mt-1">Аналітика виробництва</p>
                  </div>
                </div>
            <div className="flex items-center space-x-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Тиждень</SelectItem>
                <SelectItem value="month">Місяць</SelectItem>
                <SelectItem value="year">Рік</SelectItem>
              </SelectContent>
            </Select>
            </div>
              </div>
          </div>
        </header>
        
      {/* Основні показники */}
      {/* Statistics Cards */}
        {salesLoading || expensesLoading || timeLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
        <div className="w-full px-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Загальні продажі</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">₴{totalSales.toLocaleString()}</p>
                    <p className="text-xs text-blue-600">Загальні продажі</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TrendingUp className="w-8 h-8 text-white" />
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
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Загальні витрати</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">₴{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600">Загальні витрати</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TrendingDown className="w-8 h-8 text-white" />
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
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Прибуток</p>
                    </div>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₴{totalProfit.toLocaleString()}</p>
                    <p className="text-xs text-purple-600">Прибуток</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <DollarSign className="w-8 h-8 text-white" />
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
                      <p className="text-sm text-orange-700 font-medium">Відпрацьовано годин</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{totalTimeHours}</p>
                    <p className="text-xs text-orange-600">≠</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        )}


      <Tabs defaultValue="profit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profit">Прибутковість</TabsTrigger>
          <TabsTrigger value="expenses">Витрати</TabsTrigger>
          <TabsTrigger value="time">Час роботи</TabsTrigger>
          <TabsTrigger value="alerts">Сповіщення</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Динаміка прибутковості</CardTitle>
              <CardDescription>
                Порівняння продажів, витрат та прибутку за обраний період
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profitLoading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₴${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#10B981" name="Продажі" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Витрати" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Прибуток" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Витрати за категоріями</CardTitle>
                <CardDescription>Розподіл витрат по категоріях</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₴${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Динаміка витрат</CardTitle>
                <CardDescription>Витрати за період</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { category: 'Виробництво', amount: totalExpenses * 0.6 },
                    { category: 'Логістика', amount: totalExpenses * 0.25 },
                    { category: 'Адміністрування', amount: totalExpenses * 0.15 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₴${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Відстеження часу роботи</CardTitle>
              <CardDescription>Записи про витрачений час працівників</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntries.slice(0, 10).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{entry.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.startTime).toLocaleString('uk-UA')} - 
                        {entry.endTime ? new Date(entry.endTime).toLocaleString('uk-UA') : 'В процесі'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{Math.round(entry.durationMinutes / 6) / 10} год</p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                {timeEntries.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Немає записів про час роботи
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Сповіщення про запаси</CardTitle>
              <CardDescription>Товари з низьким рівнем запасів</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      {alert.alertType === 'low_stock' ? 'Низький запас' : alert.alertType}
                    </Badge>
                  </div>
                ))}
                {inventoryAlerts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Немає активних сповіщень
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}