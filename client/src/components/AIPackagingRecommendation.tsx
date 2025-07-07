import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, Package, Bot, Lightbulb, Leaf, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PackagingRecommendation {
  packageType: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  estimatedWeight: number;
  packagingMaterial: string;
  protectionLevel: 'standard' | 'reinforced' | 'fragile' | 'hazardous';
  specialInstructions: string[];
  estimatedCost: number;
  carbonFootprint: {
    packaging: number;
    shipping: number;
    total: number;
  };
  reasoning: string;
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  productSku?: string;
}

interface AIPackagingRecommendationProps {
  orderId: number;
  orderItems: OrderItem[];
  shippingDetails?: {
    destination?: string;
    carrier?: string;
    urgency?: 'standard' | 'express' | 'overnight';
  };
}

const protectionLevelColors = {
  standard: 'bg-blue-100 text-blue-800',
  reinforced: 'bg-yellow-100 text-yellow-800',
  fragile: 'bg-orange-100 text-orange-800',
  hazardous: 'bg-red-100 text-red-800'
};

const protectionLevelLabels = {
  standard: 'Стандартна',
  reinforced: 'Посилена',
  fragile: 'Для крихких товарів',
  hazardous: 'Небезпечні товари'
};

export function AIPackagingRecommendation({ 
  orderId, 
  orderItems, 
  shippingDetails 
}: AIPackagingRecommendationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const generateRecommendationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/ai/packaging-recommendation`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          orderItems: orderItems.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            productSku: item.productSku
          })),
          shippingDetails: {
            destination: shippingDetails?.destination || 'Україна',
            carrier: shippingDetails?.carrier || 'Нова Пошта',
            urgency: shippingDetails?.urgency || 'standard'
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Рекомендації готові",
        description: "AI проаналізував замовлення та згенерував рекомендації щодо упаковки",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка генерації",
        description: "Не вдалося згенерувати рекомендації. Спробуйте ще раз.",
        variant: "destructive",
      });
      console.error('Error generating recommendation:', error);
    }
  });

  const recommendation = generateRecommendationMutation.data as PackagingRecommendation | undefined;

  const handleGenerateRecommendation = () => {
    generateRecommendationMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Рекомендації упаковки
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Рекомендації щодо упаковки
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Інформація про замовлення */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Товари у замовленні
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{item.productName}</span>
                    <Badge variant="secondary">{item.quantity} шт.</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Генерація рекомендацій */}
          {!recommendation && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Bot className="h-12 w-12 text-blue-600 mx-auto" />
                  <h3 className="font-medium">Згенерувати AI рекомендації</h3>
                  <p className="text-muted-foreground">
                    Штучний інтелект проаналізує товари у замовленні та запропонує оптимальну упаковку
                  </p>
                  <Button 
                    onClick={handleGenerateRecommendation}
                    disabled={generateRecommendationMutation.isPending}
                    className="w-full"
                  >
                    {generateRecommendationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Аналізуємо...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Згенерувати рекомендації
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Результати рекомендацій */}
          {recommendation && (
            <div className="space-y-4">
              {/* Основна рекомендація */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Рекомендована упаковка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Тип упаковки:</span>
                        <span className="font-medium">{recommendation.packageType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Матеріал:</span>
                        <span className="font-medium">{recommendation.packagingMaterial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Рівень захисту:</span>
                        <Badge className={protectionLevelColors[recommendation.protectionLevel]}>
                          {protectionLevelLabels[recommendation.protectionLevel]}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Розміри:</span>
                        <span className="font-medium">
                          {recommendation.dimensions.length} × {recommendation.dimensions.width} × {recommendation.dimensions.height} {recommendation.dimensions.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Загальна вага:</span>
                        <span className="font-medium">{recommendation.estimatedWeight} кг</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Вартість упаковки:</span>
                        <span className="font-medium text-green-600">{recommendation.estimatedCost} грн</span>
                      </div>
                    </div>
                  </div>

                  {recommendation.specialInstructions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        Спеціальні інструкції:
                      </h4>
                      <ul className="space-y-1">
                        {recommendation.specialInstructions.map((instruction, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Екологічний вплив */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Екологічний вплив
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {recommendation.carbonFootprint.packaging}
                      </div>
                      <div className="text-sm text-muted-foreground">кг CO₂ упаковка</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {recommendation.carbonFootprint.shipping}
                      </div>
                      <div className="text-sm text-muted-foreground">кг CO₂ доставка</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {recommendation.carbonFootprint.total}
                      </div>
                      <div className="text-sm text-muted-foreground">кг CO₂ загалом</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Пояснення AI */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    Обґрунтування рекомендації
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {recommendation.reasoning}
                  </p>
                </CardContent>
              </Card>

              {/* Дії */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateRecommendation}
                  variant="outline"
                  disabled={generateRecommendationMutation.isPending}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Оновити рекомендації
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Застосувати рекомендації
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}