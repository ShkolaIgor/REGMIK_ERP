import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductForm } from "@/components/ProductForm";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import { Search, Plus, Edit, Eye, Copy, Trash2, Scan, Download, Printer, DollarSign, AlertTriangle, Package, Barcode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScannerButton } from "@/components/BarcodeScanner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TableLoadingState, CardSkeleton } from "@/components/ui/loading-state";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export default function Inventory() {
  const [showProductForm, setShowProductForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Стейт для пагінації
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
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

  // Filter products based on search and filters
  const filteredProducts = (Array.isArray(products) ? products : products?.data || []).filter((product: any) => {
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

  const handleEditProduct = (product: any) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setIsViewMode(false);
    setShowProductForm(true);
  };

  const handleViewProduct = (product: any) => {
    console.log('Viewing product:', product);
    setEditingProduct(product);
    setIsViewMode(true);
    setShowProductForm(true);
  };

  const handleCopyProduct = (product: any) => {
    const copiedProduct = {
      ...product,
      name: `${product.name} (копія)`,
      sku: `${product.sku}_COPY`,
      barcode: "", // Очищуємо штрих-код для копії
      id: undefined // Прибираємо ID для створення нового товару
    };
    console.log('Copying product:', copiedProduct);
    setEditingProduct(copiedProduct);
    setIsViewMode(false);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей товар?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    const product = products.find((p: any) => p.barcode === barcode);
    if (product) {
      handleEditProduct(product);
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
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">Управління товарами</h2>
            <Badge className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Онлайн
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex gap-2">
              {/*<div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Пошук товарів..."
                  className="w-80 pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div> */}
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
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Додати товар
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна кількість товарів</p>
                  <p className="text-3xl font-semibold text-gray-900">{Array.isArray(products) ? products.length : products?.data?.length || 0}</p>
                  <p className="text-sm text-green-600 mt-1">+12% цього місяця</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна вартість запасів</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {formatCurrency(inventory.reduce((total: number, inv: any) => {
                      const product = products.find((p: any) => p.id === inv.productId);
                      return total + (product ? inv.quantity * parseFloat(product.costPrice) : 0);
                    }, 0))}
                  </p>
                  <p className="text-sm text-green-600 mt-1">+8% цього місяця</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Товари на межі закінчення</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {inventory.filter((inv: any) => inv.quantity <= inv.minStock).length}
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">Потрібна увага</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна кількість SKU</p>
                  <p className="text-3xl font-semibold text-gray-900">{Array.isArray(products) ? products.length : products?.data?.length || 0}</p>
                  <p className="text-sm text-blue-600 mt-1">Унікальних позицій</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Barcode className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardContent className="p-6">
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

              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Експорт
                </Button>
                <Button variant="outline" disabled>
                  <Scan className="w-4 h-4 mr-2" />
                  Сканер штрих-кодів
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Друкувати етикетки
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Каталог товарів</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Показано: {filteredProducts.length} з {Array.isArray(products) ? products.length : products?.data?.length || 0}</span>
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
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleViewProduct(product)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleCopyProduct(product)}
                              title="Копіювати товар"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </main>

      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
          setIsViewMode(false);
        }}
        product={editingProduct}
        isViewMode={isViewMode}
      />


    </div>
  );
}
