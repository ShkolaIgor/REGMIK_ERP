import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Bot, Factory, Clock, DollarSign, AlertTriangle, 
  CheckCircle, Users, Calendar, BarChart3, Target, Zap,
  ArrowRight, Package, Wrench, AlertCircle, TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProductionTaskRecommendation {
  orderId: number;
  orderNumber: string;
  totalProductionTime: number;
  totalCost: number;
  priority: 'high' | 'medium' | 'low';
  estimatedStartDate: string;
  estimatedEndDate: string;
  requiredResources: {
    specialists: number;
    generalWorkers: number;
    equipment: string[];
    criticalMaterials: string[];
  };
}

interface MassProductionPlan {
  totalOrders: number;
  totalProductionTime: number;
  totalCost: number;
  timeframe: {
    earliestStart: string;
    latestEnd: string;
    totalDays: number;
  };
  resourceRequirements: {
    peakSpecialists: number;
    peakGeneralWorkers: number;
    totalEquipmentHours: Record<string, number>;
    materialsList: Array<{
      name: string;
      totalQuantity: number;
      unit: string;
      estimatedCost: number;
    }>;
  };
  productionSchedule: Array<{
    week: number;
    weekStart: string;
    weekEnd: string;
    scheduledOrders: Array<{
      orderId: number;
      orderNumber: string;
      productionHours: number;
      completionPercentage: number;
    }>;
    resourceUtilization: {
      specialists: number;
      generalWorkers: number;
      equipmentHours: number;
    };
  }>;
  bottlenecks: Array<{
    type: 'resource' | 'equipment' | 'material' | 'skill';
    description: string;
    affectedOrders: number[];
    impact: string;
    recommendations: string[];
  }>;
  optimizations: Array<{
    type: 'scheduling' | 'resource' | 'cost' | 'quality';
    suggestion: string;
    estimatedSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
  }>;
}

