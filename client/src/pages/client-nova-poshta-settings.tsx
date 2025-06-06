import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Plus, Edit2, Trash2, Star, StarOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { ClientNovaPoshtaSettings, InsertClientNovaPoshtaSettings } from "@shared/schema";
import NovaPoshtaSettingsForm from "@/components/NovaPoshtaSettingsForm";

export default function ClientNovaPoshtaSettings() {
  const [, params] = useRoute("/clients/:id/nova-poshta-settings");
  const clientId = parseInt(params?.id || "0");
  const [editingSettings, setEditingSettings] = useState<ClientNovaPoshtaSettings | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["/api/clients", clientId, "nova-poshta-settings"],
    queryFn: () => apiRequest(`/api/clients/${clientId}/nova-poshta-settings`),
    enabled: !!clientId,
  });

  const { data: client } = useQuery({
    queryKey: ["/api/clients", clientId],
    queryFn: () => apiRequest(`/api/clients/${clientId}`),
    enabled: !!clientId,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClientNovaPoshtaSettings) =>
      apiRequest(`/api/clients/${clientId}/nova-poshta-settings`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      setIsFormOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування Нової Пошти створено успішно",
      });
    },
    onError: (error) => {
      console.error("Error creating Nova Poshta settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити налаштування Нової Пошти",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClientNovaPoshtaSettings> }) =>
      apiRequest(`/api/nova-poshta-settings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      setEditingSettings(null);
      setIsFormOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування Нової Пошти оновлено успішно",
      });
    },
    onError: (error) => {
      console.error("Error updating Nova Poshta settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування Нової Пошти",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/nova-poshta-settings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      toast({
        title: "Успіх",
        description: "Налаштування Нової Пошти видалено успішно",
      });
    },
    onError: (error) => {
      console.error("Error deleting Nova Poshta settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити налаштування Нової Пошти",
        variant: "destructive",
      });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (settingsId: number) =>
      apiRequest(`/api/clients/${clientId}/nova-poshta-settings/${settingsId}/set-primary`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      toast({
        title: "Успіх",
        description: "Основні налаштування Нової Пошти оновлено",
      });
    },
    onError: (error) => {
      console.error("Error setting primary Nova Poshta settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося встановити основні налаштування",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertClientNovaPoshtaSettings) => {
    if (editingSettings) {
      updateMutation.mutate({ id: editingSettings.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (settings: ClientNovaPoshtaSettings) => {
    setEditingSettings(settings);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити це налаштування?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetPrimary = (settingsId: number) => {
    setPrimaryMutation.mutate(settingsId);
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'WarehouseWarehouse': 'Відділення - Відділення',
      'WarehouseDoors': 'Відділення - Двері',
      'DoorsWarehouse': 'Двері - Відділення',
      'DoorsDoors': 'Двері - Двері'
    };
    return labels[type] || type;
  };

  const getCargoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Parcel': 'Посилка',
      'Cargo': 'Вантаж'
    };
    return labels[type] || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'Cash': 'Готівка',
      'NonCash': 'Безготівкова'
    };
    return labels[method] || method;
  };

  const getPayerLabel = (payer: string) => {
    const labels: Record<string, string> = {
      'Sender': 'Відправник',
      'Recipient': 'Отримувач',
      'ThirdPerson': 'Третя особа'
    };
    return labels[payer] || payer;
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад до клієнтів
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Налаштування Нової Пошти</h1>
          <p className="text-muted-foreground">
            Клієнт: {client?.name || "Завантаження..."}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          Налаштування API ({settings.length})
        </h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSettings(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Додати налаштування
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSettings ? "Редагувати налаштування" : "Додати налаштування"}
              </DialogTitle>
              <DialogDescription>
                Налаштування API Нової Пошти для клієнта
              </DialogDescription>
            </DialogHeader>
            <NovaPoshtaSettingsForm
              onSubmit={handleSubmit}
              defaultValues={editingSettings || undefined}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Немає налаштувань Нової Пошти для цього клієнта
            </p>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingSettings(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати перше налаштування
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {settings.map((setting: ClientNovaPoshtaSettings) => (
            <Card key={setting.id} className={setting.isPrimary ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      API ключ: {setting.apiKey.substring(0, 10)}...
                    </CardTitle>
                    {setting.isPrimary && (
                      <Badge variant="default">
                        <Star className="h-3 w-3 mr-1" />
                        Основний
                      </Badge>
                    )}
                    {!setting.isActive && (
                      <Badge variant="secondary">Неактивний</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!setting.isPrimary && setting.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(setting.id)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {setting.description && (
                  <CardDescription>{setting.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Відправник</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {setting.senderRef && (
                        <p><span className="font-medium">Референс:</span> {setting.senderRef}</p>
                      )}
                      {setting.senderAddress && (
                        <p><span className="font-medium">Адреса:</span> {setting.senderAddress}</p>
                      )}
                      {setting.senderPhone && (
                        <p><span className="font-medium">Телефон:</span> {setting.senderPhone}</p>
                      )}
                      {setting.senderContact && (
                        <p><span className="font-medium">Контакт:</span> {setting.senderContact}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Налаштування за замовчуванням</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><span className="font-medium">Тип доставки:</span> {getServiceTypeLabel(setting.defaultServiceType || '')}</p>
                      <p><span className="font-medium">Тип вантажу:</span> {getCargoTypeLabel(setting.defaultCargoType || '')}</p>
                      <p><span className="font-medium">Спосіб оплати:</span> {getPaymentMethodLabel(setting.defaultPaymentMethod || '')}</p>
                      <p><span className="font-medium">Платник:</span> {getPayerLabel(setting.defaultPayer || '')}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Створено: {new Date(setting.createdAt || '').toLocaleDateString('uk-UA')}
                  {setting.updatedAt && (
                    <span className="ml-4">
                      Оновлено: {new Date(setting.updatedAt).toLocaleDateString('uk-UA')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}