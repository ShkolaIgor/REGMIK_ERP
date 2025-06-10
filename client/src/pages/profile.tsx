import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Settings, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

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
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName} />
                <AvatarFallback className="text-xl">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
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
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Редагувати профіль
            </Button>
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
                <Input id="firstName" value={user.firstName} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Прізвище</Label>
                <Input id="lastName" value={user.lastName} readOnly />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email адреса</Label>
              <Input id="email" type="email" value={user.email} readOnly />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Логін</Label>
              <Input id="username" value={user.username} readOnly />
            </div>

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