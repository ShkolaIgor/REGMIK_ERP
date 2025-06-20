import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/xml" || file.name.endsWith(".xml")) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть XML файл",
          variant: "destructive",
        });
      }
    }
  };

  const importMutation = useMutation({
    mutationFn: async (xmlContent: string) => {
      console.log("Starting XML import...");
      setIsImporting(true);
      
      try {
        const result = await apiRequest("/api/orders/xml-import", {
          method: "POST",
          body: { xmlContent },
        });
        console.log("Import result:", result);
        return result;
      } catch (error) {
        console.error("Import mutation error:", error);
        throw error;
      } finally {
        setIsImporting(false);
      }
    },
    onSuccess: (result: ImportResult) => {
      console.log("Import success:", result);
      setImportResult(result);
      setIsImporting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      if (result.success > 0) {
        toast({
          title: "Імпорт завершено",
          description: `Успішно імпортовано ${result.success} замовлень`,
        });
      }
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Виявлено помилки",
          description: `${result.errors.length} замовлень не вдалося імпортувати`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Import error:", error);
      setIsImporting(false);
      setImportResult({
        success: 0,
        errors: [{ row: 0, error: error instanceof Error ? error.message : "Невідома помилка" }],
        warnings: []
      });
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Не вдалося обробити XML файл",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть XML файл для імпорту",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо розмір файлу (максимум 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Файл занадто великий",
        description: `Максимальний розмір файлу: 50MB. Ваш файл: ${Math.round(selectedFile.size / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      // Читаємо файл по частинам для великих файлів
      let fileContent = '';
      if (selectedFile.size > 5 * 1024 * 1024) { // Більше 5MB
        const reader = new FileReader();
        fileContent = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(selectedFile, 'utf-8');
        });
      } else {
        fileContent = await selectedFile.text();
      }

      await importMutation.mutateAsync(fileContent);
    } catch (error) {
      console.error("File reading error:", error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося прочитати файл",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setImportResult(null);
    const fileInput = document.getElementById('xml-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Імпорт XML
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Імпорт замовлень з XML файлу</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Завантаження XML файлу
              </CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <p>Оберіть XML файл з замовленнями для імпорту в систему.</p>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <p><strong>Формат:</strong> DATAPACKET/ROWDATA/ROW з атрибутами:</p>
                    <p>• INDEX_PREDPR (ID клієнта), NAME_ZAKAZ (номер), SUMMA (сума)</p>
                    <p>• TERM (термін), PAY (оплата), REALIZ (відвантаження)</p>
                    <p>• INDEX_TRANSPORT (перевізник), INDEX_ZAKAZCHIK (контакт)</p>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="xml-file-input">Файл XML</Label>
                  <Input
                    id="xml-file-input"
                    type="file"
                    accept=".xml,text/xml"
                    onChange={handleFileChange}
                    className="cursor-pointer mt-1"
                  />
                </div>
                
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border">
                    <FileText className="w-4 h-4" />
                    <span>
                      <strong>Обрано файл:</strong> {selectedFile.name} 
                      <span className="text-gray-500 ml-2">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Format Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Приклад XML структури
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-lg">
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<DATAPACKET>
  <ROWDATA>
    <ROW INDEX_PREDPR="7734" 
         INDEX_FIRMA="1" 
         INDEX_TRANSPORT="21" 
         NAME_ZAKAZ="52403" 
         DEL="F" 
         TERM="26.06.2025" 
         PAY="18.06.2025" 
         REALIZ="" 
         SCHET="РМ00-027501" 
         SUMMA="3045,60" 
         DATE_CREATE="18.06.2025" 
         COMMENT="" 
         DECLARATION="" 
         INDEX_ZAKAZCHIK="11537"/>
  </ROWDATA>
</DATAPACKET>`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Результати імпорту
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Success */}
                  {importResult.success > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">
                          Успішно імпортовано: {importResult.success} замовлень
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {importResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">
                          Попередження ({importResult.warnings.length})
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        {importResult.warnings.slice(0, 5).map((warning, index) => (
                          <div key={index} className="text-yellow-700">
                            Рядок {warning.row}: {warning.warning}
                          </div>
                        ))}
                        {importResult.warnings.length > 5 && (
                          <div className="text-yellow-600">
                            ... та ще {importResult.warnings.length - 5} попереджень
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-red-800 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">
                          Помилки ({importResult.errors.length})
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-red-700">
                            Рядок {error.row}: {error.error}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-red-600">
                            ... та ще {importResult.errors.length - 5} помилок
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetForm();
              }}
            >
              Закрити
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? "Імпортування..." : "Імпортувати"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}