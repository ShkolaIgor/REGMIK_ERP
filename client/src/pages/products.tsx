import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit2, Trash2, Package, CheckCircle, Grid3X3, DollarSign } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/product-categories'],
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-900">Каталог товарів</h2>
            <Badge className="bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Онлайн
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Імпорт XML
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Імпорт товарів з XML</DialogTitle>
                </DialogHeader>
                {/* Вміст діалогу імпорту тут */}
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
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
                  <p className="text-3xl font-semibold text-gray-900">{products.length}</p>
                  <p className="text-sm text-green-600 mt-1">Всього позицій</p>
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
                  <p className="text-sm text-gray-600">Активні товари</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {products.filter((p: Product) => p.isActive).length}
                  </p>
                  <p className="text-sm text-green-600 mt-1">В продажу</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Категорії</p>
                  <p className="text-3xl font-semibold text-gray-900">{categories.length}</p>
                  <p className="text-sm text-blue-600 mt-1">Різних типів</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Grid3X3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середня ціна</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {products.length > 0 
                      ? Math.round(products.reduce((sum: number, p: Product) => sum + parseFloat(p.retailPrice), 0) / products.length)
                      : 0} ₴
                  </p>
                  <p className="text-sm text-orange-600 mt-1">За товар</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DataTable компонент */}
        <DataTable
          data={products}
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
      </main>
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