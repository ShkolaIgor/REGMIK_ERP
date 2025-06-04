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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Building2,
  UserPlus
} from "lucide-react";
import { insertClientContactSchema, insertClientPhoneSchema, type Client, type ClientContact, type ClientPhone } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = insertClientContactSchema.extend({
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  name: z.string().min(1, "Ім'я обов'язкове"),
  position: z.string().optional(),
  email: z.string().email("Невірний формат email").optional().or(z.literal("")),
  phone: z.string().optional(),
  isActive: z.boolean().default(true)
});

const phoneFormSchema = insertClientPhoneSchema.extend({
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  phone: z.string().min(1, "Телефон обов'язковий"),
  type: z.enum(["mobile", "office", "fax"]).default("office"),
  isActive: z.boolean().default(true)
});

type ContactFormData = z.infer<typeof contactFormSchema>;
type PhoneFormData = z.infer<typeof phoneFormSchema>;

export default function ClientContacts() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [editingPhone, setEditingPhone] = useState<ClientPhone | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<ClientContact[]>({
    queryKey: ["/api/client-contacts"],
  });

  const { data: phones = [], isLoading: phonesLoading } = useQuery<ClientPhone[]>({
    queryKey: ["/api/client-phones"],
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      clientId: "",
      name: "",
      position: "",
      email: "",
      phone: "",
      isActive: true,
    },
  });

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      clientId: "",
      phone: "",
      type: "office",
      isActive: true,
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

  const createPhoneMutation = useMutation({
    mutationFn: async (data: PhoneFormData) => {
      const response = await apiRequest("/api/client-phones", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-phones"] });
      toast({
        title: "Успіх",
        description: "Телефон додано успішно",
      });
      setIsPhoneDialogOpen(false);
      phoneForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати телефон",
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/client-contacts/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts"] });
      toast({
        title: "Успіх",
        description: "Контакт видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити контакт",
        variant: "destructive",
      });
    },
  });

  const deletePhoneMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/client-phones/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-phones"] });
      toast({
        title: "Успіх",
        description: "Телефон видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити телефон",
        variant: "destructive",
      });
    },
  });

  const onContactSubmit = (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  const onPhoneSubmit = (data: PhoneFormData) => {
    createPhoneMutation.mutate(data);
  };

  const handleDeleteContact = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей контакт?")) {
      deleteContactMutation.mutate(id);
    }
  };

  const handleDeletePhone = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей телефон?")) {
      deletePhoneMutation.mutate(id);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : clientId;
  };

  const getPhoneTypeLabel = (type: string) => {
    switch (type) {
      case "mobile": return "Мобільний";
      case "office": return "Офісний";
      case "fax": return "Факс";
      default: return type;
    }
  };

  if (contactsLoading || phonesLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Контакти клієнтів</h1>
          <p className="text-muted-foreground">
            Управління контактними особами та телефонами клієнтів
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingContact(null);
                  contactForm.reset();
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Додати контакт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новий контакт</DialogTitle>
                <DialogDescription>
                  Додайте контактну особу для клієнта
                </DialogDescription>
              </DialogHeader>

              <Form {...contactForm}>
                <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                  <FormField
                    control={contactForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Клієнт *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть клієнта" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ім'я та прізвище *</FormLabel>
                        <FormControl>
                          <Input placeholder="Іванов Іван Іванович" {...field} />
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
                          <Input placeholder="Директор, Менеджер..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ivan@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={contactForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+380671234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                      Скасувати
                    </Button>
                    <Button type="submit" disabled={createContactMutation.isPending}>
                      Створити
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Додати телефон
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новий телефон</DialogTitle>
                <DialogDescription>
                  Додайте додатковий телефон для клієнта
                </DialogDescription>
              </DialogHeader>

              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                  <FormField
                    control={phoneForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Клієнт *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть клієнта" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name} ({client.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={phoneForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер телефону *</FormLabel>
                        <FormControl>
                          <Input placeholder="+380671234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={phoneForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип телефону</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="office">Офісний</SelectItem>
                            <SelectItem value="mobile">Мобільний</SelectItem>
                            <SelectItem value="fax">Факс</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsPhoneDialogOpen(false)}>
                      Скасувати
                    </Button>
                    <Button type="submit" disabled={createPhoneMutation.isPending}>
                      Додати
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Контактні особи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Контактні особи
            </CardTitle>
            <CardDescription>
              Співробітники клієнтів з контактною інформацією
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Немає контактних осіб
              </p>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <div key={contact.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getClientName(contact.clientId)}
                        </p>
                        {contact.position && (
                          <p className="text-sm text-blue-600">{contact.position}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={contact.isActive ? "default" : "secondary"}>
                          {contact.isActive ? "Активний" : "Неактивний"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Телефони */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Телефони клієнтів
            </CardTitle>
            <CardDescription>
              Додаткові номери телефонів для зв'язку
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phones.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Немає телефонів
              </p>
            ) : (
              <div className="space-y-4">
                {phones.map((phone) => (
                  <div key={phone.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{phone.phone}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getClientName(phone.clientId)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline">
                          {getPhoneTypeLabel(phone.type)}
                        </Badge>
                        <Badge variant={phone.isActive ? "default" : "secondary"}>
                          {phone.isActive ? "Активний" : "Неактивний"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePhone(phone.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}