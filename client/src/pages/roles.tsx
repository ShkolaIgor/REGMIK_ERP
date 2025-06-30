import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Users, Settings, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types
interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  permissions: any;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SystemModule {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string | null;
  isActive: boolean;
  sortOrder: number | null;
  parentModuleId: number | null;
  createdAt: Date;
}

interface Permission {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  moduleId: number | null;
  action: string;
  resourceType: string | null;
  isSystemPermission: boolean;
  createdAt: Date;
}

interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  granted: boolean;
  createdAt: Date;
}

// Form Schema
const roleFormSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  displayName: z.string().min(1, "Відображувана назва обов'язкова"),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export default function RolesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data fetching
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: modules = [], isLoading: modulesLoading } = useQuery<SystemModule[]>({
    queryKey: ["/api/system-modules"],
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      return await apiRequest("/api/roles", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsDialogOpen(false);
      setEditingRole(null);
      toast({
        title: "Успіх",
        description: "Роль успішно створена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка створення ролі",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData & { id: number }) => {
      return await apiRequest(`/api/roles/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsDialogOpen(false);
      setEditingRole(null);
      toast({
        title: "Успіх",
        description: "Роль успішно оновлена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка оновлення ролі",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setSelectedRole(null);
      toast({
        title: "Успіх",
        description: "Роль успішно видалена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка видалення ролі",
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      permissions: {},
    },
  });

  // Effects
  useEffect(() => {
    if (editingRole) {
      form.reset({
        name: editingRole.name,
        displayName: editingRole.displayName,
        description: editingRole.description || "",
        permissions: {},
      });
    } else {
      form.reset({
        name: "",
        displayName: "",
        description: "",
        permissions: {},
      });
    }
  }, [editingRole, form]);

  // Handlers
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (confirm(`Ви впевнені, що хочете видалити роль "${role.displayName}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ ...data, id: editingRole.id });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  return (
    <>
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="w-full px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <Shield className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                  Ролі та дозволи
                </h1>
                <p className="text-purple-100 text-xl font-medium">Управління користувацькими ролями та дозволами системи</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setEditingRole(null)}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Створити роль
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRole ? "Редагування ролі" : "Створення нової ролі"}
                    </DialogTitle>
                    <DialogDescription>
                      Налаштуйте роль та призначте відповідні дозволи
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Системна назва</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="admin, manager, user" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Відображувана назва</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Адміністратор, Менеджер, Користувач" />
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
                              <Textarea {...field} placeholder="Опис ролі та її призначення" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Скасувати
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                        >
                          {editingRole ? "Оновити" : "Створити"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Всього ролей</CardTitle>
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors duration-300">
                <Shield className="h-6 w-6 text-indigo-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">{roles.length}</div>
              <p className="text-xs text-indigo-600 mt-1">налаштованих ролей</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Системні ролі</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                <Settings className="h-6 w-6 text-green-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{roles.filter(r => r.isSystemRole).length}</div>
              <p className="text-xs text-green-600 mt-1">вбудованих ролей</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-sky-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Користувацькі ролі</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                <Users className="h-6 w-6 text-blue-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{roles.filter(r => !r.isSystemRole).length}</div>
              <p className="text-xs text-blue-600 mt-1">створених ролей</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Всього дозволів</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors duration-300">
                <Check className="h-6 w-6 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-700">{permissions.length}</div>
              <p className="text-xs text-purple-600 mt-1">доступних дозволів</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-6 space-y-6">
        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Ролі</TabsTrigger>
            <TabsTrigger value="permissions">Дозволи</TabsTrigger>
            <TabsTrigger value="modules">Модулі</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4">
              {rolesLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">Завантаження ролей...</div>
                  </CardContent>
                </Card>
              ) : roles.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      Ролей не знайдено
                    </div>
                  </CardContent>
                </Card>
              ) : (
                roles.map((role) => (
                  <Card key={role.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {role.displayName}
                            {role.isSystemRole && (
                              <Badge variant="secondary">Системна</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {role.description || "Без опису"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.isSystemRole && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Дозволи системи</CardTitle>
                <CardDescription>
                  Список всіх доступних дозволів у системі
                </CardDescription>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="text-center">Завантаження дозволів...</div>
                ) : permissions.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Дозволів не знайдено
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{permission.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description || permission.name}
                          </div>
                        </div>
                        <Badge variant={permission.isSystemPermission ? "secondary" : "outline"}>
                          {permission.action}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Модулі системи</CardTitle>
                <CardDescription>
                  Список всіх модулів системи та їх статус
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <div className="text-center">Завантаження модулів...</div>
                ) : modules.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    Модулів не знайдено
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{module.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.description || module.name}
                          </div>
                        </div>
                        <Badge variant={module.isActive ? "default" : "secondary"}>
                          {module.isActive ? "Активний" : "Неактивний"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}