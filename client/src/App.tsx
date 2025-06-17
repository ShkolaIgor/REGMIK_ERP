import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import SimpleLogin from "@/pages/simple-login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Production from "@/pages/production";
import Orders from "@/pages/orders";
import Clients from "@/pages/clients";
import ClientContacts from "@/pages/client-contacts";
import ClientNovaPoshtaSettings from "@/pages/client-nova-poshta-settings";
import ClientDeliverySettings from "@/pages/client-delivery-settings";
import ClientMail from "@/pages/client-mail-corrected";
import Recipes from "@/pages/recipes";
import TechCards from "@/pages/tech-cards";
import BOM from "@/pages/bom";
import Categories from "@/pages/categories";
import ProductCategories from "@/pages/product-categories";
import Warehouses from "@/pages/warehouses";
import Reports from "@/pages/reports";
import AdvancedReports from "@/pages/advanced-reports";
import CostCalculations from "@/pages/cost-calculations";
import MaterialShortages from "@/pages/material-shortages";
import SupplierOrders from "@/pages/supplier-orders";
import Suppliers from "@/pages/suppliers";
import AssemblyOperations from "@/pages/assembly-operations";
import InventoryAudits from "@/pages/inventory-audits";
import Workers from "@/pages/workers";
import ProductionForecasts from "@/pages/production-forecasts";
import ForecastDetails from "@/pages/forecast-details";
import ProductionStats from "@/pages/production-stats";
import WarehouseTransfers from "@/pages/warehouse-transfers";
import Positions from "@/pages/positions";
import Departments from "@/pages/departments";
import Components from "@/pages/components";
import PackageTypes from "@/pages/package-types";
import SolderingTypes from "@/pages/soldering-types";
import Units from "@/pages/units";
import Shipments from "@/pages/shipments";
import Carriers from "@/pages/carriers";
import Manufacturing from "@/pages/manufacturing";
import Currencies from "@/pages/currencies";
import CurrencyRates from "@/pages/currency-rates";

import ProductionAnalytics from "@/pages/production-analytics";
import ProductionPlanning from "@/pages/production-planning";
import Companies from "@/pages/companies";
import OrderedProducts from "@/pages/ordered-products";
import Scanner from "@/pages/scanner";
import SerialNumbers from "@/pages/serial-numbers";
import SerialNumberSettings from "@/pages/serial-number-settings";
import Repairs from "@/pages/repairs";
import Users from "@/pages/users";
import Roles from "@/pages/roles";
import EmailSettings from "@/pages/email-settings";
import Analytics from "@/pages/analytics";
import ProductProfitability from "@/pages/product-profitability";
import Integrations from "@/pages/integrations";
import Profile from "@/pages/profile";
import DateTest from "@/pages/date-test";

