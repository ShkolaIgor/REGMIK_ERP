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
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Carrier {
  id: number;
  name: string;
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
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function Carriers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    serviceType: "",
    rating: 5,
    apiKey: "",
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

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      serviceType: "",
      rating: 5,
    });
    setEditingCarrier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      rating: Number(formData.rating),
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
      contactPerson: carrier.contactPerson || "",
      email: carrier.email || "",
      phone: carrier.phone || "",
      address: carrier.address || "",
      description: carrier.description || "",
      serviceType: carrier.serviceType || "",
      rating: carrier.rating || 5,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цього перевізника?")) {
      deleteMutation.mutate(id);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Довідник перевізників</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
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
                  <TableCell colSpan={8} className="text-center py-8">
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