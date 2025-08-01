import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, MapPin, Edit, Trash2, Search, House } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
  });

  // Фільтрація складів за пошуковим запитом
  const filteredWarehouses = warehouses?.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const createMutation = useMutation({
    mutationFn: async (data: InsertWarehouse) => {
      return apiRequest("/api/warehouses", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setIsCreateOpen(false);
      toast({
        title: "Успіх",
        description: "Склад успішно створено"
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити склад",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWarehouse> }) => {
      return apiRequest(`/api/warehouses/${id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      setEditingWarehouse(null);
      toast({
        title: "Успіх",
        description: "Склад успішно оновлено"
      });
    },
    onError: (error) => {
      console.error("Update mutation error:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити склад",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/warehouses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
      toast({
        title: "Успіх",
        description: "Склад успішно видалено"
      });
    },
    onError: (error) => {
      console.error("Delete mutation error:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section  sticky top-0 z-40*/}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <House className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">Склади</h1>
                  <p className="text-gray-500 mt-1">Управління складами</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="w-4 h-4 mr-2" />
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
        </div>
          </div>
      </header>

      {/* Filters and Actions */}
      <div className="w-full py-3">
        <Card>
          <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 max-w-2xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Пошук складів..."
          className="w-80 pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
            </div>
                  </CardContent>
                </Card>
          </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((warehouse) => (
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

        {filteredWarehouses.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {searchQuery ? "Склади не знайдено" : "Немає складів"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery 
                ? "Спробуйте змінити критерії пошуку"
                : "Почніть з створення свого першого складу"
              }
            </p>
          </div>
        )}
      </div>
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