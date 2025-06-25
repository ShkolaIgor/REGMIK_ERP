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
import { Plus, Upload, Edit2, Trash2 } from "lucide-react";
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
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Товари</h1>
          <div className="flex gap-2">
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
      </div>
    </div>
  );
}