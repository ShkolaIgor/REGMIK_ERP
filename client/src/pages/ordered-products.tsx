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

  // Статистичні дані для згрупованих товарів
  const uniqueProducts = (orderedProducts as any[])?.length || 0;
  const totalOrders = (orderedProducts as any[]).reduce((sum: number, item: any) => sum + (item.ordersCount || 0), 0);
  const totalQuantity = (orderedProducts as any[]).reduce((sum: number, item: any) => sum + (item.totalQuantityToShip || 0), 0);
  const totalValue = (orderedProducts as any[]).reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);

  // Фільтровані дані
  const filteredProducts = (orderedProducts as any[]).filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderNumbers?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientNames?.toLowerCase().includes(searchQuery.toLowerCase());
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
                    <p className="text-sm text-amber-700 font-medium">Замовлень</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-900 mb-1">{totalOrders}</p>
                  <p className="text-xs text-amber-600">Містять товари</p>
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
                    <p className="text-sm text-red-700 font-medium">Типів товарів</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900 mb-1">{uniqueProducts}</p>
                  <p className="text-xs text-red-600">Для виробництва</p>
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
              <div className="space-y-6">
                {filteredProducts.map((item: any, index: number) => (
                  <Card key={`product-${item.productId}-${index}`} className="p-6 border-l-4 border-l-blue-500 shadow-lg">
                    {/* Заголовок товару */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.productName || "Товар"}</h3>
                          <p className="text-sm text-gray-500">SKU: {item.productSku || "Не вказано"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{item.totalQuantityToShip || 0} шт</p>
                        <p className="text-sm text-gray-500">До виробництва</p>
                      </div>
                    </div>

                    {/* Основна інформація */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-amber-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingCart className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">Замовлень</span>
                        </div>
                        <p className="text-lg font-bold text-amber-900">{item.ordersCount || 0}</p>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Загальна кількість</span>
                        </div>
                        <p className="text-lg font-bold text-green-900">{item.totalQuantityToShip || 0} шт</p>
                        {item.stockQuantity > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            На складі: {item.stockQuantity} шт
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">Крайній термін</span>
                        </div>
                        <p className="text-lg font-bold text-orange-900">
                          {item.latestDueDate ? new Date(item.latestDueDate).toLocaleDateString('uk-UA') : "Не вказано"}
                        </p>
                      </div>
                      
                      {item.quantityToProduce > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Factory className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">До виробництва</span>
                          </div>
                          <p className="text-lg font-bold text-red-900">{item.quantityToProduce} шт</p>
                        </div>
                      )}
                      
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">Статуси</span>
                        </div>
                        <p className="text-sm font-bold text-purple-900">{item.orderStatuses || "Не вказано"}</p>
                      </div>
                    </div>

                    {/* Деталі замовлень */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Factory className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-700">Деталі замовлень:</span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Замовлення: </span>
                            <span className="text-gray-900">{item.orderNumbers || "Не вказано"}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Перший термін: </span>
                            <span className="text-gray-900">{item.earliestDueDate ? new Date(item.earliestDueDate).toLocaleDateString('uk-UA') : "Не вказано"}</span>
                          </div>
                          {item.stockQuantity > 0 && (
                            <div>
                              <span className="font-medium text-gray-600">Склад: </span>
                              <span className="text-green-700 font-medium">{item.stockQuantity} шт наявно</span>
                              {item.quantityToProduce > 0 && (
                                <span className="text-red-700 font-medium ml-2">({item.quantityToProduce} шт виробити)</span>
                              )}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-600">Перша оплата: </span>
                            <span className="text-gray-900">{item.earliestPaymentDate ? new Date(item.earliestPaymentDate).toLocaleDateString('uk-UA') : "Не вказано"}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Крайній термін: </span>
                            <span className="text-gray-900">{item.latestDueDate ? new Date(item.latestDueDate).toLocaleDateString('uk-UA') : "Не вказано"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Деталізовані замовлення */}
                    {item.orderDetails && item.orderDetails.length > 0 && (
                      <div className="mt-4">
                        <details className="group">
                          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                            Детальна розбивка по замовленнях ({item.orderDetails.length})
                          </summary>
                          <div className="mt-3 space-y-2">
                            {item.orderDetails.map((detail: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 rounded border text-xs grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div><strong>№:</strong> {detail.orderNumber}</div>
                                <div><strong>Кількість:</strong> {detail.quantityToShip} шт</div>
                                <div><strong>Термін:</strong> {detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('uk-UA') : "Не вказано"}</div>
                                <div><strong>Статус:</strong> {detail.status}</div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
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