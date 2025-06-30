import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Upload } from "lucide-react";
import type { ComponentCategory, InsertComponentCategory } from "@shared/schema";
import { ComponentCategoriesXmlImport } from "@/components/ComponentCategoriesXmlImport";
import { ImportWizard } from "@/components/ImportWizard";

interface ComponentCategoryFormData {
  name: string;
  description: string;
  color: string;
}

export default function Categories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComponentCategory | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [formData, setFormData] = useState<ComponentCategoryFormData>({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/component-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertComponentCategory) => {
      const response = await fetch("/api/component-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Помилка створення категорії");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/component-categories"] });
      toast({
        title: "Успіх",
        description: "Категорію створено успішно",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertComponentCategory> }) => {
      const response = await fetch(`/api/component-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Помилка оновлення категорії");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/component-categories"] });
      toast({
        title: "Успіх",
        description: "Категорію оновлено успішно",
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/component-categories/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Помилка видалення категорії");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/component-categories"] });
      toast({
        title: "Успіх",
        description: "Категорію видалено успішно",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: InsertComponentCategory = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      color: formData.color,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (category: ComponentCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#3B82F6"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю категорію?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Категорії компонентів
                </h1>
                <p className="text-blue-100 text-xl font-medium">Управління категоріями електронних компонентів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <Button 
                  variant="outline" 
                  onClick={() => setShowImportDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Імпорт категорій
                </Button>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Імпорт категорій компонентів</DialogTitle>
              </DialogHeader>
              {showImportWizard ? (
                <ImportWizard 
                  importType="component-categories"
                  onProceedToImport={() => setShowImportWizard(false)}
                />
              ) : (
                <ComponentCategoriesXmlImport />
              )}
            </DialogContent>
          </Dialog>
              <Button 
                onClick={() => {
                  setEditingCategory(null);
                  setIsDialogOpen(true);
                }}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Додати категорію
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Всього категорій</p>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{categories?.length || 0}</p>
                  <p className="text-xs text-blue-600">У системі</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Активні</p>
                  <p className="text-3xl font-bold text-indigo-900 mb-1">{categories?.filter(c => c.name).length || 0}</p>
                  <p className="text-xs text-indigo-600">Налаштованих</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Plus className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">З описом</p>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{categories?.filter(c => c.description).length || 0}</p>
                  <p className="text-xs text-purple-600">Документованих</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Edit className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-pink-50 to-red-50 border-pink-200 hover:border-pink-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Кольорових</p>
                  <p className="text-3xl font-bold text-pink-900 mb-1">{categories?.filter(c => c.color && c.color !== '#3B82F6').length || 0}</p>
                  <p className="text-xs text-pink-600">Персоналізованих</p>
                </div>
                <div className="p-3 bg-pink-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Trash2 className="w-8 h-8 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(categories as ComponentCategory[])?.map((category) => (
          <Card key={category.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: category.color || "#3B82F6" }}
                  />
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Створено: {category.createdAt ? new Date(category.createdAt).toLocaleDateString('uk-UA') : 'Невідомо'}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!categories || categories.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Немає категорій</h3>
            <p className="text-muted-foreground text-center mb-4">
              Почніть з створення першої категорії компонентів
            </p>
            <Button onClick={() => {
              setEditingCategory(null);
              setIsDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Створити категорію
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Редагувати категорію" : "Нова категорія компонентів"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Назва категорії *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Наприклад: Мікроконтролери"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опис категорії компонентів"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Колір категорії</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {editingCategory && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Ви впевнені, що хочете видалити цю категорію?")) {
                        handleDelete(editingCategory.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Видалити
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 
                    "Збереження..." : 
                    (editingCategory ? "Оновити" : "Створити")
                  }
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </>
  );
}