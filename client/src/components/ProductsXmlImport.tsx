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
import { ImportWizard } from "@/components/ImportWizard";

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
    productName: string;
    productSku: string;
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

export function ProductsXmlImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
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
      const response = await apiRequest(`/api/products/import-xml/${currentJobId}/status`);
      
      if (response && response.success) {
        const jobData = response.job;
        setJob(jobData);
        setProgress(jobData.progress || 0);

        if (jobData.status === 'processing') {
          setTimeout(() => pollJobStatus(currentJobId), 1000);
        } else if (jobData.status === 'completed') {
          setIsImporting(false);
          toast({
            title: "Імпорт завершено",
            description: `Оброблено: ${jobData.processed}, Імпортовано: ${jobData.imported}, Пропущено: ${jobData.skipped}`,
          });
        } else if (jobData.status === 'failed') {
          setIsImporting(false);
          toast({
            title: "Помилка імпорту",
            description: jobData.errors?.[0] || "Невідома помилка",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      setIsImporting(false);
      toast({
        title: "Помилка",
        description: "Помилка перевірки статусу імпорту",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть XML файл",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setJob(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import-xml', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResponse = await response.json();
      
      if (result.success && result.jobId) {
        setJobId(result.jobId);
        setTimeout(() => pollJobStatus(result.jobId!), 1000);
      } else {
        setIsImporting(false);
        toast({
          title: "Помилка імпорту",
          description: result.error || result.message || "Невідома помилка",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        title: "Помилка імпорту",
        description: "Помилка завантаження файлу",
        variant: "destructive"
      });
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const resetImport = () => {
    setFile(null);
    setIsImporting(false);
    setProgress(0);
    setJob(null);
    setJobId(null);
    const fileInput = document.getElementById('products-xml-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <>
      {showWizard && (
        <ImportWizard
          importType="products"
          onProceedToImport={() => {
            setShowWizard(false);
            setIsOpen(true);
          }}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowWizard(true)}
          >
            <Upload className="h-4 w-4" />
            Імпорт товарів
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Імпорт товарів з XML</DialogTitle>
            <DialogDescription>
              Імпортуйте товари з XML файлу з полями ID_LISTARTICLE, NAME_ARTICLE, CENA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!job && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Завантажити XML файл</CardTitle>
                  <CardDescription>
                    Оберіть XML файл з товарами для імпорту
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <input
                      id="products-xml-upload"
                      type="file"
                      accept=".xml"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {file && (
                    <div className="p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-700">
                        Файл обрано: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleImport} 
                      disabled={!file || isImporting}
                      className="flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Імпортування...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Почати імпорт
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetImport}>
                      Очистити
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(isImporting || job) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {job?.status === 'processing' && <Clock className="h-5 w-5 animate-spin text-blue-500" />}
                        {job?.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {job?.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        Стан імпорту
                      </CardTitle>
                      <CardDescription>
                        {job ? `Початок: ${new Date(job.startTime).toLocaleString()}` : 'Ініціалізація...'}
                      </CardDescription>
                    </div>
                    {job?.status && (
                      <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'}>
                        {job.status === 'processing' ? 'Обробляється' : 
                         job.status === 'completed' ? 'Завершено' : 
                         job.status === 'failed' ? 'Помилка' : job.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прогрес імпорту</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>

                  {job && (
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{job.totalRows}</div>
                        <div className="text-xs text-blue-500">Всього</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{job.imported}</div>
                        <div className="text-xs text-green-500">Імпортовано</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{job.skipped}</div>
                        <div className="text-xs text-yellow-500">Пропущено</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{job.errors?.length || 0}</div>
                        <div className="text-xs text-red-500">Помилки</div>
                      </div>
                    </div>
                  )}

                  {job?.details && job.details.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Деталі імпорту</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {job.details.map((detail, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{detail.productName}</div>
                                  <div className="text-xs text-gray-500">{detail.productSku}</div>
                                  {detail.message && (
                                    <div className="text-xs text-gray-600 mt-1">{detail.message}</div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  {getStatusBadge(detail.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {job?.errors && job.errors.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-base text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Помилки імпорту
                        </CardTitle>
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

                  {job?.status === 'completed' && (
                    <div className="flex gap-2">
                      <Button onClick={resetImport}>
                        Новий імпорт
                      </Button>
                      <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Закрити
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}