import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit2, Trash2, Package2, CheckCircle, Grid3X3, DollarSign, Layers, Search, Scan, Printer, Download, AlertTriangle, ShoppingCart } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  barcode: string | null;
  categoryId: number | null;
  costPrice: string;
  retailPrice: string;
  photo: string | null;
  productType: string;
  unit: string;
  minStock: number | null;
  maxStock: number | null;
  isActive: boolean | null;
  createdAt: Date;
}

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
  totalRows: number;
}

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Фільтрування товарів
  const filteredProducts = products.filter((product: Product) => {
    // Пошук за назвою, SKU або описом
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Фільтр за категорією
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "null" && !product.categoryId) ||
      (product.categoryId && product.categoryId.toString() === categoryFilter);

    // Фільтр за статусом
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Обробники подій
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteAlert(true);
  };

  // Mutation для видалення товару
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductToDelete(null);
      setShowDeleteAlert(false);
      toast({
        title: "Успіх",
        description: "Товар видалено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Помилка видалення товару: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  if (isError) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Помилка завантаження товарів</h2>
            <p className="text-gray-600">Спробуйте оновити сторінку</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="w-full px-8 py-3">
          {/* Header з градієнтом */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Склад товарів</h1>
                  <p className="text-gray-500 mt-1">Управління продуктами та категоріями</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Імпорт XML
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Новий товар
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Показано товарів</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{filteredProducts.length}</p>
                    <p className="text-xs text-blue-600">З {products.length} загалом</p>
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
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Активні товари</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{filteredProducts.filter((p: Product) => p.isActive).length}</p>
                    <p className="text-xs text-emerald-600">В продажу</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <CheckCircle className="w-8 h-8 text-white" />
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
                      <Grid3X3 className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Категорії</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{categories.length}</p>
                    <p className="text-xs text-purple-600">Різних типів</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Grid3X3 className="w-8 h-8 text-white" />
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
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <p className="text-sm text-orange-700 font-medium">Середня ціна</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-1">{filteredProducts.length > 0 
                        ? Math.round(filteredProducts.reduce((sum: number, p: Product) => sum + parseFloat(p.retailPrice), 0) / filteredProducts.length)
                        : 0} ₴</p>
                    <p className="text-xs text-orange-600">За товар</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Filters and Actions */}
        <div className="w-full py-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <SearchFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchPlaceholder="Пошук товарів за назвою, SKU, описом..."
                  filters={[
                    {
                      key: "category",
                      label: "Категорія",
                      value: categoryFilter,
                      onChange: setCategoryFilter,
                      options: [
                        { value: "all", label: "Всі категорії" },
                        { value: "null", label: "Без категорії" },
                        ...categories.map((category: any) => ({
                          value: category.id.toString(),
                          label: category.name
                        }))
                      ]
                    },
                    {
                      key: "status",
                      label: "Статус",
                      value: statusFilter,
                      onChange: setStatusFilter,
                      options: [
                        { value: "all", label: "Всі статуси" },
                        { value: "active", label: "Активні" },
                        { value: "inactive", label: "Неактивні" }
                      ]
                    }
                  ]}
                />

                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsImportDialogOpen(true)}
                    className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${!isAuthenticated ? 'opacity-50' : ''}`}
                    disabled={!isAuthenticated}
                    title={!isAuthenticated ? "Потрібна авторизація для імпорту" : ""}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Імпорт XML
                    {!isAuthenticated && <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />}
                  </Button>
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
        </div>

        {/* DataTable компонент */}
        <DataTable
          data={filteredProducts}
          onRowClick={handleEdit}
          columns={[
            {
              key: 'name',
              label: 'Назва',
              sortable: true,
              render: (value, row) => (
                <div>
                  <div className="font-medium">{value}</div>
                  {row.description && (
                    <div className="text-sm text-gray-500 truncate">{row.description}</div>
                  )}
                </div>
              )
            },
            {
              key: 'sku',
              label: 'SKU',
              sortable: true,
              width: '150px'
            },
            {
              key: 'costPrice',
              label: 'Собівартість',
              sortable: true,
              width: '120px',
              render: (value) => `${value} ₴`
            },
            {
              key: 'retailPrice',
              label: 'Роздрібна ціна',
              sortable: true,
              width: '120px',
              render: (value) => `${value} ₴`
            },
            {
              key: 'unit',
              label: 'Од. виміру',
              sortable: true,
              width: '100px'
            },
            {
              key: 'isActive',
              label: 'Статус',
              sortable: true,
              width: '100px',
              type: 'badge',
              render: (value) => (
                <Badge variant={value ? "default" : "secondary"}>
                  {value ? "Активний" : "Неактивний"}
                </Badge>
              )
            },
            {
              key: 'createdAt',
              label: 'Дата створення',
              sortable: true,
              width: '150px',
              render: (value) => new Date(value).toLocaleDateString('uk-UA')
            }
          ]}
          loading={isLoading}
          title="Список товарів"
          storageKey="products"
          cardTemplate={(product) => (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg leading-6 font-bold">{product.name}</CardTitle>
                    <CardDescription className="text-sm">
                      SKU: {product.sku}
                    </CardDescription>
                  </div>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Собівартість:</span>
                    <span className="font-medium">{product.costPrice} ₴</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Роздрібна ціна:</span>
                    <span className="font-medium">{product.retailPrice} ₴</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Од. виміру:</span>
                    <span>{product.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Створено:</span>
                    <span>{new Date(product.createdAt).toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(product)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Редагувати
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(product)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          actions={(product) => (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(product);
                }}
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:scale-110 transition-all duration-200"
                title="Редагувати товар"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(product);
                }}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:scale-110 transition-all duration-200 text-red-600 hover:text-red-700"
                title="Видалити товар"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />

        {/* Діалог редагування товару */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редагування товару</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <ProductEditForm 
                product={editingProduct} 
                categories={categories}
                onSave={(data) => {
                  // Тут буде логіка збереження
                  console.log('Saving product:', data);
                  setEditingProduct(null);
                  toast({
                    title: "Товар оновлено",
                    description: "Дані товару успішно збережено",
                  });
                }}
                onCancel={() => setEditingProduct(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog для підтвердження видалення */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
              <AlertDialogDescription>
                Ви впевнені, що хочете видалити товар "{productToDelete?.name}"? 
                Цю дію неможливо скасувати.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => productToDelete && deleteMutation.mutate(productToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Видалити
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Import XML Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Імпорт XML файлу</DialogTitle>
              <DialogDescription>
                Завантажте XML файл з товарами
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="xml-file-products" className="text-sm font-medium">
                  Оберіть XML файл
                </label>
                <input
                  id="xml-file-products"
                  type="file"
                  accept=".xml"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button onClick={() => {
                  // TODO: Implement XML import logic
                  toast({ title: "Функція імпорту в розробці" });
                  setIsImportDialogOpen(false);
                }}>
                  Імпортувати
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
         </div>
    </div>
  );
}

// Компонент форми редагування товару
function ProductEditForm({ 
  product, 
  categories, 
  onSave, 
  onCancel 
}: {
  product: Product;
  categories: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    barcode: product.barcode || '',
    categoryId: product.categoryId?.toString() || '0',
    costPrice: product.costPrice,
    retailPrice: product.retailPrice,
    productType: product.productType,
    unit: product.unit,
    minStock: product.minStock?.toString() || '',
    maxStock: product.maxStock?.toString() || '',
    isActive: product.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      categoryId: formData.categoryId && formData.categoryId !== '0' ? parseInt(formData.categoryId) : null,
      minStock: formData.minStock ? parseInt(formData.minStock) : null,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Назва товару *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Опис</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="barcode">Штрих-код</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="categoryId">Категорія</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Оберіть категорію" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Без категорії</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costPrice">Собівартість *</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="retailPrice">Роздрібна ціна *</Label>
          <Input
            id="retailPrice"
            type="number"
            step="0.01"
            value={formData.retailPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, retailPrice: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productType">Тип товару</Label>
          <Select
            value={formData.productType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Товар</SelectItem>
              <SelectItem value="service">Послуга</SelectItem>
              <SelectItem value="kit">Комплект</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit">Одиниця виміру *</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minStock">Мінімальний залишок</Label>
          <Input
            id="minStock"
            type="number"
            value={formData.minStock}
            onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="maxStock">Максимальний залишок</Label>
          <Input
            id="maxStock"
            type="number"
            value={formData.maxStock}
            onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="isActive">Активний товар</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit">
          Зберегти зміни
        </Button>
      </div>
    </form>
  );
}