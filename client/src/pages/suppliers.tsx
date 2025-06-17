import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Edit, Plus, Upload, FileX, CheckCircle, XCircle, AlertCircle, Eye, Building2 } from "lucide-react";

interface Supplier {
  id: number;
  name: string;
  fullName: string | null;
  taxCode: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  rating: number;
  isActive: boolean;
  externalId: number | null;
  clientTypeId: number;
  createdAt: string | null;
  updatedAt: string | null;
}

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

export default function Suppliers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportDetailsOpen, setIsImportDetailsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    taxCode: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    paymentTerms: "",
    deliveryTerms: "",
    rating: 5,
    isActive: true,
    clientTypeId: 3 // Default to "Постачальник"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/suppliers", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Постачальника створено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Помилка створення постачальника: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return await apiRequest(`/api/suppliers/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Постачальника оновлено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Помилка оновлення постачальника: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/suppliers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Постачальника видалено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: `Помилка видалення постачальника: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xmlFile', file);
      
      const response = await fetch('/api/suppliers/import-xml', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCurrentJob({ 
          id: data.jobId, 
          status: 'processing', 
          progress: 0, 
          processed: 0, 
          imported: 0, 
          skipped: 0, 
          errors: [], 
          details: [], 
          totalRows: 0 
        });
        setIsImportDialogOpen(false);
        setIsImportDetailsOpen(true);
        pollJobStatus(data.jobId);
        toast({
          title: "Імпорт розпочато",
          description: "Файл завантажено, обробка розпочалася",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Помилка імпорту",
        description: `Помилка завантаження файлу: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/suppliers/import-xml/${jobId}/status`);
        const data = await response.json();
        
        if (data.success && data.job) {
          setCurrentJob(data.job);
          
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
            return;
          }
          
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };
    
    poll();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      fullName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      paymentTerms: "",
      deliveryTerms: "",
      rating: 5,
      isActive: true,
      clientTypeId: 3
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      fullName: supplier.fullName || "",
      taxCode: supplier.taxCode || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      description: supplier.description || "",
      paymentTerms: supplier.paymentTerms || "",
      deliveryTerms: supplier.deliveryTerms || "",
      rating: supplier.rating,
      isActive: supplier.isActive,
      clientTypeId: supplier.clientTypeId
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/xml') {
      setSelectedFile(file);
    } else {
      toast({
        title: "Невірний тип файлу",
        description: "Будь ласка, оберіть XML файл",
        variant: "destructive",
      });
    }
  };

  const handleImportSubmit = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'imported': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'skipped': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'imported': return 'text-green-600';
      case 'updated': return 'text-blue-600';
      case 'skipped': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return <div className="p-4">Завантаження...</div>;
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Постачальники</h1>
          <p className="text-gray-600">Управління постачальниками</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Імпорт XML
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Додати постачальника
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Додати нового постачальника</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Назва *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Повна назва</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxCode">ЄДРПОУ/ІПН</Label>
                    <Input
                      id="taxCode"
                      value={formData.taxCode}
                      onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Контактна особа</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Рейтинг</Label>
                    <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="isActive">Статус</Label>
                    <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Активний</SelectItem>
                        <SelectItem value="false">Неактивний</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Адреса</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Опис</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Умови оплати</Label>
                    <Input
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryTerms">Умови доставки</Label>
                    <Input
                      id="deliveryTerms"
                      value={formData.deliveryTerms}
                      onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Імпорт постачальників з XML</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="xmlFile">Оберіть XML файл</Label>
              <Input
                id="xmlFile"
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
              />
            </div>
            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">
                  <strong>Файл:</strong> {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Розмір:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Скасувати
              </Button>
              <Button 
                onClick={handleImportSubmit} 
                disabled={!selectedFile || importMutation.isPending}
              >
                {importMutation.isPending ? "Завантаження..." : "Імпортувати"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Progress Dialog */}
      <Dialog open={isImportDetailsOpen} onOpenChange={setIsImportDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Прогрес імпорту постачальників</DialogTitle>
          </DialogHeader>
          {currentJob && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Прогрес: {currentJob.processed} з {currentJob.totalRows}</span>
                    <span>{currentJob.progress}%</span>
                  </div>
                  <Progress value={currentJob.progress} className="h-2" />
                </div>
                <Badge variant={currentJob.status === 'completed' ? 'default' : currentJob.status === 'failed' ? 'destructive' : 'secondary'}>
                  {currentJob.status === 'completed' ? 'Завершено' : 
                   currentJob.status === 'failed' ? 'Помилка' : 'Обробка'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{currentJob.imported}</div>
                  <div className="text-sm text-green-600">Імпортовано</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{currentJob.skipped}</div>
                  <div className="text-sm text-yellow-600">Пропущено</div>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{currentJob.errors.length}</div>
                  <div className="text-sm text-red-600">Помилки</div>
                </div>
              </div>

              {currentJob.details.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Деталі обробки:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {currentJob.details.map((detail, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                        {getStatusIcon(detail.status)}
                        <div className="flex-1">
                          <div className="font-medium">{detail.name}</div>
                          {detail.message && (
                            <div className={`text-sm ${getStatusColor(detail.status)}`}>
                              {detail.message}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(detail.status)}>
                          {detail.status === 'imported' ? 'Імпортовано' :
                           detail.status === 'updated' ? 'Оновлено' :
                           detail.status === 'skipped' ? 'Пропущено' : 'Помилка'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentJob.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-red-600">Помилки:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {currentJob.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагувати постачальника</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Назва *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-fullName">Повна назва</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-taxCode">ЄДРПОУ/ІПН</Label>
                <Input
                  id="edit-taxCode"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-contactPerson">Контактна особа</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Телефон</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-rating">Рейтинг</Label>
                <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-isActive">Статус</Label>
                <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Активний</SelectItem>
                    <SelectItem value="false">Неактивний</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Адреса</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Опис</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-paymentTerms">Умови оплати</Label>
                <Input
                  id="edit-paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-deliveryTerms">Умови доставки</Label>
                <Input
                  id="edit-deliveryTerms"
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => deleteMutation.mutate(editingSupplier!.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Видалення..." : "Видалити"}
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingSupplier(null)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Оновлення..." : "Оновити"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileX className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Постачальники відсутні</h3>
              <p className="text-gray-500 text-center mb-4">
                У вас ще немає постачальників. Додайте першого постачальника або імпортуйте дані з XML файлу.
              </p>
            </CardContent>
          </Card>
        ) : (
          suppliers.map((supplier: Supplier) => (
            <Card key={supplier.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3 mb-3">
                  <Building2 className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg leading-tight">{supplier.name}</CardTitle>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <CardDescription className="text-sm">
                    ЄДРПОУ/ІПН: <span className="font-bold text-base text-foreground">{supplier.taxCode || "Не вказано"}</span>
                  </CardDescription>
                  <div className="flex space-x-1 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={supplier.isActive ? "default" : "secondary"} className="text-xs">
                    {supplier.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                  {supplier.rating && (
                    <Badge variant="outline" className="text-xs">
                      Рейтинг: {supplier.rating}/5
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-sm">
                  {supplier.fullName && (
                    <div>
                      <span className="font-medium text-foreground">Повна назва:</span>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{supplier.fullName}</p>
                    </div>
                  )}
                  {supplier.contactPerson && (
                    <div>
                      <span className="font-medium text-foreground">Контактна особа:</span>
                      <p className="text-muted-foreground text-xs mt-1">{supplier.contactPerson}</p>
                    </div>
                  )}
                  {(supplier.phone || supplier.email) && (
                    <div>
                      <span className="font-medium text-foreground">Контакти:</span>
                      <div className="text-xs mt-1 space-y-1">
                        {supplier.phone && (
                          <p className="text-muted-foreground">Тел: {supplier.phone}</p>
                        )}
                        {supplier.email && (
                          <p className="text-muted-foreground">Email: {supplier.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {supplier.address && (
                    <div>
                      <span className="font-medium text-foreground">Адреса:</span>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{supplier.address}</p>
                    </div>
                  )}
                  {(supplier.paymentTerms || supplier.deliveryTerms) && (
                    <div>
                      <span className="font-medium text-foreground">Умови співпраці:</span>
                      <div className="text-xs mt-1 space-y-1">
                        {supplier.paymentTerms && (
                          <p className="text-muted-foreground">Оплата: {supplier.paymentTerms}</p>
                        )}
                        {supplier.deliveryTerms && (
                          <p className="text-muted-foreground">Доставка: {supplier.deliveryTerms}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {supplier.description && (
                    <div>
                      <span className="font-medium text-foreground">Примітки:</span>
                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{supplier.description}</p>
                    </div>
                  )}
                  
                  {/* Дати створення та оновлення */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Створено: {new Date(supplier.createdAt).toLocaleDateString('uk-UA')}</span>
                      {supplier.updatedAt && supplier.updatedAt !== supplier.createdAt && (
                        <span>Оновлено: {new Date(supplier.updatedAt).toLocaleDateString('uk-UA')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}