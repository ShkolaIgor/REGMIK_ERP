import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Download, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ImportMapping {
  receiptFields: {
    xmlPath: string;
    dbField: string;
    required: boolean;
    description: string;
  }[];
  itemFields: {
    xmlPath: string;
    dbField: string;
    required: boolean;
    description: string;
  }[];
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
  details: {
    receiptNumber: string;
    status: 'imported' | 'error' | 'skipped';
    message: string;
  }[];
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
      { xmlPath: 'INDEX_PREDPR', dbField: 'supplierId', required: true, description: 'external_id постачальника (INDEX_PREDPR -> знаходить suppliers.external_id)' },
      { xmlPath: 'INDEX_DOC', dbField: 'documentTypeId', required: true, description: 'ID типу документу (INDEX_DOC)' },
      { xmlPath: 'DATE_POST', dbField: 'supplierDocumentDate', required: false, description: 'Дата документу постачальника (DATE_POST)' },
      { xmlPath: 'NUMB_DOC', dbField: 'supplierDocumentNumber', required: false, description: 'Номер документу постачальника (NUMB_DOC)' },
      { xmlPath: 'ACC_SUM', dbField: 'totalAmount', required: false, description: 'Загальна сума (ACC_SUM)' },
      { xmlPath: 'COMMENT', dbField: 'comment', required: false, description: 'Коментар (COMMENT)' },
      { xmlPath: 'ID_LISTPRIHOD', dbField: 'externalId', required: false, description: 'Зовнішній ID запису (ID_LISTPRIHOD -> external_id)' }
    ],
    itemFields: [
      { xmlPath: 'INDEX_DETAIL', dbField: 'componentId', required: true, description: 'ID компоненту (INDEX_DETAIL)' },
      { xmlPath: 'KOL', dbField: 'quantity', required: true, description: 'Кількість (KOL)' },
      { xmlPath: 'PRICE', dbField: 'unitPrice', required: false, description: 'Ціна за одиницю (PRICE)' },
      { xmlPath: 'SUMMA', dbField: 'totalPrice', required: false, description: 'Загальна сума (SUMMA)' },
      { xmlPath: 'NAIM', dbField: 'supplierComponentName', required: false, description: 'Назва компоненту у постачальника (NAIM)' }
    ]
  });
  
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    errors: 0
  });
  const [currentItem, setCurrentItem] = useState<string>('');
  const [documentTypeId, setDocumentTypeId] = useState<string>('');

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

  const handleImport = async () => {
    if (!xmlContent.trim()) {
      toast({
        title: "Помилка",
        description: "Будь ласка, завантажте XML файл",
        variant: "destructive",
      });
      return;
    }

    if (!documentTypeId) {
      toast({
        title: "Помилка", 
        description: "Будь ласка, оберіть тип документа",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setProgress(0);
    setImportStats({ total: 0, processed: 0, successful: 0, errors: 0 });
    setCurrentItem('');

    try {
      const response = await fetch('/api/import/supplier-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ xmlContent, documentTypeId }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'start') {
                setCurrentItem(data.message || 'Початок імпорту...');
              } else if (data.type === 'progress') {
                setImportStats(prev => ({
                  ...prev,
                  total: data.total,
                  processed: data.processed
                }));
                setCurrentItem(data.currentItem || '');
                setProgress((data.processed / data.total) * 100);
              } else if (data.type === 'complete') {
                setImportStats({
                  total: data.total,
                  processed: data.processed,
                  successful: data.successful,
                  errors: data.errors
                });
                setProgress(100);
                setIsImporting(false);
                setImportResult({
                  success: data.success,
                  message: data.message,
                  imported: data.imported,
                  skipped: 0,
                  errors: data.errorDetails || [],
                  details: []
                });
                setCurrentItem('');
                
                queryClient.invalidateQueries({ queryKey: ['/api/supplier-receipts'] });
                
                if (data.success) {
                  toast({ title: "Імпорт завершено успішно" });
                }
              } else if (data.type === 'error') {
                setIsImporting(false);
                setImportResult({
                  success: false,
                  message: data.message,
                  imported: 0,
                  skipped: 0,
                  errors: [data.error],
                  details: []
                });
                toast({ 
                  title: "Помилка імпорту", 
                  description: data.message,
                  variant: "destructive" 
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      setIsImporting(false);
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка';
      setImportResult({
        success: false,
        message: `Помилка імпорту: ${errorMessage}`,
        imported: 0,
        skipped: 0,
        errors: [errorMessage],
        details: []
      });
      toast({ 
        title: "Помилка імпорту", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  };

  const downloadTemplate = () => {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<DOCUMENT>
  <ROW DATE_INP="15.01.2024" DATE_POST="14.01.2024" COMMENT="Прихід товару за накладною" INDEX_PREDPR="1" INDEX_DOC="2" ID_LISTPRIHOD="1" NUMB_DOC="7025" ACC_SUM="1500,00"/>
  <ROW DATE_INP="16.01.2024" DATE_POST="15.01.2024" COMMENT="Другий прихід" INDEX_PREDPR="6" INDEX_DOC="1" ID_LISTPRIHOD="2" NUMB_DOC="7026" ACC_SUM="2500,50"/>
  <ROW DATE_INP="17.01.2024" DATE_POST="16.01.2024" COMMENT="Третій прихід" INDEX_PREDPR="10801" INDEX_DOC="2" ID_LISTPRIHOD="3" NUMB_DOC="7027" ACC_SUM="3000,75"/>
  <ROW DATE_INP="18.01.2024" DATE_POST="17.01.2024" COMMENT="Четвертий прихід" INDEX_PREDPR="874" INDEX_DOC="1" ID_LISTPRIHOD="4" NUMB_DOC="7028" ACC_SUM="4500,25"/>
  <!-- INDEX_PREDPR має відповідати полю external_id в таблиці suppliers -->
  <!-- Доступні external_id: 1 (Радіокомплект), 6 (VD MAIS), 874 (Постачальник 874), 10801 (Корякіна Наталія), 10808 (Єрохіна Олена) -->
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

          {/* Document type selection */}
          <div>
            <Label>Тип документу *</Label>
            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть тип документа" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || !documentTypeId || isImporting}
            >
              {isImporting ? 'Імпорт...' : 'Почати імпорт'}
            </Button>
          </div>
        </div>
      )}

      {/* Import progress */}
      {isImporting && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Прогрес імпорту</span>
              <span>{importStats.processed} / {importStats.total}</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentItem && (
              <div className="text-sm text-gray-600 mt-2">
                Обробляється: {currentItem}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{importStats.processed}</div>
              <div className="text-gray-600">Оброблено</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{importStats.successful}</div>
              <div className="text-gray-600">Успішно</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{importStats.errors}</div>
              <div className="text-gray-600">Помилки</div>
            </div>
          </div>
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