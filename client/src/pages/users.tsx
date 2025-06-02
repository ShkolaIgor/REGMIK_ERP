import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, UserCheck, UserX, Shield, Key, Settings, Check, ChevronsUpDown, Mail, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLocalUserSchema, adminResetPasswordSchema, type LocalUser, type InsertLocalUser, type AdminResetPassword } from "@shared/schema";
import { z } from "zod";

export default function Users() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<LocalUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openWorkerCombobox, setOpenWorkerCombobox] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
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

  // Function to generate username from worker name
  // Функція транслітерації українського тексту
  const transliterateText = (text: string): string => {
    const translitMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 
      'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 
      'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 
      'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 
      'ю': 'iu', 'я': 'ia', "ʼ": "",
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ie',
      'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'I', 'Й': 'I', 'К': 'K', 'Л': 'L',
      'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ю': 'Iu', 'Я': 'Ia'
    };
    
    return text.split('').map(char => translitMap[char] || char).join('');
  };

  const generateUsername = (firstName: string, lastName: string) => {
    if (!firstName || !lastName) return "";
    
    // Транслітеруємо імена
    const transliteratedFirstName = transliterateText(firstName);
    const transliteratedLastName = transliterateText(lastName);
    
    // Take first letter of first name + full last name, all lowercase
    const username = `${transliteratedFirstName.charAt(0).toLowerCase()}${transliteratedLastName.toLowerCase()}`;
    return username;
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertLocalUser) => {
      await apiRequest("/api/users", {
        method: "POST",
        body: userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/available-workers"] });
      // Очищуємо форму після успішного створення
      createForm.reset({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        workerId: undefined,
        roleId: undefined,
        isActive: true,
      });
      setShowCreateDialog(false);
      toast({
        title: "Успіх",
        description: "Користувача створено успішно",
      });
    },
    onError: (error) => {
      console.log("Create user error:", error);
      const errorMessage = error.message.includes('duplicate key') && error.message.includes('email')
        ? "Користувач з таким email вже існує"
        : "Не вдалося створити користувача";
      
      toast({
        title: "Помилка",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Не закриваємо діалог при помилці, щоб користувач міг виправити дані
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      await apiRequest(`/api/users/${id}/reset-password`, {
        method: "POST",
        body: { newPassword },
      });
    },
    onSuccess: () => {
      setShowPasswordDialog(false);
      setEditingUser(null);
      passwordForm.reset();
      toast({
        title: "Успіх",
        description: "Пароль скинуто успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося скинути пароль",
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
      queryClient.invalidateQueries({ queryKey: ["/api/users/available-workers"] });
      toast({
        title: "Успіх",
        description: "Користувача видалено успішно",
      });
    },
    onError: (error) => {
      const errorMessage = error.message.includes('останнього адміністратора') 
        ? "Не можна видалити останнього адміністратора в системі"
        : "Не вдалося видалити користувача";
      
      toast({
        title: "Помилка",
        description: errorMessage,
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

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: Record<string, boolean> }) => {
      return await apiRequest(`/api/users/${id}/permissions`, {
        method: "PATCH",
        body: { permissions },
      });
    },
    onSuccess: (updatedUser) => {
      console.log("Permissions updated successfully, invalidating cache");
      console.log("Updated user from server:", updatedUser);
      
      // Оновлюємо кеш
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Закриваємо діалог та очищуємо стан
      setShowPermissionsDialog(false);
      setEditingUser(null);
      setUserPermissions({});
      
      // Показуємо успішне повідомлення
      toast({
        title: "Успіх",
        description: "Дозволи користувача оновлено успішно",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити дозволи користувача",
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

  const passwordForm = useForm<AdminResetPassword>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: {
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
    console.log("Opening permissions dialog for user:", user.id);
    console.log("User permissions from data:", user.permissions);
    setEditingUser(user);
    setUserPermissions(user.permissions || {});
    setShowPermissionsDialog(true);
  };

  const handleSavePermissions = () => {
    if (editingUser) {
      console.log("Saving permissions for user:", editingUser.id);
      console.log("Current permissions state:", userPermissions);
      updatePermissionsMutation.mutate({
        id: editingUser.id,
        permissions: userPermissions,
      });
    }
  };

  const handlePermissionChange = (moduleName: string, checked: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [moduleName]: checked,
    }));
  };

  const onCreateSubmit = (data: InsertLocalUser) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: Partial<InsertLocalUser>) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: data });
    }
  };

  const onPasswordSubmit = (data: any) => {
    if (editingUser) {
      resetPasswordMutation.mutate({ 
        id: editingUser.id, 
        newPassword: data.newPassword 
      });
    }
  };

  const handleEmailPasswordReset = async (user: LocalUser) => {
    if (!user.email) {
      toast({
        title: "Помилка",
        description: "У користувача немає електронної пошти",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest("/api/auth/send-password-reset", {
        method: "POST",
        body: { email: user.email, userId: user.id }
      });

      toast({
        title: "Успіх",
        description: `Лист для скидання паролю відправлено на ${user.email}`,
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося відправити лист для скидання паролю",
        variant: "destructive",
      });
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Робітник</FormLabel>
                      <Popover open={openWorkerCombobox} onOpenChange={setOpenWorkerCombobox}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openWorkerCombobox}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? availableWorkers?.find((worker: any) => worker.id === field.value)
                                  ? `${availableWorkers.find((worker: any) => worker.id === field.value)?.firstName} ${availableWorkers.find((worker: any) => worker.id === field.value)?.lastName}`
                                  : "Виберіть робітника"
                                : "Виберіть робітника"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Пошук робітника..." />
                            <CommandEmpty>Робітника не знайдено.</CommandEmpty>
                            <CommandGroup>
                              {availableWorkers?.map((worker: any) => (
                                <CommandItem
                                  key={worker.id}
                                  value={`${worker.firstName} ${worker.lastName}`}
                                  onSelect={() => {
                                    field.onChange(worker.id);
                                    createForm.setValue("email", worker.email || "");
                                    createForm.setValue("username", generateUsername(worker.firstName || "", worker.lastName || ""));
                                    setOpenWorkerCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === worker.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {worker.firstName} {worker.lastName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
          <Card key={user.id} className={`relative ${!user.isActive ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-4 px-6 pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  {/* Фото користувача */}
                  <div className="flex-shrink-0">
                    {user.worker?.photo ? (
                      <img
                        src={user.worker.photo}
                        alt={`${user.worker.firstName} ${user.worker.lastName}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-lg">
                          {user.worker?.firstName?.charAt(0)}{user.worker?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Інформація користувача */}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate leading-tight mb-1">
                      {user.worker?.firstName} {user.worker?.lastName}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground truncate mb-1">
                      @{user.username}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {user.isActive ? (
                    <UserCheck className="h-6 w-6 text-green-600" />
                  ) : (
                    <UserX className="h-6 w-6 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-2 px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-sm px-3 py-1">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  {user.lastLoginAt && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.lastLoginAt).toLocaleDateString('uk-UA')}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleEdit(user)}
                    className="flex-1 h-10 text-sm px-4"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="default" className="h-10 px-3">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                        <Key className="h-4 w-4 mr-2" />
                        Скинути пароль
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEmailPasswordReset(user)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Скинути через пошту
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePermissions(user)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Налаштувати дозволи
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive })}>
                        {user.isActive ? (
                          <>
                            <UserX className="h-3 w-3 mr-2" />
                            Деактивувати
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3 mr-2" />
                            Активувати
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Видалити
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <Input {...field} disabled className="bg-gray-50" />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Логін неможливо змінити
                    </div>
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
            <DialogTitle>Скинути пароль</DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Збереження..." : "Скинути пароль"}
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
              Користувач: {editingUser?.worker?.firstName} {editingUser?.worker?.lastName} (@{editingUser?.username})
            </div>
            
            {/* Групове керування */}
            <div className="flex gap-2 pb-4 border-b">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const allModules = systemModules || [];
                  const newPermissions: Record<string, boolean> = {};
                  allModules.forEach((module: any) => {
                    newPermissions[module.name] = true;
                  });
                  setUserPermissions(newPermissions);
                }}
              >
                Увімкнути всі
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUserPermissions({})}
              >
                Вимкнути всі
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Доступ до модулів:</Label>
              {(systemModules || []).map((module: any) => (
                <div key={module.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Switch 
                    id={`module-${module.id}`}
                    checked={userPermissions[module.name] || false}
                    onCheckedChange={(checked) => handlePermissionChange(module.name, checked)}
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
              <Button 
                onClick={handleSavePermissions}
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? "Збереження..." : "Зберегти дозволи"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}