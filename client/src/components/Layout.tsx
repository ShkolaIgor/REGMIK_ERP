import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      { name: "Дашборд", href: "/dashboard", icon: LayoutDashboard }
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
      { name: "Приходи від постачальників", href: "/supplier-receipts", icon: PackageOpen },
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
      { name: "Валюти", href: "/currencies", icon: DollarSign },
      { name: "Типи документів постачальників", href: "/supplier-document-types", icon: FileText }
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

function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <Sidebar collapsible="icon" className="flex flex-col h-full group-data-[collapsible=icon]:w-16">
      <SidebarHeader className="flex-shrink-0">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center">
          <Link href="/" className="flex-1 min-w-0 group-data-[collapsible=icon]:flex-none">
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:space-x-0">
              <div className="w-8 h-8 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Box className="w-5 h-5 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4 text-white" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                <h1 className="text-lg font-semibold text-gray-900 truncate">REGMIK ERP</h1>
                <p className="text-sm text-gray-500 truncate">Система обліку</p>
              </div>
            </div>
          </Link>
          <SidebarTrigger className="h-8 w-8 flex-shrink-0 group-data-[collapsible=icon]:hidden" />
        </div>
        {/* Кнопка розгортання для згорнутого режиму */}
        <div className="group-data-[collapsible=icon]:flex hidden justify-center px-2 pb-2">
          <SidebarTrigger className="h-8 w-8" />
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto min-h-0 group-data-[collapsible=icon]:px-1">
        {navigationItems.map((section) => (
          <SidebarGroup key={section.title} className="group-data-[collapsible=icon]:space-y-1">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        title={item.name}
                        className="group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                      >
                        <Link href={item.href}>
                          <Icon className="w-4 h-4 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="flex-shrink-0">
        <div className="space-y-3">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName} />
                    <AvatarFallback className="text-xs group-data-[collapsible=icon]:text-[10px]">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
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
          
          {/* <div className="flex items-center space-x-2 text-sm px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1">
            <div className="w-2 h-2 bg-green-500 rounded-full group-data-[collapsible=icon]:w-1.5 group-data-[collapsible=icon]:h-1.5"></div>
            <span className="text-gray-600 group-data-[collapsible=icon]:hidden">ERP Ready</span>
          </div> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset>
            {/* Mobile Header with Menu Button */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
              <SidebarTrigger className="h-8 w-8" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">REGMIK ERP</h1>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              {children}
            </main>
          </SidebarInset>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
