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

  // Статистичні дані
  const totalDepartments = (departments as any[])?.length || 0;
  const activeWorkers = (workers as any[]).filter((w: any) => w.status === "active").length;
  const totalTasks = (analyticsData as any[])?.length || 0;
  const completedTasks = (analyticsData as any[]).filter((t: any) => t.status === "completed").length;

  // Фільтровані дані
  const filteredAnalytics = (analyticsData as any[]).filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.department?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.worker?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <BarChart3 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                  Аналіз завантаженості виробництва
                </h1>
                <p className="text-pink-100 text-xl font-medium">Моніторинг продуктивності та завантаженості персоналу</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
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
                Немає даних для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnalytics.map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <div>
                          <h3 className="font-semibold">{item.department?.name || "Відділ"}</h3>
                          <p className="text-sm text-muted-foreground">Працівник: {item.worker?.name || "Невідомо"}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={item.efficiency || 75} className="w-24" />
                        <Badge className="bg-blue-100 text-blue-800">
                          {item.efficiency || 75}%
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
    </>
  );
}