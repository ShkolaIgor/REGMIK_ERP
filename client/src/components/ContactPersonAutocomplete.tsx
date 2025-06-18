import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactFormSchema = z.object({
  fullName: z.string().min(1, "Ім'я обов'язкове"),
  position: z.string().optional(),
  email: z.string().email("Неправильний формат email").optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  primaryPhoneType: z.enum(["mobile", "office", "home", "fax"]).default("mobile"),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactPersonAutocompleteProps {
  clientId?: number;
  value?: string;
  onChange: (contactId?: number, contactName?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ContactPersonAutocomplete({ 
  clientId, 
  value, 
  onChange, 
  placeholder = "Введіть ім'я контактної особи...",
  disabled = false 
}: ContactPersonAutocompleteProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Форма для створення нового контакту
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      position: "",
      email: "",
      primaryPhone: "",
      primaryPhoneType: "mobile",
      isPrimary: false,
      isActive: true,
    },
  });

  // Запит для завантаження контактів клієнта
  const { data: contactsData = [] } = useQuery({
    queryKey: ["/api/client-contacts", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const response = await fetch(`/api/client-contacts?clientId=${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      return data.clientContacts || [];
    },
    enabled: !!clientId,
  });

  // Мутація для створення нового контакту
  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (!clientId) throw new Error("Client ID is required");
      
      return apiRequest("/api/client-contacts", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          clientId,
        }),
      });
    },
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client-contacts", clientId] });
      setIsCreateDialogOpen(false);
      contactForm.reset();
      
      // Автоматично вибираємо новий контакт
      setSelectedContactId(newContact.id);
      setSearchValue(newContact.fullName);
      onChange(newContact.id, newContact.fullName);
      
      toast({
        title: "Успіх",
        description: "Контакт створено та обрано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити контакт",
        variant: "destructive",
      });
    },
  });

  // Фільтрація контактів за пошуковим запитом
  const filteredContacts = contactsData.filter((contact: any) =>
    contact.fullName.toLowerCase().includes(searchValue.toLowerCase()) ||
    (contact.position && contact.position.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Обробка вибору контакту
  const handleSelectContact = (contact: any) => {
    setSelectedContactId(contact.id);
    setSearchValue(contact.fullName);
    setIsDropdownOpen(false);
    onChange(contact.id, contact.fullName);
  };

  // Обробка зміни тексту в полі пошуку
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    
    if (newValue.length >= 1) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }

    // Якщо поле очищено, скидаємо вибір
    if (!newValue) {
      setSelectedContactId(undefined);
      onChange(undefined, undefined);
    }
  };

  // Обробка фокусу на полі
  const handleFocus = () => {
    if (searchValue && clientId) {
      setIsDropdownOpen(true);
    }
  };

  // Ініціалізація значення при зміні value prop
  useEffect(() => {
    if (value && contactsData.length > 0) {
      const contact = contactsData.find((c: any) => c.fullName === value);
      if (contact) {
        setSelectedContactId(contact.id);
        setSearchValue(contact.fullName);
      } else {
        setSearchValue(value);
      }
    } else if (!value) {
      setSearchValue("");
      setSelectedContactId(undefined);
    }
  }, [value, contactsData]);

  // Обробка створення нового контакту
  const handleCreateContact = (data: ContactFormData) => {
    createContactMutation.mutate(data);
  };

  // Відкриття діалогу створення з автозаповненням імені
  const openCreateDialog = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    contactForm.setValue("fullName", searchValue);
    setIsCreateDialogOpen(true);
    setIsDropdownOpen(false);
  };

  if (!clientId) {
    return (
      <Input
        placeholder="Спочатку оберіть клієнта"
        disabled={true}
        className="bg-gray-50"
      />
    );
  }

  return (
    <div className="relative">
      <Input
        value={searchValue}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 300)}
        placeholder={placeholder}
        disabled={disabled}
        className={selectedContactId ? "border-green-500" : ""}
      />

      {isDropdownOpen && searchValue && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            <>
              {filteredContacts.map((contact: any) => (
                <div
                  key={contact.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <div className="font-medium">{contact.fullName}</div>
                      {contact.position && (
                        <div className="text-sm text-gray-500">{contact.position}</div>
                      )}
                      {contact.primaryPhone && (
                        <div className="text-sm text-gray-500">{contact.primaryPhone}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 rounded-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openCreateDialog(e);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Додати контакт "{searchValue}"
                </Button>
              </div>
            </>
          ) : (
            <div className="px-3 py-2">
              <div className="text-gray-500 text-sm mb-2">Контакт не знайдено</div>
              <Button
                variant="ghost"
                className="w-full justify-start px-0 py-1"
                onMouseDown={(e) => {
                  e.preventDefault();
                  openCreateDialog(e);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати контакт "{searchValue}"
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Діалог створення нового контакту */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Додати новий контакт</DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(handleCreateContact)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Повне ім'я *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Введіть повне ім'я" />
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
                      <Input {...field} placeholder="Введіть посаду" />
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
                      <Input {...field} type="email" placeholder="Введіть email" />
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
                      <Input {...field} placeholder="Введіть номер телефону" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  disabled={createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? "Створення..." : "Створити"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}