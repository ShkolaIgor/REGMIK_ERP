import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Position, type InsertPosition, insertPositionSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PositionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["/api/positions"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPosition) => {
      console.log("Sending POST request with data:", data);
      return await apiRequest("/api/positions", { method: "POST", body: data });
    },
    onSuccess: () => {
      // Примусово очищуємо кеш та перезавантажуємо дані
      queryClient.removeQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Успіх",
        description: "Посаду створено успішно",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити посаду",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPosition> }) => {
      console.log("Sending PATCH request with data:", data);
      return await apiRequest(`/api/positions/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      setEditingPosition(null);
      toast({
        title: "Успіх",
        description: "Посаду оновлено успішно",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити посаду",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/positions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({
        title: "Успіх",
        description: "Посаду видалено успішно",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити посаду",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<InsertPosition>({
    resolver: zodResolver(insertPositionSchema),
    defaultValues: {
      name: "",
      departmentId: undefined,
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<InsertPosition>({
    resolver: zodResolver(insertPositionSchema),
    defaultValues: {
      name: "",
      departmentId: undefined,
      description: "",
      isActive: true,
    },
  });

  const onCreateSubmit = (data: InsertPosition) => {
    console.log("Form submitted with data:", data);
    createMutation.mutate(data, {
      onSuccess: () => {
        console.log("Position created successfully");
        createForm.reset();
        setIsCreateDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error creating position:", error);
      }
    });
  };

  const onEditSubmit = (data: InsertPosition) => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data });
    }
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    editForm.reset({
      name: position.name,
      departmentId: position.departmentId,
      description: position.description || "",
      isActive: position.isActive,
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const filteredPositions = positions.filter((position: Position) => {
    const matchesSearch = position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showInactive || position.isActive;
    
    // Логування для відладки
    if (position.name === 'уукаук') {
      console.log("Position уукаук:", {
        isActive: position.isActive,
        showInactive: showInactive,
        matchesStatus: matchesStatus,
        matchesSearch: matchesSearch,
        willShow: matchesSearch && matchesStatus
      });
    }
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Посади</h1>
            <p className="text-muted-foreground">Управління посадами співробітників</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Посади</h1>
          <p className="text-muted-foreground">Управління посадами співробітників</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Додати посаду
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити нову посаду</DialogTitle>
              <DialogDescription>
                Заповніть інформацію про нову посаду
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Назва посади</FormLabel>
                      <FormControl>
                        <Input placeholder="Введіть назву посади" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Відділ</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть відділ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department: any) => (
                            <SelectItem key={department.id} value={department.id.toString()}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Опис</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введіть опис посади" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Активна посада</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Чи доступна ця посада для призначення
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      createForm.reset();
                    }}
                  >
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Пошук за назвою або відділом..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="show-inactive" className="text-sm font-medium">
            Показати неактивні
          </label>
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPositions.map((position: Position) => {
          const department = departments.find(d => d.id === position.departmentId);
          return (
            <Card key={position.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{position.name}</CardTitle>
                    <CardDescription>{department?.name || 'Без відділу'}</CardDescription>
                  </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(position)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Видалити посаду</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ви впевнені, що хочете видалити посаду "{position.name}"?
                          Ця дія не може бути скасована.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(position.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {position.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {position.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <Badge variant={position.isActive ? "default" : "secondary"}>
                    {position.isActive ? "Активна" : "Неактивна"}
                  </Badge>
                  {position.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(position.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? "Не знайдено посад за вашим запитом" : "Поки що немає створених посад"}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPosition} onOpenChange={() => setEditingPosition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати посаду</DialogTitle>
            <DialogDescription>
              Внесіть зміни до інформації про посаду
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва посади</FormLabel>
                    <FormControl>
                      <Input placeholder="Введіть назву посади" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Відділ</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть відділ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department: any) => (
                          <SelectItem key={department.id} value={department.id.toString()}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Опис</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Введіть опис посади" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Активна посада</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Чи доступна ця посада для призначення
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingPosition(null);
                    editForm.reset();
                  }}
                >
                  Скасувати
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}