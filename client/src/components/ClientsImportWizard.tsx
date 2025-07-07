import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, FileText, Users, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ImportJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  imported: number;
  skipped: number;
  updated: number;
  errors: string[];
  totalRows: number;
  processed: number;
}

interface ImportResponse {
  success: boolean;
  jobId: string;
  error?: string;
}

export function ClientsImportWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Статистика існуючих клієнтів
  const { data: importStats } = useQuery({
    queryKey: ['/api/import-stats/clients'],
    enabled: isOpen,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/xml' || selectedFile.name.endsWith('.xml')) {
        setFile(selectedFile);
        setStep(3);
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
    setStep(4);

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
          const statusResponse = await apiRequest(`/api/clients/import-xml/${response.jobId}/status`) as { success: boolean; job: ImportJob };
          const jobData = statusResponse.job;
          setJob(jobData);
          setProgress(jobData.progress || 0);

          if (jobData.status === 'completed' || jobData.status === 'failed') {
            clearInterval(interval);
            setIsImporting(false);
            setStep(5);
            
            if (jobData.status === 'completed') {
              toast({
                title: "Імпорт завершено",
                description: `Імпортовано ${jobData.imported} клієнтів, пропущено ${jobData.skipped}`,
              });
              
              // Оновлюємо список клієнтів після успішного імпорту
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
              }, 1000);
            } else {
              toast({
                title: "Помилка імпорту",
                description: "Імпорт завершився з помилками",
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

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setJob(null);
    setJobId(null);
    setProgress(0);
    setIsImporting(false);
  };

  const closeWizard = () => {
    setIsOpen(false);
    setTimeout(() => resetWizard(), 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
          <Upload className="h-4 w-4 mr-2" />
          Імпорт клієнтів
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Майстер імпорту клієнтів
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                {stepNum < 5 && (
                  <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Welcome */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ласкаво просимо до майстра імпорту клієнтів
                </CardTitle>
                <CardDescription>
                  Цей майстер допоможе вам імпортувати клієнтів з XML файлу у форматі DATAPACKET
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Що вам потрібно знати:</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• XML файл повинен бути у форматі DATAPACKET</li>
                    <li>• Система автоматично знайде існуючих клієнтів за ЄДРПОУ/ІПН</li>
                    <li>• Дублікати будуть пропущені або оновлені</li>
                    <li>• Після імпорту ви отримаєте детальний звіт</li>
                  </ul>
                </div>
                
                {importStats && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Поточна статистика:</h4>
                    <div className="text-sm text-gray-700">
                      У системі зараз: <span className="font-medium">{importStats.existing_clients}</span> клієнтів
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={closeWizard}>
                    Скасувати
                  </Button>
                  <Button onClick={() => setStep(2)}>
                    Далі <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: File Selection */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Оберіть XML файл</CardTitle>
                <CardDescription>
                  Виберіть файл з клієнтами для імпорту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Оберіть XML файл</p>
                    <p className="text-sm text-gray-600">або перетягніть файл сюди</p>
                  </div>
                  <input
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                    className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Назад
                  </Button>
                  <Button disabled>
                    Далі <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: File Confirmation */}
          {step === 3 && file && (
            <Card>
              <CardHeader>
                <CardTitle>Підтвердження файлу</CardTitle>
                <CardDescription>
                  Перевірте обраний файл перед початком імпорту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        Файл обрано: {file.name}
                      </p>
                      <p className="text-sm text-green-600">
                        Розмір: {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Обрати інший файл
                  </Button>
                  <Button onClick={handleImport}>
                    Розпочати імпорт <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Import Progress */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Імпорт у процесі</CardTitle>
                <CardDescription>
                  Будь ласка, зачекайте поки файл обробляється
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Прогрес</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {job && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{job.imported || 0}</div>
                      <div className="text-gray-600">Імпортовано</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{job.updated || 0}</div>
                      <div className="text-gray-600">Оновлено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{job.skipped || 0}</div>
                      <div className="text-gray-600">Пропущено</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Results */}
          {step === 5 && job && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {job.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Результати імпорту
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{job.imported}</div>
                    <div className="text-gray-600">Імпортовано</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{job.updated}</div>
                    <div className="text-gray-600">Оновлено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{job.skipped}</div>
                    <div className="text-gray-600">Пропущено</div>
                  </div>
                </div>

                {job.errors && job.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-600 mb-2">Помилки:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {job.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={resetWizard} variant="outline" className="flex-1">
                    Новий імпорт
                  </Button>
                  <Button onClick={closeWizard} className="flex-1">
                    Закрити
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}