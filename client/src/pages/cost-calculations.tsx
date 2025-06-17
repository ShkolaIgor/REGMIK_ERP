import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, Plus, TrendingUp, DollarSign, Package, Settings } from "lucide-react";
import { Product, CostCalculation, InsertCostCalculation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CostCalculationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [newCalculation, setNewCalculation] = useState<Partial<InsertCostCalculation>>({
    materialCost: "0",
    laborCost: "0",
    overheadCost: "0",
    profitMargin: "20"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("product");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ["/api/cost-calculations"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const createCalculationMutation = useMutation({
    mutationFn: async (data: InsertCostCalculation) => {
      const res = await apiRequest("POST", "/api/cost-calculations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-calculations"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Успіх",
        description: "Калькуляцію собівартості створено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити калькуляцію",
        variant: "destructive",
      });
    },
  });

  const autoCalculateMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("POST", `/api/cost-calculations/calculate/${productId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-calculations"] });
      toast({
        title: "Успіх",
        description: "Автоматичну калькуляцію виконано",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося виконати автоматичну калькуляцію",
        variant: "destructive",
      });
    },
  });

  // Filter and sort calculations
  const filteredAndSortedCalculations = (calculations as (CostCalculation & { product: Product })[])
    .filter((calc) => {
      const matchesSearch = calc.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           calc.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "product":
          aVal = a.product.name.toLowerCase();
          bVal = b.product.name.toLowerCase();
          break;
        case "totalCost":
          aVal = parseFloat(a.totalCost);
          bVal = parseFloat(b.totalCost);
          break;
        case "profitMargin":
          aVal = parseFloat(a.profitMargin);
          bVal = parseFloat(b.profitMargin);
          break;
        case "sellingPrice":
          aVal = parseFloat(a.sellingPrice);
          bVal = parseFloat(b.sellingPrice);
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination
  const totalItems = filteredAndSortedCalculations.length;
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
  const startIndex = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalItems : startIndex + pageSize;
  const paginatedCalculations = filteredAndSortedCalculations.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
      notes: newCalculation.notes || ""
    };

    createCalculationMutation.mutate(calculationData);
  };

  const handleAutoCalculate = (productId: number) => {
    autoCalculateMutation.mutate(productId);
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Калькуляція собівартості</h1>
          <p className="text-gray-600">Розрахунок витрат та ціноутворення</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Нова калькуляція
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Створити калькуляцію собівартості</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="product">Продукт</Label>
                  <Select 
                    value={selectedProduct?.toString() || ""} 
                    onValueChange={(value) => setSelectedProduct(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Виберіть продукт" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="materialCost">Матеріальні витрати</Label>
                    <Input
                      id="materialCost"
                      type="number"
                      step="0.01"
                      value={newCalculation.materialCost || "0"}
                      onChange={(e) => setNewCalculation({ ...newCalculation, materialCost: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="laborCost">Трудові витрати</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      value={newCalculation.laborCost || "0"}
                      onChange={(e) => setNewCalculation({ ...newCalculation, laborCost: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="overheadCost">Накладні витрати</Label>
                    <Input
                      id="overheadCost"
                      type="number"
                      step="0.01"
                      value={newCalculation.overheadCost || "0"}
                      onChange={(e) => setNewCalculation({ ...newCalculation, overheadCost: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="profitMargin">Маржа прибутку (%)</Label>
                    <Input
                      id="profitMargin"
                      type="number"
                      step="0.01"
                      value={newCalculation.profitMargin || "20"}
                      onChange={(e) => setNewCalculation({ ...newCalculation, profitMargin: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Примітки</Label>
                  <Textarea
                    id="notes"
                    value={newCalculation.notes || ""}
                    onChange={(e) => setNewCalculation({ ...newCalculation, notes: e.target.value })}
                    placeholder="Додаткові примітки..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateCalculation} 
                    disabled={createCalculationMutation.isPending}
                    className="flex-1"
                  >
                    {createCalculationMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальна кількість</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Середня маржа</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculations.length > 0 
                ? (calculations.reduce((sum: number, calc: CostCalculation) => sum + parseFloat(calc.profitMargin), 0) / calculations.length).toFixed(1)
                : "0"}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Загальна вартість</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₴{calculations.reduce((sum: number, calc: CostCalculation) => sum + parseFloat(calc.totalCost), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Продуктів з калькуляцією</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Калькуляції собівартості</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Продукт</TableHead>
                <TableHead>Матеріали</TableHead>
                <TableHead>Праця</TableHead>
                <TableHead>Накладні</TableHead>
                <TableHead>Загальна вартість</TableHead>
                <TableHead>Маржа</TableHead>
                <TableHead>Ціна продажу</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Calculator className="w-8 h-8 text-gray-400" />
                      <p className="text-gray-500">Немає калькуляцій собівартості</p>
                      <p className="text-sm text-gray-400">Створіть першу калькуляцію або використайте автоматичний розрахунок</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                calculations.map((calculation: CostCalculation & { product: Product }) => (
                  <TableRow key={calculation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{calculation.product.name}</div>
                        <div className="text-sm text-gray-500">{calculation.product.sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>₴{parseFloat(calculation.materialCost).toFixed(2)}</TableCell>
                    <TableCell>₴{parseFloat(calculation.laborCost).toFixed(2)}</TableCell>
                    <TableCell>₴{parseFloat(calculation.overheadCost).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">₴{parseFloat(calculation.totalCost).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{parseFloat(calculation.profitMargin).toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">₴{parseFloat(calculation.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAutoCalculate(calculation.productId)}
                        disabled={autoCalculateMutation.isPending}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Перерахувати
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Швидке створення калькуляцій</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Автоматично розрахуйте собівартість для продуктів на основі їх компонентів та рецептів
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter((product: Product) => !calculations.some((calc: CostCalculation) => calc.productId === product.id))
                .map((product: Product) => (
                  <Card key={product.id} className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleAutoCalculate(product.id)}
                          disabled={autoCalculateMutation.isPending}
                        >
                          <Calculator className="w-4 h-4 mr-1" />
                          Розрахувати
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
            {products.filter((product: Product) => !calculations.some((calc: CostCalculation) => calc.productId === product.id)).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Усі продукти мають калькуляції собівартості
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}