import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { Search, Edit, Eye, Trash2, Scan, Download, Printer, DollarSign, AlertTriangle, Package, Barcode, SquareChartGantt, PlusCircle, MinusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScannerButton } from "@/components/BarcodeScanner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TableLoadingState } from "@/components/ui/loading-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { InventoryChangeDialog } from "@/components/InventoryChangeDialog";

export default function Inventory() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Стейт для пагінації
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Стейт для діалогу зміни кількості
  const [inventoryChangeDialog, setInventoryChangeDialog] = useState<{
    isOpen: boolean;
    product?: any;
    warehouse?: any;
    currentQuantity?: number;
  }>({ isOpen: false });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: authUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: session } = useQuery<any>({
    queryKey: ["/api/user/session"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Успіх",
        description: "Товар успішно видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити товар",
        variant: "destructive",
      });
    },
  });

  // Get inventory data for each product
  const getProductInventory = (productId: number) => {
    return inventory.find((inv: any) => inv.productId === productId);
  };

  // Обробники для діалогу зміни кількості
  const handleChangeQuantity = (product: any) => {
    const productInventory = getProductInventory(product.id);
    const defaultWarehouse = warehouses.find((w: any) => w.isDefault) || warehouses[0];
    
    setInventoryChangeDialog({
      isOpen: true,
      product,
      warehouse: defaultWarehouse,
      currentQuantity: productInventory ? parseFloat(productInventory.quantity) : 0
    });
  };

  const closeInventoryChangeDialog = () => {
    setInventoryChangeDialog({ isOpen: false });
  };

  // Обробники для кнопок редагування та перегляду
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsViewMode(false);
  };

  const handleViewProduct = (product: any) => {
    setEditingProduct(product);
    setIsViewMode(true);
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || categoryFilter === 'all' || product.categoryId?.toString() === categoryFilter;

    const productInventory = getProductInventory(product.id);
    const stockStatus = productInventory ? getStockStatus(productInventory.quantity, productInventory.minStock) : 'out-of-stock';
    const matchesStatus = !statusFilter || statusFilter === 'all' || stockStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Пагінація
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = pageSize === 1000 ? filteredProducts : filteredProducts.slice(startIndex, endIndex);

  // Скидання сторінки при зміні фільтрів
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find((p: any) => p.barcode === barcode);
    if (product) {
      ;
    } else {
      toast({
        title: "Товар не знайдено",
        description: `Товар з штрих-кодом ${barcode} не знайдено в системі`,
        variant: "destructive",
      });
    }
  };

  const getStockStatusBadge = (productId: number) => {
    const productInventory = getProductInventory(productId);
    if (!productInventory) {
      return <Badge className="bg-red-100 text-red-800">Немає в наявності</Badge>;
    }

    const status = getStockStatus(productInventory.quantity, productInventory.minStock);
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-green-100 text-green-800">В наявності</Badge>;
      case 'low-stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Мало на складі</Badge>;
      case 'out-of-stock':
        return <Badge className="bg-red-100 text-red-800">Немає в наявності</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Невідомо</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
       {/* Header Section  sticky top-0 z-40 */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <SquareChartGantt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Товарний каталог
                    </h1>
                    <p className="text-gray-500 mt-1">Управління товарами на складах</p>
                  </div>
              </div>
              
            <div className="flex items-center space-x-4">
              <div className="border-blue-200 text-purple-600 hover:bg-blue-50 flex gap-2">
                <ScannerButton
                  onScanResult={(barcode) => {
                    setSearchQuery(barcode);
                    toast({
                      title: "Штрих-код відсканований",
                      description: `Пошук за кодом: ${barcode}`,
                    });
                  }}
                />
              </div>
              <Button variant="outline" className="border-blue-200 text-purple-600 hover:bg-blue-50">
                <Download className="h-4 w-4 mr-2" />
                Експорт
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Друкувати етикетки
              </Button>
              </div>
            </div>
          </div>       
      </header>      

        {/* Statistics Cards */}
        <div className="w-full px-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Загальна кількість товарів</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{products.length}</p>
                    <p className="text-xs text-blue-600">+?% цього місяця</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Загальна вартість запасів</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">
                      {formatCurrency(inventory.reduce((total: number, inv: any) => {
                        const product = products.find((p: any) => p.id === inv.productId);
                        return total + (product ? inv.quantity * parseFloat(product.costPrice) : 0);
                      }, 0))}</p>
                    <p className="text-xs text-emerald-600">+?% цього місяця</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Товари на межі закінчення</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{inventory.filter((inv: any) => inv.quantity <= inv.minStock).length}</p>
                    <p className="text-xs text-purple-600">Потрібна увага</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <AlertTriangle className="w-8 h-8 text-white" />
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
                      <Barcode className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700 font-medium">Загальна кількість SKU</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{products.length}</p>
                    <p className="text-xs text-orange-600">Унікальних позицій</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Barcode className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>        

        {/* Filters and Actions */}
        <div className="w-full pb-3"> {/* відступ знизу та зверху */}
        <Card>
          <CardContent className="p-6"> {/* висота */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Пошук товарів..."
                    className="w-80 pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Категорія:</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Всі категорії" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі категорії</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Статус:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Всі статуси" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі статуси</SelectItem>
                      <SelectItem value="in-stock">В наявності</SelectItem>
                      <SelectItem value="low-stock">Мало на складі</SelectItem>
                      <SelectItem value="out-of-stock">Немає в наявності</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Content */}
        <div className="w-full space-y-6 flex-1 overflow-auto">

       {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Каталог товарів</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Показано: {filteredProducts.length} з {products.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Категорія</TableHead>
                    <TableHead>Кількість</TableHead>
                    <TableHead>Собівартість</TableHead>
                    <TableHead>Роздрібна ціна</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.map((product: any) => {
                    const productInventory = getProductInventory(product.id);
                    const category = categories.find((c: any) => c.id === product.categoryId);

                    return (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                              {product.photo ? (
                                <img 
                                  src={product.photo} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{category?.name || "Без категорії"}</TableCell>
                        <TableCell>
                          {productInventory ? `${productInventory.quantity} шт` : "0 шт"}
                        </TableCell>
                        <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.retailPrice)}</TableCell>
                        <TableCell>{getStockStatusBadge(product.id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleChangeQuantity(product)}
                              title="Змінити кількість"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditProduct(product)}
                              title="Редагувати товар"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewProduct(product)}
                              title="Переглянути товар"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Пагінація */}
        {currentProducts.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Показано {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} з {total} товарів
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">На сторінці:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="1000">Всі</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ««
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[32px] h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »»
              </Button>
            </div>
          </div>
        )}

        {/* Повідомлення коли немає товарів */}
        {currentProducts.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Товари не знайдені</h3>
            <p className="text-muted-foreground mb-4">
              Не знайдено товарів за запитом "{searchQuery}"
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Діалог зміни кількості */}
      {inventoryChangeDialog.isOpen && (
        <InventoryChangeDialog
          isOpen={inventoryChangeDialog.isOpen}
          onClose={closeInventoryChangeDialog}
          product={inventoryChangeDialog.product}
          warehouse={inventoryChangeDialog.warehouse}
          currentQuantity={inventoryChangeDialog.currentQuantity}
          userId={session?.user?.id || authUser?.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
            toast({
              title: "Успіх",
              description: "Кількість товару оновлено успішно",
            });
          }}
        />
      )}

      {/* Діалог редагування/перегляду товару */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isViewMode ? 'Перегляд товару' : 'Редагування товару'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingProduct(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Назва товару</label>
                <div className="text-base">{editingProduct.name}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <div className="text-base font-mono">{editingProduct.sku}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Штрих-код</label>
                  <div className="text-base font-mono">{editingProduct.barcode || 'Не встановлено'}</div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Опис</label>
                <div className="text-base">{editingProduct.description || 'Опис відсутній'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Собівартість</label>
                  <div className="text-base">{formatCurrency(editingProduct.costPrice)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Роздрібна ціна</label>
                  <div className="text-base">{formatCurrency(editingProduct.retailPrice)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Одиниця виміру</label>
                  <div className="text-base">{editingProduct.unit}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус</label>
                  <Badge variant={editingProduct.isActive ? "default" : "secondary"}>
                    {editingProduct.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Кількість на складі</label>
                <div className="text-base">
                  {getProductInventory(editingProduct.id)?.quantity || 0} шт
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <Button
                variant="outline"
                onClick={() => setEditingProduct(null)}
              >
                Закрити
              </Button>
              {!isViewMode && (
                <Button
                  onClick={() => handleChangeQuantity(editingProduct)}
                >
                  Змінити кількість
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}