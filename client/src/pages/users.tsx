import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX, Shield, Key, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLocalUserSchema, changePasswordSchema, type LocalUser, type InsertLocalUser, type ChangePassword } from "@shared/schema";
import { z } from "zod";

export default function Users() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: roles } = useQuery({
    queryKey: ["/api/roles"],
  });

  const { data: systemModules } = useQuery({
    queryKey: ["/api/system-modules"],
  });

  const { data: availableWorkers } = useQuery({
    queryKey: ["/api/users/available-workers"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertLocalUser) => {
      await apiRequest("/api/users", {
        method: "POST",
        body: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateDialog(false);
      toast({
        title: "Успіх",
        description: "Користувача створено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити користувача",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<InsertLocalUser> }) => {
      await apiRequest(`/api/users/${id}`, {
        method: "PATCH",
        body: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowEditDialog(false);
      setEditingUser(null);
      toast({
        title: "Успіх",
        description: "Користувача оновлено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити користувача",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, passwordData }: { id: number; passwordData: ChangePassword }) => {
      await apiRequest(`/api/users/${id}/change-password`, {
        method: "POST",
        body: passwordData,
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setEditingUser(null);
      toast({
        title: "Успіх",
        description: "Пароль змінено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити пароль",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успіх",
        description: "Користувача видалено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити користувача",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest(`/api/users/${id}/toggle-status`, {
        method: "PATCH",
        body: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Успіх",
        description: "Статус користувача змінено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити статус користувача",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<InsertLocalUser>({
    resolver: zodResolver(insertLocalUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "user",
      isActive: true,
      permissions: {},
    },
  });

  const editForm = useForm<Partial<InsertLocalUser>>({
    resolver: zodResolver(
      z.object({
        username: z.string().min(1, "Ім'я користувача обов'язкове"),
        email: z.string().email("Невірний формат email").optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        role: z.string().default("user"),
        isActive: z.boolean().default(true),
        permissions: z.record(z.any()).optional(),
      })
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "user",
      isActive: true,
      permissions: {},
      workerId: undefined,
    },
  });

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const filteredUsers = (users || []).filter((user: LocalUser) => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const handleEdit = (user: LocalUser) => {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      role: user.role,
      isActive: user.isActive,
      permissions: user.permissions || {},
    });
    setShowEditDialog(true);
  };

  const handleChangePassword = (user: LocalUser) => {
    setEditingUser(user);
    passwordForm.reset();
    setShowPasswordDialog(true);
  };

  const handlePermissions = (user: LocalUser) => {
    setEditingUser(user);
    setShowPermissionsDialog(true);
  };

  const onCreateSubmit = (data: InsertLocalUser) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: Partial<InsertLocalUser>) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const onPasswordSubmit = (data: ChangePassword) => {
    if (editingUser) {
      changePasswordMutation.mutate({ id: editingUser.id, passwordData: data });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "manager": return "default";
      case "user": return "secondary";
      case "viewer": return "outline";
      default: return "secondary";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Адміністратор";
      case "manager": return "Менеджер";
      case "user": return "Користувач";
      case "viewer": return "Глядач";
      default: return role;
    }
  };

  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Управління користувачами</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Створити користувача
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Створити обліковий запис для робітника</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="workerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Робітник</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value ? parseInt(value) : undefined);
                        const worker = availableWorkers?.find((w: any) => w.id === parseInt(value));
                        if (worker) {
                          createForm.setValue("email", worker.email || "");
                          createForm.setValue("username", worker.firstName && worker.lastName 
                            ? `${worker.firstName.toLowerCase()}.${worker.lastName.toLowerCase()}`
                            : "");
                        }
                      }} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Виберіть робітника" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableWorkers?.map((worker: any) => (
                            <SelectItem key={worker.id} value={worker.id.toString()}>
                              {worker.firstName} {worker.lastName}
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ім'я користувача</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Підтвердження пароля</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль в системі</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Виберіть роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Адміністратор</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="user">Користувач</SelectItem>
                          <SelectItem value="viewer">Глядач</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <FormLabel className="text-base">Активний</FormLabel>
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

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Скасувати
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Створення..." : "Створити"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фільтри */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Пошук користувачів..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Фільтр за роллю" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі ролі</SelectItem>
            <SelectItem value="admin">Адміністратор</SelectItem>
            <SelectItem value="manager">Менеджер</SelectItem>
            <SelectItem value="user">Користувач</SelectItem>
            <SelectItem value="viewer">Глядач</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список користувачів */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user: LocalUser) => (
          <Card key={user.id} className={`relative ${!user.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {user.isActive ? (
                    <UserCheck className="h-4 w-4 text-green-600" />
                  ) : (
                    <UserX className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  {user.lastLoginAt && (
                    <div className="text-xs text-muted-foreground">
                      Останній вхід: {new Date(user.lastLoginAt).toLocaleDateString('uk-UA')}
                    </div>
                  )}
                </div>
                
                {user.phone && (
                  <div className="text-xs text-muted-foreground">
                    Телефон: {user.phone}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs pt-2 border-t">
                  <div className="text-muted-foreground">
                    Створено: {new Date(user.createdAt || '').toLocaleDateString('uk-UA')}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    title="Редагувати користувача"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChangePassword(user)}
                    title="Змінити пароль"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePermissions(user)}
                    title="Налаштувати дозволи"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                    title={user.isActive ? "Деактивувати" : "Активувати"}
                  >
                    {user.isActive ? (
                      <UserX className="h-4 w-4 text-red-500" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteUserMutation.mutate(user.id)}
                    title="Видалити користувача"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Користувачі не знайдені
        </div>
      )}

      {/* Діалог редагування користувача */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Редагувати користувача</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ім'я користувача</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ім'я</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Прізвище</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Адміністратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="user">Користувач</SelectItem>
                        <SelectItem value="viewer">Глядач</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <FormLabel className="text-base">Активний</FormLabel>
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Діалог зміни пароля */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Змінити пароль</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Поточний пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Новий пароль</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Підтвердження нового пароля</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending ? "Збереження..." : "Змінити пароль"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Діалог налаштування дозволів */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Налаштування дозволів доступу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Користувач: {editingUser?.firstName} {editingUser?.lastName} (@{editingUser?.username})
            </div>
            
            <div className="space-y-2">
              <Label>Доступ до модулів:</Label>
              {(systemModules || []).map((module: any) => (
                <div key={module.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Switch 
                    id={`module-${module.id}`}
                    defaultChecked={editingUser?.permissions?.[module.name] || false}
                  />
                  <Label htmlFor={`module-${module.id}`} className="flex-1">
                    {module.displayName}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {module.description}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Скасувати
              </Button>
              <Button>
                Зберегти дозволи
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}