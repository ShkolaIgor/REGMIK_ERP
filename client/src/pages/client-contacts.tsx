import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Edit, Trash, Phone, Mail, User, Check, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClientContactSchema, type ClientContact, type Client } from "@shared/schema";
import { z } from "zod";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientContact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [filterClientId, setFilterClientId] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
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
      isActive: true,
    },
  });

  // Fetch client contacts
  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ["/api/client-contacts", currentPage, pageSize, searchTerm, selectedClientId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedClientId) params.append('clientId', selectedClientId.toString());
      
      const response = await fetch(`/api/client-contacts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
  });

  // Handle both paginated and non-paginated responses
  const contacts = Array.isArray(contactsResponse) ? contactsResponse : (contactsResponse?.contacts || []);
  const totalPages = contactsResponse?.totalPages || Math.ceil(contacts.length / pageSize);
  const totalContacts = contactsResponse?.total || contacts.length;

  // Запит для пошуку клієнтів з debounce
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientSearch(clientSearchValue);
    }, 300); // 300мс затримка

    return () => clearTimeout(timer);
  }, [clientSearchValue]);

  const { data: clientsData } = useQuery({
    queryKey: ["/api/clients/search", debouncedClientSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedClientSearch) {
        params.append('q', debouncedClientSearch);
      }
      params.append('limit', '50');
      
      const response = await fetch(`/api/clients/search?${params}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: true,
  });
  
  const clients = clientsData?.clients || [];

  // Fetch client types for tax code labeling
  const { data: clientTypes = [] } = useQuery({
    queryKey: ["/api/client-types"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      return apiRequest("/api/client-contacts", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Контакт створено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormData> }) => {
      return apiRequest(`/api/client-contacts/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Контакт оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/client-contacts/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      toast({
        title: "Успіх",
        description: "Контакт видалено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (item: ClientContact) => {
    setEditingItem(item);
    form.reset({
      clientId: item.clientId.toString(),
      fullName: item.fullName,
      position: item.position || "",
      email: item.email || "",
      primaryPhone: item.primaryPhone || "",
      primaryPhoneType: (item.primaryPhoneType as "mobile" | "office" | "home") || "mobile",
      secondaryPhone: item.secondaryPhone || "",
      secondaryPhoneType: (item.secondaryPhoneType as "mobile" | "office" | "home" | "fax") || "office",
      tertiaryPhone: item.tertiaryPhone || "",
      tertiaryPhoneType: (item.tertiaryPhoneType as "mobile" | "office" | "home" | "fax") || "fax",
      notes: item.notes || "",
      isPrimary: item.isPrimary || false,
      isActive: item.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset();
    setIsDialogOpen(true);
  };

  // Filter contacts
  const filteredContacts = (contacts as (ClientContact & { client?: Client })[]).filter((item) => {
    const matchesSearch = item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.primaryPhone?.includes(searchTerm) ||
                         item.secondaryPhone?.includes(searchTerm) ||
                         item.tertiaryPhone?.includes(searchTerm) ||
                         item.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = filterClientId === "all" || !filterClientId || item.clientId.toString() === filterClientId;
    const matchesActive = filterActive === "all" || 
                         (filterActive === "active" && item.isActive) ||
                         (filterActive === "inactive" && !item.isActive);
    
    return matchesSearch && matchesClient && matchesActive;
  });

  const onSubmit = (data: FormData) => {
    // Конвертуємо clientId в число
    const submitData = {
      ...data,
      clientId: typeof data.clientId === 'string' ? parseInt(data.clientId, 10) : data.clientId
    };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="w-full px-4 py-3">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Контактні особи клієнтів</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Додати контакт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Редагувати контакт" : "Додати контакт"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Клієнт</FormLabel>
                        <div className="relative">
                          <Input
                            placeholder="Почніть вводити назву клієнта..."
                            value={field.value ? 
                              clients.find((c: any) => c.id.toString() === field.value)?.name || clientSearchValue 
                              : clientSearchValue}
                            onChange={(e) => {
                              if (field.value) {
                                field.onChange("");
                              }
                              setClientSearchValue(e.target.value);
                              setClientComboboxOpen(true);
                            }}
                            onFocus={() => {
                              if (field.value) {
                                const selectedClient = clients.find((c: any) => c.id.toString() === field.value);
                                setClientSearchValue(selectedClient?.name || "");
                                field.onChange("");
                              }
                              setClientComboboxOpen(true);
                            }}
                            onBlur={() => setTimeout(() => setClientComboboxOpen(false), 200)}
                            className={form.formState.errors.clientId ? "border-red-500" : ""}
                          />
                          {clientSearchValue && clientComboboxOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {clients.length > 0 ? (
                                <div className="py-1">
                                  {clients.map((client: any) => (
                                    <div
                                      key={client.id}
                                      onClick={() => {
                                        field.onChange(client.id.toString());
                                        setClientSearchValue("");
                                        setClientComboboxOpen(false);
                                      }}
                                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          field.value === client.id.toString()
                                            ? "opacity-100 text-blue-600"
                                            : "opacity-0"
                                        }`}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-sm text-gray-500">{client.taxCode}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : clientSearchValue.length > 2 ? (
                                <div className="p-3 text-sm text-gray-500">
                                  Клієнт "{clientSearchValue}" не знайдений
                                </div>
                              ) : (
                                <div className="p-3 text-sm text-gray-500">
                                  Введіть мінімум 3 символи для пошуку
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Повне ім'я</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Введіть повне ім'я" />
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
                          <Input {...field} placeholder="Введіть посаду" />
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
                          <Input {...field} type="email" placeholder="Введіть email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Телефони */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Телефони</h3>
                  
                  {/* Основний телефон */}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="primaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Основний телефон</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+380..." />
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
                          <FormLabel>Тип</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mobile">Мобільний</SelectItem>
                              <SelectItem value="office">Офісний</SelectItem>
                              <SelectItem value="home">Домашній</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Додатковий телефон */}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="secondaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Додатковий телефон</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+380..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondaryPhoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mobile">Мобільний</SelectItem>
                              <SelectItem value="office">Офісний</SelectItem>
                              <SelectItem value="home">Домашній</SelectItem>
                              <SelectItem value="fax">Факс</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Третій телефон */}
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="tertiaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Третій телефон</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+380..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tertiaryPhoneType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mobile">Мобільний</SelectItem>
                              <SelectItem value="office">Офісний</SelectItem>
                              <SelectItem value="home">Домашній</SelectItem>
                              <SelectItem value="fax">Факс</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Додаткові примітки" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>Основний контакт клієнта</FormLabel>
                        </div>
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
                          <FormLabel>Активний</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фільтри</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Пошук за ім'ям, посадою, email, телефоном..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Фільтр за клієнтом" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі клієнти</SelectItem>
                {(clients as Client[]).map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger>
                <SelectValue placeholder="Фільтр за статусом" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі</SelectItem>
                <SelectItem value="active">Активні</SelectItem>
                <SelectItem value="inactive">Неактивні</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблиця */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center">Завантаження...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ім'я</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Посада</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефони</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{contact.fullName}</div>
                          {contact.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Основний контакт
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(contact as any).clientName || 
                       (clients as Client[]).find(c => c.id === contact.clientId)?.name || 
                       'Клієнт не знайдений'}
                    </TableCell>
                    <TableCell>{contact.position || "-"}</TableCell>
                    <TableCell>
                      {contact.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {contact.primaryPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{contact.primaryPhone}</span>
                            <Badge variant="outline" className="text-xs">
                              {phoneTypeLabels[contact.primaryPhoneType as keyof typeof phoneTypeLabels] || contact.primaryPhoneType}
                            </Badge>
                          </div>
                        )}
                        {contact.secondaryPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{contact.secondaryPhone}</span>
                            <Badge variant="outline" className="text-xs">
                              {phoneTypeLabels[contact.secondaryPhoneType as keyof typeof phoneTypeLabels] || contact.secondaryPhoneType}
                            </Badge>
                          </div>
                        )}
                        {contact.tertiaryPhone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{contact.tertiaryPhone}</span>
                            <Badge variant="outline" className="text-xs">
                              {phoneTypeLabels[contact.tertiaryPhoneType as keyof typeof phoneTypeLabels] || contact.tertiaryPhoneType}
                            </Badge>
                          </div>
                        )}
                        {!contact.primaryPhone && !contact.secondaryPhone && !contact.tertiaryPhone && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.isActive ? "default" : "secondary"}>
                        {contact.isActive ? "Активний" : "Неактивний"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(contact.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredContacts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Контакти не знайдено
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Попередня
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                  
                  if (page < 1 || page > totalPages) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Наступна
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}