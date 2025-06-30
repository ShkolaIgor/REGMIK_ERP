import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";

export default function Analytics() {
  const [period, setPeriod] = useState("month");
  
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/analytics/sales", period],
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/analytics/expenses", period],
  });

  const { data: profitData, isLoading: profitLoading } = useQuery({
    queryKey: ["/api/analytics/profit", period],
  });

  const { data: timeEntries, isLoading: timeLoading } = useQuery({
    queryKey: ["/api/analytics/time-entries", period],
  });

  const isLoading = salesLoading || expensesLoading || profitLoading;

  // Calculate totals
  const totalSales = salesData?.reduce((sum: number, item: any) => sum + item.sales, 0) || 0;
  const totalExpenses = expensesData?.reduce((sum: number, item: any) => sum + item.expenses, 0) || 0;
  const totalProfit = totalSales - totalExpenses;
  const totalTimeHours = Math.round((timeEntries?.reduce((sum: number, entry: any) => sum + entry.durationMinutes, 0) || 0) / 60);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="w-full px-8 py-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Завантаження аналітики...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 bg-clip-text text-transparent">
                      Аналітика та звіти
                    </h1>
                    <p className="text-gray-600 mt-1">Детальний аналіз ефективності бізнесу</p>
                  </div>
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
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Загальні продажі</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">₴{totalSales.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600">За {period === "week" ? "тиждень" : period === "month" ? "місяць" : "рік"}</p>
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
                    <p className="text-3xl font-bold text-red-900 mb-1">₴{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-red-600">За {period === "week" ? "тиждень" : period === "month" ? "місяць" : "рік"}</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <TrendingDown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} hover:shadow-xl transition-all duration-500 hover:scale-105 group`}>
              <CardContent className="p-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${totalProfit >= 0 ? 'from-blue-100/20' : 'from-orange-100/20'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className={`w-4 h-4 ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                      <p className={`text-sm ${totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'} font-medium`}>Прибуток</p>
                    </div>
                    <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-900' : 'text-orange-900'} mb-1`}>₴{totalProfit.toLocaleString()}</p>
                    <p className={`text-xs ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>За {period === "week" ? "тиждень" : period === "month" ? "місяць" : "рік"}</p>
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${totalProfit >= 0 ? 'from-blue-500 to-blue-700' : 'from-orange-500 to-orange-700'} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3`}>
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
                      <Clock className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Робочий час</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{totalTimeHours}г</p>
                    <p className="text-xs text-purple-600">Загальний час роботи</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Clock className="w-8 h-8 text-white" />
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