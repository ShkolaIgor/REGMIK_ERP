import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Package, Factory, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function OrderedProducts() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productionNotes, setProductionNotes] = useState("");
  const [productionQuantity, setProductionQuantity] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderedProducts = [], isLoading } = useQuery({
    queryKey: ["/api/ordered-products-info"],
  });

  const sendToProductionMutation = useMutation({
    mutationFn: async (data: { productId: number; quantity: number; notes?: string }) => {
      return await apiRequest("/api/send-to-production", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Товар передано у виробництво",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ordered-products-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-tasks"] });
      setSelectedProduct(null);
      setProductionNotes("");
      setProductionQuantity(0);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося передати товар у виробництво",
        variant: "destructive",
      });
    },
  });

  const handleSendToProduction = () => {
    if (!selectedProduct || productionQuantity <= 0) return;

    sendToProductionMutation.mutate({
      productId: selectedProduct.productId,
      quantity: productionQuantity,
      notes: productionNotes,
    });
  };

  const getStatusColor = (needsProduction: boolean, shortage: number) => {
    if (shortage > 0) return "destructive";
    if (needsProduction) return "secondary";
    return "default";
  };

  const getStatusText = (needsProduction: boolean, shortage: number, inProduction: number) => {
    if (shortage > 0) return `Дефіцит: ${shortage} шт.`;
    if (inProduction > 0) return `У виробництві: ${inProduction} шт.`;
    if (needsProduction) return "Потрібне виробництво";
    return "Достатньо на складі";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Замовлені товари</h1>
          <p className="text-muted-foreground">
            Інформація про наявність замовлених товарів та їх статус виробництва
          </p>
        </div>
      </div>

      {orderedProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Немає активних замовлень</h3>
            <p className="text-muted-foreground text-center">
              Коли будуть створені замовлення з товарами, вони з'являться тут
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всього товарів</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderedProducts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Потребують виробництва</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderedProducts.filter((p: any) => p.needsProduction).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">З дефіцитом</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderedProducts.filter((p: any) => p.shortage > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список замовлених товарів</CardTitle>
              <CardDescription>
                Детальна інформація про наявність та статус виробництва
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Замовлено</TableHead>
                    <TableHead>На складі</TableHead>
                    <TableHead>У виробництві</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedProducts.map((item: any) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.totalOrdered}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={item.totalAvailable >= item.totalOrdered ? "text-green-600" : "text-red-600"}>
                            {item.totalAvailable}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={item.inProduction > 0 ? "text-blue-600" : "text-muted-foreground"}>
                            {item.inProduction}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.product.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.needsProduction, item.shortage)}>
                          {getStatusText(item.needsProduction, item.shortage, item.inProduction)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.needsProduction && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setProductionQuantity(Math.max(1, item.shortage || (item.totalOrdered - item.totalAvailable)));
                                }}
                              >
                                <Factory className="h-4 w-4 mr-2" />
                                У виробництво
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Передати у виробництво</DialogTitle>
                                <DialogDescription>
                                  Створити завдання на виробництво для товару "{selectedProduct?.product.name}"
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="quantity">Кількість для виробництва</Label>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      value={productionQuantity}
                                      onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 0)}
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <Label>Одиниця вимірювання</Label>
                                    <Input value={selectedProduct?.product.unit || ""} disabled />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Примітки</Label>
                                  <Textarea
                                    id="notes"
                                    value={productionNotes}
                                    onChange={(e) => setProductionNotes(e.target.value)}
                                    placeholder="Додаткові примітки для виробництва..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleSendToProduction}
                                  disabled={sendToProductionMutation.isPending || productionQuantity <= 0}
                                >
                                  {sendToProductionMutation.isPending ? (
                                    "Створення..."
                                  ) : (
                                    <>
                                      <ArrowRight className="h-4 w-4 mr-2" />
                                      Створити завдання
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}