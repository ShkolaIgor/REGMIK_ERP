import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Clock } from "lucide-react";
import { LoadingState, DashboardLoadingState, ChartSkeleton, CardSkeleton } from "@/components/ui/loading-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [period, setPeriod] = useState("month");

  const { data: salesData = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/analytics/sales", period],
  });

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/analytics/expenses", period],
  });

  const { data: profitData = [], isLoading: profitLoading } = useQuery({
    queryKey: ["/api/analytics/profit", period],
  });

  const { data: timeEntries = [], isLoading: timeLoading } = useQuery({
    queryKey: ["/api/time-entries"],
  });

  const { data: inventoryAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/inventory/alerts"],
  });

  // Обчислюємо загальні показники
  const totalSales = salesData.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalAmount || 0), 0);
  const totalExpenses = expensesData.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0);
  const totalProfit = totalSales - totalExpenses;

  // Групуємо витрати за категоріями
  const expensesByCategory = expensesData.reduce((acc: any, expense: any) => {
    const category = expense.category || 'Інше';
    acc[category] = (acc[category] || 0) + parseFloat(expense.amount || 0);
    return acc;
  }, {});

  const expensesPieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Аналітика</h1>
        <div className="flex gap-2">
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

      {/* Основні показники */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {salesLoading || expensesLoading || timeLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Загальні продажі</p>
                    <p className="text-2xl font-bold text-green-600">₴{totalSales.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Загальні витрати</p>
                    <p className="text-2xl font-bold text-red-600">₴{totalExpenses.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Прибуток</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₴{totalProfit.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Відпрацьовано годин</p>
                    <p className="text-2xl font-bold text-blue-600">{totalTimeHours}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

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
                  <BarChart data={expensesData.slice(0, 10)}>
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