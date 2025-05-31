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
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Component {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  unit: string;
  costPrice: string;
  supplier: string | null;
  partNumber: string | null;
  category: string | null;
  manufacturer: string | null;
  uktzedCode: string | null;
  packageTypeId: number | null;
  minStock: number | null;
  maxStock: number | null;
  createdAt: Date | null;
}

export default function Components() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "шт",
    costPrice: "",
    supplier: "",
    partNumber: "",
    category: "",
    manufacturer: "",
    uktzedCode: "",
    packageTypeId: "",
    minStock: "",
    maxStock: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: components = [], isLoading } = useQuery<Component[]>({
    queryKey: ["/api/components"],
  });

  const { data: packageTypes = [] } = useQuery({
    queryKey: ["/api/package-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/components", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Компонент створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити компонент",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/components/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      setIsDialogOpen(false);
      setEditingComponent(null);
      resetForm();
      toast({
        title: "Успіх",
        description: "Компонент оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити компонент",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/components/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/components"] });
      toast({
        title: "Успіх",
        description: "Компонент видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити компонент",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      unit: "шт",
      costPrice: "",
      supplier: "",
      partNumber: "",
      category: "",
      manufacturer: "",
      uktzedCode: "",
      packageTypeId: "",
      minStock: "",
      maxStock: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      costPrice: formData.costPrice || "0",
      minStock: formData.minStock ? parseInt(formData.minStock) : null,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
      packageTypeId: formData.packageTypeId && formData.packageTypeId !== "none" ? parseInt(formData.packageTypeId) : null,
    };

    if (editingComponent) {
      updateMutation.mutate({ id: editingComponent.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      sku: component.sku,
      description: component.description || "",
      unit: component.unit,
      costPrice: component.costPrice,
      supplier: component.supplier || "",
      partNumber: component.partNumber || "",
      category: component.category || "",
      manufacturer: component.manufacturer || "",
      uktzedCode: component.uktzedCode || "",
      packageTypeId: component.packageTypeId?.toString() || "none",
      minStock: component.minStock?.toString() || "",
      maxStock: component.maxStock?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей компонент?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (component.supplier && component.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Компоненти</h1>
          <p className="text-gray-600">Управління компонентами для складу продуктів</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingComponent(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Додати компонент
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingComponent ? "Редагувати компонент" : "Новий компонент"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Назва *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Назва компонента"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku">Артикул *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="Артикул"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опис компонента"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unit">Одиниця виміру</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="шт">шт</SelectItem>
                      <SelectItem value="кг">кг</SelectItem>
                      <SelectItem value="л">л</SelectItem>
                      <SelectItem value="м">м</SelectItem>
                      <SelectItem value="м²">м²</SelectItem>
                      <SelectItem value="м³">м³</SelectItem>
                      <SelectItem value="комплект">комплект</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="costPrice">Собівартість</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Категорія</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Категорія"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier">Постачальник</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Назва постачальника"
                  />
                </div>

                <div>
                  <Label htmlFor="partNumber">Номер деталі</Label>
                  <Input
                    id="partNumber"
                    value={formData.partNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                    placeholder="Номер деталі"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Виробник</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Виробник"
                  />
                </div>

                <div>
                  <Label htmlFor="uktzedCode">Код УКТЗЕД</Label>
                  <Input
                    id="uktzedCode"
                    value={formData.uktzedCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, uktzedCode: e.target.value }))}
                    placeholder="Код УКТЗЕД"
                  />
                </div>

                <div>
                  <Label htmlFor="packageTypeId">Тип корпусу</Label>
                  <Select
                    value={formData.packageTypeId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, packageTypeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип корпусу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без типу корпусу</SelectItem>
                      {packageTypes.map((packageType: any) => (
                        <SelectItem key={packageType.id} value={packageType.id.toString()}>
                          {packageType.name}
                          {packageType.description && ` - ${packageType.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Мін. залишок</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStock">Макс. залишок</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingComponent ? "Оновити" : "Створити"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Пошук компонентів..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Компоненти ({filteredComponents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredComponents.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Компоненти не знайдено</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Артикул</TableHead>
                  <TableHead>Категорія</TableHead>
                  <TableHead>Тип корпусу</TableHead>
                  <TableHead>Одиниця</TableHead>
                  <TableHead>Собівартість</TableHead>
                  <TableHead>Постачальник</TableHead>
                  <TableHead>Залишки</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponents.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{component.name}</div>
                        {component.description && (
                          <div className="text-sm text-gray-500">{component.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{component.sku}</TableCell>
                    <TableCell>
                      {component.category ? (
                        <Badge variant="secondary">{component.category}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {component.packageTypeId ? (
                        (() => {
                          const packageType = packageTypes.find((pt: any) => pt.id === component.packageTypeId);
                          return packageType ? (
                            <Badge variant="outline">{packageType.name}</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{component.unit}</TableCell>
                    <TableCell>{parseFloat(component.costPrice).toFixed(2)} грн</TableCell>
                    <TableCell>
                      {component.supplier || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {component.minStock && component.maxStock ? (
                        <span className="text-sm">
                          {component.minStock} — {component.maxStock}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(component)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(component.id)}
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
    </div>
  );
}