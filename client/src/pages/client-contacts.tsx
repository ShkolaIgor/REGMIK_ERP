import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, CheckCircle, Grid3X3, Phone, Mail, Search, Upload, Download, Edit, Trash, AlertTriangle, Users, Building2 } from "lucide-react";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertClientContactSchema, type ClientContact, type Client } from "@shared/schema";
import { z } from "zod";

// Form schema
const formSchema = insertClientContactSchema.extend({
  clientId: z.string().min(1, "Клієнт обов'язковий").transform((val) => parseInt(val, 10)),
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
  position: z.string().optional(),
  email: z.string().email("Невірний формат email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  primaryPhoneType: z.enum(["mobile", "office", "home"]).default("mobile"),
  secondaryPhone: z.string().optional(),
  secondaryPhoneType: z.enum(["mobile", "office", "home", "fax"]).default("office"),
  tertiaryPhone: z.string().optional(),
  tertiaryPhoneType: z.enum(["mobile", "office", "home", "fax"]).default("fax"),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type FormData = z.infer<typeof formSchema>;

const phoneTypeLabels = {
  mobile: "Мобільний",
  office: "Офісний", 
  home: "Домашній",
  fax: "Факс"
};

export default function ClientContacts() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Queries
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["/api/client-contacts"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const contacts = contactsData?.contacts || [];

  // Визначення колонок для DataTable
  const columns = [
    {
      key: 'fullName',
      label: 'Повне ім\'я',
      sortable: true,
    },
    {
      key: 'clientName',
      label: 'Клієнт',
      sortable: true,
      render: (value: string, row: ClientContact) => {
        const client = clients.find((c: Client) => c.id === row.clientId);
        return client?.name || 'Невідомий клієнт';
      }
    },
    {
      key: 'position',
      label: 'Посада',
      sortable: true,
    },
    {
      key: 'primaryPhone',
      label: 'Телефон',
      sortable: true,
      render: (value: string, row: ClientContact) => {
        if (!value) return '-';
        const type = phoneTypeLabels[row.primaryPhoneType as keyof typeof phoneTypeLabels] || '';
        return (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{value}</span>
            {type && <Badge variant="outline" className="text-xs">{type}</Badge>}
          </div>
        );
      }
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => {
        if (!value) return '-';
        return (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span>{value}</span>
          </div>
        );
      }
    },
    {
      key: 'isPrimary',
      label: 'Основний',
      sortable: true,
      render: (value: boolean) => value ? (
        <Badge className="bg-green-100 text-green-800 text-xs">Основний</Badge>
      ) : (
        <Badge variant="outline" className="text-xs">Додатковий</Badge>
      )
    },
    {
      key: 'isActive',
      label: 'Статус',
      sortable: true,
      render: (value: boolean) => value ? 'Активний' : 'Неактивний'
    }
  ];

  // Фільтрування контактів
  const filteredContacts = useMemo(() => {
    if (!Array.isArray(contacts)) return [];
    
    return contacts.filter((contact: ClientContact) => {
      const client = clients.find((c: Client) => c.id === contact.clientId);
      
      // Пошук
      const matchesSearch = !searchQuery || 
        contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.position && contact.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.primaryPhone && contact.primaryPhone.includes(searchQuery)) ||
        (client && client.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Фільтр за клієнтом
      const matchesClient = clientFilter === "all" || contact.clientId.toString() === clientFilter;

      // Фільтр за статусом
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && contact.isActive) ||
        (statusFilter === "inactive" && !contact.isActive) ||
        (statusFilter === "primary" && contact.isPrimary);

      // Фільтр за посадою (можна розширити)
      const matchesPosition = positionFilter === "all";

      return matchesSearch && matchesClient && matchesStatus && matchesPosition;
    });
  }, [contacts, clients, searchQuery, clientFilter, statusFilter, positionFilter]);

  // Card template для DataTable
  const cardTemplate = (contact: ClientContact) => {
    const client = clients.find((c: Client) => c.id === contact.clientId);
    
    return (
      <Card className="h-full hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {contact.fullName}
              </CardTitle>
              <div className="flex items-center gap-2 mb-2">
                {contact.isPrimary && (
                  <Badge className="bg-green-100 text-green-800 text-xs">Основний контакт</Badge>
                )}
                {contact.isActive ? (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Активний</Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">Неактивний</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {client && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{client.name}</span>
              </div>
            )}
            {contact.position && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Посада:</span> {contact.position}
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.primaryPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{contact.primaryPhone}</span>
                <Badge variant="outline" className="text-xs">
                  {phoneTypeLabels[contact.primaryPhoneType as keyof typeof phoneTypeLabels]}
                </Badge>
              </div>
            )}
            {contact.secondaryPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{contact.secondaryPhone}</span>
                <Badge variant="outline" className="text-xs">
                  {phoneTypeLabels[contact.secondaryPhoneType as keyof typeof phoneTypeLabels]}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingContact(contact)}
              className="flex-1"
            >
              <Edit className="w-3 h-3 mr-1" />
              Редагувати
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Trash className="w-3 h-3 mr-1" />
              Видалити
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Форма
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      position: "",
      email: "",
      primaryPhone: "",
      primaryPhoneType: "mobile",
      secondaryPhone: "",
      secondaryPhoneType: "office",
      tertiaryPhone: "",
      tertiaryPhoneType: "fax",
      notes: "",
      isPrimary: false,
      isActive: true
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/client-contacts", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      form.reset();
      setIsCreateDialogOpen(false);
      toast({ title: "Контакт успішно створено" });
    },
    onError: (error) => {
      toast({ 
        title: "Помилка", 
        description: error.message || "Не вдалося створити контакт",
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Завантаження контактів...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Контактні особи клієнтів
                    </h1>
                    <p className="text-gray-600 mt-1">Управління контактними особами та їх даними</p>
                  </div>
                </div>
              </div>
            
              <div className="flex items-center space-x-4"> 
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати контакт
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Показано контактів</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{filteredContacts.length}</p>
                    <p className="text-xs text-blue-600">З {contacts.length} загалом</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Активні контакти</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{filteredContacts.filter((c: ClientContact) => c.isActive).length}</p>
                    <p className="text-xs text-emerald-600">Доступні для зв'язку</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-700 font-medium">Основні контакти</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-900 mb-1">{filteredContacts.filter((c: ClientContact) => c.isPrimary).length}</p>
                    <p className="text-xs text-yellow-600">Першочергові для зв'язку</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">З email</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{filteredContacts.filter((c: ClientContact) => c.email).length}</p>
                    <p className="text-xs text-purple-600">Мають електронну пошту</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="w-full py-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SearchFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Пошук контактів за іменем, посадою, телефоном, email..."
                    filters={[
                      {
                        key: "status",
                        label: "Статус",
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                          { value: "all", label: "Всі статуси" },
                          { value: "active", label: "Активні" },
                          { value: "inactive", label: "Неактивні" },
                          { value: "primary", label: "Основні контакти" }
                        ]
                      },
                      {
                        key: "client",
                        label: "Клієнт",
                        value: clientFilter,
                        onChange: setClientFilter,
                        options: [
                          { value: "all", label: "Всі клієнти" },
                          ...clients.map((client: Client) => ({
                            value: client.id.toString(),
                            label: client.name
                          }))
                        ]
                      }
                    ]}
                  />

                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsImportDialogOpen(true)}
                      className={`border-blue-200 text-blue-600 hover:bg-blue-50 ${!isAuthenticated ? 'opacity-50' : ''}`}
                      disabled={!isAuthenticated}
                      title={!isAuthenticated ? "Потрібна авторизація для імпорту" : ""}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Імпорт XML
                      {!isAuthenticated && <AlertTriangle className="ml-2 h-4 w-4 text-orange-500" />}
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Експорт
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DataTable */}
          <div className="w-full">
            <DataTable
              data={filteredContacts}
              columns={columns}
              storageKey="client-contacts-table"
              cardTemplate={cardTemplate}
              onRowClick={(contact) => setEditingContact(contact)}
              actions={(contact) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingContact(contact);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement delete functionality
                    }}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              )}
            />
          </div>
        </main>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Додати новий контакт</DialogTitle>
              <DialogDescription>
                Створіть нову контактну особу для клієнта
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Клієнт *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть клієнта" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: Client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Повне ім'я *</FormLabel>
                        <FormControl>
                          <Input placeholder="Введіть повне ім'я" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Посада</FormLabel>
                        <FormControl>
                          <Input placeholder="Введіть посаду" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Основний телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+380..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryPhoneType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип основного телефону</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(phoneTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="isPrimary"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Основний контакт</FormLabel>
                          </div>
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
                            <FormLabel>Активний</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    {createMutation.isPending ? "Створення..." : "Створити контакт"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Import XML Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Імпорт XML файлу</DialogTitle>
              <DialogDescription>
                Завантажте XML файл з контактними особами
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="xml-file-contacts" className="text-sm font-medium">
                  Оберіть XML файл
                </label>
                <input
                  id="xml-file-contacts"
                  type="file"
                  accept=".xml"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button onClick={() => {
                  // TODO: Implement XML import logic
                  toast({ title: "Функція імпорту в розробці" });
                  setIsImportDialogOpen(false);
                }}>
                  Імпортувати
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}