import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Factory, Package, Plus, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";

interface ProductionPlan {
  id: number;
  productId: number;
  product: any;
  plannedQuantity: number;
  planningPeriod: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  notes: string;
}

interface SupplyDecision {
  id: number;
  productId: number;
  product: any;
  requiredQuantity: number;
  decisionType: string;
  manufactureQuantity: number;
  purchaseQuantity: number;
  stockLevel: number;
  decisionReason: string;
  status: string;
}

export default function ProductionPlanning() {
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [planData, setPlanData] = useState({
    productId: 0,
    plannedQuantity: 0,
    planningPeriod: "weekly",
    startDate: "",
    endDate: "",
    priority: "medium",
    notes: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: productionPlans = [] } = useQuery<ProductionPlan[]>({
    queryKey: ["/api/production-plans"],
    retry: false,
  });

  const { data: supplyDecisions = [] } = useQuery<SupplyDecision[]>({
    queryKey: ["/api/supply-decisions"],
    retry: false,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({
        url: "/api/production-plans",
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "План виробництва створено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      setIsCreatePlanOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити план виробництва",
        variant: "destructive",
      });
    },
  });

  const analyzeSupplyMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest({
        url: `/api/analyze-supply/${productId}`,
        method: "POST",
        body: { requiredQuantity: 10 }, // Аналіз для 10 одиниць
      });
    },
    onSuccess: () => {
      toast({
        title: "Аналіз завершено",
        description: "Рекомендації щодо постачання оновлено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/supply-decisions"] });
    },
  });

  const resetForm = () => {
    setPlanData({
      productId: 0,
      plannedQuantity: 0,
      planningPeriod: "weekly",
      startDate: "",
      endDate: "",
      priority: "medium",
      notes: ""
    });
    setSelectedProduct("");
  };

  const handleCreatePlan = () => {
    if (!selectedProduct || planData.plannedQuantity <= 0) {
      toast({
        title: "Помилка",
        description: "Оберіть продукт та вкажіть кількість",
        variant: "destructive",
      });
      return;
    }

    createPlanMutation.mutate({
      ...planData,
      productId: parseInt(selectedProduct),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "default";
      case "in_progress": return "secondary";
      case "completed": return "outline";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "secondary";
      case "medium": return "default";
      case "low": return "outline";
      default: return "default";
    }
  };

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case "manufacture": return "default";
      case "purchase": return "secondary";
      case "partial_manufacture": return "outline";
      case "use_stock": return "outline";
      default: return "default";
    }
  };

  const getSemiFabricatedProducts = () => {
    return (Array.isArray(products) ? products : products?.data || []).filter((p: any) => p.productType === "semifinished" || p.productType === "component");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Планування виробництва</h1>
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Створити план
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Новий план виробництва</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Продукт</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть продукт" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Кількість</Label>
                  <Input
                    type="number"
                    value={planData.plannedQuantity}
                    onChange={(e) => setPlanData({ ...planData, plannedQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Період</Label>
                  <Select 
                    value={planData.planningPeriod} 
                    onValueChange={(value) => setPlanData({ ...planData, planningPeriod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Щоденно</SelectItem>
                      <SelectItem value="weekly">Щотижня</SelectItem>
                      <SelectItem value="monthly">Щомісяця</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Початок</Label>
                  <UkrainianDatePicker
                    date={planData.startDate ? new Date(planData.startDate) : undefined}
                    onDateChange={(date) => setPlanData({ ...planData, startDate: date ? date.toISOString().split('T')[0] : '' })}
                  />
                </div>
                <div>
                  <Label>Закінчення</Label>
                  <UkrainianDatePicker
                    date={planData.endDate ? new Date(planData.endDate) : undefined}
                    onDateChange={(date) => setPlanData({ ...planData, endDate: date ? date.toISOString().split('T')[0] : '' })}
                  />
                </div>
              </div>

              <div>
                <Label>Пріоритет</Label>
                <Select 
                  value={planData.priority} 
                  onValueChange={(value) => setPlanData({ ...planData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низький</SelectItem>
                    <SelectItem value="medium">Середній</SelectItem>
                    <SelectItem value="high">Високий</SelectItem>
                    <SelectItem value="urgent">Терміново</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Примітки</Label>
                <Textarea
                  value={planData.notes}
                  onChange={(e) => setPlanData({ ...planData, notes: e.target.value })}
                  placeholder="Додаткові примітки..."
                />
              </div>

              <Button 
                onClick={handleCreatePlan} 
                className="w-full"
                disabled={createPlanMutation.isPending}
              >
                {createPlanMutation.isPending ? "Створення..." : "Створити план"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">
            <CalendarDays className="w-4 h-4 mr-2" />
            Плани виробництва
          </TabsTrigger>
          <TabsTrigger value="decisions">
            <TrendingUp className="w-4 h-4 mr-2" />
            Рекомендації постачання
          </TabsTrigger>
          <TabsTrigger value="semifabs">
            <Package className="w-4 h-4 mr-2" />
            Полуфабрикати
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Активні плани виробництва</CardTitle>
            </CardHeader>
            <CardContent>
              {productionPlans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Плани виробництва відсутні</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Продукт</TableHead>
                      <TableHead>Кількість</TableHead>
                      <TableHead>Період</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Пріоритет</TableHead>
                      <TableHead>Дати</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.product?.name || `Продукт ${plan.productId}`}
                        </TableCell>
                        <TableCell>{plan.plannedQuantity} шт</TableCell>
                        <TableCell>{plan.planningPeriod}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(plan.status)}>
                            {plan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(plan.priority)}>
                            {plan.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {plan.startDate} - {plan.endDate}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Розумні рекомендації постачання</CardTitle>
            </CardHeader>
            <CardContent>
              {supplyDecisions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Рекомендації відсутні</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Спробуйте проаналізувати продукт для отримання рекомендацій
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Продукт</TableHead>
                      <TableHead>Потреба</TableHead>
                      <TableHead>Запаси</TableHead>
                      <TableHead>Рекомендація</TableHead>
                      <TableHead>Обґрунтування</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplyDecisions.map((decision) => (
                      <TableRow key={decision.id}>
                        <TableCell className="font-medium">
                          {decision.product?.name || `Продукт ${decision.productId}`}
                        </TableCell>
                        <TableCell>{decision.requiredQuantity} шт</TableCell>
                        <TableCell>{decision.stockLevel} шт</TableCell>
                        <TableCell>
                          <Badge variant={getDecisionTypeColor(decision.decisionType)}>
                            {decision.decisionType === 'manufacture' && 'Виготовити'}
                            {decision.decisionType === 'purchase' && 'Купити'}
                            {decision.decisionType === 'partial_manufacture' && 'Частково виготовити'}
                            {decision.decisionType === 'use_stock' && 'Використати запаси'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {decision.decisionReason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semifabs">
          <Card>
            <CardHeader>
              <CardTitle>Управління полуфабрикатами</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getSemiFabricatedProducts().map((product: any) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.sku}</p>
                        <Badge variant="outline" className="mt-2">
                          {product.productType === 'semifinished' ? 'Полуфабрикат' : 'Компонент'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => analyzeSupplyMutation.mutate(product.id)}
                        disabled={analyzeSupplyMutation.isPending}
                      >
                        <Factory className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Вартість: {product.costPrice} грн</p>
                      <p>Час виготовлення: {product.leadTimeDays || 7} днів</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}