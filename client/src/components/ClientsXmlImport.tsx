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
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message: string;
    id_predpr?: string;
  }>;
  startTime: string;
  endTime?: string;
}

interface ImportResponse {
  jobId: string;
  message?: string;
  error?: string;
}

export function ClientsXmlImport() {
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

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('xmlFile', file);

      const response = await apiRequest('/api/clients/import-xml', {
        method: 'POST',
        body: formData,
      }) as ImportResponse;

      if (response.error) {
        throw new Error(response.error);
      }

      setJobId(response.jobId);
      
      // Poll for job status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await apiRequest(`/api/clients/import-xml/${response.jobId}/status`) as ImportJob;
          setJob(statusResponse);
          setProgress(statusResponse.progress);

          if (statusResponse.status === 'completed' || statusResponse.status === 'failed') {
            clearInterval(interval);
            setIsImporting(false);
            
            if (statusResponse.status === 'completed') {
              toast({
                title: "Імпорт завершено",
                description: `Імпортовано ${statusResponse.imported} клієнтів, пропущено ${statusResponse.skipped}`,
              });
            } else {
              toast({
                title: "Помилка імпорту",
                description: "Імпорт не вдався",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Error checking import status:', error);
          clearInterval(interval);
          setIsImporting(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Import error:', error);
      setIsImporting(false);
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Невідома помилка",
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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'skipped':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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
    <>
      <ImportWizard 
        importType="clients"
        onProceedToImport={() => setIsOpen(true)}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Імпорт клієнтів
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Імпорт клієнтів з XML</DialogTitle>
            <DialogDescription>
              Завантажте XML файл з клієнтами для імпорту в систему
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!job && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Виберіть XML файл</CardTitle>
                  <CardDescription>
                    Файл повинен містити клієнтів у форматі DATAPACKET
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={isImporting}
                    />
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
                    <div className="flex justify-between text-sm">
                      <span>Прогрес: {progress}%</span>
                      {job && (
                        <span>{job.processed} з {job.totalRows}</span>
                      )}
                    </div>
                    
                    {job && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{job.imported}</div>
                          <div className="text-gray-500">Імпортовано</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">{job.skipped}</div>
                          <div className="text-gray-500">Пропущено</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{job.errors?.length || 0}</div>
                          <div className="text-gray-500">Помилки</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Details */}
            {job && job.details && job.details.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Деталі імпорту</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {job.details.filter(detail => detail.status === 'error').map((detail, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(detail.status)}
                            <span className="text-sm font-medium">{detail.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(detail.status)}
                          </div>
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
    </>
  );
}

export default ClientsXmlImport;