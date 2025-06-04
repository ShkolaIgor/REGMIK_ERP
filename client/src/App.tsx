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
import ProductionAnalytics from "@/pages/production-analytics";
import ProductionPlanning from "@/pages/production-planning";
import OrderedProducts from "@/pages/ordered-products";
import Scanner from "@/pages/scanner";
import SerialNumbers from "@/pages/serial-numbers";
import SerialNumberSettings from "@/pages/serial-number-settings";
import Users from "@/pages/users";
import EmailSettings from "@/pages/email-settings";
import Analytics from "@/pages/analytics";
import ProductProfitability from "@/pages/product-profitability";
import NotFound from "@/pages/not-found";

function Router() {
  // Тимчасово відключена авторизація
  // const { isAuthenticated, isLoading } = useAuth();

  // if (isLoading) {
  //   return <div className="min-h-screen flex items-center justify-center">Завантаження...</div>;
  // }

  // if (!isAuthenticated) {
  //   return (
  //     <Switch>
  //       <Route path="/forgot-password" component={ForgotPassword} />
  //       <Route path="/reset-password" component={ResetPassword} />
  //       <Route component={SimpleLogin} />
  //     </Switch>
  //   );
  // }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/production" component={Production} />
        <Route path="/orders" component={Orders} />
        <Route path="/clients" component={Clients} />
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
        <Route path="/currencies" component={Currencies} />
        <Route path="/users" component={Users} />
        <Route path="/email-settings" component={EmailSettings} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/product-profitability" component={ProductProfitability} />
        <Route path="/documents" component={() => <div className="p-6">Документи - В розробці</div>} />
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
