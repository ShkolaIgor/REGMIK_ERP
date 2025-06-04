import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit2, Trash2, Building2, User, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, InsertClient } from "@shared/schema";

const clientSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  type: z.string().default("individual"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Невірний email").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  novaPoshtaApiKey: z.string().optional(),
  novaPoshtaSenderRef: z.string().optional(),
  novaPoshtaContactRef: z.string().optional(),
  novaPoshtaAddressRef: z.string().optional(),
  enableThirdPartyShipping: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<Record<number, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      type: "individual",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      novaPoshtaApiKey: "",
      novaPoshtaSenderRef: "",
      novaPoshtaContactRef: "",
      novaPoshtaAddressRef: "",
      enableThirdPartyShipping: false,
      isActive: true
    }
  });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("/api/clients", {
      method: "POST",
      body: data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Клієнта створено успішно",
      });
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
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClient> }) =>
      apiRequest(`/api/clients/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      setEditingClient(null);
      form.reset();
      toast({
        title: "Успіх",
        description: "Клієнта оновлено успішно",
      });
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
    mutationFn: (id: number) => apiRequest(`/api/clients/${id}`, {
      method: "DELETE",
    }),
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

  const handleSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      type: client.type,
      contactPerson: client.contactPerson || "",
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      notes: client.notes || "",
      novaPoshtaApiKey: client.novaPoshtaApiKey || "",
      novaPoshtaSenderRef: client.novaPoshtaSenderRef || "",
      novaPoshtaContactRef: client.novaPoshtaContactRef || "",
      novaPoshtaAddressRef: client.novaPoshtaAddressRef || "",
      enableThirdPartyShipping: client.enableThirdPartyShipping || false,
      isActive: client.isActive ?? true
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const toggleApiKeyVisibility = (clientId: number) => {
    setShowApiKeys(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const maskApiKey = (apiKey: string | null | undefined): string => {
    if (!apiKey) return "Не встановлено";
    if (apiKey.length <= 8) return apiKey;
    return apiKey.substring(0, 4) + "*".repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управління клієнтами</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Додати клієнта
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Редагувати клієнта" : "Додати нового клієнта"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Назва клієнта" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Фізична особа</SelectItem>
                            <SelectItem value="organization">Організація</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Контактна особа</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ім'я контактної особи" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+380XXXXXXXXX" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адреса</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Повна адреса клієнта" />
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
                        <Textarea {...field} placeholder="Додаткова інформація про клієнта" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-lg">Налаштування Нової Пошти</h3>
                  
                  <FormField
                    control={form.control}
                    name="enableThirdPartyShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Дозволити відправку від імені клієнта
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Використовувати API ключ клієнта для відправлення
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

                  {form.watch("enableThirdPartyShipping") && (
                    <>
                      <FormField
                        control={form.control}
                        name="novaPoshtaApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API ключ Нової Пошти</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="API ключ клієнта" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="novaPoshtaSenderRef"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sender Ref</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ref відправника" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="novaPoshtaContactRef"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Ref</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ref контакту" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="novaPoshtaAddressRef"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Ref</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ref адреси" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Активний клієнт</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Чи доступний клієнт для нових замовлень
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

      <div className="grid gap-4">
        {clients.map((client: Client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {client.type === "organization" ? (
                    <Building2 className="h-5 w-5 text-blue-600" />
                  ) : (
                    <User className="h-5 w-5 text-green-600" />
                  )}
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <Badge variant={client.isActive ? "default" : "secondary"}>
                    {client.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                  {client.enableThirdPartyShipping && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Відправка НП
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(client.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.contactPerson && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Контактна особа
                    </Label>
                    <p className="text-sm">{client.contactPerson}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Телефон
                    </Label>
                    <p className="text-sm">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <p className="text-sm">{client.email}</p>
                  </div>
                )}
                {client.address && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Адреса
                    </Label>
                    <p className="text-sm">{client.address}</p>
                  </div>
                )}
                {client.enableThirdPartyShipping && client.novaPoshtaApiKey && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">
                        API ключ Нової Пошти
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(client.id)}
                      >
                        {showApiKeys[client.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-mono">
                      {showApiKeys[client.id] ? client.novaPoshtaApiKey : maskApiKey(client.novaPoshtaApiKey)}
                    </p>
                  </div>
                )}
                {client.notes && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Примітки
                    </Label>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Немає клієнтів
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Почніть з додавання першого клієнта
          </p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Додати клієнта
          </Button>
        </div>
      )}
    </div>
  );
}