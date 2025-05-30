import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  File,
  Users,
  Box
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
    title: "Модуль Склад",
    items: [
      { name: "Каталог товарів", href: "/inventory", icon: Package },
      { name: "Склади", href: "/warehouses", icon: Warehouse },
      { name: "Замовлення", href: "/orders", icon: ShoppingCart },
      { name: "Сканер штрих-кодів", href: "/scanner", icon: Scan }
    ]
  },
  {
    title: "Модуль Виробництво",
    items: [
      { name: "Технологічні карти", href: "/recipes", icon: FileText },
      { name: "Планування (Kanban)", href: "/production", icon: Cog },
      { name: "Калькуляція собівартості", href: "/costing", icon: Calculator },
      { name: "Дефіцит матеріалів", href: "/shortage", icon: AlertTriangle }
    ]
  },
  {
    title: "Звіти",
    items: [
      { name: "Документи", href: "/documents", icon: File },
      { name: "Прибутковість", href: "/reports", icon: BarChart },
      { name: "Постачальники", href: "/suppliers", icon: Users }
    ]
  }
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Regmik ERP</h1>
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
                      <a
                        className={cn(
                          "nav-item flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium",
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Integration Status */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Bitrix24 Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
