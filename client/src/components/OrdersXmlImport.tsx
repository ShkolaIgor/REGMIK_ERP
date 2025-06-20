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
    orderNumber: string;
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

export function OrdersXmlImport() {
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
      const response = await apiRequest(`/api/orders/import-xml/${currentJobId}/status`);
      
      if (response && response.success) {
        const jobData = response.job;
        setJob(jobData);
        setProgress(jobData.progress || 0);
        
        if (jobData.status === 'completed') {
          setIsImporting(false);
          toast({
            title: "Імпорт завершено",
            description: `Оброблено: ${jobData.processed}, Імпортовано: ${jobData.imported}, Пропущено: ${jobData.skipped}`,
          });
        } else if (jobData.status === 'failed') {
          setIsImporting(false);
          toast({
            title: "Помилка імпорту",
            description: "Імпорт завершився з помилкою",
            variant: "destructive",
          });
        } else if (jobData.status === 'processing') {
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
        title: "Помилка",
        description: "Будь ласка, оберіть XML файл для імпорту",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "Файл занадто великий",
        description: `Максимальний розмір файлу: 100MB. Ваш файл: ${Math.round(file.size / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setJob(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);

      const response = await fetch('/api/orders/import-xml', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResponse = await response.json();

      if (result.success && result.jobId) {
        setJobId(result.jobId);
        toast({
          title: "Імпорт розпочато",
          description: "Ваш файл обробляється. Статус оновлюється автоматично.",
        });
        pollJobStatus(result.jobId);
      } else {
        throw new Error(result.error || 'Невідома помилка');
      }
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Не вдалося розпочати імпорт",
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
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'imported':
        return <Badge className="bg-green-100 text-green-800">Імпортовано</Badge>;
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-800">Оновлено</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-100 text-yellow-800">Пропущено</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Помилка</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Імпорт XML
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Імпорт замовлень з XML</DialogTitle>
          <DialogDescription>
            Завантажте XML файл з замовленнями для імпорту в систему
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Виберіть XML файл</CardTitle>
                <CardDescription>
                  Файл повинен містити замовлення у форматі DATAPACKET
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

                  {job?.status && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">
                        Статус: {job.status === 'processing' ? 'Обробка' : 
                                 job.status === 'completed' ? 'Завершено' : 
                                 job.status === 'failed' ? 'Помилка' : job.status}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results */}
          {job && job.details && job.details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Деталі імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {job.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{detail.orderNumber}</div>
                          {detail.message && (
                            <div className="text-xs text-gray-600">{detail.message}</div>
                          )}
                        </div>
                        <div>{getStatusBadge(detail.status)}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Error Messages */}
          {job && job.errors && job.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Помилки</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {job.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {job && job.status !== 'processing' && (
            <div className="flex gap-2">
              <Button onClick={resetImport} variant="outline" className="flex-1">
                Новий імпорт
              </Button>
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Закрити
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrdersXmlImport;