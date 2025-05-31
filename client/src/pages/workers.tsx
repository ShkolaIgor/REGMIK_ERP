import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertWorkerSchema, type Worker, type InsertWorker, type Position, type Department } from "@shared/schema";

const formSchema = insertWorkerSchema.extend({
  hireDate: z.string().optional(),
  hourlyRate: z.string().optional(),
  positionId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function WorkersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });



  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("/api/workers", {
        method: "POST",
        body: {
          ...data,
          hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : null,
          hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
          positionId: data.positionId || null,
          departmentId: data.departmentId || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      // Force refetch to ensure list is updated
      queryClient.refetchQueries({ queryKey: ["/api/workers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      apiRequest(`/api/workers/${id}`, {
        method: "PATCH",
        body: {
          ...data,
          hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : null,
          hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
          positionId: data.positionId || null,
          departmentId: data.departmentId || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      setEditingWorker(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/workers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      positionId: undefined,
      departmentId: undefined,
      email: "",
      phone: "",
      hireDate: "",
      hourlyRate: "",
      isActive: true,
      notes: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingWorker) {
      updateMutation.mutate({ id: editingWorker.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    form.reset({
      firstName: worker.firstName,
      lastName: worker.lastName,
      photo: worker.photo || "",
      positionId: worker.positionId || undefined,
      departmentId: worker.departmentId || undefined,
      email: worker.email || "",
      phone: worker.phone || "",
      hireDate: worker.hireDate ? new Date(worker.hireDate).toISOString().split('T')[0] : "",
      hourlyRate: worker.hourlyRate ? worker.hourlyRate.toString() : "",
      isActive: worker.isActive,
      notes: worker.notes || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цього робітника?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingWorker(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження робітників...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Робітники</h1>
          <p className="text-muted-foreground">
            Управління робітниками підприємства
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingWorker} onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Додати робітника
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWorker ? "Редагувати робітника" : "Створити нового робітника"}
              </DialogTitle>
              <DialogDescription>
                {editingWorker ? "Змініть дані робітника та збережіть зміни" : "Введіть дані нового робітника"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ім'я *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Прізвище *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фото робітника</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value && (
                            <div className="flex justify-center">
                              <div className="relative">
                                <img 
                                  src={field.value} 
                                  alt="Фото робітника" 
                                  className="w-24 h-24 object-cover rounded-full border-2 border-gray-200 shadow-sm"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  onClick={() => field.onChange('')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Завантажити файл
                              </label>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      field.onChange(event.target?.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Або вставте URL
                              </label>
                              <Input
                                placeholder="https://example.com/photo.jpg"
                                value={typeof field.value === 'string' && !field.value.startsWith('data:') ? field.value : ''}
                                onChange={(e) => field.onChange(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата найму</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Погодинна ставка (грн)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Посада</FormLabel>
                        <FormControl>
                          <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Оберіть посаду" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="">Без посади</SelectItem>
                              {positions?.map((position) => (
                                <SelectItem key={position.id} value={position.id.toString()}>
                                  {position.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Відділ</FormLabel>
                        <FormControl>
                          <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Оберіть відділ" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="">Без відділу</SelectItem>
                              {departments?.map((department) => (
                                <SelectItem key={department.id} value={department.id.toString()}>
                                  {department.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус</FormLabel>
                      <FormControl>
                        <Select value={field.value ? "true" : "false"} onValueChange={(value) => field.onChange(value === "true")}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Активний</SelectItem>
                            <SelectItem value="false">Неактивний</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примітки</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Скасувати
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingWorker ? "Оновити" : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ім'я</TableHead>
              <TableHead>Посада</TableHead>
              <TableHead>Відділ</TableHead>
              <TableHead>Контакти</TableHead>
              <TableHead>Ставка</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата найму</TableHead>
              <TableHead className="w-[100px]">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers?.map((worker: Worker) => (
              <TableRow key={worker.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    {worker.photo ? (
                      <img 
                        src={worker.photo} 
                        alt={`${worker.firstName} ${worker.lastName}`}
                        className="w-10 h-10 object-cover rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">
                      {worker.firstName} {worker.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {worker.positionId 
                    ? positions?.find(p => p.id === worker.positionId)?.name || "—"
                    : "—"
                  }
                </TableCell>
                <TableCell>
                  {worker.departmentId 
                    ? departments?.find(d => d.id === worker.departmentId)?.name || "—"
                    : "—"
                  }
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {worker.email && <div>{worker.email}</div>}
                    {worker.phone && <div>{worker.phone}</div>}
                    {!worker.email && !worker.phone && "—"}
                  </div>
                </TableCell>
                <TableCell>
                  {worker.hourlyRate ? `${worker.hourlyRate} грн/год` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={worker.isActive ? "default" : "secondary"}>
                    {worker.isActive ? "Активний" : "Неактивний"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {worker.hireDate
                    ? new Date(worker.hireDate).toLocaleDateString("uk-UA")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(worker)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(worker.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!workers || workers.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Робітники не знайдені. Створіть першого робітника.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}