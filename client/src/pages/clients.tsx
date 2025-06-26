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
import { ClientsXmlImport } from "@/components/ClientsXmlImport";
import { DataTable } from "@/components/DataTable/DataTable";
import { 
  Search, Plus, Edit, User, Building2, Truck, Package, Percent,
  Users, Phone, Mail, MapPin, UserPlus, Trash2, MoreVertical, Upload, FileText, Download 
} from "lucide-react";
import { Client, type InsertClient } from "@shared/schema";
import ClientForm from "@/components/ClientForm";

// ClientContactsPopup компонент
function ClientContactsPopup({ 
  clientId, 
  clientName, 
  isOpen, 
  onClose 
}: { 
  clientId: number; 
  clientName: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { data: contacts = [] } = useQuery({
    queryKey: [`/api/client-contacts/${clientId}`],
    enabled: isOpen && !!clientId
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Контакти клієнта: {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              У цього клієнта поки немає контактів
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contacts.map((contact: any) => (
                <Card key={contact.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{contact.fullName}</h4>
                      {contact.isMain && (
                        <Badge variant="outline" className="text-xs">
                          Основний
                        </Badge>
                      )}
                    </div>
                    {contact.position && (
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    )}
                    {contact.primaryPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.primaryPhone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

              {client.isCustomer && (
                <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                  Покупець
                </Badge>
              )}

              {client.isSupplier && (
                <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
                  Постачальник
                </Badge>
              )}

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

  const { data: clientsData, isLoading, isError, error: clientsError } = useQuery({
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

  // Підготовка даних для DataTable
  const columns = [
    {
      key: "name",
      label: "Назва клієнта",
      sortable: true,
      width: 200,
      render: (value: string, client: any) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: "taxCode", 
      label: "ЄДРПОУ/ІПН",
      sortable: true,
      width: 150,
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: "clientType",
      label: "Тип",
      sortable: true,
      width: 120,
      render: (value: string, client: any) => {
        const clientType = clientTypes?.find((type: any) => type.id === client.clientTypeId);
        return (
          <div className="flex items-center gap-2">
            {clientType?.name === "Юридична особа" ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <User className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm">{value}</span>
          </div>
        );
      }
    },
    {
      key: "isActive",
      label: "Статус",
      sortable: true,
      width: 100,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Активний" : "Неактивний"}
        </Badge>
      )
    },
    {
      key: "discount",
      label: "Знижка",
      sortable: true,
      width: 100,
      render: (value: string, client: any) => {
        const discountValue = parseFloat(client.discount || "0");
        return discountValue > 0 ? (
          <Badge variant="outline" className="text-green-600 text-xs">
            <Percent className="h-3 w-3 mr-1" />
            -{discountValue}%
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">0%</span>
        );
      }
    },
    {
      key: "createdAt",
      label: "Створено",
      sortable: true,
      width: 120,
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">{value}</span>
      )
    }
  ];

  // Обробка даних для відображення в таблиці
  const processedClients = clients.map(client => {
    const clientType = clientTypes?.find((type: any) => type.id === client.clientTypeId);
    return {
      ...client,
      clientType: clientType?.name || "Невизначено",
      createdAt: new Date(client.createdAt).toLocaleDateString('uk-UA')
    };
  });

  // Card template для відображення клієнтів у режимі карток
  const clientCardTemplate = (client: any) => (
    <Card key={client.id} className="h-full">
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
              onClick={() => openAddContactDialog(client.id.toString())}
              className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
              title="Додати контакт"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewContacts(client.id, client.name)}
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
            <Button variant="outline" size="sm" onClick={() => handleEdit(client)} className="h-8 w-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={client.isActive ? "default" : "secondary"} className="text-xs">
            {client.isActive ? "Активний" : "Неактивний"}
          </Badge>

          {client.isCustomer && (
            <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
              Покупець
            </Badge>
          )}

          {client.isSupplier && (
            <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
              Постачальник
            </Badge>
          )}

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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="w-full px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                    Клієнти
                  </h1>
                  <p className="text-gray-600 mt-1">Управління базою клієнтів з ЄДРПОУ або ІПН</p>
                </div>
              </div>
            </div>
          <div className="flex items-center space-x-4">
            <ClientsXmlImport />
            <ClientContactsXmlImport />
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Download className="h-4 w-4 mr-2" />
              Експорт
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => {
                setEditingClient(null);
                setIsDialogOpen(true);
              }}>
              <Plus className="mr-2 h-4 w-4" />
              Додати клієнта
            </Button>
          </div>
            </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього клієнтів</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{total}</p>
                  <p className="text-xs text-blue-600">Активних та неактивних</p>
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
                    <User className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Покупці</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{clients.filter(c => c.isCustomer).length}</p>
                  <p className="text-xs text-emerald-600">Активних покупців</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
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
                    <Truck className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Постачальники</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{clients.filter(c => c.isSupplier).length}</p>
                  <p className="text-xs text-purple-600">Активних постачальників</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Truck className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Юридичні особи</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{clients.filter(c => {
                    const clientType = clientTypes?.find((type: any) => type.id === c.clientTypeId);
                    return clientType?.name === "Юридична особа";
                  }).length}</p>
                  <p className="text-xs text-orange-600">Компаній у системі</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        {/* DataTable Section */}            
        <div className="w-full space-y-6 flex-1 overflow-auto">
          <DataTable
            data={processedClients}
            columns={columns}
            title="Список клієнтів"
            description="Оберіть клієнта для перегляду та редагування"
            searchPlaceholder="Пошук клієнтів за назвою, ЄДРПОУ або типом..."
            loading={isLoading}
            cardTemplate={clientCardTemplate}
            storageKey="clients"
            onRowClick={(client) => handleEdit(client)}
            actions={(client) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(client)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
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

      {/* Dialog for creating/editing clients */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Редагувати клієнта" : "Додати клієнта"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSubmit={handleSubmit}
            onDelete={editingClient ? handleDelete : undefined}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
      </div>
  );
}