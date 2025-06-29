import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, TrendingUp, DollarSign, Package, Settings, Search, Trash, BarChart3, Target } from "lucide-react";
import { Product, CostCalculation, InsertCostCalculation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { SearchFilters } from "@/components/SearchFilters";

export default function CostCalculationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [newCalculation, setNewCalculation] = useState<Partial<InsertCostCalculation>>({
    materialCost: "0",
    laborCost: "0",
    overheadCost: "0",
    profitMargin: "20"
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ["/api/cost-calculations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCostCalculation) => {
      return apiRequest("/api/cost-calculations", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-calculations"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Калькуляцію створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити калькуляцію",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/cost-calculations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-calculations"] });
      toast({
        title: "Успіх",
        description: "Калькуляцію видалено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити калькуляцію",
        variant: "destructive",
      });
    },
  });

  const autoCalculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/cost-calculations/auto-calculate", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-calculations"] });
      toast({
        title: "Успіх",
        description: "Автоматичну калькуляцію виконано успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: "Не вдалося виконати автоматичну калькуляцію",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewCalculation({
      materialCost: "0",
      laborCost: "0",
      overheadCost: "0",
      profitMargin: "20"
    });
    setSelectedProduct(null);
  };

  const handleCreateCalculation = () => {
    if (!selectedProduct) {
      toast({
        title: "Помилка",
        description: "Виберіть продукт",
        variant: "destructive",
      });
      return;
    }

    const materialCost = parseFloat(newCalculation.materialCost || "0");
    const laborCost = parseFloat(newCalculation.laborCost || "0");
    const overheadCost = parseFloat(newCalculation.overheadCost || "0");
    const profitMargin = parseFloat(newCalculation.profitMargin || "20");

    const totalCost = materialCost + laborCost + overheadCost;
    const sellingPrice = totalCost * (1 + profitMargin / 100);

    const calculationData: InsertCostCalculation = {
      productId: selectedProduct,
      materialCost: materialCost.toFixed(2),
      laborCost: laborCost.toFixed(2),
      overheadCost: overheadCost.toFixed(2),
      totalCost: totalCost.toFixed(2),
      profitMargin: profitMargin.toFixed(2),
      sellingPrice: sellingPrice.toFixed(2),
    };

    createMutation.mutate(calculationData);
  };

  const handleDeleteCalculation = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цю калькуляцію?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  // Статистичні дані для карток
  const totalCalculations = (calculations as any[])?.length || 0;
  const averageMargin = totalCalculations > 0 
    ? ((calculations as CostCalculation[]).reduce((sum, calc) => sum + parseFloat(calc.profitMargin), 0) / totalCalculations)
    : 0;
  const totalValue = (calculations as CostCalculation[]).reduce((sum, calc) => sum + parseFloat(calc.totalCost), 0);
  const totalSellingPrice = (calculations as CostCalculation[]).reduce((sum, calc) => sum + parseFloat(calc.sellingPrice), 0);

  // Фільтровані дані
  const filteredCalculations = (calculations as any[]).filter((calc: any) => {
    const matchesSearch = !searchQuery || 
      calc.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      calc.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Calculator className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Калькуляції вартості
                </h1>
                <p className="text-blue-100 text-xl font-medium">Розрахунок вартості та рентабельності продуктів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => autoCalculateMutation.mutate()}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Settings className="w-5 h-5 mr-2" />
                Автокалькуляція
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Нова калькуляція
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Створити калькуляцію вартості</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="product">Продукт</Label>
                      <Select value={selectedProduct?.toString()} onValueChange={(value) => setSelectedProduct(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть продукт" />
                        </SelectTrigger>
                        <SelectContent>
                          {(products as Product[]).map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="materialCost">Вартість матеріалів (₴)</Label>
                        <Input
                          id="materialCost"
                          type="number"
                          step="0.01"
                          value={newCalculation.materialCost}
                          onChange={(e) => setNewCalculation({ ...newCalculation, materialCost: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="laborCost">Вартість роботи (₴)</Label>
                        <Input
                          id="laborCost"
                          type="number"
                          step="0.01"
                          value={newCalculation.laborCost}
                          onChange={(e) => setNewCalculation({ ...newCalculation, laborCost: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="overheadCost">Накладні витрати (₴)</Label>
                        <Input
                          id="overheadCost"
                          type="number"
                          step="0.01"
                          value={newCalculation.overheadCost}
                          onChange={(e) => setNewCalculation({ ...newCalculation, overheadCost: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="profitMargin">Маржа (%)</Label>
                        <Input
                          id="profitMargin"
                          type="number"
                          step="0.1"
                          value={newCalculation.profitMargin}
                          onChange={(e) => setNewCalculation({ ...newCalculation, profitMargin: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Попередній розрахунок:</h4>
                      <div className="space-y-1 text-sm">
                        <div>Загальна собівартість: ₴{(
                          parseFloat(newCalculation.materialCost || "0") +
                          parseFloat(newCalculation.laborCost || "0") +
                          parseFloat(newCalculation.overheadCost || "0")
                        ).toFixed(2)}</div>
                        <div className="font-medium text-green-600">
                          Продажна ціна: ₴{(
                            (parseFloat(newCalculation.materialCost || "0") +
                             parseFloat(newCalculation.laborCost || "0") +
                             parseFloat(newCalculation.overheadCost || "0")) *
                            (1 + parseFloat(newCalculation.profitMargin || "20") / 100)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Скасувати
                      </Button>
                      <Button onClick={handleCreateCalculation} disabled={createMutation.isPending}>
                        Створити калькуляцію
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">Всього калькуляцій</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{totalCalculations}</p>
                  <p className="text-xs text-blue-600">Створено розрахунків</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Calculator className="w-8 h-8 text-white" />
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
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700 font-medium">Середня маржа</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900 mb-1">{averageMargin.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-600">Середній прибуток</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <TrendingUp className="w-8 h-8 text-white" />
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
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-purple-700 font-medium">Загальна собівартість</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900 mb-1">₴{totalValue.toLocaleString('uk-UA')}</p>
                  <p className="text-xs text-purple-600">Сума витрат</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <DollarSign className="w-8 h-8 text-white" />
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
                    <Target className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-700 font-medium">Загальна ціна продажу</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900 mb-1">₴{totalSellingPrice.toLocaleString('uk-UA')}</p>
                  <p className="text-xs text-orange-600">Потенційний дохід</p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                  <Target className="w-8 h-8 text-white" />
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
              filters={[]}
              onFilterChange={() => {}}
              placeholder="Пошук за назвою товару або SKU..."
            />
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Калькуляції вартості ({filteredCalculations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCalculations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Немає калькуляцій для відображення
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Матеріали</TableHead>
                    <TableHead>Робота</TableHead>
                    <TableHead>Накладні</TableHead>
                    <TableHead>Собівартість</TableHead>
                    <TableHead>Маржа</TableHead>
                    <TableHead>Ціна продажу</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.map((calc: any) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{calc.product?.name}</div>
                          <div className="text-sm text-muted-foreground">{calc.product?.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>₴{parseFloat(calc.materialCost).toLocaleString('uk-UA')}</TableCell>
                      <TableCell>₴{parseFloat(calc.laborCost).toLocaleString('uk-UA')}</TableCell>
                      <TableCell>₴{parseFloat(calc.overheadCost).toLocaleString('uk-UA')}</TableCell>
                      <TableCell className="font-medium">₴{parseFloat(calc.totalCost).toLocaleString('uk-UA')}</TableCell>
                      <TableCell>{parseFloat(calc.profitMargin).toFixed(1)}%</TableCell>
                      <TableCell className="font-medium text-green-600">₴{parseFloat(calc.sellingPrice).toLocaleString('uk-UA')}</TableCell>
                      <TableCell>{calc.calculatedAt ? new Date(calc.calculatedAt).toLocaleDateString('uk-UA') : 'Н/Д'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCalculation(calc.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}