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
import { Building2, Plus, Search, Edit, Trash2, BellElectric } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Department, InsertDepartment } from "@shared/schema";
import { insertDepartmentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  // Fetch departments
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create department");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Відділ створено", description: "Новий відділ успішно додано" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити відділ", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertDepartment> }) => {
      const response = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update department");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditDialogOpen(false);
      setEditingDepartment(null);
      toast({ title: "Відділ оновлено", description: "Інформацію про відділ успішно оновлено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити відділ", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete department");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Відділ видалено", description: "Відділ успішно видалено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити відділ", variant: "destructive" });
    },
  });

  // Create form
  const createForm = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: null,
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<InsertDepartment>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: null,
      isActive: true,
    },
  });

  const onCreateSubmit = (data: InsertDepartment) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        createForm.reset();
      }
    });
  };

  const onEditSubmit = (data: InsertDepartment) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    editForm.reset({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId,
      isActive: department.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей відділ?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredDepartments = departments.filter((department: Department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BellElectric className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Відділи</h1>
                  <p className="text-gray-500 mt-1">Управління організаційними відділами</p>
        </div>
                                   </div>
                                <div className="flex items-center space-x-4">
                </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300" />
              Додати відділ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новий відділ</DialogTitle>
              <DialogDescription>
                Створіть новий відділ в організації
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Назва відділу *</Label>
                <Input
                  id="name"
                  {...createForm.register("name")}
                  placeholder="Введіть назву відділу"
                />
                {createForm.formState.errors.name && (
                  <p className="text-red-500 text-sm">{createForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  {...createForm.register("description")}
                  placeholder="Опис відділу та його функцій"
                  className="min-h-20"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={createForm.watch("isActive")}
                  onCheckedChange={(checked) => createForm.setValue("isActive", !!checked)}
                />
                <Label htmlFor="isActive">Активний</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Створення..." : "Створити"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
            </div>  
          </header>

        {/* Filters and Actions */}
        <div className="w-full py-3">
          <Card>
            <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 max-w-2xl">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Пошук відділів..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
            </div>
                    </CardContent>
                  </Card>
            </div>

      {filteredDepartments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Відділи не знайдено</h3>
            <p className="text-gray-500 text-center mb-6">
              {searchTerm ? "Спробуйте змінити критерії пошуку" : "Почніть з додавання першого відділу"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати перший відділ
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((department: Department) => (
            <Card key={department.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(department)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(department.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={department.isActive ? "default" : "secondary"}>
                    {department.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {department.description && (
                  <CardDescription className="line-clamp-3">
                    {department.description}
                  </CardDescription>
                )}
                {department.createdAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Створено: {new Date(department.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати відділ</DialogTitle>
            <DialogDescription>
              Оновіть інформацію про відділ
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Назва відділу *</Label>
              <Input
                id="edit-name"
                {...editForm.register("name")}
                placeholder="Введіть назву відділу"
              />
              {editForm.formState.errors.name && (
                <p className="text-red-500 text-sm">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-description">Опис</Label>
              <Textarea
                id="edit-description"
                {...editForm.register("description")}
                placeholder="Опис відділу та його функцій"
                className="min-h-20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={editForm.watch("isActive")}
                onCheckedChange={(checked) => editForm.setValue("isActive", !!checked)}
              />
              <Label htmlFor="edit-isActive">Активний</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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