import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, Eye, Check, X, FileText, Building2, Calendar, DollarSign, AlertCircle, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProcessedInvoice1C } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePeriodFilter, DateFilterParams } from "@/components/DatePeriodFilter";

// Тип для накладних згідно з реальним кодом 1С
type Invoice1C = ProcessedInvoice1C;

interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

// Компонент для зіставлення компонентів
function ComponentMappingCell({ item, onMappingChange }: { 
  item: any, 
  onMappingChange: (component: string) => void 
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [foundComponents, setFoundComponents] = useState<any[]>([]);
  const [selectedComponent, setSelectedComponent] = useState(item.erpEquivalent || '');
  const [autoMappingAttempted, setAutoMappingAttempted] = useState(false);

  // Автоматичне зіставлення при першому завантаженні
  useEffect(() => {
    if (!autoMappingAttempted && !item.erpEquivalent) {
      setAutoMappingAttempted(true);
      performAutoMapping();
    }
  }, []);

  const performAutoMapping = async () => {
    try {
      setIsSearching(true);
      const response = await apiRequest(`/api/1c/invoices/check-mapping/${encodeURIComponent(item.name || item.originalName)}`);
      if (response.found && response.component) {
        setSelectedComponent(response.component.name);
        onMappingChange(response.component.name);
        console.log(`✅ Автоматично зіставлено: ${item.name || item.originalName} → ${response.component.name}`);
      } else {
        console.log(`❌ Автоматичне зіставлення не знайдено для: ${item.name || item.originalName}`);
      }
    } catch (error) {
      console.error('Помилка автоматичного зіставлення:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchComponents = async (query: string) => {
    if (!query.trim()) {
      setFoundComponents([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await apiRequest(`/api/components?search=${encodeURIComponent(query)}`);
      setFoundComponents(response.slice(0, 50)); // Збільшено ліміт до 50 результатів
    } catch (error) {
      console.error('Component search failed:', error);
      setFoundComponents([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualMapping = async (componentName: string) => {
    setSelectedComponent(componentName);
    onMappingChange(componentName);
    setSearchTerm('');
    setFoundComponents([]);
    
    // Зберігаємо зіставлення в product_name_mappings для майбутнього використання
    try {
      const originalName = item.name || item.originalName;
      if (originalName && componentName) {
        console.log(`💾 Зберігаю зіставлення: "${originalName}" → "${componentName}"`);
        
        // Знаходимо компонент за назвою щоб отримати його ID
        const foundComponent = foundComponents.find(comp => comp.name === componentName);
        
        await apiRequest('/api/product-name-mappings', {
          method: 'POST',
          body: {
            externalSystemName: '1c',
            externalProductName: originalName,
            erpProductId: foundComponent?.id || null, // ID компонента для прямого зв'язку
            erpProductName: componentName,
            mappingType: 'manual',
            confidence: 1.0,
            isActive: true,
            notes: 'Ручне зіставлення під час імпорту накладних',
            createdBy: 'import_user'
          }
        });
        console.log(`✅ Зіставлення збережено в базу даних`);
      }
    } catch (error) {
      console.error('❌ Помилка збереження зіставлення:', error);
      // Не блокуємо процес, якщо не вдалося зберегти зіставлення
    }
  };

  if (selectedComponent) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700">{selectedComponent}</span>
        </div>
        <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
          знайдено
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedComponent('');
            onMappingChange('');
          }}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-sm text-gray-600 italic">
            {isSearching ? 'шукаю...' : 'буде створено'}
          </span>
        </div>
        <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5">
          {isSearching ? 'пошук' : 'новий'}
        </Badge>
      </div>
      
      {/* Ручний пошук */}
      <div className="relative">
        <Input
          placeholder="Пошук компонентів..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchComponents(e.target.value);
          }}
          className="text-xs h-8"
          disabled={isSearching}
        />
        <Search className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
        
        {/* Результати пошуку */}
        {foundComponents.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {foundComponents.map((component, idx) => (
              <div
                key={idx}
                className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleManualMapping(component.name)}
              >
                <div className="text-sm font-medium">{component.name}</div>
                {component.sku && (
                  <div className="text-xs text-gray-500">SKU: {component.sku}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Import1CInvoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState<Invoice1C | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showOnlyMissing, setShowOnlyMissing] = useState(true); // За замовчуванням показувати тільки відсутні
  const [dateFilter, setDateFilter] = useState<DateFilterParams>({});
  
  // Очищення вибору при зміні фільтра
  useEffect(() => {
    setSelectedInvoices(new Set());
  }, [showOnlyMissing, dateFilter]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Формуємо URL для запиту з параметрами дати
  const buildInvoicesUrl = () => {
    const params = new URLSearchParams();
    if (dateFilter.period) {
      params.set('period', dateFilter.period);
    }
    if (dateFilter.dateFrom) {
      params.set('dateFrom', dateFilter.dateFrom);
    }
    if (dateFilter.dateTo) {
      params.set('dateTo', dateFilter.dateTo);
    }
    return `/api/1c/invoices${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Завантаження доступних накладних з 1C
  const { data: invoices1C = [], isLoading: loadingInvoices, error: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["/api/1c/invoices", dateFilter],
    queryFn: () => apiRequest(buildInvoicesUrl()),
    enabled: Boolean(isOpen && (dateFilter.period || dateFilter.dateFrom)), // Завантаження тільки після вибору дат
    retry: false,
    onError: (error) => {
      console.error("1C Invoices API Error:", error);
      toast({
        title: "Помилка завантаження",
        description: "Не вдалося завантажити накладні з 1С. Перевірте підключення.",
        variant: "destructive",
      });
    }
  });

  // Додаємо логування для дебагу
  console.log("1C Invoices Debug:", {
    isOpen,
    loadingInvoices,
    invoicesError,
    invoices1C,
    invoicesCount: invoices1C?.length || 0
  });

  // Мутація для імпорту вибраних накладних
  const importMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      setIsImporting(true);
      setImportProgress({ total: invoiceIds.length, processed: 0, succeeded: 0, failed: 0, errors: [] });
      
      const results = [];
      for (let i = 0; i < invoiceIds.length; i++) {
        const invoiceId = invoiceIds[i];
        try {
          // Знаходимо накладну за ID
          const invoice = invoices1C.find((inv: Invoice1C) => inv.id === invoiceId);
          if (!invoice) {
            throw new Error(`Накладна з ID ${invoiceId} не знайдена`);
          }
          
          // Використовуємо той самий endpoint що й для окремого імпорту
          const result = await apiRequest('/api/1c/invoices/import', {
            method: 'POST',
            body: invoice,
          });
          results.push({ success: true, invoiceId, result });
          setImportProgress(prev => prev ? {
            ...prev,
            processed: i + 1,
            succeeded: prev.succeeded + 1
          } : null);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ success: false, invoiceId, error: errorMessage });
          setImportProgress(prev => prev ? {
            ...prev,
            processed: i + 1,
            failed: prev.failed + 1,
            errors: [...prev.errors, `${invoiceId}: ${errorMessage}`]
          } : null);
        }
      }
      
      setIsImporting(false);
      return results;
    },
    onSuccess: (results) => {
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      // Оновлюємо локальний статус успішно імпортованих накладних
      const successfulInvoiceIds = results.filter(r => r.success).map(r => r.invoiceId);
      if (successfulInvoiceIds.length > 0) {
        // Інвалідуємо кеш накладних 1С для оновлення статусів
        queryClient.invalidateQueries({ queryKey: ["/api/1c/invoices"] });
        // Викликаємо refetch для оновлення з сервера
        setTimeout(() => refetchInvoices(), 500); // Невелика затримка для обробки даних на сервері
      }
      
      toast({
        title: "Імпорт завершено",
        description: `Успішно імпортовано: ${succeeded}, помилок: ${failed}`,
        variant: succeeded > 0 ? "default" : "destructive",
      });
      
      // Оновлюємо всі пов'язані кеші
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      setSelectedInvoices(new Set());
    },
    onError: (error) => {
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Невідома помилка",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  });

  // Мутація для імпорту окремої накладної
  const importSingleInvoiceMutation = useMutation({
    mutationFn: async (invoice: Invoice1C) => {
      const result = await apiRequest('/api/1c/invoices/import', {
        method: 'POST',
        body: invoice, // apiRequest вже робить JSON.stringify, не потрібно подвійне кодування
      });
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Успіх",
        description: `Накладна імпортована як прихід постачальника! Перейдіть у розділ "Приходи постачальників" для перегляду. ${result.message || ''}`,
      });
      // Оновлюємо всі пов'язані кеші
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/1c/invoices"] });
      // Викликаємо refetch з затримкою для оновлення статусів
      setTimeout(() => refetchInvoices(), 500);
      setShowPreview(null); // Закриваємо діалог після успішного імпорту
    },
    onError: (error: any) => {
      toast({
        title: "Помилка імпорту",
        description: error.message || 'Не вдалося імпортувати накладну',
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableDisplayedInvoices = displayedInvoices.filter((inv: Invoice1C) => !inv.exists).map((inv: Invoice1C) => inv.id);
      setSelectedInvoices(new Set(availableDisplayedInvoices));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (checked) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleImport = () => {
    if (selectedInvoices.size === 0) {
      toast({
        title: "Оберіть накладні",
        description: "Будь ласка, оберіть хоча б одну накладну для імпорту",
        variant: "destructive",
      });
      return;
    }
    
    importMutation.mutate(Array.from(selectedInvoices));
  };

  const availableInvoices = invoices1C.filter((inv: Invoice1C) => !inv.exists);
  const existingInvoices = invoices1C.filter((inv: Invoice1C) => inv.exists);
  
  // Фільтруємо накладні для відображення
  const displayedInvoices = showOnlyMissing ? availableInvoices : invoices1C;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          title="Імпорт накладних з 1С як приходи постачальників в ERP"
        >
          <Upload className="w-4 h-4" />
          Імпорт накладних
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Імпорт накладних з 1C
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Імпортовані накладні створюються як приходи постачальників. Після імпорту перейдіть у розділ "Приходи постачальників" для перегляду.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Статистика */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Всього в 1C</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoices1C.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Доступні для імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableInvoices.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Вже в ERP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">{existingInvoices.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Вибрано</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{selectedInvoices.size}</div>
              </CardContent>
            </Card>
          </div>

          {/* Фільтр періоду */}
          <DatePeriodFilter
            onFilterChange={(newFilter) => {
              setDateFilter(newFilter);
              console.log('📅 Змінено фільтр дат для накладних:', newFilter);
            }}
          />

          {/* Прогрес імпорту */}
          {importProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Прогрес імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Оброблено: {importProgress.processed} з {importProgress.total}</span>
                    <span>Успішно: {importProgress.succeeded} | Помилок: {importProgress.failed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                    />
                  </div>
                  {importProgress.errors.length > 0 && (
                    <div className="mt-2 max-h-20 overflow-y-auto">
                      {importProgress.errors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600">{error}</div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Управління вибором */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedInvoices.size === displayedInvoices.filter(inv => !inv.exists).length && displayedInvoices.filter(inv => !inv.exists).length > 0}
                onCheckedChange={handleSelectAll}
                disabled={displayedInvoices.filter(inv => !inv.exists).length === 0 || isImporting}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Вибрати всі доступні ({displayedInvoices.filter(inv => !inv.exists).length})
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-only-missing"
                checked={showOnlyMissing}
                onCheckedChange={setShowOnlyMissing}
                disabled={isImporting}
              />
              <label htmlFor="show-only-missing" className="text-sm font-medium">
                Тільки відсутні
              </label>
            </div>
            
            <Button 
              onClick={handleImport}
              disabled={selectedInvoices.size === 0 || isImporting}
              className="ml-auto"
            >
              {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Імпортувати вибрані ({selectedInvoices.size})
            </Button>
          </div>

          {/* Список накладних */}
          <div className="flex-1 overflow-y-auto">
            {!dateFilter.period && !dateFilter.dateFrom ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Оберіть період дат вище для завантаження накладних з 1С</p>
                </div>
              </div>
            ) : loadingInvoices ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Завантаження накладних з 1C...</span>
              </div>
            ) : invoicesError ? (
              <div className="text-center py-8 text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="mb-2">Помилка завантаження: {invoicesError instanceof Error ? invoicesError.message : 'Невідома помилка'}</p>
                {invoicesError instanceof Error && invoicesError.message.includes('401') && (
                  <p className="text-sm text-gray-600 mb-4">Потрібна авторизація в системі</p>
                )}
                <Button variant="outline" size="sm" onClick={() => refetchInvoices()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Спробувати знову
                </Button>
              </div>
            ) : displayedInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {showOnlyMissing ? 'Всі накладні вже імпортовані в ERP' : 'Не знайдено накладних в 1C'}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedInvoices.map((invoice: Invoice1C) => (
                  <Card key={invoice.id} className={`transition-all ${invoice.exists ? 'opacity-50 bg-gray-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                          disabled={invoice.exists || isImporting}
                        />
                        
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <div>
                            <div className="font-medium">{invoice.number}</div>
                            <div className="text-sm text-gray-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(invoice.date).toLocaleDateString('uk-UA')}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-sm">
                              <Building2 className="w-3 h-3 inline mr-1" />
                              {invoice.supplierName}
                            </div>
                            {invoice.supplierTaxCode && (
                              <div className="text-xs text-gray-500">ЕДРПОУ: {invoice.supplierTaxCode}</div>
                            )}
                          </div>
                          
                          <div>
                            <div className="font-medium">
                              <DollarSign className="w-3 h-3 inline mr-1" />
                              {invoice.amount.toLocaleString('uk-UA')} {invoice.currency}
                            </div>
                          </div>
                          
                          <div>
                            <Badge variant={invoice.exists ? 'secondary' : 'default'}>
                              {invoice.exists ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  В ERP
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Новий
                                </>
                              )}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPreview(invoice)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Діалог перегляду накладної */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Перегляд накладної {showPreview?.number}</DialogTitle>
              {showPreview && !showPreview.exists && (
                <Button
                  onClick={() => importSingleInvoiceMutation.mutate(showPreview)}
                  disabled={importSingleInvoiceMutation.isPending}
                  className="ml-4"
                >
                  {importSingleInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Імпортую...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Імпортувати накладну
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {showPreview && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-shrink-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Інформація про документ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Номер:</strong> {showPreview.number}</div>
                      <div><strong>Дата:</strong> {new Date(showPreview.date).toLocaleDateString('uk-UA')}</div>
                      <div><strong>Постачальник:</strong> {showPreview.supplierName}</div>
                      {showPreview.supplierTaxCode && (
                        <div><strong>ЕДРПОУ:</strong> {showPreview.supplierTaxCode}</div>
                      )}
                      <div><strong>Статус:</strong> {showPreview.status}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Сума</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {showPreview.amount.toLocaleString('uk-UA')} {showPreview.currency}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Card className="flex-1 flex flex-col mt-4">
                <CardHeader className="flex-shrink-0 pb-2">
                  <CardTitle className="text-sm">Позиції накладної з зіставленням компонентів</CardTitle>
                  <CardDescription>
                    Відображено зіставлення назв товарів з 1С з компонентами в ERP системі
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-0">
                  <div className="h-[500px] overflow-y-auto border border-gray-200 rounded-md">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 border-b z-10">
                        <tr>
                          <th className="text-left p-3 font-semibold">Найменування з 1С</th>
                          <th className="text-left p-3 font-semibold">Зіставлення ERP</th>
                          <th className="text-right p-3 font-semibold">Кількість</th>
                          <th className="text-left p-3 font-semibold">Од. вим.</th>
                          <th className="text-right p-3 font-semibold">Ціна</th>
                          <th className="text-right p-3 font-semibold">Сума</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showPreview.items.map((item, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-3 max-w-xs">
                              <div className="font-medium text-sm break-words">
                                {item.nameFrom1C || item.originalName || item.name}
                              </div>
                              {item.sku && (
                                <div className="text-xs text-gray-500 font-mono mt-1">
                                  SKU: {item.sku}
                                </div>
                              )}
                            </td>
                            <td className="p-3 max-w-xs">
                              <ComponentMappingCell 
                                item={item} 
                                onMappingChange={(mappedComponent) => {
                                  const updatedItems = showPreview.items.map(i => 
                                    i === item ? { ...i, erpEquivalent: mappedComponent, isMapped: true } : i
                                  );
                                  setShowPreview({ ...showPreview, items: updatedItems });
                                }}
                              />
                            </td>
                            <td className="p-3 text-right font-medium whitespace-nowrap">{item.quantity}</td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">{item.unit}</td>
                            <td className="p-3 text-right font-medium whitespace-nowrap">{item.price.toLocaleString('uk-UA')} грн</td>
                            <td className="p-3 text-right font-bold text-blue-600 whitespace-nowrap">{item.total.toLocaleString('uk-UA')} грн</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}