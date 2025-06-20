import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Scan,
  FileText,
  Cog,
  Calculator,
  AlertTriangle,
  BarChart,
  Factory,
  File,
  Users,
  Box,
  Layers,
  Truck,
  PackageOpen,
  ClipboardList,
  TrendingUp,
  Building2,
  Flame,
  BarChart3,
  Ruler,
  DollarSign,
  QrCode,
  Mail,
  Menu,
  X,
  LogOut,
  User,
  Wrench,
  Shield
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  {
    title: "Головна",
    items: [
      { name: "Дашборд", href: "/", icon: LayoutDashboard }
    ]
  },
  {
    title: "Модуль Продажі",
    items: [
      { name: "Замовлення", href: "/orders", icon: ShoppingCart },
      { name: "Листування", href: "/client-mail", icon: Mail },
      { name: "Відвантаження", href: "/shipments", icon: Truck }
    ]
  },
  {
    title: "Модуль Склад",
    items: [
      { name: "Каталог товарів", href: "/inventory", icon: Package },
      { name: "Замовлені товари", href: "/ordered-products", icon: Package },
      { name: "Замовлення постачальникам", href: "/supplier-orders", icon: Package },
      { name: "Переміщення між складами", href: "/warehouse-transfers", icon: PackageOpen },
      { name: "Інвентаризація", href: "/inventory-audits", icon: ClipboardList },
      { name: "Серійні номери", href: "/serial-numbers", icon: QrCode },
      { name: "Ремонти", href: "/repairs", icon: Wrench },
      { name: "Сканер штрих-кодів", href: "/scanner", icon: Scan }
    ]
  },
  {
    title: "Модуль Виробництво",
    items: [
      { name: "Виготовлення товарів", href: "/manufacturing", icon: Factory },
      { name: "Рецепти виробництва", href: "/recipes", icon: FileText },
      { name: "Технологічні карти", href: "/tech-cards", icon: File },
      { name: "Склад виробів (BOM)", href: "/bom", icon: Layers },
      { name: "Планування (Kanban)", href: "/production", icon: Cog },
      { name: "Збірка та розбірка", href: "/assembly", icon: PackageOpen },
      { name: "Калькуляція собівартості", href: "/costing", icon: Calculator },
      { name: "Дефіцит матеріалів", href: "/shortage", icon: AlertTriangle },
      { name: "Прогнозування виробництва", href: "/production-forecasts", icon: TrendingUp },
      { name: "Планування виробництва", href: "/production-planning", icon: Factory },
      { name: "Аналіз завантаженості", href: "/production-analytics", icon: BarChart3 }
    ]
  },
  {
    title: "Довідники",
    items: [
      { name: "Клієнти", href: "/clients", icon: Users },
      { name: "Контакти клієнтів", href: "/client-contacts", icon: Users },
      { name: "Компоненти", href: "/components", icon: Package },
      { name: "Категорії компонентів", href: "/categories", icon: Layers },
      { name: "Категорії товарів", href: "/product-categories", icon: Box },
      { name: "Типи корпусів", href: "/package-types", icon: Box },
      { name: "Типи пайки", href: "/soldering-types", icon: Flame },
      { name: "Одиниці виміру", href: "/units", icon: Ruler },
      { name: "Постачальники", href: "/suppliers", icon: Users },
      { name: "Товари", href: "/products", icon: Package },
      { name: "Робітники", href: "/workers", icon: Users },
      { name: "Посади", href: "/positions", icon: Users },
      { name: "Відділи", href: "/departments", icon: Building2 },
      { name: "Склади", href: "/warehouses", icon: Warehouse },
      { name: "Перевізники", href: "/carriers", icon: Truck },
      { name: "Валюти", href: "/currencies", icon: DollarSign }
    ]
  },
  {
    title: "Звіти",
    items: [
      { name: "Документи", href: "/documents", icon: File },
      { name: "Аналітика", href: "/analytics", icon: BarChart3 },
      { name: "Рентабельність продуктів", href: "/product-profitability", icon: DollarSign },
      { name: "Прибутковість", href: "/reports", icon: BarChart },
      { name: "Розширені звіти", href: "/advanced-reports", icon: FileText },
      { name: "Статистика виробництва", href: "/production-stats", icon: TrendingUp }
    ]
  },
  {
    title: "Адміністрування",
    items: [
      { name: "Управління користувачами", href: "/users", icon: Users },
      { name: "Ролі та дозволи", href: "/roles", icon: Shield },
      { name: "Компанії", href: "/companies", icon: Building2 },
      { name: "Налаштування email", href: "/email-settings", icon: Mail },
      { name: "Інтеграції", href: "/integrations", icon: Cog },
      { name: "Налаштування серійних номерів", href: "/serial-number-settings", icon: Cog }
    ]
  }
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isMobileMenuOpen 
          ? "fixed inset-y-0 left-0 z-50 translate-x-0" 
          : "fixed inset-y-0 left-0 z-50 -translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">REGMIK: ERP</h1>
              <p className="text-sm text-gray-500">Система обліку</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navigationItems.map((section) => (
            <div key={section.title}>
              <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 mb-2">
                <span>{section.title}</span>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "nav-item flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors",
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Status */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Мій профіль</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                  <Cog className="mr-2 h-4 w-4" />
                  <span>Налаштування</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/my-analytics'}>
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Моя статистика</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/my-documents'}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Мої документи</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/messages'}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Повідомлення</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/notifications'}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Сповіщення</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Вихід з системи</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">ERP Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