import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={SimpleLogin} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={() => (
          <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">R</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">REGMIK: ERP</h1>
                    <p className="text-gray-600">Система управління виробництвом</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">📦 Склад та товари</h3>
                    <p className="text-blue-700 text-sm mb-3">Управління асортиментом та складськими залишками</p>
                    <a href="/inventory" className="text-blue-600 hover:text-blue-800 font-medium">Перейти →</a>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-semibold text-green-900 mb-2">📋 Замовлення</h3>
                    <p className="text-green-700 text-sm mb-3">Обробка та відстеження замовлень клієнтів</p>
                    <a href="/orders" className="text-green-600 hover:text-green-800 font-medium">Перейти →</a>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="font-semibold text-purple-900 mb-2">🏭 Виробництво</h3>
                    <p className="text-purple-700 text-sm mb-3">Планування та контроль виробничих процесів</p>
                    <a href="/production" className="text-purple-600 hover:text-purple-800 font-medium">Перейти →</a>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h3 className="font-semibold text-orange-900 mb-2">👥 Клієнти</h3>
                    <p className="text-orange-700 text-sm mb-3">База контактів та історія співпраці</p>
                    <a href="/clients" className="text-orange-600 hover:text-orange-800 font-medium">Перейти →</a>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="font-semibold text-red-900 mb-2">📧 Кореспонденція клієнтів</h3>
                    <p className="text-red-700 text-sm mb-3">Листування та документообіг з клієнтами</p>
                    <a href="/client-mail" className="text-red-600 hover:text-red-800 font-medium">Перейти →</a>
                  </div>
                  
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                    <h3 className="font-semibold text-teal-900 mb-2">📊 Звіти</h3>
                    <p className="text-teal-700 text-sm mb-3">Аналітика та звітність по всіх процесах</p>
                    <a href="/reports" className="text-teal-600 hover:text-teal-800 font-medium">Перейти →</a>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Додаткові модулі</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <a href="/workers" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">👷</span>
                      <span className="text-sm font-medium">Робітники</span>
                    </a>
                    <a href="/suppliers" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🏢</span>
                      <span className="text-sm font-medium">Постачальники</span>
                    </a>
                    <a href="/tech-cards" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">📝</span>
                      <span className="text-sm font-medium">Техкарти</span>
                    </a>
                    <a href="/recipes" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🧪</span>
                      <span className="text-sm font-medium">Рецепти</span>
                    </a>
                    <a href="/warehouses" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🏭</span>
                      <span className="text-sm font-medium">Склади</span>
                    </a>
                    <a href="/shipments" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🚚</span>
                      <span className="text-sm font-medium">Відвантаження</span>
                    </a>
                    <a href="/companies" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🏢</span>
                      <span className="text-sm font-medium">Компанії</span>
                    </a>
                    <a href="/repairs" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 text-center">
                      <span className="block text-2xl mb-2">🔧</span>
                      <span className="text-sm font-medium">Ремонти</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/production" component={Production} />
        <Route path="/orders" component={Orders} />
        <Route path="/clients" component={Clients} />
        <Route path="/client-contacts" component={ClientContacts} />
        <Route path="/clients/:id/nova-poshta-settings" component={ClientNovaPoshtaSettings} />
        <Route path="/clients/:id/delivery-settings" component={ClientDeliverySettings} />
        <Route path="/client-mail" component={ClientMail} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/tech-cards" component={TechCards} />
        <Route path="/bom" component={BOM} />
        <Route path="/warehouses" component={Warehouses} />
        <Route path="/reports" component={Reports} />
        <Route path="/advanced-reports" component={AdvancedReports} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/costing" component={CostCalculations} />
        <Route path="/shortage" component={MaterialShortages} />
        <Route path="/supplier-orders" component={SupplierOrders} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/assembly" component={AssemblyOperations} />
        <Route path="/inventory-audits" component={InventoryAudits} />
        <Route path="/workers" component={Workers} />
        <Route path="/production-forecasts" component={ProductionForecasts} />
        <Route path="/production-forecasts/:id" component={ForecastDetails} />
        <Route path="/production-stats" component={ProductionStats} />
        <Route path="/warehouse-transfers" component={WarehouseTransfers} />
        <Route path="/positions" component={Positions} />
        <Route path="/departments" component={Departments} />
        <Route path="/components" component={Components} />
        <Route path="/categories" component={Categories} />
        <Route path="/product-categories" component={ProductCategories} />
        <Route path="/package-types" component={PackageTypes} />
        <Route path="/soldering-types" component={SolderingTypes} />
        <Route path="/units" component={Units} />
        <Route path="/shipments" component={Shipments} />
        <Route path="/carriers" component={Carriers} />
        <Route path="/manufacturing" component={Manufacturing} />
        <Route path="/production-analytics" component={ProductionAnalytics} />
        <Route path="/production-planning" component={ProductionPlanning} />
        <Route path="/ordered-products" component={OrderedProducts} />
        <Route path="/serial-numbers" component={SerialNumbers} />
        <Route path="/serial-number-settings" component={SerialNumberSettings} />
        <Route path="/repairs" component={Repairs} />
        <Route path="/currencies" component={Currencies} />
        <Route path="/currency-rates" component={CurrencyRates} />
        <Route path="/date-test" component={DateTest} />

        <Route path="/users" component={Users} />
        <Route path="/roles" component={Roles} />
        <Route path="/email-settings" component={EmailSettings} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/companies" component={Companies} />
        <Route path="/profile" component={Profile} />

        <Route path="/analytics" component={Analytics} />
        <Route path="/product-profitability" component={ProductProfitability} />
        <Route path="/documents" component={() => <div className="p-6">Документи - В розробці</div>} />
        <Route path="/settings" component={() => <div className="p-6">Налаштування - В розробці</div>} />
        <Route path="/my-analytics" component={() => <div className="p-6">Моя статистика - В розробці</div>} />
        <Route path="/my-documents" component={() => <div className="p-6">Мої документи - В розробці</div>} />
        <Route path="/messages" component={() => <div className="p-6">Повідомлення - В розробці</div>} />
        <Route path="/notifications" component={() => <div className="p-6">Сповіщення - В розробці</div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
  }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
