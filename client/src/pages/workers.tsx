import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UkrainianDatePicker } from "@/components/ui/ukrainian-date-picker";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, User, X, CheckCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertWorkerSchema, type Worker, type InsertWorker, type Position, type Department } from "@shared/schema";

const formSchema = insertWorkerSchema.extend({
  hireDate: z.string().optional(),
  hourlyRate: z.string().optional(),
  birthDate: z.string().optional(),
  terminationDate: z.string().optional(),
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
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
          terminationDate: data.terminationDate ? new Date(data.terminationDate).toISOString() : null,
          hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
          positionId: data.positionId || null,
          departmentId: data.departmentId || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/available-workers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      // Force refetch to ensure list is updated
      queryClient.refetchQueries({ queryKey: ["/api/workers"] });
      queryClient.refetchQueries({ queryKey: ["/api/users/available-workers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      apiRequest(`/api/workers/${id}`, {
        method: "PATCH",
        body: {
          ...data,
          hireDate: data.hireDate ? new Date(data.hireDate).toISOString() : null,
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString() : null,
          terminationDate: data.terminationDate ? new Date(data.terminationDate).toISOString() : null,
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
      birthDate: "",
      address: "",
      contactPhone: "",
      terminationDate: "",
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
      birthDate: worker.birthDate ? new Date(worker.birthDate).toISOString().split('T')[0] : "",
      address: worker.address || "",
      contactPhone: worker.contactPhone || "",
      terminationDate: worker.terminationDate ? new Date(worker.terminationDate).toISOString().split('T')[0] : "",
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
    <div className="flex-1 overflow-auto">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="w-full px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                      Працівники
                    </h1>
                    <p className="text-gray-600 mt-1">Управління робітниками підприємства</p>
                  </div>
                </div>
              </div>
            
              <div className="flex items-center space-x-4">
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати працівника
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <main className="w-full px-8 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-700 font-medium">Всього працівників</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{workers?.length || 0}</p>
                    <p className="text-xs text-blue-600">У штаті підприємства</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-medium">Активні працівники</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900 mb-1">{workers.filter((w: Worker) => w.isActive).length}</p>
                    <p className="text-xs text-emerald-600">Працюють зараз</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-yellow-600" />
                      <p className="text-sm text-yellow-700 font-medium">Посади</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-900 mb-1">{positions?.length || 0}</p>
                    <p className="text-xs text-yellow-600">Різних спеціальностей</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-500 hover:scale-105 group">
              <CardContent className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-purple-600" />
                      <p className="text-sm text-purple-700 font-medium">Відділи</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-1">{departments?.length || 0}</p>
                    <p className="text-xs text-purple-600">Структурних підрозділів</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        <Dialog open={isCreateDialogOpen || !!editingWorker} onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          }
        }}>
          <DialogTrigger asChild>
            <Button style={{display: 'none'}}>
              Hidden trigger
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
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <div 
                              className="w-24 h-24 rounded-full border-2 border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors flex items-center justify-center bg-gray-50 overflow-hidden"
                              onClick={() => document.getElementById('photo-input')?.click()}
                            >
                              {field.value ? (
                                <img 
                                  src={field.value} 
                                  alt="Фото робітника" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            {field.value && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  field.onChange('');
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="text-sm text-gray-500">Клацніть на зображення для вибору файлу</p>
                            <Input
                              placeholder="Або вставте URL зображення"
                              value={typeof field.value === 'string' && !field.value.startsWith('data:') ? field.value : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </div>
                          <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
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
                          />
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

                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Особиста інформація</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата народження</FormLabel>
                          <FormControl>
                            <UkrainianDatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Контактний телефон</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адреса проживання</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} />
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
                          <UkrainianDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="terminationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата звільнення</FormLabel>
                        <FormControl>
                          <UkrainianDatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div></div> {/* Empty grid item for alignment */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Посада</FormLabel>
                        <FormControl>
                          <Select value={field.value?.toString() || "0"} onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Оберіть посаду" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="0">Без посади</SelectItem>
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
                          <Select value={field.value?.toString() || "0"} onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Оберіть відділ" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="0">Без відділу</SelectItem>
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

          {/* Workers Table */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50">
            <CardContent className="p-6">
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
                    {worker.contactPhone && worker.contactPhone !== worker.phone && (
                      <div className="text-muted-foreground">Контакт: {worker.contactPhone}</div>
                    )}
                    {!worker.email && !worker.phone && !worker.contactPhone && "—"}
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
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}