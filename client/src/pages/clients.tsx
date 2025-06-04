import { useState } from "react";
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
import { insertClientSchema, type Client, type InsertClient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Розширена схема валідації для нової структури
const formSchema = insertClientSchema.extend({
  id: z.string().min(1, "ЄДРПОУ/ІПН обов'язковий").max(20, "Максимум 20 символів"),
  type: z.enum(["individual", "organization"]),
  name: z.string().min(1, "Скорочена назва обов'язкова"),
  fullName: z.string().optional(),
  legalAddress: z.string().optional(),
  physicalAddress: z.string().optional(), 
  addressesMatch: z.boolean().default(false),
  discount: z.string().optional().transform(val => val || "0.00"),
  notes: z.string().optional(),
  novaPoshtaApiKey: z.string().optional(),
  enableThirdPartyShipping: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type FormData = z.infer<typeof formSchema>;

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
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

  const onSubmit = (data: FormData) => {
    if (editingClient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      id: client.id,
      type: client.type as "individual" | "organization",
      name: client.name,
      fullName: client.fullName || "",
      legalAddress: client.legalAddress || "",
      physicalAddress: client.physicalAddress || "",
      addressesMatch: client.addressesMatch || false,
      discount: client.discount || "0.00",
      notes: client.notes || "",
      novaPoshtaApiKey: client.novaPoshtaApiKey || "",
      enableThirdPartyShipping: client.enableThirdPartyShipping || false,
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
                            disabled={!!editingClient}
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

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Налаштування Нової Пошти</h3>
                  
                  <FormField
                    control={form.control}
                    name="enableThirdPartyShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Дозволити відправки від імені клієнта</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Використовувати API ключі клієнта для створення відправок
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="novaPoshtaApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API ключ Нової Пошти</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {client.type === "organization" ? "ЄДРПОУ" : "ІПН"}: {client.id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Активний" : "Неактивний"}
                    </Badge>
                    {client.enableThirdPartyShipping && (
                      <Badge variant="outline" className="text-blue-600">
                        <Truck className="h-3 w-3 mr-1" />
                        Відправки клієнта
                      </Badge>
                    )}
                    {client.discount && parseFloat(client.discount) > 0 && (
                      <Badge variant="outline" className="text-green-600">
                        <Percent className="h-3 w-3 mr-1" />
                        -{client.discount}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {client.fullName && (
                  <div>
                    <span className="font-medium">Повна назва:</span>
                    <p className="text-muted-foreground">{client.fullName}</p>
                  </div>
                )}
                {client.legalAddress && (
                  <div>
                    <span className="font-medium">Юридична адреса:</span>
                    <p className="text-muted-foreground">{client.legalAddress}</p>
                  </div>
                )}
                {client.physicalAddress && !client.addressesMatch && (
                  <div>
                    <span className="font-medium">Фактична адреса:</span>
                    <p className="text-muted-foreground">{client.physicalAddress}</p>
                  </div>
                )}
                {client.notes && (
                  <div className="col-span-2">
                    <span className="font-medium">Примітки:</span>
                    <p className="text-muted-foreground">{client.notes}</p>
                  </div>
                )}
              </div>
              {client.createdAt && (
                <div className="text-xs text-muted-foreground mt-4">
                  Створено: {new Date(client.createdAt).toLocaleDateString("uk-UA")}
                  {client.updatedAt && client.updatedAt !== client.createdAt && (
                    <span> • Оновлено: {new Date(client.updatedAt).toLocaleDateString("uk-UA")}</span>
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