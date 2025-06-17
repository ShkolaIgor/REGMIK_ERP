import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2, 
  Truck,
  Package,
  Percent,
  Search
} from "lucide-react";
import { insertClientSchema, insertClientContactSchema, type Client, type InsertClient, type ClientContact, type InsertClientContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ClientForm } from "@/components/ClientForm";
import { ClientXmlImport } from "@/components/ClientXmlImport";
import { UkrainianDate } from "@/components/ui/ukrainian-date";

// Розширена схема валідації для нової структури
const formSchema = insertClientSchema.extend({
  taxCode: z.string().min(1, "ЄДРПОУ/ІПН обов'язковий").max(20, "Максимум 20 символів"),
  clientTypeId: z.number().min(1, "Тип клієнта обов'язковий"),
  name: z.string().min(1, "Скорочена назва обов'язкова"),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(), 
  addressesMatch: z.boolean().default(false),
  discount: z.string().optional().transform(val => val || "0.00"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  carrierId: z.number().optional(),
  cityRef: z.string().optional(),
  warehouseRef: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

// Схема для швидкого додавання контакту
const contactFormSchema = insertClientContactSchema.extend({
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
  position: z.string().optional(),
  email: z.string().email("Невірний формат email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  primaryPhoneType: z.enum(["mobile", "office", "home"]).default("mobile"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Простий компонент пошуку без складних оптимізацій
function SearchInput({ value, onChange }: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        placeholder="Пошук клієнтів за назвою, ЄДРПОУ або повним ім'ям..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
        autoComplete="off"
      />
    </div>
  );
}

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedClientForContact, setSelectedClientForContact] = useState<string>("");
  const [isGlobalContactAdd, setIsGlobalContactAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Стабільний обробник зміни пошуку
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Дебаунс для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Скидаємо на першу сторінку при пошуку
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ["/api/clients", currentPage, pageSize, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
  });

  const clients = clientsData?.clients || [];
  const totalPages = clientsData?.totalPages || 1;
  const total = clientsData?.total || 0;

  // Завантаження типів клієнтів
  const { data: clientTypes = [] } = useQuery({
    queryKey: ['/api/client-types'],
  });



  // Автоматичне фокусування на поле "Повне ім'я" при відкритті діалогу контакту
  useEffect(() => {
    if (isContactDialogOpen && fullNameInputRef.current) {
      setTimeout(() => {
        fullNameInputRef.current?.focus();
      }, 100);
    }
  }, [isContactDialogOpen]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taxCode: "",
      clientTypeId: 1, // За замовчуванням "Юридична особа"
      name: "",
      fullName: "",
      legalAddress: "",
      physicalAddress: "",
      addressesMatch: false,
      discount: "0.00",
      notes: "",
      isActive: true,
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      clientId: "",
      fullName: "",
      position: "",
      email: "",
      primaryPhone: "",
      primaryPhoneType: "mobile",
      notes: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("/api/clients", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Успіх",
        description: "Клієнта створено успішно",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити клієнта",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest(`/api/clients/${editingClient?.id}`, {
        method: "PATCH",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Успіх",
        description: "Клієнта оновлено успішно",
      });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити клієнта",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/clients/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Успіх",
        description: "Клієнта видалено успішно",
      });
      // Закриваємо форму після успішного видалення
      setIsDialogOpen(false);
      setEditingClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити клієнта",
        variant: "destructive",
      });
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("/api/client-contacts", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      toast({
        title: "Успіх",
        description: "Контакт створено успішно",
      });
      setIsContactDialogOpen(false);
      setIsGlobalContactAdd(false);
      setSelectedClientForContact("");
      contactForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити контакт",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Ensure taxCode is properly handled as optional
    const cleanData = {
      ...data,
      taxCode: data.taxCode || undefined,
      carrierId: data.carrierId || null,
      cityRef: data.cityRef || null,
      warehouseRef: data.warehouseRef || null
    };
    
    console.log("Submitting client data:", cleanData);
    
    if (editingClient) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const onContactSubmit = (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  const openAddContactDialog = (clientId?: string) => {
    if (clientId) {
      // Додавання з карточки клієнта
      setSelectedClientForContact(clientId);
      setIsGlobalContactAdd(false);
      contactForm.setValue("clientId", clientId);
    } else {
      // Глобальне додавання
      setSelectedClientForContact("");
      setIsGlobalContactAdd(true);
      contactForm.setValue("clientId", "");
    }
    setIsContactDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Ви впевнені, що хочете видалити цього клієнта?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddressMatch = (checked: boolean) => {
    if (checked) {
      const legalAddress = form.getValues("legalAddress");
      form.setValue("physicalAddress", legalAddress);
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Клієнти</h1>
          <p className="text-muted-foreground">
            Управління клієнтами з налаштуваннями Нової Пошти
          </p>
        </div>
        <div className="flex gap-2">
          <ClientXmlImport />
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => openAddContactDialog()}
              >
                <User className="h-4 w-4 mr-2" />
                Додати контакт
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Додати контакт клієнта</DialogTitle>
                <DialogDescription>
                  Створіть новий контакт для клієнта
                </DialogDescription>
              </DialogHeader>
              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="clientId"
                    render={({ field }) => {
                      const selectedClient = (clients as Client[]).find(client => client.id.toString() === field.value);
                      
                      if (isGlobalContactAdd) {
                        // Режим пошуку для глобального додавання
                        return (
                          <FormItem>
                            <FormLabel>Клієнт *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Введіть назву або ID клієнта..."
                                {...field}
                                onChange={(e) => {
                                  const searchValue = e.target.value;
                                  field.onChange(searchValue);
                                  
                                  // Знайти клієнта по назві або ЄДРПОУ/ІПН
                                  const matchedClient = (clients as Client[]).find(client => 
                                    client.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                                    client.taxCode?.toLowerCase().includes(searchValue.toLowerCase())
                                  );
                                  
                                  if (matchedClient && searchValue === matchedClient.name) {
                                    field.onChange(matchedClient.id.toString());
                                  }
                                }}
                                autoComplete="off"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      } else {
                        // Режим відображення для додавання з карточки
                        return (
                          <FormItem>
                            <FormLabel>Клієнт *</FormLabel>
                            <FormControl>
                              <Input 
                                value={selectedClient ? selectedClient.name : field.value}
                                readOnly
                                className="bg-muted cursor-not-allowed"
                                placeholder="Клієнт не вибрано"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }
                    }}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Повне ім'я *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Іван Іванович Іваненко" 
                            {...field}
                            ref={fullNameInputRef}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={contactForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Посада</FormLabel>
                        <FormControl>
                          <Input placeholder="Менеджер з продажу" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={contactForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="ivan@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={contactForm.control}
                      name="primaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input placeholder="+380501234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={contactForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Примітки</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Додаткова інформація..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsContactDialogOpen(false)}
                    >
                      Скасувати
                    </Button>
                    <Button type="submit" disabled={createContactMutation.isPending}>
                      {createContactMutation.isPending ? "Створення..." : "Створити"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingClient(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати клієнта
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Редагувати клієнта" : "Новий клієнт"}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? "Оновіть інформацію про клієнта"
                  : "Введіть дані нового клієнта з ЄДРПОУ/ІПН"
                }
              </DialogDescription>
            </DialogHeader>

            <ClientForm
              editingClient={editingClient}
              onSubmit={onSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingClient(null);
              }}
              onDelete={handleDelete}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Поле пошуку */}
      <div className="mb-6">
        <SearchInput 
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {debouncedSearch && (
          <p className="text-sm text-muted-foreground mt-2">
            Знайдено: {total} клієнтів за запитом "{debouncedSearch}"
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {clients.map((client: Client) => (
          <Card key={client.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start space-x-3 mb-3">
                {(() => {
                  const clientType = (clientTypes as any[])?.find((type: any) => type.id === client.clientTypeId);
                  return clientType?.name === "Юридична особа" ? (
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg leading-tight">{client.name}</CardTitle>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <CardDescription className="text-sm">
                  {(() => {
                    const clientType = (clientTypes as any[])?.find((type: any) => type.id === client.clientTypeId);
                    return clientType?.name === "Фізична особа" ? "ІПН" : "ЄДРПОУ";
                  })()}: <span className="font-bold text-base text-foreground">{client.taxCode}</span>
                </CardDescription>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openAddContactDialog(client.id.toString())}
                    className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                    title="Контакти клієнта"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = `/clients/${client.id}/nova-poshta-settings`}
                    className="text-green-600 hover:text-green-700 h-8 w-8 p-0"
                    title="API налаштування Нової Пошти"
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.href = `/clients/${client.id}/delivery-settings`}
                    className="text-purple-600 hover:text-purple-700 h-8 w-8 p-0"
                    title="Налаштування доставки"
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(client)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
                  {client.isActive ? "Активний" : "Неактивний"}
                </Badge>

                {client.discount && parseFloat(client.discount) > 0 && (
                  <Badge variant="outline" className="text-green-600 text-xs">
                    <Percent className="h-3 w-3 mr-1" />
                    -{client.discount}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                {client.fullName && (
                  <div>
                    <span className="font-medium text-foreground">Повна назва:</span>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{client.fullName}</p>
                  </div>
                )}
                {client.legalAddress && (
                  <div>
                    <span className="font-medium text-foreground">Юридична адреса:</span>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{client.legalAddress}</p>
                  </div>
                )}
                {client.physicalAddress && !client.addressesMatch && (
                  <div>
                    <span className="font-medium text-foreground">Фактична адреса:</span>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{client.physicalAddress}</p>
                  </div>
                )}
                {client.notes && (
                  <div>
                    <span className="font-medium text-foreground">Примітки:</span>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-3">{client.notes}</p>
                  </div>
                )}
              </div>
              {client.createdAt && (
                <div className="text-xs text-muted-foreground mt-4 pt-3 border-t">
                  Створено: <UkrainianDate date={client.createdAt} format="short" />
                  {client.updatedAt && client.updatedAt !== client.createdAt && (
                    <span className="block mt-1">Оновлено: <UkrainianDate date={client.updatedAt} format="short" /></span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {clients.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {debouncedSearch ? "Клієнти не знайдені" : "Немає клієнтів"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch 
                  ? `За запитом "${debouncedSearch}" нічого не знайдено`
                  : "Додайте першого клієнта з ЄДРПОУ або ІПН"
                }
              </p>
              {!debouncedSearch && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати клієнта
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Показано {Math.min((currentPage - 1) * pageSize + 1, total)} - {Math.min(currentPage * pageSize, total)} з {total} записів
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ««
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </Button>
              
              {/* Показуємо номери сторінок */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »»
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}