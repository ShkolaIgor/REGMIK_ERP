import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

interface SupplierReceiptItemsImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function SupplierReceiptItemsImport({ open, onOpenChange, onImportComplete }: SupplierReceiptItemsImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.xml')) {
      setFile(selectedFile);
      setResult(null);
    } else {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть XML файл",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const xmlContent = await file.text();
      setProgress(50);

      const response = await apiRequest('/api/import/supplier-receipt-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { xmlContent }
      });

      setProgress(100);
      setResult(response);
      
      toast({
        title: "Імпорт завершено",
        description: `Імпортовано ${response.imported} позицій з ${response.total} записів`
      });

      onImportComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Помилка імпорту",
        description: error.message || "Сталася помилка під час імпорту",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Імпорт позицій приходу з XML
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Оберіть XML файл з позиціями приходу</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Обрано файл: {file.name}
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Label>Прогрес імпорту</Label>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <Alert className={result.errors?.length > 0 ? "border-yellow-200" : "border-green-200"}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>Імпорт завершено успішно!</p>
                  <p>Всього записів: {result.total}</p>
                  <p>Імпортовано: {result.imported}</p>
                  {result.errors?.length > 0 && (
                    <p className="text-yellow-600">Помилок: {result.errors.length}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {result?.errors?.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>Помилки під час імпорту:</p>
                  {result.errors.slice(0, 5).map((error: string, index: number) => (
                    <p key={index} className="text-sm">• {error}</p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-sm">... та ще {result.errors.length - 5} помилок</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result ? 'Закрити' : 'Скасувати'}
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!file || isUploading}
            >
              {isUploading ? 'Імпорт...' : 'Імпортувати'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}