import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, Filter, Wrench, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Repair } from "@shared/schema";
import { SearchFilters } from "@/components/SearchFilters";

const statusLabels = {
  received: "Отримано",
  diagnosed: "Діагностовано", 
  in_repair: "В ремонті",
  testing: "Тестування",
  completed: "Завершено",
  returned: "Повернено",
  cancelled: "Скасовано"
};

const typeLabels = {
  warranty: "Гарантійний",
  non_warranty: "Позагарантійний"
};

export default function RepairsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const queryClient = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["/api/repairs"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalRepairs = (repairs as any[])?.length || 0;
  const inRepairCount = (repairs as any[]).filter((r: any) => r.status === "in_repair").length;
  const completedCount = (repairs as any[]).filter((r: any) => r.status === "completed").length;
  const pendingCount = (repairs as any[]).filter((r: any) => r.status === "received").length;

  // Фільтровані дані
  const filteredRepairs = (repairs as any[]).filter((repair: any) => {
    const matchesSearch = !searchQuery || 
      repair.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.deviceModel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Wrench className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  Ремонти
                </h1>
                <p className="text-orange-100 text-xl font-medium">Управління ремонтними роботами та сервісом</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Новий ремонт
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити заявку на ремонт</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p>Форма створення ремонту буде додана</p>
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
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Всього ремонтів</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{totalRepairs}</p>
                  <p className="text-xs text-orange-600">Загальна кількість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Wrench className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-blue-700 font-medium">В ремонті</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{inRepairCount}</p>
                  <p className="text-xs text-blue-600">Активні роботи</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-green-700 font-medium">Завершено</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{completedCount}</p>
                  <p className="text-xs text-green-600">Готових ремонтів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
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
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Очікують</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{pendingCount}</p>
                  <p className="text-xs text-yellow-600">Нові заявки</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
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
            <CardTitle>Ремонтні роботи ({filteredRepairs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRepairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає ремонтів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRepairs.map((repair: any) => (
                  <Card key={repair.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Wrench className="h-5 w-5 text-orange-600" />
                        <div>
                          <h3 className="font-semibold">{repair.deviceModel || "Пристрій"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Клієнт: {repair.clientName || "Невідомо"} | S/N: {repair.serialNumber || "Не вказано"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          repair.status === "completed" ? "bg-green-100 text-green-800" :
                          repair.status === "in_repair" ? "bg-blue-100 text-blue-800" :
                          repair.status === "received" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {statusLabels[repair.status as keyof typeof statusLabels] || repair.status}
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