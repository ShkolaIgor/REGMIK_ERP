import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Bot, Factory, Clock, DollarSign, AlertTriangle, 
  CheckCircle, Users, Cog, Leaf, Target, TrendingUp, Calendar,
  Package, Wrench, Shield, Lightbulb
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProductionRecommendation {
  productionTime: {
    estimated: number;
    unit: 'hours' | 'days' | 'weeks';
    breakdown: Array<{
      stage: string;
      time: number;
      description: string;
    }>;
  };
  resourceRequirements: {
    materials: Array<{
      name: string;
      quantity: number;
      unit: string;
      availability: 'available' | 'limited' | 'needs_ordering';
      estimatedCost: number;
    }>;
    equipment: Array<{
      name: string;
      utilizationTime: number;
      bottleneck: boolean;
    }>;
    workforce: {
      specialists: number;
      generalWorkers: number;
      totalHours: number;
    };
  };
  productionSequence: Array<{
    step: number;
    operation: string;
    duration: number;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
    instructions: string;
  }>;
  qualityChecks: Array<{
    stage: string;
    checkType: string;
    criteria: string;
    requiredTools: string[];
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    risks: Array<{
      type: string;
      probability: number;
      impact: string;
      mitigation: string;
    }>;
  };
  costEstimate: {
    materials: number;
    labor: number;
    overhead: number;
    total: number;
    profitMargin: number;
  };
  optimizations: Array<{
    type: 'time' | 'cost' | 'quality' | 'efficiency';
    suggestion: string;
    impact: string;
    implementation: string;
  }>;
  sustainability: {
    energyConsumption: number;
    wasteGeneration: number;
    carbonFootprint: number;
    recyclingOpportunities: string[];
  };
  reasoning: string;
}

interface OrderProductionAnalysis {
  orderId: number;
  totalProductionTime: number;
  totalCost: number;
  criticalPath: string[];
  productRecommendations: Array<{
    productId: number;
    productName: string;
    quantity: number;
    recommendation: ProductionRecommendation;
  }>;
  orderLevelOptimizations: string[];
  deliveryFeasibility: {
    canMeetDeadline: boolean;
    recommendedStartDate: string;
    bufferTime: number;
  };
}

interface AIProductionAnalysisProps {
  orderId: number;
  orderNumber?: string;
}

const riskLevelColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const riskLevelLabels = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий'
};

const availabilityColors = {
  available: 'bg-green-100 text-green-800',
  limited: 'bg-yellow-100 text-yellow-800',
  needs_ordering: 'bg-red-100 text-red-800'
};

const availabilityLabels = {
  available: 'Доступно',
  limited: 'Обмежено',
  needs_ordering: 'Потрібне замовлення'
};

const optimizationTypeIcons = {
  time: Clock,
  cost: DollarSign,
  quality: Shield,
  efficiency: TrendingUp
};

