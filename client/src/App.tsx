import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import SimpleLogin from "@/pages/simple-login";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Production from "@/pages/production";
import Orders from "@/pages/orders";
import Recipes from "@/pages/recipes";
import TechCards from "@/pages/tech-cards";
import BOM from "@/pages/bom";
import Categories from "@/pages/categories";
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
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={SimpleLogin} />
      ) : (
        <Layout>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/production" component={Production} />
          <Route path="/orders" component={Orders} />
          <Route path="/recipes" component={Recipes} />
          <Route path="/tech-cards" component={TechCards} />
          <Route path="/bom" component={BOM} />
          <Route path="/categories" component={Categories} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/reports" component={Reports} />
          <Route path="/advanced-reports" component={AdvancedReports} />
          <Route path="/scanner" component={() => <div className="p-6">Сканер штрих-кодів - В розробці</div>} />
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
          <Route path="/package-types" component={PackageTypes} />
          <Route path="/soldering-types" component={SolderingTypes} />
          <Route path="/documents" component={() => <div className="p-6">Документи - В розробці</div>} />
        </Layout>
      )}
    </Switch>
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
