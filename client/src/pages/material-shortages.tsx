import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calculator, AlertTriangle, CheckCircle, Clock, TrendingUp, Package, ShoppingCart, DollarSign } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type MaterialShortage, type Product, type Warehouse, insertMaterialShortageSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertMaterialShortageSchema.extend({
  productId: z.number().min(1, "Виберіть продукт"),
  unit: z.string().min(1, "Одиниця вимірювання обов'язкова"),
});

type FormData = z.infer<typeof formSchema>;

export default function MaterialShortagesPage() {
  const [selectedShortage, setSelectedShortage] = useState<MaterialShortage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShortage, setEditingShortage] = useState<MaterialShortage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: 0,
      warehouseId: undefined,
      requiredQuantity: "0",
      availableQuantity: "0",
      shortageQuantity: "0",
      unit: "шт",
      priority: "medium",
      status: "pending",
      estimatedCost: "0",
      supplierRecommendationId: undefined,
      notes: "",
    },
  });

  const requiredQuantity = form.watch("requiredQuantity");
  const availableQuantity = form.watch("availableQuantity");

  useEffect(() => {
    const required = parseFloat(requiredQuantity) || 0;
    const available = parseFloat(availableQuantity) || 0;
    const shortage = Math.max(0, required - available);
    form.setValue("shortageQuantity", shortage.toString());
  }, [requiredQuantity, availableQuantity, form]);

  const { data: shortages = [], isLoading } = useQuery({
    queryKey: ["/api/material-shortages"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("/api/material-shortages", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      setIsFormOpen(false);
      form.reset();
      toast({ title: "Успіх", description: "Запис про дефіцит створено успішно" });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingShortage) {
      // updateMutation.mutate({ id: editingShortage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані
  const totalShortages = (shortages as any[])?.length || 0;
  const criticalShortages = (shortages as any[]).filter((s: any) => s.priority === "critical").length;
  const pendingShortages = (shortages as any[]).filter((s: any) => s.status === "pending").length;
  const totalCost = (shortages as any[]).reduce((sum: number, s: any) => sum + (parseFloat(s.estimatedCost) || 0), 0);

  // Фільтровані дані
  const filteredShortages = (shortages as any[]).filter((shortage: any) => {
    const matchesSearch = !searchQuery || 
      shortage.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortage.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                  Дефіцит матеріалів
                </h1>
                <p className="text-yellow-100 text-xl font-medium">Моніторинг та управління нестачею матеріалів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Розрахувати
              </Button>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Додати запис
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Додати новий запис про дефіцит</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Продукт</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Виберіть продукт" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(products as any[]).map((product: any) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                      {product.name}
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
                          name="warehouseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Склад</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Виберіть склад" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(warehouses as any[]).map((warehouse: any) => (
                                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                      {warehouse.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                          Скасувати
                        </Button>
                        <Button type="submit">
                          Створити запис
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">Всього дефіцитів</p>
                  </div>
                  <p className="text-3xl font-bold text-red-900 mb-1">{totalShortages}</p>
                  <p className="text-xs text-red-600">Загальна кількість записів</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
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
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Критичні</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">{criticalShortages}</p>
                  <p className="text-xs text-orange-600">Потребують уваги</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700 font-medium">Очікують</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-900 mb-1">{pendingShortages}</p>
                  <p className="text-xs text-yellow-600">На розгляді</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700 font-medium">Загальна вартість</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900 mb-1">₴{totalCost.toLocaleString('uk-UA')}</p>
                  <p className="text-xs text-green-600">Очікувані витрати</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Пошук за назвою товару або SKU..."
            />
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Дефіцити матеріалів ({filteredShortages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredShortages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає дефіцитів для відображення
              </div>
            ) : (
              <div className="space-y-4">
                {filteredShortages.map((shortage: any) => (
                  <Card key={shortage.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <h3 className="font-semibold">{shortage.product?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Дефіцит: {shortage.shortageQuantity} {shortage.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-red-100 text-red-800">
                          {shortage.priority === "critical" ? "Критичний" : 
                           shortage.priority === "high" ? "Високий" : 
                           shortage.priority === "medium" ? "Середній" : "Низький"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}