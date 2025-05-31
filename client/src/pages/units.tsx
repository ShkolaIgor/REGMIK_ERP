import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Ruler, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Unit {
  id: number;
  name: string;
  shortName: string;
  type: string;
  baseUnit: string | null;
  conversionFactor: string;
  description: string | null;
  createdAt: Date | null;
}

const unitTypes = [
  { value: "weight", label: "Вага", icon: "⚖️" },
  { value: "volume", label: "Об'єм", icon: "🧪" },
  { value: "length", label: "Довжина", icon: "📏" },
  { value: "area", label: "Площа", icon: "📐" },
  { value: "count", label: "Кількість", icon: "🔢" },
  { value: "time", label: "Час", icon: "⏰" },
  { value: "electrical", label: "Електричні", icon: "⚡" },
  { value: "temperature", label: "Температура", icon: "🌡️" }
];

export default function Units() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    type: "",
    baseUnit: "",
    conversionFactor: "1",
    description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Запит одиниць виміру
  const { data: units = [], isLoading } = useQuery({
    queryKey: ["/api/units"],
  });

  // Мутація створення
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/units", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      setIsDialogOpen(false);
      setEditingUnit(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Одиницю виміру створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити одиницю виміру",
        variant: "destructive",
      });
    },
  });

  // Мутація оновлення
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/units/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      setIsDialogOpen(false);
      setEditingUnit(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Одиницю виміру оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити одиницю виміру",
        variant: "destructive",
      });
    },
  });

  // Мутація видалення
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/units/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Успіх",
        description: "Одиницю виміру видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити одиницю виміру",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      shortName: "",
      type: "",
      baseUnit: "",
      conversionFactor: "1",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      conversionFactor: formData.conversionFactor || "1",
      baseUnit: formData.baseUnit || null,
      description: formData.description || null,
    };

    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      shortName: unit.shortName,
      type: unit.type,
      baseUnit: unit.baseUnit || "",
      conversionFactor: unit.conversionFactor,
      description: unit.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Ви впевнені, що хочете видалити цю одиницю виміру?")) {
      deleteMutation.mutate(id);
    }
  };

  // Фільтрування одиниць
  const filteredUnits = units.filter((unit: Unit) => {
    const matchesSearch = 
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.shortName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || unit.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Групування за типами
  const unitsByType = unitTypes.reduce((acc, type) => {
    acc[type.value] = filteredUnits.filter((unit: Unit) => unit.type === type.value);
    return acc;
  }, {} as Record<string, Unit[]>);

  const getTypeLabel = (type: string) => {
    return unitTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    return unitTypes.find(t => t.value === type)?.icon || "📏";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Одиниці виміру</h1>
          <p className="text-gray-600 mt-2">
            Управління одиницями виміру для продуктів та матеріалів
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUnit(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Додати одиницю
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUnit ? "Редагувати одиницю виміру" : "Нова одиниця виміру"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Назва</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Кілограм"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shortName">Скорочення</Label>
                  <Input
                    id="shortName"
                    value={formData.shortName}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value }))}
                    placeholder="кг"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Тип</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="conversionFactor">Коефіцієнт конвертації</Label>
                  <Input
                    id="conversionFactor"
                    type="number"
                    step="0.000001"
                    value={formData.conversionFactor}
                    onChange={(e) => setFormData(prev => ({ ...prev, conversionFactor: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="baseUnit">Базова одиниця</Label>
                <Input
                  id="baseUnit"
                  value={formData.baseUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUnit: e.target.value }))}
                  placeholder="г (для кг), мл (для л), тощо"
                />
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Додаткова інформація про одиницю виміру"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingUnit ? "Оновити" : "Створити"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Пошук</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Пошук за назвою або скороченням..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="typeFilter">Тип</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі типи</SelectItem>
                  {unitTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ruler className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{units.length}</p>
                <p className="text-sm text-gray-600">Всього одиниць</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {unitTypes.slice(0, 3).map((type) => (
          <Card key={type.value}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="text-2xl font-bold">
                    {units.filter((u: Unit) => u.type === type.value).length}
                  </p>
                  <p className="text-sm text-gray-600">{type.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Таблиця одиниць згрупована за типами */}
      {selectedType === "all" ? (
        <div className="space-y-6">
          {unitTypes.map((type) => {
            const typeUnits = unitsByType[type.value];
            if (!typeUnits || typeUnits.length === 0) return null;

            return (
              <Card key={type.value}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    {type.label}
                    <Badge variant="secondary">{typeUnits.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Назва</TableHead>
                        <TableHead>Скорочення</TableHead>
                        <TableHead>Базова одиниця</TableHead>
                        <TableHead>Коефіцієнт</TableHead>
                        <TableHead>Опис</TableHead>
                        <TableHead>Дії</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeUnits.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell className="font-medium">{unit.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{unit.shortName}</Badge>
                          </TableCell>
                          <TableCell>
                            {unit.baseUnit ? (
                              <span className="text-sm">{unit.baseUnit}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {unit.conversionFactor !== "1" ? (
                              <span className="text-sm font-mono">{unit.conversionFactor}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {unit.description ? (
                              <span className="text-sm">{unit.description}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(unit)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(unit.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(selectedType)}</span>
              {getTypeLabel(selectedType)}
              <Badge variant="secondary">{filteredUnits.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Завантаження...</div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Одиниці виміру не знайдено
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва</TableHead>
                    <TableHead>Скорочення</TableHead>
                    <TableHead>Базова одиниця</TableHead>
                    <TableHead>Коефіцієнт</TableHead>
                    <TableHead>Опис</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{unit.shortName}</Badge>
                      </TableCell>
                      <TableCell>
                        {unit.baseUnit ? (
                          <span className="text-sm">{unit.baseUnit}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.conversionFactor !== "1" ? (
                          <span className="text-sm font-mono">{unit.conversionFactor}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.description ? (
                          <span className="text-sm">{unit.description}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}