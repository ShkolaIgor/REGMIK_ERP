import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye, Edit, Clock, DollarSign, FileText, Trash2, X } from "lucide-react";
import { Recipe, InsertRecipe, Product, InsertRecipeIngredient, RecipeIngredient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecipeIngredientForm extends Omit<InsertRecipeIngredient, 'recipeId'> {
  productName?: string;
}

export default function Recipes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<InsertRecipe>({
    name: "",
    description: "",
    instructions: "",
    productId: null,
    estimatedTime: null,
    laborCost: null
  });
  const [ingredients, setIngredients] = useState<RecipeIngredientForm[]>([]);
  const { toast } = useToast();

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { recipe: InsertRecipe; ingredients: RecipeIngredientForm[] }) => {
      try {
        if (editingRecipe) {
          // Оновлення існуючого рецепту
          const result = await apiRequest({
            url: `/api/recipes/${editingRecipe.id}`,
            method: 'PATCH',
            body: data
          });
          return result;
        } else {
          // Створення нового рецепту
          const result = await apiRequest({
            url: '/api/recipes',
            method: 'POST',
            body: data
          });
          return result;
        }
      } catch (error) {
        console.error("Recipe creation/update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: editingRecipe ? "Рецепт успішно оновлено" : "Рецепт успішно створено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити рецепт",
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

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Рецепти виробництва</h2>
            <p className="text-gray-600">Управління рецептами та інгредієнтами для виробництва</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новий рецепт
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити новий рецепт</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
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
                    <Label htmlFor="estimatedTime">Час виробництва (хвилин)</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      value={formData.estimatedTime || ""}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="laborCost">Вартість робіт (грн)</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      value={formData.laborCost || ""}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value || null })}
                    />
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Інгредієнти</Label>
                    <Button type="button" onClick={addIngredient} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати інгредієнт
                    </Button>
                  </div>
                  
                  {ingredients.length > 0 && (
                    <div className="space-y-4">
                      {ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 items-end p-4 border rounded-lg">
                          <div>
                            <Label>Продукт</Label>
                            <Select
                              value={ingredient.productId?.toString() || ""}
                              onValueChange={(value) => updateIngredient(index, 'productId', parseInt(value))}
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
                          <div>
                            <Label>Кількість</Label>
                            <Input
                              type="number"
                              step="0.001"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Одиниця</Label>
                            <Input
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeIngredient(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Створення..." : "Створити рецепт"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всього рецептів</p>
                  <p className="text-3xl font-semibold text-gray-900">{recipes.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середній час виробництва</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {recipes.length > 0 
                      ? Math.round(recipes.reduce((sum: number, r: any) => sum + (r.estimatedTime || 0), 0) / recipes.length)
                      : 0
                    } хв
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Середня вартість робіт</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {recipes.length > 0
                      ? formatCurrency(recipes.reduce((sum: number, r: any) => sum + parseFloat(r.laborCost || 0), 0) / recipes.length)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список рецептів виробництва</CardTitle>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Рецепти відсутні</p>
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Створити перший рецепт
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва</TableHead>
                    <TableHead>Опис</TableHead>
                    <TableHead>Час виробництва</TableHead>
                    <TableHead>Вартість робіт</TableHead>
                    <TableHead>Дата створення</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe: any) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-gray-600">
                          {recipe.description || "Без опису"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {recipe.estimatedTime ? `${recipe.estimatedTime} хв` : "Не вказано"}
                      </TableCell>
                      <TableCell>
                        {recipe.laborCost ? formatCurrency(recipe.laborCost) : "Не вказано"}
                      </TableCell>
                      <TableCell>{formatDate(recipe.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setViewingRecipe(recipe);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setEditingRecipe(recipe);
                              setFormData({
                                name: recipe.name,
                                description: recipe.description || "",
                                instructions: recipe.instructions || "",
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}