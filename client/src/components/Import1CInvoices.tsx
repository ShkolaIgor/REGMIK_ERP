import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, Eye, Check, X, FileText, Building2, Calendar, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProcessedInvoice1C } from "@shared/schema";

// Тип для накладних згідно з реальним кодом 1С
type Invoice1C = ProcessedInvoice1C;

interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export function Import1CInvoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState<Invoice1C | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Завантаження доступних накладних з 1C
  const { data: invoices1C = [], isLoading: loadingInvoices, error: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["/api/1c/invoices"],
    enabled: isOpen,
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
          const result = await apiRequest(`/api/1c/invoices/${invoiceId}/import`, {
            method: 'POST'
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
      
      toast({
        title: "Імпорт завершено",
        description: `Успішно імпортовано: ${succeeded}, помилок: ${failed}`,
        variant: succeeded > 0 ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
      refetchInvoices();
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableInvoices = invoices1C.filter((inv: Invoice1C) => !inv.exists).map((inv: Invoice1C) => inv.id);
      setSelectedInvoices(new Set(availableInvoices));
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Імпорт з 1C
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Імпорт приходних накладних з 1C
          </DialogTitle>
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
                checked={selectedInvoices.size === availableInvoices.length && availableInvoices.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={availableInvoices.length === 0 || isImporting}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Вибрати всі доступні ({availableInvoices.length})
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
            {loadingInvoices ? (
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
            ) : invoices1C.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Не знайдено накладних в 1C
              </div>
            ) : (
              <div className="space-y-2">
                {invoices1C.map((invoice: Invoice1C) => (
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Перегляд накладної {showPreview?.number}</DialogTitle>
          </DialogHeader>
          
          {showPreview && (
            <div className="space-y-4">
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
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Позиції накладної</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Найменування</th>
                          <th className="text-right p-2">Кількість</th>
                          <th className="text-left p-2">Од. вим.</th>
                          <th className="text-right p-2">Ціна</th>
                          <th className="text-right p-2">Сума</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showPreview.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">
                              <div className="space-y-1">
                                {/* Назва з 1С */}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-blue-600 font-medium">1С:</span>
                                  <span className="text-sm">{item.nameFrom1C || item.originalName || item.name}</span>
                                </div>
                                
                                {/* ERP еквівалент */}
                                {item.erpEquivalent ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-600 font-medium">ERP:</span>
                                    <span className="text-sm text-green-700">{item.erpEquivalent}</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded">знайдено</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-orange-600 font-medium">ERP:</span>
                                    <span className="text-sm text-gray-500 italic">товар буде створено</span>
                                    <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">новий</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2 text-right">{item.price.toLocaleString('uk-UA')}</td>
                            <td className="p-2 text-right font-medium">{item.total.toLocaleString('uk-UA')}</td>
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