interface MassProductionResponse {
  plan: MassProductionPlan;
  orderRecommendations: ProductionTaskRecommendation[];
  summary: {
    totalOrders: number;
    totalProductionTime: number;
    totalCost: number;
    timeframe: {
      earliestStart: string;
      latestEnd: string;
      totalDays: number;
    };
  };
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

const priorityLabels = {
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький'
};

const bottleneckTypeIcons = {
  resource: Users,
  equipment: Wrench,
  material: Package,
  skill: Target
};

export function MassProductionPlanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [planData, setPlanData] = useState<MassProductionResponse | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generatePlanMutation = useMutation({
    mutationFn: async (): Promise<MassProductionResponse> => {
      return await apiRequest(`/api/ai/mass-production-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (data) => {
      setPlanData(data);
      setSelectedOrders(data.orderRecommendations.map(rec => rec.orderId));
      toast({
        title: "План готовий",
        description: `Згенеровано план для ${data.plan.totalOrders} замовлень`,
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка планування",
        description: "Не вдалося згенерувати план виробництва",
        variant: "destructive",
      });
      console.error('Error generating plan:', error);
    }
  });

  const createTasksMutation = useMutation({
    mutationFn: async (recommendations: ProductionTaskRecommendation[]) => {
      return await apiRequest(`/api/ai/create-production-tasks`, {
        method: 'POST',
        body: { orderRecommendations: recommendations },
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Завдання створено",
        description: `Створено ${result.createdTasks} виробничих завдань`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/production-tasks'] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Помилка створення завдань",
        description: "Не вдалося створити виробничі завдання",
        variant: "destructive",
      });
      console.error('Error creating tasks:', error);
    }
  });

  const handleGeneratePlan = () => {
    generatePlanMutation.mutate();
  };

  const handleCreateTasks = () => {
    if (!planData) return;
    
    const selectedRecommendations = planData.orderRecommendations.filter(
      rec => selectedOrders.includes(rec.orderId)
    );
    
    createTasksMutation.mutate(selectedRecommendations);
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Factory className="h-4 w-4" />
          AI Планування виробництва
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            AI Масове планування виробництва
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Генерація плану */}
          {!planData && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Factory className="h-16 w-16 text-blue-600 mx-auto" />
                  <h3 className="text-xl font-medium">Згенерувати план виробництва</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    AI проаналізує всі оплачені замовлення та створить оптимальний план виробництва 
                    з розподілом ресурсів, часовими рамками та виявленням вузьких місць
                  </p>
                  <Button 
                    onClick={handleGeneratePlan}
                    disabled={generatePlanMutation.isPending}
                    size="lg"
                    className="w-full max-w-md"
                  >
                    {generatePlanMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Аналізуємо замовлення...
                      </>
                    ) : (
                      <>
                        <Bot className="h-5 w-5 mr-2" />
                        Згенерувати план виробництва
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Результати планування */}
          {planData && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Огляд</TabsTrigger>
                <TabsTrigger value="orders">Замовлення</TabsTrigger>
                <TabsTrigger value="schedule">Розклад</TabsTrigger>
                <TabsTrigger value="resources">Ресурси</TabsTrigger>
                <TabsTrigger value="optimization">Оптимізація</TabsTrigger>
              </TabsList>

              {/* Огляд */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Замовлень</p>
                          <p className="text-3xl font-bold">{planData.plan.totalOrders}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Часу виробництва</p>
                          <p className="text-3xl font-bold">{planData.plan.totalProductionTime}</p>
                          <p className="text-xs text-muted-foreground">годин</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Загальна вартість</p>
                          <p className="text-3xl font-bold">{planData.plan.totalCost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">грн</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Тривалість</p>
                          <p className="text-3xl font-bold">{planData.plan.timeframe.totalDays}</p>
                          <p className="text-xs text-muted-foreground">днів</p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Часові рамки */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Часові рамки
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Початок</p>
                        <p className="font-medium">{new Date(planData.plan.timeframe.earliestStart).toLocaleDateString('uk-UA')}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Закінчення</p>
                        <p className="font-medium">{new Date(planData.plan.timeframe.latestEnd).toLocaleDateString('uk-UA')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Вузькі місця */}
                {planData.plan.bottlenecks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Виявлені вузькі місця
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {planData.plan.bottlenecks.map((bottleneck, index) => {
                        const IconComponent = bottleneckTypeIcons[bottleneck.type];
                        return (
                          <div key={index} className="border rounded-lg p-3 bg-red-50">
                            <div className="flex items-center gap-2 mb-2">
                              <IconComponent className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800">{bottleneck.description}</span>
                            </div>
                            <p className="text-sm text-red-700 mb-2">{bottleneck.impact}</p>
                            <div className="text-xs">
                              <p className="font-medium mb-1">Рекомендації:</p>
                              <ul className="space-y-1">
                                {bottleneck.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Замовлення */}
              <TabsContent value="orders" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Замовлення для виробництва ({planData.orderRecommendations.length})</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Обрано: {selectedOrders.length} з {planData.orderRecommendations.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrders(
                        selectedOrders.length === planData.orderRecommendations.length 
                          ? [] 
                          : planData.orderRecommendations.map(rec => rec.orderId)
                      )}
                    >
                      {selectedOrders.length === planData.orderRecommendations.length ? 'Скасувати всі' : 'Обрати всі'}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {planData.orderRecommendations.map((recommendation) => (
                    <Card 
                      key={recommendation.orderId} 
                      className={`cursor-pointer transition-all ${
                        selectedOrders.includes(recommendation.orderId) 
                          ? 'ring-2 ring-blue-500 bg-blue-50' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => toggleOrderSelection(recommendation.orderId)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedOrders.includes(recommendation.orderId)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedOrders.includes(recommendation.orderId) && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <h4 className="font-medium">{recommendation.orderNumber}</h4>
                          </div>
                          <Badge className={priorityColors[recommendation.priority]}>
                            {priorityLabels[recommendation.priority]}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Час виробництва</p>
                            <p className="font-medium">{recommendation.totalProductionTime} год.</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Вартість</p>
                            <p className="font-medium">{recommendation.totalCost.toLocaleString()} грн</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Початок</p>
                            <p className="font-medium">{new Date(recommendation.estimatedStartDate).toLocaleDateString('uk-UA')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Закінчення</p>
                            <p className="font-medium">{new Date(recommendation.estimatedEndDate).toLocaleDateString('uk-UA')}</p>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          Ресурси: {recommendation.requiredResources.specialists} спеціалістів, {recommendation.requiredResources.generalWorkers} робітників
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Розклад */}
              <TabsContent value="schedule" className="space-y-4">
                <h3 className="text-lg font-medium">Тижневий розклад виробництва</h3>
                <div className="space-y-4">
                  {planData.plan.productionSchedule.map((week) => (
                    <Card key={week.week}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Тиждень {week.week} ({new Date(week.weekStart).toLocaleDateString('uk-UA')} - {new Date(week.weekEnd).toLocaleDateString('uk-UA')})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {week.scheduledOrders.length > 0 ? (
                          <>
                            <div className="grid gap-2">
                              {week.scheduledOrders.map((order) => (
                                <div key={order.orderId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{order.orderNumber}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">{order.productionHours} год.</span>
                                    <div className="flex items-center gap-2">
                                      <Progress value={order.completionPercentage} className="w-16" />
                                      <span className="text-xs">{order.completionPercentage}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm text-muted-foreground border-t pt-2">
                              Завантаження: {week.resourceUtilization.specialists} спеціалістів, {week.resourceUtilization.generalWorkers} робітників, {week.resourceUtilization.equipmentHours} машино-годин
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Замовлень не заплановано</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Ресурси */}
              <TabsContent value="resources" className="space-y-4">
                <h3 className="text-lg font-medium">Вимоги до ресурсів</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Персонал
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>Піковий час спеціалістів:</span>
                        <span className="font-medium">{planData.plan.resourceRequirements.peakSpecialists}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Піковий час робітників:</span>
                        <span className="font-medium">{planData.plan.resourceRequirements.peakGeneralWorkers}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Матеріали
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {planData.plan.resourceRequirements.materialsList.map((material, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{material.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {material.totalQuantity} {material.unit}
                            </span>
                          </div>
                          <span className="font-medium">{material.estimatedCost} грн</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Оптимізація */}
              <TabsContent value="optimization" className="space-y-4">
                <h3 className="text-lg font-medium">Рекомендації з оптимізації</h3>
                
                <div className="grid gap-4">
                  {planData.plan.optimizations.map((optimization, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <Badge variant="outline">
                            {optimization.type === 'scheduling' ? 'Планування' : 
                             optimization.type === 'resource' ? 'Ресурси' : 
                             optimization.type === 'cost' ? 'Вартість' : 'Якість'}
                          </Badge>
                          <Badge variant={optimization.implementationEffort === 'low' ? 'default' : 
                                         optimization.implementationEffort === 'medium' ? 'secondary' : 'destructive'}>
                            {optimization.implementationEffort === 'low' ? 'Легко' : 
                             optimization.implementationEffort === 'medium' ? 'Середнє' : 'Складно'}
                          </Badge>
                        </div>
                        <p className="font-medium mb-1">{optimization.suggestion}</p>
                        <p className="text-sm text-green-600">
                          Очікувана економія: {optimization.estimatedSavings} год./грн
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Дії */}
          {planData && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Обрано {selectedOrders.length} з {planData.orderRecommendations.length} замовлень для створення завдань
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGeneratePlan}
                  variant="outline"
                  disabled={generatePlanMutation.isPending}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Оновити план
                </Button>
                <Button 
                  onClick={handleCreateTasks}
                  disabled={selectedOrders.length === 0 || createTasksMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createTasksMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Створюємо...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Створити виробничі завдання ({selectedOrders.length})
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}