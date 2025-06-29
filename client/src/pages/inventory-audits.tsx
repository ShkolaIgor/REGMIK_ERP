import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, Search, Calculator, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/SearchFilters";

export default function InventoryAuditsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["/api/inventory-audits"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalAudits = (audits as any[])?.length || 0;
  const activeAudits = (audits as any[]).filter((a: any) => a.status === "active").length;
  const completedAudits = (audits as any[]).filter((a: any) => a.status === "completed").length;
  const plannedAudits = (audits as any[]).filter((a: any) => a.status === "planned").length;

  // Фільтровані дані
  const filteredAudits = (audits as any[]).filter((audit: any) => {
    const matchesSearch = !searchQuery || 
      audit.warehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.auditType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <ClipboardList className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Інвентаризації
                </h1>
                <p className="text-gray-100 text-xl font-medium">Планування та проведення інвентаризацій складів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Нова інвентаризація
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити інвентаризацію</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p>Форма створення інвентаризації буде додана</p>
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
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="w-4 h-4 text-slate-600" />
                    <p className="text-sm text-slate-700 font-medium">Всього інвентаризацій</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{totalAudits}</p>
                  <p className="text-xs text-slate-600">Загальна кількість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ClipboardList className="w-8 h-8 text-white" />
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
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Активні</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{activeAudits}</p>
                  <p className="text-xs text-blue-600">В процесі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Calculator className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-green-700 font-medium">Завершені</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{completedAudits}</p>
                  <p className="text-xs text-green-600">Готові звіти</p>
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
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Заплановані</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{plannedAudits}</p>
                  <p className="text-xs text-yellow-600">Очікують виконання</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
            <CardTitle>Інвентаризації ({filteredAudits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAudits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає інвентаризацій для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits.map((audit: any) => (
                  <Card key={audit.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ClipboardList className="h-5 w-5 text-slate-600" />
                        <div>
                          <h3 className="font-semibold">{audit.warehouse?.name || "Склад"}</h3>
                          <p className="text-sm text-muted-foreground">
                            Тип: {audit.auditType || "Не вказано"} | Дата: {audit.plannedDate || "Не заплановано"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          audit.status === "completed" ? "bg-green-100 text-green-800" :
                          audit.status === "active" ? "bg-blue-100 text-blue-800" :
                          audit.status === "planned" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {audit.status === "completed" ? "Завершено" :
                           audit.status === "active" ? "Активна" :
                           audit.status === "planned" ? "Заплановано" : audit.status}
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