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
        setJob(null);
        setJobId(null);
        setProgress(0);
      } else {
        toast({
          title: "Помилка файлу",
          description: "Будь ласка, оберіть XML файл",
          variant: "destructive",
        });
      }
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await apiRequest(`/api/clients/import-xml/${jobId}/status`);
      if (response.success && response.job) {
        setJob(response.job);
        setProgress(response.job.progress);
        
        if (response.job.status === 'completed') {
          setIsImporting(false);
          // Оновлюємо список клієнтів
          await queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
          
          toast({
            title: "Імпорт завершено",
            description: `Імпортовано ${response.job.imported} клієнтів, пропущено ${response.job.skipped} з ${response.job.totalRows}`,
          });
        } else if (response.job.status === 'failed') {
          setIsImporting(false);
          toast({
            title: "Помилка імпорту",
            description: "Імпорт завершився з помилкою",
            variant: "destructive",
          });
        } else if (response.job.status === 'processing') {
          // Continue polling
          setTimeout(() => pollJobStatus(jobId), 1000);
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      setIsImporting(false);
      toast({
        title: "Помилка перевірки статусу",
        description: "Не вдалося отримати статус імпорту",
        variant: "destructive",
      });
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
    setJob(null);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);

      const response: ImportResponse = await apiRequest('/api/clients/import-xml', {
        method: 'POST',
        body: formData,
      });

      if (response.success && response.jobId) {
        setJobId(response.jobId);
        toast({
          title: "Імпорт розпочато",
          description: "Файл завантажено, обробка в процесі...",
        });
        
        // Start polling for status
        setTimeout(() => pollJobStatus(response.jobId!), 1000);
      } else {
        setIsImporting(false);
        toast({
          title: "Помилка запуску імпорту",
          description: response.error || "Не вдалося розпочати імпорт",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        title: "Помилка імпорту",
        description: "Не вдалося розпочати імпорт XML файлу",
        variant: "destructive",
      });
    }
  };

  const resetImport = () => {
    setFile(null);
    setJob(null);
    setJobId(null);
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
          {!job && (
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
                      <div className="text-sm text-gray-500">
                        {job ? (
                          <div className="space-y-1">
                            <div>Обробка даних... {progress}%</div>
                            {job.totalRows > 0 && (
                              <div>Оброблено {job.processed} з {job.totalRows} записів</div>
                            )}
                            {job.imported > 0 && (
                              <div>Імпортовано: {job.imported}, Пропущено: {job.skipped}</div>
                            )}
                          </div>
                        ) : (
                          <div>Завантаження файлу...</div>
                        )}
                      </div>
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

          {job && job.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {job.errors.length === 0 ? (
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
                      <div className="text-2xl font-bold text-green-600">{job.imported}</div>
                      <div className="text-sm text-gray-500">Імпортовано</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{job.skipped}</div>
                      <div className="text-sm text-gray-500">Пропущено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{job.processed}</div>
                      <div className="text-sm text-gray-500">Всього оброблено</div>
                    </div>
                  </div>

                  {job.errors.length > 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold">Помилки під час імпорту:</div>
                        <ul className="mt-2 list-disc list-inside">
                          {job.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {job.details.length > 0 && (
                    <div className="space-y-2">
                      <Label>Детальний звіт</Label>
                      <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                        {job.details.map((detail, index) => (
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

          {job && job.status === 'failed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Помилка імпорту
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">Імпорт завершився з помилкою</div>
                    {job.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside">
                        {job.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button onClick={resetImport} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Спробувати знову
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}