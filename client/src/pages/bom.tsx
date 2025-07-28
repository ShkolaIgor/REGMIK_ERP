import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Package, Component, Search, Layers, Settings } from "lucide-react";
import { insertProductComponentSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

type Product = {
  id: number;
  name: string;
  sku: string;
  productType: string;
  unit: string;
  costPrice: string;
  retailPrice: string;
  isActive: boolean | null;
};

type ProductComponent = {
  id: number;
  parentProductId: number;
  componentProductId: number;
  quantity: string;
  unit: string;
  isOptional: boolean;
  notes: string | null;
  component: Product;
};

const componentFormSchema = insertProductComponentSchema.extend({
  quantity: z.string().min(1, "Кількість обов'язкова"),
  unit: z.string().min(1, "Одиниця виміру обов'язкова")
});

type ComponentFormData = z.infer<typeof componentFormSchema>;

export default function BOMPage() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const queryClient = useQueryClient();
  
  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: {
      parentProductId: 0,
      componentProductId: 0,
      quantity: "",
      unit: "шт",
      isOptional: false,
      notes: ""
    }
  });

  // Fetch all products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
    enabled: true
  });

  // Fetch all components and semi-finished products for selection
  const { data: availableComponents } = useQuery({
    queryKey: ["/api/products"],
    enabled: true,
    select: (data: any[]) => {
      return data?.filter((item: any) => 
        item.productType === "компонент" || 
        item.productType === "полуфабрикат" ||
        item.productType === "component" ||
        item.productType === "semi-finished"
      ) || [];
    }
  });

  // Fetch components for selected product
  const { data: components, isLoading: isLoadingComponents } = useQuery({
    queryKey: [`/api/products/${selectedProductId}/components`],
    enabled: selectedProductId !== null
  });

  // Fetch BOM data for all products to show component indicators
  const { data: allBOMData } = useQuery({
    queryKey: ["/api/product-components/all"],
    enabled: true,
    select: (data: ProductComponent[]) => {
      // Group components by parent product ID
      const bomMap = new Map<number, number>();
      data?.forEach((component) => {
        const count = bomMap.get(component.parentProductId) || 0;
        bomMap.set(component.parentProductId, count + 1);
      });
      return bomMap;
    }
  });

  const addMutation = useMutation({
    mutationFn: (data: ComponentFormData) => 
      apiRequest("/api/product-components", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${selectedProductId}/components`] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Успішно",
        description: "Компонент додано до складу продукту"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося додати компонент",
        variant: "destructive"
      });
    }
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/product-components/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${selectedProductId}/components`] });
      toast({
        title: "Успішно",
        description: "Компонент видалено зі складу продукту"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити компонент",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ComponentFormData) => {
    if (!selectedProductId) return;
    
    addMutation.mutate({
      ...data,
      parentProductId: selectedProductId
    });
  };

  const handleAddComponent = () => {
    if (!selectedProductId) {
      toast({
        title: "Увага",
        description: "Спочатку оберіть продукт",
        variant: "destructive"
      });
      return;
    }
    form.setValue("parentProductId", selectedProductId);
    setIsAddDialogOpen(true);
  };

  if (isLoadingProducts) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження продуктів...</div>
        </div>
      </div>
    );
  }

  const parentProducts = (products as Product[] || []).filter((p: Product) => {
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = productTypeFilter === "all" || 
      (productTypeFilter === "product" && (p.productType === "товар" || p.productType === "product")) ||
      (productTypeFilter === "kit" && (p.productType === "комплект" || p.productType === "kit")) ||
      (productTypeFilter === "semi-finished" && (p.productType === "полуфабрикат" || p.productType === "semi-finished"));

    const isParentType = p.productType === "товар" || p.productType === "комплект" || p.productType === "product" ||
                        p.productType === "полуфабрикат" || p.productType === "semi-finished";
    
    return isParentType && matchesSearch && matchesType;
  });

  const filteredComponents = (availableComponents as any[] || []);

  // Розрахунок загальної вартості BOM
  const calculateTotalCost = () => {
    if (!components) return 0;
    return (components as ProductComponent[]).reduce((total, component) => {
      if (!component.component) return total;
      const componentCost = parseFloat(component.component.costPrice || "0");
      const quantity = parseFloat(component.quantity || "0");
      return total + (componentCost * quantity);
    }, 0);
  };

  const totalCost = calculateTotalCost();

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id);
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Склад продуктів (BOM)
                </h1>
                <p className="text-gray-500 mt-1">Управління складом компонентів та рецептур виробництва</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedProductId && (
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleAddComponent}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати компонент
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <div className="w-full px-8 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Left Column - Products List */}
          <div className="col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Список продуктів
                </CardTitle>
                <CardDescription>
                  Оберіть продукт для перегляду його складу
                </CardDescription>
                
                {/* Search Input */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Пошук продуктів..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Product Type Filter */}
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Тип продукту" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі типи</SelectItem>
                    <SelectItem value="product">Товари</SelectItem>
                    <SelectItem value="kit">Комплекти</SelectItem>
                    <SelectItem value="semi-finished">Полуфабрикати</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {parentProducts.map((product) => {
                    const bomCount = allBOMData?.get(product.id) || 0;
                    return (
                      <div
                        key={product.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProductId === product.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {product.productType}
                              </Badge>
                              {product.isActive ? (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                  Активний
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Неактивний
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProductId(product.id);
                                  setSelectedProduct(product);
                                  handleAddComponent();
                                }}
                                title="Створити BOM"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-1 h-auto"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                            {bomCount > 0 ? (
                              <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 flex items-center gap-1">
                                <Component className="w-3 h-3" />
                                {bomCount} комп.
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-400">
                                Без BOM
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product BOM */}
          <div className="col-span-8">
            {selectedProduct ? (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Component className="w-5 h-5" />
                    Склад продукту: {selectedProduct.name}
                  </CardTitle>
                  <CardDescription>
                    Артикул: {selectedProduct.sku} | Ціна: {selectedProduct.costPrice} грн
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingComponents ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-lg">Завантаження складу...</div>
                    </div>
                  ) : components && components.length > 0 ? (
                    <div className="space-y-4">
                      {/* BOM Summary */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Загальна вартість BOM:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {totalCost.toFixed(2)} грн
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Компонентів: {components.length}
                        </div>
                      </div>

                      {/* Components Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Компонент</TableHead>
                            <TableHead>Артикул</TableHead>
                            <TableHead>Кількість</TableHead>
                            <TableHead>Ціна за од.</TableHead>
                            <TableHead>Загальна вартість</TableHead>
                            <TableHead>Дії</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(components as ProductComponent[]).map((component) => (
                            <TableRow key={component.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {component.component?.name || 'Невідомий компонент'}
                                  </div>
                                  {component.notes && (
                                    <div className="text-sm text-gray-500">{component.notes}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {component.component?.sku || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {component.quantity} {component.unit}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {component.component?.costPrice ? 
                                  `${parseFloat(component.component.costPrice).toFixed(2)} грн` : 
                                  '-'
                                }
                              </TableCell>
                              <TableCell className="font-medium">
                                {component.component?.costPrice ? 
                                  `${(parseFloat(component.component.costPrice) * parseFloat(component.quantity)).toFixed(2)} грн` : 
                                  '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteComponentMutation.mutate(component.id)}
                                  disabled={deleteComponentMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Component className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Склад продукту порожній
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Цей продукт ще не має компонентів. Додайте перший компонент для створення BOM.
                      </p>
                      <Button onClick={handleAddComponent}>
                        <Plus className="w-4 h-4 mr-2" />
                        Додати перший компонент
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Оберіть продукт
                    </h3>
                    <p className="text-gray-500">
                      Виберіть продукт зі списку зліва для перегляду його складу
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Component Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Додати компонент</DialogTitle>
            <DialogDescription>
              Додати новий компонент до складу продукту {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="componentProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Компонент</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть компонент" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredComponents.map((component: any) => (
                          <SelectItem key={component.id} value={component.id.toString()}>
                            {component.name} ({component.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Кількість</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Одиниця виміру</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть одиницю" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="шт">шт</SelectItem>
                        <SelectItem value="кг">кг</SelectItem>
                        <SelectItem value="г">г</SelectItem>
                        <SelectItem value="л">л</SelectItem>
                        <SelectItem value="мл">мл</SelectItem>
                        <SelectItem value="м">м</SelectItem>
                        <SelectItem value="см">см</SelectItem>
                        <SelectItem value="мм">мм</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Примітки</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Додаткова інформація про компонент" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Додавання..." : "Додати"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}