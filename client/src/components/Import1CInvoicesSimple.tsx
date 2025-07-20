import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, FileText, Building2, Calendar, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProcessedInvoice1C } from "@shared/schema";
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

export function Import1CInvoicesSimple() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showOnlyMissing, setShowOnlyMissing] = useState(true);
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
    enabled: Boolean(isOpen && (dateFilter.period || dateFilter.dateFrom)),
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
          if (!invoice) {
            throw new Error(`Накладна з ID ${invoiceId} не знайдена`);
          }
          
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
      
      const successfulInvoiceIds = results.filter(r => r.success).map(r => r.invoiceId);
      if (successfulInvoiceIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/1c/invoices"] });
        setTimeout(() => refetchInvoices(), 500);
      }
      
      toast({
        title: "Імпорт завершено",
        description: `Успішно імпортовано: ${succeeded}, помилок: ${failed}`,
        variant: succeeded > 0 ? "default" : "destructive",
      });
      
      // Оновлюємо кеш приходів постачальників
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      setSelectedInvoices(new Set());
      setIsOpen(false); // Закриваємо діалог після успішного імпорту
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
          className="border-purple-200 text-purple-600 hover:bg-purple-50 duration-300 hover:scale-105 hover:shadow-md"
          title="Імпорт накладних з 1С як приходи постачальників"
        >
          <Upload className="w-4 h-4 mr-2" />
          Імпорт з 1С
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Імпорт накладних з 1C
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Імпортовані накладні створюються як приходи постачальників.
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
                <p className="text-xs text-muted-foreground">накладних у 1С</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Доступно для імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{availableInvoices.length}</div>
                <p className="text-xs text-muted-foreground">нових накладних</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Вже імпортовано</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{existingInvoices.length}</div>
                <p className="text-xs text-muted-foreground">існуючих в ERP</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Обрано</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedInvoices.size}</div>
                <p className="text-xs text-muted-foreground">для імпорту</p>
              </CardContent>
            </Card>
          </div>

          {/* Фільтр дат */}
          <div className="flex gap-4 items-center">
            <DatePeriodFilter 
              value={dateFilter} 
              onChange={setDateFilter}
              placeholder="Оберіть період для завантаження накладних"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchInvoices()}
              disabled={loadingInvoices}
            >
              {loadingInvoices ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Оновити
            </Button>
          </div>

          {!dateFilter.period && !dateFilter.dateFrom && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Оберіть період дат для завантаження накладних з 1С</p>
            </div>
          )}

          {(dateFilter.period || dateFilter.dateFrom) && loadingInvoices && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Завантаження накладних з 1С...</p>
            </div>
          )}

          {(dateFilter.period || dateFilter.dateFrom) && !loadingInvoices && invoicesError && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-500">Помилка завантаження накладних з 1С</p>
              <p className="text-gray-500 text-sm mt-2">Перевірте підключення до сервера 1С</p>
            </div>
          )}

          {(dateFilter.period || dateFilter.dateFrom) && !loadingInvoices && !invoicesError && displayedInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Немає накладних для відображення</p>
              <p className="text-gray-400 text-sm mt-2">
                {showOnlyMissing ? "Всі накладні вже імпортовані" : "Накладні не знайдені в обраному періоді"}
              </p>
            </div>
          )}

          {displayedInvoices.length > 0 && (
            <>
              {/* Контроли */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedInvoices.size === availableInvoices.length && availableInvoices.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Обрати всі доступні ({availableInvoices.length})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-only-missing"
                    checked={showOnlyMissing}
                    onCheckedChange={setShowOnlyMissing}
                  />
                  <label htmlFor="show-only-missing" className="text-sm">
                    Тільки нові накладні
                  </label>
                </div>
              </div>

              {/* Прогрес імпорту */}
              {isImporting && importProgress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Прогрес імпорту</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогрес: {importProgress.processed} з {importProgress.total}</span>
                        <span>Успішно: {importProgress.succeeded} | Помилок: {importProgress.failed}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                        />
                      </div>
                      {importProgress.errors.length > 0 && (
                        <div className="text-sm text-red-600 max-h-20 overflow-y-auto">
                          {importProgress.errors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Список накладних */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {displayedInvoices.map((invoice: Invoice1C) => (
                  <Card key={invoice.id} className={`${invoice.exists ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {!invoice.exists && (
                            <Checkbox
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.id, !!checked)}
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{invoice.number}</span>
                              {invoice.exists && <Badge variant="secondary">Імпортовано</Badge>}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.supplierName} • {new Date(invoice.date).toLocaleDateString('uk-UA')}
                            </div>
                            <div className="text-sm text-gray-600">
                              Позицій: {invoice.positions?.length || 0} • 
                              Сума: {parseFloat(invoice.totalAmount || '0').toLocaleString('uk-UA')} ₴
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Кнопки дій */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Скасувати
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={selectedInvoices.size === 0 || isImporting}
                  className="min-w-[120px]"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Імпорт...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Імпортувати ({selectedInvoices.size})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}