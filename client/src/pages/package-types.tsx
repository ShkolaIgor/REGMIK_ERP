import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PackageType {
  id: number;
  name: string;
  description: string | null;
  pinCount: number | null;
  solderingType: string | null;
  createdAt: Date | null;
}

export default function PackageTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackageType, setEditingPackageType] = useState<PackageType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pinCount: "",
    solderingType: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packageTypes = [], isLoading } = useQuery<PackageType[]>({
    queryKey: ["/api/package-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/package-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create package type");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Тип корпусу створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити тип корпусу",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/package-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Тип корпусу оновлено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити тип корпусу",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/package-types/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/package-types"] });
      toast({
        title: "Успіх",
        description: "Тип корпусу видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити тип корпусу",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      pinCount: "",
      solderingType: "",
    });
    setEditingPackageType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      pinCount: formData.pinCount ? parseInt(formData.pinCount) : null,
    };

    if (editingPackageType) {
      updateMutation.mutate({ id: editingPackageType.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (packageType: PackageType) => {
    setEditingPackageType(packageType);
    setFormData({
      name: packageType.name,
      description: packageType.description || "",
      pinCount: packageType.pinCount?.toString() || "",
      solderingType: packageType.solderingType || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей тип корпусу?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredPackageTypes = packageTypes.filter(packageType =>
    packageType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (packageType.description && packageType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Типи корпусів</h1>
          <p className="text-gray-600">Керування довідником типів корпусів компонентів</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Додати тип корпусу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPackageType ? "Редагувати тип корпусу" : "Новий тип корпусу"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Назва типу корпусу"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опис типу корпусу"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pinCount">Кількість виводів</Label>
                  <Input
                    id="pinCount"
                    type="number"
                    value={formData.pinCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinCount: e.target.value }))}
                    placeholder="Кількість"
                  />
                </div>

                <div>
                  <Label htmlFor="solderingType">Тип пайки</Label>
                  <Input
                    id="solderingType"
                    value={formData.solderingType}
                    onChange={(e) => setFormData(prev => ({ ...prev, solderingType: e.target.value }))}
                    placeholder="SMD, DIP, BGA"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPackageType ? "Оновити" : "Створити"}
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
              placeholder="Пошук типів корпусів..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Package Types Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Типи корпусів ({filteredPackageTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPackageTypes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Типи корпусів не знайдено</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead>Кількість виводів</TableHead>
                  <TableHead>Тип пайки</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackageTypes.map((packageType) => (
                  <TableRow key={packageType.id}>
                    <TableCell>
                      <div className="font-medium">{packageType.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{packageType.description || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{packageType.pinCount || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{packageType.solderingType || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(packageType)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(packageType.id)}
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