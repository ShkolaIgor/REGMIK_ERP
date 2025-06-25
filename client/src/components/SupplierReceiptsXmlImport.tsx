import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface XmlField {
  xmlPath: string;
  dbField: string;
  required: boolean;
  description: string;
}

interface ImportMapping {
  receiptFields: XmlField[];
  itemFields: XmlField[];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    receiptNumber: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
}

export function SupplierReceiptsXmlImport({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [mapping, setMapping] = useState<ImportMapping>({
    receiptFields: [
      { xmlPath: 'DATE_INP', dbField: 'receiptDate', required: true, description: 'Дата отримання товару (DATE_INP -> created_at)' },
      { xmlPath: 'INDEX_PREDPR', dbField: 'supplierId', required: true, description: 'ID постачальника (INDEX_PREDPR -> external_id lookup)' },
      { xmlPath: 'INDEX_DOC', dbField: 'documentTypeId', required: true, description: 'ID типу документу (INDEX_DOC)' },
      { xmlPath: 'DATE_POST', dbField: 'supplierDocumentDate', required: false, description: 'Дата документу постачальника (DATE_POST)' },
      { xmlPath: 'NUMB_DOC', dbField: 'supplierDocumentNumber', required: false, description: 'Номер документу постачальника (NUMB_DOC)' },
      { xmlPath: 'ACC_SUM', dbField: 'totalAmount', required: false, description: 'Загальна сума (ACC_SUM)' },
      { xmlPath: 'COMMENT', dbField: 'comment', required: false, description: 'Коментар (COMMENT)' },
      { xmlPath: 'ID_LISTPRIHOD', dbField: 'externalId', required: true, description: 'Зовнішній ID приходу (ID_LISTPRIHOD)' },
    ],
    itemFields: [
      { xmlPath: 'COMPONENT_ID', dbField: 'componentId', required: true, description: 'ID компонента' },
      { xmlPath: 'QUANTITY', dbField: 'quantity', required: true, description: 'Кількість' },
      { xmlPath: 'UNIT_PRICE', dbField: 'unitPrice', required: true, description: 'Ціна за одиницю' },
      { xmlPath: 'TOTAL_PRICE', dbField: 'totalPrice', required: true, description: 'Загальна ціна за позицію' },
    ]
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Queries
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: components = [] } = useQuery({
    queryKey: ["/api/components"],
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ["/api/supplier-document-types"],
  });

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlContent(content);
      };
      reader.readAsText(file);
    }
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      setIsImporting(true);
      
      try {
        // Parse XML content
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for XML parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Помилка парсингу XML файлу');
        }

        // Extract receipts data from ROW elements
        const receipts = Array.from(xmlDoc.querySelectorAll('ROW')).map(receiptNode => {
          const receiptData: any = {};
          
          // Map receipt fields from XML attributes
          mapping.receiptFields.forEach(field => {
            let value = receiptNode.getAttribute(field.xmlPath) || '';
            
            if (value || !field.required) {
              // Special handling for supplier ID lookup
              if (field.dbField === 'supplierId' && field.xmlPath === 'INDEX_PREDPR') {
                // Will be resolved on backend by external_id lookup
                receiptData['supplierExternalId'] = value ? parseInt(value) : null;
              } else if (field.dbField === 'documentTypeId' || field.dbField === 'externalId') {
                receiptData[field.dbField] = value ? parseInt(value) : null;
              } else if (field.dbField === 'totalAmount') {
                // Handle Ukrainian decimal format (comma as decimal separator)
                const normalizedValue = value.replace(',', '.');
                receiptData[field.dbField] = parseFloat(normalizedValue) || 0;
              } else if (field.dbField === 'receiptDate' || field.dbField === 'supplierDocumentDate') {
                // Convert DD.MM.YYYY to YYYY-MM-DD format
                if (value && value.includes('.')) {
                  const [day, month, year] = value.split('.');
                  receiptData[field.dbField] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } else {
                  receiptData[field.dbField] = value || null;
                }
              } else {
                receiptData[field.dbField] = value || null;
              }
            } else if (field.required) {
              throw new Error(`Обов'язкове поле ${field.xmlPath} не знайдено`);
            }
          });

          // Extract items
          const items = Array.from(receiptNode.querySelectorAll('ITEM')).map(itemNode => {
            const itemData: any = {};
            
            mapping.itemFields.forEach(field => {
              const element = itemNode.querySelector(field.xmlPath);
              if (element) {
                let value = element.textContent?.trim() || '';
                
                // Type conversion
                if (field.dbField === 'componentId') {
                  itemData[field.dbField] = parseInt(value);
                } else if (field.dbField === 'quantity' || field.dbField === 'unitPrice' || field.dbField === 'totalPrice') {
                  itemData[field.dbField] = parseFloat(value);
                } else {
                  itemData[field.dbField] = value;
                }
              } else if (field.required) {
                throw new Error(`Обов'язкове поле ${field.xmlPath} не знайдено в позиції`);
              }
            });
            
            return itemData;
          });

          return { ...receiptData, items };
        });

        // Send data to backend
        const results = [];
        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const receiptData of receipts) {
          try {
            const response = await apiRequest('/api/supplier-receipts', {
              method: 'POST',
              body: JSON.stringify(receiptData),
            });
            
            results.push({
              receiptNumber: receiptData.supplierDocumentNumber || `ID_${receiptData.supplierId}`,
              status: 'imported' as const,
              message: 'Прихід створено успішно'
            });
            imported++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
            results.push({
              receiptNumber: receiptData.supplierDocumentNumber || `ID_${receiptData.supplierId}`,
              status: 'error' as const,
              message: errorMessage
            });
            errors.push(`Прихід ${receiptData.supplierDocumentNumber}: ${errorMessage}`);
          }
        }

        const result: ImportResult = {
          success: imported > 0,
          message: `Імпорт завершено. Створено: ${imported}, пропущено: ${skipped}`,
          imported,
          skipped,
          errors,
          details: results
        };

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
        return {
          success: false,
          message: `Помилка імпорту: ${errorMessage}`,
          imported: 0,
          skipped: 0,
          errors: [errorMessage],
          details: []
        };
      } finally {
        setIsImporting(false);
      }
    },
    onSuccess: (result) => {
      setImportResult(result);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/supplier-receipts"] });
        toast({ title: "Імпорт завершено успішно" });
      } else {
        toast({ 
          title: "Помилка імпорту", 
          description: result.message,
          variant: "destructive" 
        });
      }
    },
    onError: (error) => {
      toast({ 
        title: "Помилка імпорту", 
        description: error.message,
        variant: "destructive" 
      });
      setIsImporting(false);
    },
  });

  const updateMapping = (section: 'receiptFields' | 'itemFields', index: number, field: 'xmlPath', value: string) => {
    setMapping(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'imported':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const downloadTemplate = () => {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<DOCUMENT>
  <ROW DATE_INP="15.01.2024" DATE_POST="14.01.2024" COMMENT="Прихід товару за накладною" INDEX_PREDPR="338" INDEX_DOC="2" ID_LISTPRIHOD="1" NUMB_DOC="7025" ACC_SUM="1500,00"/>
  <ROW DATE_INP="16.01.2024" DATE_POST="15.01.2024" COMMENT="Другий прихід" INDEX_PREDPR="339" INDEX_DOC="1" ID_LISTPRIHOD="2" NUMB_DOC="7026" ACC_SUM="2500,50"/>
</DOCUMENT>`;

    const blob = new Blob([template], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_receipts_template.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* File upload */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label>XML файл для імпорту</Label>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Шаблон XML
          </Button>
        </div>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">
            {selectedFile ? selectedFile.name : 'Клікніть для вибору XML файлу'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Підтримуються файли формату XML
          </p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Field mapping */}
      {selectedFile && (
        <div className="space-y-6">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Налаштуйте відповідність полів XML файлу з полями бази даних. 
              Поля позначені * є обов'язковими.
            </AlertDescription>
          </Alert>

          {/* Receipt fields mapping */}
          <div>
            <h3 className="text-lg font-medium mb-4">Поля приходу</h3>
            <div className="space-y-3">
              {mapping.receiptFields.map((field, index) => (
                <div key={field.dbField} className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm">
                      {field.description} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                  </div>
                  <div>
                    <Input
                      value={field.xmlPath}
                      onChange={(e) => updateMapping('receiptFields', index, 'xmlPath', e.target.value)}
                      placeholder="XML шлях"
                    />
                  </div>
                  <div>
                    <Badge variant={field.required ? "destructive" : "secondary"}>
                      {field.required ? "Обов'язкове" : "Опціональне"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item fields mapping */}
          <div>
            <h3 className="text-lg font-medium mb-4">Поля позицій</h3>
            <div className="space-y-3">
              {mapping.itemFields.map((field, index) => (
                <div key={field.dbField} className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label className="text-sm">
                      {field.description} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                  </div>
                  <div>
                    <Input
                      value={field.xmlPath}
                      onChange={(e) => updateMapping('itemFields', index, 'xmlPath', e.target.value)}
                      placeholder="XML шлях"
                    />
                  </div>
                  <div>
                    <Badge variant={field.required ? "destructive" : "secondary"}>
                      {field.required ? "Обов'язкове" : "Опціональне"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import button */}
          <div className="flex justify-end">
            <Button 
              onClick={() => importMutation.mutate()}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Імпорт...' : 'Почати імпорт'}
            </Button>
          </div>
        </div>
      )}

      {/* Import progress */}
      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Імпорт приходів...</span>
          </div>
          <Progress value={50} className="w-full" />
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div className="space-y-4">
          <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
              {importResult.message}
            </AlertDescription>
          </Alert>

          {/* Detailed results */}
          {importResult.details.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Детальні результати:</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importResult.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {getStatusIcon(detail.status)}
                    <span className="font-medium">{detail.receiptNumber}</span>
                    <span className="text-gray-600">{detail.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-red-600">Помилки:</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Закрити
        </Button>
        {importResult?.success && (
          <Button onClick={onClose}>
            Готово
          </Button>
        )}
      </div>
    </div>
  );
}