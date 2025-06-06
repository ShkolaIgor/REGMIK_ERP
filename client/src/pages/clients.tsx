import { useState, useEffect, useRef } from "react";
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
  Percent
} from "lucide-react";
import { insertClientSchema, insertClientContactSchema, type Client, type InsertClient, type ClientContact, type InsertClientContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Розширена схема валідації для нової структури
const formSchema = insertClientSchema.extend({
  id: z.string().min(1, "ЄДРПОУ/ІПН обов'язковий").max(20, "Максимум 20 символів").transform(val => parseInt(val)),
  taxCode: z.string().min(1, "ЄДРПОУ/ІПН обов'язковий").max(20, "Максимум 20 символів"),
  type: z.enum(["individual", "organization"]),
  name: z.string().min(1, "Скорочена назва обов'язкова"),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(), 
  addressesMatch: z.boolean().default(false),
  discount: z.string().optional().transform(val => val || "0.00"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
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

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedClientForContact, setSelectedClientForContact] = useState<string>("");
  const [isGlobalContactAdd, setIsGlobalContactAdd] = useState(false);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
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
      type: "organization",
      name: "",
      fullName: "",
      legalAddress: "",
      physicalAddress: "",
      addressesMatch: false,
      discount: "0.00",
      notes: "",
      novaPoshtaApiKey: "",
      enableThirdPartyShipping: false,
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

  const onSubmit = (data: FormData) => {
    if (editingClient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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
    form.reset({
      id: client.id.toString(),
      taxCode: client.taxCode,
      type: client.type as "individual" | "organization",
      name: client.name,
      fullName: client.fullName || "",
      legalAddress: client.legalAddress || "",
      physicalAddress: client.physicalAddress || "",
      addressesMatch: client.addressesMatch || false,
      discount: client.discount || "0.00",
      notes: client.notes || "",
      isActive: client.isActive !== false,
    });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Клієнти</h1>
          <p className="text-muted-foreground">
            Управління клієнтами з налаштуваннями Нової Пошти
          </p>
        </div>
        <div className="flex gap-2">
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ЄДРПОУ/ІПН *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="12345678 або 1234567890"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип клієнта</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="organization">Організація</SelectItem>
                            <SelectItem value="individual">Фізична особа</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Скорочена назва *</FormLabel>
                      <FormControl>
                        <Input placeholder="ТОВ АБВГД або Іванов І.І." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Повна назва</FormLabel>
                      <FormControl>
                        <Input placeholder="Товариство з обмеженою відповідальністю..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Юридична адреса</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="01001, м. Київ, вул. Хрещатик, 1"
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressesMatch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleAddressMatch(!!checked);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Фактична адреса співпадає з юридичною</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фактична адреса для відвантаження</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Адреса для доставки товарів"
                          className="min-h-[60px]"
                          {...field}
                          disabled={form.watch("addressesMatch")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Знижка клієнта (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          max="100" 
                          placeholder="0.00"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Додаткова інформація про клієнта"
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Активний клієнт</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingClient ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {clients.map((client: Client) => (
          <Card key={client.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {client.type === "organization" ? (
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg leading-tight truncate">{client.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {client.type === "organization" ? "ЄДРПОУ" : "ІПН"}: <span className="font-bold text-base text-foreground">{client.id}</span>
                    </CardDescription>
                  </div>
                </div>
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
                    title="Налаштування Нової Пошти"
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(client)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id.toString())}
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
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
                  Створено: {new Date(client.createdAt).toLocaleDateString("uk-UA")}
                  {client.updatedAt && client.updatedAt !== client.createdAt && (
                    <span className="block mt-1">Оновлено: {new Date(client.updatedAt).toLocaleDateString("uk-UA")}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {clients.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Немає клієнтів</h3>
              <p className="text-muted-foreground mb-4">
                Додайте першого клієнта з ЄДРПОУ або ІПН
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати клієнта
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}