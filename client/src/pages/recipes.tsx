import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Clock, DollarSign, FileText, X, Upload, Factory, Package, Component, Calculator } from "lucide-react";
import { Recipe, InsertRecipe, Product, InsertRecipeIngredient, RecipeIngredient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/DataTable/DataTable";
import { SearchFilters } from "@/components/SearchFilters";

interface RecipeIngredientForm extends Omit<InsertRecipeIngredient, 'recipeId'> {
  productName?: string;
}

export default function Recipes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<InsertRecipe>({
    name: "",
    description: "",
    instructions: "",
    productId: null,
    estimatedTime: null,
    laborCost: null
  });
  const [ingredients, setIngredients] = useState<RecipeIngredientForm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Фільтровані дані для пошуку
  const filteredRecipes = Array.isArray(recipes) ? recipes.filter(recipe => {
    if (!recipe || typeof recipe !== 'object') return false;
    
    const matchesSearch = recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "with-product" && recipe.productId) ||
      (typeFilter === "without-product" && !recipe.productId);
    
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && recipe.productId) ||
      (statusFilter === "draft" && !recipe.productId);
    
    return matchesSearch && matchesType && matchesStatus;
  }) : [];

  // Статистичні дані
  const totalRecipes = Array.isArray(recipes) ? recipes.length : 0;
  const recipesWithProduct = Array.isArray(recipes) ? recipes.filter(r => r && r.productId).length : 0;
  const validRecipesWithTime = Array.isArray(recipes) ? recipes.filter(r => r && r.estimatedTime) : [];
  const averageTime = validRecipesWithTime.length > 0 
    ? Math.round(validRecipesWithTime.reduce((sum, r) => sum + (r.estimatedTime || 0), 0) / validRecipesWithTime.length) 
    : 0;
  const totalLaborCost = Array.isArray(recipes) ? recipes.reduce((sum, r) => sum + Number(r?.laborCost || 0), 0) : 0;

  const createMutation = useMutation({
    mutationFn: async (data: { recipe: InsertRecipe; ingredients: RecipeIngredientForm[] }) => {
      try {
        if (editingRecipe) {
          const response = await apiRequest(`/api/recipes/${editingRecipe.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
          return response;
        } else {
          const response = await apiRequest("/api/recipes", {
            method: "POST",
            body: JSON.stringify(data),
          });
          return response;
        }
      } catch (error: any) {
        console.error("Recipe operation error:", error);
        throw new Error(error.message || "Помилка операції з рецептом");
      }
    },
    onSuccess: () => {
      toast({
        title: editingRecipe ? "Рецепт оновлено" : "Рецепт створено",
        description: editingRecipe ? "Рецепт успішно оновлено" : "Новий рецепт успішно створено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      resetForm();
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти рецепт",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      instructions: "",
      productId: null,
      estimatedTime: null,
      laborCost: null
    });
    setIngredients([]);
    setEditingRecipe(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ recipe: formData, ingredients });
  };

  const addIngredient = () => {
    setIngredients([...ingredients, {
      productId: 0,
      quantity: "1",
      unit: "шт"
    }]);
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredientForm, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Колонки для DataTable
  const columns = [
    {
      key: "name",
      label: "Назва рецепту",
      sortable: true,
    },
    {
      key: "product",
      label: "Продукт",
      render: (recipe: Recipe) => {
        if (!recipe || !recipe.productId) return "—";
        const product = Array.isArray(products) ? products.find(p => p.id === recipe.productId) : null;
        return product?.name || "—";
      }
    },
    {
      key: "estimatedTime",
      label: "Час (хв)",
      render: (recipe: Recipe) => {
        if (!recipe) return "—";
        return recipe.estimatedTime || "—";
      }
    },
    {
      key: "laborCost",
      label: "Вартість роботи",
      render: (recipe: Recipe) => {
        if (!recipe || !recipe.laborCost) return "—";
        return formatCurrency(Number(recipe.laborCost));
      }
    },
    {
      key: "actions",
      label: "Дії",
      render: (recipe: Recipe) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingRecipe(recipe);
              setFormData({
                name: recipe.name,
                description: recipe.description,
                instructions: recipe.instructions,
                productId: recipe.productId,
                estimatedTime: recipe.estimatedTime,
                laborCost: recipe.laborCost
              });
              setIsCreateOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="container mx-auto p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Завантаження рецептів...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto p-4 flex-1 flex flex-col overflow-hidden">
          {/* Header з градієнтом */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
            <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Склад рецептів
                    </h1>
                    <p className="text-gray-600 mt-1">Управління рецептами та технологічними процесами</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsImportDialogOpen(true)}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Імпорт XML
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Новий рецепт
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRecipe ? "Редагувати рецепт" : "Створити новий рецепт"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Назва рецепту</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="productId">Кінцевий продукт</Label>
                          <Select
                            value={formData.productId?.toString() || ""}
                            onValueChange={(value) => setFormData({ ...formData, productId: value ? parseInt(value) : null })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть продукт" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Опис</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="instructions">Інструкції</Label>
                        <Textarea
                          id="instructions"
                          value={formData.instructions || ""}
                          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                          rows={4}
                          placeholder="Детальні інструкції з виробництва..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="estimatedTime">Орієнтовний час (хвилини)</Label>
                          <Input
                            id="estimatedTime"
                            type="number"
                            value={formData.estimatedTime || ""}
                            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value ? parseInt(e.target.value) : null })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="laborCost">Вартість роботи</Label>
                          <Input
                            id="laborCost"
                            type="number"
                            step="0.01"
                            value={formData.laborCost || ""}
                            onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Label>Інгредієнти</Label>
                          <Button type="button" onClick={addIngredient} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Додати інгредієнт
                          </Button>
                        </div>
                        {ingredients.map((ingredient, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 mb-2 items-end">
                            <div>
                              <Select
                                value={ingredient.productId?.toString() || ""}
                                onValueChange={(value) => updateIngredient(index, 'productId', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Компонент" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="Кількість"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                            />
                            <Input
                              placeholder="Одиниці"
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeIngredient(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => { resetForm(); setIsCreateOpen(false); }}>
                          Скасувати
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        >
                          {createMutation.isPending ? "Збереження..." : (editingRecipe ? "Оновити" : "Створити")}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          </div>

          {/* Статистичні картки - Statistics Cards */}
              <div className="w-full px-8 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
                    <CardContent className="p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-blue-600" />
                            <p className="text-sm text-blue-700 font-medium">Всього рецептів</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-900 mb-1">{totalRecipes}</p>
                          <p className="text-xs text-blue-600">Всього рецептів</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
                    <CardContent className="p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Component className="w-4 h-4 text-emerald-600" />
                            <p className="text-sm text-emerald-700 font-medium">З продуктами</p>
                          </div>
                          <p className="text-3xl font-bold text-emerald-900 mb-1">{recipesWithProduct}</p>
                          <p className="text-xs text-emerald-600">Всього з продуктами</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                          <Component className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
                    <CardContent className="p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <p className="text-sm text-purple-700 font-medium">Середній час</p>
                          </div>
                          <p className="text-3xl font-bold text-purple-900 mb-1">{averageTime}</p>
                          <p className="text-xs text-purple-600">(хв)</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
                    <CardContent className="p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calculator className="w-4 h-4 text-orange-600" />
                            <p className="text-sm text-orange-700 font-medium">Загальна вартість</p>
                          </div>
                          <p className="text-3xl font-bold text-orange-900 mb-1">{formatCurrency(totalLaborCost)}</p>
                          <p className="text-xs text-orange-600">Загальна вартість</p>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                          <Calculator className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

          {/* Пошук та фільтри */}
            <div className="w-full py-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Пошук рецептів за назвою або описом..."
            filters={[
              {
                key: "status",
                label: "Статус",
                value: statusFilter,
                options: [
                  { value: "all", label: "Всі рецепти" },
                  { value: "active", label: "З продуктом" },
                  { value: "draft", label: "Чернетки" }
                ],
                onChange: setStatusFilter
              },
              {
                key: "type",
                label: "Тип",
                value: typeFilter,
                options: [
                  { value: "all", label: "Всі типи" },
                  { value: "with-product", label: "З продуктом" },
                  { value: "without-product", label: "Без продукту" }
                ],
                onChange: setTypeFilter
              }
            ]}
          />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

          {/* Основна таблиця - займає весь доступний простір */}
          <div className="flex-1 min-h-0 mt-4">
            <main className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <DataTable
                  data={filteredRecipes}
                  columns={columns}
                  storageKey="recipes-table"
                />
              </div>
            </main>
          </div>

          {/* Import XML Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Імпорт XML файлу</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="xml-file-recipes" className="text-sm font-medium">
                    Оберіть XML файл з рецептами
                  </label>
                  <input
                    id="xml-file-recipes"
                    type="file"
                    accept=".xml"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsImportDialogOpen(false)}
                  >
                    Скасувати
                  </Button>
                  <Button onClick={() => {
                    toast({ title: "Функція імпорту в розробці" });
                    setIsImportDialogOpen(false);
                  }}>
                    Імпортувати
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>      
      </div>      
    </div>
  );
}