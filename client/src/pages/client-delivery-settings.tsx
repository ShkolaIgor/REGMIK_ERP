import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Plus, Edit2, Trash2, Star, StarOff, ArrowLeft, Package, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { ClientNovaPoshtaSettings, InsertClientNovaPoshtaSettings } from "@shared/schema";
import NovaPoshtaDeliverySettingsForm from "@/components/NovaPoshtaDeliverySettingsForm";

export default function ClientDeliverySettings() {
  const [, params] = useRoute("/clients/:id/delivery-settings");
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
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      setIsFormOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування доставки створено успішно",
      });
    },
    onError: (error) => {
      console.error("Error creating delivery settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити налаштування доставки",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertClientNovaPoshtaSettings> }) =>
      apiRequest(`/api/nova-poshta-settings/${id}`, {
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "nova-poshta-settings"] });
      setEditingSettings(null);
      setIsFormOpen(false);
      toast({
        title: "Успіх",
        description: "Налаштування доставки оновлено успішно",
      });
    },
    onError: (error) => {
      console.error("Error updating delivery settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити налаштування доставки",
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
        description: "Налаштування доставки видалено успішно",
      });
    },
    onError: (error) => {
      console.error("Error deleting delivery settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити налаштування доставки",
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
        description: "Основні налаштування доставки оновлено",
      });
    },
    onError: (error) => {
      console.error("Error setting primary delivery settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося встановити основні налаштування",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    if (editingSettings) {
      updateMutation.mutate({ id: editingSettings.id, data });
    } else {
      const dataWithClientId = {
        ...data,
        clientId: parseInt(clientId.toString()),
      };
      createMutation.mutate(dataWithClientId);
    }
  };

  const handleEdit = (settings: ClientNovaPoshtaSettings) => {
    setEditingSettings(settings);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити це налаштування доставки?")) {
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
          <h1 className="text-2xl font-bold">Налаштування доставки Nova Poshta</h1>
          <p className="text-muted-foreground">
            Клієнт: {client?.name || "Завантаження..."}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">
          Адреси та преференції доставки ({settings.length})
        </h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSettings(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Додати налаштування доставки
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSettings ? "Редагувати налаштування доставки" : "Додати налаштування доставки"}
              </DialogTitle>
              <DialogDescription>
                Налаштування адрес і преференцій доставки Nova Poshta для клієнта
              </DialogDescription>
            </DialogHeader>
            <NovaPoshtaDeliverySettingsForm
              onSubmit={handleSubmit}
              defaultValues={editingSettings || undefined}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onSuccess={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Немає налаштувань доставки Nova Poshta для цього клієнта
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
        <div className="grid gap-6">
          {settings.map((setting: ClientNovaPoshtaSettings) => (
            <Card key={setting.id} className={setting.isPrimary ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Налаштування доставки #{setting.id}
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
                        title="Зробити основним"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      title="Редагувати"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting.id)}
                      disabled={deleteMutation.isPending}
                      title="Видалити"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Інформація про отримувача */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Отримувач
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {setting.recipientName && (
                        <p><span className="font-medium">Ім'я:</span> {setting.recipientName}</p>
                      )}
                      {setting.recipientPhone && (
                        <p><span className="font-medium">Телефон:</span> {setting.recipientPhone}</p>
                      )}
                      {setting.recipientEmail && (
                        <p><span className="font-medium">Email:</span> {setting.recipientEmail}</p>
                      )}
                      {!setting.recipientName && !setting.recipientPhone && !setting.recipientEmail && (
                        <p className="text-muted-foreground italic">Не налаштовано</p>
                      )}
                    </div>
                  </div>

                  {/* Адреса доставки */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Адреса доставки
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {setting.deliveryCityName && (
                        <p><span className="font-medium">Місто:</span> {setting.deliveryCityName}</p>
                      )}
                      {setting.deliveryCityRef && (
                        <p><span className="font-medium">Референс міста:</span> {setting.deliveryCityRef}</p>
                      )}
                      {setting.deliveryWarehouseAddress && (
                        <p><span className="font-medium">Відділення:</span> {setting.deliveryWarehouseAddress}</p>
                      )}
                      {setting.deliveryWarehouseRef && (
                        <p><span className="font-medium">Референс відділення:</span> {setting.deliveryWarehouseRef}</p>
                      )}
                      {!setting.deliveryCityName && !setting.deliveryWarehouseAddress && (
                        <p className="text-muted-foreground italic">Не налаштовано</p>
                      )}
                    </div>
                  </div>

                  {/* Налаштування доставки */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Преференції
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-medium">Тип доставки:</span> {getServiceTypeLabel(setting.preferredServiceType || '')}</p>
                      <p><span className="font-medium">Спосіб оплати:</span> {getPaymentMethodLabel(setting.preferredPaymentMethod || '')}</p>
                      <p><span className="font-medium">Платник:</span> {getPayerLabel(setting.preferredPayer || '')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Створено: {new Date(setting.createdAt || '').toLocaleDateString('uk-UA')}</span>
                    {setting.updatedAt && (
                      <span>Оновлено: {new Date(setting.updatedAt).toLocaleDateString('uk-UA')}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}