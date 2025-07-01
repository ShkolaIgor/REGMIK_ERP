import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, TrendingUp, Clock, AlertTriangle, CheckCircle, BarChart3, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SearchFilters } from "@/components/SearchFilters";

export default function ProductionAnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: analyticsData = [], isLoading } = useQuery({
    queryKey: ["/api/production/analytics"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані - виправляємо обробку analytics об'єкта
  const totalDepartments = (departments as any[])?.length || 0;
  const activeWorkers = (workers as any[]).filter((w: any) => w.status === "active").length;
  
  // analyticsData може бути об'єктом, а не масивом
  const analytics = analyticsData as any;
  const totalTasks = analytics?.totalTasks || 0;
  const completedTasks = analytics?.completedTasks || 0;
  const activeTasks = analytics?.activeTasks || 0;
  const efficiency = analytics?.efficiency || 0;

  // Фільтровані дані
  const filteredAnalytics = (departments as any[]).filter((department: any) => {
    const matchesSearch = !searchQuery || 
      department.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section with Gradient */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Аналіз завантаженості виробництва
                </h1>
                <p className="text-gray-500 mt-1">Моніторинг продуктивності та завантаженості персоналу</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Експорт звіту
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Відділів</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{totalDepartments}</p>
                  <p className="text-xs text-purple-600">Всього відділів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Активні працівники</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{activeWorkers}</p>
                  <p className="text-xs text-green-600">У роботі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього завдань</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalTasks}</p>
                  <p className="text-xs text-blue-600">Створено завдань</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <Target className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Завершено</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{completedTasks}</p>
                  <p className="text-xs text-orange-600">Виконано завдань</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Аналітика завантаженості ({filteredAnalytics.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAnalytics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає відділів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnalytics.map((department: any) => (
                  <Card key={department.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <div>
                          <h3 className="font-semibold">{department.name || "Відділ"}</h3>
                          <p className="text-sm text-muted-foreground">
                            {department.description || "Опис відсутній"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800">
                          Активний
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}