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
import { User, Mail, Settings, Shield, Camera, Save, X } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profileImageUrl: user?.profileImageUrl || ''
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
              <h3 className="text-lg font-medium">Налаштування безпеки</h3>
              <div className="space-y-3">
                <Button variant="outline" disabled>
                  Змінити пароль
                </Button>
                <Button variant="outline" disabled>
                  Двофакторна автентифікація
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