export function AIProductionAnalysis({ orderId, orderNumber }: AIProductionAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const analyzeProductionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ai/production-analysis`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Аналіз готовий",
        description: "AI проаналізував замовлення та згенерував рекомендації щодо виробництва",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка аналізу",
        description: "Не вдалося згенерувати аналіз виробництва. Спробуйте ще раз.",
        variant: "destructive",
      });
      console.error('Error analyzing production:', error);
    }
  });

  const analysis = analyzeProductionMutation.data as OrderProductionAnalysis | undefined;

  const handleAnalyzeProduction = () => {
    analyzeProductionMutation.mutate();
  };

  const formatTimeUnit = (time: number, unit: string) => {
    const unitLabels = {
      hours: time === 1 ? 'година' : time < 5 ? 'години' : 'годин',
      days: time === 1 ? 'день' : time < 5 ? 'дні' : 'днів',
      weeks: time === 1 ? 'тиждень' : time < 5 ? 'тижні' : 'тижнів'
    };
    return `${time} ${unitLabels[unit as keyof typeof unitLabels] || unit}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Factory className="h-4 w-4" />
          AI Аналіз виробництва
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            AI Аналіз виробництва {orderNumber && `- замовлення ${orderNumber}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Генерація аналізу */}
          {!analysis && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Factory className="h-12 w-12 text-blue-600 mx-auto" />
                  <h3 className="font-medium">Згенерувати AI аналіз виробництва</h3>
                  <p className="text-muted-foreground">
                    Штучний інтелект проаналізує товари, компоненти та ресурси для оптимального планування виробництва
                  </p>
                  <Button 
                    onClick={handleAnalyzeProduction}
                    disabled={analyzeProductionMutation.isPending}
                    className="w-full"
                  >
                    {analyzeProductionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Аналізуємо виробництво...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Згенерувати аналіз
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Результати аналізу */}
          {analysis && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Огляд</TabsTrigger>
                <TabsTrigger value="products">Товари</TabsTrigger>
                <TabsTrigger value="resources">Ресурси</TabsTrigger>
                <TabsTrigger value="timeline">Часова лінія</TabsTrigger>
                <TabsTrigger value="optimization">Оптимізація</TabsTrigger>
              </TabsList>

              {/* Огляд */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Загальний час</p>
                          <p className="text-2xl font-bold">{analysis.totalProductionTime}</p>
                          <p className="text-xs text-muted-foreground">годин</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Загальна вартість</p>
                          <p className="text-2xl font-bold">{analysis.totalCost.toLocaleString()}</p>
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
                          <p className="text-sm text-muted-foreground">Товарів у виробництві</p>
                          <p className="text-2xl font-bold">{analysis.productRecommendations.length}</p>
                          <p className="text-xs text-muted-foreground">найменувань</p>
                        </div>
                        <Package className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Дедлайн</p>
                          <p className="text-lg font-bold">
                            {analysis.deliveryFeasibility.canMeetDeadline ? (
                              <span className="text-green-600">Реальний</span>
                            ) : (
                              <span className="text-red-600">Ризик</span>
                            )}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Критичний шлях */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-600" />
                      Критичний шлях виробництва
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.criticalPath.map((item, index) => (
                        <Badge key={index} variant="destructive" className="text-sm">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Оптимізації рівня замовлення */}
                {analysis.orderLevelOptimizations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        Рекомендації для замовлення
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.orderLevelOptimizations.map((optimization, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{optimization}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Товари */}
              <TabsContent value="products" className="space-y-4">
                {analysis.productRecommendations.map((product) => (
                  <Card key={product.productId}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{product.productName}</span>
                        <Badge variant="outline">{product.quantity} шт.</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Час виробництва */}
                      <div>
                        <h4 className="font-medium mb-2">Час виробництва</h4>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-lg font-bold">
                            {formatTimeUnit(product.recommendation.productionTime.estimated, product.recommendation.productionTime.unit)}
                          </span>
                          <Badge className={riskLevelColors[product.recommendation.riskAssessment.overallRisk]}>
                            Ризик: {riskLevelLabels[product.recommendation.riskAssessment.overallRisk]}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {product.recommendation.productionTime.breakdown.map((stage, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{stage.stage}</span>
                              <span>{stage.time} год.</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Вартість */}
                      <div>
                        <h4 className="font-medium mb-2">Оцінка вартості</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">Матеріали</div>
                            <div className="font-medium">{product.recommendation.costEstimate.materials} грн</div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">Праця</div>
                            <div className="font-medium">{product.recommendation.costEstimate.labor} грн</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">Накладні</div>
                            <div className="font-medium">{product.recommendation.costEstimate.overhead} грн</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded border-2 border-purple-200">
                            <div className="text-xs text-muted-foreground">Загалом</div>
                            <div className="font-bold">{product.recommendation.costEstimate.total} грн</div>
                          </div>
                        </div>
                      </div>

                      {/* Обґрунтування AI */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          Обґрунтування AI
                        </h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {product.recommendation.reasoning}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Ресурси */}
              <TabsContent value="resources" className="space-y-4">
                {analysis.productRecommendations.map((product) => (
                  <Card key={`resources-${product.productId}`}>
                    <CardHeader>
                      <CardTitle>{product.productName} - Ресурси</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Матеріали */}
                      {product.recommendation.resourceRequirements.materials.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Матеріали
                          </h4>
                          <div className="space-y-2">
                            {product.recommendation.resourceRequirements.materials.map((material, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="font-medium">{material.name}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {material.quantity} {material.unit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{material.estimatedCost} грн</span>
                                  <Badge className={availabilityColors[material.availability]}>
                                    {availabilityLabels[material.availability]}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Обладнання */}
                      {product.recommendation.resourceRequirements.equipment.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Cog className="h-4 w-4" />
                            Обладнання
                          </h4>
                          <div className="space-y-2">
                            {product.recommendation.resourceRequirements.equipment.map((equipment, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">{equipment.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{equipment.utilizationTime} год.</span>
                                  {equipment.bottleneck && (
                                    <Badge variant="destructive">Вузьке місце</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Робоча сила */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Робоча сила
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-2xl font-bold text-blue-600">
                              {product.recommendation.resourceRequirements.workforce.specialists}
                            </div>
                            <div className="text-sm text-muted-foreground">Спеціалістів</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {product.recommendation.resourceRequirements.workforce.generalWorkers}
                            </div>
                            <div className="text-sm text-muted-foreground">Робітників</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded">
                            <div className="text-2xl font-bold text-orange-600">
                              {product.recommendation.resourceRequirements.workforce.totalHours}
                            </div>
                            <div className="text-sm text-muted-foreground">Людино-годин</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Часова лінія */}
              <TabsContent value="timeline" className="space-y-4">
                {analysis.productRecommendations.map((product) => (
                  <Card key={`timeline-${product.productId}`}>
                    <CardHeader>
                      <CardTitle>{product.productName} - Послідовність операцій</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {product.recommendation.productionSequence.length > 0 ? (
                        <div className="space-y-3">
                          {product.recommendation.productionSequence.map((step, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 pb-3">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium">Крок {step.step}: {step.operation}</h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">{step.duration} год.</span>
                                  <Badge className={riskLevelColors[step.riskLevel]}>
                                    {riskLevelLabels[step.riskLevel]}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{step.instructions}</p>
                              {step.dependencies.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Залежності: {step.dependencies.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Послідовність операцій не визначена</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Оптимізація */}
              <TabsContent value="optimization" className="space-y-4">
                {analysis.productRecommendations.map((product) => (
                  <Card key={`optimization-${product.productId}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        {product.productName} - Оптимізації
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Пропозиції оптимізації */}
                      {product.recommendation.optimizations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Рекомендації для покращення</h4>
                          <div className="grid gap-3">
                            {product.recommendation.optimizations.map((opt, index) => {
                              const IconComponent = optimizationTypeIcons[opt.type];
                              return (
                                <div key={index} className="border rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <IconComponent className="h-4 w-4 text-blue-600" />
                                    <Badge variant="outline">{opt.type === 'time' ? 'Час' : opt.type === 'cost' ? 'Вартість' : opt.type === 'quality' ? 'Якість' : 'Ефективність'}</Badge>
                                  </div>
                                  <p className="font-medium text-sm mb-1">{opt.suggestion}</p>
                                  <p className="text-xs text-muted-foreground mb-1">Вплив: {opt.impact}</p>
                                  <p className="text-xs text-green-600">Впровадження: {opt.implementation}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Екологічність */}
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-green-600" />
                          Екологічний вплив
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center bg-green-50 p-3 rounded">
                            <div className="text-lg font-bold text-green-600">
                              {product.recommendation.sustainability.energyConsumption}
                            </div>
                            <div className="text-xs text-muted-foreground">кВт⋅год енергії</div>
                          </div>
                          <div className="text-center bg-orange-50 p-3 rounded">
                            <div className="text-lg font-bold text-orange-600">
                              {product.recommendation.sustainability.wasteGeneration}
                            </div>
                            <div className="text-xs text-muted-foreground">кг відходів</div>
                          </div>
                          <div className="text-center bg-blue-50 p-3 rounded">
                            <div className="text-lg font-bold text-blue-600">
                              {product.recommendation.sustainability.carbonFootprint}
                            </div>
                            <div className="text-xs text-muted-foreground">кг CO₂</div>
                          </div>
                        </div>
                        {product.recommendation.sustainability.recyclingOpportunities.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Можливості переробки:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {product.recommendation.sustainability.recyclingOpportunities.map((opportunity, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                                  {opportunity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}

          {/* Дії */}
          {analysis && (
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyzeProduction}
                variant="outline"
                disabled={analyzeProductionMutation.isPending}
              >
                <Bot className="h-4 w-4 mr-2" />
                Оновити аналіз
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Закрити
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}