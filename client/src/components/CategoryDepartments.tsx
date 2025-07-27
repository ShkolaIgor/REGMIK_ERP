import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Plus, Building2, Package } from "lucide-react";

interface CategoryDepartment {
  id: number;
  categoryId: number;
  departmentId: number;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

export function CategoryDepartments() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Отримання всіх зв'язків
  const { data: categoryDepartments = [], isLoading: isLoadingLinks } = useQuery<CategoryDepartment[]>({
    queryKey: ["/api/category-departments"],
  });

  // Отримання категорій
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Отримання відділів
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Створення нового зв'язку
  const createLinkMutation = useMutation({
    mutationFn: (data: { categoryId: number; departmentId: number }) =>
      apiRequest("/api/category-departments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-departments"] });
      setSelectedCategory(undefined);
      setSelectedDepartment(undefined);
      toast({
        title: "Успіх",
        description: "Зв'язок категорії з відділом створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити зв'язок",
        variant: "destructive",
      });
    },
  });

  // Видалення зв'язку
  const deleteLinkMutation = useMutation({
    mutationFn: (data: { categoryId: number; departmentId: number }) =>
      apiRequest(`/api/category-departments?categoryId=${data.categoryId}&departmentId=${data.departmentId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-departments"] });
      toast({
        title: "Успіх",
        description: "Зв'язок видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити зв'язок",
        variant: "destructive",
      });
    },
  });

  const handleCreateLink = () => {
    if (!selectedCategory || !selectedDepartment) {
      toast({
        title: "Помилка",
        description: "Оберіть категорію та відділ",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо чи вже існує такий зв'язок
    const existingLink = categoryDepartments.find(
      link => link.categoryId === selectedCategory && link.departmentId === selectedDepartment
    );

    if (existingLink) {
      toast({
        title: "Помилка",
        description: "Такий зв'язок вже існує",
        variant: "destructive",
      });
      return;
    }

    createLinkMutation.mutate({
      categoryId: selectedCategory,
      departmentId: selectedDepartment,
    });
  };

  const handleDeleteLink = (categoryId: number, departmentId: number) => {
    deleteLinkMutation.mutate({ categoryId, departmentId });
  };

  // Групуємо зв'язки за категоріями
  const linksByCategory = categoryDepartments.reduce((acc, link) => {
    if (!acc[link.categoryId]) {
      acc[link.categoryId] = [];
    }
    acc[link.categoryId].push(link);
    return acc;
  }, {} as Record<number, CategoryDepartment[]>);

  if (isLoadingLinks) {
    return <div className="p-4">Завантаження...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Форма додавання нового зв'язку */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Додати зв'язок категорії з відділом
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Категорія товарів</label>
              <Select value={selectedCategory?.toString()} onValueChange={(value) => setSelectedCategory(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Відділ виробництва</label>
              <Select value={selectedDepartment?.toString()} onValueChange={(value) => setSelectedDepartment(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть відділ" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {department.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateLink}
              disabled={createLinkMutation.isPending || !selectedCategory || !selectedDepartment}
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати зв'язок
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список існуючих зв'язків */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Існуючі зв'язки категорій з відділами</h3>
        
        {Object.keys(linksByCategory).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Поки немає зв'язків між категоріями та відділами</p>
              <p className="text-sm">Додайте перший зв'язок для організації виробництва за відділами</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => {
              const categoryLinks = linksByCategory[category.id] || [];
              
              if (categoryLinks.length === 0) return null;

              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {categoryLinks.map((link) => (
                        <Badge
                          key={`${link.categoryId}-${link.departmentId}`}
                          variant="outline"
                          className="flex items-center gap-2 px-3 py-1"
                        >
                          <Building2 className="h-3 w-3" />
                          {link.department.name}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleDeleteLink(link.categoryId, link.departmentId)}
                            disabled={deleteLinkMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}