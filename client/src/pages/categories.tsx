import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Package, Upload, Component } from "lucide-react";
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
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header Section  sticky top-0 z-40*/}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
              <div className="w-full px-8 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Component className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                          Категорії компонентів
                        </h1>
                        <p className="text-gray-500 mt-1">Управління категоріями електронних компонентів</p>
                      </div>
                    </div>
                <div className="flex items-center space-x-4">
        
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => {
            setEditingCategory(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Додати категорію
          </Button>
        </div>
      </div>
    </div>
  </header>

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
  );
}