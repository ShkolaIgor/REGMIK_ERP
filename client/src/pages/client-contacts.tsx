import { useState } from "react";
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
import { Plus, Search, Edit, Trash, Phone, Mail, User, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClientContactSchema, type ClientContact, type Client } from "@shared/schema";
import { z } from "zod";

const formSchema = insertClientContactSchema.extend({
  clientId: z.string().min(1, "Клієнт обов'язковий"),
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClientId, setFilterClientId] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState("");
  
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
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/client-contacts"],
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
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
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto p-6">
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
                      <FormItem className="flex flex-col">
                        <FormLabel>Клієнт</FormLabel>
                        <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={clientSearchOpen}
                                className="justify-between"
                              >
                                {field.value
                                  ? (() => {
                                      const selectedClient = (clients as Client[]).find((client) => client.id.toString() === field.value);
                                      return selectedClient ? `${selectedClient.name} (${selectedClient.taxCode})` : "Клієнт не знайдений";
                                    })()
                                  : "Пошук по назві, ЄДРПОУ або ІПН..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                            <Command>
                              <CommandInput 
                                placeholder="Пошук по назві, ЄДРПОУ або ІПН..." 
                                value={clientSearchValue}
                                onValueChange={setClientSearchValue}
                              />
                              <CommandList>
                                <CommandEmpty>Клієнтів не знайдено.</CommandEmpty>
                                <CommandGroup>
                                  {(clients as Client[])
                                    .filter((client) =>
                                      client.name.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
                                      client.taxCode.toLowerCase().includes(clientSearchValue.toLowerCase())
                                    )
                                    .map((client) => (
                                      <CommandItem
                                        key={client.id}
                                        value={client.id.toString()}
                                        onSelect={() => {
                                          field.onChange(client.id.toString());
                                          setClientSearchOpen(false);
                                          setClientSearchValue("");
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            field.value === client.id.toString() ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium">{client.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            ЄДРПОУ: {client.taxCode}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                      {contact.client?.name || 
                       (clients as Client[]).find(c => c.id === contact.clientId)?.name || 
                       contact.clientId}
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
        </CardContent>
      </Card>
    </div>
  );
}