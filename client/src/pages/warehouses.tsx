import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWarehouseSchema, type Warehouse, type InsertWarehouse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WarehousesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertWarehouse) => 
      apiRequest('/api/warehouses', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setIsCreateOpen(false);
      toast({
        title: "Успіх",
        description: "Склад успішно створено"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити склад",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertWarehouse> }) =>
      apiRequest(`/api/warehouses/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setEditingWarehouse(null);
      toast({
        title: "Успіх",
        description: "Склад успішно оновлено"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити склад",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/warehouses/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      toast({
        title: "Успіх",
        description: "Склад успішно видалено"
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити склад",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Склади</h1>
          <p className="text-muted-foreground">
            Управління складськими приміщеннями
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Додати склад
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити новий склад</DialogTitle>
              <DialogDescription>
                Заповніть форму для створення нового складу
              </DialogDescription>
            </DialogHeader>
            <WarehouseForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {warehouses?.map((warehouse) => (
          <Card key={warehouse.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Dialog 
                    open={editingWarehouse?.id === warehouse.id} 
                    onOpenChange={(open) => setEditingWarehouse(open ? warehouse : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Редагувати склад</DialogTitle>
                        <DialogDescription>
                          Внесіть зміни до інформації про склад
                        </DialogDescription>
                      </DialogHeader>
                      <WarehouseForm
                        defaultValues={warehouse}
                        onSubmit={(data) => updateMutation.mutate({ id: warehouse.id, data })}
                        isLoading={updateMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Ви впевнені, що хочете видалити цей склад?')) {
                        deleteMutation.mutate(warehouse.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
              {warehouse.location && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{warehouse.location}</span>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {warehouse.description && (
                <CardDescription className="mb-4">
                  {warehouse.description}
                </CardDescription>
              )}
              
              <div className="flex justify-between items-center">
                <Badge variant="outline">
                  ID: {warehouse.id}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {warehouses?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Немає складів</h3>
          <p className="mt-1 text-sm text-gray-500">
            Почніть з створення свого першого складу
          </p>
        </div>
      )}
    </div>
  );
}

interface WarehouseFormProps {
  defaultValues?: Partial<Warehouse>;
  onSubmit: (data: InsertWarehouse) => void;
  isLoading: boolean;
}

function WarehouseForm({ defaultValues, onSubmit, isLoading }: WarehouseFormProps) {
  const form = useForm<InsertWarehouse>({
    resolver: zodResolver(insertWarehouseSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      location: defaultValues?.location || "",
      description: defaultValues?.description || ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Назва складу</FormLabel>
              <FormControl>
                <Input placeholder="Введіть назву складу" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Місцезнаходження</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Введіть адресу або місцезнаходження" 
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опис</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Введіть опис складу"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </form>
    </Form>
  );
}