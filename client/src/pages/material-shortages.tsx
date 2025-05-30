import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, TrendingUp, Calculator, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MaterialShortage {
  id: number;
  productId: number;
  warehouseId: number | null;
  requiredQuantity: string;
  availableQuantity: string;
  shortageQuantity: string;
  unit: string;
  priority: string;
  estimatedCost: string;
  supplierRecommendation: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    id: number;
    name: string;
    sku: string;
    costPrice: string;
  };
  warehouse?: {
    id: number;
    name: string;
    location: string | null;
  };
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  ordered: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800"
};

export default function MaterialShortagesPage() {
  const { toast } = useToast();

  // Fetch material shortages
  const { data: shortages, isLoading } = useQuery({
    queryKey: ["/api/material-shortages"],
    enabled: true
  });

  // Calculate material shortages automatically
  const calculateShortagesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/material-shortages/calculate"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      toast({
        title: "Успішно",
        description: "Дефіцит матеріалів перераховано"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося перерахувати дефіцит матеріалів",
        variant: "destructive"
      });
    }
  });

  // Update shortage status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiRequest("PATCH", `/api/material-shortages/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/material-shortages"] });
      toast({
        title: "Успішно",
        description: "Статус оновлено"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус",
        variant: "destructive"
      });
    }
  });

  const shortagesList = (shortages as MaterialShortage[] || []);
  
  // Calculate totals
  const totalShortages = shortagesList.length;
  const criticalShortages = shortagesList.filter((s: MaterialShortage) => s.priority === 'critical').length;
  const estimatedTotalCost = shortagesList.reduce((sum: number, shortage: MaterialShortage) => 
    sum + parseFloat(shortage.estimatedCost || "0"), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Дефіцит матеріалів</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Дефіцит матеріалів</h1>
          <p className="text-muted-foreground">
            Відстеження дефіциту матеріалів та компонентів
          </p>
        </div>
        <Button 
          onClick={() => calculateShortagesMutation.mutate()}
          disabled={calculateShortagesMutation.isPending}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Перерахувати дефіцит
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Всього дефіцитів</p>
              <p className="text-2xl font-bold">{totalShortages}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Критичних дефіцитів</p>
              <p className="text-2xl font-bold text-red-600">{criticalShortages}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Очікувана вартість</p>
              <p className="text-2xl font-bold">₴{estimatedTotalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shortages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Список дефіцитів
          </CardTitle>
          <CardDescription>
            Матеріали та компоненти, яких не вистачає для виробництва
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shortagesList.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Дефіцитів не знайдено</h3>
              <p className="text-muted-foreground mb-4">
                Натисніть "Перерахувати дефіцит" для аналізу поточного стану запасів
              </p>
              <Button 
                onClick={() => calculateShortagesMutation.mutate()}
                disabled={calculateShortagesMutation.isPending}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Розрахувати дефіцит
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Матеріал</TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead>Потрібно</TableHead>
                  <TableHead>Є в наявності</TableHead>
                  <TableHead>Дефіцит</TableHead>
                  <TableHead>Пріоритет</TableHead>
                  <TableHead>Вартість</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortagesList.map((shortage: MaterialShortage) => (
                  <TableRow key={shortage.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {shortage.product?.name || `ID: ${shortage.productId}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {shortage.product?.sku || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shortage.warehouse?.name || "Всі склади"}
                    </TableCell>
                    <TableCell>
                      {parseFloat(shortage.requiredQuantity).toFixed(2)} {shortage.unit}
                    </TableCell>
                    <TableCell>
                      {parseFloat(shortage.availableQuantity).toFixed(2)} {shortage.unit}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {parseFloat(shortage.shortageQuantity).toFixed(2)} {shortage.unit}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[shortage.priority as keyof typeof priorityColors]}>
                        {shortage.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ₴{parseFloat(shortage.estimatedCost || "0").toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[shortage.status as keyof typeof statusColors]}>
                        {shortage.status === 'pending' ? 'Очікує' : 
                         shortage.status === 'ordered' ? 'Замовлено' : 'Отримано'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {shortage.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: shortage.id, 
                              status: 'ordered' 
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Замовити
                          </Button>
                        )}
                        {shortage.status === 'ordered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: shortage.id, 
                              status: 'received' 
                            })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Отримано
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}