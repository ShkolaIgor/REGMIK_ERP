import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Mail, Settings, Shield, Camera, Save, X, Lock, Eye, EyeOff, Edit } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profileImageUrl: user?.profileImageUrl || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Профіль успішно оновлено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка при оновленні профілю",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Пароль успішно змінено",
      });
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: error.message || "Помилка при зміні паролю",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Помилка",
          description: "Розмір файлу не повинен перевищувати 2 МБ",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({ ...prev, profileImageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      profileImageUrl: user?.profileImageUrl || ''
    });
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Помилка",
        description: "Новий пароль та підтвердження не співпадають",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Помилка", 
        description: "Новий пароль повинен містити мінімум 6 символів",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate(passwordData);
  };

  const handlePasswordCancel = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Завантаження профілю...</h2>
          <p className="text-gray-600">Зачекайте, будь ласка</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Мій профіль</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={isEditing ? formData.profileImageUrl : user.profileImageUrl || undefined} alt={user.firstName} />
                <AvatarFallback className="text-xl">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardTitle className="text-xl">
              {isEditing ? `${formData.firstName} ${formData.lastName}` : `${user.firstName} ${user.lastName}`}
            </CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {isEditing ? formData.email : user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Логін: {user.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Роль: Користувач</span>
              </div>
            </div>
            <Separator />
            {isEditing ? (
              <div className="space-y-2">
                <Button 
                  onClick={handleSave} 
                  className="w-full" 
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel} 
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Скасувати
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Редагувати профіль
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Інформація про профіль</CardTitle>
            <CardDescription>
              Перегляньте та оновіть свою особисту інформацію
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ім'я</Label>
                <Input 
                  id="firstName" 
                  value={isEditing ? formData.firstName : user.firstName} 
                  readOnly={!isEditing}
                  onChange={(e) => isEditing && setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Прізвище</Label>
                <Input 
                  id="lastName" 
                  value={isEditing ? formData.lastName : user.lastName} 
                  readOnly={!isEditing}
                  onChange={(e) => isEditing && setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email адреса</Label>
              <Input 
                id="email" 
                type="email" 
                value={isEditing ? formData.email : user.email} 
                readOnly={!isEditing}
                onChange={(e) => isEditing && setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Логін</Label>
              <Input id="username" value={user.username} readOnly />
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Налаштування безпеки
              </h3>
              
              {/* Change Password Section */}
              <div className="space-y-3">
                {!isChangingPassword ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsChangingPassword(true)}
                    className="w-full justify-start"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Змінити пароль
                  </Button>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Поточний пароль</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Введіть поточний пароль"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новий пароль</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Введіть новий пароль (мінімум 6 символів)"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Підтвердити новий пароль</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Повторіть новий пароль"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={changePasswordMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {changePasswordMutation.isPending ? "Збереження..." : "Змінити пароль"}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handlePasswordCancel}
                        disabled={changePasswordMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Скасувати
                      </Button>
                    </div>
                  </form>
                )}
                
                <Button variant="outline" disabled className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Двофакторна автентифікація
                  <span className="ml-auto text-xs text-muted-foreground">Скоро</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Остання активність</CardTitle>
          <CardDescription>
            Ваші останні дії в системі
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Вхід в систему</p>
                <p className="text-sm text-gray-600">Успішний вхід через веб-інтерфейс</p>
              </div>
              <p className="text-sm text-gray-500">Сьогодні</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Перегляд модуля "Компанії"</p>
                <p className="text-sm text-gray-600">Відкрито список компаній</p>
              </div>
              <p className="text-sm text-gray-500">10 хв тому</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Оновлення профілю</p>
                <p className="text-sm text-gray-600">Останнє оновлення інформації</p>
              </div>
              <p className="text-sm text-gray-500">1 день тому</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}