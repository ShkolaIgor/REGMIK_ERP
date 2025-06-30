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

// Form schemas
const roleFormSchema = z.object({
  name: z.string().min(1, "Назва ролі обов'язкова").max(100, "Назва ролі занадто довга"),
  displayName: z.string().min(1, "Відображувана назва обов'язкова").max(255, "Відображувана назва занадто довга"),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).default({}),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export default function RolesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Queries
  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: systemModules = [], isLoading: modulesLoading } = useQuery<SystemModule[]>({
    queryKey: ["/api/system-modules"],
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const { data: rolePermissions = [], isLoading: rolePermissionsLoading } = useQuery<RolePermission[]>({
    queryKey: [`/api/roles/${selectedRole?.id}/permissions`],
    enabled: !!selectedRole,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      return await apiRequest(`/api/roles`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsRoleDialogOpen(false);
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<RoleFormData> }) => {
      return await apiRequest(`/api/roles/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsRoleDialogOpen(false);
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

  const assignPermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId, granted }: { roleId: number; permissionId: number; granted: boolean }) => {
      return await apiRequest(`/api/roles/${roleId}/permissions/${permissionId}`, {
        method: "POST",
        body: { granted },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roles/${selectedRole?.id}/permissions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка призначення дозволу",
        variant: "destructive",
      });
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: async ({ roleId, permissionId }: { roleId: number; permissionId: number }) => {
      return await apiRequest(`/api/roles/${roleId}/permissions/${permissionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/roles/${selectedRole?.id}/permissions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка видалення дозволу",
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
  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystemRole) {
      toast({
        title: "Помилка",
        description: "Неможливо видалити системну роль",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm(`Ви впевнені, що хочете видалити роль "${role.displayName}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const onSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handlePermissionToggle = (permissionId: number, granted: boolean) => {
    if (!selectedRole) return;

    if (granted) {
      assignPermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
        granted: true,
      });
    } else {
      removePermissionMutation.mutate({
        roleId: selectedRole.id,
        permissionId,
      });
    }
  };

  // Helper functions
  const getPermissionsByModule = (moduleId: number | null) => {
    return permissions.filter(p => p.moduleId === moduleId);
  };

  const isPermissionGranted = (permissionId: number) => {
    return rolePermissions.some(rp => rp.permissionId === permissionId && rp.granted);
  };

  const getModulePermissionsCount = (moduleId: number | null) => {
    const modulePermissions = getPermissionsByModule(moduleId);
    const grantedCount = modulePermissions.filter(p => isPermissionGranted(p.id)).length;
    return { total: modulePermissions.length, granted: grantedCount };
  };

  if (rolesLoading || modulesLoading || permissionsLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

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
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                  Ролі та дозволи
                </h1>
                <p className="text-indigo-100 text-xl font-medium">Управління ролями користувачів та їх дозволами в системі</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleCreateRole}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/40 transition-all duration-300 shadow-lg backdrop-blur-sm px-6 py-3 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Створити роль
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="w-full px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Всього ролей</p>
                  <p className="text-3xl font-bold text-indigo-900 mb-1">{roles?.length || 0}</p>
                  <p className="text-xs text-indigo-600">У системі</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Всього дозволів</p>
                  <p className="text-3xl font-bold text-purple-900 mb-1">{permissions?.length || 0}</p>
                  <p className="text-xs text-purple-600">Налаштовано</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-pink-50 to-red-50 border-pink-200 hover:border-pink-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Модулів</p>
                  <p className="text-3xl font-bold text-pink-900 mb-1">{modules?.length || 0}</p>
                  <p className="text-xs text-pink-600">Активних</p>
                </div>
                <div className="p-3 bg-pink-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Системні ролі</p>
                  <p className="text-3xl font-bold text-blue-900 mb-1">{roles?.filter(r => r.isSystemRole).length || 0}</p>
                  <p className="text-xs text-blue-600">Захищених</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full group-hover:rotate-12 transition-transform duration-300">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Ролі</TabsTrigger>
          <TabsTrigger value="permissions">Дозволи</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card>
              <CardHeader>
                <CardTitle>Список ролей</CardTitle>
                <CardDescription>
                  Виберіть роль для налаштування дозволів
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole?.id === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{role.displayName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.description || "Без опису"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={role.isSystemRole ? "secondary" : "default"}>
                            {role.isSystemRole ? "Системна" : "Користувацька"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRole(role);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Role Permissions */}
            {selectedRole && (
              <Card>
                <CardHeader>
                  <CardTitle>Дозволи ролі: {selectedRole.displayName}</CardTitle>
                  <CardDescription>
                    Налаштуйте дозволи для вибраної ролі
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {rolePermissionsLoading ? (
                    <div>Завантаження дозволів...</div>
                  ) : (
                    <div className="space-y-4">
                      {systemModules.map((module) => {
                        const modulePermissions = getPermissionsByModule(module.id);
                        const { total, granted } = getModulePermissionsCount(module.id);
                        
                        if (modulePermissions.length === 0) return null;

                        return (
                          <div key={module.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{module.displayName}</h4>
                              <Badge variant="outline">
                                {granted}/{total}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {modulePermissions.map((permission) => {
                                const isGranted = isPermissionGranted(permission.id);
                                return (
                                  <div
                                    key={permission.id}
                                    className="flex items-center justify-between p-2 border rounded"
                                  >
                                    <div>
                                      <span className="text-sm font-medium">
                                        {permission.displayName}
                                      </span>
                                      {permission.description && (
                                        <p className="text-xs text-muted-foreground">
                                          {permission.description}
                                        </p>
                                      )}
                                    </div>
                                    <Checkbox
                                      checked={isGranted}
                                      onCheckedChange={(checked) =>
                                        handlePermissionToggle(permission.id, !!checked)
                                      }
                                      disabled={selectedRole.isSystemRole && selectedRole.name === 'super_admin'}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Всі дозволи системи</CardTitle>
              <CardDescription>
                Перегляд усіх доступних дозволів згруповані за модулями
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemModules.map((module) => {
                const modulePermissions = getPermissionsByModule(module.id);
                
                if (modulePermissions.length === 0) return null;

                return (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{module.displayName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {modulePermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="p-3 border rounded bg-card"
                        >
                          <div className="font-medium text-sm">
                            {permission.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {permission.action} • {permission.resourceType}
                          </div>
                          {permission.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Редагувати роль" : "Створити нову роль"}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Змініть параметри існуючої ролі"
                : "Заповніть форму для створення нової ролі"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва ролі</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin, manager, operator..."
                        {...field}
                        disabled={editingRole?.isSystemRole}
                      />
                    </FormControl>
                    <FormDescription>
                      Унікальна назва ролі (використовується в коді)
                    </FormDescription>
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
                      <Input
                        placeholder="Адміністратор, Менеджер, Оператор..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Назва, яка буде відображатися користувачам
                    </FormDescription>
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
                        placeholder="Опис ролі та її призначення..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRoleDialogOpen(false)}
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
    </>
  );
}