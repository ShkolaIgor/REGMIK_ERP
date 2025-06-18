import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { Plus, Eye, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

// Типи
type Order = {
  id: number;
  orderSequenceNumber: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  totalAmount: string;
  companyId: number | null;
};

type OrderFormData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  companyId: string;
};

const Orders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form
  const form = useForm<OrderFormData>({
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      companyId: "",
    },
  });

  // Queries - порядок важливий
  const ordersQuery = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const companiesQuery = useQuery({
    queryKey: ["/api/companies"],
  });

  const carriersQuery = useQuery({
    queryKey: ["/api/carriers"],
  });

  // Безпечне отримання даних
  const orders = ordersQuery.data || [];
  const companies = companiesQuery.data || [];
  const carriers = carriersQuery.data || [];

  // Set default company
  useEffect(() => {
    if (Array.isArray(companies) && companies.length > 0 && !isEditMode) {
      const defaultCompany = companies.find((company: any) => company.isDefault);
      if (defaultCompany) {
        form.setValue("companyId", defaultCompany.id.toString());
      }
    }
  }, [companies, isEditMode, form]);

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            orderNumber: `ORD-${Date.now()}`,
            statusId: 1,
            totalAmount: "0",
            customerName: data.customerName,
            customerEmail: data.customerEmail || null,
            customerPhone: data.customerPhone || null,
            companyId: data.companyId ? parseInt(data.companyId) : null,
            status: data.status,
          },
          items: [],
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Замовлення створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити замовлення",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = () => {
    setIsEditMode(false);
    setEditingOrder(null);
    
    // Знаходимо компанію за замовчуванням
    const defaultCompany = Array.isArray(companies) ? companies.find((company: any) => company.isDefault) : null;
    const defaultCompanyId = defaultCompany ? defaultCompany.id.toString() : "";
    
    form.reset({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      status: "pending",
      companyId: defaultCompanyId,
    });
    
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  if (ordersQuery.isLoading || companiesQuery.isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="w-full overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Замовлення / Рахунки</h2>
            <p className="text-gray-600">Управління замовленнями та рахунками</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateOrder}>
                  <Plus className="w-4 h-4 mr-2" />
                  Новий рахунок/замовлення
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Створити новий рахунок/замовлення</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  {/* Поле компанії */}
                  <div>
                    <Label htmlFor="companyId">Компанія *</Label>
                    <Select
                      value={form.watch("companyId")}
                      onValueChange={(value) => form.setValue("companyId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть компанію" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(companies) && companies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customerName">Ім'я клієнта *</Label>
                    <Input
                      id="customerName"
                      {...form.register("customerName", { required: true })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...form.register("customerEmail")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Телефон</Label>
                    <Input
                      id="customerPhone"
                      {...form.register("customerPhone")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Статус *</Label>
                    <Select
                      value={form.watch("status")}
                      onValueChange={(value) => form.setValue("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">В очікуванні</SelectItem>
                        <SelectItem value="processing">В обробці</SelectItem>
                        <SelectItem value="shipped">Відправлено</SelectItem>
                        <SelectItem value="delivered">Доставлено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Скасувати
                    </Button>
                    <Button type="submit" disabled={createOrderMutation.isPending}>
                      {createOrderMutation.isPending ? "Збереження..." : "Створити замовлення"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Orders Table */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Список замовлень ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ п/п</TableHead>
                  <TableHead>Номер замовлення</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderSequenceNumber}</TableCell>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: getStatusColor(order.status),
                          color: 'white'
                        }}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(parseFloat(order.totalAmount))}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Orders;