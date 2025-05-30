import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, Search } from "lucide-react";
import { CategoryForm } from "@/components/CategoryForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function Categories() {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Успіх",
        description: "Категорію успішно видалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити категорію",
        variant: "destructive",
      });
    },
  });

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getProductCount = (categoryId: number) => {
    return products.filter((product: any) => product.categoryId === categoryId).length;
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (id: number) => {
    const productCount = getProductCount(id);
    if (productCount > 0) {
      toast({
        title: "Неможливо видалити",
        description: `У цій категорії є ${productCount} товарів. Спочатку переведіть товари в іншу категорію.`,
        variant: "destructive",
      });
      return;
    }
    deleteCategoryMutation.mutate(id);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleFormClose = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Категорії товарів</h1>
              <p className="text-gray-600 mt-1">Управління категоріями для організації товарів</p>
            </div>
            <Button onClick={handleAddCategory}>
              <Plus className="w-4 h-4 mr-2" />
              Додати категорію
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна кількість категорій</p>
                  <p className="text-3xl font-semibold text-gray-900">{categories.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Загальна кількість товарів</p>
                  <p className="text-3xl font-semibold text-gray-900">{products.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середня кількість товарів на категорію</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {categories.length > 0 ? Math.round(products.length / categories.length) : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Пошук категорій..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Список категорій</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Показано: {filteredCategories.length} з {categories.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "Категорії не знайдено" : "Немає категорій"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery 
                    ? "Спробуйте змінити критерії пошуку" 
                    : "Почніть з створення першої категорії товарів"
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Додати категорію
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Назва</TableHead>
                      <TableHead>Опис</TableHead>
                      <TableHead>Кількість товарів</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category: any) => {
                      const productCount = getProductCount(category.id);
                      
                      return (
                        <TableRow key={category.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="font-medium text-gray-900">{category.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {category.description || "Без опису"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={productCount > 0 ? "default" : "secondary"}>
                              {productCount} товарів
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Видалити категорію</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Ви впевнені, що хочете видалити категорію "{category.name}"?
                                      {productCount > 0 && (
                                        <span className="block mt-2 text-red-600 font-medium">
                                          Увага: У цій категорії є {productCount} товарів. 
                                          Спочатку переведіть товари в іншу категорію.
                                        </span>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id)}
                                      disabled={productCount > 0}
                                      className={productCount > 0 ? "opacity-50 cursor-not-allowed" : ""}
                                    >
                                      Видалити
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CategoryForm
        open={showCategoryForm}
        onOpenChange={handleFormClose}
        category={editingCategory}
      />
    </div>
  );
}