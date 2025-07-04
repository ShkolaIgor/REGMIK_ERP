import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Upload, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { ImportWizard } from '@/components/ImportWizard';

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: Array<{
    orderNumber: string;
    productSku: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message: string;
  }>;
  logs: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    details?: string;
  }>;
  totalRows: number;
}

interface ImportResponse {
  success: boolean;
  jobId?: string;
  message?: string;
  error?: string;
}

interface OrderItemsXmlImportProps {
  orderId?: number;
  onImportComplete?: () => void;
}

export function OrderItemsXmlImport({ orderId, onImportComplete }: OrderItemsXmlImportProps) {
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
      const response = await fetch(`/api/order-items/import-xml/${currentJobId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const jobData = result.job;
      
      if (jobData) {
        setJob(jobData);
        
        let currentProgress = 0;
        if (jobData.status === 'completed') {
          currentProgress = 100;
        } else if (jobData.totalRows > 0 && jobData.processed >= 0) {
          currentProgress = Math.round((jobData.processed / jobData.totalRows) * 100);
        } else {
          currentProgress = jobData.progress || 0;
        }
        setProgress(currentProgress);
        
        if (jobData.status === 'completed') {
          setIsImporting(false);
          toast({
            title: "Імпорт позицій завершено",
            description: `Оброблено: ${jobData.processed || 0}, Імпортовано: ${jobData.imported || 0}, Пропущено: ${jobData.skipped || 0}`,
          });
          if (onImportComplete) {
            onImportComplete();
          }
        } else if (jobData.status === 'failed') {
          setIsImporting(false);
          toast({
            title: "Помилка імпорту позицій",
            description: jobData.errors?.[0] || "Імпорт завершився з помилкою",
            variant: "destructive",
          });
        } else if (jobData.status === 'processing') {
          setTimeout(() => pollJobStatus(currentJobId), 1000);
        }
      } else {
        setTimeout(() => pollJobStatus(currentJobId), 2000);
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

    setIsImporting(true);
    setJob(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);
      if (orderId) {
        formData.append('orderId', orderId.toString());
      }

      const response = await fetch('/api/order-items/import-xml', {
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
        description: error instanceof Error ? error.message : "Сталася помилка під час імпорту",
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
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full";
    switch (status) {
      case 'imported':
        return ;
      //  return <span className={`${baseClasses} bg-green-100 text-green-800`}>Імпортовано</span>;
      case 'updated':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Оновлено</span>;
      case 'skipped':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Пропущено</span>;
      case 'error':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Помилка</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Невідомо</span>;
    }
  };

  return (
    <>
      <ImportWizard 
        importType="order-items"
        onProceedToImport={() => setIsOpen(true)}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Імпорт позицій замовлень з XML</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload */}
          {!job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Оберіть XML файл</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    disabled={isImporting}
                  />
                  {file && (
                    <div className="text-sm text-gray-600">
                      Обрано файл: {file.name} ({Math.round(file.size / 1024)} KB)
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
                    Прогрес: {Math.round(progress)}% {job && job.totalRows > 0 && `(${job.processed || 0}/${job.totalRows})`}
                  </div>
                  
                  {job && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Оброблено:</span>
                        <div>{job.processed || 0} {job.totalRows > 0 && `/ ${job.totalRows}`}</div>
                      </div>
                      <div>
                        <span className="font-medium">Імпортовано:</span>
                        <div className="text-green-600">{job.imported || 0}</div>
                      </div>
                      <div>
                        <span className="font-medium">Пропущено:</span>
                        <div className="text-yellow-600">{job.skipped || 0}</div>
                      </div>
                      <div>
                        <span className="font-medium">Помилки:</span>
                        <div className="text-red-600">{job.errors?.length || 0}</div>
                      </div>
                    </div>
                  )}

                  {job && (
                    <div className="flex items-center gap-2 text-sm">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">
                        Статус: {job.status === 'processing' ? 'Обробка' : 
                                 job.status === 'completed' ? 'Завершено' : 
                                 job.status === 'failed' ? 'Помилка' : job.status || 'Невідомо'}
                      </span>
                    </div>
                  )}
                  
                  {jobId && !job && (
                    <div className="text-sm text-gray-500">
                      Job ID: {jobId} (завантаження статусу...)
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Details - Only Errors and Warnings */}
          {job?.logs && job.logs.filter(log => log.type === 'error' || log.type === 'warning').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Помилки та попередження
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {job.logs
                    .filter(log => log.type === 'error' || log.type === 'warning')
                    .map((log, index) => (
                    <div key={index} className={`text-xs p-2 rounded border-l-2 ${
                      log.type === 'error' 
                        ? 'bg-red-50 border-l-red-400 text-red-700' 
                        : 'bg-yellow-50 border-l-yellow-400 text-yellow-700'
                    }`}>
                      <div className="font-medium flex items-center gap-1">
                        {log.type === 'error' ? '❌' : '⚠️'} {log.message}
                      </div>
                      {log.details && (
                        <div className="mt-1 opacity-80">{log.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Results 
          {job?.details && job.details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Деталі імпорту</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {job.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            Замовлення: {detail.orderNumber}, Товар: {detail.productSku}
                          </div>
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
*/}
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
    </>
  );
}