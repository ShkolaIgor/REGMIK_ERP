import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Package, Factory, CheckCircle, ArrowRight, Trash2, ShoppingCart, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SearchFilters } from "@/components/SearchFilters";

export default function OrderedProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderedProducts = [], isLoading } = useQuery({
    queryKey: ["/api/products/ordered"],
  });

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані для замовлених товарів
  const totalOrders = (orderedProducts as any[])?.length || 0;
  const uniqueProducts = new Set((orderedProducts as any[]).map((item: any) => item.productId)).size;
  const totalQuantity = (orderedProducts as any[]).reduce((sum: number, item: any) => sum + (item.orderedQuantity || 0), 0);
  const totalValue = (orderedProducts as any[]).reduce((sum: number, item: any) => sum + (item.totalItemPrice || 0), 0);

  // Фільтровані дані
  const filteredProducts = (orderedProducts as any[]).filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section  sticky top-0 z-40*/}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Замовлені товари
                    </h1>
                    <p className="text-gray-500 mt-1">Моніторинг товарів у замовленнях та управління запасами</p>
                  </div>
                </div>
              <div className="flex items-center space-x-4">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Package className="mr-2 h-4 w-4" />
                  Аналіз запасів
                </Button>
              </div>
            </div>
          </div>
        </header>


      {/* Statistics Cards */}
      <div className="w-full px-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-700 font-medium">Позицій товарів</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-900 mb-1">{totalOrders}</p>
                  <p className="text-xs text-amber-600">В замовленнях</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <ShoppingCart className="w-8 h-8 text-white" />
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
                    <Package className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">Унікальних товарів</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900 mb-1">{uniqueProducts}</p>
                  <p className="text-xs text-red-600">Різних виробів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-700 font-medium">Загальна кількість</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{totalQuantity}</p>
                  <p className="text-xs text-gray-600">Одиниць замовлено</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Package className="w-8 h-8 text-white" />
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
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Загальна вартість</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalValue.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">Грн оплачено</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
            <CardTitle>Замовлені товари ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає замовлених товарів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((item: any, index: number) => (
                  <Card key={`${item.orderId}-${item.productId}-${index}`} className="p-4 border-l-4 border-l-green-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Товар */}
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">{item.productName || "Товар"}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.productSku || "Не вказано"}
                          </p>
                        </div>
                      </div>

                      {/* Замовлення */}
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className="h-5 w-5 text-amber-600" />
                        <div>
                          <h4 className="font-medium">Замовлення: {item.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            Клієнт: {item.clientName || "Не вказано"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Оплачено: {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('uk-UA') : "Дата невідома"}
                          </p>
                        </div>
                      </div>

                      {/* Деталі */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Кількість: <span className="text-blue-600">{item.orderedQuantity || 0} од.</span>
                          </p>
                          <p className="text-sm font-medium">
                            Ціна: <span className="text-green-600">{(item.unitPrice || 0).toLocaleString()} грн</span>
                          </p>
                          <p className="text-sm font-bold">
                            Сума: <span className="text-orange-600">{(item.totalItemPrice || 0).toLocaleString()} грн</span>
                          </p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Badge className="bg-green-100 text-green-800 text-center">
                            {item.status || "Виробництво"}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 text-center">
                            Оплачено
                          </Badge>
                        </div>
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