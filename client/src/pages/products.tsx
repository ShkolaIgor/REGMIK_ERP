import { useState, useEffect, useRef } from "react";
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
import { Plus, Search, Upload, Download, Eye, FileText, AlertCircle, CheckCircle, Clock, X, Grid3X3, List, Edit2, Trash2 } from "lucide-react";

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

// Компонент пошукового поля з автофокусом
function SearchInput({ value, onChange }: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Пошук товарів за назвою, SKU або описом..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        autoComplete="off"
      />
    </div>
  );
}

export default function Products() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportDetailsOpen, setIsImportDetailsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // Пагінація та фільтрація
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Завантаження товарів
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["/api/products"],
  });

  // Завантаження категорій для форми
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Фільтрація товарів
  const filteredProducts = products.filter((product: Product) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower))
    );
  });

  // Пагінація
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Скидаємо сторінку при зміні фільтру
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      setEditingProduct(null);
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

  // Mutation для оновлення товару
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      toast({
        title: "Товар оновлено",
        description: "Дані товару успішно збережено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити товар",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xmlFile', file);
      
      const response = await fetch('/api/products/import-xml', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentJob({ 
          id: data.jobId, 
          status: 'processing', 
          progress: 0, 
          processed: 0, 
          imported: 0, 
          skipped: 0, 
          errors: [], 
          details: [], 
          totalRows: 0 
        });
        setIsImportDialogOpen(false);
        setIsImportDetailsOpen(true);
        pollJobStatus(data.jobId);
      }
    },
    onError: (error) => {
      toast({
        title: "Помилка імпорту",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 хвилин (60 * 5 секунд)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/products/import-xml/${jobId}/status`);
        if (!response.ok) throw new Error('Failed to check job status');
        
        const data = await response.json();
        if (data.success && data.job) {
          setCurrentJob(data.job);
          
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            if (data.job.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ["/api/products"] });
              toast({
                title: "Імпорт завершено",
                description: `Імпортовано: ${data.job.imported}, Пропущено: ${data.job.skipped}`,
              });
            } else {
              toast({
                title: "Помилка імпорту",
                description: "Імпорт завершився з помилкою",
                variant: "destructive",
              });
            }
            return;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Перевіряємо кожні 5 секунд
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'imported':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'imported':
      case 'updated':
        return 'default';
      case 'skipped':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="w-full px-6 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Завантаження товарів...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="w-full px-6 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">Помилка завантаження товарів</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Товари</h1>
          <p className="text-muted-foreground">
            Управління каталогом товарів ({filteredProducts.length} з {products.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Перемикач видів відображення */}
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Кнопки імпорту та експорту */}
          <Button variant="outline" size="sm" title="Експорт товарів">
            <Download className="h-4 w-4 mr-2" />
            Експорт
          </Button>
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" title="Імпорт товарів з XML файлу">
                <Upload className="h-4 w-4 mr-2" />
                Імпорт товарів
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Імпорт товарів з XML</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="xmlFile">Виберіть XML файл</Label>
                  <Input
                    id="xmlFile"
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Обраний файл: {selectedFile.name}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || importMutation.isPending}
                  >
                    {importMutation.isPending ? 'Завантаження...' : 'Імпортувати'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Додати товар
          </Button>
        </div>
      </div>

      {/* Пошук */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        {searchQuery && (
          <Button
            variant="ghost"
            onClick={() => setSearchQuery('')}
            className="sm:ml-auto"
          >
            Очистити фільтр
          </Button>
        )}
      </div>

      {/* Відображення товарів */}
      {viewMode === 'cards' ? (
        /* Вид карточками */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentProducts.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
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
                    onClick={() => setEditingProduct(product)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Редагувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Вид списком */
        <div className="bg-white rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-900">Назва</th>
                  <th className="text-left p-4 font-medium text-gray-900">SKU</th>
                  <th className="text-left p-4 font-medium text-gray-900">Опис</th>
                  <th className="text-left p-4 font-medium text-gray-900">Собівартість</th>
                  <th className="text-left p-4 font-medium text-gray-900">Роздрібна ціна</th>
                  <th className="text-left p-4 font-medium text-gray-900">Од. виміру</th>
                  <th className="text-left p-4 font-medium text-gray-900">Статус</th>
                  <th className="text-left p-4 font-medium text-gray-900">Дії</th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product: Product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{product.name}</div>
                    </td>
                    <td className="p-4 text-gray-600">{product.sku}</td>
                    <td className="p-4 text-gray-600 max-w-xs">
                      <div className="truncate">{product.description || "—"}</div>
                    </td>
                    <td className="p-4 text-gray-900 font-medium">{product.costPrice} ₴</td>
                    <td className="p-4 text-gray-900 font-medium">{product.retailPrice} ₴</td>
                    <td className="p-4 text-gray-600">{product.unit}</td>
                    <td className="p-4">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Активний" : "Неактивний"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
      {currentProducts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'Товари не знайдені' : 'Немає товарів'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `Не знайдено товарів за запитом "${searchQuery}"`
              : 'Почніть з додавання першого товару або імпорту з XML'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Додати товар
            </Button>
          )}
        </div>
      )}

      {/* Діалог деталей імпорту */}
      <Dialog open={isImportDetailsOpen} onOpenChange={setIsImportDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Деталі імпорту товарів</DialogTitle>
          </DialogHeader>
          
          {currentJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Статус</div>
                  <Badge variant={
                    currentJob.status === 'completed' ? 'default' :
                    currentJob.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {currentJob.status === 'processing' ? 'Обробка' :
                     currentJob.status === 'completed' ? 'Завершено' : 'Помилка'}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Прогрес</div>
                  <div className="font-medium">{currentJob.progress}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Оброблено</div>
                  <div className="font-medium">{currentJob.processed} / {currentJob.totalRows}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Імпортовано</div>
                  <div className="font-medium text-green-600">{currentJob.imported}</div>
                </div>
              </div>

              {currentJob.status === 'processing' && (
                <Progress value={currentJob.progress} className="w-full" />
              )}

              {currentJob.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Помилки:</h4>
                  <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 max-h-32 overflow-y-auto">
                    {currentJob.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}

              {currentJob.details.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Деталі обробки:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {currentJob.details.map((detail, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                        {getStatusIcon(detail.status)}
                        <span className="font-medium">{detail.name}</span>
                        <Badge variant={getStatusBadgeVariant(detail.status)} className="ml-auto">
                          {detail.status === 'imported' ? 'Імпорт' :
                           detail.status === 'updated' ? 'Оновлено' :
                           detail.status === 'skipped' ? 'Пропущено' : 'Помилка'}
                        </Badge>
                        {detail.message && (
                          <span className="text-muted-foreground ml-2">{detail.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              onSave={(data) => updateMutation.mutate({ id: editingProduct.id, data })}
              onDelete={() => setShowDeleteAlert(true)}
              isLoading={updateMutation.isPending}
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
              Ви впевнені, що хочете видалити товар "{editingProduct?.name}"? 
              Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editingProduct && deleteMutation.mutate(editingProduct.id)}
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

// Компонент форми редагування товару
function ProductEditForm({ 
  product, 
  categories, 
  onSave, 
  onDelete, 
  isLoading 
}: {
  product: Product;
  categories: any[];
  onSave: (data: any) => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    barcode: product.barcode || '',
    categoryId: product.categoryId?.toString() || '',
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
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
      minStock: formData.minStock ? parseInt(formData.minStock) : null,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
    };
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Назва товару</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Опис</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="barcode">Штрих-код</Label>
          <Input
            id="barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="categoryId">Категорія</Label>
          <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Оберіть категорію" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="costPrice">Собівартість</Label>
          <Input
            id="costPrice"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            type="number"
            step="0.01"
            required
          />
        </div>
        <div>
          <Label htmlFor="retailPrice">Роздрібна ціна</Label>
          <Input
            id="retailPrice"
            value={formData.retailPrice}
            onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
            type="number"
            step="0.01"
            required
          />
        </div>
        <div>
          <Label htmlFor="productType">Тип товару</Label>
          <Select value={formData.productType} onValueChange={(value) => setFormData({ ...formData, productType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Оберіть тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Простий товар</SelectItem>
              <SelectItem value="kit">Комплект</SelectItem>
              <SelectItem value="service">Послуга</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="unit">Одиниця виміру</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="minStock">Мінімальний залишок</Label>
          <Input
            id="minStock"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            type="number"
          />
        </div>
        <div>
          <Label htmlFor="maxStock">Максимальний залишок</Label>
          <Input
            id="maxStock"
            value={formData.maxStock}
            onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
            type="number"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive">Активний товар</Label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Видалити товар
        </Button>
        
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Збереження...' : 'Зберегти зміни'}
          </Button>
        </div>
      </div>
    </form>
  );
}