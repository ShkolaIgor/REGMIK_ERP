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
  }, [autoMappingAttempted, item.erpEquivalent]);

  const performAutoMapping = async () => {
    try {
      setIsSearching(true);
      const response = await apiRequest(`/api/1c/invoices/check-mapping/${encodeURIComponent(item.name || item.originalName)}`);
      if (response.found && response.component) {
        setSelectedComponent(response.component.name);
        onMappingChange(response.component.name);
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
      setFoundComponents(response.slice(0, 50));
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
    
    // Зберігаємо зіставлення
    try {
      const originalName = item.name || item.originalName;
      if (originalName && componentName) {
        const foundComponent = foundComponents.find(comp => comp.name === componentName);
        
        await apiRequest('/api/product-name-mappings', {
          method: 'POST',
          body: {
            externalSystemName: '1c',
            externalProductName: originalName,
            erpProductId: foundComponent?.id || null,
            erpProductName: componentName,
            mappingType: 'manual',
            confidence: 1.0,
            isActive: true,
            notes: 'Ручне зіставлення під час імпорту накладних',
            createdBy: 'import_user'
          }
        });
      }
    } catch (error) {
      console.error('Помилка збереження зіставлення:', error);
    }
  };

  if (selectedComponent) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700">{selectedComponent}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedComponent('');
            onMappingChange('');
          }}
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
        <span className="text-sm text-orange-600">Новий компонент</span>
        {isSearching && <Loader2 className="w-3 h-3 animate-spin" />}
      </div>
      
      <div className="relative">
        <Input
          type="text"
          placeholder="Пошук компонента..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            searchComponents(e.target.value);
          }}
          className="text-xs h-8"
        />
        <Search className="absolute right-2 top-2 w-3 h-3 text-gray-400" />
        
        {foundComponents.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
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

export function Import1CInvoicesSimple() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterParams>({});
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  
  // Очищення вибору та розгортання при зміні фільтра
  useEffect(() => {
    setSelectedInvoices(new Set());
    setExpandedInvoices(new Set());
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
    enabled: Boolean(isOpen && (dateFilter.period || dateFilter.dateFrom)),
    retry: false
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
          const invoice = invoices1C.find((inv: Invoice1C) => inv.id === invoiceId);
          if (!invoice) continue;
          
          const result = await apiRequest(`/api/import/1c-invoice`, {
            method: 'POST',
            body: invoice
          });
          
          results.push(result);
          setImportProgress(prev => prev ? { 
            ...prev, 
            processed: i + 1, 
            succeeded: prev.succeeded + 1 
          } : null);
        } catch (error) {
          console.error(`Помилка імпорту накладної ${invoiceId}:`, error);
          setImportProgress(prev => prev ? { 
            ...prev, 
            processed: i + 1, 
            failed: prev.failed + 1,
            errors: [...prev.errors, `${invoiceId}: ${error instanceof Error ? error.message : 'Невідома помилка'}`]
          } : null);
        }
      }
      
      return results;
    },
    onSuccess: () => {
      setIsImporting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      toast({
        title: "Імпорт завершено",
        description: "Накладні успішно імпортовано як приходи постачальників"
      });
      setSelectedInvoices(new Set());
      setIsOpen(false);
    },
    onError: (error) => {
      setIsImporting(false);
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Невідома помилка",
        variant: "destructive"
      });
    }
  });

  // Функції для роботи з вибором накладних
  const handleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map((inv: Invoice1C) => inv.id)));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  // Фільтрація накладних
  const filteredInvoices = showOnlyMissing 
    ? invoices1C.filter((invoice: Invoice1C) => !invoice.exists)
    : invoices1C;

  const handleImport = () => {
    if (selectedInvoices.size === 0) {
      toast({
        title: "Не вибрано накладних",
        description: "Виберіть накладні для імпорту",
        variant: "destructive"
      });
      return;
    }
    importMutation.mutate(Array.from(selectedInvoices));
  };

  // Обробка розгортання позицій накладних
  const toggleInvoiceExpansion = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices);
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId);
    } else {
      newExpanded.add(invoiceId);
    }
    setExpandedInvoices(newExpanded);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Імпорт з 1С
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Імпорт накладних з 1С
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Фільтри */}
          <div className="flex gap-4 items-center flex-wrap">
            <DatePeriodFilter
              onFilterChange={setDateFilter}
              defaultPeriod="select"
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showOnlyMissing"
                checked={showOnlyMissing}
                onCheckedChange={(checked) => setShowOnlyMissing(checked === true)}
              />
              <label htmlFor="showOnlyMissing" className="text-sm">
                Тільки не імпортовані
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchInvoices()}
              disabled={loadingInvoices}
            >
              <RefreshCw className={`w-4 h-4 ${loadingInvoices ? 'animate-spin' : ''}`} />
              Оновити
            </Button>
          </div>

          {/* Стан завантаження та помилки */}
          {!dateFilter.period && !dateFilter.dateFrom && (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Оберіть період дат для завантаження накладних з 1С
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingInvoices && (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Завантаження накладних з 1С...
              </CardContent>
            </Card>
          )}

          {invoicesError && (
            <Card>
              <CardContent className="flex items-center justify-center py-6">
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-red-600">
                    Помилка завантаження: {invoicesError instanceof Error ? invoicesError.message : "Невідома помилка"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Список накладних */}
          {filteredInvoices.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedInvoices.size === filteredInvoices.length ? 'Скасувати вибір' : 'Вибрати всі'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    Вибрано: {selectedInvoices.size} з {filteredInvoices.length}
                  </span>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={selectedInvoices.size === 0 || isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Імпортувати вибрані
                </Button>
              </div>

              <div className="flex-1 overflow-auto border rounded-lg">
                <div className="space-y-2 p-4">
                  {filteredInvoices.map((invoice: Invoice1C) => (
                    <div key={invoice.id} className="border rounded-lg">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => handleSelectInvoice(invoice.id)}
                        />
                        
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{invoice.number}</div>
                            <div className="text-gray-500">№ {invoice.number}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(invoice.date).toLocaleDateString('uk-UA')}
                            </div>
                            <div className="text-gray-500">{invoice.supplierName}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {(invoice.amount || 0).toLocaleString('uk-UA', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })} {invoice.currency || 'UAH'}
                            </div>
                            <div className="text-gray-500">
                              {invoice.items?.length || 0} позицій
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {invoice.exists ? (
                              <Badge variant="secondary" className="gap-1">
                                <Check className="w-3 h-3" />
                                Імпортовано
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="w-3 h-3" />
                                Новий
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleInvoiceExpansion(invoice.id)}
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          {expandedInvoices.has(invoice.id) ? 'Сховати' : 'Позиції'}
                        </Button>
                      </div>

                      {/* Розгорнуті позиції накладної */}
                      {expandedInvoices.has(invoice.id) && invoice.items && (
                        <div className="border-t">
                          <div className="p-4">
                            <div className="text-sm font-medium mb-3">
                              Позиції накладної ({invoice.items.length})
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left p-2">Найменування з 1С</th>
                                    <th className="text-left p-2">Зіставлення</th>
                                    <th className="text-right p-2">Кількість</th>
                                    <th className="text-right p-2">Ціна</th>
                                    <th className="text-right p-2">Сума</th>
                                    <th className="text-left p-2">Од. вим.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.items.map((position: any, idx: number) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                      <td className="p-2">
                                        <div className="font-medium">{position.name || position.originalName}</div>
                                        {position.code && (
                                          <div className="text-gray-500">Код: {position.code}</div>
                                        )}
                                      </td>
                                      <td className="p-2">
                                        <ComponentMappingCell 
                                          item={position}
                                          onMappingChange={(component) => {
                                            position.erpEquivalent = component;
                                          }}
                                        />
                                      </td>
                                      <td className="text-right p-2">
                                        {position.quantity?.toLocaleString('uk-UA') || '0'}
                                      </td>
                                      <td className="text-right p-2">
                                        {(position.price || 0).toLocaleString('uk-UA', { 
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2 
                                        })}
                                      </td>
                                      <td className="text-right p-2">
                                        {(position.total || 0).toLocaleString('uk-UA', { 
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2 
                                        })}
                                      </td>
                                      <td className="p-2">{position.unit || 'шт'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Прогрес імпорту */}
          {importProgress && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Прогрес імпорту</span>
                  <span className="text-sm text-gray-500">
                    {importProgress.processed} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Успішно: {importProgress.succeeded}</span>
                  <span>Помилки: {importProgress.failed}</span>
                </div>
                {importProgress.errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    <details>
                      <summary>Деталі помилок ({importProgress.errors.length})</summary>
                      <ul className="mt-1 space-y-1">
                        {importProgress.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Порожній стан */}
          {filteredInvoices.length === 0 && !loadingInvoices && !invoicesError && (dateFilter.period || dateFilter.dateFrom) && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Накладні не знайдено
                  </h3>
                  <p className="text-sm text-gray-500">
                    {showOnlyMissing 
                      ? "Всі накладні за вибраний період вже імпортовані"
                      : "За вибраний період накладні відсутні"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}