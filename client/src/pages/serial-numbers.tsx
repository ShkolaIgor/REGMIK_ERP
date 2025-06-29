import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash, Search, QrCode, Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { SerialNumber, Product, Warehouse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/SearchFilters";

const statusLabels = {
  available: "Доступний",
  reserved: "Зарезервований",
  sold: "Проданий",
  defective: "Дефектний",
};

const statusColors = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  sold: "bg-blue-100 text-blue-800",
  defective: "bg-red-100 text-red-800",
};

export default function SerialNumbers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SerialNumber | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: serialNumbers = [], isLoading } = useQuery({
    queryKey: ["/api/serial-numbers"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalSerialNumbers = (serialNumbers as any[])?.length || 0;
  const availableCount = (serialNumbers as any[]).filter((s: any) => s.status === "available").length;
  const soldCount = (serialNumbers as any[]).filter((s: any) => s.status === "sold").length;
  const reservedCount = (serialNumbers as any[]).filter((s: any) => s.status === "reserved").length;

  // Фільтровані дані
  const filteredSerialNumbers = (serialNumbers as any[]).filter((serialNumber: any) => {
    const matchesSearch = !searchQuery || 
      serialNumber.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serialNumber.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      serialNumber.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <QrCode className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                  Серійні номери
                </h1>
                <p className="text-pink-100 text-xl font-medium">Управління серійними номерами товарів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setEditingItem(null)}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Новий серійний номер
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Додати серійний номер</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">
                    <p>Форма додавання серійного номера буде додана</p>
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
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <p className="text-sm text-indigo-700 font-medium">Всього номерів</p>
                  </div>
                  <p className="text-3xl font-bold text-indigo-900 mb-1">{totalSerialNumbers}</p>
                  <p className="text-xs text-indigo-600">Загальна кількість</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <QrCode className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-green-700 font-medium">Доступні</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">{availableCount}</p>
                  <p className="text-xs text-green-600">Готові до продажу</p>
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
                    <Package className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Продано</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{soldCount}</p>
                  <p className="text-xs text-blue-600">Реалізовано</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
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
                    <p className="text-sm text-yellow-700 font-medium">Зарезервовані</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{reservedCount}</p>
                  <p className="text-xs text-yellow-600">Під замовлення</p>
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
            <CardTitle>Серійні номери ({filteredSerialNumbers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSerialNumbers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає серійних номерів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSerialNumbers.map((serialNumber: any) => (
                  <Card key={serialNumber.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <QrCode className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h3 className="font-semibold">{serialNumber.serialNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            Товар: {serialNumber.product?.name || "Невідомо"} | SKU: {serialNumber.product?.sku || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={statusColors[serialNumber.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                          {statusLabels[serialNumber.status as keyof typeof statusLabels] || serialNumber.status}
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