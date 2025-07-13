import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Filter, Eye, FileText, Building2, Calendar, DollarSign, AlertTriangle, RefreshCw, Search, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DataTable } from "./DataTable/DataTable";

interface Invoice202 {
  id: string;
  number: string;
  date: string;
  supplierName: string;
  supplierTaxCode?: string;
  amount: number;
  currency: string;
  status: string;
  hasAccount202: boolean;
  items: Array<{
    name: string;
    originalName?: string;
    nameFrom1C?: string;
    sku?: string;
    quantity: number;
    unit?: string;
    price: number;
    total: number;
    accountCode: string;
    erpEquivalent?: string;
    erpComponentId?: number;
    isMapped?: boolean;
  }>;
}

interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

// Компонент для зіставлення компонентів (вбудований)
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
      setFoundComponents(response.slice(0, 5));
    } catch (error) {
      console.error('Component search failed:', error);
      setFoundComponents([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchComponents(value);
  };

  const handleSelectComponent = (componentName: string) => {
    setSelectedComponent(componentName);
    onMappingChange(componentName);
    setFoundComponents([]);
    setSearchTerm('');
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2">
        {selectedComponent ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-800 font-medium truncate max-w-[200px]">
              {selectedComponent}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedComponent('');
                onMappingChange('');
              }}
              className="h-6 w-6 p-0 hover:bg-green-100"
            >
              ×
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Input
                type="text"
                placeholder="Пошук компонентів..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="text-xs h-8"
                disabled={isSearching}
              />
              {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            
            {foundComponents.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {foundComponents.map((component, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectComponent(component.name)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{component.name}</div>
                    {component.sku && (
                      <div className="text-gray-500">SKU: {component.sku}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoicePreviewDialog({ invoice }: { invoice: Invoice202 }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const importSingleInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const result = await apiRequest(`/api/1c/invoices/${invoiceId}/import`, {
        method: 'POST'
      });
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Успішно імпортовано",
        description: `Накладна ${invoice.number} імпортована. Створено ${data.componentIds?.length || 0} компонентів.`,
      });
      // Оновлюємо кеш накладних
      queryClient.invalidateQueries({ queryKey: ['/api/1c/invoices-202'] });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка імпорту",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleImportSingle = () => {
    importSingleInvoiceMutation.mutate(invoice.id);
  };

  const itemsColumns = [
    {
      id: "name",
      header: "Назва товару",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium text-sm">{row.original.name}</div>
          {row.original.nameFrom1C && row.original.nameFrom1C !== row.original.name && (
            <div className="text-xs text-muted-foreground mt-1">
              1С: {row.original.nameFrom1C}
            </div>
          )}
          {row.original.sku && (
            <div className="text-xs text-blue-600 mt-1">
              SKU: {row.original.sku}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "mapping",
      header: "Зіставлення ERP",
      cell: ({ row }) => (
        <ComponentMappingCell 
          item={row.original}
          onMappingChange={(component) => {
            row.original.erpEquivalent = component;
          }}
        />
      ),
    },
    {
      id: "account",
      header: "Рахунок",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          {row.original.accountCode}
        </Badge>
      ),
    },
    {
      id: "quantity",
      header: "Кількість",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.quantity} {row.original.unit || 'шт'}
        </div>
      ),
    },
    {
      id: "price",
      header: "Ціна",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.price?.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {invoice.currency}
        </div>
      ),
    },
    {
      id: "total",
      header: "Сума",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.total?.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {invoice.currency}
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Переглянути
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Накладна {invoice.number} (Рахунок 202)
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Інформація про накладну */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Основна інформація</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Номер:</span>
                  <span className="font-medium">{invoice.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата:</span>
                  <span>{new Date(invoice.date).toLocaleDateString('uk-UA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge variant={invoice.status === 'posted' ? 'default' : 'secondary'}>
                    {invoice.status === 'posted' ? 'Проведено' : 'Чернетка'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Постачальник</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="font-medium">{invoice.supplierName}</div>
                  {invoice.supplierTaxCode && (
                    <div className="text-sm text-muted-foreground">
                      Код: {invoice.supplierTaxCode}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Сума:</span>
                  <span className="font-bold text-lg">
                    {invoice.amount?.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Позиції накладної */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-purple-600" />
                Позиції з рахунком обліку 202
                <Badge variant="outline" className="ml-2">
                  {invoice.items?.length || 0} позицій
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto">
                <DataTable
                  data={invoice.items || []}
                  columns={itemsColumns}
                  searchColumn="name"
                  searchPlaceholder="Пошук товарів..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Кнопки дій */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Закрити
          </Button>
          <Button 
            onClick={handleImportSingle}
            disabled={importSingleInvoiceMutation.isPending}
          >
            {importSingleInvoiceMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Імпорт...
              </>
            ) : (
              'Імпортувати накладну'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Import1CInvoices202() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  const { 
    data: invoices = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/1c/invoices-202'],
    retry: false,
  });

  const importMutation = useMutation({
    mutationFn: async (invoicesData: Invoice202[]) => {
      const total = invoicesData.length;
      let processed = 0;
      let succeeded = 0;
      let failed = 0;
      const errors: string[] = [];

      setImportProgress({ total, processed, succeeded, failed, errors });

      for (const invoice of invoicesData) {
        try {
          const result = await apiRequest(`/api/1c/invoices/${invoice.id}/import`, {
            method: 'POST'
          });
          
          if (result.success) {
            succeeded++;
          } else {
            failed++;
            errors.push(`${invoice.number}: ${result.message}`);
          }
        } catch (error) {
          failed++;
          errors.push(`${invoice.number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        processed++;
        setImportProgress({ total, processed, succeeded, failed, errors });
      }

      return { total, succeeded, failed, errors };
    },
    onSuccess: (result) => {
      toast({
        title: "Імпорт завершено",
        description: `Успішно: ${result.succeeded}, Помилок: ${result.failed}`,
        variant: result.failed > 0 ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/1c/invoices-202'] });
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      setSelectedInvoices([]);
      setImportProgress(null);
    },
  });

  const handleImportSelected = () => {
    const invoicesToImport = invoices.filter((inv: Invoice202) => 
      selectedInvoices.includes(inv.id)
    );
    
    if (invoicesToImport.length === 0) {
      toast({
        title: "Накладні не вибрано",
        description: "Оберіть накладні для імпорту",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate(invoicesToImport);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map((inv: Invoice202) => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={selectedInvoices.length === invoices.length && invoices.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedInvoices.includes(row.original.id)}
          onChange={(e) => handleSelectInvoice(row.original.id, e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      id: "number",
      header: "Номер",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.number}</div>
      ),
    },
    {
      id: "date",
      header: "Дата",
      cell: ({ row }) => (
        <div>{new Date(row.original.date).toLocaleDateString('uk-UA')}</div>
      ),
    },
    {
      id: "supplier",
      header: "Постачальник",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.supplierName}</div>
          {row.original.supplierTaxCode && (
            <div className="text-sm text-muted-foreground">
              {row.original.supplierTaxCode}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "account202",
      header: "Рахунок 202",
      cell: () => (
        <Badge variant="default" className="bg-purple-600">
          202
        </Badge>
      ),
    },
    {
      id: "items",
      header: "Позицій",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.items?.length || 0}
        </Badge>
      ),
    },
    {
      id: "amount",
      header: "Сума",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.amount?.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {row.original.currency}
        </div>
      ),
    },
    {
      id: "status",
      header: "Статус",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'posted' ? 'default' : 'secondary'}>
          {row.original.status === 'posted' ? 'Проведено' : 'Чернетка'}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Дії",
      cell: ({ row }) => (
        <InvoicePreviewDialog invoice={row.original} />
      ),
    },
  ];

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Помилка завантаження накладних (рахунок 202)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Не вдалося завантажити накладні з рахунком обліку 202
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Спробувати знову
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-purple-600" />
          Накладні з рахунком обліку 202
        </CardTitle>
        <CardDescription>
          Вхідні накладні з позиціями, що відносяться до рахунку обліку 202
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Завантаження накладних...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Панель управління */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50">
                  Знайдено: {invoices.length} накладних
                </Badge>
                {selectedInvoices.length > 0 && (
                  <Badge variant="default">
                    Вибрано: {selectedInvoices.length}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Оновити
                </Button>
                
                <Button
                  onClick={handleImportSelected}
                  disabled={selectedInvoices.length === 0 || importMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4 mr-2" />
                  )}
                  Імпортувати вибрані ({selectedInvoices.length})
                </Button>
              </div>
            </div>

            {/* Прогрес імпорту */}
            {importProgress && (
              <Card className="bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Прогрес імпорту</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Оброблено: {importProgress.processed} / {importProgress.total}</span>
                      <span>Успішно: {importProgress.succeeded} | Помилок: {importProgress.failed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(importProgress.processed / importProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Таблиця накладних */}
            <DataTable
              data={invoices}
              columns={columns}
              searchColumn="number"
              searchPlaceholder="Пошук за номером накладної..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}