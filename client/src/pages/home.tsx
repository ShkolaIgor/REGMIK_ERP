import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Package, 
  Warehouse, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { user } = useAuth();
  
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const quickActions = [
    {
      title: "Товари",
      description: "Управління асортиментом",
      icon: <Package className="h-6 w-6" />,
      href: "/inventory",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Склади",
      description: "Складський облік",
      icon: <Warehouse className="h-6 w-6" />,
      href: "/warehouses",
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Виробництво",
      description: "Планування та контроль",
      icon: <BarChart3 className="h-6 w-6" />,
      href: "/production",
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Працівники",
      description: "Управління персоналом",
      icon: <Users className="h-6 w-6" />,
      href: "/workers",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const recentActivities = [
    "Створено нове замовлення #1001",
    "Оновлено технічну карту 'Виріб А'",
    "Проведено інвентаризацію складу №1",
    "Додано нового працівника в систему"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">REGMIK: ERP</h1>
                <p className="text-sm text-gray-500">Система управління виробництвом</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Вітаємо, {user?.firstName || 'Користувач'}!
          </h2>
          <p className="text-gray-600">
            Ось швидкий огляд вашої системи управління виробництвом
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-500">Всього товарів</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-medium text-gray-500">Активні замовлення</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-medium text-gray-500">Виробничі завдання</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.productionTasks}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="text-sm font-medium text-gray-500">Низькі залишки</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStockCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Швидкі дії</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          {action.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{action.title}</h4>
                          <p className="text-sm text-gray-500">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Останні дії</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-600">{activity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Інші розділи</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/bom">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Settings className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Специфікації</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/suppliers">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Постачальники</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/tech-cards">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Техкарти</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Звіти</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/production-forecasts">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Прогнозування</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/categories">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Package className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-medium">Категорії</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}