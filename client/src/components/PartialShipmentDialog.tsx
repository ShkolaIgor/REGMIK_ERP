import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CarrierSelect } from "@/components/CarrierSelect";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package, AlertCircle } from "lucide-react";

const partialShipmentSchema = z.object({
  carrierId: z.string().min(1, "Оберіть перевізника"),
  recipientName: z.string().min(1, "Введіть ім'я отримувача"),
  recipientPhone: z.string().min(1, "Введіть телефон отримувача"),
  recipientCityRef: z.string().optional(),
  recipientCityName: z.string().min(1, "Введіть місто отримувача"),
  recipientWarehouseRef: z.string().optional(),
  recipientWarehouseAddress: z.string().min(1, "Введіть адресу отримувача"),
  weight: z.string().optional(),
  declaredValue: z.string().optional(),
  notes: z.string().optional(),
});

interface PartialShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  orderNumber: string;
}

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  shippedQuantity: number;
  unitPrice: string;
  totalPrice: string;
  productName: string;
  productSku: string;
  productUnit: string;
  remainingQuantity: number;
  canShip: boolean;
}

export function PartialShipmentDialog({ 
  open, 
  onOpenChange, 
  orderId, 
  orderNumber 
}: PartialShipmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [shipmentItems, setShipmentItems] = useState<Record<number, number>>({});

  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch order items');
      }
      return response.json();
    },
    enabled: open && orderId > 0,
  });

  // Додаємо логування для діагностики
  console.log("PartialShipmentDialog - orderId:", orderId);
  console.log("PartialShipmentDialog - open:", open);
  console.log("PartialShipmentDialog - orderItems:", orderItems);
  console.log("PartialShipmentDialog - isLoading:", isLoading);

  const form = useForm<z.infer<typeof partialShipmentSchema>>({
    resolver: zodResolver(partialShipmentSchema),
    defaultValues: {
      carrierId: "",
      recipientName: "",
      recipientPhone: "",
      recipientCityName: "",
      recipientWarehouseAddress: "",
      weight: "1",
      declaredValue: "100",
      notes: "",
    },
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof partialShipmentSchema>) => {
      const items = Object.entries(shipmentItems)
        .filter(([_, quantity]) => quantity > 0)
        .map(([orderItemId, quantity]) => {
          const orderItem = orderItems.find((item: OrderItem) => item.id === parseInt(orderItemId));
          return {
            orderItemId: parseInt(orderItemId),
            productId: orderItem?.productId,
            quantity,
            serialNumbers: []
          };
        });

      if (items.length === 0) {
        throw new Error("Оберіть товари для відвантаження");
      }

      // Зберігаємо або оновлюємо адресу клієнта
      await apiRequest('/api/customer-addresses/save', {
        method: 'POST',
        body: {
          customerName: orderNumber,
          customerPhone: data.recipientPhone,
          recipientName: data.recipientName,
          recipientPhone: data.recipientPhone,
          cityRef: data.recipientCityRef || '',
          cityName: data.recipientCityName,
          warehouseRef: data.recipientWarehouseRef || '',
          warehouseAddress: data.recipientWarehouseAddress,
        }
      });

      return apiRequest(`/api/orders/${orderId}/partial-shipment`, {
        method: "POST",
        body: {
          items,
          shipmentData: {
            ...data,
            carrierId: parseInt(data.carrierId)
          }
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Часткове відвантаження створено успішно",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      onOpenChange(false);
      form.reset();
      setShipmentItems({});
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити відвантаження",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (orderItemId: number, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0;
    const orderItem = orderItems.find((item: OrderItem) => item.id === orderItemId);
    
    if (orderItem && numQuantity <= orderItem.remainingQuantity) {
      setShipmentItems(prev => ({
        ...prev,
        [orderItemId]: numQuantity
      }));
    }
  };

  const onSubmit = (data: z.infer<typeof partialShipmentSchema>) => {
    createShipmentMutation.mutate(data);
  };

  const availableItems = (orderItems as OrderItem[]).filter(item => item.canShip);
  const totalItemsToShip = Object.values(shipmentItems).reduce((sum, qty) => sum + qty, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Часткове відвантаження замовлення {orderNumber}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Товари для відвантаження */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Товари для відвантаження</h3>
              
              {isLoading ? (
                <div className="text-center py-4">Завантаження...</div>
              ) : availableItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  Усі товари з замовлення вже відвантажені
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>Артикул</TableHead>
                      <TableHead>Замовлено</TableHead>
                      <TableHead>Відвантажено</TableHead>
                      <TableHead>Залишок</TableHead>
                      <TableHead>До відвантаження</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableItems.map((item: OrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.productName}
                        </TableCell>
                        <TableCell>{item.productSku}</TableCell>
                        <TableCell>
                          {item.quantity} {item.productUnit}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.shippedQuantity || 0} {item.productUnit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.remainingQuantity} {item.productUnit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.remainingQuantity}
                            value={shipmentItems[item.id] || ""}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            placeholder="0"
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {totalItemsToShip > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Загалом до відвантаження: {totalItemsToShip} одиниць
                  </p>
                </div>
              )}
            </div>

            {/* Дані відвантаження */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carrierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Перевізник</FormLabel>
                    <FormControl>
                      <CarrierSelect
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ім'я отримувача</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон отримувача</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+380501234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recipientCityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Місто</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Київ" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="recipientWarehouseAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адреса доставки</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Відділення Нової Пошти №1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вага (кг)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="declaredValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Оголошена вартість (грн)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={createShipmentMutation.isPending || totalItemsToShip === 0}
              >
                {createShipmentMutation.isPending ? "Створення..." : "Створити відвантаження"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}