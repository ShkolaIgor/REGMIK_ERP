import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Building, Star, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type Company, type InsertCompany } from "@shared/schema";
import { LogoUpload } from "@/components/LogoUpload";

export default function Companies() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["/api/companies"],
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      return await apiRequest("/api/companies", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Компанію успішно додано",
      });
      setShowCreateDialog(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати компанію",
        variant: "destructive",
      });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertCompany }) => {
      return await apiRequest(`/api/companies/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Компанію успішно оновлено",
      });
      setShowEditDialog(false);
      setEditingCompany(null);
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити компанію",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/companies/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Компанію успішно видалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити компанію",
        variant: "destructive",
      });
    },
  });

  const setDefaultCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/companies/${id}/set-default`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Успіх",
        description: "Компанію встановлено як основну",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося встановити компанію як основну",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      fullName: "",
      taxCode: "",
      vatNumber: "",
      legalAddress: "",
      physicalAddress: "",
      phone: "",
      email: "",
      website: "",
      bankName: "",
      bankAccount: "",
      bankCode: "",
      logo: "",
      isActive: true,
      isDefault: false,
      notes: "",
    },
  });

  const editForm = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      fullName: "",
      taxCode: "",
      vatNumber: "",
      legalAddress: "",
      physicalAddress: "",
      phone: "",
      email: "",
      website: "",
      bankName: "",
      bankAccount: "",
      bankCode: "",
      logo: "",
      isActive: true,
      isDefault: false,
      notes: "",
    },
  });

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    editForm.reset({
      name: company.name,
      fullName: company.fullName || "",
      taxCode: company.taxCode,
      vatNumber: company.vatNumber || "",
      legalAddress: company.legalAddress || "",
      physicalAddress: company.physicalAddress || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      bankName: company.bankName || "",
      bankAccount: company.bankAccount || "",
      bankCode: company.bankCode || "",
      logo: company.logo || "",
      isActive: company.isActive,
      isDefault: company.isDefault,
      notes: company.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (company: Company) => {
    if (company.isDefault) {
      toast({
        title: "Неможливо видалити",
        description: "Не можна видалити основну компанію",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Ви впевнені, що хочете видалити компанію "${company.name}"?`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  const handleSetDefault = (company: Company) => {
    if (company.isDefault) return;
    
    if (confirm(`Встановити "${company.name}" як основну компанію?`)) {
      setDefaultCompanyMutation.mutate(company.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження компаній...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мої Компанії</h1>
          <p className="text-muted-foreground">
            Управління компаніями для ведення продажів
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Додати компанію
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Створити нову компанію</DialogTitle>
              <DialogDescription>
                Введіть дані нової компанії для ведення продажів
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((data) => createCompanyMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва компанії *</FormLabel>
                        <FormControl>
                          <Input placeholder="ТОВ 'Моя Компанія'" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Повна назва</FormLabel>
                        <FormControl>
                          <Input placeholder="Товариство з обмеженою відповідальністю 'Моя Компанія'" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="taxCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ЄДРПОУ *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ПДВ номер</FormLabel>
                        <FormControl>
                          <Input placeholder="UA123456789" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+380441234567" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@company.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={createForm.control}
                    name="legalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Юридична адреса</FormLabel>
                        <FormControl>
                          <Textarea placeholder="м. Київ, вул. Хрещатик, 1" {...field} value={field.value || ""} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="physicalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Фактична адреса</FormLabel>
                        <FormControl>
                          <Textarea placeholder="м. Київ, вул. Хрещатик, 1" {...field} value={field.value || ""} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={createForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва банку</FormLabel>
                        <FormControl>
                          <Input placeholder="ПриватБанк" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="bankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Рахунок</FormLabel>
                        <FormControl>
                          <Input placeholder="UA123456789012345678901234567" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="bankCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>МФО</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={createForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Веб-сайт</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Додаткова інформація..." {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Логотип буде додано після створення компанії */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm text-gray-600">
                    Логотип можна буде завантажити після створення компанії
                  </Label>
                </div>

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Активна компанія</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Чи буде компанія доступна для вибору при створенні документів
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending}>
                    {createCompanyMutation.isPending ? "Збереження..." : "Зберегти компанію"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Список компаній */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies?.map((company: Company) => (
          <Card key={company.id} className={`relative ${company.isDefault ? 'ring-2 ring-blue-500' : ''}`}>
            {company.isDefault && (
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-blue-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Основна
                </Badge>
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(() => {
                      console.log(`Company ${company.name} logo:`, {
                        hasLogo: !!company.logo,
                        logoLength: company.logo?.length,
                        logoStart: company.logo?.substring(0, 50)
                      });
                      return company.logo && company.logo.trim() !== '' ? (
                        <img 
                          src={company.logo} 
                          alt={`${company.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => console.error('Image load error:', e)}
                          onLoad={() => console.log('Image loaded successfully for', company.name)}
                        />
                      ) : (
                        <Building className="h-5 w-5 text-blue-600" />
                      );
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">ЄДРПОУ: {company.taxCode}</p>
                  </div>
                </div>
                <Badge variant={company.isActive ? "default" : "secondary"}>
                  {company.isActive ? "Активна" : "Неактивна"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                {company.phone && (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Телефон:</span>
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{company.email}</span>
                  </div>
                )}
                {company.legalAddress && (
                  <div className="flex items-start space-x-2">
                    <span className="text-muted-foreground">Адреса:</span>
                    <span className="flex-1">{company.legalAddress}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!company.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(company)}
                      disabled={deleteCompanyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {!company.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(company)}
                    disabled={setDefaultCompanyMutation.isPending}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Зробити основною
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Діалог редагування */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати компанію</DialogTitle>
            <DialogDescription>
              Змініть дані компанії
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => editingCompany && updateCompanyMutation.mutate({ id: editingCompany.id, data }))} className="space-y-6">
              {/* Такі ж поля як у формі створення */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Назва компанії *</FormLabel>
                      <FormControl>
                        <Input placeholder="ТОВ 'Моя Компанія'" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Повна назва</FormLabel>
                      <FormControl>
                        <Input placeholder="Товариство з обмеженою відповідальністю 'Моя Компанія'" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="taxCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ЄДРПОУ *</FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ПДВ номер</FormLabel>
                      <FormControl>
                        <Input placeholder="UA123456789" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input placeholder="+380441234567" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="info@company.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="legalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Юридична адреса</FormLabel>
                      <FormControl>
                        <Textarea placeholder="м. Київ, вул. Хрещатик, 1" {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фактична адреса</FormLabel>
                      <FormControl>
                        <Textarea placeholder="м. Київ, вул. Хрещатик, 1" {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={editForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Назва банку</FormLabel>
                      <FormControl>
                        <Input placeholder="ПриватБанк" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Рахунок</FormLabel>
                      <FormControl>
                        <Input placeholder="UA123456789012345678901234567" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>МФО</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Веб-сайт</FormLabel>
                    <FormControl>
                      <Input placeholder="https://company.com" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примітки</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Додаткова інформація..." {...field} value={field.value || ""} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Компонент завантаження логотипу */}
              {editingCompany && (
                <LogoUpload 
                  companyId={editingCompany.id}
                  currentLogo={editingCompany.logo}
                  onLogoUpdate={(logo) => {
                    // Оновлюємо локальний стан для негайного відображення
                    setEditingCompany(prev => prev ? { ...prev, logo } : null);
                    // Також оновлюємо кеш відразу для швидкого відображення
                    queryClient.setQueryData(['/api/companies'], (oldData: any) => {
                      if (!oldData) return oldData;
                      return oldData.map((company: any) => 
                        company.id === editingCompany.id 
                          ? { ...company, logo }
                          : company
                      );
                    });
                  }}
                />
              )}

              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Активна компанія</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Чи буде компанія доступна для вибору при створенні документів
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={updateCompanyMutation.isPending}>
                  {updateCompanyMutation.isPending ? "Збереження..." : "Оновити компанію"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}