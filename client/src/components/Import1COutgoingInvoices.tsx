import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Building2,
  RefreshCw
} from "lucide-react";

interface OutgoingInvoice1C {
  id: string;
  number: string;
  date: string;
  clientName: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
  description: string;
  clientTaxCode?: string;
  itemsCount?: number;
  managerName?: string;
  exists?: boolean;
  positions: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export function Import1COutgoingInvoices() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState<OutgoingInvoice1C | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [showOnlyMissing, setShowOnlyMissing] = useState(true); // За замовчуванням показувати тільки відсутні
  
  // Очищення вибору при зміні фільтра
  useEffect(() => {
    setSelectedInvoices(new Set());
  }, [showOnlyMissing]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Завантаження вихідних рахунків з 1C (backend вже додає exists property)
  const { data: outgoingInvoices = [], isLoading: loadingInvoices, error: invoicesError, refetch: refetchInvoices } = useQuery({
    queryKey: ["/api/1c/outgoing-invoices"],
    enabled: isOpen,
    retry: false,
    onError: (error) => {
      console.error("1C Outgoing Invoices API Error:", error);
      toast({
        title: "Помилка завантаження",
        description: "Не вдалося завантажити вихідні рахунки з 1С. Перевірте підключення.",
        variant: "destructive",
      });
    }
  });

  // Фільтруємо рахунки відповідно до налаштування "Тільки відсутні" (використовуємо exists з backend)
  const displayInvoices = showOnlyMissing 
    ? (outgoingInvoices || []).filter((invoice: OutgoingInvoice1C & { exists?: boolean }) => !invoice.exists)
    : (outgoingInvoices || []);
  
  // Додаємо логування для дебагу
  console.log("🔧 1C Outgoing Invoices Frontend Debug:", {
    isOpen,
    loadingInvoices,
    hasError: !!invoicesError,
    errorMessage: invoicesError?.message || null,
    realDataCount: outgoingInvoices?.length || 0,
    displayDataCount: displayInvoices?.length || 0,
    firstRealInvoice: outgoingInvoices?.[0] || null,
    firstDisplayInvoice: displayInvoices?.[0] || null
  });

  // Мутація для імпорту вибраних рахунків
  const importMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const results = [];
      for (const invoiceId of invoiceIds) {
        const result = await apiRequest(`/api/1c/outgoing-invoices/${invoiceId}/import`, {
          method: 'POST'
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Імпорт завершено",
        description: `Успішно імпортовано ${results.length} вихідних рахунків як замовлення`,
        variant: "default",
      });
      
      // Оновлюємо дані
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      setSelectedInvoices(new Set());
      setIsImporting(false);
      setImportProgress(null);
    },
    onError: (error) => {
      console.error("Import error:", error);
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
      // Вибираємо тільки рахунки, які ще не існують в ERP
      const availableInvoices = displayInvoices.filter((inv: OutgoingInvoice1C) => !inv.exists);
      setSelectedInvoices(new Set(availableInvoices.map((inv: OutgoingInvoice1C) => inv.id)));
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
        title: "Оберіть рахунки",
        description: "Будь ласка, оберіть хоча б один рахунок для імпорту",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({
      total: selectedInvoices.size,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    });

    importMutation.mutate(Array.from(selectedInvoices));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Підтверджено</Badge>;
      case 'draft':
        return <Badge variant="secondary">Чернетка</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Скасовано</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Оплачено</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Не оплачено</Badge>;
      case 'partial':
        return <Badge variant="secondary">Частково</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Імпорт рахунків
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Імпорт вихідних рахунків з 1С
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full max-h-[calc(90vh-8rem)]">
          {/* Помилка завантаження */}
          {invoicesError && (
            <Card className="mb-4 border-destructive">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Помилка з'єднання з 1С
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {invoicesError.message}
                </p>
                <Button onClick={() => refetchInvoices()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Спробувати знову
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Прогрес завантаження */}
          {loadingInvoices && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Завантаження вихідних рахунків з 1С...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Прогрес імпорту */}
          {importProgress && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Прогрес імпорту</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={(importProgress.processed / importProgress.total) * 100} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Оброблено: {importProgress.processed} з {importProgress.total}</span>
                  <span>Успішно: {importProgress.succeeded} | Помилок: {importProgress.failed}</span>
                </div>
                {importProgress.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive">Помилки:</p>
                    <ul className="text-sm text-destructive mt-1">
                      {importProgress.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Основний контент */}
          {!loadingInvoices && displayInvoices.length > 0 && (
            <>
              {/* Заголовок зі статистикою */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Рахунки з 1С: {outgoingInvoices.length} (показано: {displayInvoices.length})
                    {showOnlyMissing && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-normal">
                        тільки нові
                      </span>
                    )}
                    {displayInvoices?.some(inv => inv.clientName?.includes('(демо)') || inv.id?.includes('fallback')) && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-normal">
                        демо режим - 1С недоступна
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedInvoices.size === displayInvoices.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Вибрати всі
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-only-missing"
                          checked={showOnlyMissing}
                          onCheckedChange={setShowOnlyMissing}
                        />
                        <label htmlFor="show-only-missing" className="text-sm font-medium">
                          Тільки відсутні
                        </label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Вибрано: {selectedInvoices.size} | Показано: {displayInvoices.length}
                      </span>
                    </div>
                    <Button
                      onClick={handleImport}
                      disabled={selectedInvoices.size === 0 || isImporting}
                      className="ml-4"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Імпорт...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Імпортувати обрані ({selectedInvoices.size})
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Список рахунків */}
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {displayInvoices.map((invoice: OutgoingInvoice1C) => (
                    <Card key={invoice.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`invoice-${invoice.id}`}
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                              disabled={isImporting}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium">{invoice.number}</span>
                                {getStatusBadge(invoice.status)}
                                {getPaymentStatusBadge(invoice.paymentStatus)}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium text-sm">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    {new Date(invoice.date).toLocaleDateString('uk-UA')}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="font-medium text-sm">
                                    <DollarSign className="w-3 h-3 inline mr-1" />
                                    {invoice.total.toLocaleString('uk-UA')} {invoice.currency}
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="font-medium text-sm">
                                    <User className="w-3 h-3 inline mr-1" />
                                    {invoice.clientName}
                                  </div>
                                </div>
                                
                                {invoice.description && (
                                  <div>
                                    <div className="text-sm text-muted-foreground">
                                      {invoice.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Пусто */}
          {!loadingInvoices && !invoicesError && displayInvoices.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Вихідних рахунків не знайдено</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Попередній перегляд рахунку */}
      {showPreview && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Попередній перегляд рахунку {showPreview.number}</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Інформація про рахунок</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Номер рахунку</label>
                        <p className="text-sm">{showPreview.number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Дата</label>
                        <p className="text-sm">{new Date(showPreview.date).toLocaleDateString('uk-UA')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Клієнт</label>
                        <p className="text-sm">{showPreview.clientName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Сума</label>
                        <p className="text-sm">{showPreview.total.toLocaleString('uk-UA')} {showPreview.currency}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Статус</label>
                        <div className="pt-1">
                          {getStatusBadge(showPreview.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Статус оплати</label>
                        <div className="pt-1">
                          {getPaymentStatusBadge(showPreview.paymentStatus)}
                        </div>
                      </div>
                    </div>
                    
                    {showPreview.description && (
                      <div>
                        <label className="text-sm font-medium">Опис</label>
                        <p className="text-sm">{showPreview.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Позиції рахунку */}
                {showPreview.positions && showPreview.positions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Позиції рахунку</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {showPreview.positions.map((position, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg border">
                            <div className="space-y-2">
                              {/* Назва з 1С */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-600 font-medium">1С:</span>
                                <span className="text-sm font-medium">{position.nameFrom1C || position.productName}</span>
                              </div>
                              
                              {/* ERP еквівалент */}
                              {position.erpEquivalent ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-green-600 font-medium">ERP:</span>
                                  <span className="text-sm text-green-700">{position.erpEquivalent}</span>
                                  <span className="text-xs bg-green-100 text-green-800 px-1 rounded">знайдено</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-orange-600 font-medium">ERP:</span>
                                  <span className="text-sm text-gray-500 italic">товар буде створено</span>
                                  <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">новий</span>
                                </div>
                              )}
                              
                              {/* Кількість та ціни */}
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Кількість: {position.quantity}</span>
                                <span>Ціна: {position.price.toLocaleString('uk-UA')} {showPreview.currency}</span>
                                <span className="font-medium">Сума: {position.total.toLocaleString('uk-UA')} {showPreview.currency}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}