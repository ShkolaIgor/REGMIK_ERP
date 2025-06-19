import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ClientContactsXmlImport } from "@/components/ClientContactsXmlImport";
import { 
  Search, Plus, Edit, User, Building2, Truck, Package, Percent,
  Users, Phone, Mail, MapPin, UserPlus, Trash2, MoreVertical, Upload, FileText 
} from "lucide-react";
import { Client, type InsertClient } from "@shared/schema";
import ClientForm from "@/components/ClientForm";

// Schema for contact form
const contactFormSchema = z.object({
  clientId: z.string().min(1, "Клієнт обов'язковий"),
  fullName: z.string().min(1, "Повне ім'я обов'язкове"),
  position: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Некоректний email").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Простий компонент пошуку
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

// Мемоізований компонент для списку клієнтів
const ClientsList = React.memo(({ 
  clients, 
  clientTypes, 
  onEdit, 
  onAddContact,
  onViewContacts 
}: {
  clients: Client[];
  clientTypes: any[];
  onEdit: (client: Client) => void;
  onAddContact: (clientId: string) => void;
  onViewContacts?: (clientId: number, clientName: string) => void;
}) => {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {clients.map((client: Client) => (
        <Card key={client.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start space-x-3 mb-3">
              {(() => {
                const clientType = clientTypes?.find((type: any) => type.id === client.clientTypeId);
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
                  const clientType = clientTypes?.find((type: any) => type.id === client.clientTypeId);
                  return clientType?.name === "Фізична особа" ? "ІПН" : "ЄДРПОУ";
                })()}: <span className="font-bold text-base text-foreground">{client.taxCode}</span>
              </CardDescription>
              <div className="flex space-x-1 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onAddContact(client.id.toString())}
                  className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                  title="Додати контакт"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewContacts(client.id, client.name)}
                  className="text-indigo-600 hover:text-indigo-700 h-8 w-8 p-0"
                  title="Переглянути всі контакти"
                >
                  <Users className="h-4 w-4" />
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
                <Button variant="outline" size="sm" onClick={() => onEdit(client)} className="h-8 w-8 p-0">
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
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{client.notes}</p>
                </div>
              )}
              
              {/* Дати створення та оновлення */}
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Створено: {new Date(client.createdAt).toLocaleDateString('uk-UA')}</span>
                  {client.updatedAt && client.updatedAt !== client.createdAt && (
                    <span>Оновлено: {new Date(client.updatedAt).toLocaleDateString('uk-UA')}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [selectedClientForContact, setSelectedClientForContact] = useState<string>("");
  const [isGlobalContactAdd, setIsGlobalContactAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFormData, setContactFormData] = useState({
    fullName: "",
    position: "",
    primaryPhone: "",
    email: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [contactsPopup, setContactsPopup] = useState<{ clientId: number; clientName: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Обробник зміни пошуку
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Дебаунс для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
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

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const openAddContactDialog = (clientId: string) => {
    setSelectedClientForContact(clientId);
    setContactFormData({
      fullName: "",
      position: "",
      primaryPhone: "",
      email: ""
    });
    setIsContactDialogOpen(true);
  };

  const handleViewContacts = (clientId: number, clientName: string) => {
    setContactsPopup({ clientId, clientName });
  };

  const handleDelete = async (clientId: string) => {
    try {
      await apiRequest(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });
      toast({
        title: "Клієнта видалено",
        description: "Клієнта успішно видалено з системи",
      });
      setIsDialogOpen(false);
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити клієнта",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingClient) {
        // Оновлення існуючого клієнта
        await apiRequest(`/api/clients/${editingClient.id}`, {
          method: 'PATCH',
          body: data,
        });
        toast({
          title: "Клієнта оновлено",
          description: "Дані клієнта успішно оновлено",
        });
      } else {
        // Створення нового клієнта
        await apiRequest('/api/clients', {
          method: 'POST',
          body: data,
        });
        toast({
          title: "Клієнта створено",
          description: "Новий клієнт успішно додано до системи",
        });
      }
      setIsDialogOpen(false);
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    } catch (error) {
      toast({
        title: "Помилка",
        description: editingClient ? "Не вдалося оновити клієнта" : "Не вдалося створити клієнта",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Клієнти</h1>
          <p className="text-muted-foreground">
            Управління клієнтами з ЄДРПОУ або ІПН
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Імпорт XML
          </Button>
          <ClientContactsXmlImport />
          <Button onClick={() => {
            setEditingClient(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Додати клієнта
          </Button>
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

      <ClientsList 
        clients={clients}
        clientTypes={clientTypes}
        onEdit={handleEdit}
        onAddContact={openAddContactDialog}
        onViewContacts={handleViewContacts}
      />

      {/* Client Contacts Popup */}
      {contactsPopup && (
        <ClientContactsPopup
          clientId={contactsPopup.clientId}
          clientName={contactsPopup.clientName}
          isOpen={!!contactsPopup}
          onClose={() => setContactsPopup(null)}
        />
      )}

      {/* Пагінація */}
      {clients.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Показано {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} з {total} клієнтів
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">На сторінці:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
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
                  <SelectItem value="1000">Всі</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              Перша
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Попередня
            </Button>
            <div className="flex items-center space-x-1">
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
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
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
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Остання
            </Button>
          </div>
        </div>
      )}

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

      {/* Діалог редагування клієнта */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Редагувати клієнта" : "Додати клієнта"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            editingClient={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingClient(null);
            }}
            onDelete={editingClient ? () => handleDelete(editingClient.id.toString()) : undefined}
            onViewContacts={(clientId, clientName) => {
              setContactsPopup({ clientId, clientName });
              setIsDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Import XML Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Імпорт клієнтів з XML</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    // Викликаємо API для імпорту клієнтів
                    fetch('/api/clients/import', {
                      method: 'POST',
                      body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                      if (data.success) {
                        toast({
                          title: "Імпорт завершено",
                          description: `Імпортовано ${data.imported} клієнтів`,
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                        setIsImportDialogOpen(false);
                      } else {
                        toast({
                          title: "Помилка імпорту",
                          description: data.message || "Не вдалося імпортувати клієнтів",
                          variant: "destructive",
                        });
                      }
                    })
                    .catch(error => {
                      toast({
                        title: "Помилка",
                        description: "Не вдалося завантажити файл",
                        variant: "destructive",
                      });
                    });
                  }
                }}
                className="hidden"
                id="xml-upload"
              />
              <label htmlFor="xml-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium">Оберіть XML файл</p>
                <p className="text-gray-500">або перетягніть файл сюди</p>
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Формат XML файлу:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>EDRPOU - код ЄДРПОУ/ІПН</li>
                <li>PREDPR - коротка назва</li>
                <li>NAME - повна назва</li>
                <li>ADDRESS_PHYS - фізична адреса</li>
                <li>COMMENT - коментар</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Add Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Додати контакт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ім'я контакту *</label>
              <Input 
                placeholder="Введіть ім'я контакту" 
                value={contactFormData.fullName}
                onChange={(e) => setContactFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Посада</label>
              <Input 
                placeholder="Введіть посаду" 
                value={contactFormData.position}
                onChange={(e) => setContactFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Телефон</label>
              <Input 
                placeholder="Введіть номер телефону" 
                value={contactFormData.primaryPhone}
                onChange={(e) => setContactFormData(prev => ({ ...prev, primaryPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input 
                placeholder="Введіть email" 
                value={contactFormData.email}
                onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsContactDialogOpen(false);
                setContactFormData({
                  fullName: "",
                  position: "",
                  primaryPhone: "",
                  email: ""
                });
              }}>
                Скасувати
              </Button>
              <Button 
                disabled={!contactFormData.fullName.trim()}
                onClick={async () => {
                  try {
                    await apiRequest('/api/client-contacts', {
                      method: 'POST',
                      body: {
                        clientId: parseInt(selectedClientForContact),
                        fullName: contactFormData.fullName,
                        position: contactFormData.position || '',
                        email: contactFormData.email || '',
                        primaryPhone: contactFormData.primaryPhone || '',
                        primaryPhoneType: 'mobile',
                        secondaryPhone: '',
                        secondaryPhoneType: 'office',
                        tertiaryPhone: '',
                        tertiaryPhoneType: 'fax',
                        notes: '',
                        isPrimary: false,
                        isActive: true,
                        source: 'manual'
                      }
                    });
                    
                    toast({
                      title: "Контакт додано",
                      description: "Контакт успішно створено",
                    });
                    
                    queryClient.invalidateQueries({ queryKey: ['/api/client-contacts'] });
                    setIsContactDialogOpen(false);
                    setContactFormData({
                      fullName: "",
                      position: "",
                      primaryPhone: "",
                      email: ""
                    });
                  } catch (error) {
                    toast({
                      title: "Помилка",
                      description: "Не вдалося створити контакт",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Додати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Contacts Popup */}
      {contactsPopup && (
        <ClientContactsPopup
          clientId={contactsPopup.clientId}
          clientName={contactsPopup.clientName}
          isOpen={!!contactsPopup}
          onClose={() => setContactsPopup(null)}
        />
      )}
    </div>
  );
}