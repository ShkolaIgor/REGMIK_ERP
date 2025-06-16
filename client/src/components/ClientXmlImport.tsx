import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message?: string;
  }>;
  totalRows: number;
}

interface ImportResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

export function ClientXmlImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/xml' || selectedFile.name.endsWith('.xml')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast({
          title: "Помилка файлу",
          description: "Будь ласка, оберіть XML файл",
          variant: "destructive",
        });
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Файл не обрано",
        description: "Будь ласка, оберіть XML файл для імпорту",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);

      // Симуляція прогресу
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiRequest('/api/clients/import-xml', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResult(response);
      
      // Оновлюємо список клієнтів
      await queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      
      if (response.success) {
        toast({
          title: "Імпорт успішний",
          description: `Імпортовано ${response.imported} клієнтів, пропущено ${response.skipped}`,
        });
      } else {
        toast({
          title: "Імпорт завершений з помилками",
          description: `Обробано ${response.processed} записів`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Помилка імпорту",
        description: "Не вдалося імпортувати дані з XML файлу",
        variant: "destructive",
      });
      setResult(null);
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setIsImporting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'imported':
      case 'updated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'imported':
        return 'Імпортовано';
      case 'updated':
        return 'Оновлено';
      case 'skipped':
        return 'Пропущено';
      case 'error':
        return 'Помилка';
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Імпорт XML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Імпорт клієнтів з XML</DialogTitle>
          <DialogDescription>
            Завантажте XML файл з даними клієнтів для імпорту в систему
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Виберіть XML файл</CardTitle>
                <CardDescription>
                  Файл повинен містити дані клієнтів у форматі DATAPACKET
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="xmlFile">XML файл</Label>
                    <Input
                      id="xmlFile"
                      type="file"
                      accept=".xml,text/xml"
                      onChange={handleFileChange}
                      disabled={isImporting}
                    />
                  </div>
                  
                  {file && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        Обрано файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </AlertDescription>
                    </Alert>
                  )}

                  {isImporting && (
                    <div className="space-y-2">
                      <Label>Прогрес імпорту</Label>
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-gray-500">Обробка даних...</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!file || isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>Імпорт...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Почати імпорт
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetImport} disabled={isImporting}>
                  Скасувати
                </Button>
              </CardFooter>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Результат імпорту
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                      <div className="text-sm text-gray-500">Імпортовано</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                      <div className="text-sm text-gray-500">Пропущено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{result.processed}</div>
                      <div className="text-sm text-gray-500">Всього оброблено</div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold">Помилки під час імпорту:</div>
                        <ul className="mt-2 list-disc list-inside">
                          {result.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.details.length > 0 && (
                    <div className="space-y-2">
                      <Label>Детальний звіт</Label>
                      <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                        {result.details.map((detail, index) => (
                          <div key={index} className="flex items-center gap-2 py-1">
                            {getStatusIcon(detail.status)}
                            <span className="font-medium">{detail.name}</span>
                            <span className="text-sm text-gray-500">- {getStatusText(detail.status)}</span>
                            {detail.message && (
                              <span className="text-xs text-gray-400">({detail.message})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={resetImport} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Імпортувати інший файл
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}