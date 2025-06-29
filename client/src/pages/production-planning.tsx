import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Factory, Package, Plus, TrendingUp, AlertTriangle, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SearchFilters } from "@/components/SearchFilters";

export default function ProductionPlanning() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["/api/production-plans"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalPlans = (plans as any[])?.length || 0;
  const activePlans = (plans as any[]).filter((p: any) => p.status === "active").length;
  const pendingPlans = (plans as any[]).filter((p: any) => p.status === "pending").length;
  const completedPlans = (plans as any[]).filter((p: any) => p.status === "completed").length;

  // Фільтровані дані
  const filteredPlans = (plans as any[]).filter((plan: any) => {
    const matchesSearch = !searchQuery || 
      plan.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="w-full space-y-8">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <CalendarDays className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Планування виробництва
                </h1>
                <p className="text-blue-100 text-xl font-medium">Стратегічне планування виробничих процесів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Новий план
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити план виробництва</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p>Форма створення плану буде додана</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього планів</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalPlans}</p>
                  <p className="text-xs text-blue-600">Створено планів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CalendarDays className="w-8 h-8 text-white" />
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
                    <Factory className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Активні</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{activePlans}</p>
                  <p className="text-xs text-green-600">У виконанні</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Factory className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Очікують</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{pendingPlans}</p>
                  <p className="text-xs text-yellow-600">На затвердження</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <Target className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Завершені</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{completedPlans}</p>
                  <p className="text-xs text-purple-600">Виконано планів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
            <CardTitle>Плани виробництва ({filteredPlans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає планів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPlans.map((plan: any) => (
                  <Card key={plan.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{plan.product?.name || "План виробництва"}</h3>
                          <p className="text-sm text-muted-foreground">Кількість: {plan.plannedQuantity || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          plan.status === "active" ? "bg-green-100 text-green-800" :
                          plan.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          plan.status === "completed" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {plan.status === "active" ? "Активний" :
                           plan.status === "pending" ? "Очікує" :
                           plan.status === "completed" ? "Завершений" : plan.status}
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