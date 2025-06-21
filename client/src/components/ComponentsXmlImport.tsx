import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportJobStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  processed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  details: Array<{
    sku: string;
    name: string;
    status: 'imported' | 'updated' | 'skipped' | 'error';
    message: string;
  }>;
  totalRows: number;
}

export function ComponentsXmlImport() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
  const [polling, setPolling] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xmlFile', file);
      
      return apiRequest('/api/components/import-xml', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      setJobId(data.jobId);
      startPolling(data.jobId);
      toast({
        title: "Імпорт розпочато",
        description: "Процес імпорту компонентів запущено",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Помилка завантаження",
        description: error instanceof Error ? error.message : "Невідома помилка",
        variant: "destructive",
      });
    },
  });

  const startPolling = (jobId: string) => {
    setPolling(true);
    
    const pollStatus = async () => {
      try {
        const response = await apiRequest(`/api/components/import-xml/${jobId}/status`);
        const status = response.data;
        setJobStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          setPolling(false);
          
          if (status.status === 'completed') {
            toast({
              title: "Імпорт завершено",
              description: `Імпортовано: ${status.imported}, оновлено: ${status.updated}, пропущено: ${status.skipped}`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/components'] });
          } else {
            toast({
              title: "Помилка імпорту",
              description: "Імпорт завершився з помилками",
              variant: "destructive",
            });
          }
          return;
        }
        
        setTimeout(pollStatus, 1000);
      } catch (error) {
        console.error('Polling error:', error);
        setPolling(false);
        toast({
          title: "Помилка отримання статусу",
          description: "Не вдалося отримати статус імпорту",
          variant: "destructive",
        });
      }
    };
    
    pollStatus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setJobStatus(null);
      setJobId(null);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const resetForm = () => {
    setFile(null);
    setJobId(null);
    setJobStatus(null);
    setPolling(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Імпорт компонентів з XML
        </CardTitle>
        <CardDescription>
          Завантажте XML файл для імпорту компонентів. Підтримувані поля: ID_DETAIL (sku), DETAIL (name), INDEX_GROUP (category_id), COMMENT (notes), ACTUAL (is_active), CODE_CUST (uktzed_code).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="xmlFile">XML файл</Label>
          <Input
            id="xmlFile"
            type="file"
            accept=".xml"
            onChange={handleFileChange}
            disabled={uploadMutation.isPending || polling}
          />
        </div>

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Вибрано файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending || polling}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploadMutation.isPending ? "Завантаження..." : "Імпортувати"}
          </Button>
          
          {(jobStatus?.status === 'completed' || jobStatus?.status === 'failed') && (
            <Button variant="outline" onClick={resetForm}>
              Новий імпорт
            </Button>
          )}
        </div>

        {jobStatus && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Прогрес імпорту</span>
                <span>{jobStatus.progress}%</span>
              </div>
              <Progress value={jobStatus.progress} />
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{jobStatus.imported}</div>
                <div className="text-muted-foreground">Імпортовано</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{jobStatus.updated}</div>
                <div className="text-muted-foreground">Оновлено</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{jobStatus.skipped}</div>
                <div className="text-muted-foreground">Пропущено</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{jobStatus.errors.length}</div>
                <div className="text-muted-foreground">Помилок</div>
              </div>
            </div>

            {jobStatus.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Імпорт успішно завершено! Оброблено {jobStatus.totalRows} записів.
                </AlertDescription>
              </Alert>
            )}

            {jobStatus.status === 'failed' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Імпорт завершився з помилками. Перевірте деталі нижче.
                </AlertDescription>
              </Alert>
            )}

            {jobStatus.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Помилки
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {jobStatus.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {jobStatus.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... та ще {jobStatus.errors.length - 10} помилок
                    </div>
                  )}
                </div>
              </div>
            )}

            {jobStatus.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Деталі імпорту</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {jobStatus.details.slice(0, 20).map((detail, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm p-2 rounded bg-gray-50">
                      {detail.status === 'imported' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {detail.status === 'updated' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                      {detail.status === 'skipped' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {detail.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      <span className="font-medium">{detail.name}</span>
                      <span className="text-muted-foreground">({detail.sku})</span>
                      <span className="text-muted-foreground">- {detail.message}</span>
                    </div>
                  ))}
                  {jobStatus.details.length > 20 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... та ще {jobStatus.details.length - 20} записів
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}