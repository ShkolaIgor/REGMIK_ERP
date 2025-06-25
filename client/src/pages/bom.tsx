import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Package, Component, Calculator, Download, Upload, AlertTriangle, Search, Layers } from "lucide-react";
import { insertProductComponentSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

type Product = {
  id: number;
  name: string;
  sku: string;
  productType: string;
  unit: string;
  costPrice: string;
  retailPrice: string;
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
  const { data: availableComponents, isLoading: isLoadingAvailableComponents } = useQuery({
    queryKey: ["/api/products"],
    enabled: true,
    select: (data: any[]) => {
      // Фільтруємо тільки компоненти та полуфабрикати
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
    console.log("handleAddComponent called, selectedProductId:", selectedProductId);
    if (!selectedProductId) {
      toast({
        title: "Увага",
        description: "Спочатку оберіть продукт",
        variant: "destructive"
      });
      return;
    }
    form.setValue("parentProductId", selectedProductId);
    console.log("Setting dialog open to true");
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

  const parentProducts = (Array.isArray(products) ? products : products?.data || []).filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const isParentType = p.productType === "товар" || p.productType === "комплект" || p.productType === "product" ||
                        p.productType === "полуфабрикат" || p.productType === "semi-finished";
    return isParentType && matchesSearch;
  });

  // Фільтруємо доступні компоненти
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
  const selectedProduct = selectedProductId ? 
    (products as Product[] || []).find((p: Product) => p.id === selectedProductId) : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Layers className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Склад продуктів (BOM)</h1>
            </div>
            <Badge variant="secondary" className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Онлайн
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Пошук продуктів..."
                className="w-80 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedProductId && (
              <Button onClick={handleAddComponent}>
                <Plus className="mr-2 h-4 w-4" />
                Додати компонент
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-6 flex-1 overflow-auto">
        {/* Product Selection */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Оберіть продукт
          </CardTitle>
          <CardDescription>
            Оберіть продукт для перегляду та редагування його складу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentProducts.map((product: Product) => (
              <Card 
                key={product.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedProductId === product.id ? "border-primary bg-accent" : ""
                }`}
                onClick={() => {
                  console.log("Setting selectedProductId to:", product.id);
                  setSelectedProductId(product.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <Badge variant="outline">{product.productType}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Components Management */}
      {selectedProductId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Component className="h-5 w-5" />
                  Склад продукту: {selectedProduct?.name}
                </CardTitle>
                <CardDescription>
                  Компоненти та матеріали, що входять до складу продукту
                </CardDescription>
                {components && (components as ProductComponent[]).length > 0 && (
                  <div className="mt-2 flex items-center gap-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      Загальна вартість: {totalCost.toFixed(2)} грн
                    </Badge>
                    <Badge variant="secondary">
                      Компонентів: {(components as ProductComponent[]).length}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Експорт
                </Button>
                <Button onClick={handleAddComponent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Додати компонент
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingComponents ? (
              <div>Завантаження компонентів...</div>
            ) : (components as ProductComponent[] || []).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Компонент</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Кількість</TableHead>
                    <TableHead>Одиниця</TableHead>
                    <TableHead>Ціна за од.</TableHead>
                    <TableHead>Загальна вартість</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Опціональний</TableHead>
                    <TableHead>Примітки</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(components as ProductComponent[] || [])
                    .filter(component => component.component)
                    .map((component: ProductComponent) => {
                    const unitPrice = parseFloat(component.component?.costPrice || "0");
                    const quantity = parseFloat(component.quantity || "0");
                    const totalPrice = unitPrice * quantity;
                    
                    return (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">
                          {component.component?.name || 'Невідомий компонент'}
                        </TableCell>
                        <TableCell>{component.component?.sku || '-'}</TableCell>
                        <TableCell>{component.quantity}</TableCell>
                        <TableCell>{component.unit}</TableCell>
                        <TableCell>{unitPrice.toFixed(2)} грн</TableCell>
                        <TableCell className="font-medium">{totalPrice.toFixed(2)} грн</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {component.component?.productType || 'невідомо'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {component.isOptional ? (
                            <Badge variant="secondary">Опціональний</Badge>
                          ) : (
                            <Badge variant="default">Обов'язковий</Badge>
                          )}
                        </TableCell>
                        <TableCell>{component.notes || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteComponentMutation.mutate(component.id)}
                            disabled={deleteComponentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Компоненти не знайдено. Додайте перший компонент до складу продукту.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Component Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Додати компонент</DialogTitle>
            <DialogDescription>
              Додайте новий компонент до складу продукту
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
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Кількість</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="шт">шт</SelectItem>
                          <SelectItem value="кг">кг</SelectItem>
                          <SelectItem value="л">л</SelectItem>
                          <SelectItem value="м">м</SelectItem>
                          <SelectItem value="м²">м²</SelectItem>
                          <SelectItem value="м³">м³</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isOptional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Опціональний компонент</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Компонент не є обов'язковим для виробництва
                      </p>
                    </div>
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
                      <Textarea 
                        placeholder="Додаткові примітки про компонент..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMutation.isPending}
                >
                  {addMutation.isPending ? "Додавання..." : "Додати компонент"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}