import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Upload, Download, Eye, FileText, AlertCircle, CheckCircle, Clock, X } from "lucide-react";

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
  
  // Пагінація та фільтрація
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 12;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Завантаження товарів
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["/api/products"],
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
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Скидаємо сторінку при зміні фільтру
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Завантаження товарів...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Помилка завантаження товарів</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Товари</h1>
          <p className="text-muted-foreground">
            Управління каталогом товарів ({filteredProducts.length} з {products.length})
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Імпорт XML
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

      {/* Сітка товарів */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentProducts.map((product: Product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg leading-6">{product.name}</CardTitle>
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
                  <Eye className="h-4 w-4 mr-1" />
                  Редагувати
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(product.id)}
                  disabled={deleteMutation.isPending}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Попередня
          </Button>
          
          <div className="flex items-center gap-2">
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
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Наступна
          </Button>
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
    </div>
  );
}