import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    warning: string;
    data?: any;
  }>;
}

export default function OrdersXmlImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [xmlContent, setXmlContent] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: { xmlContent: string }) => {
      return await apiRequest("/api/orders/xml-import", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      if (result.success > 0) {
        toast({
          title: "Імпорт завершено",
          description: `Успішно імпортовано ${result.success} замовлень`,
        });
      }
      
      if (result.errors.length > 0) {
        toast({
          title: "Помилки при імпорті",
          description: `${result.errors.length} записів не вдалося імпортувати`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося імпортувати замовлення",
        variant: "destructive",
      });
      setIsImporting(false);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlContent(content);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleImport = () => {
    if (!xmlContent.trim()) {
      toast({
        title: "Помилка",
        description: "Будь ласка, завантажте XML файл або вставте XML контент",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setImportResult(null);

    // Симуляція прогресу
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    importMutation.mutate({ xmlContent });
  };

  const resetForm = () => {
    setXmlContent("");
    setImportResult(null);
    setProgress(0);
    setIsImporting(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Імпорт XML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Імпорт замовлень з XML</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto space-y-4">
          {!importResult && (
            <>
              <div>
                <Label htmlFor="xmlFile">Завантажити XML файл</Label>
                <Input
                  id="xmlFile"
                  type="file"
                  accept=".xml,.txt"
                  onChange={handleFileUpload}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="xmlContent">Або вставити XML контент</Label>
                <Textarea
                  id="xmlContent"
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  placeholder="Вставте XML контент тут..."
                  rows={15}
                  className="mt-2 font-mono text-sm"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Маппінг полів:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><code>INDEX_PREDPR</code> → зв'язок з клієнтом через external_id</div>
                  <div><code>INDEX_FIRMA</code> → company_id</div>
                  <div><code>INDEX_TRANSPORT</code> → carrier_id (якщо &gt;18, то carrier_id=1)</div>
                  <div><code>NAME_ZAKAZ</code> → order_number</div>
                  <div><code>TERM</code> → due_date</div>
                  <div><code>PAY</code> → payment_date</div>
                  <div><code>REALIZ</code> → shipped_date</div>
                  <div><code>SCHET</code> → invoice_number</div>
                  <div><code>SUMMA</code> → total_amount</div>
                  <div><code>DATE_CREATE</code> → created_at</div>
                  <div><code>COMMENT</code> → notes</div>
                  <div><code>DECLARATION</code> → tracking_number</div>
                  <div><code>INDEX_ZAKAZCHIK</code> → зв'язок з контактом через external_id</div>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Імпорт замовлень...</span>
                    <span className="text-sm">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Скасувати
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !xmlContent.trim()}
                >
                  {isImporting ? "Імпорт..." : "Імпортувати"}
                </Button>
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{importResult.success}</div>
                  <div className="text-sm text-green-600">Успішно</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-700">{importResult.errors.length}</div>
                  <div className="text-sm text-red-600">Помилки</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-700">{importResult.warnings.length}</div>
                  <div className="text-sm text-yellow-600">Попередження</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Помилки:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 p-3 rounded text-sm">
                        <div className="font-medium text-red-800">Рядок {error.row}:</div>
                        <div className="text-red-700">{error.error}</div>
                        {error.data && (
                          <div className="text-red-600 text-xs mt-1">
                            Дані: {JSON.stringify(error.data)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-900 mb-2">Попередження:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {importResult.warnings.map((warning, index) => (
                      <div key={index} className="bg-yellow-50 p-3 rounded text-sm">
                        <div className="font-medium text-yellow-800">Рядок {warning.row}:</div>
                        <div className="text-yellow-700">{warning.warning}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button onClick={resetForm}>
                  Закрити
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}