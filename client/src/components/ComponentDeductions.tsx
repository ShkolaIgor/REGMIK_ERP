import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Edit3, Trash2, Package, CheckCircle } from 'lucide-react';

interface ComponentDeduction {
  id: number;
  orderId: number;
  orderItemId: number;
  componentId: number;
  componentType: string;
  plannedQuantity: string;
  deductedQuantity: string;
  warehouseId: number;
  unit: string;
  costPrice: string;
  totalCost: string;
  deductionDate: string;
  status: string;
  adjustmentReason?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  notes?: string;
  componentName: string;
  componentSku: string;
  warehouseName: string;
  orderItemQuantity: number;
  productName: string;
  productSku: string;
}

interface ComponentDeductionsProps {
  orderId: number;
}

export default function ComponentDeductions({ orderId }: ComponentDeductionsProps) {
  const [selectedDeduction, setSelectedDeduction] = useState<ComponentDeduction | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Отримання списань компонентів для замовлення
  const { data: deductionsData, isLoading } = useQuery({
    queryKey: ['/api/component-deductions/order', orderId],
    queryFn: () => apiRequest(`/api/component-deductions/order?orderId=${orderId}`),
    enabled: !!orderId,
  });

  const deductions: ComponentDeduction[] = deductionsData?.deductions || [];

  // Мутація для створення списань
  const createDeductionsMutation = useMutation({
    mutationFn: () => apiRequest(`/api/component-deductions/create/${orderId}`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/component-deductions/order', orderId] });
      toast({
        title: "Успіх",
        description: "Списання компонентів створено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити списання",
        variant: "destructive",
      });
    },
  });

  // Мутація для коригування списання
  const adjustDeductionMutation = useMutation({
    mutationFn: ({ deductionId, quantity, reason }: { 
      deductionId: number; 
      quantity: string; 
      reason: string; 
    }) => apiRequest(`/api/component-deductions/${deductionId}/adjust`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity,
        reason,
        adjustedBy: 'Поточний користувач' // Можна замінити на реального користувача
      }),
      headers: { 'Content-Type': 'application/json' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/component-deductions/order', orderId] });
      setAdjustmentDialogOpen(false);
      setSelectedDeduction(null);
      setNewQuantity('');
      setAdjustmentReason('');
      toast({
        title: "Успіх",
        description: "Списання скориговано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скоригувати списання",
        variant: "destructive",
      });
    },
  });

  // Мутація для скасування списання
  const cancelDeductionMutation = useMutation({
    mutationFn: ({ deductionId, reason }: { deductionId: number; reason: string; }) => 
      apiRequest(`/api/component-deductions/${deductionId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          reason,
          cancelledBy: 'Поточний користувач'
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/component-deductions/order', orderId] });
      toast({
        title: "Успіх",
        description: "Списання скасовано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скасувати списання",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeductions = () => {
    createDeductionsMutation.mutate();
  };

  const handleAdjustDeduction = () => {
    if (!selectedDeduction || !newQuantity || !adjustmentReason) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля",
        variant: "destructive",
      });
      return;
    }

    adjustDeductionMutation.mutate({
      deductionId: selectedDeduction.id,
      quantity: newQuantity,
      reason: adjustmentReason
    });
  };

  const handleCancelDeduction = (deduction: ComponentDeduction) => {
    const reason = prompt("Вкажіть причину скасування списання:");
    if (!reason) return;

    cancelDeductionMutation.mutate({
      deductionId: deduction.id,
      reason
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Активне</Badge>;
      case 'adjusted':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Скориговано</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Скасовано</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Списання компонентів
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Завантаження...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Списання компонентів зі складу
            </div>
            {deductions.length === 0 && (
              <Button 
                onClick={handleCreateDeductions}
                disabled={createDeductionsMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {createDeductionsMutation.isPending ? 'Створення...' : 'Списати компоненти'}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deductions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Компоненти ще не списано</p>
              <p className="text-sm">Натисніть кнопку вище для автоматичного списання згідно BOM</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Статистика */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{deductions.length}</div>
                  <div className="text-sm text-blue-600">Всього списань</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {deductions.filter(d => d.status === 'active').length}
                  </div>
                  <div className="text-sm text-green-600">Активних</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    ₴{deductions.reduce((sum, d) => sum + parseFloat(d.totalCost || '0'), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-orange-600">Загальна вартість</div>
                </div>
              </div>

              {/* Список списань */}
              <div className="space-y-3">
                {deductions.map((deduction) => (
                  <Card key={deduction.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              {deduction.componentName}
                            </h4>
                            <Badge variant="outline">{deduction.componentSku}</Badge>
                            {getStatusBadge(deduction.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Для товару:</span>
                              <div className="font-medium">{deduction.productName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Планова кількість:</span>
                              <div className="font-medium">
                                {deduction.plannedQuantity} {deduction.unit}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Списана кількість:</span>
                              <div className="font-medium text-red-600">
                                {deduction.deductedQuantity} {deduction.unit}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Вартість:</span>
                              <div className="font-medium">₴{parseFloat(deduction.totalCost || '0').toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Склад:</span>
                              <div className="font-medium">{deduction.warehouseName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Дата списання:</span>
                              <div className="font-medium">
                                {new Date(deduction.deductionDate).toLocaleString('uk-UA')}
                              </div>
                            </div>
                          </div>

                          {deduction.adjustmentReason && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <div className="font-medium text-yellow-800">Причина коригування:</div>
                              <div className="text-yellow-700">{deduction.adjustmentReason}</div>
                              {deduction.adjustedBy && (
                                <div className="text-yellow-600">
                                  Скоригував: {deduction.adjustedBy} ({new Date(deduction.adjustedAt!).toLocaleString('uk-UA')})
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {deduction.status === 'active' && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDeduction(deduction);
                                    setNewQuantity(deduction.deductedQuantity);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Коригувати
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Коригування списання</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="newQuantity">Нова кількість</Label>
                                    <Input
                                      id="newQuantity"
                                      type="number"
                                      step="0.01"
                                      value={newQuantity}
                                      onChange={(e) => setNewQuantity(e.target.value)}
                                      placeholder="Введіть нову кількість"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="adjustmentReason">Причина коригування</Label>
                                    <Textarea
                                      id="adjustmentReason"
                                      value={adjustmentReason}
                                      onChange={(e) => setAdjustmentReason(e.target.value)}
                                      placeholder="Вкажіть причину коригування"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                                      Скасувати
                                    </Button>
                                    <Button 
                                      onClick={handleAdjustDeduction}
                                      disabled={adjustDeductionMutation.isPending}
                                    >
                                      {adjustDeductionMutation.isPending ? 'Збереження...' : 'Зберегти'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelDeduction(deduction)}
                              disabled={cancelDeductionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Скасувати
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}