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
import { Calculator, Plus, TrendingUp, DollarSign, Package, Settings, Search, Trash } from "lucide-react";
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

  const { data: productsResponse } = useQuery({
    queryKey: ["/api/products"],
  });
  
  const products = Array.isArray(productsResponse) ? productsResponse : (productsResponse?.data || []);

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

  // Filter and sort calculations
  const filteredAndSortedCalculations = (calculations as (CostCalculation & { product: Product })[])
    .filter((calc) => {
      const productName = calc.product?.name || "";
      return productName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case "product":
          aVal = a.product?.name.toLowerCase() || "";
          bVal = b.product?.name.toLowerCase() || "";
          break;
        case "totalCost":
          aVal = parseFloat(a.totalCost);
          bVal = parseFloat(b.totalCost);
          break;
        case "sellingPrice":
          aVal = parseFloat(a.sellingPrice);
          bVal = parseFloat(b.sellingPrice);
          break;
        case "profitMargin":
          aVal = parseFloat(a.profitMargin);
          bVal = parseFloat(b.profitMargin);
          break;
        case "calculatedAt":
          aVal = a.calculatedAt ? new Date(a.calculatedAt).getTime() : 0;
          bVal = b.calculatedAt ? new Date(b.calculatedAt).getTime() : 0;
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-50/30">
        <div className="w-full px-6 py-6">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50/30">
      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Калькуляції вартості</h1>
            <p className="text-gray-600">Розрахунок вартості та рентабельності продуктів</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => autoCalculateMutation.mutate()}>
              <Settings className="h-4 w-4 mr-2" />
              Автокалькуляція
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
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
                        {(products as Product[] || []).map((product) => (
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

        {/* Пошук */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Пошук по назві продукту..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Всього калькуляцій</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Середня маржа</p>
                  <p className="text-2xl font-bold">
                    {totalItems > 0 
                      ? ((calculations as CostCalculation[]).reduce((sum, calc) => sum + parseFloat(calc.profitMargin), 0) / totalItems).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Загальна вартість</p>
                  <p className="text-2xl font-bold">
                    ₴{(calculations as CostCalculation[]).reduce((sum, calc) => sum + parseFloat(calc.totalCost), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Пагінація верхня */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Показано {startIndex + 1}-{Math.min(endIndex, totalItems)} з {totalItems} записів
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Розмір сторінки:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(value === "all" ? -1 : parseInt(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Всі</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Результати калькуляцій */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("product")}
                  >
                    Продукт
                    {sortField === "product" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead>Вартість матеріалів</TableHead>
                  <TableHead>Вартість роботи</TableHead>
                  <TableHead>Накладні витрати</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("totalCost")}
                  >
                    Загальна собівартість
                    {sortField === "totalCost" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("profitMargin")}
                  >
                    Маржа (%)
                    {sortField === "profitMargin" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("sellingPrice")}
                  >
                    Продажна ціна
                    {sortField === "sellingPrice" && (
                      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCalculations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Calculator className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">Калькуляції не знайдено</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCalculations.map((calculation) => (
                    <TableRow key={calculation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{calculation.product.name}</div>
                          <div className="text-sm text-gray-500">{calculation.product.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>₴{calculation.materialCost}</TableCell>
                      <TableCell>₴{calculation.laborCost}</TableCell>
                      <TableCell>₴{calculation.overheadCost}</TableCell>
                      <TableCell className="font-medium">₴{calculation.totalCost}</TableCell>
                      <TableCell>{calculation.profitMargin}%</TableCell>
                      <TableCell className="font-medium text-green-600">₴{calculation.sellingPrice}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCalculation(calculation.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Пагінація нижня */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Сторінка {currentPage} з {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Перша
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <span className="mx-2">
                Сторінка {currentPage} з {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Остання
              </Button>
            </div>
          </div>
        )}

        {/* Продукти без калькуляцій */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Продукти без калькуляцій
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(products as Product[])
                  .filter((product: Product) => !(calculations as CostCalculation[]).some((calc) => calc.productId === product.id))
                  .map((product: Product) => (
                    <Card key={product.id} className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product.id);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Розрахувати
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
              {(products as Product[]).filter((product: Product) => !(calculations as CostCalculation[]).some((calc) => calc.productId === product.id)).length === 0 && (
                <p className="text-center text-gray-500">Всі продукти мають калькуляції</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}