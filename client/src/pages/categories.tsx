import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Package, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Category, InsertCategory, Department } from "@shared/schema";
import { insertCategorySchema } from "@shared/schema";

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  // Fetch categories with department info
  const { data: categories = [], isLoading } = useQuery<(Category & { department?: Department })[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Категорію створено", description: "Нову категорію товарів успішно додано" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити категорію", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCategory> }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast({ title: "Категорію оновлено", description: "Інформацію про категорію успішно оновлено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити категорію", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категорію видалено", description: "Категорію товарів успішно видалено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити категорію", variant: "destructive" });
    },
  });

  // Create form
  const createForm = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: null,
    },
  });

  // Edit form
  const editForm = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: null,
    },
  });

  const onCreateSubmit = (data: InsertCategory) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        createForm.reset();
      }
    });
  };

  const onEditSubmit = (data: InsertCategory) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    }
  };

  const handleEdit = (category: Category & { department?: Department }) => {
    setEditingCategory(category);
    editForm.reset({
      name: category.name,
      description: category.description || "",
      departmentId: category.departmentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю категорію?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (category.department?.name && category.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Категорії товарів</h1>
          <p className="text-gray-600 mt-2">Управління категоріями товарів з прив'язкою до відділів виробництва</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Нова категорія
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нову категорію</DialogTitle>
              <DialogDescription>
                Додайте нову категорію товарів з прив'язкою до відділу виробництва
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Назва категорії</Label>
                <Input
                  id="name"
                  {...createForm.register("name")}
                  placeholder="Введіть назву категорії"
                />
                {createForm.formState.errors.name && (
                  <p className="text-sm text-red-600">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  {...createForm.register("description")}
                  placeholder="Введіть опис категорії"
                />
              </div>

              <div>
                <Label htmlFor="departmentId">Відділ виробництва</Label>
                <Select
                  value={createForm.watch("departmentId")?.toString() || "none"}
                  onValueChange={(value) => {
                    createForm.setValue("departmentId", value === "none" ? null : parseInt(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть відділ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без відділу</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Створення..." : "Створити"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Пошук категорій..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && (
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
              )}
              
              {category.department && (
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary" className="text-xs">
                    {category.department.name}
                  </Badge>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                ID: {category.id}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Категорії не знайдено</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Спробуйте змінити критерії пошуку" : "Почніть з створення нової категорії"}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати категорію</DialogTitle>
            <DialogDescription>
              Оновіть інформацію про категорію товарів
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Назва категорії</Label>
              <Input
                id="edit-name"
                {...editForm.register("name")}
                placeholder="Введіть назву категорії"
              />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-600">{editForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-description">Опис</Label>
              <Textarea
                id="edit-description"
                {...editForm.register("description")}
                placeholder="Введіть опис категорії"
              />
            </div>

            <div>
              <Label htmlFor="edit-departmentId">Відділ виробництва</Label>
              <Select
                value={editForm.watch("departmentId")?.toString() || "none"}
                onValueChange={(value) => {
                  editForm.setValue("departmentId", value === "none" ? null : parseInt(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть відділ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без відділу</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}