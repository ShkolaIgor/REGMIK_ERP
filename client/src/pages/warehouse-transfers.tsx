import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeftRight, Package, Truck, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";

export default function WarehouseTransfers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["/api/warehouse-transfers"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalTransfers = (transfers as any[])?.length || 0;
  const pendingTransfers = (transfers as any[]).filter((t: any) => t.status === "pending").length;
  const completedTransfers = (transfers as any[]).filter((t: any) => t.status === "completed").length;
  const inTransitTransfers = (transfers as any[]).filter((t: any) => t.status === "in_transit").length;

  // Фільтровані дані
  const filteredTransfers = (transfers as any[]).filter((transfer: any) => {
    const matchesSearch = !searchQuery || 
      transfer.fromWarehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.toWarehouse?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <ArrowLeftRight className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  Переміщення між складами
                </h1>
                <p className="text-emerald-100 text-xl font-medium">Управління переміщенням товарів між складськими приміщеннями</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Нове переміщення
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити переміщення</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p>Форма створення переміщення буде додана</p>
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
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Всього переміщень</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{totalTransfers}</p>
                  <p className="text-xs text-emerald-600">Загальна кількість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ArrowLeftRight className="w-8 h-8 text-white" />
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
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{pendingTransfers}</p>
                  <p className="text-xs text-yellow-600">На затвердження</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
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
                    <Truck className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">В дорозі</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{inTransitTransfers}</p>
                  <p className="text-xs text-blue-600">Транспортуються</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Truck className="w-8 h-8 text-white" />
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
                  <p className="text-3xl font-bold text-green-900 mb-1">{completedTransfers}</p>
                  <p className="text-xs text-green-600">Успішно виконано</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <CheckCircle className="w-8 h-8 text-white" />
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
            <CardTitle>Переміщення між складами ({filteredTransfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransfers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає переміщень для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransfers.map((transfer: any) => (
                  <Card key={transfer.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                        <div>
                          <h3 className="font-semibold">
                            {transfer.fromWarehouse?.name || "Невідомо"} → {transfer.toWarehouse?.name || "Невідомо"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Причина: {transfer.reason || "Не вказано"} | Запитано: {transfer.requestedDate || "Не вказано"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          transfer.status === "completed" ? "bg-green-100 text-green-800" :
                          transfer.status === "in_transit" ? "bg-blue-100 text-blue-800" :
                          transfer.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          transfer.status === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {transfer.status === "completed" ? "Завершено" :
                           transfer.status === "in_transit" ? "В дорозі" :
                           transfer.status === "pending" ? "Очікує" :
                           transfer.status === "cancelled" ? "Скасовано" : transfer.status}
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