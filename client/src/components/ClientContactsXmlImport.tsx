import { useState } from "react";
import { Upload, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message: string;
  }>;
  startTime: string;
  endTime?: string;
}

interface ImportResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

export function ClientContactsXmlImport() {
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
          variant: "destructive"
        });
      }
    }
  };

  const pollJobStatus = async (currentJobId: string) => {
    if (!currentJobId) return;

    try {
      const response = await apiRequest(`/api/import-jobs/${currentJobId}`);
      
      if (response) {
        setJob(response);
        setProgress(response.progress || 0);
        
        if (response.status === 'completed') {
          setIsImporting(false);
          toast({
            title: "Імпорт завершено",
            description: `Оброблено: ${response.processed}, Імпортовано: ${response.imported}, Пропущено: ${response.skipped}`,
          });
        } else if (response.status === 'failed') {
          setIsImporting(false);
          toast({
            title: "Помилка імпорту",
            description: "Імпорт завершився з помилкою",
            variant: "destructive",
          });
        } else if (response.status === 'processing') {
          // Continue polling with shorter interval for better UX
          setTimeout(() => pollJobStatus(currentJobId), 1000);
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

      const response: ImportResponse = await apiRequest('/api/client-contacts/import-xml', {
        method: 'POST',
        body: formData,
      });

      if (response.success && response.jobId) {
        setJobId(response.jobId);
        toast({
          title: "Імпорт розпочато",
          description: "Файл завантажено, обробка в процесі...",
        });
        
        // Start polling for status immediately
        setTimeout(() => pollJobStatus(response.jobId!), 500);
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
        title: "Помилка",
        description: "Не вдалося завантажити файл",
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-500" />;
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
          Імпорт контактів XML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Імпорт контактів клієнтів з XML</DialogTitle>
          <DialogDescription>
            Завантажте XML файл з контактними даними для імпорту в систему
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Виберіть XML файл</CardTitle>
                <CardDescription>
                  Файл повинен містити контактні дані у форматі DATAPACKET
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileChange}
                      className="hidden"
                      id="xml-upload"
                    />
                    <label htmlFor="xml-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Клікніть для вибору XML файлу або перетягніть сюди
                      </p>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        Обрано файл: {file.name}
                      </p>
                      <p className="text-xs text-green-600">
                        Розмір: {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleImport} 
                      disabled={!file || isImporting}
                      className="flex-1"
                    >
                      {isImporting ? "Імпорт..." : "Розпочати імпорт"}
                    </Button>
                    {file && (
                      <Button variant="outline" onClick={resetImport}>
                        Скинути
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress and Status */}
          {(isImporting || job) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Статус імпорту
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={progress} className="w-full" />
                  <div className="text-xs text-gray-600">
                    Прогрес: {progress}% {job && `(${job.processed}/${job.totalRows})`}
                  </div>
                  
                  {job && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Оброблено:</span>
                        <div>{job.processed} / {job.totalRows}</div>
                      </div>
                      <div>
                        <span className="font-medium">Імпортовано:</span>
                        <div className="text-green-600">{job.imported}</div>
                      </div>
                      <div>
                        <span className="font-medium">Пропущено:</span>
                        <div className="text-yellow-600">{job.skipped}</div>
                      </div>
                      <div>
                        <span className="font-medium">Помилки:</span>
                        <div className="text-red-600">{job.errors?.length || 0}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {job && job.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Деталі імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {job.details.map((detail, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        {getStatusIcon(detail.status)}
                        <span className="font-medium">{detail.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(detail.status)}
                        </Badge>
                        <span className="text-xs text-gray-600 flex-1">
                          {detail.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-4 pt-4 border-t">
                  <Button onClick={resetImport} className="w-full">
                    Новий імпорт
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {job && job.errors && job.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Помилки імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {job.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}