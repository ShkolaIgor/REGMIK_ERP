import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Star, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Carrier {
  id: number;
  name: string;
  alternativeNames: string[] | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  serviceType: string | null;
  rating: number | null;
  isActive: boolean;
  apiKey: string | null;
  lastSyncAt: Date | null;
  citiesCount: number;
  warehousesCount: number;
  syncTime: string | null;
  syncInterval: number | null;
  autoSync: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Carriers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    alternativeNames: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    serviceType: "",
    rating: 5,
    apiKey: "",
    syncTime: "",
    syncInterval: 24,
    autoSync: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: carriers = [], isLoading } = useQuery({
    queryKey: ["/api/carriers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Помилка створення перевізника");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Перевізника створено успішно" });
    },
    onError: () => {
      toast({ title: "Помилка створення перевізника", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/carriers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Помилка оновлення перевізника");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Перевізника оновлено успішно" });
    },
    onError: () => {
      toast({ title: "Помилка оновлення перевізника", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/carriers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Помилка видалення перевізника");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ title: "Перевізника видалено успішно" });
    },
    onError: () => {
      toast({ title: "Помилка видалення перевізника", variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/carriers/${id}/sync`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Помилка синхронізації даних");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/carriers"] });
      toast({ 
        title: "Синхронізацію завершено успішно",
        description: `Синхронізовано: ${data.citiesCount} міст, ${data.warehousesCount} відділень`
      });
    },
    onError: () => {
      toast({ 
        title: "Помилка синхронізації", 
        description: "Перевірте API ключ та налаштування перевізника",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      alternativeNames: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      serviceType: "",
      rating: 5,
      apiKey: "",
      autoUpdateEnabled: false,
      updateTime: "06:00",
      updateDays: "1,2,3,4,5",
    });
    setEditingCarrier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      rating: Number(formData.rating),
      alternativeNames: formData.alternativeNames ? 
        formData.alternativeNames.split(',').map(name => name.trim()).filter(name => name) : 
        null,
      autoUpdateEnabled: formData.autoUpdateEnabled || false,
      updateTime: formData.updateTime || "06:00",
      updateDays: formData.updateDays || "1,2,3,4,5",
    };

    if (editingCarrier) {
      updateMutation.mutate({ id: editingCarrier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    setFormData({
      name: carrier.name,
      alternativeNames: carrier.alternativeNames ? carrier.alternativeNames.join(', ') : "",
      contactPerson: carrier.contactPerson || "",
      email: carrier.email || "",
      phone: carrier.phone || "",
      address: carrier.address || "",
      description: carrier.description || "",
      serviceType: carrier.serviceType || "",
      rating: carrier.rating || 5,
      apiKey: carrier.apiKey || "",
      autoUpdateEnabled: (carrier as any).autoUpdateEnabled || false,
      updateTime: (carrier as any).updateTime || "06:00", 
      updateDays: (carrier as any).updateDays || "1,2,3,4,5",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цього перевізника?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSync = (carrierId: number) => {
    if (confirm("Розпочати синхронізацію з Nova Poshta? Це може зайняти кілька хвилин.")) {
      syncMutation.mutate(carrierId);
    }
  };

  const getRatingStars = (rating: number | null) => {
    const stars = [];
    const ratingValue = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= ratingValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  if (isLoading) {
    return <div>Завантаження...</div>;
  }

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                  Довідник перевізників
                </h1>
                <p className="text-orange-100 text-xl font-medium">Управління перевізниками та службами доставки</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Додати перевізника
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCarrier ? "Редагувати перевізника" : "Додати перевізника"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Назва *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="alternativeNames">Альтернативні назви</Label>
                  <Input
                    id="alternativeNames"
                    value={formData.alternativeNames}
                    onChange={(e) => setFormData({ ...formData, alternativeNames: e.target.value })}
                    placeholder="Нова пошта, Nova Poshta (розділити комами)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Додаткові назви для розпізнавання перевізника, розділені комами
                  </p>
                </div>
                <div>
                  <Label htmlFor="contactPerson">Контактна особа</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceType">Тип послуг</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип послуг" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">Експрес</SelectItem>
                      <SelectItem value="standard">Стандартна</SelectItem>
                      <SelectItem value="freight">Вантажна</SelectItem>
                      <SelectItem value="international">Міжнародна</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rating">Рейтинг (1-10)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">API ключ</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Введіть API ключ для інтеграції"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                </div>
                
                {/* Налаштування Nova Poshta - показувати тільки для Nova Poshta з API ключем */}
                {formData.apiKey && (formData.name?.toLowerCase().includes('nova') || 
                  formData.name?.toLowerCase().includes('нова') ||
                  (formData.alternativeNames && formData.alternativeNames.split(',').some((name: string) => 
                    name.trim().toLowerCase().includes('nova') || name.trim().toLowerCase().includes('нова')
                  ))) && (
                  <div className="col-span-2">
                    <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                      <h4 className="font-medium text-blue-900">Налаштування автоматичного оновлення Nova Poshta</h4>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoUpdateEnabled"
                          checked={formData.autoUpdateEnabled || false}
                          onChange={(e) => setFormData({ ...formData, autoUpdateEnabled: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="autoUpdateEnabled">Увімкнути автоматичне оновлення даних</Label>
                      </div>

                      {formData.autoUpdateEnabled && (
                        <>
                          <div>
                            <Label htmlFor="updateTime">Час оновлення (години:хвилини)</Label>
                            <Input
                              id="updateTime"
                              type="time"
                              value={formData.updateTime || "06:00"}
                              onChange={(e) => setFormData({ ...formData, updateTime: e.target.value })}
                            />
                            <p className="text-sm text-gray-600 mt-1">Вкажіть час у форматі 24 години (наприклад: 06:00)</p>
                          </div>

                          <div>
                            <Label>Дні тижня для оновлення</Label>
                            <div className="flex space-x-2 mt-2">
                              {[
                                { value: '1', label: 'Пн' },
                                { value: '2', label: 'Вт' },
                                { value: '3', label: 'Ср' },
                                { value: '4', label: 'Чт' },
                                { value: '5', label: 'Пт' },
                                { value: '6', label: 'Сб' },
                                { value: '7', label: 'Нд' }
                              ].map((day) => {
                                const selectedDays = formData.updateDays ? formData.updateDays.split(',') : ['1','2','3','4','5'];
                                const isSelected = selectedDays.includes(day.value);
                                
                                return (
                                  <Button
                                    key={day.value}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      const currentDays = formData.updateDays ? formData.updateDays.split(',') : ['1','2','3','4','5'];
                                      const newDays = isSelected 
                                        ? currentDays.filter(d => d !== day.value)
                                        : [...currentDays, day.value];
                                      setFormData({ ...formData, updateDays: newDays.sort().join(',') });
                                    }}
                                    className="w-10 h-8"
                                  >
                                    {day.label}
                                  </Button>
                                );
                              })}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">Оберіть дні тижня для автоматичного оновлення</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="address">Адреса</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCarrier ? "Зберегти" : "Створити"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список перевізників</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва</TableHead>
                <TableHead>Контактна особа</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Тип послуг</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Синхронізація</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carriers.map((carrier: Carrier) => (
                <TableRow key={carrier.id}>
                  <TableCell className="font-medium">{carrier.name}</TableCell>
                  <TableCell>{carrier.contactPerson || "-"}</TableCell>
                  <TableCell>{carrier.email || "-"}</TableCell>
                  <TableCell>{carrier.phone || "-"}</TableCell>
                  <TableCell>
                    {carrier.serviceType === "express" && "Експрес"}
                    {carrier.serviceType === "standard" && "Стандартна"}
                    {carrier.serviceType === "freight" && "Вантажна"}
                    {carrier.serviceType === "international" && "Міжнародна"}
                    {!carrier.serviceType && "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(carrier.rating)}
                      <span className="text-sm text-gray-500 ml-1">
                        ({carrier.rating || 0})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {carrier.citiesCount && carrier.warehousesCount ? (
                        <>
                          <div className="text-green-600 font-medium">
                            Міста: {carrier.citiesCount.toLocaleString()}
                          </div>
                          <div className="text-blue-600 font-medium">
                            Відділення: {carrier.warehousesCount.toLocaleString()}
                          </div>
                          {carrier.lastSyncAt && (
                            <div className="text-gray-500 text-xs">
                              {new Date(carrier.lastSyncAt).toLocaleString('uk-UA')}
                            </div>
                          )}
                        </>
                      ) : carrier.apiKey ? (
                        <span className="text-yellow-600">Потребує синхронізації</span>
                      ) : (
                        <span className="text-gray-400">API ключ не налаштований</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        carrier.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {carrier.isActive ? "Активний" : "Неактивний"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(carrier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {carrier.apiKey && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(carrier.id)}
                          disabled={syncMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(carrier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {carriers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Немає перевізників для відображення
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}