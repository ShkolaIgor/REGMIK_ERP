import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWarehouseTransferSchema, type WarehouseTransfer, type InsertWarehouseTransfer, type Warehouse, type Product, type Worker } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ArrowLeftRight, Package, Truck, Calendar, User, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

export default function WarehouseTransfers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: transfers = [], isLoading } = useQuery<WarehouseTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const form = useForm<InsertWarehouseTransfer>({
    resolver: zodResolver(insertWarehouseTransferSchema),
    defaultValues: {
      status: "pending",
      requestedDate: new Date(),
      transportMethod: "internal",
      totalValue: "0",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertWarehouseTransfer) => {
      return apiRequest("/api/warehouse-transfers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse-transfers"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Успіх",
        description: "Переміщення створено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити переміщення",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertWarehouseTransfer) => {
    createMutation.mutate(data);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
    }
  };

  const filteredTransfers = transfers.filter((transfer) =>
    transfer.transferNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_transit":
        return <Truck className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Очікує";
      case "in_transit":
        return "В дорозі";
      case "completed":
        return "Завершено";
      case "cancelled":
        return "Скасовано";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="w-full px-4">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Переміщення між складами</h1>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Онлайн
                </div>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Створити переміщення
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Створення нового переміщення</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fromWarehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Склад відправник</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть склад" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="toWarehouseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Склад отримувач</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть склад" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="transportMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Спосіб транспортування</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть спосіб" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="internal">Внутрішній</SelectItem>
                                <SelectItem value="truck">Вантажівка</SelectItem>
                                <SelectItem value="courier">Кур'єр</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="responsiblePersonId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Відповідальна особа</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} value={field.value?.toString() || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть особу" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {workers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id.toString()}>
                                    {worker.firstName} {worker.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Примітки</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Введіть додаткові відомості про переміщення"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDialogChange(false)}
                      >
                        Скасувати
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createMutation.isPending ? "Створення..." : "Створити"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="w-full px-4 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Пошук за номером, статусом або примітками..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Переміщення не знайдено" : "Немає переміщень"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Спробуйте змінити критерії пошуку" 
                  : "Створіть перше переміщення між складами для ефективного управління запасами"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Створити переміщення
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTransfers.map((transfer) => (
              <Card key={transfer.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium truncate">
                      {transfer.transferNumber || `Переміщення #${transfer.id}`}
                    </CardTitle>
                    <Badge className={getStatusColor(transfer.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(transfer.status)}
                        <span>{getStatusText(transfer.status)}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Склад {transfer.fromWarehouseId} → Склад {transfer.toWarehouseId}
                      </span>
                    </div>

                    {transfer.transportMethod && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {transfer.transportMethod === "internal" && "Внутрішній"}
                          {transfer.transportMethod === "truck" && "Вантажівка"}
                          {transfer.transportMethod === "courier" && "Кур'єр"}
                        </span>
                      </div>
                    )}

                    {transfer.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {transfer.notes}
                      </p>
                    )}

                    {transfer.totalValue && parseFloat(transfer.totalValue) > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Загальна вартість:</span>
                        <p className="font-medium text-green-600">
                          ₴{parseFloat(transfer.totalValue).toLocaleString('uk-UA', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{transfer.requestedDate ? new Date(transfer.requestedDate).toLocaleDateString('uk-UA') : 'Не вказано'}</span>
                      </div>
                      {transfer.responsiblePersonId && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>ID: {transfer.responsiblePersonId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}